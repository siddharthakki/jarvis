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
exports.MainWindow = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const TTSService_1 = require("../services/TTSService");
class MainWindow {
    constructor() {
        this.window = null;
        this.createWindow();
        this.setupIPC();
    }
    createWindow() {
        console.log('Initializing Wide-Screen JARVIS HUD...');
        const win = new electron_1.BrowserWindow({
            width: 1280,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                webSecurity: false,
            },
            transparent: false,
            frame: true,
            alwaysOnTop: false,
            backgroundColor: '#0B131A',
            title: 'JARVIS COMMAND CENTER'
        });
        this.window = win;
        // Load the index.html file
        const fs = require('fs');
        let indexPath = path.join(electron_1.app.getAppPath(), 'src/ui/index.html');
        if (!fs.existsSync(indexPath)) {
            indexPath = path.join(electron_1.app.getAppPath(), 'ui/index.html');
        }
        console.log(`Loading JARVIS HUD from: ${indexPath}`);
        win.loadFile(indexPath).catch(err => {
            console.error('Failed to load index.html:', err);
        });
        // Handle window close
        win.on('closed', () => {
            console.log('Window closed.');
            this.window = null;
        });
        win.webContents.on('did-finish-load', () => {
            console.log('JARVIS HUD loaded successfully.');
            this.checkOllamaStatus();
        });
        win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
            console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
        });
    }
    async checkOllamaStatus() {
        const { ollamaClient } = require('./OllamaClient');
        const isOnline = await ollamaClient.isAvailable();
        if (this.window) {
            this.window.webContents.send('ollama-status', {
                online: isOnline,
                model: 'QWEN_3_14B'
            });
        }
    }
    setupIPC() {
        // Listen for voice input from renderer process
        electron_1.ipcMain.on('voice-input', (event, transcript) => {
            // Silence JARVIS immediately if new input is received
            TTSService_1.ttsService.stop();
            if (!this.agentRuntime || !transcript)
                return;
            const TIMEOUT_MS = 150000; // 2.5 min — covers worst-case 14B model generation
            let settled = false;
            const timer = setTimeout(() => {
                if (settled)
                    return;
                settled = true;
                this.window?.webContents.send('status-update', 'Request timed out, Sir. The neural core is taking too long. Please try again.');
                event.reply('voice-input-response', {
                    response: '### Result\nI apologise, Sir — the neural core did not respond in time. Please try a shorter or simpler query, or check Ollama is running.',
                    results: []
                });
            }, TIMEOUT_MS);
            this.agentRuntime.processInput(transcript)
                .then((result) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                event.reply('voice-input-response', result);
            })
                .catch((error) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                event.reply('voice-input-error', error.message);
            });
        });
        // Listen for status updates
        electron_1.ipcMain.on('update-status', (_event, status) => {
            if (this.window) {
                this.window.webContents.send('status-update', status);
            }
        });
        electron_1.ipcMain.on('focus-window', () => {
            if (this.window) {
                this.window.show();
                this.window.focus();
            }
        });
        electron_1.ipcMain.on('stop-speech', () => {
            TTSService_1.ttsService.stop();
        });
    }
    setAgentRuntime(agentRuntime) {
        this.agentRuntime = agentRuntime;
        agentRuntime.setStatusCallback((message) => {
            this.window?.webContents.send('status-update', message);
        });
        agentRuntime.setSpeakCallback((text) => {
            TTSService_1.ttsService.stop();
            TTSService_1.ttsService.speak(text);
        });
    }
    getWindow() {
        return this.window;
    }
    show() {
        if (this.window) {
            this.window.show();
        }
    }
    hide() {
        if (this.window) {
            this.window.hide();
        }
    }
    updateStatus(status) {
        if (this.window) {
            this.window.webContents.send('status-update', status);
        }
    }
}
exports.MainWindow = MainWindow;
