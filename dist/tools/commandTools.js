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
exports.runCommandTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = __importStar(require("os"));
// Promisify the exec function for easier use with async/await
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Run command tool with real implementation
const runCommandTool = {
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
    riskLevel: 'medium',
    mutatesWorkspace: false,
    requiresWorkspace: false,
    async execute(args, context) {
        const command = args.command;
        let timeout = args.timeout || 60000;
        const cwd = args.cwd;
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
        }
        catch (error) {
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
exports.runCommandTool = runCommandTool;
// Register the tool
ToolRegistry_1.ToolRegistry.register(runCommandTool);
