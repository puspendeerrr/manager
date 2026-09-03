import { prisma } from '../server/src/utils/prisma';
import { automationService } from '../server/src/services/automationService';
import { AutomationTriggerType } from '@sonam/shared';

const DEV_USER_A = 'user_dev_01';

async function testPhase8Concurrency() {
  console.log('===============================================================');
  console.log('⚡ SONAM PHASE 8: CONCURRENCY & IDEMPOTENCY VERIFICATION');
  console.log('===============================================================\n');

  try {
    const rule = await automationService.createAutomation(DEV_USER_A, {
      name: 'Concurrent Rule Test',
      triggerType: AutomationTriggerType.EXECUTION_COMPLETED,
      actionConfig: { actionType: 'SEND_EMAIL' },
      cooldownMinutes: 0,
    });

    const eventId = `evt_conc_${Date.now()}`;

    console.log('1. Simulating Concurrent Worker Ticks for Same Event...');
    const [res1, res2] = await Promise.all([
      automationService.evaluateTrigger(DEV_USER_A, AutomationTriggerType.EXECUTION_COMPLETED, {}, eventId),
      automationService.evaluateTrigger(DEV_USER_A, AutomationTriggerType.EXECUTION_COMPLETED, {}, eventId),
    ]);

    const totalRuns = res1.length + res2.length;
    console.log(`   Total Automation Runs Created: ${totalRuns} (Expected: 1)`);
    if (totalRuns > 1) {
      throw new Error('CONCURRENCY VIOLATION: Duplicate automation runs created!');
    }
    console.log('   ✅ Concurrency & Idempotency PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 8 CONCURRENCY TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 8 Concurrency Test FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase8Concurrency, 1500);
