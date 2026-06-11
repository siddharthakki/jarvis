import { ipcMain } from 'electron';

export class ApprovalFlow {
  private mainWindow: any = null;

  setMainWindow(mainWindow: any): void {
    this.mainWindow = mainWindow;
  }

  async requestApproval(
    toolName: string,
    args: Record<string, unknown>,
    reason: string,
    riskLevel: RiskLevel
  ): Promise<'approved' | 'denied'> {
    // If we have a main window, use desktop UI for approval
    if (this.mainWindow && this.mainWindow.webContents) {
      return new Promise((resolve) => {
        const approvalData = {
          toolName,
          args,
          reason,
          riskLevel,
          timestamp: new Date().toISOString()
        };

        // Send the approval request to the main window
        this.mainWindow.webContents.send('approval-request', approvalData);

        // Listen for the response from the UI (one-time listener)
        ipcMain.once('approval-response', (event, result: 'approved' | 'denied') => {
          resolve(result);
        });
      });
    } else {
      // Fallback to console prompt if no main window available
      console.log(`=== JARVIS APPROVAL REQUIRED ===\nTool: ${toolName}\nReason: ${reason}\nRisk: ${riskLevel}`);
      // Default to deny for safety if headless
      return 'denied';
    }
  }
}

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';