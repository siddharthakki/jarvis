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
    
    // Validate required args are not undefined/null
    const required = tool.schema?.required || [];
    const missingArgs = required.filter((key: string) => args[key] === undefined || args[key] === null || args[key] === 'undefined');
    if (missingArgs.length > 0) {
      return {
        success: false,
        error: `Skipped ${toolName}: missing required args: ${missingArgs.join(', ')}`
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
