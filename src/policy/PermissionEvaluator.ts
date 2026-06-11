import { Config } from '../config/Config';
import { RiskLevel } from '../tools/ToolTypes';

export type PolicyDecision =
  | { action: 'allow'; reason: string }
  | { action: 'ask'; reason: string }
  | { action: 'deny'; reason: string };

export class PermissionEvaluator {
  evaluate(toolName: string, riskLevel: RiskLevel, meta?: Record<string, unknown>): PolicyDecision {
    const config = Config.getInstance();
    const alwaysAllow = config.get('alwaysAllow') || [];
    const requireApprovalFor = config.get('requireApprovalFor') || [];
    const denyList = config.get('denyList') || [];

    // 1. Check Deny List
    if (denyList.includes(toolName)) {
      return { action: 'deny', reason: `Tool '${toolName}' is explicitly blacklisted in security configuration.` };
    }

    // 2. Critical Risk check
    if (riskLevel === 'critical') {
      return { action: 'deny', reason: 'Tool or command is classified as critical risk and is automatically blocked.' };
    }

    // 3. Command specific logic
    if (toolName === 'run_command') {
      const commandRisk = (meta?.commandRisk as RiskLevel) ?? riskLevel;
      if (commandRisk === 'critical') {
        return { action: 'deny', reason: 'Destructive command detected and automatically blocked.' };
      }
      if (commandRisk === 'high' || requireApprovalFor.includes('run_command')) {
         return { action: 'ask', reason: 'System command execution requires your authorization, Sir.' };
      }
    }

    // 4. Check Always Allow
    if (alwaysAllow.includes(toolName)) {
      return { action: 'allow', reason: 'Tool is configured as always allowed.' };
    }

    // 5. Check Require Approval
    if (requireApprovalFor.includes(toolName)) {
      return { action: 'ask', reason: `Execution of '${toolName}' requires user approval per security policy.` };
    }

    // 6. Default based on risk level if not explicitly configured
    if (riskLevel === 'safe' || riskLevel === 'low') {
        return { action: 'allow', reason: `Tool is classified as ${riskLevel} risk and not explicitly restricted.` };
    }

    return { action: 'ask', reason: `Tool '${toolName}' (Risk: ${riskLevel}) requires explicit approval.` };
  }
}
