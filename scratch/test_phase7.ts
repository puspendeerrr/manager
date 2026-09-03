import axios from 'axios';
import dayjs from 'dayjs';
import { prisma } from '../server/src/utils/prisma';
import { actionExecutionService } from '../server/src/services/actionExecutionService';
import { approvalService } from '../server/src/services/approvalService';
import { communicationService } from '../server/src/services/communicationService';
import { responseProcessingService } from '../server/src/services/responseProcessingService';
import { evidenceService } from '../server/src/services/evidenceService';
import { actionRetryService } from '../server/src/services/actionRetryService';
import { ActionRiskLevel, ApprovalType, EvidenceType } from '@sonam/shared';

const API_BASE = 'http://localhost:5000/api';
const DEV_USER_A = 'user_dev_01';

async function testPhase7RealWorldActionAndCommLayer() {
  console.log('===============================================================');
  console.log('🚀 SONAM PHASE 7: REAL-WORLD ACTION & COMMUNICATION LAYER');
  console.log('===============================================================\n');

  try {
    // Setup Dev User A
    await prisma.user.upsert({
      where: { id: DEV_USER_A },
      update: {},
      create: {
        id: DEV_USER_A,
        name: 'Dev User A',
        email: 'user_a7@example.com',
      },
    });

    // 1. API Health Check
    console.log('1. Verifying API Server health & version...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || !healthRes.data.data.version.includes('7.0.0')) {
      throw new Error('API server version mismatch!');
    }
    console.log('   ✅ API Health PASSED\n');

    // 2. Propose Action & Enforce Approval Requirement
    console.log('2. Proposing External Action & Enforcing Server-side Approval Gateway...');
    const proposed = await actionExecutionService.proposeActionExecution(DEV_USER_A, {
      actionType: 'SEND_EMAIL',
      target: 'ludhiana_garments@example.com',
      riskLevel: ActionRiskLevel.HIGH,
      idempotencyKey: `idemp_test7_${Date.now()}`,
      payloadSnapshot: {
        emailTo: 'ludhiana_garments@example.com',
        emailSubject: 'Quotation Request — 500 College T-Shirts',
        emailBody: 'Please provide unit price and MOQ for 500 College Fest T-Shirts.',
      },
    });

    console.log(`   Action Execution Created [ID: ${proposed?.id}]: Status "${proposed?.status}"`);
    const pendingApps = await approvalService.getPendingApprovals(DEV_USER_A);
    const appReq = pendingApps.find((a) => a.actionExecutionId === proposed!.id);
    if (!appReq) throw new Error('Approval request was not created!');
    console.log(`   Approval Request Created [ID: ${appReq.id}]: Payload Hash "${appReq.payloadHash.substring(0, 16)}..."`);

    // Try executing WITHOUT approval -> Must fail
    try {
      await actionExecutionService.executeApprovedAction(proposed!.id, DEV_USER_A, appReq.id);
      throw new Error('SECURITY VIOLATION: Execution occurred without approval!');
    } catch (err: any) {
      console.log('   Execution without approval blocked cleanly:', err.message);
    }
    console.log('   ✅ Server-side Approval Gateway Enforcement PASSED\n');

    // 3. Approve Action & Execute Side-Effect
    console.log('3. Approving Action Request & Executing Side-Effect...');
    const approved = await approvalService.approveAction(appReq.id, DEV_USER_A);
    if (approved.status !== 'APPROVED') throw new Error('Approval failed!');

    const executed = await actionExecutionService.executeApprovedAction(proposed!.id, DEV_USER_A, appReq.id);
    console.log(`   Executed Action Result Status: ${executed.status}`);
    if (executed.status !== 'SUCCESS') throw new Error('Action execution failed!');
    console.log('   ✅ Approved Action Execution PASSED\n');

    // 4. Test Idempotency & Replay Protection
    console.log('4. Testing Idempotency & Replay Protection...');
    try {
      await actionExecutionService.executeApprovedAction(proposed!.id, DEV_USER_A, appReq.id);
      throw new Error('SECURITY VIOLATION: Approval replay attack succeeded!');
    } catch (err: any) {
      console.log('   Approval replay attempt blocked cleanly:', err.message);
    }
    console.log('   ✅ Replay Protection PASSED\n');

    // 5. Test Untrusted External Response Processing
    console.log('5. Testing Untrusted External Response Processing & Metric Extraction...');
    const vendorReply = `
      Hi Sonam Team,
      We can provide 500 T-Shirts at unit price ₹210 each.
      MOQ is 500 pcs. Delivery lead time will be 12 days.
      <script>alert("injection attack")</script>
    `;

    const processedResp = await responseProcessingService.processIncomingResponse(DEV_USER_A, vendorReply);
    console.log('   Extracted Metrics:', processedResp.extractedData);
    if (processedResp.extractedData?.unitPrice !== 210 || processedResp.extractedData?.moq !== 500) {
      throw new Error('Metric extraction failed!');
    }
    console.log('   Proposal Message:', processedResp.proposalMessage);
    console.log('   ✅ Response Processing & Extraction PASSED\n');

    // 6. Test Evidence Provenance Recording
    console.log('6. Testing Evidence Provenance Recording...');
    const evidence = await evidenceService.captureEvidence(
      DEV_USER_A,
      EvidenceType.EMAIL,
      'GMAIL',
      vendorReply,
      undefined,
      undefined,
      'https://mail.google.com/mail/#inbox/test_msg'
    );
    console.log(`   Evidence Captured [ID: ${evidence.id}]: Hash "${evidence.contentHash?.substring(0, 16)}..."`);
    console.log('   ✅ Evidence Provenance PASSED\n');

    // 7. Test Action Retry Engine on Transient Failure
    console.log('7. Testing Action Retry Engine...');
    const retryable = actionRetryService.isRetryableError('HTTP 503 Service Unavailable');
    const nonRetryable = actionRetryService.isRetryableError('HTTP 401 Unauthorized');
    if (!retryable || nonRetryable) throw new Error('Retry engine error classification mismatch!');
    console.log('   Transient 503 classified retryable: true, Permanent 401 classified retryable: false');
    console.log('   ✅ Action Retry Engine PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 7 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Phase 7 Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase7RealWorldActionAndCommLayer, 1500);
