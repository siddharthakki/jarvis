# Jarvis - Personal Assistance Desktop App

## Overview
Jarvis is a comprehensive personal assistance desktop application that runs continuously, listening for commands and managing various system tools with appropriate permission controls. The application is designed to be always available, responsive to user needs, and secure in its operations.

## Key Features
- **Always Listening**: Background service that runs continuously with voice activation
- **Permission System**: All changes require explicit user approval before execution
- **Multi-Tool Access**: File management, mail management, reminders, device control
- **Security First**: Comprehensive audit logging and encryption of sensitive data
- **Extensible Architecture**: Plugin system for adding new capabilities

## Architecture
The application follows a modular architecture based on the ollama-agent project patterns but adapted for desktop environments:

### Core Components
1. **Agent Runtime** - Main execution engine
2. **Context Manager** - Manages conversation state and history
3. **Planner** - Determines next steps based on user input
4. **Policy Engine** - Evaluates tool usage against defined policies
5. **Tool System** - Registry and execution of available tools
6. **User Interface** - Desktop interface with notification system
7. **Service Layer** - File, command, mail, reminder, and device services

### Security Model
- **Always Allow**: Safe read-only operations (file reading, search)
- **Ask for Approval**: Write operations and potentially risky commands  
- **Deny**: Critical operations that are never allowed without explicit permission
- All changes require user consent before execution

## Project Status & Roadmap

| Order | Task | Status | Who | Blocker |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 1.1 TTS | ✅ Wired (System-level) | AI | |
| 2 | 1.2 AutomationEngine wire | ✅ Completed (Shared State) | AI | |
| 3 | 2.1 Autostart | ✅ Added | AI | |
| 4 | 2.2 Search fallback | ✅ Coded (Web/File) | AI | |
| 5 | 2.3 bridge.py | ✅ Integrated (127.0.0.1) | AI | |
| 6 | 3.1 Scheduler | ✅ Fixed (Agent-Linked) | AI | |
| 7 | 3.2 Email check | ⏳ Pending (Service active) | | |
| 8 | 4.1 RAG design | ⏳ Pending | | |
| 9 | 4.2 Wake word design | ⏳ Pending (Prototype in VoiceHandler) | | |
| 10 | 4.3 Calendar design | ⏳ Pending | | |
| 11 | 4.4 Device service | ⏳ Pending | | |
| 12 | 4.1 RAG impl | ✅ Implemented (VectorService) | AI | |
| 13 | 4.2 Wake word impl | ⏳ Pending (Prototype in VoiceHandler) | | |
| 14 | 4.3 Calendar impl | ⏳ Pending (Service active) | | |

## Implementation Plan
The project will be implemented in 8 weeks following this phased approach:

### Phase 1: Core Architecture (Weeks 1-2)
- Set up project structure and build system
- Implement core agent components
- Create policy and permission systems
- Build tool registry and execution framework

### Phase 2: Services & Tools (Weeks 3-4)
- Implement file service and related tools
- Add command execution capabilities
- Develop mail and reminder services
- Create device control functionality

### Phase 3: User Interface (Weeks 5-6)
- Build desktop UI components
- Implement voice recognition system
- Create notification and status systems
- Add configuration interface

### Phase 4: Integration & Testing (Weeks 7-8)
- Integrate all components into cohesive application
- Conduct comprehensive testing
- Optimize performance
- Prepare for deployment

## Project Structure
```
Jarvis/
├── src/
│   ├── agent/           # Core agent components
│   ├── policy/          # Permission and policy systems
│   ├── services/        # Application services (file, mail, etc.)
│   ├── tools/           # Tool registry and execution
│   ├── ui/              # User interface components
│   ├── config/          # Configuration management
│   └── extension.ts     # Main entry point
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── docs/                # Documentation files
    ├── architecture.md  # System architecture
    ├── implementation-plan.md # Implementation roadmap
    ├── technical-specs.md   # Technical specifications
    └── project-structure.md # Project structure details
```

## Security & Privacy
- All potentially dangerous operations require explicit user approval
- Comprehensive audit logging of all actions
- Encrypted storage for sensitive data
- Clear privacy controls and user consent mechanisms
- Compliance with relevant privacy regulations

## Technology Stack
- **Primary Language**: TypeScript/JavaScript
- **Desktop Framework**: Electron (for cross-platform compatibility)
- **AI Models**: Ollama or similar local AI models
- **Voice Recognition**: Web Speech API or specialized libraries
- **Database**: Local storage with encryption for settings and history

## Next Steps
1. Create the project directory structure
2. Set up build system and dependencies
3. Begin implementation of core agent components
4. Implement permission and policy systems
5. Develop tool registry and execution framework

## Documentation
- [Architecture](architecture.md) - System architecture overview
- [Implementation Plan](implementation-plan.md) - Detailed development roadmap
- [Technical Specs](technical-specs.md) - Detailed technical specifications
- [Project Structure](project-structure.md) - Complete project directory layout