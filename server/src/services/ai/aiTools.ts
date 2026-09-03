import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const OPENAI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getTasks',
      description: 'Fetch pending, overdue, or completed tasks for the current user with optional filters.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'SNOOZED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          projectId: { type: 'string', description: 'Filter tasks belonging to a specific project ID' },
          search: { type: 'string', description: 'Search term to match title or description' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTask',
      description: 'Fetch details for a specific task by ID.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Unique task ID' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createTask',
      description: 'Create a new task for the user.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Optional task details or notes' },
          deadline: { type: 'string', description: 'ISO 8601 deadline string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          projectId: { type: 'string', description: 'Associated project ID' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateTask',
      description: 'Update fields of an existing task.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID to update' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'SNOOZED', 'CANCELLED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          deadline: { type: 'string' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'completeTask',
      description: 'Mark a task COMPLETED and permanently stop all future reminders.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID to complete' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'snoozeTask',
      description: 'Snooze a task reminder by a specified duration.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID to snooze' },
          duration: { type: 'string', enum: ['10m', '15m', '30m', '1h', '2h', 'tomorrow', 'custom'] },
          customMinutes: { type: 'number', description: 'Minutes to snooze' },
        },
        required: ['taskId', 'duration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rescheduleTask',
      description: 'Reschedule a task deadline and next reminder time.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID to reschedule' },
          newDeadline: { type: 'string', description: 'New ISO 8601 deadline string' },
        },
        required: ['taskId', 'newDeadline'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProjects',
      description: 'List all user projects.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createProject',
      description: 'Create a new user project.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          color: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getUserSettings',
      description: 'Get user reminder and notification settings.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTodayEvents',
      description: 'Get user Google Calendar events for today.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getUpcomingEvents',
      description: 'Get user upcoming Google Calendar events.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Days ahead to fetch' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getFreeTime',
      description: 'Find free time slots in user Google Calendar schedule.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          durationMins: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCalendarEvent',
      description: 'Schedule a new event in Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          description: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          location: { type: 'string' },
        },
        required: ['summary', 'startTime', 'endTime'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchGmail',
      description: 'Search user Gmail messages.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          maxResults: { type: 'number' },
        },
        required: ['query'],
      },
    },
  },
];
