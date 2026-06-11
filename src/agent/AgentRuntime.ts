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
      ...context
    };

    this.statusCallback?.('Processing your request...');

    // Process user input through the agent pipeline
    const plan = await this.planner.plan(input, fullContext, this.statusCallback);
    const executionResults = await this.executePlan(plan);
    
    // Speak the response if callback is set
    if (plan.response) {
      this.speakInChunks(plan.response);
    }

    // Record history
    this.contextManager.addHistory(input, { plan, results: executionResults });

    return {
      results: executionResults,
      response: plan.response || "Task completed, sir."
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
