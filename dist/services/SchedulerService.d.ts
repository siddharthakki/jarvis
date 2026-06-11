interface ScheduledJob {
    id: string;
    cron: string;
    description: string;
    input: string;
    enabled: boolean;
}
export interface ScheduledJobInterface extends ScheduledJob {
}
export declare class SchedulerService {
    private jobs;
    private tasks;
    private onTrigger;
    constructor();
    setOnTrigger(callback: (input: string) => Promise<any>): void;
    start(): void;
    stop(): void;
    addJob(job: Omit<ScheduledJob, 'id'>): ScheduledJob;
    removeJob(id: string): boolean;
    listJobs(): ScheduledJob[];
    private persist;
    private scheduleOne;
}
export declare const schedulerService: SchedulerService;
export {};
