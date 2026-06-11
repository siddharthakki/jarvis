import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class BridgeAuth {
  private static token: string | null = null;

  static getToken(): string {
    if (this.token) return this.token;

    const tokenPath = path.join(os.homedir(), '.jarvis', 'bridge.token');
    try {
      if (fs.existsSync(tokenPath)) {
        this.token = fs.readFileSync(tokenPath, 'utf8').trim();
        return this.token;
      }
    } catch (error) {
      console.error('Error reading bridge token:', error);
    }

    return '';
  }
}
