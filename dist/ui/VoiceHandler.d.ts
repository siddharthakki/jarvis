import { AgentRuntime } from '../agent/AgentRuntime';
export declare class VoiceHandler {
    private agentRuntime;
    private recognition;
    private isListening;
    private wakeWord;
    private voiceActivationEnabled;
    constructor(agentRuntime: AgentRuntime);
    private initVoiceRecognition;
    startListening(): Promise<void>;
    stopListening(): void;
    private processCommand;
    private updateStatus;
    setWakeWord(wakeWord: string): void;
    setVoiceActivation(enabled: boolean): void;
    isListeningStatus(): boolean;
}
