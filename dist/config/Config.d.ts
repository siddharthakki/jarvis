export interface JarvisConfig {
    agentName: string;
    version: string;
    model: string;
    ttsVoice: string;
    sttEngine: 'webspeech' | 'faster-whisper';
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
export declare class Config {
    private static instance;
    private config;
    private constructor();
    static getInstance(): Config;
    get<K extends keyof JarvisConfig>(key: K): JarvisConfig[K];
    set<K extends keyof JarvisConfig>(key: K, value: JarvisConfig[K]): void;
    getAll(): JarvisConfig;
}
