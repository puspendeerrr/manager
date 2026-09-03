import { NotificationStatus, TaskPriority } from '@prisma/client';
import { prisma } from '../utils/prisma';
import webPush from 'web-push';

// Configure Web Push VAPID if environment variables are provided
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@sonam.puspender.in',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.warn('[NotificationService] VAPID configuration warning:', err);
  }
}

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

  async saveSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new Error('Invalid Web Push subscription payload');
    }

    return prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
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
    
    // 1. Record in-app notification in DB
    const notif = await this.createNotification(userId, {
      type: 'PUSH_REMINDER',
      title: payload.title,
      description: payload.body,
      priority: TaskPriority.HIGH,
      entityType: payload.taskId ? 'Task' : undefined,
      entityId: payload.taskId || undefined,
    });

    // 2. Deliver Web Push to registered devices
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          taskId: payload.taskId,
          url: payload.taskId ? `/tasks?taskId=${payload.taskId}` : '/tasks',
        },
      });

      for (const sub of subscriptions) {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[NotificationService] Removing expired subscription endpoint: ${sub.endpoint}`);
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.warn('[NotificationService] Web Push delivery warning:', err.message);
          }
        }
      }
    }

    return notif;
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
