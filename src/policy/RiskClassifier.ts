import { RiskLevel } from './PermissionEvaluator';

export class RiskClassifier {
  static classifyTool(toolName: string): RiskLevel {
    // Classify tools by risk level
    switch (toolName) {
      case 'read_file':
      case 'search_files':
      case 'list_directory':
      case 'git_status':
      case 'git_diff':
      case 'git_log':
        return 'safe';
      
      case 'write_file':
        return 'high';
      
      case 'create_directory':
      case 'replace_in_file':
        return 'low';
      
      case 'run_command':
        return 'medium';
      
      case 'delete_file':
      case 'move_file':
      case 'chmod':
      case 'chown':
      case 'kill':
        return 'high';
      
      case 'format_drive':
      case 'shutdown_system':
      case 'reboot_system':
        return 'critical';
      
      default:
        return 'medium'; // Default to medium risk for unknown tools
    }
  }

  static classifyCommand(command: string): { risk: RiskLevel; reason: string } {
    // Classify commands by risk level
    const lowerCommand = command.toLowerCase();

    // Critical risk checks (destructive actions)
    // Refined 'format' to catch 'format c:' but allow 'format-table' or 'format-list'
    const isDestructiveFormat = lowerCommand.includes('format ') && !lowerCommand.includes('format-');

    if (lowerCommand.includes('rm -rf') ||
        isDestructiveFormat ||
        lowerCommand.includes('shutdown') ||
        lowerCommand.includes('reboot')) {
      return { risk: 'critical', reason: 'Potentially destructive system command' };
    }
    
    if (lowerCommand.includes('sudo') ||
        lowerCommand.includes('chmod') ||
        lowerCommand.includes('chown') ||
        lowerCommand.includes('kill')) {
      return { risk: 'high', reason: 'System administration command' };
    }
    
    if (lowerCommand.includes('git') ||
        lowerCommand.includes('npm') ||
        lowerCommand.includes('pip') ||
        lowerCommand.includes('docker') ||
        lowerCommand.includes('kubectl') ||
        lowerCommand.includes('get-childitem') ||
        lowerCommand.includes('select-object') ||
        lowerCommand.includes('sort-object')) {
      return { risk: 'medium', reason: 'Technical or PowerShell operation' };
    }
    
    if (lowerCommand.includes('echo') ||
        lowerCommand.includes('cat') ||
        lowerCommand.includes('ls') ||
        lowerCommand.includes('dir') ||
        lowerCommand.includes('grep') ||
        lowerCommand.includes('find')) {
      return { risk: 'low', reason: 'Basic reconnaissance command' };
    }
    
    return { risk: 'medium', reason: 'Unknown command type' };
  }
}