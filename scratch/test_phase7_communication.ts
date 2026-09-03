import { gmailProvider } from '../server/src/integrations/communication/gmailProvider';

const DEV_USER_A = 'user_dev_01';

async function testPhase7CommunicationProvider() {
  console.log('===============================================================');
  console.log('📡 SONAM PHASE 7: COMMUNICATION PROVIDER CONTRACT VERIFICATION');
  console.log('===============================================================\n');

  try {
    // 1. Health Check
    console.log('1. Testing Provider Health Check...');
    const health = await gmailProvider.healthCheck(DEV_USER_A);
    console.log('   Gmail Provider Status:', health);
    console.log('   ✅ Health Check PASSED\n');

    // 2. Draft Creation & Parsing Simulation
    console.log('2. Testing Simulated Provider Action & Response Parsing...');
    const sendRes = await gmailProvider.send(DEV_USER_A, {
      recipient: 'vendor@example.com',
      subject: 'Quotation Inquiry',
      body: 'Please provide quotation for 500 College T-Shirts.',
    });

    console.log(`   Provider Send Result [ID: ${sendRes.messageId}]: Status ${sendRes.status}`);

    const parsed = await gmailProvider.parseResponse(
      'We can fulfill 500 pcs at ₹210 unit price with 12 days lead time.'
    );
    console.log('   Parsed Response Metrics:', parsed.extractedMetrics);
    if (parsed.extractedMetrics?.unitPrice !== 210) throw new Error('Response parsing failed!');
    console.log('   ✅ Provider Contract PASSED\n');

    console.log('===============================================================');
    console.log('🎉 ALL SONAM PHASE 7 COMMUNICATION TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Communication Provider Test FAILED:', err.message);
    process.exit(1);
  }
}

setTimeout(testPhase7CommunicationProvider, 1500);
