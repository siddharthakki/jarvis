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
// Load credentials.env before any service initializes
const fs = __importStar(require("fs"));
(function loadCredentials() {
    const credPath = 'C:\\Projects\\credentials.env';
    if (!fs.existsSync(credPath))
        return;
    fs.readFileSync(credPath, 'utf8').split('\n').forEach(line => {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
        if (m)
            process.env[m[1]] = m[2].trim();
    });
    console.log('✓ Credentials loaded from credentials.env');
})();
const electron_1 = require("electron");
const MainWindow_1 = require("./ui/MainWindow");
const AgentRuntime_1 = require("./agent/AgentRuntime");
const MailService_1 = require("./services/MailService");
const ReminderService_1 = require("./services/ReminderService");
const TTSService_1 = require("./services/TTSService");
const Config_1 = require("./config/Config");
const SchedulerService_1 = require("./services/SchedulerService");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
// Disable hardware acceleration to fix potential transparency/rendering issues
electron_1.app.disableHardwareAcceleration();
require("./tools/fileTools");
require("./tools/searchTools");
require("./tools/commandTools");
require("./tools/emailTools");
require("./tools/reminderTools");
require("./tools/deviceTools");
require("./tools/webTools");
require("./tools/visionTools");
require("./tools/systemTools");
require("./tools/schedulerTools");
require("./tools/calendarTools");
require("./tools/knowledgeTools");
require("./tools/imageTools");
require("./tools/ollamaTools");
let mainWindow = null;
let agentRuntime = null;
let pythonProcess = null;
// Create window and initialize agent
electron_1.app.on('ready', () => {
    console.log('🚀 Starting Jarvis Desktop Assistant...');
    // Start Telemetry Bridge
    const bridgePath = path.join(electron_1.app.getAppPath(), 'bridge.py');
    const logPath = path.join(electron_1.app.getAppPath(), 'bridge.log');
    console.log(`Starting Telemetry Bridge from: ${bridgePath}`);
    const startBridge = (cmd) => {
        const proc = (0, child_process_1.spawn)(cmd, [`"${bridgePath}"`], {
            shell: true,
            cwd: electron_1.app.getAppPath()
        });
        proc.stdout.on('data', (data) => {
            const msg = data.toString();
            console.log(`Bridge: ${msg}`);
            fs.appendFileSync(logPath, `[STDOUT] ${msg}\n`);
        });
        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            console.error(`Bridge Error: ${msg}`);
            fs.appendFileSync(logPath, `[STDERR] ${msg}\n`);
        });
        proc.on('close', (code) => {
            console.log(`Bridge process exited with code ${code}`);
            fs.appendFileSync(logPath, `[EXIT] Code ${code}\n`);
        });
        return proc;
    };
    pythonProcess = startBridge('python');
    pythonProcess.on('error', (err) => {
        console.warn('Failed to start bridge with "python", trying "py -3"...');
        pythonProcess = startBridge('py -3');
    });
    // Write example email config on first run so the user knows where to fill credentials
    MailService_1.MailService.writeExampleConfig();
    if (!MailService_1.MailService.isConfigured()) {
        console.warn('JARVIS: Email not configured. Edit ~/.jarvis/email-config.json to enable email tools.');
        // Send notification to window once it's loaded
        setTimeout(() => {
            mainWindow?.getWindow()?.webContents.send('status-update', 'Email not configured — edit ~/.jarvis/email-config.json to enable email features.');
        }, 3000);
    }
    // Boot reminder service and attach Electron Notification as the fire callback
    const reminderService = new ReminderService_1.ReminderService();
    reminderService.setNotifyFn((title, body) => {
        if (electron_1.Notification.isSupported()) {
            new electron_1.Notification({ title, body }).show();
        }
    });
    // Initialize agent
    agentRuntime = new AgentRuntime_1.AgentRuntime();
    console.log('✓ Agent runtime initialized');
    // Configure scheduler service
    SchedulerService_1.schedulerService.setOnTrigger((input) => agentRuntime.processInput(input));
    SchedulerService_1.schedulerService.start();
    // Set autostart setting
    electron_1.app.setLoginItemSettings({ openAtLogin: Config_1.defaultConfig.autostart });
    console.log(`Autostart: ${Config_1.defaultConfig.autostart ? 'enabled' : 'disabled'}`);
    // Set up TTS callback
    agentRuntime.setSpeakCallback((text) => TTSService_1.ttsService.speak(text));
    // Create window
    mainWindow = new MainWindow_1.MainWindow();
    if (agentRuntime) {
        mainWindow.setAgentRuntime(agentRuntime);
        agentRuntime.setMainWindow(mainWindow.getWindow());
    }
    mainWindow.show();
    console.log('✓ Jarvis UI window created');
    console.log('🎯 Jarvis is ready to assist!');
});
// Handle app quit
electron_1.app.on('before-quit', () => {
    console.log('Shutting down Jarvis...');
    TTSService_1.ttsService.stop();
    SchedulerService_1.schedulerService.stop();
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null && electron_1.app.isReady()) {
        agentRuntime = new AgentRuntime_1.AgentRuntime();
        mainWindow = new MainWindow_1.MainWindow();
        if (agentRuntime) {
            mainWindow.setAgentRuntime(agentRuntime);
        }
        mainWindow.show();
    }
});
// Log that main process is ready
console.log('Jarvis Main Process Initialized');
