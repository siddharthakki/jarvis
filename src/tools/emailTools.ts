import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { MailService } from '../services/MailService';

// Initialize the mail service
const mailService = new MailService();

// Send email tool
const sendEmailTool: Tool = {
  name: 'send_email',
  description: 'Send an email to a recipient',
  schema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient email address'
      },
      subject: {
        type: 'string',
        description: 'Email subject'
      },
      body: {
        type: 'string',
        description: 'Email body content'
      },
      cc: {
        type: 'string',
        description: 'CC recipient email address (optional)'
      },
      bcc: {
        type: 'string',
        description: 'BCC recipient email address (optional)'
      }
    },
    required: ['to', 'subject', 'body']
  },
  riskLevel: 'low',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const to = args.to as string;
    const subject = args.subject as string;
    const body = args.body as string;
    const cc = args.cc as string;
    const bcc = args.bcc as string;

    try {
      const success = await mailService.sendEmail(to, subject, body, cc, bcc);
      return {
        success: true,
        data: success ? 'Email sent successfully' : 'Failed to send email'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }
};

// Read inbox tool
const readInboxTool: Tool = {
  name: 'read_inbox',
  description: 'Read emails from the inbox',
  schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of emails to retrieve (default: 10)'
      },
      folder: {
        type: 'string',
        description: 'Email folder to read from (default: "INBOX")'
      }
    },
    required: []
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const limit = args.limit as number || 10;
    const folder = args.folder as string || 'INBOX';

    try {
      const emails = await mailService.readInbox(limit, folder);
      return {
        success: true,
        data: emails
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read inbox'
      };
    }
  }
};

// Register the tools
ToolRegistry.register(sendEmailTool);
ToolRegistry.register(readInboxTool);

export { sendEmailTool, readInboxTool };