"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOllamaModelsTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const OllamaClient_1 = require("../ui/OllamaClient");
/**
 * Ollama Tools - Manage local LLM models
 */
exports.listOllamaModelsTool = {
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
    async execute(_args, context) {
        const status = context?.statusCallback;
        try {
            status?.('JARVIS: Querying local neural repository...');
            const models = await OllamaClient_1.ollamaClient.listModels();
            return {
                success: true,
                data: {
                    models: models,
                    count: models.length,
                    message: `I found ${models.length} models installed in your local neural repository, Sir.`
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list Ollama models'
            };
        }
    }
};
ToolRegistry_1.ToolRegistry.register(exports.listOllamaModelsTool);
