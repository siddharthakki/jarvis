# Jarvis - Technical Specifications

## Overview
This document provides detailed technical specifications for implementing the Jarvis personal assistance desktop application. The specifications are based on the architecture and patterns established in the ollama-agent project but adapted for a desktop environment.

## System Requirements

### Hardware Requirements
- Minimum: 4GB RAM, 2GHz processor, 100MB storage
- Recommended: 8GB RAM, quad-core processor, 500MB+ storage
- Support for microphone input for voice commands
- Network connectivity for AI model access (optional local models)

### Software Requirements
- Node.js 16.x or higher
- TypeScript 4.x or higher
- Electron 20.x or higher (for desktop app)
- Ollama or similar local AI model support
- Web Speech API support in browser environment

## Core Architecture Components

### 1. Agent Runtime System

#### AgentRuntime.ts
```typescript
export class AgentRuntime {
  private contextManager: ContextManager;
  private planner: Planner;
  private policyEngine: PolicyEngine;
  private toolExecutor: ToolExecutor;
  private approvalFlow: ApprovalFlow;
  
  constructor() {
    this.contextManager = new ContextManager();
    this.planner = new Planner();
    this.policyEngine = new PolicyEngine();
    this.toolExecutor = new ToolExecutor();
    this.approvalFlow = new ApprovalFlow();
  }
  
  async processInput(input: string, context?: any): Promise<any> {
    // Process user input through the agent pipeline
    const plan = this.planner.plan(input, context);
    const executionResult = await this.executePlan(plan);
    return executionResult;
  }
  
  private async executePlan(plan: Plan): Promise<any> {
    // Execute planned actions with permission checks
    const results = [];
    
    for (const action of plan.actions) {
      const { decision, riskLevel, meta } = this.policyEngine.evaluate(
        action.toolName, 
        action.args
      );
      
      if (decision.action === 'allow') {
        const result = await this.toolExecutor.execute(action.toolName, action.args);
        results.push(result);
      } else if (decision.action === 'ask') {
        // Request user approval
        const response = await this.approvalFlow.requestApproval(
          action.toolName,
          action.args,
          decision.reason,
          riskLevel
        );
        
        if (response === 'approved') {
          const result = await this.toolExecutor.execute(action.toolName, action.args);
          results.push(result);
        }
      } else if (decision.action === 'deny') {
        throw new Error(`Action denied: ${decision.reason}`);
      }
    }
    
    return results;
  }
}
```

### 2. Permission & Policy System

#### PolicyEngine.ts
```typescript
export class PolicyEngine {
  private evaluator: PermissionEvaluator;
  
  constructor() {
    this.evaluator = new PermissionEvaluator();
  }
  
  evaluate(
    toolName: string,
    args: Record<string, unknown>
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
```

#### PermissionEvaluator.ts
```typescript
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
      if (Config.getRequireApprovalForWrites()) {
        return { action: 'ask', reason: 'File write operations require user approval.' };
      }
      return { action: 'allow', reason: 'File write permitted.' };
    }
    
    // Handle command execution
    if (toolName === 'run_command') {
      const commandRisk = (meta?.commandRisk as RiskLevel) ?? riskLevel;
      if (commandRisk === 'critical') {
        return { action: 'deny', reason: 'Command is denied.' };
      }
      if (commandRisk === 'low' && !Config.getRequireApprovalForCommands()) {
        return { action: 'allow', reason: 'Low-risk command permitted without approval.' };
      }
      return { action: 'ask', reason: 'Command requires user approval.' };
    }
    
    return { action: 'ask', reason: 'Unknown tool requires explicit approval.' };
  }
}
```

### 3. Tool System

#### ToolRegistry.ts
```typescript
export class ToolRegistry {
  private static registry = new Map<string, RegisteredTool>();
  
  static register(
    name: string,
    execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>,
    riskLevel: RiskLevel,
    mutatesWorkspace: boolean,
    requiresWorkspace: boolean
  ): void {
    this.registry.set(name, { 
      schema: this.getSchema(name), 
      execute, 
      riskLevel, 
      mutatesWorkspace, 
      requiresWorkspace 
    });
  }
  
  static get(name: string): RegisteredTool | undefined {
    return this.registry.get(name);
  }
  
  static all(): RegisteredTool[] {
    return Array.from(this.registry.values());
  }
}
```

### 4. Service Layer

