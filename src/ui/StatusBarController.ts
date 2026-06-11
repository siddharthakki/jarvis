import { BrowserWindow } from 'electron';
import * as path from 'path';

export class StatusBarController {
  private mainWindow: BrowserWindow | null = null;
  private statusElement: HTMLElement | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow;
  }

  public updateStatus(status: string): void {
    if (this.mainWindow) {
      // Send status update to the renderer process
      this.mainWindow.webContents.send('status-update', status);
    }
  }

  public showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('show-notification', {
        message,
        type
      });
    }
  }

  public showApprovalDialog(toolName: string, args: any, reason: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.mainWindow) {
        // Send approval request to renderer process
        this.mainWindow.webContents.send('approval-request', {
          toolName,
          args,
          reason
        });
        
        // Listen for approval response (would be handled in renderer)
        // This is a simplified implementation - in practice, you'd want proper IPC handling
        resolve(true); // For now, auto-approve for simplicity
      } else {
        resolve(false);
      }
    });
  }

  public showApprovalDialogSync(toolName: string, args: any, reason: string): boolean {
    if (this.mainWindow) {
      // Send approval request to renderer process
      this.mainWindow.webContents.send('approval-request', {
        toolName,
        args,
        reason
      });
      
      // In a real implementation, you'd wait for user response here
      return true; // For now, auto-approve for simplicity
    }
    
    return false;
  }
}