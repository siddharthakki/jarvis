export declare class AgentRuntime {
    private contextManager;
    private planner;
    private policyEngine;
    private toolExecutor;
    private approvalFlow;
    private automationEngine;
    private statusCallback?;
    private speakCallback?;
    constructor();
    setMainWindow(mainWindow: any): void;
    setStatusCallback(callback: (message: string) => void): void;
    setSpeakCallback(callback: (text: string) => void): void;
    processInput(input: string, context?: any): Promise<any>;
    private executePlan;
    private speakInChunks;
}
