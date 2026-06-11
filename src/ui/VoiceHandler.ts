import { ipcRenderer } from 'electron';
import { AgentRuntime } from '../agent/AgentRuntime';
import { defaultConfig } from '../config/Config';

export class VoiceHandler {
  private agentRuntime: AgentRuntime | null = null;
  private recognition: any = null;
  private isListening: boolean = false;
  private wakeWord: string = defaultConfig.wakeWord;
  private voiceActivationEnabled: boolean = defaultConfig.voiceActivationEnabled;

  constructor(agentRuntime: AgentRuntime) {
    this.agentRuntime = agentRuntime;
    this.initVoiceRecognition();
  }

  private initVoiceRecognition(): void {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition settings
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      // Handle results
      this.recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
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
        } else if (this.voiceActivationEnabled) {
          // If wake word detection is disabled, process all speech
          this.processCommand(transcript);
        }
      };
      
      // Handle errors
      this.recognition.onerror = (event: any) => {
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
    } else {
      console.warn('Web Speech API is not supported in this browser');
    }
  }

  public async startListening(): Promise<void> {
    if (this.recognition && !this.isListening) {
      try {
        this.isListening = true;
        this.updateStatus('listening');
        this.recognition.start();
        console.log('Started listening for voice input');
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        this.updateStatus('error');
      }
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.updateStatus('idle');
      console.log('Stopped listening for voice input');
    }
  }

  private async processCommand(command: string): Promise<void> {
    if (command.trim() && this.agentRuntime) {
      try {
        this.updateStatus('processing');
        
        // Process the command through the agent
        const result = await this.agentRuntime.processInput(command);
        
        console.log('Voice command processed:', result);
        this.updateStatus('idle');
        
        // Send response back to UI
        ipcRenderer.send('voice-command-processed', {
          command,
          result
        });
      } catch (error) {
        console.error('Error processing voice command:', error);
        this.updateStatus('error');
        
        // Send error back to UI
        ipcRenderer.send('voice-command-error', {
          command,
          error: (error as Error).message
        });
      }
    }
  }

  private updateStatus(status: string): void {
    // Update UI status via IPC
    ipcRenderer.send('voice-status-update', status);
    
    // Also send to main process for system tray updates
    if (this.agentRuntime) {
      // This would integrate with the main application's status system
    }
  }

  public setWakeWord(wakeWord: string): void {
    this.wakeWord = wakeWord;
  }

  public setVoiceActivation(enabled: boolean): void {
    this.voiceActivationEnabled = enabled;
  }

  public isListeningStatus(): boolean {
    return this.isListening;
  }
}