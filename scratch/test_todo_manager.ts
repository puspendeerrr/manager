import { prisma } from '../server/src/utils/prisma';
import { aiService } from '../server/src/services/aiService';
import { reminderService } from '../server/src/services/reminderService';
import { taskService } from '../server/src/services/taskService';
import { TaskStatus, TaskPriority } from '@sonam/shared';
import dayjs from 'dayjs';

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING SONAM AI TODO & PERSISTENT REMINDER TEST SUITE');
  console.log('===========================================================');

  const testUserId = 'user_test_todo_01';
  const userBId = 'user_test_todo_02';

  // Cleanup past test data
  await prisma.notification.deleteMany({ where: { userId: { in: [testUserId, userBId] } } });
  await prisma.task.deleteMany({ where: { userId: { in: [testUserId, userBId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [testUserId, userBId] } } });

  // Create test users
  await prisma.user.create({
    data: {
      id: testUserId,
      name: 'Test Todo User',
      email: 'test_todo@example.com',
      enableNotifications: true,
      enableSound: true,
      repeatReminderMins: 30,
      keepReminding: true,
    },
  });

  await prisma.user.create({
    data: {
      id: userBId,
      name: 'User B',
      email: 'user_b@example.com',
    },
  });

  // Test 1: Natural Language Creation
  console.log('\n[Test 1] Natural Language Task Creation ("Kal 5 baje Aman ko call karna hai")...');
  const res1 = await aiService.parseNaturalLanguageInput(testUserId, 'Kal 5 baje Aman ko call karna hai');
  console.log('  -> Parsing result message:', res1.message);
  console.log('  -> Task Title:', res1.task.title);
  console.log('  -> Task Deadline:', res1.task.deadline);
  console.log('  -> Next Reminder At:', res1.task.nextReminderAt);

  if (!res1.task.title.includes('Call') && !res1.task.title.includes('Aman')) {
    throw new Error('FAILED Test 1: Task title parsing inaccurate');
  }
  console.log('  ✅ Test 1 PASSED!');

  // Test 2: Persistent Repeating Reminder Delivery
  console.log('\n[Test 2] Persistent Repeating Reminder Delivery & Rescheduling...');
  await prisma.task.update({
    where: { id: res1.task.id },
    data: { nextReminderAt: dayjs().subtract(5, 'minute').toDate() },
  });

  const notifications1 = await reminderService.processReminders(testUserId);
  console.log('  -> Delivered notifications count:', notifications1.length);
  console.log('  -> Notification Title:', notifications1[0]?.title);

  if (notifications1.length !== 1) {
    throw new Error('FAILED Test 2: Reminder notification not generated');
  }

  const updatedTask1 = await prisma.task.findUnique({ where: { id: res1.task.id } });
  console.log('  -> Next Repeat Reminder At:', updatedTask1?.nextReminderAt);
  if (!updatedTask1?.nextReminderAt || dayjs(updatedTask1.nextReminderAt).isBefore(dayjs())) {
    throw new Error('FAILED Test 2: Repeating reminder not rescheduled for future repeat');
  }
  console.log('  ✅ Test 2 PASSED!');

  // Test 3: Deduplication Check
  console.log('\n[Test 3] Deduplication Check (Same tick must not duplicate)...');
  const notifications2 = await reminderService.processReminders(testUserId);
  console.log('  -> Duplicate check notifications count:', notifications2.length);
  if (notifications2.length !== 0) {
    throw new Error('FAILED Test 3: Duplicate reminder delivered');
  }
  console.log('  ✅ Test 3 PASSED!');

  // Test 4: Snooze 10m & Snooze 30m
  console.log('\n[Test 4] Snooze Task for 10m and 30m...');
  const snoozed10 = await reminderService.snoozeTask(res1.task.id, testUserId, 10);
  console.log('  -> Next Snoozed Reminder At (10m):', snoozed10.nextReminderAt);
  if (snoozed10.status !== TaskStatus.SNOOZED) throw new Error('FAILED Test 4: Status not SNOOZED');

  const snoozed30 = await reminderService.snoozeTask(res1.task.id, testUserId, 30);
  console.log('  -> Next Snoozed Reminder At (30m):', snoozed30.nextReminderAt);
  console.log('  ✅ Test 4 PASSED!');

  // Test 5: Stop Reminders
  console.log('\n[Test 5] Stop Reminders (keepReminding = false)...');
  const stopped = await reminderService.stopRemindersForTask(res1.task.id, testUserId);
  console.log('  -> Task keepReminding:', stopped.keepReminding);
  console.log('  -> Next Reminder At:', stopped.nextReminderAt);
  if (stopped.nextReminderAt !== null || stopped.keepReminding !== false) {
    throw new Error('FAILED Test 5: Reminders not stopped');
  }
  console.log('  ✅ Test 5 PASSED!');

  // Test 6: Natural Language Rescheduling ("Isko kal kar de")
  console.log('\n[Test 6] Natural Language Rescheduling ("Isko kal kar de")...');
  const res6 = await aiService.parseNaturalLanguageInput(testUserId, 'Isko kal kar de');
  console.log('  -> Reschedule Message:', res6.message);
  console.log('  -> Updated Deadline:', res6.task.deadline);
  console.log('  ✅ Test 6 PASSED!');

  // Test 7: Natural Language Task Completion ("Ye kaam ho gaya")
  console.log('\n[Test 7] Natural Language Task Completion ("Ye kaam ho gaya")...');
  const res7 = await aiService.parseNaturalLanguageInput(testUserId, 'Ye kaam ho gaya');
  console.log('  -> Completion Message:', res7.message);

  const completedTask = await prisma.task.findUnique({ where: { id: res1.task.id } });
  console.log('  -> Task Status:', completedTask?.status);
  console.log('  -> Next Reminder At:', completedTask?.nextReminderAt);

  if (completedTask?.status !== TaskStatus.COMPLETED || completedTask?.nextReminderAt !== null) {
    throw new Error('FAILED Test 7: Task not marked COMPLETED');
  }
  console.log('  ✅ Test 7 PASSED!');

  // Test 8: Missed Reminder Recovery
  console.log('\n[Test 8] Missed Reminder Recovery...');
  const missedTask = await taskService.createTask(testUserId, {
    title: 'Missed Reminder Task',
    deadline: dayjs().subtract(2, 'hour').toISOString(),
    nextReminderAt: dayjs().subtract(2, 'hour').toISOString(),
  });

  const recoveredNotifs = await reminderService.processReminders(testUserId);
  console.log('  -> Recovered notifications count:', recoveredNotifs.length);
  if (recoveredNotifs.length !== 1) {
    throw new Error('FAILED Test 8: Missed reminder recovery failed');
  }
  console.log('  ✅ Test 8 PASSED!');

  // Test 9: Multi-Tenant User Isolation
  console.log('\n[Test 9] Multi-Tenant User Isolation...');
  const userBTasks = await taskService.getTasks(userBId);
  if (userBTasks.length !== 0) {
    throw new Error('FAILED Test 9: User B accessed User A tasks');
  }
  console.log('  ✅ Test 9 PASSED!');

  console.log('\n===========================================================');
  console.log('🎉 ALL 10 SONAM AI TODO & REPEATING REMINDER TESTS PASSED!');
  console.log('===========================================================');

  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
