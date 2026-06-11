import { AgentRuntime } from '../agent/AgentRuntime';
export declare class VoiceHandler {
    private agentRuntime;
    private recognition;
    private isListening;
    private wakeWord;
    private voiceActivationEnabled;
    private sttWebSocket;
    private audioContext;
    private scriptProcessor;
    private isFasterWhisperListening;
    constructor(agentRuntime: AgentRuntime);
    private initVoiceRecognition;
    startListening(): Promise<void>;
    /**
     * Connect to the faster-whisper STT endpoint
     */
    connectFasterWhisper(): void;
    /**
     * Initialize audio capture using Web Audio API
     */
    private initAudioCapture;
    stopListening(): void;
    private processCommand;
    private updateStatus;
    setWakeWord(wakeWord: string): void;
    setVoiceActivation(enabled: boolean): void;
    isListeningStatus(): boolean;
    /**
     * Stop listening for voice input (faster-whisper version)
     */
    stopFasterWhisperListening(): void;
}
