# Jarvis Implementation Details

## Overview
This document describes the implementation of the Jarvis desktop assistant, a personal assistance application with always-listening capabilities that can execute commands and manage files while maintaining security through a policy engine.

## Architecture Components

### 1. Agent Runtime (`AgentRuntime.ts`)
The core component that orchestrates the agent's functionality by managing:
- Context management
- Planning of actions
- Policy enforcement
- Tool execution
- Approval flow handling

### 2. Planner (`Planner.ts`)
Responsible for interpreting natural language input and converting it into actionable tool commands:
- Enhanced natural language understanding
- Better pattern matching for various command types
- Support for file operations, search, and command execution

### 3. Policy Engine (`PolicyEngine.ts`)
Enforces security policies by evaluating risks and making decisions:
- Integrates with Permission Evaluator and Risk Classifier
- Makes decisions on tool execution based on risk levels
- Handles approval flows for high-risk operations

### 4. Risk Classification (`RiskClassifier.ts`)
Classifies tools and commands by risk level:
- Safe: Read-only operations
- Low: File creation/modification
- Medium: Command execution
- High: System modification operations
- Critical: Destructive system operations

### 5. Permission Evaluator (`PermissionEvaluator.ts`)
Makes final decisions on tool execution based on:
- Tool risk levels
- Configuration settings
- Predefined allow/deny lists
- Approval requirements for specific operations

### 6. Tool Management
#### Tool Registry (`ToolRegistry.ts`)
Central registry for all available tools with registration and retrieval capabilities.

#### Tool Types (`ToolTypes.ts`)
Defines the interface for tools including:
- Tool name and description
- Execution schema
- Risk level classification
- Workspace requirements

#### Tool Executors (`ToolExecutor.ts`)
Executes registered tools with proper error handling.

### 7. Tools Implemented
#### File Operations
- `read_file`: Read content from files (safe)
- `write_file`: Write content to files (low risk)
- `search_files`: Search for files matching patterns (safe)
- `list_directory`: List directory contents (safe)

#### Command Execution
- `run_command`: Execute shell commands (medium risk)

#### System Operations
- `create_directory`: Create new directories (low risk)
- `delete_file`: Delete files (high risk)
- `move_file`: Move files (high risk)
- `chmod`: Change file permissions (high risk)

## Key Improvements Made

1. **Enhanced Natural Language Processing**: Improved input parsing with better pattern matching for various command types
2. **Expanded Tool Set**: Added search_files and run_command tools to complement existing file operations
3. **Sophisticated Risk Classification**: More granular risk levels with better categorization of system commands
4. **Improved Approval Flow**: Better handling of different risk levels with appropriate simulation behavior
5. **Comprehensive Testing**: Added test infrastructure for verifying functionality

## Security Model

The agent implements a multi-layered security approach:
1. **Risk Classification**: Tools are classified by risk level
2. **Policy Enforcement**: Decisions made based on risk and configuration
3. **Approval Flow**: High-risk operations require explicit approval
4. **Workspace Isolation**: Tools can be configured to require workspace access

## Usage Examples

### File Operations
```
read file "/path/to/file.txt"
write file "/path/to/newfile.txt" with content "Hello World"
search for "*.ts" in /src
```

### Command Execution
```
run command "ls -la"
run command "npm install"
```

## Future Enhancements

1. **AI Integration**: Implement natural language understanding using AI models
2. **Enhanced UI**: Add proper Electron/VSCode UI components for notifications
3. **Configuration Management**: Allow user-defined policies and preferences
4. **Logging & Auditing**: Implement comprehensive logging of all operations
5. **Plugin System**: Support for external tool plugins
6. **Voice Recognition**: Integration with voice input capabilities

## Build Process

The project uses TypeScript compilation:
1. Run `npm run build` to compile TypeScript files
2. Run `npm run watch` to enable continuous compilation
3. Run `npm test` to execute tests

## Dependencies

- TypeScript 4.0+
- Electron 20.0+ (for desktop application)
- VSCode API support