import { ToolContext, ToolResult } from './ToolTypes';
export declare class ToolExecutor {
    execute(toolName: string, args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult>;
}
