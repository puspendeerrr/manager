import { google } from 'googleapis';
import dayjs from 'dayjs';
import { googleAuthService } from './googleAuthService';
import { prisma } from '../../utils/prisma';
import { CalendarEvent } from '@sonam/shared';

export class GoogleCalendarService {
  async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
    const authClient = await googleAuthService.getAuthenticatedClient(userId);
    if (!authClient) return [];

    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const now = dayjs();
    const startOfDay = now.startOf('day').toISOString();
    const endOfDay = now.endOf('day').toISOString();

    try {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const items = res.data.items || [];
      return items.map((e) => ({
        id: e.id || '',
        summary: e.summary || 'Untitled Event',
        description: e.description || null,
        start: e.start?.dateTime || e.start?.date || startOfDay,
        end: e.end?.dateTime || e.end?.date || endOfDay,
        location: e.location || null,
      }));
    } catch (err) {
      console.error('[GoogleCalendarService] Failed to fetch today events:', err);
      return [];
    }
  }

  async getUpcomingEvents(userId: string, days = 7): Promise<CalendarEvent[]> {
    const authClient = await googleAuthService.getAuthenticatedClient(userId);
    if (!authClient) return [];

    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const now = dayjs();
    const endOfPeriod = now.add(days, 'day').endOf('day').toISOString();

    try {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: endOfPeriod,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (res.data.items || []).map((e) => ({
        id: e.id || '',
        summary: e.summary || 'Untitled Event',
        description: e.description || null,
        start: e.start?.dateTime || e.start?.date || now.toISOString(),
        end: e.end?.dateTime || e.end?.date || endOfPeriod,
        location: e.location || null,
      }));
    } catch (err) {
      console.error('[GoogleCalendarService] Failed to fetch upcoming events:', err);
      return [];
    }
  }

  /**
   * Free-time slot calculation respecting user working hours and calendar events.
   */
  async getFreeTime(userId: string, targetDateStr?: string, durationMins = 60) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const targetDate = targetDateStr ? dayjs(targetDateStr) : dayjs();

    const startWorkHour = user?.workStartHour || '09:00';
    const endWorkHour = user?.workEndHour || '18:00';

    const [sh, sm] = startWorkHour.split(':').map(Number);
    const [eh, em] = endWorkHour.split(':').map(Number);

    const workStart = targetDate.hour(sh).minute(sm).second(0);
    const workEnd = targetDate.hour(eh).minute(em).second(0);

    const events = await this.getTodayEvents(userId);

    // Filter busy blocks during working hours
    const busyBlocks = events.map((e) => ({
      start: dayjs(e.start),
      end: dayjs(e.end),
    }));

    const freeSlots: Array<{ start: string; end: string; durationMins: number }> = [];
    let currentPointer = workStart;

    while (currentPointer.add(durationMins, 'minute').isBefore(workEnd) || currentPointer.add(durationMins, 'minute').isSame(workEnd)) {
      const slotEnd = currentPointer.add(durationMins, 'minute');

      const isConflict = busyBlocks.some(
        (b) => currentPointer.isBefore(b.end) && slotEnd.isAfter(b.start)
      );

      if (!isConflict) {
        freeSlots.push({
          start: currentPointer.format('HH:mm'),
          end: slotEnd.format('HH:mm'),
          durationMins,
        });
        currentPointer = slotEnd;
      } else {
        currentPointer = currentPointer.add(30, 'minute');
      }
    }

    const totalFreeMinutes = freeSlots.length * durationMins;

    return {
      date: targetDate.format('YYYY-MM-DD'),
      workStart: workStart.format('HH:mm'),
      workEnd: workEnd.format('HH:mm'),
      freeSlots,
      totalFreeMinutes,
      totalFreeHoursFormatted: `${Math.floor(totalFreeMinutes / 60)}h ${totalFreeMinutes % 60}m`,
    };
  }

  async createCalendarEvent(userId: string, data: { summary: string; description?: string; startTime: string; endTime: string; location?: string }): Promise<CalendarEvent> {
    const authClient = await googleAuthService.getAuthenticatedClient(userId);
    if (!authClient) {
      throw new Error('Google Calendar is not connected. Please connect Google in Settings.');
    }

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: data.summary,
        description: data.description,
        location: data.location,
        start: { dateTime: data.startTime },
        end: { dateTime: data.endTime },
      },
    });

    const e = res.data;
    return {
      id: e.id || '',
      summary: e.summary || data.summary,
      description: e.description || null,
      start: e.start?.dateTime || data.startTime,
      end: e.end?.dateTime || data.endTime,
      location: e.location || null,
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();
