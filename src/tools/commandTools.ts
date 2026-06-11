import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

// Promisify the exec function for easier use with async/await
const execAsync = promisify(exec);

// Run command tool with real implementation
const runCommandTool: Tool = {
  name: 'run_command',
  description: 'Run a shell command with timeout and output capture',
  schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)'
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command'
      }
    },
    required: ['command']
  },
  riskLevel: 'medium', // Medium risk due to potential system access
  mutatesWorkspace: false,
  requiresWorkspace: false,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const command = args.command as string;
    let timeout = args.timeout as number || 60000;
    const cwd = args.cwd as string;

    // Intelligence: If timeout is suspiciously small (e.g. < 1000), assume it was provided in seconds
    if (timeout > 0 && timeout < 1000) {
      timeout = timeout * 1000;
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash';

    try {
      // Execute the command with timeout and explicit shell
      const result = await execAsync(command, {
        timeout: timeout,
        cwd: cwd || undefined,
        shell: shell
      });

      return {
        success: true,
        data: {
          command: command,
          stdout: result.stdout,
          stderr: result.stderr,
          code: 0
        }
      };
    } catch (error: any) {
      // Handle different types of errors
      if (error.code === 'ETIMEDOUT' || error.killed) {
        return {
          success: false,
          error: `Command timed out after ${timeout}ms: ${command}`
        };
      }
      
      if (error.stdout || error.stderr) {
        return {
          success: false,
          error: `Command failed with code ${error.code}: ${error.stderr || error.stdout}`
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute command'
      };
    }
  }
};

// Register the tool
ToolRegistry.register(runCommandTool);

export { runCommandTool };