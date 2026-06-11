import { BrowserWindow } from 'electron';
export declare class TrayController {
    private tray;
    private mainWindow;
    private statusIconPath;
    constructor(mainWindow: BrowserWindow | null);
    private createTray;
    updateStatus(status: string): void;
    private getStatusIconPath;
    destroy(): void;
}
