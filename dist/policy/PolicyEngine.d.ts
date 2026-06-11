import { RiskLevel } from '../tools/ToolTypes';
import { PolicyDecision } from './PermissionEvaluator';
export { PolicyDecision };
export declare class PolicyEngine {
    private evaluator;
    evaluate(toolName: string, args: Record<string, unknown>): {
        decision: PolicyDecision;
        riskLevel: RiskLevel;
        meta: Record<string, unknown>;
    };
}
