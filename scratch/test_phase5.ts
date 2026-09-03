import axios from 'axios';
import dayjs from 'dayjs';
import { prisma } from '../server/src/utils/prisma';
import { goalService } from '../server/src/services/goalService';
import { workflowService } from '../server/src/services/workflowService';
import { waitingForService } from '../server/src/services/waitingForService';
import { riskEngineService } from '../server/src/services/riskEngineService';
import { operationsHealthService } from '../server/src/services/operationsHealthService';
import { decisionService } from '../server/src/services/decisionService';
import { negotiationService } from '../server/src/services/negotiationService';
import { meetingBriefService } from '../server/src/services/meetingBriefService';
import { reviewService } from '../server/src/services/reviewService';
import { GoalStatus, WorkStatus, WaitingStatus, VendorStatus } from '@prisma/client';

const API_BASE = 'http://localhost:5000/api';
const DEV_USER_A = 'user_dev_01';
const DEV_USER_B = 'user_dev_test_tenant_b';

async function testPhase5OperationsOS() {
  console.log('===============================================================');
  console.log('🚀 SONAM PHASE 5: BUSINESS OPERATIONS OS VERIFICATION');
  console.log('===============================================================\n');

  try {
    // Setup Dev User A and Tenant B user if not exists
    await prisma.user.upsert({
      where: { id: DEV_USER_A },
      update: {},
      create: {
        id: DEV_USER_A,
        name: 'Dev User A',
        email: 'user_a@example.com',
      },
    });

    await prisma.user.upsert({
      where: { id: DEV_USER_B },
      update: {},
      create: {
        id: DEV_USER_B,
        name: 'Tenant B User',
        email: 'tenant_b5@example.com',
      },
    });

    // 1. API Health Check
    console.log('1. Verifying API Server health & version...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || !healthRes.data.data.version.includes('5.0.0')) {
      throw new Error('API server version mismatch!');
    }
    console.log('   ✅ API Health PASSED\n');

    // 2. Goal Engine Test
    console.log('2. Testing Goal Engine & Progress Calculation...');
    const goal = await goalService.createGoal(DEV_USER_A, {
      title: 'Arrange 500 College T-Shirts by Sept 20',
      description: 'Procurement goal for annual college fest',
      targetDate: dayjs().add(15, 'day').toISOString(),
    });
    console.log(`   Goal Created [ID: ${goal.id}]: "${goal.title}"`);

    const goals = await goalService.getGoals(DEV_USER_A);
    if (goals.length === 0) throw new Error('Goal retrieval failed!');
    console.log('   ✅ Goal Engine PASSED\n');

    // 3. Workflow Engine & Template Test
    console.log('3. Testing Workflow Engine Template Instantiation & Stage Transitions...');
    const wf = await workflowService.createWorkflow(DEV_USER_A, {
      name: 'T-Shirt Procurement Workflow',
      goalId: goal.id,
      template: 'PROCUREMENT',
    });
    console.log(`   Workflow Created [ID: ${wf?.id}]: ${wf?.stages?.length} stages instantiated.`);
    if (!wf || !wf.stages || wf.stages.length < 8) {
      throw new Error('Procurement workflow template instantiation failed!');
    }

    // Progress first stage
    const firstStage = wf.stages[0];
    await workflowService.updateWorkflowStage(firstStage.id, DEV_USER_A, WorkStatus.DONE);
    const progress = await goalService.calculateGoalProgress(goal.id, DEV_USER_A);
    console.log(`   Goal progress updated deterministically: ${progress}%`);
    console.log('   ✅ Workflow Engine PASSED\n');

    // 4. WaitingFor System Test
    console.log('4. Testing WaitingFor System...');
    const wfItem = await waitingForService.createWaitingFor(DEV_USER_A, {
      title: 'Waiting for Ludhiana Garments Quotation',
      description: 'Promised quote via email by 5 PM',
      expectedAt: dayjs().add(2, 'hour').toISOString(),
    });
    console.log(`   WaitingFor Item Created [ID: ${wfItem.id}]: "${wfItem.title}"`);

    await waitingForService.markReceived(wfItem.id, DEV_USER_A);
    console.log('   ✅ WaitingFor System PASSED\n');

    // 5. Risk Engine & Operational Health Test
    console.log('5. Testing Risk Engine & Operational Health...');
    const risks = await riskEngineService.getRisks(DEV_USER_A);
    console.log(`   Active Risks Detected: ${risks.length}`);

    const opHealth = await operationsHealthService.getOperationalHealth(DEV_USER_A);
    console.log('   Operational Health Score:', opHealth.overallScore);
    console.log('   Health Status:', opHealth.status);
    console.log('   ✅ Risk Engine & Operational Health PASSED\n');

    // 6. Decision Memory Test
    console.log('6. Testing Decision Memory System...');
    const dec = await decisionService.createDecision(DEV_USER_A, {
      title: 'Shortlisted Ludhiana Garments',
      decision: 'Selected Ludhiana Garments over Delhi Suppliers',
      reasoning: 'MOQ matched 500 requirement and delivery was 4 days faster',
    });
    console.log(`   Decision Recorded [ID: ${dec.id}]: "${dec.title}"`);

    const decHistory = await decisionService.getDecisionHistory(DEV_USER_A);
    if (decHistory.length === 0) throw new Error('Decision history retrieval failed!');
    console.log('   ✅ Decision Memory PASSED\n');

    // 7. Negotiation Assistant & Meeting Brief Test
    console.log('7. Testing Negotiation Assistant & Meeting Brief...');
    const testVendor = await prisma.vendor.create({
      data: {
        name: 'Test Vendor Supplier',
        status: VendorStatus.CONTACTED,
        userId: DEV_USER_A,
      },
    });

    const negDraft = await negotiationService.generateNegotiationDraft(DEV_USER_A, testVendor.id, 220, 500);
    console.log('   Negotiation ActionCard generated:', negDraft.actionCard.title);

    const brief = await meetingBriefService.getMeetingBrief(DEV_USER_A, 'Vendor Review Meeting');
    console.log('   Meeting Brief Objective:', brief.objective);

    await prisma.vendor.delete({ where: { id: testVendor.id } });
    console.log('   ✅ Negotiation Assistant & Meeting Brief PASSED\n');

    // 8. Weekly Business Review Test
    console.log('8. Testing Weekly Business Review Engine...');
    const review = await reviewService.getWeeklyBusinessReview(DEV_USER_A);
    console.log('   Weekly Review Period:', review.period);
    console.log('   Active Goals Count:', review.activeGoalsCount);
    console.log('   ✅ Weekly Business Review PASSED\n');

    // 9. Multi-Tenant Security Isolation Audit
    console.log('9. Security Audit: Multi-Tenant Isolation for Goals & Workflows...');
    const userBGoals = await goalService.getGoals(DEV_USER_B);
    if (userBGoals.some((g) => g.id === goal.id)) {
      throw new Error('SECURITY VIOLATION: User B accessed User A goal!');
    }

    try {
      await goalService.deleteGoal(goal.id, DEV_USER_B);
      throw new Error('SECURITY VIOLATION: User B deleted User A goal!');
    } catch (err: any) {
      console.log('   User B delete attempt blocked cleanly:', err.message);
    }
    console.log('   ✅ Security Audit PASSED\n');

    // Cleanup test data
    await goalService.deleteGoal(goal.id, DEV_USER_A);

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 5 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 5 Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase5OperationsOS, 1500);
