"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceHandler = void 0;
const electron_1 = require("electron");
const Config_1 = require("../config/Config");
class VoiceHandler {
    constructor(agentRuntime) {
        this.agentRuntime = null;
        this.recognition = null;
        this.isListening = false;
        this.wakeWord = Config_1.defaultConfig.wakeWord;
        this.voiceActivationEnabled = Config_1.defaultConfig.voiceActivationEnabled;
        this.sttWebSocket = null;
        this.audioContext = null;
        this.scriptProcessor = null;
        this.isFasterWhisperListening = false;
        this.agentRuntime = agentRuntime;
        this.initVoiceRecognition();
    }
    initVoiceRecognition() {
        // Check if browser supports Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            // Configure recognition settings
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            // Handle results
            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0])
                    .map(result => result.transcript)
                    .join(' ');
                // Check if wake word was detected
                if (this.voiceActivationEnabled && this.wakeWord) {
                    if (transcript.toLowerCase().includes(this.wakeWord.toLowerCase())) {
                        // Extract command after wake word
                        const command = transcript.substring(transcript.toLowerCase().indexOf(this.wakeWord.toLowerCase()) + this.wakeWord.length).trim();
                        if (command) {
                            this.processCommand(command);
                        }
                    }
                }
                else if (this.voiceActivationEnabled) {
                    // If wake word detection is disabled, process all speech
                    this.processCommand(transcript);
                }
            };
            // Handle errors
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus('error');
            };
            // Handle end of speech
            this.recognition.onend = () => {
                if (this.isListening) {
                    // Restart recognition
                    this.startListening();
                }
            };
            console.log('Voice recognition initialized successfully');
        }
        else {
            console.warn('Web Speech API is not supported in this browser');
        }
    }
    async startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.isListening = true;
                this.updateStatus('listening');
                this.recognition.start();
                console.log('Started listening for voice input');
            }
            catch (error) {
                console.error('Error starting voice recognition:', error);
                this.updateStatus('error');
            }
        }
    }
    /**
     * Connect to the faster-whisper STT endpoint
     */
    connectFasterWhisper() {
        // Try to create WebSocket connection to the STT endpoint
        try {
            const wsUrl = `ws://localhost:8765/ws/stt`;
            this.sttWebSocket = new WebSocket(wsUrl);
            this.sttWebSocket.onopen = () => {
                console.log('Connected to faster-whisper STT endpoint');
                this.isFasterWhisperListening = true;
                // Initialize audio context and start capturing
                this.initAudioCapture();
            };
            this.sttWebSocket.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    try {
                        const data = JSON.parse(event.data);
                        // Handle wake word detection
                        if (data.wake_word === true) {
                            if (this.voiceActivationEnabled && this.wakeWord) {
                                // When wake word is detected, we just call processCommand with the full text
                                // The existing logic in processCommand will handle wake word detection properly
                                this.processCommand(data.text);
                            }
                        }
                        // Handle regular transcription result
                        else if (data.is_final === true && data.text) {
                            // Call the existing processCommand callback with the transcript
                            this.processCommand(data.text);
                        }
                    }
                    catch (error) {
                        console.error('Error parsing STT response:', error);
                    }
                }
                else {
                    // Handle binary audio data from WebSocket
                    // This is not expected here since we're receiving JSON responses, but keeping for completeness
                }
            };
            this.sttWebSocket.onerror = (error) => {
                console.warn('faster-whisper STT connection error:', error);
                // Fallback silently to Web Speech API if WebSocket fails
                this.isFasterWhisperListening = false;
            };
            this.sttWebSocket.onclose = () => {
                console.log('faster-whisper STT connection closed');
                this.isFasterWhisperListening = false;
            };
        }
        catch (error) {
            console.warn('Failed to initialize faster-whisper STT:', error);
            // Fallback silently to Web Speech API if WebSocket fails
            this.isFasterWhisperListening = false;
        }
    }
    /**
     * Initialize audio capture using Web Audio API
     */
    initAudioCapture() {
        if (!this.isFasterWhisperListening || !navigator.mediaDevices || !window.AudioContext) {
            return;
        }
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        try {
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                // Create source from microphone
                const source = this.audioContext.createMediaStreamSource(stream);
                // Create script processor node for audio data capture
                this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
                // Connect nodes
                source.connect(this.scriptProcessor);
                this.scriptProcessor.connect(this.audioContext.destination);
                // Set up audio processing callback
                this.scriptProcessor.onaudioprocess = (event) => {
                    if (!this.isFasterWhisperListening || !this.sttWebSocket || this.sttWebSocket.readyState !== WebSocket.OPEN) {
                        return;
                    }
                    const input = event.inputBuffer.getChannelData(0);
                    // Convert float32 to int16
                    const int16Array = new Int16Array(input.length);
                    for (let i = 0; i < input.length; i++) {
                        int16Array[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
                    }
                    // Send binary data to WebSocket
                    this.sttWebSocket.send(int16Array.buffer);
                };
            })
                .catch((error) => {
                console.error('Error accessing microphone:', error);
                // Fallback silently to Web Speech API if microphone access fails
                this.isFasterWhisperListening = false;
            });
        }
        catch (error) {
            console.error('Error initializing audio context:', error);
            // Fallback silently to Web Speech API if audio context fails
            this.isFasterWhisperListening = false;
        }
    }
    stopListening() {
        if (this.recognition && this.isListening) {
            this.isListening = false;
            this.recognition.stop();
            this.updateStatus('idle');
            console.log('Stopped listening for voice input');
        }
    }
    async processCommand(command) {
        if (command.trim() && this.agentRuntime) {
            try {
                this.updateStatus('processing');
                // Process the command through the agent
                const result = await this.agentRuntime.processInput(command);
                console.log('Voice command processed:', result);
                this.updateStatus('idle');
                // Send response back to UI
                electron_1.ipcRenderer.send('voice-command-processed', {
                    command,
                    result
                });
            }
            catch (error) {
                console.error('Error processing voice command:', error);
                this.updateStatus('error');
                // Send error back to UI
                electron_1.ipcRenderer.send('voice-command-error', {
                    command,
                    error: error.message
                });
            }
        }
    }
    updateStatus(status) {
        // Update UI status via IPC
        electron_1.ipcRenderer.send('voice-status-update', status);
        // Also send to main process for system tray updates
        if (this.agentRuntime) {
            // This would integrate with the main application's status system
        }
    }
    setWakeWord(wakeWord) {
        this.wakeWord = wakeWord;
    }
    setVoiceActivation(enabled) {
        this.voiceActivationEnabled = enabled;
    }
    isListeningStatus() {
        return this.isListening;
    }
    /**
     * Stop listening for voice input (faster-whisper version)
     */
    stopFasterWhisperListening() {
        if (this.sttWebSocket) {
            this.sttWebSocket.close();
            this.sttWebSocket = null;
        }
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isFasterWhisperListening = false;
    }
}
exports.VoiceHandler = VoiceHandler;
