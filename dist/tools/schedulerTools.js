"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list_scheduled_tasks = exports.schedule_task = void 0;
const SchedulerService_1 = require("../services/SchedulerService");
exports.schedule_task = {
    name: 'schedule_task',
    description: 'Schedule a task to run at a specific time using cron syntax',
    schema: {
        type: 'object',
        properties: {
            cron: {
                type: 'string',
                description: 'Cron expression for when to run the task (e.g., "0 0 * * *" for daily at midnight)'
            },
            description: {
                type: 'string',
                description: 'Description of what the task does'
            },
            input: {
                type: 'string',
                description: 'The input text that will be processed when the task runs'
            }
        },
        required: ['cron', 'input']
    },
    execute: async (args) => {
        try {
            const job = SchedulerService_1.schedulerService.addJob({
                cron: args.cron,
                description: args.description || '',
                input: args.input,
                enabled: true
            });
            return {
                success: true,
                message: `Task scheduled successfully with ID: ${job.id}`,
                job: job
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to schedule task'
            };
        }
    },
    riskLevel: 'low',
    mutatesWorkspace: false,
    requiresWorkspace: false
};
exports.list_scheduled_tasks = {
    name: 'list_scheduled_tasks',
    description: 'List all currently scheduled tasks',
    schema: {
        type: 'object',
        properties: {}
    },
    execute: async () => {
        try {
            const jobs = SchedulerService_1.schedulerService.listJobs();
            if (jobs.length === 0) {
                return {
                    success: true,
                    message: 'No scheduled tasks found',
                    jobs: []
                };
            }
            return {
                success: true,
                message: `Found ${jobs.length} scheduled tasks`,
                jobs: jobs
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to list scheduled tasks'
            };
        }
    },
    riskLevel: 'safe',
    mutatesWorkspace: false,
    requiresWorkspace: false
};
// Register tools with the ToolRegistry
const ToolRegistry_1 = require("./ToolRegistry");
ToolRegistry_1.ToolRegistry.register(exports.schedule_task);
ToolRegistry_1.ToolRegistry.register(exports.list_scheduled_tasks);
console.log('✓ Scheduler tools registered');
