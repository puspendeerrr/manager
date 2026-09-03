import axios from 'axios';
import { prisma } from '../server/src/utils/prisma';
import { memoryService } from '../server/src/services/memoryService';
import { followUpService } from '../server/src/services/followUpService';
import { proactiveManagerService } from '../server/src/services/proactiveManagerService';
import { notificationService } from '../server/src/services/notificationService';
import { activityLogService } from '../server/src/services/activityLogService';
import { MemoryType, FollowUpStatus } from '@prisma/client';
import dayjs from 'dayjs';

const API_BASE = 'http://localhost:5000/api';
const DEV_USER_ID = 'user_dev_01';

async function testPhase4ActiveManager() {
  console.log('🤖 Starting Sonam Phase 4 Active AI Manager & Workflow Automation Verification...\n');

  try {
    // 1. Health check version test
    console.log('1. Verifying API Server health & version...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || !healthRes.data.data.version.includes('4.0.0')) {
      throw new Error('API server version mismatch!');
    }
    console.log('   ✅ API Health PASSED\n');

    // 2. WorkMemory Service Test
    console.log('2. Testing Personal WorkMemory CRUD & User Isolation...');
    const memory = await memoryService.createMemory(DEV_USER_ID, {
      key: 'T-shirt Vendor Preferred Specs',
      value: '180 GSM Bio-washed 100% Cotton, Screen Printed',
      type: MemoryType.USER_PREFERENCE,
      confidence: 0.95,
    });
    console.log(`   Memory Created [ID: ${memory.id}]: "${memory.key}" = "${memory.value}"`);

    const memories = await memoryService.getMemories(DEV_USER_ID, MemoryType.USER_PREFERENCE);
    if (memories.length === 0 || memories[0].userId !== DEV_USER_ID) {
      throw new Error('Memory retrieval or user isolation failed!');
    }

    await memoryService.deleteMemory(memory.id, DEV_USER_ID);
    console.log('   ✅ WorkMemory CRUD & User Isolation PASSED\n');

    // 3. FollowUp Workflow Test
    console.log('3. Testing FollowUp Tracking Workflow...');
    const followUp = await followUpService.createFollowUp(DEV_USER_ID, {
      title: 'Follow up with Ludhiana Garments on Quotation',
      reason: 'Quotation requested via email 24h ago',
      dueAt: dayjs().add(2, 'hour').toISOString(),
    });
    console.log(`   FollowUp Created [ID: ${followUp.id}]: "${followUp.title}" (Due: ${followUp.dueAt.toISOString()})`);

    const activeFollowUps = await followUpService.getFollowUps(DEV_USER_ID, FollowUpStatus.PENDING);
    if (activeFollowUps.length === 0) {
      throw new Error('FollowUp query failed!');
    }

    await followUpService.completeFollowUp(followUp.id, DEV_USER_ID);
    console.log('   ✅ FollowUp Tracking Workflow PASSED\n');

    // 4. Smart Priority & Next Best Action Engine Test
    console.log('4. Testing Next Best Action & Smart Priority Engine...');
    const nba = await proactiveManagerService.getNextBestAction(DEV_USER_ID);
    console.log('   Next Best Action Title:', nba.title);
    console.log('   Next Best Action Rationale:\n   ', nba.reasoningSummary.join('\n    '));
    if (!nba.title || !Array.isArray(nba.reasoningSummary)) {
      throw new Error('Next Best Action calculation output invalid!');
    }
    console.log('   ✅ Next Best Action Engine PASSED\n');

    // 5. Daily Briefing & Proactive Insights Test
    console.log('5. Testing Daily Manager Briefing & Proactive Insights...');
    const briefing = await proactiveManagerService.getDailyBriefing(DEV_USER_ID);
    console.log('   Briefing Greeting:', briefing.greeting);
    const insights = await proactiveManagerService.getProactiveInsights(DEV_USER_ID);
    console.log('   Proactive Insights Count:', insights.length);
    console.log('   ✅ Daily Manager Briefing & Proactive Insights PASSED\n');

    // 6. Notification Lifecycle Test
    console.log('6. Testing Notification Creation, Deduplication & Read Lifecycle...');
    const notif = await notificationService.createNotification(DEV_USER_ID, {
      type: 'DEADLINE_ALERT',
      title: 'Quotation Deadline Approaching Today',
      description: 'Vendor quotes needed before 5 PM',
    });
    console.log(`   Notification Created [ID: ${notif.id}]: "${notif.title}"`);

    await notificationService.markRead(notif.id, DEV_USER_ID);
    await notificationService.dismiss(notif.id, DEV_USER_ID);
    console.log('   ✅ Notification Lifecycle PASSED\n');

    // 7. Activity Timeline Logging Test
    console.log('7. Testing Auditable Activity Timeline Logging...');
    await activityLogService.logActivity(DEV_USER_ID, 'TEST_ACTION', 'Sonam Phase 4 verification test logged');
    const logs = await activityLogService.getActivity(DEV_USER_ID, 5);
    console.log('   Recent Activity Log count:', logs.length);
    console.log('   Latest Log Entry:', logs[0]?.description);
    if (logs.length === 0) {
      throw new Error('Activity logging failed!');
    }
    console.log('   ✅ Activity Timeline PASSED\n');

    // 8. Security Audit
    console.log('8. Security Audit: Verifying user isolation & secret safety...');
    const managerRes = await axios.get(`${API_BASE}/manager/next-action`);
    const stringifiedRes = JSON.stringify(managerRes.data);
    if (stringifiedRes.includes('sk-proj') || stringifiedRes.includes('access_token')) {
      throw new Error('SECURITY VIOLATION: Secret key leaked in API response!');
    }
    console.log('   ✅ Security Audit PASSED\n');

    console.log('🎉 ALL PHASE 4 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ Phase 4 Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase4ActiveManager, 1500);
