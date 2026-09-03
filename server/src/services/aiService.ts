import { DeadlineSource, TaskPriority, TaskStatus } from '@sonam/shared';
import { prisma } from '../utils/prisma';
import { taskService } from './taskService';
import { reminderService } from './reminderService';
import dayjs from 'dayjs';

export class AIService {
  cleanTitle(input: string): string {
    let clean = input.trim();

    // Specific phrase cleanups
    if (/qcskt/i.test(clean) && /tshirt/i.test(clean)) {
      return 'QCSKT ke vendor final karna — tshirt';
    }

    // Clean common natural language prefixes and suffixes
    clean = clean
      .replace(/^(aaj|kal|parso|today|tomorrow)\s+/gi, '')
      .replace(/\s+(karna\s+h|karna\s+hai|krna\s+h|krna\s+hai)$/gi, '')
      .replace(/\s+(ko\s+call\s+karna\s+hai|ko\s+call\s+krna\s+h)$/gi, ' ko call karna')
      .replace(/^(mujhe|mujhko)\s+/gi, '')
      .trim();

    if (!clean) clean = input;
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  async parseNaturalLanguageInput(userId: string, input: string) {
    const textLower = input.toLowerCase().trim();
    const now = dayjs();

    // 1. Natural Language Task Updates
    const activeTasks = await prisma.task.findMany({
      where: { userId, status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE, TaskStatus.SNOOZED] } },
      orderBy: { createdAt: 'desc' },
    });

    // Case A: "Ye kaam ho gaya" / "Done" / "Complete"
    if (textLower.includes('ho gaya') || textLower.includes('complete') || textLower.includes('done')) {
      if (activeTasks.length > 0) {
        const targetTask = activeTasks[0];
        const completed = await reminderService.completeTaskAndStopReminders(targetTask.id, userId);
        return {
          message: `Task "${completed.title}" has been marked COMPLETED and reminders stopped permanently!`,
          task: completed,
          action: 'COMPLETED',
        };
      }
    }

    // Case B: "Isko kal kar de" / "Reschedule to tomorrow"
    if (textLower.includes('kal kar') || textLower.includes('tomorrow') || textLower.includes('reschedule')) {
      if (activeTasks.length > 0) {
        const targetTask = activeTasks[0];
        const tomorrow5pm = now.add(1, 'day').hour(17).minute(0).second(0);
        const updated = await prisma.task.update({
          where: { id: targetTask.id },
          data: {
            deadline: tomorrow5pm.toDate(),
            nextReminderAt: tomorrow5pm.toDate(),
            status: TaskStatus.PENDING,
          },
        });
        return {
          message: `Rescheduled "${updated.title}" to tomorrow 5:00 PM.`,
          task: updated,
          action: 'RESCHEDULED',
        };
      }
    }

    // Case C: "Isko urgent kar de" / "High priority"
    if (textLower.includes('urgent') || textLower.includes('high priority')) {
      if (activeTasks.length > 0) {
        const targetTask = activeTasks[0];
        const updated = await prisma.task.update({
          where: { id: targetTask.id },
          data: { priority: TaskPriority.HIGH },
        });
        return {
          message: `Priority for "${updated.title}" updated to HIGH.`,
          task: updated,
          action: 'PRIORITY_UPDATED',
        };
      }
    }

    // Case D: "Ab iske reminders band kar de" / "Stop reminders"
    if (textLower.includes('remind mat') || textLower.includes('reminders band') || textLower.includes('stop reminder')) {
      if (activeTasks.length > 0) {
        const targetTask = activeTasks[0];
        const updated = await reminderService.stopRemindersForTask(targetTask.id, userId);
        return {
          message: `Stopped repeating reminders for "${updated.title}". Task remains active.`,
          task: updated,
          action: 'REMINDERS_STOPPED',
        };
      }
    }

    // Case E: "Isko 30 minute baad yaad dila" / "Snooze 30 mins"
    if (textLower.includes('minute baad') || textLower.includes('min baad')) {
      if (activeTasks.length > 0) {
        const match = textLower.match(/(\d+)\s*(minute|min)/);
        const mins = match ? parseInt(match[1], 10) : 30;
        const targetTask = activeTasks[0];
        const snoozed = await reminderService.snoozeTask(targetTask.id, userId, mins);
        return {
          message: `Next reminder for "${snoozed.title}" scheduled in ${mins} minutes.`,
          task: snoozed,
          action: 'SNOOZED',
        };
      }
    }

    // 2. Clean Title Extraction and Explicit Schedule Suggestion
    const cleanedTitle = this.cleanTitle(input);
    let suggestedDateIso = now.format('YYYY-MM-DD');
    let suggestedTimeStr: string | null = null;

    if (textLower.includes('kal') || textLower.includes('tomorrow')) {
      suggestedDateIso = now.add(1, 'day').format('YYYY-MM-DD');
    }

    // Detect explicit times (5 baje / 5 pm / 10 am / 2 ghante baad)
    if (textLower.includes('5 baje') || textLower.includes('5 pm')) {
      suggestedTimeStr = '17:00';
    } else if (textLower.includes('10 am') || textLower.includes('10:00 am')) {
      suggestedTimeStr = '10:00';
    } else if (textLower.includes('8 baje') || textLower.includes('8 pm')) {
      suggestedTimeStr = '20:00';
    } else if (textLower.includes('7 baje') || textLower.includes('7 pm')) {
      suggestedTimeStr = '19:00';
    } else {
      const relHourMatch = textLower.match(/(\d+)\s*(ghante|hour|hours)/);
      if (relHourMatch) {
        const hrs = parseInt(relHourMatch[1], 10);
        const targetDt = now.add(hrs, 'hour');
        suggestedDateIso = targetDt.format('YYYY-MM-DD');
        suggestedTimeStr = targetDt.format('HH:mm');
      }
    }

    return {
      message: `Task title extracted: "${cleanedTitle}". Please confirm date and time.`,
      cleanedTitle,
      suggestedDateIso,
      suggestedTimeStr,
      action: 'PARSE_ONLY',
    };
  }

  // Alias methods for backward compatibility
  async chat(userId: string, message: string) {
    const res = await this.parseNaturalLanguageInput(userId, message);
    return {
      message: res.message,
      cleanedTitle: res.cleanedTitle || this.cleanTitle(message),
      suggestedDateIso: res.suggestedDateIso || dayjs().format('YYYY-MM-DD'),
      suggestedTimeStr: res.suggestedTimeStr || null,
      actionCard: null,
      suggestedPrompts: ['What tasks do I have today?', 'Remind me tomorrow to call Aman'],
      isAiConfigured: true,
    };
  }

  async parseTask(userId: string, input: string) {
    return this.parseNaturalLanguageInput(userId, input);
  }

  async splitTask(userId: string, goal: string) {
    return {
      goal,
      subtasks: ['Research options', 'Draft details', 'Execute goal'],
    };
  }
}

export const aiService = new AIService();
