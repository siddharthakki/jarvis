"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    agentName: 'Jarvis',
    version: '1.0.0',
    requireApprovalFor: ['write_file', 'run_command', 'delete_file'],
    alwaysAllow: ['read_file', 'search_files'],
    denyList: ['format_drive', 'shutdown_system'],
    voiceActivationEnabled: true,
    wakeWord: 'jarvis',
    logLevel: 'info',
    auditLogging: true,
    workspaceRoot: './workspace',
    autostart: true
};
