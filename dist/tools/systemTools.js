"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemControlTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const child_process_1 = require("child_process");
const util_1 = require("util");
const electron_1 = require("electron");
const TTSService_1 = require("../services/TTSService");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * System Control Tool - Volume, Brightness, Apps
 */
const systemControlTool = {
    name: 'system_control',
    description: 'Control system parameters like volume or launch applications',
    schema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['volume_up', 'volume_down', 'mute', 'launch_app', 'open_url', 'stop_speech'],
                description: 'The action to perform'
            },
            value: {
                type: 'string',
                description: 'App name, URL, or level'
            }
        },
        required: ['action']
    },
    riskLevel: 'medium',
    mutatesWorkspace: false,
    requiresWorkspace: false,
    async execute(args, context) {
        const action = args.action;
        const value = args.value;
        try {
            switch (action) {
                case 'stop_speech':
                    TTSService_1.ttsService.stop();
                    return { success: true, data: 'All TTS processes terminated, Sir.' };
                case 'open_url':
                    await electron_1.shell.openExternal(value);
                    return { success: true, data: `Opened URL: ${value}` };
                case 'launch_app':
                    // Start a process in Windows
                    (0, child_process_1.exec)(`start "" "${value}"`);
                    return { success: true, data: `Initiated launch sequence for ${value}` };
                case 'volume_up':
                    await execAsync('powershell.exe -Command "(new-object -com wscript.shell).SendKeys([char]175)"');
                    return { success: true, data: 'Volume increased' };
                case 'volume_down':
                    await execAsync('powershell.exe -Command "(new-object -com wscript.shell).SendKeys([char]174)"');
                    return { success: true, data: 'Volume decreased' };
                case 'mute':
                    await execAsync('powershell.exe -Command "(new-object -com wscript.shell).SendKeys([char]173)"');
                    return { success: true, data: 'Mute toggled' };
                default:
                    throw new Error('Unknown system command');
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'System control failure'
            };
        }
    }
};
exports.systemControlTool = systemControlTool;
ToolRegistry_1.ToolRegistry.register(systemControlTool);
