import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';
import { shell } from 'electron';
import * as http from 'http';
import * as url from 'url';
import { ContextManager } from '../agent/ContextManager';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

const TOKENS_FILE = path.join(ContextManager.dataDir, 'google-tokens.json');
const CACHE_FILE = path.join(ContextManager.dataDir, 'calendar-cache.json');

export class CalendarService {
  private oauth2Client: any;
  private cache: { lastSync: number; events: CalendarEvent[] } | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private configured: boolean = false;

  constructor() {
    const clientId = process.env.JARVIS_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.JARVIS_GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('JARVIS: Google Calendar not configured — set JARVIS_GOOGLE_CLIENT_ID and JARVIS_GOOGLE_CLIENT_SECRET in credentials.env');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3141');
    this.configured = true;
    this.loadTokens();
    this.startBackgroundSync();
  }

  private loadTokens(): void {
    try {
      if (fs.existsSync(TOKENS_FILE)) {
        const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
        this.oauth2Client.setCredentials(tokens);
      }
    } catch (err) {
      console.error('Failed to load Google tokens:', err);
    }
  }

  private saveTokens(): void {
    try {
      fs.mkdirSync(path.dirname(TOKENS_FILE), { recursive: true });
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(this.oauth2Client.credentials, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save Google tokens:', err);
    }
  }

  private startBackgroundSync(): void {
    // Sync every 15 minutes
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncEvents();
      } catch (err) {
        console.error('Background sync failed:', err);
      }
    }, 15 * 60 * 1000); // 15 minutes in milliseconds
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      if (!this.oauth2Client.credentials?.access_token) {
        return false;
      }
      const tokenInfo = await this.oauth2Client.getTokenInfo(this.oauth2Client.credentials.access_token);
      return !!tokenInfo;
    } catch (err) {
      return false;
    }
  }

  async authenticate(): Promise<void> {
    if (!this.configured) throw new Error('Google Calendar not configured — check credentials.env');
    // Check if we already have valid tokens
    if (this.oauth2Client.credentials?.access_token) {
      try {
        await this.oauth2Client.getTokenInfo(this.oauth2Client.credentials.access_token);
        return; // Already authenticated
      } catch {
        // Tokens invalid, need to re-authenticate
      }
    }

    // Generate auth URL with calendar scope
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    });

    console.log('Opening Google OAuth URL for Calendar authentication...');
    shell.openExternal(authUrl);

    // Start temporary server to capture the redirect
    await new Promise<void>((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        try {
          if (req.url?.startsWith('/')) {
            const query = url.parse(req.url, true).query;
            const code = query.code as string;

            if (code) {
              // Exchange the authorization code for tokens
              const { tokens } = await this.oauth2Client.getToken(code);
              this.oauth2Client.setCredentials(tokens);
              this.saveTokens();

              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<h1>Authentication successful! You can close this window.</h1>');

              // Close the server
              server.close(() => {
                console.log('Google Calendar authentication completed successfully');
                resolve();
              });
            } else {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('<h1>Authentication failed. No code received.</h1>');
              reject(new Error('No authorization code received'));
            }
          }
        } catch (err) {
          console.error('Error in auth server:', err);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed. Please try again.</h1>');
          reject(err);
        }
      });

      server.listen(3141, () => {
        console.log('Temporary OAuth server started on port 3141');
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        server.close();
        reject(new Error('OAuth authentication timed out'));
      }, 5 * 60 * 1000); // 5 minutes timeout
    });
  }

  private async syncEvents(): Promise<void> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7); // Next 7 days
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      const events: CalendarEvent[] = response.data.items?.map((event: any) => ({
        id: event.id,
        title: event.summary || '',
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        location: event.location,
        description: event.description
      })) || [];
      
      // Save to cache
      this.cache = {
        lastSync: Date.now(),
        events
      };
      
      try {
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2), 'utf8');
      } catch (err) {
        console.error('Failed to save calendar cache:', err);
      }
    } catch (err) {
      console.error('Failed to sync calendar events:', err);
      throw err;
    }
  }

  async listEvents(daysAhead = 7): Promise<CalendarEvent[]> {
    if (!this.configured) return [];
    // If we have cached data and it's less than 15 minutes old, return it
    if (this.cache && Date.now() - this.cache.lastSync < 15 * 60 * 1000) {
      return this.cache.events;
    }
    
    // Otherwise sync fresh events
    await this.syncEvents();
    return this.cache?.events || [];
  }

  async createEvent(
    title: string, 
    start: Date, 
    end: Date, 
    description?: string
  ): Promise<string> {
    if (!this.configured) throw new Error('Google Calendar not configured — check credentials.env');
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      // Immediately refresh cache after creating an event
      await this.syncEvents();
      
      return response.data.id ?? '';
    } catch (err) {
      console.error('Failed to create calendar event:', err);
      throw err;
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();