# Jarvis Project Structure

## Overview
This document outlines the complete project structure for the Jarvis personal assistance desktop application. The structure follows modular design principles and is based on the established patterns from the ollama-agent project.

## Directory Layout

```
Jarvis/
├── src/
│   ├── agent/
│   │   ├── AgentRuntime.ts
│   │   ├── ContextManager.ts
│   │   ├── Planner.ts
│   │   ├── ModelRouter.ts
│   │   └── SessionStore.ts
│   ├── policy/
│   │   ├── PolicyEngine.ts
│   │   ├── PermissionEvaluator.ts
│   │   ├── ApprovalFlow.ts
│   │   ├── RiskClassifier.ts
│   │   └── EnterprisePolicyLoader.ts
│   ├── services/
│   │   ├── FileService.ts
│   │   ├── CommandService.ts
│   │   ├── MailService.ts
│   │   ├── ReminderService.ts
│   │   ├── DeviceService.ts
│   │   ├── AuditService.ts
│   │   ├── WorkspaceSecurity.ts
│   │   └── SecretScanner.ts
│   ├── tools/
│   │   ├── ToolRegistry.ts
│   │   ├── ToolExecutor.ts
│   │   ├── ToolSchemas.ts
│   │   ├── ToolTypes.ts
│   │   ├── fileTools.ts
│   │   ├── terminalTool.ts
│   │   ├── searchTools.ts
│   │   └── gitTools.ts
│   ├── ui/
│   │   ├── StatusBarController.ts
│   │   ├── NotificationSystem.ts
│   │   ├── VoiceHandler.ts
│   │   └── UserInterface.ts
│   ├── config/
│   │   ├── Config.ts
│   │   ├── ConfigSchema.ts
│   │   └── Defaults.ts
│   ├── hooks/
│   │   ├── HookEngine.ts
│   │   └── HookTypes.ts
│   ├── prompts/
│   │   ├── systemPrompt.ts
│   │   ├── planningPrompt.ts
│   │   └── reviewPrompt.ts
│   ├── models/
│   │   ├── ModelCapabilities.ts
│   │   └── OllamaClient.ts
│   └── extension.ts
├── package.json
├── tsconfig.json
├── README.md
├── architecture.md
├── implementation-plan.md
└── technical-specs.md
```

## Core Source Files

### Agent Module (`src/agent/`)
- **AgentRuntime.ts**: Main execution engine that orchestrates all components
- **ContextManager.ts**: Manages conversation context and state persistence
- **Planner.ts**: Determines next steps based on user input and current context
- **ModelRouter.ts**: Routes requests to appropriate AI models
- **SessionStore.ts**: Handles session management and data persistence

### Policy Module (`src/policy/`)
- **PolicyEngine.ts**: Main policy evaluation system that coordinates with other policy components
- **PermissionEvaluator.ts**: Makes decisions on whether to allow, ask for approval, or deny actions
- **ApprovalFlow.ts**: Handles user approval requests for potentially risky operations
- **RiskClassifier.ts**: Categorizes tools and commands by risk level
- **EnterprisePolicyLoader.ts**: Loads custom policies for enterprise environments

### Services Module (`src/services/`)
- **FileService.ts**: File system operations with permission controls
- **CommandService.ts**: Execution of system commands with safety measures
- **MailService.ts**: Email management capabilities
- **ReminderService.ts**: Task and event management
- **DeviceService.ts**: Interaction with connected devices
- **AuditService.ts**: Log all actions and decisions for security and debugging
- **WorkspaceSecurity.ts**: Ensure secure workspace handling
- **SecretScanner.ts**: Detect sensitive information in operations

### Tools Module (`src/tools/`)
- **ToolRegistry.ts**: Central registry of available tools with metadata
- **ToolExecutor.ts**: Executes registered tools with proper parameter handling
- **ToolSchemas.ts**: Defines tool interfaces and expected parameters
- **ToolTypes.ts**: Type definitions for tools and their capabilities
- **fileTools.ts**: File system related tools (read, write, search)
- **terminalTool.ts**: Terminal/command execution tools
- **searchTools.ts**: Search functionality across files and content
- **gitTools.ts**: Git integration tools

