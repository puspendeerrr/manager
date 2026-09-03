import { prisma } from '../server/src/utils/prisma';
import { automationService } from '../server/src/services/automationService';
import { controlPlaneService } from '../server/src/services/controlPlaneService';
import { approvalService } from '../server/src/services/approvalService';
import { AutomationTriggerType } from '@sonam/shared';

const DEV_USER_A = 'user_dev_01';
const DEV_USER_B = 'user_dev_test_tenant_b8';

async function testPhase8SecurityAudit() {
  console.log('===============================================================');
  console.log('🔒 SONAM PHASE 8: MULTI-TENANT ISOLATION & APPROVAL GATEWAY AUDIT');
  console.log('===============================================================\n');

  try {
    await prisma.user.upsert({
      where: { id: DEV_USER_A },
      update: {},
      create: { id: DEV_USER_A, name: 'User A', email: 'usera8_sec@example.com' },
    });

    await prisma.user.upsert({
      where: { id: DEV_USER_B },
      update: {},
      create: { id: DEV_USER_B, name: 'User B Tenant', email: 'userb8_sec@example.com' },
    });

    // 1. Cross-User Automation & Control Plane Isolation
    console.log('1. Testing Cross-User Automation & Control Plane Data Isolation...');
    const userARule = await automationService.createAutomation(DEV_USER_A, {
      name: 'User A Confidential Automation',
      triggerType: AutomationTriggerType.TASK_OVERDUE,
      actionConfig: { secret: 'user_a_data' },
    });

    const userBAutomations = await automationService.getAutomations(DEV_USER_B);
    if (userBAutomations.some((a) => a.id === userARule.id)) {
      throw new Error('SECURITY VIOLATION: User B accessed User A automation rule!');
    }

    const userBSnapshot = await controlPlaneService.getControlPlaneSnapshot(DEV_USER_B);
    if (userBSnapshot.activeAutomationsCount > 0 && userBAutomations.length === 0) {
      throw new Error('SECURITY VIOLATION: User B control plane aggregated User A metrics!');
    }
    console.log('   ✅ Multi-Tenant Data Isolation PASSED\n');

    // 2. Server-side Approval Gateway Enforcement on Automations
    console.log('2. Verifying Server-side Approval Gateway Enforcement on Automations...');
    const evalResults = await automationService.evaluateTrigger(DEV_USER_A, AutomationTriggerType.TASK_OVERDUE, { target: 'external@example.com' }, `evt_sec_${Date.now()}`);
    
    if (evalResults.length > 0 && evalResults[0].result?.status === 'PENDING_CONFIRMATION') {
      console.log('   Automation action correctly generated Approval Request with status PENDING_CONFIRMATION.');
    } else {
      console.log('   Automation evaluated cleanly through approval boundary.');
    }

    const pendingApps = await approvalService.getPendingApprovals(DEV_USER_A);
    if (pendingApps.length === 0) {
      throw new Error('SECURITY VIOLATION: Automation bypassed approval creation!');
    }
    console.log('   ✅ Approval Gateway Boundary Enforcement PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 8 SECURITY AUDITS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 8 Security Audit FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase8SecurityAudit, 1500);
