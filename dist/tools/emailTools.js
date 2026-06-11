"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInboxTool = exports.sendEmailTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const MailService_1 = require("../services/MailService");
// Initialize the mail service
const mailService = new MailService_1.MailService();
// Send email tool
const sendEmailTool = {
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
    async execute(args, context) {
        const to = args.to;
        const subject = args.subject;
        const body = args.body;
        const cc = args.cc;
        const bcc = args.bcc;
        try {
            const success = await mailService.sendEmail(to, subject, body, cc, bcc);
            return {
                success: true,
                data: success ? 'Email sent successfully' : 'Failed to send email'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send email'
            };
        }
    }
};
exports.sendEmailTool = sendEmailTool;
// Read inbox tool
const readInboxTool = {
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
    async execute(args, context) {
        const limit = args.limit || 10;
        const folder = args.folder || 'INBOX';
        try {
            const emails = await mailService.readInbox(limit, folder);
            return {
                success: true,
                data: emails
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read inbox'
            };
        }
    }
};
exports.readInboxTool = readInboxTool;
// Register the tools
ToolRegistry_1.ToolRegistry.register(sendEmailTool);
ToolRegistry_1.ToolRegistry.register(readInboxTool);
