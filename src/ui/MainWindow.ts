import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { ttsService } from '../services/TTSService';

export class MainWindow {
  private window: BrowserWindow | null = null;
  private agentRuntime: any; // Will be initialized later

  constructor() {
    this.createWindow();
    this.setupIPC();
  }

  private createWindow(): void {
    console.log('Initializing Wide-Screen JARVIS HUD...');
    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
      },
      transparent: false,
      frame: true,
      alwaysOnTop: false,
      backgroundColor: '#0B131A',
      title: 'JARVIS COMMAND CENTER'
    });

    this.window = win;

    // Load the index.html file
    const fs = require('fs');
    let indexPath = path.join(app.getAppPath(), 'src/ui/index.html');

    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(app.getAppPath(), 'ui/index.html');
    }

    console.log(`Loading JARVIS HUD from: ${indexPath}`);
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
    });

    // Handle window close
    win.on('closed', () => {
      console.log('Window closed.');
      this.window = null;
    });

    win.webContents.on('did-finish-load', () => {
      console.log('JARVIS HUD loaded successfully.');
      this.checkOllamaStatus();
    });

    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
    });
  }

  private async checkOllamaStatus(): Promise<void> {
    const { ollamaClient } = require('./OllamaClient');
    const isOnline = await ollamaClient.isAvailable();
    if (this.window) {
      this.window.webContents.send('ollama-status', {
        online: isOnline,
        model: 'QWEN_3_14B'
      });
    }
  }

  private setupIPC(): void {
    // Listen for voice input from renderer process
    ipcMain.on('voice-input', (event, transcript) => {
      // Silence JARVIS immediately if new input is received
      ttsService.stop();

      const cleanTranscript = transcript?.trim();
      if (!this.agentRuntime || !cleanTranscript || cleanTranscript.length < 2) return;

      const TIMEOUT_MS = 150_000; // 2.5 min — covers worst-case 14B model generation
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.window?.webContents.send('status-update', 'Request timed out, Sir. The neural core is taking too long. Please try again.');
        event.reply('voice-input-response', {
          response: '### Result\nI apologise, Sir — the neural core did not respond in time. Please try a shorter or simpler query, or check Ollama is running.',
          results: []
        });
      }, TIMEOUT_MS);

      this.agentRuntime.processInput(transcript)
        .then((result: any) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          event.reply('voice-input-response', result);
        })
        .catch((error: any) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          event.reply('voice-input-error', error.message);
        });
    });

    // Listen for status updates
    ipcMain.on('update-status', (_event, status) => {
      if (this.window) {
        this.window.webContents.send('status-update', status);
      }
    });

    ipcMain.on('focus-window', () => {
      if (this.window) {
        this.window.show();
        this.window.focus();
      }
    });

    ipcMain.on('stop-speech', () => {
      ttsService.stop();
    });
  }

  public setAgentRuntime(agentRuntime: any): void {
    this.agentRuntime = agentRuntime;
    agentRuntime.setStatusCallback((message: string) => {
      this.window?.webContents.send('status-update', message);
    });
    agentRuntime.setSpeakCallback((text: string) => {
      ttsService.stop();
      ttsService.speak(text);
    });
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public show(): void {
    if (this.window) {
      this.window.show();
    }
  }

  public hide(): void {
    if (this.window) {
      this.window.hide();
    }
  }

  public updateStatus(status: string): void {
    if (this.window) {
      this.window.webContents.send('status-update', status);
    }
  }
}
