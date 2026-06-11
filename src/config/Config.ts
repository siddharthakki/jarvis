export interface JarvisConfig {
  // Core agent settings
  agentName: string;
  version: string;

  // Runtime config
  model: string;
  ttsVoice: string;
  sttEngine: 'webspeech' | 'faster-whisper';

  // Security settings
  requireApprovalFor: string[];
  alwaysAllow: string[];
  denyList: string[];
  
  // Voice settings
  voiceActivationEnabled: boolean;
  wakeWord: string;
  
  // Logging settings
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  auditLogging: boolean;
  
  // Workspace settings
  workspaceRoot: string;
  
  // Autostart setting
  autostart: boolean;
}

export const defaultConfig: JarvisConfig = {
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

export class Config {
  private static instance: Config;
  private config: JarvisConfig = { ...defaultConfig };

  private constructor() {}

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  get<K extends keyof JarvisConfig>(key: K): JarvisConfig[K] {
    return this.config[key];
  }

  set<K extends keyof JarvisConfig>(key: K, value: JarvisConfig[K]): void {
    this.config[key] = value;
  }

  getAll(): JarvisConfig {
    return { ...this.config };
  }
}
