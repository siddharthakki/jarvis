"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerService = exports.SchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const JOBS_FILE = path.join(os.homedir(), '.jarvis', 'scheduler.json');
class SchedulerService {
    constructor() {
        this.jobs = [];
        this.tasks = new Map();
        this.onTrigger = () => Promise.resolve();
    }
    setOnTrigger(callback) {
        this.onTrigger = callback;
    }
    start() {
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
        }
        catch (error) {
            console.error('Failed to load scheduled jobs:', error);
        }
    }
    stop() {
        // Destroy all tasks
        for (const [id, task] of this.tasks.entries()) {
            task.stop();
            this.tasks.delete(id);
        }
    }
    addJob(job) {
        // Generate UUID via Date.now()
        const id = Date.now().toString();
        const scheduledJob = {
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
    removeJob(id) {
        // Find and remove job from array
        const index = this.jobs.findIndex(job => job.id === id);
        if (index === -1) {
            return false;
        }
        const job = this.jobs[index];
        // Cancel task if it exists
        if (this.tasks.has(id)) {
            this.tasks.get(id).stop();
            this.tasks.delete(id);
        }
        // Remove from array
        this.jobs.splice(index, 1);
        // Persist to file
        this.persist();
        return true;
    }
    listJobs() {
        return [...this.jobs];
    }
    persist() {
        // Ensure directory exists
        const dir = path.dirname(JOBS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Write jobs to file
        fs.writeFileSync(JOBS_FILE, JSON.stringify(this.jobs, null, 2));
    }
    scheduleOne(job) {
        // Schedule the cron job
        const task = cron.schedule(job.cron, async () => {
            try {
                await this.onTrigger(job.input);
            }
            catch (error) {
                console.error(`Error executing scheduled job ${job.id}:`, error);
            }
        });
        // Store the task
        this.tasks.set(job.id, task);
    }
}
exports.SchedulerService = SchedulerService;
exports.schedulerService = new SchedulerService();
