"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarService = exports.CalendarService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const googleapis_1 = require("googleapis");
const electron_1 = require("electron");
const http = __importStar(require("http"));
const url = __importStar(require("url"));
const ContextManager_1 = require("../agent/ContextManager");
const TOKENS_FILE = path.join(ContextManager_1.ContextManager.dataDir, 'google-tokens.json');
const CACHE_FILE = path.join(ContextManager_1.ContextManager.dataDir, 'calendar-cache.json');
class CalendarService {
    constructor() {
        this.cache = null;
        this.syncInterval = null;
        this.configured = false;
        const clientId = process.env.JARVIS_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.JARVIS_GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            console.warn('JARVIS: Google Calendar not configured — set JARVIS_GOOGLE_CLIENT_ID and JARVIS_GOOGLE_CLIENT_SECRET in credentials.env');
            return;
        }
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3141');
        this.configured = true;
        this.loadTokens();
        this.startBackgroundSync();
    }
    loadTokens() {
        try {
            if (fs.existsSync(TOKENS_FILE)) {
                const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
                this.oauth2Client.setCredentials(tokens);
            }
        }
        catch (err) {
            console.error('Failed to load Google tokens:', err);
        }
    }
    saveTokens() {
        try {
            fs.mkdirSync(path.dirname(TOKENS_FILE), { recursive: true });
            fs.writeFileSync(TOKENS_FILE, JSON.stringify(this.oauth2Client.credentials, null, 2), 'utf8');
        }
        catch (err) {
            console.error('Failed to save Google tokens:', err);
        }
    }
    startBackgroundSync() {
        // Sync every 15 minutes
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncEvents();
            }
            catch (err) {
                console.error('Background sync failed:', err);
            }
        }, 15 * 60 * 1000); // 15 minutes in milliseconds
    }
    async isAuthenticated() {
        if (!this.configured)
            return false;
        try {
            if (!this.oauth2Client.credentials?.access_token) {
                return false;
            }
            const tokenInfo = await this.oauth2Client.getTokenInfo(this.oauth2Client.credentials.access_token);
            return !!tokenInfo;
        }
        catch (err) {
            return false;
        }
    }
    async authenticate() {
        if (!this.configured)
            throw new Error('Google Calendar not configured — check credentials.env');
        // Check if we already have valid tokens
        if (this.oauth2Client.credentials?.access_token) {
            try {
                await this.oauth2Client.getTokenInfo(this.oauth2Client.credentials.access_token);
                return; // Already authenticated
            }
            catch {
                // Tokens invalid, need to re-authenticate
            }
        }
        // Generate auth URL with calendar scope
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar']
        });
        console.log('Opening Google OAuth URL for Calendar authentication...');
        electron_1.shell.openExternal(authUrl);
        // Start temporary server to capture the redirect
        await new Promise((resolve, reject) => {
            const server = http.createServer(async (req, res) => {
                try {
                    if (req.url?.startsWith('/')) {
                        const query = url.parse(req.url, true).query;
                        const code = query.code;
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
                        }
                        else {
                            res.writeHead(400, { 'Content-Type': 'text/html' });
                            res.end('<h1>Authentication failed. No code received.</h1>');
                            reject(new Error('No authorization code received'));
                        }
                    }
                }
                catch (err) {
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
    async syncEvents() {
        try {
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
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
            const events = response.data.items?.map((event) => ({
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
            }
            catch (err) {
                console.error('Failed to save calendar cache:', err);
            }
        }
        catch (err) {
            console.error('Failed to sync calendar events:', err);
            throw err;
        }
    }
    async listEvents(daysAhead = 7) {
        if (!this.configured)
            return [];
        // If we have cached data and it's less than 15 minutes old, return it
        if (this.cache && Date.now() - this.cache.lastSync < 15 * 60 * 1000) {
            return this.cache.events;
        }
        // Otherwise sync fresh events
        await this.syncEvents();
        return this.cache?.events || [];
    }
    async createEvent(title, start, end, description) {
        if (!this.configured)
            throw new Error('Google Calendar not configured — check credentials.env');
        try {
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
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
        }
        catch (err) {
            console.error('Failed to create calendar event:', err);
            throw err;
        }
    }
}
exports.CalendarService = CalendarService;
// Export singleton instance
exports.calendarService = new CalendarService();
