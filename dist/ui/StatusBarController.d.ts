import { BrowserWindow } from 'electron';
export declare class StatusBarController {
    private mainWindow;
    private statusElement;
    constructor(mainWindow: BrowserWindow | null);
    updateStatus(status: string): void;
    showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
    showApprovalDialog(toolName: string, args: any, reason: string): Promise<boolean>;
    showApprovalDialogSync(toolName: string, args: any, reason: string): boolean;
}
