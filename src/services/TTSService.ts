import say from 'say';

export class TTSService {
  speak(text: string): void {
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
      // Stop any current speech before starting new one to prevent overlap
      this.stop();
      say.speak(strippedText);
    }
  }

  stop(): void {
    try {
      say.stop();
    } catch (e) {
      console.error('Failed to stop TTS:', e);
    }
  }
}

export const ttsService = new TTSService();