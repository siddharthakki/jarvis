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
exports.listDirectoryTool = exports.appendFileTool = exports.writeFileTool = exports.readFileTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// File reading tool
const readFileTool = {
    name: 'read_file',
    description: 'Read content from a file',
    schema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path to the file to read'
            }
        },
        required: ['path']
    },
    riskLevel: 'safe',
    mutatesWorkspace: false,
    requiresWorkspace: true,
    async execute(args, context) {
        const filePath = args.path;
        try {
            // Read file from the filesystem
            const content = await fs.readFile(filePath, 'utf8');
            return {
                success: true,
                data: content
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read file'
            };
        }
    }
};
exports.readFileTool = readFileTool;
// File writing tool
const writeFileTool = {
    name: 'write_file',
    description: 'Write content to a file',
    schema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path to the file to write'
            },
            content: {
                type: 'string',
                description: 'Content to write to the file'
            }
        },
        required: ['path', 'content']
    },
    riskLevel: 'high',
    mutatesWorkspace: true,
    requiresWorkspace: true,
    async execute(args, context) {
        const filePath = args.path;
        const content = args.content;
        try {
            // Write file to the filesystem
            await fs.writeFile(filePath, content, 'utf8');
            return {
                success: true,
                data: `Successfully wrote to ${filePath}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to write file'
            };
        }
    }
};
exports.writeFileTool = writeFileTool;
// File appending tool
const appendFileTool = {
    name: 'append_file',
    description: 'Append content to a file',
    schema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path to the file to append to'
            },
            content: {
                type: 'string',
                description: 'Content to append to the file'
            }
        },
        required: ['path', 'content']
    },
    riskLevel: 'high',
    mutatesWorkspace: true,
    requiresWorkspace: true,
    async execute(args, context) {
        const filePath = args.path;
        const content = args.content;
        try {
            // Append content to file
            await fs.appendFile(filePath, content, 'utf8');
            return {
                success: true,
                data: `Successfully appended to ${filePath}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to append to file'
            };
        }
    }
};
exports.appendFileTool = appendFileTool;
// List directory tool
const listDirectoryTool = {
    name: 'list_directory',
    description: 'List contents of a directory with file details (size, type)',
    schema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path to the directory to list'
            }
        },
        required: ['path']
    },
    riskLevel: 'safe',
    mutatesWorkspace: false,
    requiresWorkspace: true,
    async execute(args, context) {
        const dirPath = args.path;
        try {
            const items = await fs.readdir(dirPath);
            const details = await Promise.all(items.map(async (item) => {
                try {
                    const fullPath = path.join(dirPath, item);
                    const stats = await fs.stat(fullPath);
                    return {
                        name: item,
                        isDirectory: stats.isDirectory(),
                        size: stats.size,
                        sizeHuman: stats.isDirectory() ? '--' : `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                        modified: stats.mtime
                    };
                }
                catch (e) {
                    return { name: item, error: 'Access Denied' };
                }
            }));
            // Sort by size descending if they are files, then directories
            const sorted = details.sort((a, b) => {
                if (a.isDirectory !== b.isDirectory)
                    return a.isDirectory ? 1 : -1;
                return (b.size || 0) - (a.size || 0);
            });
            return {
                success: true,
                data: sorted
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list directory'
            };
        }
    }
};
exports.listDirectoryTool = listDirectoryTool;
// Register the tools
ToolRegistry_1.ToolRegistry.register(readFileTool);
ToolRegistry_1.ToolRegistry.register(writeFileTool);
ToolRegistry_1.ToolRegistry.register(appendFileTool);
ToolRegistry_1.ToolRegistry.register(listDirectoryTool);
