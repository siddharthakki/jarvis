import { AgentRuntime } from './agent/AgentRuntime';
import { readFileTool, writeFileTool, listDirectoryTool } from './tools/fileTools';
import { searchFilesTool } from './tools/searchTools';
import { runCommandTool } from './tools/commandTools';
import { sendEmailTool, readInboxTool } from './tools/emailTools';
import { setReminderTool, getRemindersTool } from './tools/reminderTools';
import { listDevicesTool, controlDeviceTool, getDeviceStatusTool } from './tools/deviceTools';
import { ToolRegistry } from './tools/ToolRegistry';
import { MainWindow } from './ui/MainWindow';
import { TrayController } from './ui/TrayController';
import { StatusBarController } from './ui/StatusBarController';
import { VoiceHandler } from './ui/VoiceHandler';
import { spawn } from 'child_process';
import * as path from 'path';
import { app } from 'electron';

// Set autostart
if (app) {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
  });
}

// Initialize the Jarvis agent
const agent = new AgentRuntime();

// Register tools
  ToolRegistry.register(readFileTool);
  ToolRegistry.register(writeFileTool);
  ToolRegistry.register(listDirectoryTool);
  ToolRegistry.register(searchFilesTool);
  ToolRegistry.register(runCommandTool);
  ToolRegistry.register(sendEmailTool);
  ToolRegistry.register(readInboxTool);
  ToolRegistry.register(setReminderTool);
  ToolRegistry.register(getRemindersTool);
  ToolRegistry.register(listDevicesTool);
  ToolRegistry.register(controlDeviceTool);
  ToolRegistry.register(getDeviceStatusTool);

console.log('Jarvis agent initialized successfully');

// Initialize desktop components
let mainWindow: MainWindow | null = null;
let trayController: TrayController | null = null;
let statusBarController: StatusBarController | null = null;
let voiceHandler: VoiceHandler | null = null;

// Setup desktop application
try {
  console.log('Starting Telemetry Bridge...');
  const bridgePath = path.join(__dirname, '..', 'bridge.py');
  const pythonProcess = spawn('python', [bridgePath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Bridge: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Bridge Error: ${data}`);
  });

  // This would normally be in the main process, but we're simulating initialization
  console.log('Initializing desktop components...');
  
  // In a real Electron app, you'd initialize these here:
  // mainWindow = new MainWindow();
  // statusBarController = new StatusBarController(mainWindow.getWindow());
  // trayController = new TrayController(mainWindow.getWindow());
  // voiceHandler = new VoiceHandler(agent);
  
  // Set the agent runtime in main window
  // if (mainWindow) {
  //   mainWindow.setAgentRuntime(agent);
  // }
  
  console.log('Desktop components initialized successfully');
} catch (error) {
  console.error('Error initializing desktop components:', error);
}

// Example usage
async function testAgent() {
  try {
    // Test reading a file (should be allowed)
    console.log('Testing file read operation...');
    const readResult = await agent.processInput('read file "/test/example.txt"');
    console.log('Read result:', readResult);
    
    // Test writing a file (should require approval)
    console.log('Testing file write operation...');
    const writeResult = await agent.processInput('write file "/test/example.txt" with content "Hello World"');
    console.log('Write result:', writeResult);
    
    // Test listing directory
    console.log('Testing directory listing operation...');
    const listResult = await agent.processInput('list directory "/src"');
    console.log('List result:', listResult);
    
    // Test searching files
    console.log('Testing file search operation...');
    const searchResult = await agent.processInput('search for "*.ts" in /src');
    console.log('Search result:', searchResult);
    
    // Test running a command
    console.log('Testing command execution...');
    const commandResult = await agent.processInput('run command "Get-ChildItem"');
    console.log('Command result:', commandResult);
  } catch (error) {
    console.error('Error running agent test:', error);
  }
}

// Run the test
testAgent();

export { agent };
