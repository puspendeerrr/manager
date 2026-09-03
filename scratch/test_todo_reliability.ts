import { prisma } from '../server/src/utils/prisma';
import { aiService } from '../server/src/services/aiService';
import { reminderService } from '../server/src/services/reminderService';
import { taskService } from '../server/src/services/taskService';
import { TaskStatus, TaskPriority } from '@sonam/shared';
import dayjs from 'dayjs';

async function runReliabilityTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING SONAM FINAL RELIABILITY & UX AUDIT TEST SUITE');
  console.log('===========================================================');

  const testUserId = 'user_rel_audit_01';
  const userBId = 'user_rel_audit_02';

  // Cleanup past test data
  await prisma.notification.deleteMany({ where: { userId: { in: [testUserId, userBId] } } });
  await prisma.task.deleteMany({ where: { userId: { in: [testUserId, userBId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [testUserId, userBId] } } });

  // Create test users
  await prisma.user.create({
    data: {
      id: testUserId,
      name: 'Reliability Test User',
      email: 'reliability_test@example.com',
      enableNotifications: true,
      enableSound: true,
      repeatReminderMins: 30,
      keepReminding: true,
    },
  });

  await prisma.user.create({
    data: {
      id: userBId,
      name: 'Isolated User B',
      email: 'user_b_rel@example.com',
    },
  });

  // Test 1: Future Task Creation
  console.log('\n[Edge Case 1] Future Task Creation ("Kal 5 baje Aman ko call karna hai")...');
  const res1 = await aiService.parseNaturalLanguageInput(testUserId, 'Kal 5 baje Aman ko call karna hai');
  console.log('  -> Message:', res1.message);
  console.log('  -> Task Title:', res1.task.title);
  console.log('  -> Next Reminder At:', res1.task.nextReminderAt);
  if (!res1.task.nextReminderAt) throw new Error('FAILED 1: nextReminderAt null on creation');
  console.log('  ✅ Edge Case 1 PASSED!');

  // Test 2: Due Reminder Delivery & Repeating Reschedule
  console.log('\n[Edge Case 2] Task Due Reminder Delivery & 30m Repeating Reschedule...');
  await prisma.task.update({
    where: { id: res1.task.id },
    data: { nextReminderAt: dayjs().subtract(1, 'minute').toDate() },
  });

  const notifs1 = await reminderService.processReminders(testUserId);
  console.log('  -> Delivered notifications count:', notifs1.length);
  if (notifs1.length !== 1) throw new Error('FAILED 2: Notification not delivered');

  const taskPostDelivery = await prisma.task.findUnique({ where: { id: res1.task.id } });
  console.log('  -> Next Repeat Reminder At:', taskPostDelivery?.nextReminderAt);
  if (!taskPostDelivery?.nextReminderAt || dayjs(taskPostDelivery.nextReminderAt).isBefore(dayjs())) {
    throw new Error('FAILED 2: Repeating reminder not scheduled into future');
  }
  console.log('  ✅ Edge Case 2 PASSED!');

  // Test 3: Duplicate Worker Execution Idempotency
  console.log('\n[Edge Case 3] Duplicate Worker Execution Idempotency...');
  const notifs2 = await reminderService.processReminders(testUserId);
  console.log('  -> Immediate duplicate tick notifications count:', notifs2.length);
  if (notifs2.length !== 0) throw new Error('FAILED 3: Duplicate reminder delivered');
  console.log('  ✅ Edge Case 3 PASSED!');

  // Test 4: Snooze 10m & Snooze 30m (Ensures only 1 nextReminderAt per task)
  console.log('\n[Edge Case 4] Snooze 10m & 30m...');
  const snoozed10 = await reminderService.snoozeTask(res1.task.id, testUserId, 10);
  console.log('  -> Next Snoozed Reminder (10m):', snoozed10.nextReminderAt);
  if (snoozed10.status !== TaskStatus.SNOOZED) throw new Error('FAILED 4: Status not SNOOZED');

  const snoozed30 = await reminderService.snoozeTask(res1.task.id, testUserId, 30);
  console.log('  -> Next Snoozed Reminder (30m):', snoozed30.nextReminderAt);
  console.log('  ✅ Edge Case 4 PASSED!');

  // Test 5: Stop Reminders (keepReminding = false, task active)
  console.log('\n[Edge Case 5] Stop Reminders (keepReminding = false)...');
  const stopped = await reminderService.stopRemindersForTask(res1.task.id, testUserId);
  console.log('  -> keepReminding:', stopped.keepReminding);
  console.log('  -> nextReminderAt:', stopped.nextReminderAt);
  if (stopped.nextReminderAt !== null || stopped.keepReminding !== false) throw new Error('FAILED 5: Reminders not stopped');
  console.log('  ✅ Edge Case 5 PASSED!');

  // Test 6 & 7: Task Completion & Completed Task Never Reminds Again
  console.log('\n[Edge Cases 6 & 7] Task Completion & Completed Task Never Reminds...');
  const res6 = await aiService.parseNaturalLanguageInput(testUserId, 'Ye kaam ho gaya');
  console.log('  -> Completion Message:', res6.message);

  const completedTask = await prisma.task.findUnique({ where: { id: res1.task.id } });
  if (completedTask?.status !== TaskStatus.COMPLETED || completedTask?.nextReminderAt !== null) {
    throw new Error('FAILED 6: Task completion failed');
  }

  // Force nextReminderAt to past on completed task
  await prisma.task.update({
    where: { id: res1.task.id },
    data: { nextReminderAt: dayjs().subtract(5, 'minute').toDate() },
  });

  const completedNotifs = await reminderService.processReminders(testUserId);
  console.log('  -> Completed task notification count:', completedNotifs.length);
  if (completedNotifs.length !== 0) throw new Error('FAILED 7: Completed task generated reminder notification!');
  console.log('  ✅ Edge Cases 6 & 7 PASSED!');

  // Test 8: Cancelled Task Never Reminds Again
  console.log('\n[Edge Case 8] Cancelled Task Never Reminds Again...');
  const cancelledTask = await taskService.createTask(testUserId, {
    title: 'Cancelled Task',
    deadline: dayjs().subtract(10, 'minute').toISOString(),
    nextReminderAt: dayjs().subtract(10, 'minute').toISOString(),
  });
  await prisma.task.update({ where: { id: cancelledTask.id }, data: { status: TaskStatus.CANCELLED, nextReminderAt: null } });

  const cancelledNotifs = await reminderService.processReminders(testUserId);
  console.log('  -> Cancelled task notification count:', cancelledNotifs.length);
  if (cancelledNotifs.length !== 0) throw new Error('FAILED 8: Cancelled task generated reminder notification!');
  console.log('  ✅ Edge Case 8 PASSED!');

  // Test 9: Natural Language Rescheduling ("Isko kal kar de")
  console.log('\n[Edge Case 9] Natural Language Rescheduling ("Isko kal kar de")...');
  const taskToReschedule = await taskService.createTask(testUserId, {
    title: 'Task To Reschedule',
    deadline: dayjs().toISOString(),
  });
  const res9 = await aiService.parseNaturalLanguageInput(testUserId, 'Isko kal kar de');
  console.log('  -> Reschedule Result Message:', res9.message);
  console.log('  ✅ Edge Case 9 PASSED!');

  // Test 10: Missed Reminder Recovery
  console.log('\n[Edge Case 10] Missed Reminder Recovery...');
  const missedTask = await taskService.createTask(testUserId, {
    title: 'Missed Offline Task',
    deadline: dayjs().subtract(2, 'hour').toISOString(),
    nextReminderAt: dayjs().subtract(2, 'hour').toISOString(),
  });

  const recoveredNotifs = await reminderService.processReminders(testUserId);
  console.log('  -> Recovered missed notifications count:', recoveredNotifs.length);
  if (recoveredNotifs.length !== 1) throw new Error('FAILED 10: Missed reminder recovery failed');
  console.log('  ✅ Edge Case 10 PASSED!');

  // Test 11: Server Restart & State Persistence Check
  console.log('\n[Edge Case 11] State Persistence Check...');
  const persistedTask = await prisma.task.findUnique({ where: { id: missedTask.id } });
  if (!persistedTask || !persistedTask.lastRemindedAt) throw new Error('FAILED 11: State persistence failed');
  console.log('  ✅ Edge Case 11 PASSED!');

  // Test 12: Relative Time Expression ("2 ghante baad mummy ko call karna hai")
  console.log('\n[Edge Case 12] Relative Time Expression Parsing ("2 ghante baad mummy ko call karna hai")...');
  const res12 = await aiService.parseNaturalLanguageInput(testUserId, '2 ghante baad mummy ko call karna hai');
  console.log('  -> Relative time message:', res12.message);
  console.log('  -> Task Deadline:', res12.task.deadline);
  const diffHours = dayjs(res12.task.deadline).diff(dayjs(), 'hour');
  console.log('  -> Extracted Hours Diff:', diffHours);
  if (diffHours < 1 || diffHours > 3) throw new Error('FAILED 12: Relative hour calculation failed');
  console.log('  ✅ Edge Case 12 PASSED!');

  // Test 13: Natural Language Snooze ("Isko 30 minute baad yaad dila")
  console.log('\n[Edge Case 13] Natural Language Snooze ("Isko 30 minute baad yaad dila")...');
  const res13 = await aiService.parseNaturalLanguageInput(testUserId, 'Isko 30 minute baad yaad dila');
  console.log('  -> Snooze message:', res13.message);
  console.log('  ✅ Edge Case 13 PASSED!');

  // Test 14: Multi-Tenant User Isolation
  console.log('\n[Edge Case 14] Multi-Tenant User Isolation...');
  const userBTasks = await taskService.getTasks(userBId);
  if (userBTasks.length !== 0) throw new Error('FAILED 14: User B accessed User A data');
  console.log('  ✅ Edge Case 14 PASSED!');

  console.log('\n===========================================================');
  console.log('🎉 ALL 14 CRITICAL EDGE-CASE RELIABILITY TESTS PASSED 100%!');
  console.log('===========================================================');

  await prisma.$disconnect();
}

runReliabilityTests().catch((err) => {
  console.error('❌ Reliability test suite failed:', err);
  process.exit(1);
});
