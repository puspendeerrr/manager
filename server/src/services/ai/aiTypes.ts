import { z } from 'zod';
import {
  TaskPriority,
  TaskStatus,
  ReminderInterval,
  DeadlineSource,
  AiActionCardPayload,
} from '@sonam/shared';

// Zod schemas for AI tool parameter validation
export const getTasksToolSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().optional(),
  search: z.string().optional(),
});

export const getTaskToolSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
});

export const createTaskToolSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  deadlineSource: z.nativeEnum(DeadlineSource).optional().default(DeadlineSource.USER_PROVIDED),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  projectId: z.string().optional(),
  reminderInterval: z.nativeEnum(ReminderInterval).optional(),
});

export const updateTaskToolSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  deadline: z.string().optional(),
  deadlineSource: z.nativeEnum(DeadlineSource).optional(),
  projectId: z.string().optional(),
  reminderInterval: z.nativeEnum(ReminderInterval).optional(),
});

export const completeTaskToolSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
});

export const snoozeTaskToolSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
  duration: z.enum(['10m', '15m', '30m', '1h', '2h', 'tomorrow', 'custom']),
  customMinutes: z.number().optional(),
});

export const rescheduleTaskToolSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
  newDeadline: z.string().min(1, 'newDeadline ISO string is required'),
});

export const getProjectsToolSchema = z.object({});
export const createProjectToolSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});
export const getUserSettingsToolSchema = z.object({});

// Calendar & Mail Schemas
export const getTodayEventsToolSchema = z.object({});
export const getUpcomingEventsToolSchema = z.object({
  days: z.number().min(1).max(30).optional().default(7),
});
export const getFreeTimeToolSchema = z.object({
  date: z.string().optional(),
  durationMins: z.number().optional().default(60),
});
export const createCalendarEventToolSchema = z.object({
  summary: z.string().min(1, 'Summary title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'startTime ISO string is required'),
  endTime: z.string().min(1, 'endTime ISO string is required'),
  location: z.string().optional(),
});
export const searchGmailToolSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  maxResults: z.number().optional().default(5),
});

export interface ExecutedToolResult {
  toolName: string;
  result: any;
  actionCard?: AiActionCardPayload;
}
