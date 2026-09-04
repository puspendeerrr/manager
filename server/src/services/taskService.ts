import { TaskStatus, TaskPriority, CreateTaskDTO, UpdateTaskDTO, SnoozeTaskDTO } from '@sonam/shared';
import { prisma } from '../utils/prisma';
import dayjs from 'dayjs';

export class TaskService {
  async ensureUserExists(userId: string) {
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          username: userId,
          usernameLower: userId.toLowerCase(),
          email: `${userId}@manager.app`,
          name: 'Personal User',
        },
      });
    } catch (err) {
      console.warn(`[taskService] ensureUserExists warning for ${userId}:`, err);
    }
  }

  async getTasks(userId: string, filters?: { status?: any; priority?: any; search?: string; projectId?: string }) {
    await this.ensureUserExists(userId);
    const whereClause: any = { userId };

    if (filters?.status) whereClause.status = filters.status;
    if (filters?.priority) whereClause.priority = filters.priority;
    if (filters?.projectId) whereClause.projectId = filters.projectId;
    if (filters?.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.task.findMany({
      where: whereClause,
      include: { project: true, reminders: true },
      orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
    });
  }

  async getTaskById(taskId: string, userId: string) {
    return prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { project: true, reminders: true },
    });
  }

  async createTask(userId: string, data: CreateTaskDTO) {
    await this.ensureUserExists(userId);
    const deadlineDate = data.deadline ? new Date(data.deadline) : null;
    const nextReminderDate = data.nextReminderAt ? new Date(data.nextReminderAt) : deadlineDate;

    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        deadline: deadlineDate,
        deadlineSource: data.deadlineSource || 'USER_PROVIDED',
        priority: data.priority || TaskPriority.MEDIUM,
        projectId: data.projectId || null,
        reminderInterval: data.reminderInterval || null,
        nextReminderAt: nextReminderDate,
        repeatReminderMins: data.repeatReminderMins || 30,
        keepReminding: data.keepReminding !== undefined ? data.keepReminding : true,
      },
      include: { project: true, reminders: true },
    });
  }

  async updateTask(taskId: string, userId: string, data: UpdateTaskDTO) {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      const err: any = new Error('Task not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.nextReminderAt !== undefined && { nextReminderAt: data.nextReminderAt ? new Date(data.nextReminderAt) : null }),
        ...(data.repeatReminderMins !== undefined && { repeatReminderMins: data.repeatReminderMins }),
        ...(data.keepReminding !== undefined && { keepReminding: data.keepReminding }),
      },
      include: { project: true, reminders: true },
    });
  }

  async completeTask(taskId: string, userId: string) {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      const err: any = new Error('Task not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        keepReminding: false,
        nextReminderAt: null, // STOP REMINDERS
      },
      include: { project: true },
    });
  }

  async stopReminders(taskId: string, userId: string) {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      const err: any = new Error('Task not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return prisma.task.update({
      where: { id: taskId },
      data: {
        keepReminding: false,
        nextReminderAt: null,
      },
      include: { project: true },
    });
  }

  async rescheduleTask(taskId: string, userId: string, newDeadlineIso: string) {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      const err: any = new Error('Task not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const newDate = new Date(newDeadlineIso);
    return prisma.task.update({
      where: { id: taskId },
      data: {
        deadline: newDate,
        nextReminderAt: newDate,
        status: TaskStatus.PENDING,
      },
      include: { project: true },
    });
  }

  async snoozeTask(taskId: string, userId: string, snoozeDto: SnoozeTaskDTO) {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      const err: any = new Error('Task not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    let snoozeMinutes = 10;
    if (snoozeDto.duration === '10m') snoozeMinutes = 10;
    else if (snoozeDto.duration === '15m') snoozeMinutes = 15;
    else if (snoozeDto.duration === '30m') snoozeMinutes = 30;
    else if (snoozeDto.duration === '1h') snoozeMinutes = 60;
    else if (snoozeDto.duration === 'tomorrow') snoozeMinutes = 1440;
    else if (snoozeDto.customMinutes) snoozeMinutes = snoozeDto.customMinutes;

    const nextReminder = dayjs().add(snoozeMinutes, 'minute').toDate();

    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SNOOZED,
        nextReminderAt: nextReminder,
      },
      include: { project: true },
    });
  }

  async updateOverdueTasks(userId?: string) {
    const now = new Date();
    const whereUser = userId ? { userId } : {};

    await prisma.task.updateMany({
      where: {
        ...whereUser,
        status: TaskStatus.PENDING,
        deadline: { lt: now },
      },
      data: {
        status: TaskStatus.OVERDUE,
      },
    });
  }

  async deleteTask(taskId: string, userId: string) {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      const err: any = new Error('Task not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Delete dependent records first to satisfy foreign key constraints
    await prisma.taskReminder.deleteMany({
      where: { taskId },
    });

    return prisma.task.delete({ where: { id: taskId } });
  }
}

export const taskService = new TaskService();