### UI Module (`src/ui/`)
- **StatusBarController.ts**: Desktop application status bar management
- **NotificationSystem.ts**: System notifications for alerts and approvals
- **VoiceHandler.ts**: Voice recognition and processing capabilities
- **UserInterface.ts**: Main user interface components

### Configuration Module (`src/config/`)
- **Config.ts**: Configuration management with VSCode integration
- **ConfigSchema.ts**: Schema validation for configuration options
- **Defaults.ts**: Default configuration values

### Hooks Module (`src/hooks/`)
- **HookEngine.ts**: System hooks and event handling
- **HookTypes.ts**: Type definitions for system hooks

### Prompts Module (`src/prompts/`)
- **systemPrompt.ts**: System-level instructions for the AI agent
- **planningPrompt.ts**: Instructions for planning actions
- **reviewPrompt.ts**: Instructions for reviewing completed tasks

### Models Module (`src/models/`)
- **ModelCapabilities.ts**: Defines capabilities of different AI models
- **OllamaClient.ts**: Client for connecting to Ollama or similar local AI models

## Configuration Files

### package.json
```json
{
  "name": "jarvis-desktop-assistant",
  "version": "1.0.0",
  "description": "Personal assistance desktop app with always-listening capabilities",
  "main": "dist/extension.js",
  "scripts": {
    "build": "tsc -p .",
    "watch": "tsc -w -p .",
    "test": "jest"
  },
  "dependencies": {
    "typescript": "^4.0.0",
    "electron": "^20.0.0",
    "vscode": "^1.1.37"
  },
  "devDependencies": {
    "@types/node": "^14.0.0",
    "@types/vscode": "^1.1.37"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

## Key Design Principles

### Modularity
- Each component has a single responsibility
- Clear separation of concerns between modules
- Easy to test and maintain individual components

### Security First
- All potentially dangerous operations require explicit user approval
- Permission system built into core architecture
- Audit logging for all actions
- Secure handling of sensitive data

### Extensibility
- Plugin architecture for adding new tools and services
- Modular design allows for easy feature additions
- Configuration-based approach to customize behavior

### Performance
- Efficient memory management
- Optimized AI model usage
- Background processing capabilities
- Resource-conscious design

## Implementation Roadmap

### Phase 1: Core Architecture (Weeks 1-2)
1. Set up project structure and build system
2. Implement core agent components (AgentRuntime, ContextManager, Planner)
3. Create policy and permission systems
4. Build tool registry and execution framework

### Phase 2: Services & Tools (Weeks 3-4)
1. Implement file service and related tools
2. Add command execution capabilities
3. Develop mail and reminder services
4. Create device control functionality

### Phase 3: User Interface (Weeks 5-6)
1. Build desktop UI components
2. Implement voice recognition system
3. Create notification and status systems
4. Add configuration interface

### Phase 4: Integration & Testing (Weeks 7-8)
1. Integrate all components into cohesive application
2. Conduct comprehensive testing
3. Optimize performance
4. Prepare for deployment

## Security Considerations

### Permission Model
- **Safe operations**: Always allowed without approval
- **Medium operations**: Require user approval before execution
- **Critical operations**: Never allowed without explicit permission

### Data Protection
- All sensitive data encrypted at rest
- Secure communication protocols
- Audit logging of all actions
- User-controlled access to system resources

### Privacy Controls
- Clear privacy policy and user consent mechanisms
- Opt-out capabilities for data collection
- Transparent operation of all features
- Compliance with relevant privacy regulations

This project structure provides a solid foundation for building a comprehensive personal assistance desktop application that can run continuously, listen for commands, and manage various system tools while maintaining strict security controls.