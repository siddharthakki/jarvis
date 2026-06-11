import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('jarvis', {
  sendVoiceInput: (transcript: string) => ipcRenderer.send('voice-input', transcript),
  onVoiceInputResponse: (callback: (result: any) => void) => {
    ipcRenderer.on('voice-input-response', (_event, result) => callback(result));
  },
  onVoiceInputError: (callback: (error: string) => void) => {
    ipcRenderer.on('voice-input-error', (_event, error) => callback(error));
  },
  onStatusUpdate: (callback: (status: string) => void) => {
    ipcRenderer.on('status-update', (_event, status) => callback(status));
  },
  onOllamaStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('ollama-status', (_event, status) => callback(status));
  },
  onApprovalRequest: (callback: (request: any) => void) => {
    ipcRenderer.on('approval-request', (_event, request) => callback(request));
  },
  sendApprovalResponse: (requestId: string, result: 'approved' | 'denied') => {
    ipcRenderer.send('approval-response', { requestId, result });
  },
  stopSpeech: () => ipcRenderer.send('stop-speech'),
  onTtsStart: (callback: (duration: number) => void) => {
    ipcRenderer.on('tts-start', (_event, duration) => callback(duration));
  },
  onTtsEnd: (callback: () => void) => {
    ipcRenderer.on('tts-end', () => callback());
  },
  getConfig: () => ipcRenderer.invoke('jarvis:get-config'),
  setConfig: (key: string, value: any) => ipcRenderer.invoke('jarvis:set-config', key, value),
  getOllamaModels: () => ipcRenderer.invoke('jarvis:get-ollama-models'),
  focusWindow: () => ipcRenderer.send('focus-window')
});
