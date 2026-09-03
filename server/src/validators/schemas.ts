import { z } from 'zod';
import { TaskPriority, TaskStatus, ReminderInterval } from '@sonam/shared';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  deadline: z.string().datetime({ offset: true }).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  projectId: z.string().optional().nullable(),
  reminderInterval: z.nativeEnum(ReminderInterval).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  deadline: z.string().datetime({ offset: true }).optional().nullable(),
  projectId: z.string().optional().nullable(),
  reminderInterval: z.nativeEnum(ReminderInterval).optional().nullable(),
});

export const snoozeTaskSchema = z.object({
  duration: z.enum(['15m', '30m', '1h', '2h', 'tomorrow', 'custom']),
  customMinutes: z.number().min(1).optional(),
});

export const rescheduleTaskSchema = z.object({
  newDeadline: z.string().datetime({ offset: true }),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
  workStartHour: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format HH:mm').optional(),
  workEndHour: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format HH:mm').optional(),
  defaultReminderInterval: z.nativeEnum(ReminderInterval).optional(),
  enableNotifications: z.boolean().optional(),
});
