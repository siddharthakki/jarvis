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

export class AutomationEngine {
  private toolExecutor: ToolExecutor;
  private policyEngine: PolicyEngine;
  private approvalFlow: ApprovalFlow;
  private contextManager: ContextManager;

  constructor(
    toolExecutor?: ToolExecutor,
    policyEngine?: PolicyEngine,
    approvalFlow?: ApprovalFlow,
    contextManager?: ContextManager
  ) {
    this.toolExecutor = toolExecutor || new ToolExecutor();
    this.policyEngine = policyEngine || new PolicyEngine();
    this.approvalFlow = approvalFlow || new ApprovalFlow();
    this.contextManager = contextManager || new ContextManager();
  }

  /**
   * Execute a single automation step
   */
  async executeStep(step: AutomationStep, context?: Record<string, any>): Promise<any> {
    // Get current context
    const currentContext = context || {};
    
    // Merge context with step arguments
    const mergedArgs = { ...currentContext, ...step.args };
    
    // Check if approval is required
    let approvalRequired = step.requiresApproval !== false; // Default to true
    
    // Evaluate policy for this step
    const { decision, riskLevel } = this.policyEngine.evaluate(
      step.toolName,
      mergedArgs
    );

    // If approval is required and the policy says ask, request approval
    if (approvalRequired && decision.action === 'ask') {
      const response = await this.approvalFlow.requestApproval(
        step.toolName,
        mergedArgs,
        decision.reason,
        riskLevel
      );
      
      if (response !== 'approved') {
        throw new Error(`Step execution denied: ${decision.reason}`);
      }
    }

    // Execute the tool
    const result = await this.toolExecutor.execute(step.toolName, mergedArgs);
    
    return result;
  }

  /**
   * Execute a workflow with multiple steps
   */
  async executeWorkflow(workflow: Workflow): Promise<any[]> {
    const results: any[] = [];
    let context: Record<string, any> = workflow.context || {};
    
    try {
      for (const step of workflow.steps) {
        // Execute the current step
        const result = await this.executeStep(step, context);
        
        // Store result in context for potential chaining
        if (step.canChain !== false) {
          // Add result to context using a naming convention
          const outputKey = step.toolName.replace(/[^a-zA-Z0-9]/g, '_');
          context[outputKey] = result;
          
          // Also add raw result to context with different key
          context[`${outputKey}_result`] = result;
        }
        
        results.push(result);
      }
      
      return results;
    } catch (error) {
      // Rollback or cleanup if needed
      throw error;
    }
  }

  /**
   * Chain tool outputs to create follow-up actions
   */
  async chainOutputs(previousResult: any, nextStep: AutomationStep): Promise<any> {
    // Create context from previous result
    const context: Record<string, any> = {};
    
    if (previousResult && typeof previousResult === 'object') {
      Object.keys(previousResult).forEach(key => {
        context[key] = previousResult[key];
      });
    }
    
    // Execute the next step with chained context
    return await this.executeStep(nextStep, context);
  }

  /**
   * Store and retrieve context for multi-step operations
   */
  async storeContext(key: string, data: any): Promise<void> {
    this.contextManager.setContext(key, data);
  }

  async getContext(key: string): Promise<any> {
    // Since getContext returns a copy, we need to get the value properly
    const context = this.contextManager.getContext();
    return context[key];
  }

  /**
   * Execute a single step with full context management
   */
  async executeStepWithContext(step: AutomationStep, contextKey?: string): Promise<any> {
    let context: Record<string, any> = {};
    
    // If we have a context key, retrieve existing context
    if (contextKey) {
      const storedContext = await this.getContext(contextKey);
      if (storedContext) {
        context = storedContext;
      }
    }
    
    // Execute the step
    const result = await this.executeStep(step, context);
    
    // If we have a context key, update it with new data
    if (contextKey) {
      await this.storeContext(contextKey, { ...context, result });
    }
    
    return result;
  }

  /**
   * Execute a multi-step workflow with full context management
   */
  async executeMultiStepWorkflow(steps: AutomationStep[], contextKey?: string): Promise<any[]> {
    const results: any[] = [];
    let context: Record<string, any> = {};
    
    // Retrieve existing context if key provided
    if (contextKey) {
      const storedContext = await this.getContext(contextKey);
      if (storedContext) {
        context = storedContext;
      }
    }
    
    try {
      for (const step of steps) {
        const result = await this.executeStep(step, context);
        results.push(result);
        
        // Update context with result
        if (step.canChain !== false) {
          const outputKey = step.toolName.replace(/[^a-zA-Z0-9]/g, '_');
          context[outputKey] = result;
        }
      }
      
      // Store updated context if key was provided
      if (contextKey) {
        await this.storeContext(contextKey, context);
      }
      
      return results;
    } catch (error) {
      throw error;
    }
  }
}