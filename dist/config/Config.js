"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.defaultConfig = void 0;
exports.defaultConfig = {
    agentName: 'Jarvis',
    version: '1.0.0',
    model: 'qwen2.5-coder:14b',
    ttsVoice: 'default',
    sttEngine: 'webspeech',
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
class Config {
    constructor() {
        this.config = { ...exports.defaultConfig };
    }
    static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    get(key) {
        return this.config[key];
    }
    set(key, value) {
        this.config[key] = value;
    }
    getAll() {
        return { ...this.config };
    }
}
exports.Config = Config;
