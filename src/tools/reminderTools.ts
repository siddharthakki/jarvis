import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { ReminderService } from '../services/ReminderService';

// Initialize the reminder service
const reminderService = new ReminderService();

// Set reminder tool
const setReminderTool: Tool = {
  name: 'set_reminder',
  description: 'Set a new reminder',
  schema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Date and time for the reminder (ISO format)'
      },
      message: {
        type: 'string',
        description: 'Reminder message'
      },
      category: {
        type: 'string',
        description: 'Category for the reminder (optional)'
      },
      recurring: {
        type: 'boolean',
        description: 'Whether the reminder recurs (optional)'
      }
    },
    required: ['date', 'message']
  },
  riskLevel: 'low',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const date = args.date as string;
    const message = args.message as string;
    const category = args.category as string;
    const recurring = args.recurring as boolean;

    try {
      const success = await reminderService.setReminder(new Date(date), message, category, recurring);
      return {
        success: true,
        data: success ? 'Reminder set successfully' : 'Failed to set reminder'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set reminder'
      };
    }
  }
};

// Get reminders tool
const getRemindersTool: Tool = {
  name: 'get_reminders',
  description: 'Get upcoming reminders',
  schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of reminders to retrieve (default: 10)'
      },
      startDate: {
        type: 'string',
        description: 'Start date for reminders (optional, defaults to now)'
      }
    },
    required: []
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const limit = args.limit as number || 10;
    const startDate = args.startDate as string;

    try {
      const reminders = await reminderService.getUpcomingReminders(limit, startDate ? new Date(startDate) : undefined);
      return {
        success: true,
        data: reminders
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reminders'
      };
    }
  }
};

// Register the tools
ToolRegistry.register(setReminderTool);
ToolRegistry.register(getRemindersTool);

export { setReminderTool, getRemindersTool };