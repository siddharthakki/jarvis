interface Reminder {
    id: string;
    date: string;
    message: string;
    category?: string;
    recurring?: boolean;
    fired?: boolean;
}
export declare class ReminderService {
    private reminders;
    private timers;
    private notifyFn?;
    constructor();
    setNotifyFn(fn: (title: string, body: string) => void): void;
    private load;
    private save;
    private scheduleAll;
    private scheduleOne;
    private fire;
    setReminder(date: Date, message: string, category?: string, recurring?: boolean): Promise<boolean>;
    getUpcomingReminders(limit?: number, startDate?: Date): Promise<Reminder[]>;
    cancelReminder(id: string): Promise<boolean>;
}
export {};
