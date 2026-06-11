import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { calendarService } from '../services/CalendarService';

// List calendar events tool
const listCalendarEventsTool: Tool = {
  name: 'list_calendar_events',
  description: 'List upcoming calendar events',
  schema: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of days ahead to list events (default: 7)'
      }
    },
    required: []
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const days = args.days as number;
    
    try {
      const events = await calendarService.listEvents(days ?? 7);
      return {
        success: true,
        data: events
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list calendar events'
      };
    }
  }
};

// Create calendar event tool
const createCalendarEventTool: Tool = {
  name: 'create_calendar_event',
  description: 'Create a new calendar event',
  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the event'
      },
      start: {
        type: 'string',
        description: 'Start date and time of the event (ISO format)'
      },
      end: {
        type: 'string',
        description: 'End date and time of the event (ISO format)'
      },
      description: {
        type: 'string',
        description: 'Description of the event (optional)'
      }
    },
    required: ['title', 'start', 'end']
  },
  riskLevel: 'low',
  mutatesWorkspace: true,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const title = args.title as string;
    const start = args.start as string;
    const end = args.end as string;
    const description = args.description as string;

    try {
      const eventId = await calendarService.createEvent(
        title,
        new Date(start),
        new Date(end),
        description
      );
      return {
        success: true,
        data: `Event created successfully with ID: ${eventId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar event'
      };
    }
  }
};

// Check calendar auth tool
const checkCalendarAuthTool: Tool = {
  name: 'check_calendar_auth',
  description: 'Check if calendar is authenticated',
  schema: {
    type: 'object',
    properties: {},
    required: []
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    try {
      const isAuthenticated = await calendarService.isAuthenticated();
      return {
        success: true,
        data: isAuthenticated ? 'authenticated' : 'not authenticated'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check calendar authentication'
      };
    }
  }
};

// Register the tools
ToolRegistry.register(listCalendarEventsTool);
ToolRegistry.register(createCalendarEventTool);
ToolRegistry.register(checkCalendarAuthTool);

export { listCalendarEventsTool, createCalendarEventTool, checkCalendarAuthTool };