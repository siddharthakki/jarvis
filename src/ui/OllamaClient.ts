/**
 * Ollama Client - Interface for interacting with local Ollama API
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolResult } from '../tools/ToolTypes';

const execAsync = promisify(exec);

export type ModelRole =
  | 'chat'            // Instant responses (qwen2.5-coder:14b)
  | 'brain'           // Advanced reasoning (deepseek-r1:14b)
  | 'coding'          // Heavy architecture (qwen3-coder:30b)
  | 'coding_fast'     // Fast script edits (qwen2.5-coder:14b)
  | 'tool_use'        // Function calling (nexusraven:13b)
  | 'vision'          // Visual sensors (qwen2.5vl:7b)
  | 'embedding';      // Memory/RAG (nomic-embed-text)

export class OllamaClient {
  private ollamaUrl: string;
  private modelMap: Record<ModelRole, string>;

  constructor() {
    this.ollamaUrl = 'http://localhost:11434';

// Elite Suite - Optimized for 24GB VRAM (RTX 3090)
    this.modelMap = {
      'chat': 'qwen2.5-coder:14b',
      'brain': 'deepseek-r1:14b',
      'coding': 'qwen3-coder:30b',
      'coding_fast': 'qwen2.5-coder:14b',
      'tool_use': 'nexusraven:13b',
      'vision': 'qwen2.5vl:7b',
      'embedding': 'nomic-embed-text'
    };

    this.initModels();
  }

  private async initModels(): Promise<void> {
    try {
      const availableModels = await this.listModels();
      console.log('JARVIS: Initializing neural cores...');

      for (const [role, modelName] of Object.entries(this.modelMap)) {
        if (!availableModels.includes(modelName) && !availableModels.includes(`${modelName}:latest`)) {
          console.warn(`WARNING: Model for role '${role}' (${modelName}) not found locally.`);
        } else {
          console.log(`✓ Role '${role}' linked to ${modelName}`);
        }
      }
    } catch (e) {
      console.error('Failed to initialize Ollama models:', e);
    }
  }

  /**
   * Send a prompt to Ollama using a specific role-based model
   */
  async generatePlan(prompt: string, role: ModelRole = 'brain', overrideModel?: string): Promise<ToolResult> {
    const model = overrideModel || this.modelMap[role] || this.modelMap['brain'];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 min hard cap

      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error! status: ${response.status} (Model: ${model})`);
      }

      const result = await response.json();
      const generatedText = result.response;
      
      return {
        success: true,
        data: {
          rawResponse: generatedText,
          parsedPlan: this.parseGeneratedResponse(generatedText),
          modelUsed: model
        }
      };
    } catch (error) {
      console.error(`Ollama client error (${model}):`, error);
      return this.generatePlanCLI(prompt, role, overrideModel);
    }
  }

  /**
   * Fallback method using curl CLI
   */
  async generatePlanCLI(prompt: string, role: ModelRole = 'brain', overrideModel?: string): Promise<ToolResult> {
    const model = overrideModel || this.modelMap[role] || this.modelMap['brain'];
    try {
      const escapedPrompt = this.escapePrompt(prompt);
      const payload = JSON.stringify({
        model: model,
        prompt: escapedPrompt,
        stream: false
      });

      const command = `curl -s -X POST ${this.ollamaUrl}/api/generate -H "Content-Type: application/json" -d "${payload.replace(/"/g, '\\"')}"`;

      const { stdout } = await execAsync(command);
      const response = JSON.parse(stdout);

      return {
        success: true,
        data: {
          rawResponse: response.response,
          parsedPlan: this.parseGeneratedResponse(response.response),
          modelUsed: model
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate plan with Ollama CLI'
      };
    }
  }

  private parseGeneratedResponse(response: string | undefined | null): any {
    if (!response) return { actions: [], response: "Neural link timeout, Sir.", context: {} };

    let cleaned = response.trim();

    // 1. Strip DeepSeek thinking blocks
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Clean markdown blocks if present
    if (cleaned.includes('```')) {
        cleaned = cleaned.replace(/```[a-z]*\n([\s\S]*?)\n```/gi, '$1').trim();
    }

    // 3. Try to extract the largest JSON-like structure
    try {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        return this.robustJSONParse(jsonStr);
      }
      return { actions: [], response: response, context: {} };
    } catch (e) {
      console.error('Failed to parse JARVIS telemetry:', e);
      return { actions: [], response: response, context: {} };
    }
  }

  private robustJSONParse(str: string): any {
    try {
      return JSON.parse(str);
    } catch (e: any) {
      // If it's a Windows path issue, try fixing that first
      if (str.includes(':\\')) {
        const fixed = str.replace(/([a-zA-Z]):\\(?!\\)/g, '$1:\\\\');
        try { return JSON.parse(fixed); } catch {}
      }

      // If there's extra content after the JSON object, try to find the first valid object
      if (e.message.includes('Unexpected non-whitespace character') || e.message.includes('unexpected token')) {
        let depth = 0;
        let firstBrace = str.indexOf('{');
        if (firstBrace !== -1) {
          for (let i = firstBrace; i < str.length; i++) {
            if (str[i] === '{') depth++;
            else if (str[i] === '}') {
              depth--;
              if (depth === 0) {
                const candidate = str.substring(firstBrace, i + 1);
                try {
                  return JSON.parse(candidate);
                } catch (innerE: any) {
                  const fixedCandidate = candidate.replace(/([a-zA-Z]):\\(?!\\)/g, '$1:\\\\');
                  try { return JSON.parse(fixedCandidate); } catch {}
                }
              }
            }
          }
        }
      }
      throw e;
    }
  }

  private escapePrompt(prompt: string): string {
    return prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync(`curl -s --no-progress-meter ${this.ollamaUrl}/api/tags`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`curl -s --no-progress-meter ${this.ollamaUrl}/api/tags`);
      const response = JSON.parse(stdout);
      return response.models.map((model: any) => model.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get embedding for text using nomic-embed-text model
   */
  async getEmbedding(text: string): Promise<Float32Array> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "nomic-embed-text",
          prompt: text
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings API error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.embedding) {
        throw new Error('No embedding in response');
      }
      
      return new Float32Array(result.embedding);
    } catch (error) {
      console.error('Failed to get embedding from Ollama:', error);
      throw error;
    }
  }
}

export const ollamaClient = new OllamaClient();