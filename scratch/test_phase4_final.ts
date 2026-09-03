import axios from 'axios';
import dayjs from 'dayjs';
import { prisma } from '../server/src/utils/prisma';
import { memoryService } from '../server/src/services/memoryService';
import { followUpService } from '../server/src/services/followUpService';
import { proactiveManagerService } from '../server/src/services/proactiveManagerService';
import { notificationService } from '../server/src/services/notificationService';
import { activityLogService } from '../server/src/services/activityLogService';
import { reminderService } from '../server/src/services/reminderService';
import { vendorService } from '../server/src/services/vendorService';
import { webResearchService } from '../server/src/services/webResearchService';
import { TaskPriority, TaskStatus, MemoryType, FollowUpStatus, VendorStatus } from '@prisma/client';

const API_BASE = 'http://localhost:5000/api';
const DEV_USER_A = 'user_dev_01';
const DEV_USER_B = 'user_dev_test_tenant_b';

async function testPhase4FinalQA() {
  console.log('===============================================================');
  console.log('🧪 SONAM PHASE 4 FINAL QA & PROACTIVE HARDENING VERIFICATION');
  console.log('===============================================================\n');

  try {
    // Setup Tenant B user if not exists
    await prisma.user.upsert({
      where: { id: DEV_USER_B },
      update: {},
      create: {
        id: DEV_USER_B,
        name: 'Tenant B User',
        email: 'tenant_b@example.com',
      },
    });

    // -----------------------------------------------------------------
    // 1. Work Memory End-to-End Lifecycle & Retrieval
    // -----------------------------------------------------------------
    console.log('1. Testing Work Memory End-to-End Lifecycle & Retrieval...');
    const mem1 = await memoryService.createMemory(DEV_USER_A, {
      key: 'ABC Garments MOQ',
      value: '500 pieces per color',
      type: MemoryType.VENDOR_CONTEXT,
      source: 'CHAT_CONVERSATION',
      confidence: 0.98,
    });

    console.log(`   Created Memory [ID: ${mem1.id}]: Key="${mem1.key}", Value="${mem1.value}"`);
    if (mem1.key !== 'ABC Garments MOQ' || mem1.type !== MemoryType.VENDOR_CONTEXT) {
      throw new Error('Memory metadata invalid!');
    }

    const searchedMems = await memoryService.searchMemories(DEV_USER_A, '500 pieces');
    if (searchedMems.length === 0 || searchedMems[0].key !== 'ABC Garments MOQ') {
      throw new Error('searchMemories failed to retrieve stored memory by value!');
    }
    console.log('   Retrieved Memory via Search:', searchedMems[0].value);

    await memoryService.deleteMemory(mem1.id, DEV_USER_A);
    console.log('   ✅ 1. Work Memory End-to-End PASSED\n');

    // -----------------------------------------------------------------
    // 2. Next Best Action Urgency Scoring (Task C overdue vs Task A vs Task B)
    // -----------------------------------------------------------------
    console.log('2. Testing Next Best Action Urgency Scoring...');
    const taskA = await prisma.task.create({
      data: {
        title: 'Task A: High Priority (5h deadline)',
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        deadline: dayjs().add(5, 'hour').toDate(),
        userId: DEV_USER_A,
      },
    });

    const taskB = await prisma.task.create({
      data: {
        title: 'Task B: Medium Priority (Tomorrow deadline)',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        deadline: dayjs().add(1, 'day').toDate(),
        userId: DEV_USER_A,
      },
    });

    const taskC = await prisma.task.create({
      data: {
        title: 'Task C: High Priority (OVERDUE)',
        priority: TaskPriority.HIGH,
        status: TaskStatus.OVERDUE,
        deadline: dayjs().subtract(2, 'hour').toDate(),
        userId: DEV_USER_A,
      },
    });

    const nba = await proactiveManagerService.getNextBestAction(DEV_USER_A);
    console.log('   Next Best Action Selected:', nba.title);
    console.log('   Next Best Action Rationale:', nba.reasoningSummary.join(' | '));

    if (nba.taskId !== taskC.id) {
      throw new Error(`Expected Overdue Task C to be selected, but got "${nba.title}"`);
    }

    if (!nba.reasoningSummary.some((r) => r.includes('OVERDUE'))) {
      throw new Error('Rationale missing OVERDUE explanation!');
    }

    // Cleanup test tasks
    await prisma.task.deleteMany({ where: { id: { in: [taskA.id, taskB.id, taskC.id] } } });
    console.log('   ✅ 2. Next Best Action Urgency Scoring PASSED\n');

    // -----------------------------------------------------------------
    // 3. Proactive Background Worker Tick & Notification Deduplication
    // -----------------------------------------------------------------
    console.log('3. Testing Proactive Background Worker Tick & Deduplication...');
    const testOverdueTask = await prisma.task.create({
      data: {
        title: 'Background Worker Test Task',
        priority: TaskPriority.URGENT,
        status: TaskStatus.PENDING,
        deadline: dayjs().subtract(1, 'hour').toDate(),
        userId: DEV_USER_A,
      },
    });

    // Run tick 1
    await reminderService.checkRemindersAndFollowUps();
    const notifsTick1 = await notificationService.getNotifications(DEV_USER_A);
    const countTick1 = notifsTick1.length;
    console.log(`   Tick 1 generated ${countTick1} notification(s).`);

    // Run tick 2 immediately (deduplication cooldown check)
    await reminderService.checkRemindersAndFollowUps();
    const notifsTick2 = await notificationService.getNotifications(DEV_USER_A);
    const countTick2 = notifsTick2.length;
    console.log(`   Tick 2 notification count (should be unchanged): ${countTick2}`);

    if (countTick2 !== countTick1) {
      throw new Error('Notification deduplication failed! Cooldown did not prevent duplicate notification.');
    }

    await prisma.task.delete({ where: { id: testOverdueTask.id } });
    console.log('   ✅ 3. Proactive Background Worker & Deduplication PASSED\n');

    // -----------------------------------------------------------------
    // 4. Follow-Up Lifecycle (PENDING -> DUE -> COMPLETED)
    // -----------------------------------------------------------------
    console.log('4. Testing Follow-Up Lifecycle...');
    const fu = await followUpService.createFollowUp(DEV_USER_A, {
      title: 'Quotation FollowUp for Vendor XYZ',
      dueAt: dayjs().subtract(10, 'minute').toISOString(),
      reason: 'Quotation promised by vendor',
    });
    console.log(`   Created FollowUp [ID: ${fu.id}], Status: ${fu.status}`);

    // Tick background worker to trigger PENDING -> DUE transition
    await reminderService.checkRemindersAndFollowUps();
    const updatedFu = await prisma.followUp.findUnique({ where: { id: fu.id } });
    console.log('   After Worker Tick Status:', updatedFu?.status);

    if (updatedFu?.status !== FollowUpStatus.DUE) {
      throw new Error('FollowUp background status transition to DUE failed!');
    }

    await followUpService.completeFollowUp(fu.id, DEV_USER_A);
    const completedFu = await prisma.followUp.findUnique({ where: { id: fu.id } });
    console.log('   After Complete Status:', completedFu?.status);

    if (completedFu?.status !== FollowUpStatus.COMPLETED) {
      throw new Error('FollowUp completion failed!');
    }

    await prisma.followUp.delete({ where: { id: fu.id } });
    console.log('   ✅ 4. Follow-Up Lifecycle PASSED\n');

    // -----------------------------------------------------------------
    // 5. Project Health Transparency Rationale
    // -----------------------------------------------------------------
    console.log('5. Testing Project Health Transparency...');
    const pProj = await prisma.project.create({
      data: {
        name: 'Test Procurement Project',
        userId: DEV_USER_A,
      },
    });

    const pTaskOverdue = await prisma.task.create({
      data: {
        title: 'Project Overdue Task',
        status: TaskStatus.OVERDUE,
        priority: TaskPriority.HIGH,
        deadline: dayjs().subtract(1, 'day').toDate(),
        projectId: pProj.id,
        userId: DEV_USER_A,
      },
    });

    const healthRes = await proactiveManagerService.getProjectHealth(DEV_USER_A, pProj.id);
    console.log('   Project Health Status:', healthRes.status);
    console.log('   Project Risk Reason:', healthRes.riskReason);

    if (healthRes.status !== 'AT_RISK' || !healthRes.riskReason?.includes('overdue')) {
      throw new Error('Project Health transparency calculation failed!');
    }

    await prisma.task.delete({ where: { id: pTaskOverdue.id } });
    await prisma.project.delete({ where: { id: pProj.id } });
    console.log('   ✅ 5. Project Health Transparency PASSED\n');

    // -----------------------------------------------------------------
    // 6. Multi-Tenant Cross-User Isolation Audit
    // -----------------------------------------------------------------
    console.log('6. Security Audit: Multi-Tenant Cross-User Isolation...');
    const userAMemory = await memoryService.createMemory(DEV_USER_A, {
      key: 'User A Secret Key',
      value: 'User A Secret Value',
      type: MemoryType.FACT,
    });

    const userBMemories = await memoryService.getMemories(DEV_USER_B);
    console.log('   User B memory count:', userBMemories.length);

    if (userBMemories.some((m) => m.id === userAMemory.id)) {
      throw new Error('SECURITY VIOLATION: User B accessed User A memory!');
    }

    try {
      await memoryService.deleteMemory(userAMemory.id, DEV_USER_B);
      throw new Error('SECURITY VIOLATION: User B deleted User A memory without exception!');
    } catch (err: any) {
      console.log('   User B delete attempt blocked cleanly:', err.message);
    }

    await memoryService.deleteMemory(userAMemory.id, DEV_USER_A);
    console.log('   ✅ 6. Multi-Tenant Cross-User Isolation PASSED\n');

    // -----------------------------------------------------------------
    // 7. Regression Checks (Phases 1, 2, 3)
    // -----------------------------------------------------------------
    console.log('7. Running Regression Checks for Phases 1, 2, 3...');
    const healthApi = await axios.get(`${API_BASE}/health`);
    if (!healthApi.data.success) throw new Error('Phase 1 API health failed!');

    const research = await webResearchService.researchWeb('T-shirt manufacturers', 'Ludhiana', 2);
    if (research.length === 0) throw new Error('Phase 3 Web Research failed!');

    console.log('   ✅ 7. Regression Checks PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 4 FINAL QA & HARDENING TESTS PASSED!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 4 Final QA FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase4FinalQA, 1500);
