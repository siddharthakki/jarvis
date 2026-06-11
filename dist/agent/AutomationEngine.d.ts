import { ToolExecutor } from '../tools/ToolExecutor';
import { PolicyEngine } from '../policy/PolicyEngine';
import { ApprovalFlow } from '../policy/ApprovalFlow';
import { ContextManager } from './ContextManager';
export interface AutomationStep {
    toolName: string;
    args: Record<string, unknown>;
    canChain?: boolean;
    outputSchema?: Record<string, any>;
    requiresApproval?: boolean;
}
export interface Workflow {
    id: string;
    name: string;
    steps: AutomationStep[];
    context?: Record<string, any>;
}
export declare class AutomationEngine {
    private static readonly MAX_TOOL_CALLS;
    private toolCallCount;
    private toolExecutor;
    private policyEngine;
    private approvalFlow;
    private contextManager;
    constructor(toolExecutor?: ToolExecutor, policyEngine?: PolicyEngine, approvalFlow?: ApprovalFlow, contextManager?: ContextManager);
    /**
     * Execute a single automation step
     */
    executeStep(step: AutomationStep, context?: Record<string, any>): Promise<any>;
    /**
     * Execute a workflow with multiple steps
     */
    executeWorkflow(workflow: Workflow): Promise<any[]>;
    /**
     * Chain tool outputs to create follow-up actions
     */
    chainOutputs(previousResult: any, nextStep: AutomationStep): Promise<any>;
    /**
     * Store and retrieve context for multi-step operations
     */
    storeContext(key: string, data: any): Promise<void>;
    getContext(key: string): Promise<any>;
    /**
     * Execute a single step with full context management
     */
    executeStepWithContext(step: AutomationStep, contextKey?: string): Promise<any>;
    /**
     * Execute a multi-step workflow with full context management
     */
    executeMultiStepWorkflow(steps: AutomationStep[], contextKey?: string): Promise<any[]>;
}
