// Load credentials.env before any service initializes
import * as fs from 'fs';
(function loadCredentials() {
  const credPath = 'C:\\Projects\\credentials.env';
  if (!fs.existsSync(credPath)) return;
  fs.readFileSync(credPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  });
  console.log('✓ Credentials loaded from credentials.env');
})();

import { app, BrowserWindow, Notification } from 'electron';
import { MainWindow } from './ui/MainWindow';
import { AgentRuntime } from './agent/AgentRuntime';
import { ToolRegistry } from './tools/ToolRegistry';
import { MailService } from './services/MailService';
import { ReminderService } from './services/ReminderService';
import { ttsService } from './services/TTSService';
import { defaultConfig } from './config/Config';
import { SchedulerService, schedulerService } from './services/SchedulerService';
import { spawn } from 'child_process';
import * as path from 'path';

// Disable hardware acceleration to fix potential transparency/rendering issues
app.disableHardwareAcceleration();

import './tools/fileTools';
import './tools/searchTools';
import './tools/commandTools';
import './tools/emailTools';
import './tools/reminderTools';
import './tools/deviceTools';
import './tools/webTools';
import './tools/visionTools';
import './tools/systemTools';
import './tools/schedulerTools';
import './tools/calendarTools';
import './tools/knowledgeTools';
import './tools/imageTools';
import './tools/ollamaTools';

let mainWindow: MainWindow | null = null;
let agentRuntime: AgentRuntime | null = null;
let pythonProcess: any = null;

// Create window and initialize agent
app.on('ready', () => {
  console.log('🚀 Starting Jarvis Desktop Assistant...');

  // Start Telemetry Bridge
  const bridgePath = path.join(app.getAppPath(), 'bridge.py');
  const logPath = path.join(app.getAppPath(), 'bridge.log');

  console.log(`Starting Telemetry Bridge from: ${bridgePath}`);

  const startBridge = (cmd: string) => {
    const proc = spawn(cmd, [`"${bridgePath}"`], {
      shell: true,
      cwd: app.getAppPath()
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

  pythonProcess.on('error', (err: any) => {
    console.warn('Failed to start bridge with "python", trying "py -3"...');
    pythonProcess = startBridge('py -3');
  });

  // Write example email config on first run so the user knows where to fill credentials
  MailService.writeExampleConfig();

  if (!MailService.isConfigured()) {
    console.warn('JARVIS: Email not configured. Edit ~/.jarvis/email-config.json to enable email tools.');
    // Send notification to window once it's loaded
    setTimeout(() => {
      mainWindow?.getWindow()?.webContents.send('status-update',
        'Email not configured — edit ~/.jarvis/email-config.json to enable email features.');
    }, 3000);
  }

  // Boot reminder service and attach Electron Notification as the fire callback
  const reminderService = new ReminderService();
  reminderService.setNotifyFn((title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

// Initialize agent
  agentRuntime = new AgentRuntime();
  console.log('✓ Agent runtime initialized');
  
  // Configure scheduler service
  schedulerService.setOnTrigger((input: string) => agentRuntime!.processInput(input));
  schedulerService.start();
  
  // Set autostart setting
  app.setLoginItemSettings({ openAtLogin: defaultConfig.autostart });
  console.log(`Autostart: ${defaultConfig.autostart ? 'enabled' : 'disabled'}`);
  
  // Set up TTS callback
  agentRuntime.setSpeakCallback((text) => ttsService.speak(text));

  // Create window
  mainWindow = new MainWindow();
  if (agentRuntime) {
    mainWindow.setAgentRuntime(agentRuntime);
    agentRuntime.setMainWindow(mainWindow.getWindow());
  }
  mainWindow.show();

  console.log('✓ Jarvis UI window created');
  console.log('🎯 Jarvis is ready to assist!');
});

// Handle app quit
app.on('before-quit', () => {
  console.log('Shutting down Jarvis...');
  ttsService.stop();
  schedulerService.stop();
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null && app.isReady()) {
    agentRuntime = new AgentRuntime();
    mainWindow = new MainWindow();
    if (agentRuntime) {
      mainWindow.setAgentRuntime(agentRuntime);
    }
    mainWindow.show();
  }
});

// Log that main process is ready
console.log('Jarvis Main Process Initialized');
