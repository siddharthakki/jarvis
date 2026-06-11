import { Tool } from './ToolTypes';
import { schedulerService } from '../services/SchedulerService';

export const schedule_task: Tool = {
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
  execute: async (args: any) => {
    try {
      const job = schedulerService.addJob({
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
    } catch (error: any) {
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

export const list_scheduled_tasks: Tool = {
  name: 'list_scheduled_tasks',
  description: 'List all currently scheduled tasks',
  schema: {
    type: 'object',
    properties: {}
  },
  execute: async () => {
    try {
      const jobs = schedulerService.listJobs();
      
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
    } catch (error: any) {
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
import { ToolRegistry } from './ToolRegistry';
ToolRegistry.register(schedule_task);
ToolRegistry.register(list_scheduled_tasks);

console.log('✓ Scheduler tools registered');
