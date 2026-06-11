import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { ollamaClient } from '../ui/OllamaClient';

/**
 * Ollama Tools - Manage local LLM models
 */
export const listOllamaModelsTool: Tool = {
  name: 'list_ollama_models',
  description: 'List all locally installed Ollama models',
  schema: {
    type: 'object',
    properties: {},
    required: []
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: false,
  async execute(_args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const status = context?.statusCallback;
    try {
      status?.('JARVIS: Querying local neural repository...');
      const models = await ollamaClient.listModels();

      return {
        success: true,
        data: {
          models: models,
          count: models.length,
          message: `I found ${models.length} models installed in your local neural repository, Sir.`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Ollama models'
      };
    }
  }
};

ToolRegistry.register(listOllamaModelsTool);
