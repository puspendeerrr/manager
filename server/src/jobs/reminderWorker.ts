import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notificationService';
import { TaskStatus } from '@sonam/shared';
import dayjs from 'dayjs';

const deliveredKeys = new Set<string>();

export async function runReminderWorker() {
  console.log(`[RenderCronWorker] Starting scheduled reminder check at ${new Date().toISOString()}...`);
  const now = dayjs();

  try {
    const dueTasks = await prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE, TaskStatus.SNOOZED] },
        keepReminding: true,
        nextReminderAt: { lte: now.toDate() },
      },
      include: { user: true },
    });

    console.log(`[RenderCronWorker] Found ${dueTasks.length} active due task(s).`);

    let processedCount = 0;

    for (const task of dueTasks) {
      const reminderTimeStr = task.nextReminderAt
        ? dayjs(task.nextReminderAt).format('YYYY-MM-DD-HH:mm')
        : now.format('YYYY-MM-DD-HH:mm');

      // Idempotency key to prevent duplicate delivery in retry/race executions
      const idempotencyKey = `${task.userId}_${task.id}_${reminderTimeStr}`;

      if (deliveredKeys.has(idempotencyKey)) {
        console.log(`[RenderCronWorker] Skipping duplicate execution key: ${idempotencyKey}`);
        continue;
      }
      deliveredKeys.add(idempotencyKey);

      // Check if task is overdue
      const isOverdue = task.deadline && dayjs(task.deadline).isBefore(now);
      const newStatus = isOverdue ? TaskStatus.OVERDUE : task.status;

      const title = isOverdue ? `🔔 Overdue Reminder: ${task.title}` : `🔔 Sonam Reminder: ${task.title}`;
      const body = task.deadline
        ? `Task is due! Deadline: ${dayjs(task.deadline).format('MMM D, h:mm A')}`
        : 'Task reminder is due! Click to view details and mark Done.';

      // 1. Deliver Notification (In-App DB + Web Push VAPID)
      await notificationService.sendPushNotification(task.userId, {
        title,
        body,
        taskId: task.id,
      });

      // 2. Compute Next Repeating Reminder Occurrence
      const repeatMins = task.repeatReminderMins || task.user.repeatReminderMins || 30;
      const nextReminderDate = now.add(repeatMins, 'minute').toDate();

      // 3. Persist Updated Task State
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: newStatus,
          lastRemindedAt: now.toDate(),
          nextReminderAt: nextReminderDate,
        },
      });

      processedCount++;
      console.log(`[RenderCronWorker] Processed task "${task.title}" (ID: ${task.id}). Next reminder at ${nextReminderDate.toISOString()}`);
    }

    console.log(`[RenderCronWorker] Completed processing ${processedCount} reminder(s). Exiting cleanly.`);
  } catch (err: any) {
    console.error('[RenderCronWorker] Execution error:', err.message || err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Execute worker when run directly from command line / Render Cron Job
if (require.main === module) {
  runReminderWorker();
}
