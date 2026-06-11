"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsService = exports.TTSService = void 0;
const say_1 = __importDefault(require("say"));
class TTSService {
    speak(text) {
        // Extract only the content from the ### Result section if it exists
        let speechText = text;
        const resultMatch = text.match(/### Result\s*\n?([\s\S]*?)(?:\n\n###|$)/i);
        if (resultMatch && resultMatch[1]) {
            speechText = resultMatch[1].trim();
        }
        // Strip remaining markdown and HTML patterns:
        // - HTML tags like <br>, <div>, etc.
        // - Lines starting with ###, **, *, -, and any text inside backticks
        const strippedText = speechText
            .replace(/<[^>]*>?/gm, '') // Remove HTML tags
            .split('\n')
            .filter(line => {
            // Filter out lines that start with ###, **, *, or -
            return !line.trim().match(/^(###|(\*\*)|\*|-)/);
        })
            .join(' ') // Join with space for better flow
            .replace(/`[^`]*`/g, '') // Remove text inside backticks
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        if (strippedText) {
            this.stop();
            say_1.default.speak(strippedText, undefined, 1.0, () => {
                if (this.onEnd)
                    this.onEnd();
            });
        }
    }
    stop() {
        try {
            say_1.default.stop();
        }
        catch (e) {
            console.error('Failed to stop TTS:', e);
        }
    }
}
exports.TTSService = TTSService;
exports.ttsService = new TTSService();
