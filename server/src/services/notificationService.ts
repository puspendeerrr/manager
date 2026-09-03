import { NotificationStatus, TaskPriority } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class NotificationService {
  async getNotifications(userId: string, status?: NotificationStatus) {
    const where: any = { userId };
    if (status) where.status = status;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async createNotification(userId: string, data: { type: string; title: string; description?: string; priority?: TaskPriority; entityType?: string; entityId?: string }) {
    // Deduplication check within last 30 minutes
    const recentDup = await prisma.notification.findFirst({
      where: {
        userId,
        title: data.title,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });

    if (recentDup) return recentDup;

    return prisma.notification.create({
      data: {
        userId,
        type: data.type,
        priority: data.priority || TaskPriority.MEDIUM,
        title: data.title,
        description: data.description,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  async sendPushNotification(userId: string, payload: { title: string; body: string; taskId?: string; data?: any }) {
    console.log(`[NotificationService] Sending push notification to user ${userId}:`, payload);
    return this.createNotification(userId, {
      type: 'PUSH_REMINDER',
      title: payload.title,
      description: payload.body,
      priority: TaskPriority.HIGH,
      entityType: payload.taskId ? 'Task' : undefined,
      entityId: payload.taskId || undefined,
    });
  }

  async markRead(id: string, userId: string) {
    const existing = await prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Notification not found');

    return prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.READ },
    });
  }

  async dismiss(id: string, userId: string) {
    const existing = await prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Notification not found');

    return prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.DISMISSED },
    });
  }
}

export const notificationService = new NotificationService();
