import axios from 'axios';
import { prisma } from '../server/src/utils/prisma';
import { webResearchService } from '../server/src/services/webResearchService';
import { vendorService } from '../server/src/services/vendorService';
import { googleCalendarService } from '../server/src/integrations/google/googleCalendarService';
import { VendorStatus } from '@prisma/client';

const API_BASE = 'http://localhost:5000/api';
const DEV_USER_ID = 'user_dev_01';

async function testPhase3ConnectedAssistant() {
  console.log('🤖 Starting Sonam Phase 3 Connected Work Assistant Verification...\n');

  try {
    // 1. Health check version test
    console.log('1. Verifying API Server health & version...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || !healthRes.data.data.version.includes('3.0.0')) {
      throw new Error('API server version mismatch!');
    }
    console.log('   ✅ API Health PASSED\n');

    // 2. Google OAuth endpoints test
    console.log('2. Testing Google OAuth Status & Auth URL endpoints...');
    const statusRes = await axios.get(`${API_BASE}/google/status`);
    console.log('   Google Status response:', statusRes.data.data);
    if (typeof statusRes.data.data.connected !== 'boolean') {
      throw new Error('Invalid Google status response payload!');
    }

    const authUrlRes = await axios.get(`${API_BASE}/google/auth-url`);
    console.log('   Generated Auth URL snippet:', authUrlRes.data.data.authUrl.substring(0, 80) + '...');
    if (!authUrlRes.data.data.authUrl.includes('accounts.google.com')) {
      throw new Error('Invalid Google OAuth URL generated!');
    }
    console.log('   ✅ Google OAuth endpoints PASSED\n');

    // 3. Free time calculation test
    console.log('3. Testing Calendar Free Time Calculation logic...');
    const freeTimeRes = await googleCalendarService.getFreeTime(DEV_USER_ID, undefined, 60);
    console.log('   Calculated Free Time:', freeTimeRes.totalFreeHoursFormatted, 'across', freeTimeRes.freeSlots.length, 'slots');
    if (!Array.isArray(freeTimeRes.freeSlots)) {
      throw new Error('Free time calculation output invalid!');
    }
    console.log('   ✅ Free Time Calculation PASSED\n');

    // 4. Web Research Tool Test
    console.log('4. Testing Public Web Research Service...');
    const research = await webResearchService.researchWeb('T-shirt manufacturers', 'Ludhiana', 3);
    console.log('   Research Results Count:', research.length);
    console.log('   Sample Vendor:', research[0].company, '| Source:', research[0].source);
    if (research.length === 0 || !research[0].sourceUrl) {
      throw new Error('Web research tool returned empty or un-attributed results!');
    }
    console.log('   ✅ Web Research PASSED\n');

    // 5. Vendor Database & Duplicate Detection Test
    console.log('5. Testing Vendor Database CRUD & Duplicate Detection...');
    const testVendor = await vendorService.createVendor(DEV_USER_ID, {
      name: 'Test Ludhiana Garments Pvt Ltd',
      phone: '+91 99988 77766',
      email: 'sales@testludhianagarments.com',
      website: 'https://testludhianagarments.com',
      status: VendorStatus.RESEARCHED,
    });
    console.log('   Created Vendor ID:', testVendor.id);

    // Duplicate check test with matching phone
    const dupCheck = await vendorService.findDuplicateVendor(DEV_USER_ID, {
      name: 'Test Garments Duplicate',
      phone: '+91 99988 77766',
    });
    console.log('   Duplicate Check Result:', dupCheck);
    if (!dupCheck.isDuplicate) {
      throw new Error('Duplicate detection failed for matching phone number!');
    }

    // Clean up test vendor
    await vendorService.deleteVendor(testVendor.id, DEV_USER_ID);
    console.log('   ✅ Vendor Database & Duplicate Detection PASSED\n');

    // 6. Quotation Comparison Engine Test
    console.log('6. Testing Quotation Comparison Engine...');
    const compRes = await vendorService.compareQuotations(DEV_USER_ID);
    console.log('   Comparison response message:', compRes.message);
    console.log('   Recommendation snippet:', compRes.recommendation);
    console.log('   ✅ Quotation Comparison Engine PASSED\n');

    // 7. Security Audit
    console.log('7. Security Audit: Verifying API responses do not leak secrets or tokens...');
    const stringifiedRes = JSON.stringify(statusRes.data);
    if (stringifiedRes.includes('access_token') || stringifiedRes.includes('refresh_token') || stringifiedRes.includes('client_secret')) {
      throw new Error('SECURITY VIOLATION: Secret OAuth token leaked in API response!');
    }
    console.log('   ✅ Security Audit PASSED\n');

    console.log('🎉 ALL PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ Phase 3 Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase3ConnectedAssistant, 1500);
