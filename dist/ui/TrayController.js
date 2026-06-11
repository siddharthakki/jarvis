"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrayController = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
class TrayController {
    constructor(mainWindow) {
        this.tray = null;
        this.mainWindow = null;
        this.mainWindow = mainWindow;
        this.statusIconPath = path.join(__dirname, '../assets/status-icon.png');
        this.createTray();
    }
    createTray() {
        // Create tray icon
        this.tray = new electron_1.Tray(this.statusIconPath);
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: 'Jarvis Assistant',
                enabled: false
            },
            {
                type: 'separator'
            },
            {
                label: 'Show Window',
                click: () => {
                    if (this.mainWindow) {
                        this.mainWindow.show();
                    }
                }
            },
            {
                label: 'Hide Window',
                click: () => {
                    if (this.mainWindow) {
                        this.mainWindow.hide();
                    }
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Exit',
                click: () => {
                    electron_1.app.quit();
                }
            }
        ]);
        this.tray.setContextMenu(contextMenu);
        // Set tooltip
        this.tray.setToolTip('Jarvis Desktop Assistant');
        // Handle tray icon click to show window
        this.tray.on('click', () => {
            if (this.mainWindow) {
                if (this.mainWindow.isVisible()) {
                    this.mainWindow.hide();
                }
                else {
                    this.mainWindow.show();
                }
            }
        });
    }
    updateStatus(status) {
        if (this.tray) {
            // Update tray icon based on status
            const iconPath = this.getStatusIconPath(status);
            this.tray.setImage(iconPath);
        }
    }
    getStatusIconPath(status) {
        switch (status.toLowerCase()) {
            case 'listening':
                return path.join(__dirname, '../assets/listening-icon.png');
            case 'processing':
                return path.join(__dirname, '../assets/processing-icon.png');
            case 'idle':
            default:
                return this.statusIconPath;
        }
    }
    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    }
}
exports.TrayController = TrayController;