#### FileService.ts
```typescript
export class FileService {
  async readFile(path: string, options?: { start?: number; end?: number }): Promise<string> {
    // Implementation with permission checks
    const { decision } = this.policyEngine.evaluate('read_file', { path });
    
    if (decision.action !== 'allow') {
      throw new Error('Read access denied');
    }
    
    return fs.readFileSync(path, 'utf8');
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    // Implementation with permission checks
    const { decision } = this.policyEngine.evaluate('write_file', { path });
    
    if (decision.action === 'ask') {
      // Request approval
      const response = await this.approvalFlow.requestApproval(
        'write_file',
        { path },
        'File write operation requested',
        'medium'
      );
      
      if (response !== 'approved') {
        throw new Error('Write access denied');
      }
    } else if (decision.action === 'deny') {
      throw new Error('Write access denied');
    }
    
    fs.writeFileSync(path, content);
  }
}
```

### 5. User Interface Components

#### StatusBarController.ts
```typescript
export class StatusBarController {
  private statusBarItem: vscode.StatusBarItem;
  
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.text = '$(zap) Jarvis';
    this.statusBarItem.tooltip = 'Jarvis Personal Assistant';
    this.statusBarItem.show();
  }
  
  updateStatus(text: string) {
    this.statusBarItem.text = `$(zap) Jarvis: ${text}`;
  }
  
  dispose() {
    this.statusBarItem.dispose();
  }
}
```

## Data Models

### ApprovalRequest
```typescript
export interface ApprovalRequest {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  reason: string;
  riskLevel: string;
}
```

### PolicyDecision
```typescript
export type PolicyDecision =
  | { action: 'allow'; reason: string }
  | { action: 'ask'; reason: string }
  | { action: 'deny'; reason: string };
```

## Configuration Schema

### Config.ts
```typescript
export class Config {
  static getRequireApprovalForWrites(): boolean {
    return vscode.workspace.getConfiguration('jarvis').get('requireApprovalForWrites', true);
  }
  
  static getRequireApprovalForCommands(): boolean {
    return vscode.workspace.getConfiguration('jarvis').get('requireApprovalForCommands', true);
  }
  
  static getEnableAuditLog(): boolean {
    return vscode.workspace.getConfiguration('jarvis').get('enableAuditLog', true);
  }
  
  static getListenMode(): 'always' | 'hotword' | 'manual' {
    return vscode.workspace.getConfiguration('jarvis').get('listenMode', 'hotword');
  }
}
```

## Security Features

### Audit Logging
All actions are logged with:
- Timestamp
- Tool name and parameters
- User approval status
- Risk level classification
- Execution result

### Permission Controls
- Read-only operations always permitted
- Write operations require explicit approval
- System commands require approval based on risk level
- Workspace boundaries enforced
- Sensitive data handling with encryption

## Voice Recognition Integration

### VoiceHandler.ts
```typescript
export class VoiceHandler {
  private recognition: any;
  
  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.setupRecognition();
    }
  }
  
  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event: any) => {
      // Process voice input
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .join('');
      
      this.processVoiceInput(transcript);
    };
  }
  
  startListening() {
    if (this.recognition) {
      this.recognition.start();
    }
  }
  
  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
```

## Performance Considerations

### Memory Management
- Efficient context cleanup after operations
- Caching of frequently accessed data
- Garbage collection optimization
- Background task management

### Resource Usage
- Low power consumption in idle mode
- Optimized AI model usage
- Efficient file system operations
- Network resource management

## Error Handling

### Graceful Degradation
- Fallback to basic functionality when AI models unavailable
- Continue operation with reduced capabilities
- Clear error messages for user understanding
- Automatic recovery from common failures

### Logging and Monitoring
- Comprehensive error logging
- Performance monitoring
- User feedback mechanisms
- Debug information for troubleshooting

## Testing Strategy

### Unit Tests
- Individual component testing
- Policy evaluation testing
- Tool execution verification
- Permission system validation

### Integration Tests
- End-to-end workflow testing
- Cross-component communication
- Voice recognition accuracy
- Security feature validation

### User Acceptance Testing
- Real-world usage scenarios
- Performance benchmarks
- Usability assessment
- Privacy compliance verification

## Deployment Considerations

### Installation Package
- Cross-platform compatibility (Windows, macOS, Linux)
- Automatic update mechanism
- System integration for startup
- Permission management during installation

### Privacy Compliance
- Clear privacy policy documentation
- User consent for data collection
- Data encryption for sensitive information
- Opt-out mechanisms for features

## Future Extensibility

### Plugin Architecture
- Modular tool system
- Third-party service integration
- Custom command extensions
- Community-driven development

### AI Model Support
- Multiple model provider compatibility
- Local model support
- Cloud model integration
- Model version management