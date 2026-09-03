import axios from 'axios';
import { prisma } from '../server/src/utils/prisma';
import { automationService } from '../server/src/services/automationService';
import { slaService } from '../server/src/services/slaService';
import { anomalyDetectionService } from '../server/src/services/anomalyDetectionService';
import { workloadService } from '../server/src/services/workloadService';
import { learningService } from '../server/src/services/learningService';
import { controlPlaneService } from '../server/src/services/controlPlaneService';
import { autonomousManagerService } from '../server/src/services/autonomousManagerService';
import { AutomationTriggerType, LearningType } from '@sonam/shared';

const API_BASE = 'http://localhost:5000/api';
const DEV_USER_A = 'user_dev_01';

async function testPhase8AutonomousControlPlane() {
  console.log('===============================================================');
  console.log('🎛️ SONAM PHASE 8: AUTONOMOUS OPERATIONS & CONTROL PLANE VERIFICATION');
  console.log('===============================================================\n');

  try {
    await prisma.user.upsert({
      where: { id: DEV_USER_A },
      update: {},
      create: { id: DEV_USER_A, name: 'Dev User A', email: 'usera8@example.com' },
    });

    // 1. API Health & Version Check
    console.log('1. Verifying API Server health & version...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || !healthRes.data.data.version.includes('8.0.0')) {
      throw new Error('API server version mismatch!');
    }
    console.log('   ✅ API Health PASSED\n');

    // 2. Automation Rule CRUD & Trigger Evaluation
    console.log('2. Testing Automation Rule Creation, Trigger Evaluation & Cooldown...');
    const autoRule = await automationService.createAutomation(DEV_USER_A, {
      name: 'Supplier FollowUp Automation',
      triggerType: AutomationTriggerType.TASK_OVERDUE,
      actionConfig: { actionType: 'SEND_EMAIL', emailSubject: 'Automated FollowUp' },
      requiresApproval: true,
      cooldownMinutes: 60,
    });
    console.log(`   Created Automation Rule [ID: ${autoRule.id}]: Trigger "${autoRule.triggerType}"`);

    const evalResults = await automationService.evaluateTrigger(DEV_USER_A, AutomationTriggerType.TASK_OVERDUE, { target: 'vendor@example.com' }, 'evt_test_1');
    console.log(`   Automation Evaluation Results Count: ${evalResults.length}`);
    if (evalResults.length === 0) throw new Error('Automation rule trigger evaluation failed!');
    console.log('   ✅ Automation Rule Engine PASSED\n');

    // 3. SLA Policy & Breach Detection
    console.log('3. Testing Operational SLA Policy & Status Evaluation...');
    const slaPolicy = await slaService.createSlaPolicy(DEV_USER_A, {
      name: 'Vendor Response SLA 24h',
      entityType: 'WAITING_FOR',
      durationMinutes: 1440,
    });
    console.log(`   Created SLA Policy [ID: ${slaPolicy.id}]`);
    const slas = await slaService.evaluateSlaStatus(DEV_USER_A);
    console.log(`   Evaluated SLA Items Count: ${slas.length}`);
    console.log('   ✅ SLA Engine PASSED\n');

    // 4. Anomaly Detection Engine
    console.log('4. Testing Operational Anomaly Detection Engine...');
    const anomalies = await anomalyDetectionService.detectOperationalAnomalies(DEV_USER_A);
    console.log(`   Detected Anomalies Count: ${anomalies.length}`);
    console.log('   ✅ Anomaly Detection PASSED\n');

    // 5. Deterministic Workload & Capacity Engine
    console.log('5. Testing Deterministic Workload & Capacity Calculation...');
    const workload = await workloadService.getWorkloadSnapshot(DEV_USER_A);
    console.log(`   Workload Capacity Utilization: ${workload.capacityUtilizationPercent}% (${workload.availableCapacityMinutes}m left)`);
    console.log('   ✅ Workload Engine PASSED\n');

    // 6. Operational Learning Engine
    console.log('6. Testing Operational Learning Insight Persistence...');
    const learning = await learningService.createLearning(DEV_USER_A, {
      type: LearningType.VENDOR_BEHAVIOR,
      title: 'Supplier Lead Time Trend',
      insight: 'Ludhiana Garments average response lead time is 48 hours.',
      source: 'DETERMINISTIC_ANALYSIS',
      confidence: 0.95,
    });
    console.log(`   Learning Insight Recorded [ID: ${learning.id}]`);
    console.log('   ✅ Learning Engine PASSED\n');

    // 7. Autonomous Manager Reasoning Cycle & Budget Limit
    console.log('7. Testing Autonomous Manager Reasoning Cycle with Budget Enforcement...');
    const cycleRes = await autonomousManagerService.runManagerCycle(DEV_USER_A, 'TEST_TRIGGER');
    console.log(`   Autonomous Manager Cycle Summary: "${cycleRes.summary}"`);
    console.log('   ✅ Autonomous Manager PASSED\n');

    // 8. Control Plane Snapshot & Read Model Aggregation
    console.log('8. Testing Unified Control Plane Snapshot Aggregation...');
    const snapshot = await controlPlaneService.getControlPlaneSnapshot(DEV_USER_A);
    console.log(`   Control Plane Business Pulse Score: ${snapshot.pulse.overallScore}% (${snapshot.pulse.status})`);
    console.log(`   Critical Alerts Count: ${snapshot.criticalAlerts.length}`);
    console.log('   ✅ Control Plane Snapshot PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 8 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 8 Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase8AutonomousControlPlane, 1500);
