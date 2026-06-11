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
}
exports.VoiceHandler = VoiceHandler;
