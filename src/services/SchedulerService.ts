import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ScheduledJob {
  id: string;
  cron: string;
  description: string;
  input: string;
  enabled: boolean;
}

const JOBS_FILE = path.join(os.homedir(), '.jarvis', 'scheduler.json');

export interface ScheduledJobInterface extends ScheduledJob {}

export class SchedulerService {
  private jobs: ScheduledJob[] = [];
  private tasks = new Map<string, cron.ScheduledTask>();
  private onTrigger: (input: string) => Promise<any> = () => Promise.resolve();

  constructor() {}

  public setOnTrigger(callback: (input: string) => Promise<any>): void {
    this.onTrigger = callback;
  }

  start(): void {
    // Load from JOBS_FILE
    try {
      if (fs.existsSync(JOBS_FILE)) {
        const data = fs.readFileSync(JOBS_FILE, 'utf8');
        this.jobs = JSON.parse(data);
        
        // Schedule all enabled jobs
        for (const job of this.jobs) {
          if (job.enabled) {
            this.scheduleOne(job);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error);
    }
  }

  stop(): void {
    // Destroy all tasks
    for (const [id, task] of this.tasks.entries()) {
      task.stop();
      this.tasks.delete(id);
    }
  }

  addJob(job: Omit<ScheduledJob, 'id'>): ScheduledJob {
    // Generate UUID via Date.now()
    const id = Date.now().toString();
    const scheduledJob: ScheduledJob = {
      ...job,
      id
    };

    // Add to jobs array
    this.jobs.push(scheduledJob);

    // Persist to file
    this.persist();

    // Schedule if enabled
    if (scheduledJob.enabled) {
      this.scheduleOne(scheduledJob);
    }

    return scheduledJob;
  }

  removeJob(id: string): boolean {
    // Find and remove job from array
    const index = this.jobs.findIndex(job => job.id === id);
    if (index === -1) {
      return false;
    }

    const job = this.jobs[index];
    
    // Cancel task if it exists
    if (this.tasks.has(id)) {
      this.tasks.get(id)!.stop();
      this.tasks.delete(id);
    }

    // Remove from array
    this.jobs.splice(index, 1);

    // Persist to file
    this.persist();

    return true;
  }

  listJobs(): ScheduledJob[] {
    return [...this.jobs];
  }

  private persist(): void {
    // Ensure directory exists
    const dir = path.dirname(JOBS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write jobs to file
    fs.writeFileSync(JOBS_FILE, JSON.stringify(this.jobs, null, 2));
  }

  private scheduleOne(job: ScheduledJob): void {
    // Schedule the cron job
    const task = cron.schedule(job.cron, async () => {
      try {
        await this.onTrigger(job.input);
      } catch (error) {
        console.error(`Error executing scheduled job ${job.id}:`, error);
      }
    });
    
    // Store the task
    this.tasks.set(job.id, task);
  }
}

export const schedulerService = new SchedulerService();