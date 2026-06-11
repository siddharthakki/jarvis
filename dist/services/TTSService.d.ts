export declare class TTSService {
    speak(text: string): void;
    onEnd?: () => void;
    stop(): void;
}
export declare const ttsService: TTSService;
