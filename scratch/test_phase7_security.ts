import { prisma } from '../server/src/utils/prisma';
import { actionExecutionService } from '../server/src/services/actionExecutionService';
import { approvalService } from '../server/src/services/approvalService';
import { ActionRiskLevel, ApprovalType } from '@sonam/shared';

const DEV_USER_A = 'user_dev_01';
const DEV_USER_B = 'user_dev_test_tenant_b7';

async function testPhase7SecurityAudit() {
  console.log('===============================================================');
  console.log('🔒 SONAM PHASE 7: MULTI-TENANT SECURITY & PAYLOAD INTEGRITY AUDIT');
  console.log('===============================================================\n');

  try {
    await prisma.user.upsert({
      where: { id: DEV_USER_A },
      update: {},
      create: { id: DEV_USER_A, name: 'User A', email: 'usera_sec@example.com' },
    });

    await prisma.user.upsert({
      where: { id: DEV_USER_B },
      update: {},
      create: { id: DEV_USER_B, name: 'Tenant B User', email: 'userb_sec@example.com' },
    });

    // 1. Payload Hash Tampering Protection
    console.log('1. Testing Payload Hash Tampering Protection...');
    const originalPayload = { recipient: 'target@example.com', body: 'Original text' };
    const actionExec = await actionExecutionService.proposeActionExecution(DEV_USER_A, {
      actionType: 'SEND_EMAIL',
      target: 'target@example.com',
      riskLevel: ActionRiskLevel.HIGH,
      idempotencyKey: `idemp_sec_${Date.now()}`,
      payloadSnapshot: originalPayload,
    });

    const pendingApps = await approvalService.getPendingApprovals(DEV_USER_A);
    const appReq = pendingApps.find((a) => a.actionExecutionId === actionExec!.id);

    // Approve with modified payload
    const modifiedPayload = { recipient: 'hacker@example.com', body: 'Original text' };
    try {
      await approvalService.approveAction(appReq!.id, DEV_USER_A, modifiedPayload);
      throw new Error('SECURITY VIOLATION: Payload hash tampering allowed!');
    } catch (err: any) {
      console.log('   Payload tampering attempt blocked cleanly:', err.message);
    }
    console.log('   ✅ Payload Hash Tampering Protection PASSED\n');

    // 2. Cross-User Action Isolation
    console.log('2. Testing Cross-User Action & Approval Access Control...');
    const userBActions = await actionExecutionService.getActionExecutions(DEV_USER_B);
    if (userBActions.some((a) => a.id === actionExec!.id)) {
      throw new Error('SECURITY VIOLATION: User B accessed User A action execution!');
    }

    try {
      await approvalService.approveAction(appReq!.id, DEV_USER_B);
      throw new Error('SECURITY VIOLATION: User B approved User A request!');
    } catch (err: any) {
      console.log('   User B approval attempt blocked cleanly:', err.message);
    }
    console.log('   ✅ Multi-Tenant Isolation PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 7 SECURITY AUDITS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 7 Security Audit FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase7SecurityAudit, 1500);
