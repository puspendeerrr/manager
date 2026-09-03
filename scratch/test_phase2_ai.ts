import axios from 'axios';
import { prisma } from '../server/src/utils/prisma';
import { aiService } from '../server/src/services/aiService';
import { taskService } from '../server/src/services/taskService';
import { DeadlineSource, TaskPriority, TaskStatus } from '@prisma/client';
import dayjs from 'dayjs';

const API_BASE = 'http://localhost:5000/api';

async function testPhase2AI() {
  console.log('🤖 Starting Sonam Phase 2 AI Brain & Manager Mode Verification...\n');

  try {
    // 1. Health check version test
    console.log('1. Verifying API Server health & version...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || !healthRes.data.data.version.includes('2.0.0')) {
      throw new Error('API server version mismatch!');
    }
    console.log('   ✅ API Health PASSED\n');

    // 2. Chat API endpoint test
    console.log('2. Testing POST /api/ai/chat...');
    const chatRes = await axios.post(`${API_BASE}/ai/chat`, {
      message: 'Aaj kya important hai?',
    });
    console.log('   AI Chat response configured status:', chatRes.data.data.isAiConfigured);
    console.log('   AI Message summary snippet:\n   ', chatRes.data.data.message.substring(0, 140) + '...');
    if (chatRes.data.success !== true || typeof chatRes.data.data.message !== 'string') {
      throw new Error('Chat API invalid response payload!');
    }
    console.log('   ✅ Chat API PASSED\n');

    // 3. Natural Language Task Parsing Test
    console.log('3. Testing POST /api/ai/parse-task...');
    const parseRes = await axios.post(`${API_BASE}/ai/parse-task`, {
      text: 'Aaj 5 baje tak Ludhiana ke 5 T-shirt manufacturers ko quotation ke liye call karna hai',
    });
    console.log('   Parsed Task Output:', parseRes.data.data);
    const parsedData = parseRes.data.data;
    if (!parsedData.title || !parsedData.deadlineSource) {
      throw new Error('Task parsing structure invalid!');
    }
    console.log('   ✅ Task Parsing PASSED\n');

    // 4. Task Decomposition (splitTask) Test
    console.log('4. Testing POST /api/ai/split-task...');
    const splitRes = await axios.post(`${API_BASE}/ai/split-task`, {
      goal: 'College T-shirt procurement complete karni hai',
    });
    console.log('   Goal:', splitRes.data.data.goal);
    console.log('   Suggested Subtasks count:', splitRes.data.data.suggestedSubtasks.length);
    if (!Array.isArray(splitRes.data.data.suggestedSubtasks) || splitRes.data.data.suggestedSubtasks.length === 0) {
      throw new Error('Task decomposition subtasks missing!');
    }
    console.log('   ✅ Task Decomposition PASSED\n');

    // 5. Database deadlineSource Persistence Test
    console.log('5. Testing Task Creation with deadlineSource in PostgreSQL...');
    const testTask = await prisma.task.create({
      data: {
        title: 'Test AI Suggested Deadline Task',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        deadline: dayjs().add(3, 'hour').toDate(),
        deadlineSource: DeadlineSource.AI_SUGGESTED,
        userId: 'user_dev_01',
      },
    });
    console.log(`   Task ID: ${testTask.id}, deadlineSource in DB: ${testTask.deadlineSource}`);
    if (testTask.deadlineSource !== DeadlineSource.AI_SUGGESTED) {
      throw new Error('deadlineSource persistence failed!');
    }
    await prisma.task.delete({ where: { id: testTask.id } });
    console.log('   ✅ Database deadlineSource Persistence PASSED\n');

    // 6. Security Check: Verify OPENAI_API_KEY does not leak in API response
    console.log('6. Security Audit: Verifying API responses do not leak secrets...');
    const stringifiedRes = JSON.stringify(chatRes.data);
    if (stringifiedRes.includes('sk-proj') || stringifiedRes.includes('sk-admin') || (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10 && stringifiedRes.includes(process.env.OPENAI_API_KEY))) {
      throw new Error('SECURITY VIOLATION: Secret key leaked in API response!');
    }
    console.log('   ✅ Security Audit PASSED\n');

    console.log('🎉 ALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ Phase 2 Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(testPhase2AI, 1500);
