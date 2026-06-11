"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarController = void 0;
class StatusBarController {
    constructor(mainWindow) {
        this.mainWindow = null;
        this.statusElement = null;
        this.mainWindow = mainWindow;
    }
    updateStatus(status) {
        if (this.mainWindow) {
            // Send status update to the renderer process
            this.mainWindow.webContents.send('status-update', status);
        }
    }
    showNotification(message, type = 'info') {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('show-notification', {
                message,
                type
            });
        }
    }
    showApprovalDialog(toolName, args, reason) {
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
            }
            else {
                resolve(false);
            }
        });
    }
    showApprovalDialogSync(toolName, args, reason) {
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
exports.StatusBarController = StatusBarController;
