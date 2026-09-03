import { reminderService } from '../server/src/services/reminderService';
import { prisma } from '../server/src/utils/prisma';
import { ReminderState, TaskStatus, TaskPriority, ReminderInterval } from '@prisma/client';
import dayjs from 'dayjs';

async function testReminderEngine() {
  console.log('⏱️ Testing Reminder Engine State Transitions & Idempotency...\n');

  const userId = 'user_dev_01';

  // 1. Create a task due right now with a scheduled reminder in the past
  const pastTime = dayjs().subtract(5, 'minute').toDate();

  const task = await prisma.task.create({
    data: {
      title: 'Reminder Engine Idempotency Test Task',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      deadline: pastTime,
      nextReminderAt: pastTime,
      reminderInterval: ReminderInterval.MINUTES_15,
      userId,
    },
  });

  // Create initial SCHEDULED reminder
  const reminder = await prisma.taskReminder.create({
    data: {
      taskId: task.id,
      scheduledFor: pastTime,
      state: ReminderState.SCHEDULED,
    },
  });

  console.log(`1. Initial Reminder state: ${reminder.state} for scheduledFor: ${reminder.scheduledFor.toISOString()}`);

  // 2. Run reminder worker TICK 1
  console.log('2. Triggering Reminder Worker TICK 1...');
  const processed1 = await reminderService.processDueReminders();
  console.log(`   Processed count in TICK 1: ${processed1}`);

  // Check state after TICK 1
  const updatedReminder1 = await prisma.taskReminder.findUnique({ where: { id: reminder.id } });
  console.log(`   Reminder state after TICK 1: ${updatedReminder1?.state}, deliveredAt: ${updatedReminder1?.deliveredAt?.toISOString()}`);
  if (updatedReminder1?.state !== ReminderState.DELIVERED) {
    throw new Error('Reminder state should be DELIVERED after TICK 1!');
  }

  // 3. Run reminder worker TICK 2 immediately (Idempotency check)
  console.log('3. Triggering Reminder Worker TICK 2 immediately (Idempotency test)...');
  const processed2 = await reminderService.processDueReminders();
  console.log(`   Processed count in TICK 2: ${processed2}`);
  if (processed2 !== 0) {
    throw new Error('Idempotency failure! Same reminder was processed twice!');
  }

  // 4. Verify Next Recurring Reminder was created cleanly without duplicate clutter
  const allTaskReminders = await prisma.taskReminder.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`4. Total reminder records for task: ${allTaskReminders.length}`);
  allTaskReminders.forEach((r, idx) => {
    console.log(`   [${idx + 1}] ID: ${r.id}, State: ${r.state}, ScheduledFor: ${r.scheduledFor.toISOString()}`);
  });

  if (allTaskReminders.length !== 2) {
    throw new Error(`Expected 2 total reminder records (1 DELIVERED + 1 next SCHEDULED), got ${allTaskReminders.length}`);
  }

  // Clean up test data
  await prisma.taskReminder.deleteMany({ where: { taskId: task.id } });
  await prisma.task.delete({ where: { id: task.id } });

  console.log('\n✅ REMINDER ENGINE STATE TRANSITIONS & IDEMPOTENCY PASSED PERFECTLY!');
}

testReminderEngine()
  .catch((err) => {
    console.error('❌ Reminder test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
