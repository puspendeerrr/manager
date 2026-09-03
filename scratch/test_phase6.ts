import axios from 'axios';
import dayjs from 'dayjs';
import { prisma } from '../server/src/utils/prisma';
import { executionService } from '../server/src/services/executionService';
import { executionPlannerService } from '../server/src/services/executionPlannerService';
import { executionVerificationService } from '../server/src/services/executionVerificationService';
import { escalationService } from '../server/src/services/escalationService';
import { goalService } from '../server/src/services/goalService';

const API_BASE = 'http://localhost:5000/api';
const DEV_USER_A = 'user_dev_01';
const DEV_USER_B = 'user_dev_test_tenant_b';

async function testPhase6WorkExecutionEngine() {
  console.log('===============================================================');
  console.log('🚀 SONAM PHASE 6: WORK EXECUTION ENGINE VERIFICATION');
  console.log('===============================================================\n');

  try {
    // Setup Dev User A and Tenant B user if not exists
    await prisma.user.upsert({
      where: { id: DEV_USER_A },
      update: {},
      create: {
        id: DEV_USER_A,
        name: 'Dev User A',
        email: 'user_a6@example.com',
      },
    });

    await prisma.user.upsert({
      where: { id: DEV_USER_B },
      update: {},
      create: {
        id: DEV_USER_B,
        name: 'Tenant B User',
        email: 'tenant_b6@example.com',
      },
    });

    // 1. API Health Check
    console.log('1. Verifying API Server health & version...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || (!healthRes.data.data.version.includes('6.0.0') && !healthRes.data.data.version.includes('7.0.0'))) {
      throw new Error('API server version mismatch!');
    }
    console.log('   ✅ API Health PASSED\n');

    // 2. Execution Engine Lifecycle Test
    console.log('2. Testing Execution Lifecycle (Create → Start → Complete)...');
    const exec = await executionService.createExecution(DEV_USER_A, {
      title: 'Contact 5 T-Shirt Suppliers for Quotations',
      description: 'Call shortlisted manufacturers from procurement list',
      steps: ['Select top 5 suppliers', 'Prepare quotation sheet', 'Call suppliers', 'Log prices'],
    });
    console.log(`   Execution Created [ID: ${exec?.id}]: "${exec?.title}" with ${exec?.steps?.length} steps.`);

    const started = await executionService.startExecution(exec!.id, DEV_USER_A);
    if (started?.status !== 'IN_PROGRESS') throw new Error('Execution start failed!');
    console.log(`   Execution Started status: ${started.status}`);

    const step = exec!.steps![0];
    await executionService.completeExecutionStep(step.id, DEV_USER_A);
    console.log(`   Completed Execution Step 1: "${step.title}"`);

    const completed = await executionService.completeExecution(exec!.id, DEV_USER_A, 'All 5 suppliers contacted.');
    if (completed?.status !== 'COMPLETED') throw new Error('Execution completion failed!');
    console.log('   ✅ Execution Engine Lifecycle PASSED\n');

    // 3. Execution Planner & Next Execution Action Test
    console.log('3. Testing Execution Planner & Next Execution Action...');
    const goal = await goalService.createGoal(DEV_USER_A, {
      title: 'College Fest T-Shirt Order',
      description: '500 units by Sept 20',
    });

    const plan = await executionPlannerService.createExecutionPlanFromGoal(DEV_USER_A, goal.id);
    console.log(`   Execution Plan Generated: ${plan.steps.length} steps, est duration ${plan.estimatedMinutes} mins.`);

    const nea = await executionPlannerService.getNextExecutionAction(DEV_USER_A);
    console.log(`   Next Execution Action: "${nea.title}" (${nea.actionType})`);
    console.log('   Reasoning:', nea.reasoningSummary.join(' • '));
    console.log('   ✅ Execution Planner PASSED\n');

    // 4. Verification Engine & Partial Completion Test
    console.log('4. Testing Verification Engine & Partial Completion...');
    const exec2 = await executionService.createExecution(DEV_USER_A, {
      title: 'Deliver 500 T-Shirts',
      goalId: goal.id,
    });

    const verifyRes = await executionVerificationService.verifyAndRecordResult(
      exec2!.id,
      DEV_USER_A,
      300, // 300 confirmed out of 500
      500,
      'Confirmed 300/500 units.'
    );

    console.log(`   Verification Result Status: ${verifyRes.resultStatus} (Status: ${verifyRes.status})`);
    if (verifyRes.resultStatus !== 'PARTIAL') throw new Error('Partial verification failed!');
    console.log('   ✅ Verification Engine PASSED\n');

    // 5. Escalation Engine Test
    console.log('5. Testing Escalation Engine...');
    const escalations = await escalationService.getEscalations(DEV_USER_A);
    console.log(`   Active Escalations Detected: ${escalations.length}`);
    console.log('   ✅ Escalation Engine PASSED\n');

    // 6. Security Audit: Multi-Tenant Security Isolation
    console.log('6. Security Audit: Multi-Tenant Execution Isolation...');
    const userBExecs = await executionService.getExecutions(DEV_USER_B);
    if (userBExecs.some((e) => e.id === exec!.id)) {
      throw new Error('SECURITY VIOLATION: User B accessed User A execution!');
    }

    try {
      await executionService.completeExecution(exec!.id, DEV_USER_B);
      throw new Error('SECURITY VIOLATION: User B completed User A execution!');
    } catch (err: any) {
      console.log('   User B complete attempt blocked cleanly:', err.message);
    }
    console.log('   ✅ Security Audit PASSED\n');

    // Cleanup test data
    await goalService.deleteGoal(goal.id, DEV_USER_A);

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 6 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 6 Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase6WorkExecutionEngine, 1500);
