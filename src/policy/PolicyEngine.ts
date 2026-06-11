import { RiskLevel } from '../tools/ToolTypes';
import { PermissionEvaluator, PolicyDecision } from './PermissionEvaluator';
import { RiskClassifier } from './RiskClassifier';

export { PolicyDecision };

export class PolicyEngine {
  private evaluator = new PermissionEvaluator();

  evaluate(
    toolName: string,
    args: Record<string, unknown>,
  ): { decision: PolicyDecision; riskLevel: RiskLevel; meta: Record<string, unknown> } {
    let riskLevel = RiskClassifier.classifyTool(toolName);
    const meta: Record<string, unknown> = {};

    if (toolName === 'run_command') {
      const command = String(args['command'] ?? '');
      const classification = RiskClassifier.classifyCommand(command);
      riskLevel = classification.risk;
      meta['commandRisk'] = classification.risk;
      meta['commandReason'] = classification.reason;
    }

    const decision = this.evaluator.evaluate(toolName, riskLevel, meta);
    return { decision, riskLevel, meta };
  }
}