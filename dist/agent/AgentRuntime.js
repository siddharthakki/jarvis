"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
const ContextManager_1 = require("./ContextManager");
const AIPlanner_1 = require("./AIPlanner");
const PolicyEngine_1 = require("../policy/PolicyEngine");
const ToolExecutor_1 = require("../tools/ToolExecutor");
const ApprovalFlow_1 = require("../policy/ApprovalFlow");
const AutomationEngine_1 = require("./AutomationEngine");
const VectorService_1 = require("../services/VectorService");
class AgentRuntime {
    constructor() {
        this.contextManager = new ContextManager_1.ContextManager();
        this.planner = new AIPlanner_1.AIPlanner();
        this.policyEngine = new PolicyEngine_1.PolicyEngine();
        this.toolExecutor = new ToolExecutor_1.ToolExecutor();
        this.approvalFlow = new ApprovalFlow_1.ApprovalFlow();
        this.automationEngine = new AutomationEngine_1.AutomationEngine(this.toolExecutor, this.policyEngine, this.approvalFlow, this.contextManager);
    }
    setMainWindow(mainWindow) {
        this.approvalFlow.setMainWindow(mainWindow);
    }
    setStatusCallback(callback) {
        this.statusCallback = callback;
    }
    setSpeakCallback(callback) {
        this.speakCallback = callback;
    }
    async processInput(input, context) {
        // Merge provided context with managed memory and vector knowledge
        const relevantHistory = await this.contextManager.getRelevantMemory(input);
        const relevantKnowledge = await VectorService_1.vectorService.search(input, 3);
        const fullContext = {
            ...this.contextManager.getMemory(),
            relevantHistory,
            relevantKnowledge,
            ...context
        };
        this.statusCallback?.('Processing your request...');
        // Process user input through the agent pipeline
        const plan = await this.planner.plan(input, fullContext, this.statusCallback);
        const executionResults = await this.executePlan(plan);
        // Speak the response if callback is set
        if (this.speakCallback && plan.response) {
            this.speakCallback(plan.response);
        }
        // Record history
        this.contextManager.addHistory(input, { plan, results: executionResults });
        return {
            results: executionResults,
            response: plan.response || "Task completed, sir."
        };
    }
    async executePlan(plan) {
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
}
exports.AgentRuntime = AgentRuntime;
