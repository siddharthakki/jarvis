export interface JarvisConfig {
    agentName: string;
    version: string;
    requireApprovalFor: string[];
    alwaysAllow: string[];
    denyList: string[];
    voiceActivationEnabled: boolean;
    wakeWord: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    auditLogging: boolean;
    workspaceRoot: string;
    autostart: boolean;
}
export declare const defaultConfig: JarvisConfig;
