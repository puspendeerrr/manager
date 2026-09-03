// Shared Domain Enums & Interfaces for Sonam AI Personal Todo & Persistent Reminder Manager

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  SNOOZED = 'SNOOZED',
  CANCELLED = 'CANCELLED',
}

export enum ReminderInterval {
  MINUTES_10 = 'MINUTES_10',
  MINUTES_15 = 'MINUTES_15',
  MINUTES_30 = 'MINUTES_30',
  HOUR_1 = 'HOUR_1',
  HOURS_2 = 'HOURS_2',
  CUSTOM = 'CUSTOM',
}

export enum ReminderState {
  SCHEDULED = 'SCHEDULED',
  DUE = 'DUE',
  DELIVERED = 'DELIVERED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export enum DeadlineSource {
  USER_PROVIDED = 'USER_PROVIDED',
  AI_SUGGESTED = 'AI_SUGGESTED',
  SYSTEM_DEFAULT = 'SYSTEM_DEFAULT',
}

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  workStartHour: string;
  workEndHour: string;
  defaultReminderInterval: ReminderInterval;
  enableNotifications: boolean;
  enableSound?: boolean;
  repeatReminderMins?: number;
  keepReminding?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  scheduledFor: string;
  state: ReminderState;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string | null;
  deadlineSource?: DeadlineSource;
  reminderInterval?: ReminderInterval | null;
  nextReminderAt?: string | null;
  lastRemindedAt?: string | null;
  repeatReminderMins?: number | null;
  keepReminding?: boolean;
  completedAt?: string | null;
  projectId?: string | null;
  userId: string;
  reminders?: TaskReminder[];
  project?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  totalTasks?: number;
  completedTasks?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  deadline?: string;
  deadlineSource?: DeadlineSource;
  priority?: TaskPriority;
  projectId?: string;
  reminderInterval?: ReminderInterval;
  nextReminderAt?: string;
  repeatReminderMins?: number;
  keepReminding?: boolean;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string | null;
  deadlineSource?: DeadlineSource;
  projectId?: string | null;
  reminderInterval?: ReminderInterval | null;
  nextReminderAt?: string | null;
  repeatReminderMins?: number | null;
  keepReminding?: boolean;
}

export interface SnoozeTaskDTO {
  duration: '10m' | '15m' | '30m' | '1h' | '2h' | 'tomorrow' | 'custom';
  customMinutes?: number;
}

export interface RescheduleTaskDTO {
  newDeadline: string;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateSettingsDTO {
  name?: string;
  timezone?: string;
  workStartHour?: string;
  workEndHour?: string;
  defaultReminderInterval?: ReminderInterval;
  enableNotifications?: boolean;
  enableSound?: boolean;
  repeatReminderMins?: number;
  keepReminding?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type AiActionType =
  | 'CREATE_TASK'
  | 'RESCHEDULE_TASK'
  | 'COMPLETE_TASK'
  | 'SNOOZE_TASK'
  | 'CANCEL_TASK'
  | 'UPDATE_TASK_PRIORITY'
  | 'STOP_REMINDERS';

export interface AiActionCardPayload {
  id: string;
  type: AiActionType;
  title: string;
  description?: string;
  status: 'PENDING_CONFIRMATION' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  data: {
    taskId?: string;
    taskTitle?: string;
    description?: string;
    deadline?: string | null;
    priority?: TaskPriority;
    oldDeadline?: string | null;
    newDeadline?: string | null;
    snoozeMinutes?: number;
    [key: string]: any;
  };
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'sonam';
  text: string;
  timestamp: string;
  actionCard?: AiActionCardPayload | null;
}

export interface AiChatRequest {
  message: string;
  conversationId?: string;
}

export interface AiChatResponse {
  message: string;
  actionCard?: AiActionCardPayload | null;
  suggestedPrompts?: string[];
  isAiConfigured: boolean;
}

export type SonamDashboardSummary = any;
export type GoogleOAuthStatus = any;
export type CalendarEvent = any;
export type GmailMessageSnippet = any;
