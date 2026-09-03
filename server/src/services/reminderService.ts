import { ReminderState, TaskStatus } from '@sonam/shared';
import { prisma } from '../utils/prisma';
import dayjs from 'dayjs';

export class ReminderService {
  private deliveredKeys: Set<string> = new Set();

  async processReminders(userId?: string) {
    const now = dayjs();
    const whereUser = userId ? { userId } : {};

    const tasksDue = await prisma.task.findMany({
      where: {
        ...whereUser,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE, TaskStatus.SNOOZED] },
        nextReminderAt: { lte: now.toDate() },
      },
      include: { user: true },
    });

    const notificationsSent = [];

    for (const task of tasksDue) {
      const reminderTimeIso = task.nextReminderAt ? dayjs(task.nextReminderAt).format('YYYY-MM-DD-HH:mm') : now.format('YYYY-MM-DD-HH:mm');
      const dedupKey = `${task.userId}_${task.id}_${reminderTimeIso}`;

      if (this.deliveredKeys.has(dedupKey)) {
        continue;
      }
      this.deliveredKeys.add(dedupKey);

      const notifTitle = task.status === TaskStatus.OVERDUE ? `Overdue Reminder: ${task.title}` : `Task Reminder: ${task.title}`;
      const notifDesc = task.deadline ? `Due: ${dayjs(task.deadline).format('MMM D, h:mm A')}` : 'Task reminder is due!';

      const notification = await prisma.notification.create({
        data: {
          userId: task.userId,
          type: 'TASK_REMINDER',
          priority: task.priority,
          title: notifTitle,
          description: notifDesc,
          entityType: 'Task',
          entityId: task.id,
          status: 'UNREAD',
        },
      });

      notificationsSent.push(notification);

      const repeatMins = task.repeatReminderMins || task.user.repeatReminderMins || 30;
      const keepReminding = task.keepReminding !== false && task.user.keepReminding !== false;

      let nextReminderDate: Date | null = null;
      if (keepReminding) {
        nextReminderDate = now.add(repeatMins, 'minute').toDate();
      }

      await prisma.task.update({
        where: { id: task.id },
        data: {
          lastRemindedAt: now.toDate(),
          nextReminderAt: nextReminderDate,
        },
      });
    }

    return notificationsSent;
  }

  async processDueReminders(userId?: string) {
    return this.processReminders(userId);
  }

  async snoozeTask(taskId: string, userId: string, snoozeMinutes: number = 10) {
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new Error('Task not found');

    const nextReminder = dayjs().add(snoozeMinutes, 'minute').toDate();

    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SNOOZED,
        nextReminderAt: nextReminder,
      },
    });
  }

  async completeTaskAndStopReminders(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new Error('Task not found');

    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        nextReminderAt: null,
      },
    });
  }

  async stopRemindersForTask(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new Error('Task not found');

    return prisma.task.update({
      where: { id: taskId },
      data: {
        keepReminding: false,
        nextReminderAt: null,
      },
    });
  }
}

export const reminderService = new ReminderService();
