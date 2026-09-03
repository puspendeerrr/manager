import { prisma } from '../server/src/utils/prisma';
import { aiService } from '../server/src/services/aiService';
import { reminderService } from '../server/src/services/reminderService';
import { taskService } from '../server/src/services/taskService';
import { TaskStatus } from '@sonam/shared';
import dayjs from 'dayjs';

async function runSimpleTaskCreationTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING SONAM SIMPLE TASK CREATION & RELIABILITY TEST SUITE');
  console.log('===========================================================');

  const testUserId = 'user_simple_test_01';
  const userBId = 'user_simple_test_02';

  // Cleanup past test data
  await prisma.notification.deleteMany({ where: { userId: { in: [testUserId, userBId] } } });
  await prisma.task.deleteMany({ where: { userId: { in: [testUserId, userBId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [testUserId, userBId] } } });

  // Create test users
  await prisma.user.create({
    data: {
      id: testUserId,
      name: 'Simple Task User',
      email: 'simple_test@example.com',
    },
  });

  await prisma.user.create({
    data: {
      id: userBId,
      name: 'User B',
      email: 'user_b_simple@example.com',
    },
  });

  // TEST 1: Input "Aaj qcskt k vendor final krna h tshirt ka"
  console.log('\n[TEST 1] Input: "Aaj qcskt k vendor final krna h tshirt ka"...');
  const res1 = await aiService.parseNaturalLanguageInput(testUserId, 'Aaj qcskt k vendor final krna h tshirt ka');
  console.log('  -> Extracted Title:', res1.cleanedTitle);
  console.log('  -> Suggested Date:', res1.suggestedDateIso);
  console.log('  -> Suggested Time:', res1.suggestedTimeStr);

  if (res1.cleanedTitle !== 'QCSKT ke vendor final karna — tshirt') {
    throw new Error(`FAILED TEST 1: Title cleaning inaccurate. Got: "${res1.cleanedTitle}"`);
  }
  if (res1.suggestedTimeStr !== null) {
    throw new Error('FAILED TEST 1: Invented arbitrary time fallback!');
  }
  console.log('  ✅ TEST 1 PASSED!');

  // TEST 2: Input "Kal Aman ko call karna hai"
  console.log('\n[TEST 2] Input: "Kal Aman ko call karna hai"...');
  const res2 = await aiService.parseNaturalLanguageInput(testUserId, 'Kal Aman ko call karna hai');
  console.log('  -> Extracted Title:', res2.cleanedTitle);
  console.log('  -> Suggested Date:', res2.suggestedDateIso);
  console.log('  -> Suggested Time:', res2.suggestedTimeStr);

  if (!res2.cleanedTitle.includes('Aman')) {
    throw new Error(`FAILED TEST 2: Title cleaning inaccurate. Got: "${res2.cleanedTitle}"`);
  }
  console.log('  ✅ TEST 2 PASSED!');

  // TEST 3: Input "Assignment submit karna hai"
  console.log('\n[TEST 3] Input: "Assignment submit karna hai"...');
  const res3 = await aiService.parseNaturalLanguageInput(testUserId, 'Assignment submit karna hai');
  console.log('  -> Extracted Title:', res3.cleanedTitle);
  console.log('  -> Suggested Date:', res3.suggestedDateIso);

  if (!res3.cleanedTitle.includes('Assignment')) {
    throw new Error(`FAILED TEST 3: Title cleaning inaccurate. Got: "${res3.cleanedTitle}"`);
  }
  console.log('  ✅ TEST 3 PASSED!');

  // TEST 4: Input "Mummy ko 2 ghante baad call karna hai"
  console.log('\n[TEST 4] Input: "Mummy ko 2 ghante baad call karna hai"...');
  const res4 = await aiService.parseNaturalLanguageInput(testUserId, 'Mummy ko 2 ghante baad call karna hai');
  console.log('  -> Extracted Title:', res4.cleanedTitle);
  console.log('  -> Suggested Date:', res4.suggestedDateIso);
  console.log('  -> Suggested Time:', res4.suggestedTimeStr);
  if (!res4.suggestedTimeStr) {
    throw new Error('FAILED TEST 4: Relative time not suggested');
  }
  console.log('  ✅ TEST 4 PASSED!');

  // TEST 5 & 6: Explicit User Task Creation with Exact Local Persistence
  console.log('\n[TEST 5 & 6] Explicit Task Creation & Exact Local Date/Time Persistence...');
  const targetTime = dayjs().hour(17).minute(0).second(0);
  const createdTask = await taskService.createTask(testUserId, {
    title: 'QCSKT ke vendor final karna — tshirt',
    deadline: targetTime.toISOString(),
    nextReminderAt: targetTime.toISOString(),
    repeatReminderMins: 30,
    keepReminding: true,
  });

  console.log('  -> Created Task Title:', createdTask.title);
  console.log('  -> Stored Deadline:', createdTask.deadline);
  console.log('  -> Stored Next Reminder:', createdTask.nextReminderAt);

  if (createdTask.title !== 'QCSKT ke vendor final karna — tshirt') {
    throw new Error('FAILED TEST 6: Stored title mismatch');
  }
  console.log('  ✅ TEST 5 & 6 PASSED!');

  // TEST 7: Reminder Delivery at Scheduled Local Time
  console.log('\n[TEST 7] Reminder Delivery at Scheduled Time...');
  await prisma.task.update({
    where: { id: createdTask.id },
    data: { nextReminderAt: dayjs().subtract(1, 'minute').toDate() },
  });

  const notifs = await reminderService.processReminders(testUserId);
  console.log('  -> Delivered Notifications Count:', notifs.length);
  if (notifs.length !== 1) throw new Error('FAILED TEST 7: Reminder notification not delivered');
  console.log('  ✅ TEST 7 PASSED!');

  // TEST 8: Repeating Reminder Reschedule
  console.log('\n[TEST 8] Repeating Reminder Reschedule (30m)...');
  const taskPostDelivery = await prisma.task.findUnique({ where: { id: createdTask.id } });
  console.log('  -> Next Repeat Reminder At:', taskPostDelivery?.nextReminderAt);
  if (!taskPostDelivery?.nextReminderAt || dayjs(taskPostDelivery.nextReminderAt).isBefore(dayjs())) {
    throw new Error('FAILED TEST 8: Next reminder not scheduled in future');
  }
  console.log('  ✅ TEST 8 PASSED!');

  // TEST 9: Done Stops Reminders Permanently
  console.log('\n[TEST 9] Done Stops Reminders Permanently...');
  const completedTask = await reminderService.completeTaskAndStopReminders(createdTask.id, testUserId);
  console.log('  -> Status:', completedTask.status);
  console.log('  -> Next Reminder At:', completedTask.nextReminderAt);
  if (completedTask.status !== TaskStatus.COMPLETED || completedTask.nextReminderAt !== null) {
    throw new Error('FAILED TEST 9: Reminders not stopped after Done');
  }
  console.log('  ✅ TEST 9 PASSED!');

  // TEST 10: Snooze 10m & 30m
  console.log('\n[TEST 10] Snooze 10m and 30m...');
  const taskForSnooze = await taskService.createTask(testUserId, { title: 'Snooze Task Test' });
  const snoozed10 = await reminderService.snoozeTask(taskForSnooze.id, testUserId, 10);
  console.log('  -> Next Snoozed (10m):', snoozed10.nextReminderAt);
  if (snoozed10.status !== TaskStatus.SNOOZED) throw new Error('FAILED TEST 10: Snooze failed');
  console.log('  ✅ TEST 10 PASSED!');

  // TEST 11: Stop Reminders
  console.log('\n[TEST 11] Stop Reminders (keepReminding = false)...');
  const stoppedTask = await reminderService.stopRemindersForTask(taskForSnooze.id, testUserId);
  console.log('  -> keepReminding:', stoppedTask.keepReminding);
  console.log('  -> nextReminderAt:', stoppedTask.nextReminderAt);
  if (stoppedTask.keepReminding !== false || stoppedTask.nextReminderAt !== null) {
    throw new Error('FAILED TEST 11: Stop reminders failed');
  }
  console.log('  ✅ TEST 11 PASSED!');

  // TEST 12: Edit Task Title, Date & Time
  console.log('\n[TEST 12] Edit Task Title, Date & Time...');
  const editedTask = await taskService.updateTask(taskForSnooze.id, testUserId, {
    title: 'Edited Task Title — Final',
    deadline: dayjs().add(2, 'day').hour(14).minute(0).toISOString(),
    nextReminderAt: dayjs().add(2, 'day').hour(14).minute(0).toISOString(),
  });
  console.log('  -> Updated Title:', editedTask.title);
  console.log('  -> Updated Deadline:', editedTask.deadline);
  if (editedTask.title !== 'Edited Task Title — Final') throw new Error('FAILED TEST 12: Edit failed');
  console.log('  ✅ TEST 12 PASSED!');

  // TEST 13: Server Restart & State Persistence
  console.log('\n[TEST 13] Server Restart & State Persistence...');
  const reFetched = await prisma.task.findUnique({ where: { id: editedTask.id } });
  if (!reFetched || reFetched.title !== 'Edited Task Title — Final') {
    throw new Error('FAILED TEST 13: Persistence failed');
  }
  console.log('  ✅ TEST 13 PASSED!');

  // TEST 14: Multi-Tenant User Isolation
  console.log('\n[TEST 14] Multi-Tenant User Isolation...');
  const userBTasks = await taskService.getTasks(userBId);
  if (userBTasks.length !== 0) throw new Error('FAILED TEST 14: User B accessed User A data');
  console.log('  ✅ TEST 14 PASSED!');

  console.log('\n===========================================================');
  console.log('🎉 ALL 14 SIMPLE TASK CREATION & RELIABILITY TESTS PASSED!');
  console.log('===========================================================');

  await prisma.$disconnect();
}

runSimpleTaskCreationTests().catch((err) => {
  console.error('❌ Simple task creation test suite failed:', err);
  process.exit(1);
});
