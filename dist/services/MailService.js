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
exports.MailService = void 0;
const nodemailer = __importStar(require("nodemailer"));
const mailparser_1 = require("mailparser");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Imap = require('imap');
const ContextManager_1 = require("../agent/ContextManager");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CONFIG_FILE = path.join(ContextManager_1.ContextManager.dataDir, 'email-config.json');
function loadEmailConfig() {
    // Prefer env vars (works in Docker / CI), fall back to config file
    if (process.env.JARVIS_SMTP_HOST) {
        return {
            smtp: {
                host: process.env.JARVIS_SMTP_HOST,
                port: parseInt(process.env.JARVIS_SMTP_PORT ?? '587'),
                secure: process.env.JARVIS_SMTP_SECURE === 'true',
                user: process.env.JARVIS_EMAIL_USER,
                pass: process.env.JARVIS_EMAIL_PASS,
            },
            imap: {
                host: process.env.JARVIS_IMAP_HOST ?? process.env.JARVIS_SMTP_HOST,
                port: parseInt(process.env.JARVIS_IMAP_PORT ?? '993'),
                tls: process.env.JARVIS_IMAP_TLS !== 'false',
                user: process.env.JARVIS_EMAIL_USER,
                pass: process.env.JARVIS_EMAIL_PASS,
            }
        };
    }
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    }
    catch {
        // Fall through
    }
    return null;
}
class MailService {
    constructor() {
        this.config = loadEmailConfig();
        if (!this.config) {
            console.warn('JARVIS: No email config found. Create ~/.jarvis/email-config.json or set JARVIS_SMTP_HOST env var.');
        }
    }
    async sendEmail(to, subject, body, cc, bcc) {
        if (!this.config)
            throw new Error('Email not configured. See ~/.jarvis/email-config.json');
        const transporter = nodemailer.createTransport({
            host: this.config.smtp.host,
            port: this.config.smtp.port,
            secure: this.config.smtp.secure,
            auth: { user: this.config.smtp.user, pass: this.config.smtp.pass },
        });
        await transporter.sendMail({
            from: this.config.smtp.user,
            to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject,
            text: body,
        });
        console.log(`JARVIS: Email sent to ${to} — "${subject}"`);
        return true;
    }
    async readInbox(limit = 10, folder = 'INBOX') {
        if (!this.config)
            throw new Error('Email not configured. See ~/.jarvis/email-config.json');
        return new Promise((resolve, reject) => {
            const imap = new Imap({
                user: this.config.imap.user,
                password: this.config.imap.pass,
                host: this.config.imap.host,
                port: this.config.imap.port,
                tls: this.config.imap.tls,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 15000,
                authTimeout: 10000,
            });
            const emails = [];
            imap.once('ready', () => {
                imap.openBox(folder, true, (err, box) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    const total = box.messages.total;
                    if (total === 0) {
                        imap.end();
                        return resolve([]);
                    }
                    // Fetch the most recent `limit` messages
                    const start = Math.max(1, total - limit + 1);
                    const fetch = imap.seq.fetch(`${start}:${total}`, {
                        bodies: '',
                        struct: true,
                    });
                    fetch.on('message', (msg) => {
                        const chunks = [];
                        msg.on('body', (stream) => {
                            stream.on('data', (chunk) => chunks.push(chunk));
                        });
                        msg.once('end', async () => {
                            try {
                                const parsed = await (0, mailparser_1.simpleParser)(Buffer.concat(chunks));
                                emails.push({
                                    from: parsed.from?.text ?? '',
                                    to: parsed.to?.toString() ?? '',
                                    subject: parsed.subject ?? '(no subject)',
                                    date: parsed.date?.toISOString() ?? '',
                                    text: (parsed.text ?? '').substring(0, 500),
                                    messageId: parsed.messageId ?? '',
                                });
                            }
                            catch {
                                // Skip unparseable messages
                            }
                        });
                    });
                    fetch.once('error', (fetchErr) => { imap.end(); reject(fetchErr); });
                    fetch.once('end', () => imap.end());
                });
            });
            imap.once('end', () => resolve(emails.reverse())); // newest first
            imap.once('error', reject);
            imap.connect();
        });
    }
    /** Write a starter config file so the user knows what to fill in */
    static writeExampleConfig() {
        const example = {
            smtp: { host: 'smtp.gmail.com', port: 587, secure: false, user: 'you@gmail.com', pass: 'app-password' },
            imap: { host: 'imap.gmail.com', port: 993, tls: true, user: 'you@gmail.com', pass: 'app-password' },
        };
        if (!fs.existsSync(CONFIG_FILE)) {
            fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(example, null, 2));
            console.log(`JARVIS: Example email config written to ${CONFIG_FILE}`);
        }
    }
    /** Check if email configuration is complete */
    static isConfigured() {
        try {
            if (!fs.existsSync(CONFIG_FILE)) {
                return false;
            }
            const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(configContent);
            // Check that smtp host and user are not empty
            return !!(config.smtp?.host && config.smtp?.user);
        }
        catch {
            // If file doesn't exist or is invalid JSON, return false
            return false;
        }
    }
}
exports.MailService = MailService;
