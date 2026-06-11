export type PolicyDecision = {
    action: 'allow';
    reason: string;
} | {
    action: 'ask';
    reason: string;
} | {
    action: 'deny';
    reason: string;
};
export declare class PermissionEvaluator {
    evaluate(toolName: string, riskLevel: RiskLevel, meta?: Record<string, unknown>): PolicyDecision;
}
export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
