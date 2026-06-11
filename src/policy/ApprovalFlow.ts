import { ipcMain } from 'electron';
import { RiskLevel } from '../tools/ToolTypes';

export class ApprovalFlow {
  private mainWindow: any = null;
  private pendingRequests = new Map<string, (result: 'approved' | 'denied') => void>();

  constructor() {
    this.setupIpc();
  }

  setMainWindow(mainWindow: any): void {
    this.mainWindow = mainWindow;
  }

  private setupIpc(): void {
    // Listen for the response from the UI
    ipcMain.on('approval-response', (event, { requestId, result }: { requestId: string, result: 'approved' | 'denied' }) => {
      const resolve = this.pendingRequests.get(requestId);
      if (resolve) {
        resolve(result);
        this.pendingRequests.delete(requestId);
      }
    });
  }

  async requestApproval(
    toolName: string,
    args: Record<string, unknown>,
    reason: string,
    riskLevel: RiskLevel
  ): Promise<'approved' | 'denied'> {
    // Generate a simple unique ID
    const requestId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

    // If we have a main window, use desktop UI for approval
    if (this.mainWindow && this.mainWindow.webContents) {
      return new Promise((resolve) => {
        const approvalData = {
          requestId,
          toolName,
          args,
          reason,
          riskLevel,
          timestamp: new Date().toISOString()
        };

        // Set a timeout for 60 seconds
        const timeout = setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            console.warn(`Approval request ${requestId} timed out. Defaulting to deny.`);
            this.pendingRequests.delete(requestId);
            resolve('denied');
          }
        }, 60000);

        this.pendingRequests.set(requestId, (result) => {
          clearTimeout(timeout);
          resolve(result);
        });

        // Send the approval request to the main window
        this.mainWindow.webContents.send('approval-request', approvalData);
      });
    } else {
      // Fallback to console prompt if no main window available
      console.log(`=== JARVIS APPROVAL REQUIRED ===\nID: ${requestId}\nTool: ${toolName}\nReason: ${reason}\nRisk: ${riskLevel}`);
      // Default to deny for safety if headless
      return 'denied';
    }
  }
}
