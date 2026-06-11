"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemindersTool = exports.setReminderTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const ReminderService_1 = require("../services/ReminderService");
// Initialize the reminder service
const reminderService = new ReminderService_1.ReminderService();
// Set reminder tool
const setReminderTool = {
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
    async execute(args, context) {
        const date = args.date;
        const message = args.message;
        const category = args.category;
        const recurring = args.recurring;
        try {
            const success = await reminderService.setReminder(new Date(date), message, category, recurring);
            return {
                success: true,
                data: success ? 'Reminder set successfully' : 'Failed to set reminder'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to set reminder'
            };
        }
    }
};
exports.setReminderTool = setReminderTool;
// Get reminders tool
const getRemindersTool = {
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
    async execute(args, context) {
        const limit = args.limit || 10;
        const startDate = args.startDate;
        try {
            const reminders = await reminderService.getUpcomingReminders(limit, startDate ? new Date(startDate) : undefined);
            return {
                success: true,
                data: reminders
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get reminders'
            };
        }
    }
};
exports.getRemindersTool = getRemindersTool;
// Register the tools
ToolRegistry_1.ToolRegistry.register(setReminderTool);
ToolRegistry_1.ToolRegistry.register(getRemindersTool);
