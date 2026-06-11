"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngine = void 0;
const PermissionEvaluator_1 = require("./PermissionEvaluator");
const RiskClassifier_1 = require("./RiskClassifier");
class PolicyEngine {
    constructor() {
        this.evaluator = new PermissionEvaluator_1.PermissionEvaluator();
    }
    evaluate(toolName, args) {
        let riskLevel = RiskClassifier_1.RiskClassifier.classifyTool(toolName);
        const meta = {};
        if (toolName === 'run_command') {
            const command = String(args['command'] ?? '');
            const classification = RiskClassifier_1.RiskClassifier.classifyCommand(command);
            riskLevel = classification.risk;
            meta['commandRisk'] = classification.risk;
            meta['commandReason'] = classification.reason;
        }
        const decision = this.evaluator.evaluate(toolName, riskLevel, meta);
        return { decision, riskLevel, meta };
    }
}
exports.PolicyEngine = PolicyEngine;
