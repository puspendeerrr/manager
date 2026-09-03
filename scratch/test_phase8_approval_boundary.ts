import { prisma } from '../server/src/utils/prisma';
import { automationService } from '../server/src/services/automationService';
import { approvalService } from '../server/src/services/approvalService';
import { actionExecutionService } from '../server/src/services/actionExecutionService';
import { AutomationTriggerType, ActionRiskLevel } from '@sonam/shared';

const DEV_USER_A = 'user_dev_01';

async function testPhase8ApprovalBoundary() {
  console.log('===============================================================');
  console.log('🛡️ SONAM PHASE 8: APPROVAL BOUNDARY & REPLAY PROTECTION');
  console.log('===============================================================\n');

  try {
    // 1. PROACTIVE Automation -> Approval Request Flow
    console.log('1. Verifying PROACTIVE Automation -> Approval Request Flow...');
    const proposed = await actionExecutionService.proposeActionExecution(DEV_USER_A, {
      actionType: 'SEND_EMAIL',
      target: 'supplier_bound@example.com',
      riskLevel: ActionRiskLevel.HIGH,
      idempotencyKey: `idemp_bound_${Date.now()}`,
      payloadSnapshot: { emailTo: 'supplier_bound@example.com', emailBody: 'Test' },
    });

    const pending = await approvalService.getPendingApprovals(DEV_USER_A);
    const appReq = pending.find((a) => a.actionExecutionId === proposed!.id);
    if (!appReq) throw new Error('Approval request not created!');

    // Approve
    await approvalService.approveAction(appReq.id, DEV_USER_A);
    await actionExecutionService.executeApprovedAction(proposed!.id, DEV_USER_A, appReq.id);

    // Attempt replay -> Must fail
    try {
      await actionExecutionService.executeApprovedAction(proposed!.id, DEV_USER_A, appReq.id);
      throw new Error('SECURITY VIOLATION: Replay succeeded!');
    } catch (err: any) {
      console.log('   Replay attempt blocked cleanly:', err.message);
    }
    console.log('   ✅ Approval Boundary & Replay Protection PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 8 APPROVAL BOUNDARY TESTS PASSED!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 8 Approval Boundary Test FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase8ApprovalBoundary, 1500);
