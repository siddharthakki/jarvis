import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import * as fs from 'fs/promises';
import * as path from 'path';

// Search files tool
const searchFilesTool: Tool = {
  name: 'search_files',
  description: 'Search for files matching a pattern in a directory',
  schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Pattern to search for (e.g., "*.ts", "test*.js")'
      },
      path: {
        type: 'string',
        description: 'Path to search in'
      }
    },
    required: ['pattern', 'path']
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const pattern = args.pattern as string;
    const searchPath = args.path as string;

    try {
       // In a real implementation, we would use a proper file search algorithm
       // For now, we'll simulate it by listing directory contents and filtering
       const items = await fs.readdir(searchPath);
       
       // Simple pattern matching (this is a simplified version)
       const results: string[] = [];
       const regex = new RegExp(pattern.replace(/\*/g, '.*'));
       
       for (const item of items) {
         if (regex.test(item)) {
           results.push(path.join(searchPath, item));
         }
       }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search files'
      };
    }
  }
};

// Register the tool
ToolRegistry.register(searchFilesTool);

export { searchFilesTool };
