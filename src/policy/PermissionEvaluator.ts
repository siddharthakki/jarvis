export type PolicyDecision =
  | { action: 'allow'; reason: string }
  | { action: 'ask'; reason: string }
  | { action: 'deny'; reason: string };

export class PermissionEvaluator {
  evaluate(toolName: string, riskLevel: RiskLevel, meta?: Record<string, unknown>): PolicyDecision {
    // Implementation based on risk level and configuration
    if (riskLevel === 'critical') {
      return { action: 'deny', reason: 'Tool or command is classified as critical risk and is always denied.' };
    }
    
    // Check for always-allow tools
    if (ALWAYS_ALLOW_TOOLS.has(toolName)) {
      return { action: 'allow', reason: 'Read-only tool always permitted.' };
    }
    
    // Handle write operations
    if (WRITE_TOOLS.has(toolName)) {
      return { action: 'ask', reason: 'File write operations require user approval.' };
    }
    
    // Handle command execution
    if (toolName === 'run_command') {
      const commandRisk = (meta?.commandRisk as RiskLevel) ?? riskLevel;
      if (commandRisk === 'critical') {
        return { action: 'deny', reason: 'Destructive command detected and automatically blocked.' };
      }
      return { action: 'ask', reason: 'System command execution requires your authorization, Sir.' };
    }
    
    return { action: 'ask', reason: 'Unknown tool requires explicit approval.' };
  }
}

// Define tools that are always allowed
const ALWAYS_ALLOW_TOOLS = new Set([
  'read_file',
  'search_files',
  'list_directory',
  'git_status',
  'git_diff',
  'git_log',
  'git_branch'
]);

// Define tools that mutate workspace
const WRITE_TOOLS = new Set([
  'write_file',
  'create_directory',
  'replace_in_file',
  'apply_patch',
  'propose_file_change',
  'delete_file',
  'move_file'
]);

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';