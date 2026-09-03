import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE = 'http://localhost:5000/api';

async function runQATests() {
  console.log('🧪 Starting Sonam Phase 1 Automated QA & Verification...\n');

  try {
    // 1. Health Check
    console.log('1. Testing GET /api/health...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   Health response:', healthRes.data);
    if (!healthRes.data.success || healthRes.data.data.status !== 'online') {
      throw new Error('Health check failed!');
    }
    console.log('   ✅ Health Check PASSED\n');

    // 2. Initial Data Fetching APIs
    console.log('2. Testing GET /api/tasks, /api/projects, /api/stats/dashboard-summary, /api/settings...');
    const [tasksRes, projectsRes, statsRes, settingsRes] = await Promise.all([
      axios.get(`${API_BASE}/tasks`),
      axios.get(`${API_BASE}/projects`),
      axios.get(`${API_BASE}/stats/dashboard-summary`),
      axios.get(`${API_BASE}/settings`),
    ]);

    console.log(`   Fetched ${tasksRes.data.data.length} tasks, ${projectsRes.data.data.length} projects.`);
    console.log('   Dashboard greeting:', statsRes.data.data.greeting);
    console.log('   Dashboard insight:', statsRes.data.data.sonamInsightMessage);
    console.log('   KPI Stats:', statsRes.data.data.stats);
    console.log('   ✅ Initial Data Fetching PASSED\n');

    // 3. Project Creation & Progress Verification
    console.log('3. Testing Project Creation & Progress calculations...');
    const projectRes = await axios.post(`${API_BASE}/projects`, {
      name: 'QA Test Project',
      description: 'Project created during automated QA run',
      color: '#ff4d4f',
    });
    const testProjectId = projectRes.data.data.id;
    console.log(`   Created test project: ${projectRes.data.data.name} (${testProjectId})`);

    // Verify project detail
    const projectDetailRes = await axios.get(`${API_BASE}/projects/${testProjectId}`);
    console.log(`   Project detail totalTasks: ${projectDetailRes.data.data.totalTasks}, completedTasks: ${projectDetailRes.data.data.completedTasks}`);
    if (projectDetailRes.data.data.totalTasks !== 0 || projectDetailRes.data.data.completedTasks !== 0) {
      throw new Error('Initial project counts incorrect');
    }
    console.log('   ✅ Project Creation & Initial Progress PASSED\n');

    // 4. Task Creation & Full Lifecycle (Pending -> Snoozed -> Rescheduled -> Completed)
    console.log('4. Testing Complete Task Lifecycle...');
    const taskTitle = 'Call 5 T-shirt manufacturers (QA Test)';
    const createRes = await axios.post(`${API_BASE}/tasks`, {
      title: taskTitle,
      description: 'QA lifecycle verification',
      priority: 'HIGH',
      projectId: testProjectId,
      deadline: dayjs().add(2, 'hour').toISOString(),
      reminderInterval: 'HOUR_1',
    });
    const taskId = createRes.data.data.id;
    console.log(`   Created task: "${createRes.data.data.title}" (Status: ${createRes.data.data.status})`);
    if (createRes.data.data.status !== 'PENDING') throw new Error('Task status should be PENDING');

    // Test Snooze
    console.log('   Testing Snooze (30m)...');
    const snoozeRes = await axios.post(`${API_BASE}/tasks/${taskId}/snooze`, {
      duration: '30m',
    });
    console.log(`   Snoozed task status: ${snoozeRes.data.data.status}, nextReminderAt: ${snoozeRes.data.data.nextReminderAt}`);
    if (snoozeRes.data.data.status !== 'SNOOZED' || !snoozeRes.data.data.nextReminderAt) {
      throw new Error('Snooze failed!');
    }

    // Test Reschedule
    console.log('   Testing Reschedule (Tomorrow 5:00 PM)...');
    const tomorrow5pm = dayjs().add(1, 'day').hour(17).minute(0).second(0).toISOString();
    const rescheduleRes = await axios.post(`${API_BASE}/tasks/${taskId}/reschedule`, {
      newDeadline: tomorrow5pm,
    });
    console.log(`   Rescheduled task deadline: ${rescheduleRes.data.data.deadline}, status: ${rescheduleRes.data.data.status}`);
    if (rescheduleRes.data.data.status !== 'PENDING') {
      throw new Error('Reschedule should reset status to PENDING');
    }

    // Test Complete
    console.log('   Testing Complete...');
    const completeRes = await axios.post(`${API_BASE}/tasks/${taskId}/complete`);
    console.log(`   Completed task status: ${completeRes.data.data.status}, completedAt: ${completeRes.data.data.completedAt}`);
    if (completeRes.data.data.status !== 'COMPLETED' || !completeRes.data.data.completedAt) {
      throw new Error('Completion failed');
    }

    // Verify Project Progress updated
    const updatedProjRes = await axios.get(`${API_BASE}/projects/${testProjectId}`);
    console.log(`   Updated project completedTasks: ${updatedProjRes.data.data.completedTasks} / ${updatedProjRes.data.data.totalTasks}`);
    if (updatedProjRes.data.data.completedTasks !== 1 || updatedProjRes.data.data.totalTasks !== 1) {
      throw new Error('Project progress calculation failed after task completion!');
    }
    console.log('   ✅ Complete Task Lifecycle & Project Progress Update PASSED\n');

    // 5. Deadline Handling & Dashboard Segmentation Test
    console.log('5. Testing Deadline Handling & Dashboard Segmentation...');
    // Create undated task
    const undatedRes = await axios.post(`${API_BASE}/tasks`, { title: 'Undated Task' });
    // Create overdue task
    const overdueRes = await axios.post(`${API_BASE}/tasks`, {
      title: 'Overdue Task Test',
      deadline: dayjs().subtract(3, 'hour').toISOString(),
    });
    // Create urgent task
    const urgentRes = await axios.post(`${API_BASE}/tasks`, {
      title: 'Urgent Task Test',
      priority: 'URGENT',
      deadline: dayjs().add(30, 'minute').toISOString(),
    });

    const refreshedStats = await axios.get(`${API_BASE}/stats/dashboard-summary`);
    const { doNowTasks, upcomingTasks, overdueTasks, stats } = refreshedStats.data.data;

    console.log(`   Dashboard section sizes -> DoNow: ${doNowTasks.length}, Upcoming: ${upcomingTasks.length}, Overdue: ${overdueTasks.length}`);
    console.log('   Overdue count in stats:', stats.overdueCount);
    console.log('   Urgent count in stats:', stats.urgentCount);

    if (overdueTasks.length === 0 || stats.overdueCount === 0) {
      throw new Error('Overdue task classification failed!');
    }
    if (doNowTasks.length === 0) {
      throw new Error('Do Now task classification failed!');
    }
    console.log('   ✅ Deadline Handling & Dashboard Segmentation PASSED\n');

    // 6. Validation & Error Envelope Test
    console.log('6. Testing Validation & Error Envelopes...');
    try {
      await axios.post(`${API_BASE}/tasks`, { title: '' }); // Invalid empty title
      throw new Error('Validation failed to catch empty title!');
    } catch (err: any) {
      if (err.response) {
        console.log('   Received expected validation error:', err.response.data);
        if (err.response.data.success !== false || err.response.data.error.code !== 'VALIDATION_ERROR') {
          throw new Error('Error structure mismatch!');
        }
      } else {
        throw err;
      }
    }

    try {
      await axios.get(`${API_BASE}/tasks/invalid-uuid-9999`);
      throw new Error('Non-existent task fetch failed to error');
    } catch (err: any) {
      if (err.response) {
        console.log('   Received expected 404 error:', err.response.data);
        if (err.response.data.success !== false || err.response.data.error.code !== 'NOT_FOUND') {
          throw new Error('404 Error structure mismatch!');
        }
      }
    }
    console.log('   ✅ Validation & Error Envelopes PASSED\n');

    // Cleanup QA test items
    await axios.delete(`${API_BASE}/tasks/${undatedRes.data.data.id}`);
    await axios.delete(`${API_BASE}/tasks/${overdueRes.data.data.id}`);
    await axios.delete(`${API_BASE}/tasks/${urgentRes.data.data.id}`);
    await axios.delete(`${API_BASE}/tasks/${taskId}`);
    await axios.delete(`${API_BASE}/projects/${testProjectId}`);
    console.log('   Cleaned up test data.');

    console.log('🎉 ALL AUTOMATED QA TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ QA Verification FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

// Give server 1 second to bind
setTimeout(runQATests, 1500);
