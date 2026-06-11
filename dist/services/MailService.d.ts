export declare class MailService {
    private config;
    constructor();
    sendEmail(to: string, subject: string, body: string, cc?: string, bcc?: string): Promise<boolean>;
    readInbox(limit?: number, folder?: string): Promise<any[]>;
    /** Write a starter config file so the user knows what to fill in */
    static writeExampleConfig(): void;
    /** Check if email configuration is complete */
    static isConfigured(): boolean;
}
