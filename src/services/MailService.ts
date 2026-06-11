import * as nodemailer from 'nodemailer';
import { simpleParser, ParsedMail } from 'mailparser';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Imap = require('imap') as typeof import('imap');
import { ContextManager } from '../agent/ContextManager';
import * as fs from 'fs';
import * as path from 'path';

interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  imap: {
    host: string;
    port: number;
    tls: boolean;
    user: string;
    pass: string;
  };
}

const CONFIG_FILE = path.join(ContextManager.dataDir, 'email-config.json');

function loadEmailConfig(): EmailConfig | null {
  // Prefer env vars (works in Docker / CI), fall back to config file
  if (process.env.JARVIS_SMTP_HOST) {
    return {
      smtp: {
        host: process.env.JARVIS_SMTP_HOST!,
        port: parseInt(process.env.JARVIS_SMTP_PORT ?? '587'),
        secure: process.env.JARVIS_SMTP_SECURE === 'true',
        user: process.env.JARVIS_EMAIL_USER!,
        pass: process.env.JARVIS_EMAIL_PASS!,
      },
      imap: {
        host: process.env.JARVIS_IMAP_HOST ?? process.env.JARVIS_SMTP_HOST!,
        port: parseInt(process.env.JARVIS_IMAP_PORT ?? '993'),
        tls: process.env.JARVIS_IMAP_TLS !== 'false',
        user: process.env.JARVIS_EMAIL_USER!,
        pass: process.env.JARVIS_EMAIL_PASS!,
      }
    };
  }

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as EmailConfig;
    }
  } catch {
    // Fall through
  }

  return null;
}

export class MailService {
  private config: EmailConfig | null;

  constructor() {
    this.config = loadEmailConfig();
    if (!this.config) {
      console.warn('JARVIS: No email config found. Create ~/.jarvis/email-config.json or set JARVIS_SMTP_HOST env var.');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    if (!this.config) throw new Error('Email not configured. See ~/.jarvis/email-config.json');

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

  async readInbox(limit: number = 10, folder: string = 'INBOX'): Promise<any[]> {
    if (!this.config) throw new Error('Email not configured. See ~/.jarvis/email-config.json');

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config!.imap.user,
        password: this.config!.imap.pass,
        host: this.config!.imap.host,
        port: this.config!.imap.port,
        tls: this.config!.imap.tls,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 15000,
        authTimeout: 10000,
      });

      const emails: any[] = [];

      imap.once('ready', () => {
        imap.openBox(folder, true, (err: Error | null, box: import('imap').Box) => {
          if (err) { imap.end(); return reject(err); }

          const total = box.messages.total;
          if (total === 0) { imap.end(); return resolve([]); }

          // Fetch the most recent `limit` messages
          const start = Math.max(1, total - limit + 1);
          const fetch = imap.seq.fetch(`${start}:${total}`, {
            bodies: '',
            struct: true,
          });

          fetch.on('message', (msg: import('imap').ImapMessage) => {
            const chunks: Buffer[] = [];
            msg.on('body', (stream: NodeJS.ReadableStream) => {
              stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            });
            msg.once('end', async () => {
              try {
                const parsed: ParsedMail = await simpleParser(Buffer.concat(chunks));
                emails.push({
                  from: parsed.from?.text ?? '',
                  to: parsed.to?.toString() ?? '',
                  subject: parsed.subject ?? '(no subject)',
                  date: parsed.date?.toISOString() ?? '',
                  text: (parsed.text ?? '').substring(0, 500),
                  messageId: parsed.messageId ?? '',
                });
              } catch {
                // Skip unparseable messages
              }
            });
          });

          fetch.once('error', (fetchErr: Error) => { imap.end(); reject(fetchErr); });
          fetch.once('end', () => imap.end());
        });
      });

      imap.once('end', () => resolve(emails.reverse())); // newest first
      imap.once('error', reject);
      imap.connect();
    });
  }

  /** Write a starter config file so the user knows what to fill in */
  static writeExampleConfig(): void {
    const example: EmailConfig = {
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
  static isConfigured(): boolean {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        return false;
      }
      
      const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(configContent) as EmailConfig;
      
      // Check that smtp host and user are not empty
      return !!(config.smtp?.host && config.smtp?.user);
    } catch {
      // If file doesn't exist or is invalid JSON, return false
      return false;
    }
  }
}
