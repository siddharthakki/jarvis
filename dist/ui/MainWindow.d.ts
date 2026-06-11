import { BrowserWindow } from 'electron';
export declare class MainWindow {
    private window;
    private agentRuntime;
    constructor();
    private createWindow;
    private checkOllamaStatus;
    private setupIPC;
    setAgentRuntime(agentRuntime: any): void;
    getWindow(): BrowserWindow | null;
    show(): void;
    hide(): void;
    updateStatus(status: string): void;
}
