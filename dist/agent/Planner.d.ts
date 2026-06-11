export declare class Planner {
    plan(input: string, context?: any): Promise<Plan>;
    private fallbackPlan;
    private extractFilePath;
    private extractContent;
    private extractSearchPattern;
    private extractSearchPath;
    private extractCommand;
    private extractDirectoryPath;
    private extractGitCommand;
}
export interface Plan {
    actions: Array<{
        toolName: string;
        args: Record<string, any>;
    }>;
    context: Record<string, any>;
}
