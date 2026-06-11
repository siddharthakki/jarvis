"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationEngine = void 0;
const ToolExecutor_1 = require("../tools/ToolExecutor");
const PolicyEngine_1 = require("../policy/PolicyEngine");
const ApprovalFlow_1 = require("../policy/ApprovalFlow");
const ContextManager_1 = require("./ContextManager");
class AutomationEngine {
    constructor(toolExecutor, policyEngine, approvalFlow, contextManager) {
        this.toolExecutor = toolExecutor || new ToolExecutor_1.ToolExecutor();
        this.policyEngine = policyEngine || new PolicyEngine_1.PolicyEngine();
        this.approvalFlow = approvalFlow || new ApprovalFlow_1.ApprovalFlow();
        this.contextManager = contextManager || new ContextManager_1.ContextManager();
    }
    /**
     * Execute a single automation step
     */
    async executeStep(step, context) {
        // Get current context
        const currentContext = context || {};
        // Merge context with step arguments
        const mergedArgs = { ...currentContext, ...step.args };
        // Check if approval is required
        let approvalRequired = step.requiresApproval !== false; // Default to true
        // Evaluate policy for this step
        const { decision, riskLevel } = this.policyEngine.evaluate(step.toolName, mergedArgs);
        // If approval is required and the policy says ask, request approval
        if (approvalRequired && decision.action === 'ask') {
            const response = await this.approvalFlow.requestApproval(step.toolName, mergedArgs, decision.reason, riskLevel);
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
    async executeWorkflow(workflow) {
        const results = [];
        let context = workflow.context || {};
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
        }
        catch (error) {
            // Rollback or cleanup if needed
            throw error;
        }
    }
    /**
     * Chain tool outputs to create follow-up actions
     */
    async chainOutputs(previousResult, nextStep) {
        // Create context from previous result
        const context = {};
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
    async storeContext(key, data) {
        this.contextManager.setContext(key, data);
    }
    async getContext(key) {
        // Since getContext returns a copy, we need to get the value properly
        const context = this.contextManager.getContext();
        return context[key];
    }
    /**
     * Execute a single step with full context management
     */
    async executeStepWithContext(step, contextKey) {
        let context = {};
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
    async executeMultiStepWorkflow(steps, contextKey) {
        const results = [];
        let context = {};
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
        }
        catch (error) {
            throw error;
        }
    }
}
exports.AutomationEngine = AutomationEngine;
