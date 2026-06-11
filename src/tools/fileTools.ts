import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import * as fs from 'fs/promises';
import * as path from 'path';

// File reading tool
const readFileTool: Tool = {
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
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const filePath = args.path as string;
    
    try {
      // Read file from the filesystem
      const content = await fs.readFile(filePath, 'utf8');
      return {
        success: true,
        data: content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file'
      };
    }
  }
};

// File writing tool
const writeFileTool: Tool = {
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
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const filePath = args.path as string;
    const content = args.content as string;
    
    try {
      // Write file to the filesystem
      await fs.writeFile(filePath, content, 'utf8');
      return {
        success: true,
        data: `Successfully wrote to ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file'
      };
    }
  }
};

// File appending tool
const appendFileTool: Tool = {
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
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const filePath = args.path as string;
    const content = args.content as string;
    
    try {
      // Append content to file
      await fs.appendFile(filePath, content, 'utf8');
      return {
        success: true,
        data: `Successfully appended to ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to append to file'
      };
    }
  }
};

// List directory tool
const listDirectoryTool: Tool = {
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
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const dirPath = args.path as string;
    
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
        } catch (e) {
          return { name: item, error: 'Access Denied' };
        }
      }));

      // Sort by size descending if they are files, then directories
      const sorted = details.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? 1 : -1;
        return (b.size || 0) - (a.size || 0);
      });

      return {
        success: true,
        data: sorted
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list directory'
      };
    }
  }
};

// Register the tools
ToolRegistry.register(readFileTool);
ToolRegistry.register(writeFileTool);
ToolRegistry.register(appendFileTool);
ToolRegistry.register(listDirectoryTool);

export { readFileTool, writeFileTool, appendFileTool, listDirectoryTool };
