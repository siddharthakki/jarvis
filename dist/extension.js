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
exports.agent = void 0;
const AgentRuntime_1 = require("./agent/AgentRuntime");
const fileTools_1 = require("./tools/fileTools");
const searchTools_1 = require("./tools/searchTools");
const commandTools_1 = require("./tools/commandTools");
const emailTools_1 = require("./tools/emailTools");
const reminderTools_1 = require("./tools/reminderTools");
const deviceTools_1 = require("./tools/deviceTools");
const ToolRegistry_1 = require("./tools/ToolRegistry");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const electron_1 = require("electron");
// Set autostart
if (electron_1.app) {
    electron_1.app.setLoginItemSettings({
        openAtLogin: true,
        path: electron_1.app.getPath('exe'),
    });
}
// Initialize the Jarvis agent
const agent = new AgentRuntime_1.AgentRuntime();
exports.agent = agent;
// Register tools
ToolRegistry_1.ToolRegistry.register(fileTools_1.readFileTool);
ToolRegistry_1.ToolRegistry.register(fileTools_1.writeFileTool);
ToolRegistry_1.ToolRegistry.register(fileTools_1.listDirectoryTool);
ToolRegistry_1.ToolRegistry.register(searchTools_1.searchFilesTool);
ToolRegistry_1.ToolRegistry.register(commandTools_1.runCommandTool);
ToolRegistry_1.ToolRegistry.register(emailTools_1.sendEmailTool);
ToolRegistry_1.ToolRegistry.register(emailTools_1.readInboxTool);
ToolRegistry_1.ToolRegistry.register(reminderTools_1.setReminderTool);
ToolRegistry_1.ToolRegistry.register(reminderTools_1.getRemindersTool);
ToolRegistry_1.ToolRegistry.register(deviceTools_1.listDevicesTool);
ToolRegistry_1.ToolRegistry.register(deviceTools_1.controlDeviceTool);
ToolRegistry_1.ToolRegistry.register(deviceTools_1.getDeviceStatusTool);
console.log('Jarvis agent initialized successfully');
// Initialize desktop components
let mainWindow = null;
let trayController = null;
let statusBarController = null;
let voiceHandler = null;
// Setup desktop application
try {
    console.log('Starting Telemetry Bridge...');
    const bridgePath = path.join(__dirname, '..', 'bridge.py');
    const pythonProcess = (0, child_process_1.spawn)('python', [bridgePath]);
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
}
catch (error) {
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
    }
    catch (error) {
        console.error('Error running agent test:', error);
    }
}
// Run the test
testAgent();
