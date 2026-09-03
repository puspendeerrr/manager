import {
  getTasksToolSchema,
  getTaskToolSchema,
  createTaskToolSchema,
  updateTaskToolSchema,
  completeTaskToolSchema,
  snoozeTaskToolSchema,
  rescheduleTaskToolSchema,
  getProjectsToolSchema,
  createProjectToolSchema,
  getUserSettingsToolSchema,
  getTodayEventsToolSchema,
  getUpcomingEventsToolSchema,
  getFreeTimeToolSchema,
  createCalendarEventToolSchema,
  searchGmailToolSchema,
  ExecutedToolResult,
} from './aiTypes';
import { taskService } from '../taskService';
import { projectService } from '../projectService';
import { settingsService } from '../settingsService';
import { reminderService } from '../reminderService';
import { googleCalendarService } from '../../integrations/google/googleCalendarService';
import { gmailService } from '../../integrations/google/gmailService';
import { AiActionCardPayload } from '@sonam/shared';

export class AIToolExecutor {
  async executeTool(userId: string, toolName: string, rawArgs: any): Promise<ExecutedToolResult> {
    console.log(`[AIToolExecutor] Executing tool "${toolName}" for user ${userId} with args:`, rawArgs);

    switch (toolName) {
      case 'get_tasks': {
        const args = getTasksToolSchema.parse(rawArgs);
        const tasks = await taskService.getTasks(userId, args);
        return { toolName, result: { count: tasks.length, tasks } };
      }

      case 'get_task': {
        const args = getTaskToolSchema.parse(rawArgs);
        const task = await taskService.getTaskById(args.taskId, userId);
        return { toolName, result: { task } };
      }

      case 'create_task': {
        const args = createTaskToolSchema.parse(rawArgs);
        const task = await taskService.createTask(userId, args);
        const actionCard: AiActionCardPayload = {
          id: `card_${Date.now()}`,
          type: 'CREATE_TASK',
          title: `Create Task: "${task.title}"`,
          description: task.description || undefined,
          status: 'SUCCESS',
          data: {
            taskId: task.id,
            taskTitle: task.title,
            deadline: task.deadline ? task.deadline.toISOString() : null,
            deadlineSource: task.deadlineSource,
            priority: task.priority as any,
          },
        };
        return { toolName, result: { message: `Task "${task.title}" created successfully!`, task }, actionCard };
      }

      case 'update_task': {
        const args = updateTaskToolSchema.parse(rawArgs);
        const { taskId, ...updateData } = args;
        const task = await taskService.updateTask(taskId, userId, updateData as any);
        return { toolName, result: { message: `Task "${task.title}" updated!`, task } };
      }

      case 'complete_task': {
        const args = completeTaskToolSchema.parse(rawArgs);
        const task = await reminderService.completeTaskAndStopReminders(args.taskId, userId);
        const actionCard: AiActionCardPayload = {
          id: `card_${Date.now()}`,
          type: 'COMPLETE_TASK',
          title: `Mark Task Completed: "${task.title}"`,
          status: 'SUCCESS',
          data: { taskId: task.id, taskTitle: task.title },
        };
        return { toolName, result: { message: `Task "${task.title}" marked COMPLETED!`, task }, actionCard };
      }

      case 'snooze_task': {
        const args = snoozeTaskToolSchema.parse(rawArgs);
        const task = await reminderService.snoozeTask(args.taskId, userId, args.customMinutes || 30);
        const actionCard: AiActionCardPayload = {
          id: `card_${Date.now()}`,
          type: 'SNOOZE_TASK',
          title: `Snooze Task: "${task.title}"`,
          status: 'SUCCESS',
          data: { taskId: task.id, taskTitle: task.title, snoozeMinutes: args.customMinutes || 30 },
        };
        return { toolName, result: { message: `Task "${task.title}" snoozed!`, task }, actionCard };
      }

      case 'reschedule_task': {
        const args = rescheduleTaskToolSchema.parse(rawArgs);
        const task = await taskService.rescheduleTask(args.taskId, userId, args.newDeadline);
        const actionCard: AiActionCardPayload = {
          id: `card_${Date.now()}`,
          type: 'RESCHEDULE_TASK',
          title: `Reschedule Task: "${task.title}"`,
          status: 'SUCCESS',
          data: { taskId: task.id, taskTitle: task.title, newDeadline: args.newDeadline },
        };
        return { toolName, result: { message: `Task "${task.title}" rescheduled!`, task }, actionCard };
      }

      case 'get_projects': {
        getProjectsToolSchema.parse(rawArgs);
        const projects = await projectService.getProjects(userId);
        return { toolName, result: { count: projects.length, projects } };
      }

      case 'create_project': {
        const args = createProjectToolSchema.parse(rawArgs);
        const project = await projectService.createProject(userId, args);
        return { toolName, result: { message: `Project "${project.name}" created!`, project } };
      }

      case 'get_user_settings': {
        getUserSettingsToolSchema.parse(rawArgs);
        const user = await settingsService.getUserSettings(userId);
        return { toolName, result: { user } };
      }

      case 'get_today_events': {
        getTodayEventsToolSchema.parse(rawArgs);
        const events = await googleCalendarService.getTodayEvents(userId);
        return { toolName, result: { count: events.length, events } };
      }

      case 'get_upcoming_events': {
        const args = getUpcomingEventsToolSchema.parse(rawArgs);
        const events = await googleCalendarService.getUpcomingEvents(userId, args.days);
        return { toolName, result: { count: events.length, events } };
      }

      case 'get_free_time': {
        const args = getFreeTimeToolSchema.parse(rawArgs);
        const freeTime = await googleCalendarService.getFreeTime(userId, args.date, args.durationMins);
        return { toolName, result: freeTime };
      }

      case 'create_calendar_event': {
        const args = createCalendarEventToolSchema.parse(rawArgs);
        const event = await googleCalendarService.createCalendarEvent(userId, args);
        return { toolName, result: { message: `Calendar event "${event.summary}" created!`, event } };
      }

      case 'search_gmail': {
        const args = searchGmailToolSchema.parse(rawArgs);
        const emails = await gmailService.searchGmail(userId, args.query, args.maxResults);
        return { toolName, result: { count: emails.length, emails } };
      }

      default:
        throw new Error(`Unknown AI tool: "${toolName}"`);
    }
  }
}

export const aiToolExecutor = new AIToolExecutor();
