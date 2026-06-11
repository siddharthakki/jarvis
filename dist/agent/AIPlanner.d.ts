import { Plan } from './Plan';
export declare class AIPlanner {
    plan(input: string, context?: any, statusCallback?: (msg: string) => void): Promise<Plan>;
    private modelMap;
    private routeTask;
    private fallbackPlan;
    private extractFilePath;
    private extractDirectoryPath;
    private extractSearchQuery;
}
