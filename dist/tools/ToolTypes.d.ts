export interface Tool {
    name: string;
    description: string;
    schema: any;
    execute: (args: Record<string, unknown>, context?: ToolContext) => Promise<ToolResult>;
    riskLevel: RiskLevel;
    mutatesWorkspace: boolean;
    requiresWorkspace: boolean;
}
export interface ToolContext {
    workspaceRoot: string;
    statusCallback?: (message: string) => void;
    [key: string]: any;
}
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
}
export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
