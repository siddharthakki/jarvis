"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalFlow = void 0;
const electron_1 = require("electron");
class ApprovalFlow {
    constructor() {
        this.mainWindow = null;
    }
    setMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
    }
    async requestApproval(toolName, args, reason, riskLevel) {
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
                electron_1.ipcMain.once('approval-response', (event, result) => {
                    resolve(result);
                });
            });
        }
        else {
            // Fallback to console prompt if no main window available
            console.log(`=== JARVIS APPROVAL REQUIRED ===\nTool: ${toolName}\nReason: ${reason}\nRisk: ${riskLevel}`);
            // Default to deny for safety if headless
            return 'denied';
        }
    }
}
exports.ApprovalFlow = ApprovalFlow;
