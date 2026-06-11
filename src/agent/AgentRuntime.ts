import { ContextManager } from './ContextManager';
import { AIPlanner } from './AIPlanner';
import { PolicyEngine } from '../policy/PolicyEngine';
import { ToolExecutor } from '../tools/ToolExecutor';
import { ApprovalFlow } from '../policy/ApprovalFlow';
import { AutomationEngine } from './AutomationEngine';
import { Plan } from './Plan';
import { vectorService } from '../services/VectorService';

export class AgentRuntime {
  private contextManager: ContextManager;
  private planner: AIPlanner;
  private policyEngine: PolicyEngine;
  private toolExecutor: ToolExecutor;
private approvalFlow: ApprovalFlow;
private automationEngine: AutomationEngine;
private statusCallback?: (message: string) => void;
private speakCallback?: (text: string) => void;

  constructor() {
    this.contextManager = new ContextManager();
    this.planner = new AIPlanner();
    this.policyEngine = new PolicyEngine();
    this.toolExecutor = new ToolExecutor();
    this.approvalFlow = new ApprovalFlow();
    this.automationEngine = new AutomationEngine(
      this.toolExecutor,
      this.policyEngine,
      this.approvalFlow,
      this.contextManager
    );
  }

  setMainWindow(mainWindow: any): void {
    this.approvalFlow.setMainWindow(mainWindow);
  }

  setStatusCallback(callback: (message: string) => void): void {
    this.statusCallback = callback;
  }

  setSpeakCallback(callback: (text: string) => void): void {
    this.speakCallback = callback;
  }

  async processInput(input: string, context?: any): Promise<any> {
    // Merge provided context with managed memory and vector knowledge
    const relevantHistory = await this.contextManager.getRelevantMemory(input);
    const relevantKnowledge = await vectorService.search(input, 3);

    // Limit history to last 2 entries for non-brain roles to prevent context pollution
    const trimmedHistory = Array.isArray(relevantHistory) 
      ? relevantHistory.slice(-2) 
      : relevantHistory;
    
    const fullContext = {
      recentHistory: trimmedHistory,
      relevantKnowledge: relevantKnowledge,
      ...context
    };

    this.statusCallback?.('Processing your request...');

    let iterations = 0;
    const maxIterations = 3;
    let observations: any[] = [];
    let lastPlan: Plan | null = null;
    let allExecutionResults: any[] = [];

    while (iterations < maxIterations) {
      iterations++;

      const currentContext = {
        ...fullContext,
        observations
      };

      const plan = await this.planner.plan(input, currentContext, this.statusCallback);
      lastPlan = plan;

      // If no actions, we are done
      if (!plan.actions || plan.actions.length === 0) {
        break;
      }

      // Execute current plan actions
      const results = await this.executePlan(plan);
      allExecutionResults.push(...results);

      observations.push({
        iteration: iterations,
        plan: plan.actions,
        results: results
      });

      // Simple heuristic: if all actions in this iteration succeeded,
      // and it's a simple task, we might not need to loop back to the model.
      // But for a true ReAct loop, we should let the model see the results.
      // However, to avoid unnecessary calls for simple tasks:
      const allSucceeded = results.every((r: any) => r.success !== false);

      // If the model provided a response AND all tools succeeded,
      // it's likely it considers this the final step.
      if (allSucceeded && plan.response && plan.response.includes('### Result')) {
        // One more check: if it's the first iteration, we can probably stop.
        // If we want to be safe, we always loop back.
        // Let's loop back for now to ensure "self-correcting" capability.
      }

      // If we have failures, we definitely loop back.
    }

    let finalResponse = lastPlan?.response || "Task completed, Sir.";

    // If we ran tools, synthesize a final response using all results
    if (observations.length > 0) {
      this.statusCallback?.('Synthesizing final response...');
      finalResponse = await this.planner.synthesizeFinalResponse(input, lastPlan!, allExecutionResults, fullContext);
    }
    
    // Speak the response if callback is set
    if (finalResponse) {
      this.speakInChunks(finalResponse);
    }

    // Record history
    this.contextManager.addHistory(input, { observations, response: finalResponse });

    return {
      results: allExecutionResults,
      response: finalResponse
    };
  }

private async executePlan(plan: Plan): Promise<any> {
    // Convert plan.actions to AutomationStep[] with canChain: true
    const convertedSteps = plan.actions.map(action => ({
      toolName: action.toolName,
      args: action.args,
      canChain: true
    }));

    // Delegate to AutomationEngine
    return await this.automationEngine.executeWorkflow({
      id: Date.now().toString(),
      name: 'plan',
      steps: convertedSteps
    });
  }

  private speakInChunks(text: string): void {
    if (!this.speakCallback || !text) return;
    // Extract just the ### Result section if present
    const resultMatch = text.match(/###\s*Result\s*\n([\s\S]*?)(?=###|$)/i);
    const speakable = resultMatch ? resultMatch[1].trim() : text;
    // Split on sentence boundaries
    const sentences = speakable.match(/[^.!?]+[.!?]+/g) || [speakable];
    let delay = 0;
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 2) {
        setTimeout(() => this.speakCallback!(trimmed), delay);
        delay += 200; // small stagger so TTS queue doesn't collide
      }
    }
  }
}
