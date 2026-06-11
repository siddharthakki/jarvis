import { RiskLevel } from './PermissionEvaluator';
export declare class RiskClassifier {
    static classifyTool(toolName: string): RiskLevel;
    static classifyCommand(command: string): {
        risk: RiskLevel;
        reason: string;
    };
}
