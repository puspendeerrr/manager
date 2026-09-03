import { TaskStatus, TaskPriority } from '@prisma/client';
import dayjs from 'dayjs';
import { prisma } from '../utils/prisma';
import { taskService } from './taskService';
import { googleCalendarService } from '../integrations/google/googleCalendarService';
import { googleAuthService } from '../integrations/google/googleAuthService';
import { SonamDashboardSummary } from '@sonam/shared';

export class StatsService {
  async getDashboardSummary(userId: string): Promise<SonamDashboardSummary> {
    // 1. Ensure overdue tasks are updated in DB first
    await taskService.updateOverdueTasks(userId);

    const now = dayjs();
    const startOfToday = now.startOf('day').toDate();
    const endOfToday = now.endOf('day').toDate();

    // Fetch user details for timezone/greeting
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Fetch Google connection status & calendar metrics
    const googleStatus = await googleAuthService.getStatus(userId);
    let calendarMeetingsCount = 0;
    let freeTimeHoursFormatted = 'Full day available';

    if (googleStatus.connected && googleStatus.calendarEnabled) {
      const todayEvents = await googleCalendarService.getTodayEvents(userId);
      calendarMeetingsCount = todayEvents.length;
      const freeTimeRes = await googleCalendarService.getFreeTime(userId);
      freeTimeHoursFormatted = freeTimeRes.totalFreeHoursFormatted;
    }

    // Fetch all user tasks
    const allTasks = await prisma.task.findMany({
      where: { userId },
      include: { project: true },
      orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
    });

    // Counts
    const todayTasks = allTasks.filter((t: any) => {
      if (!t.deadline) return false;
      const d = dayjs(t.deadline);
      return d.isAfter(startOfToday) && d.isBefore(endOfToday);
    });

    const completedTasks = allTasks.filter((t: any) => t.status === TaskStatus.COMPLETED);
    const pendingTasks = allTasks.filter((t: any) => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.SNOOZED);
    const overdueTasks = allTasks.filter((t: any) => t.status === TaskStatus.OVERDUE);
    const urgentCount = pendingTasks.filter((t: any) => t.priority === TaskPriority.URGENT).length;

    // Do Now: Urgent, Overdue, or due within 2 hours
    const doNowTasks = allTasks.filter((t: any) => {
      if (t.status === TaskStatus.COMPLETED) return false;
      if (t.status === TaskStatus.OVERDUE) return true;
      if (t.priority === TaskPriority.URGENT) return true;
      if (t.deadline) {
        const diffMinutes = dayjs(t.deadline).diff(now, 'minute');
        return diffMinutes >= 0 && diffMinutes <= 120;
      }
      return false;
    });

    // Upcoming: Future deadlines (beyond 2 hours)
    const upcomingTasks = pendingTasks.filter((t: any) => {
      if (doNowTasks.some((dn: any) => dn.id === t.id)) return false;
      if (!t.deadline) return true;
      return dayjs(t.deadline).isAfter(now);
    });

    // Recently completed
    const recentlyCompletedTasks = completedTasks.slice(0, 5);

    // Next Important Task calculation
    const activeTasksWithDeadline = pendingTasks
      .filter((t: any) => t.deadline && dayjs(t.deadline).isAfter(now))
      .sort((a: any, b: any) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    let nextImportantTask = null;
    if (activeTasksWithDeadline.length > 0) {
      const nextTask = activeTasksWithDeadline[0];
      const diffMins = dayjs(nextTask.deadline!).diff(now, 'minute');
      let formattedTime = '';
      if (diffMins < 60) {
        formattedTime = `Due in ${diffMins} minute${diffMins === 1 ? '' : 's'}`;
      } else {
        const hours = Math.floor(diffMins / 60);
        formattedTime = `Due in ~${hours} hour${hours === 1 ? '' : 's'}`;
      }

      nextImportantTask = {
        id: nextTask.id,
        title: nextTask.title,
        deadlineFormatted: formattedTime,
        minutesUntilDue: diffMins,
      };
    }

    // Deterministic Greeting & Sonam Insights Message
    const currentHour = now.hour();
    let greetingPrefix = 'Good morning';
    if (currentHour >= 12 && currentHour < 17) {
      greetingPrefix = 'Good afternoon';
    } else if (currentHour >= 17) {
      greetingPrefix = 'Good evening';
    }

    const userName = user?.name ? user.name.split(' ')[0] : 'there';
    const greeting = `${greetingPrefix}, ${userName}!`;

    let sonamInsightMessage = `You have ${todayTasks.length} task${todayTasks.length === 1 ? '' : 's'} scheduled for today.`;
    if (googleStatus.connected) {
      sonamInsightMessage += ` ${calendarMeetingsCount} meeting${calendarMeetingsCount === 1 ? '' : 's'} today (${freeTimeHoursFormatted} free time).`;
    }
    if (overdueTasks.length > 0) {
      sonamInsightMessage += ` ${overdueTasks.length} task${overdueTasks.length === 1 ? '' : 's'} require immediate attention.`;
    } else if (urgentCount > 0) {
      sonamInsightMessage += ` ${urgentCount} high-priority task${urgentCount === 1 ? '' : 's'} need focus.`;
    }

    return {
      greeting,
      stats: {
        todayCount: todayTasks.length,
        completedCount: completedTasks.length,
        pendingCount: pendingTasks.length,
        overdueCount: overdueTasks.length,
        urgentCount,
      },
      doNowTasks: doNowTasks.map(this.formatTaskForResponse),
      upcomingTasks: upcomingTasks.map(this.formatTaskForResponse),
      overdueTasks: overdueTasks.map(this.formatTaskForResponse),
      recentlyCompletedTasks: recentlyCompletedTasks.map(this.formatTaskForResponse),
      sonamInsightMessage,
      nextImportantTask,
      calendarMeetingsCount,
      freeTimeHoursFormatted,
      isGoogleConnected: googleStatus.connected,
    };
  }

  private formatTaskForResponse(t: any) {
    return {
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      deadline: t.deadline ? t.deadline.toISOString() : null,
      nextReminderAt: t.nextReminderAt ? t.nextReminderAt.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    };
  }
}

export const statsService = new StatsService();
