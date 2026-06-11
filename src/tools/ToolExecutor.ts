import { ToolRegistry } from './ToolRegistry';
import { ToolContext, ToolResult } from './ToolTypes';

export class ToolExecutor {
  async execute(
    toolName: string,
    args: Record<string, unknown>,
    context?: ToolContext
  ): Promise<ToolResult> {
    const tool = ToolRegistry.get(toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`
      };
    }
    
    try {
      const result = await tool.execute(args, context);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}