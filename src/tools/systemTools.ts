import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { exec } from 'child_process';
import { promisify } from 'util';
import { shell } from 'electron';
import { ttsService } from '../services/TTSService';

const execAsync = promisify(exec);

/**
 * System Control Tool - Volume, Brightness, Apps
 */
const systemControlTool: Tool = {
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
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const action = args.action as string;
    const value = args.value as string;

    try {
      switch (action) {
        case 'stop_speech':
          ttsService.stop();
          return { success: true, data: 'All TTS processes terminated, Sir.' };

        case 'open_url':
          await shell.openExternal(value);
          return { success: true, data: `Opened URL: ${value}` };

        case 'launch_app':
          // Start a process in Windows
          exec(`start "" "${value}"`);
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'System control failure'
      };
    }
  }
};

ToolRegistry.register(systemControlTool);
export { systemControlTool };
