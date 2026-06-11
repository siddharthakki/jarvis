"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCalendarAuthTool = exports.createCalendarEventTool = exports.listCalendarEventsTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const CalendarService_1 = require("../services/CalendarService");
// List calendar events tool
const listCalendarEventsTool = {
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
    async execute(args, context) {
        const days = args.days;
        try {
            const events = await CalendarService_1.calendarService.listEvents(days ?? 7);
            return {
                success: true,
                data: events
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list calendar events'
            };
        }
    }
};
exports.listCalendarEventsTool = listCalendarEventsTool;
// Create calendar event tool
const createCalendarEventTool = {
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
    async execute(args, context) {
        const title = args.title;
        const start = args.start;
        const end = args.end;
        const description = args.description;
        try {
            const eventId = await CalendarService_1.calendarService.createEvent(title, new Date(start), new Date(end), description);
            return {
                success: true,
                data: `Event created successfully with ID: ${eventId}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create calendar event'
            };
        }
    }
};
exports.createCalendarEventTool = createCalendarEventTool;
// Check calendar auth tool
const checkCalendarAuthTool = {
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
    async execute(args, context) {
        try {
            const isAuthenticated = await CalendarService_1.calendarService.isAuthenticated();
            return {
                success: true,
                data: isAuthenticated ? 'authenticated' : 'not authenticated'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check calendar authentication'
            };
        }
    }
};
exports.checkCalendarAuthTool = checkCalendarAuthTool;
// Register the tools
ToolRegistry_1.ToolRegistry.register(listCalendarEventsTool);
ToolRegistry_1.ToolRegistry.register(createCalendarEventTool);
ToolRegistry_1.ToolRegistry.register(checkCalendarAuthTool);
