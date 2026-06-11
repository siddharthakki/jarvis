interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
}
export declare class CalendarService {
    private oauth2Client;
    private cache;
    private syncInterval;
    private configured;
    constructor();
    private loadTokens;
    private saveTokens;
    private startBackgroundSync;
    isAuthenticated(): Promise<boolean>;
    authenticate(): Promise<void>;
    private syncEvents;
    listEvents(daysAhead?: number): Promise<CalendarEvent[]>;
    createEvent(title: string, start: Date, end: Date, description?: string): Promise<string>;
}
export declare const calendarService: CalendarService;
export {};
