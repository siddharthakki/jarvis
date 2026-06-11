import { ToolResult } from '../tools/ToolTypes';
export type ModelRole = 'chat' | 'brain' | 'coding' | 'coding_fast' | 'tool_use' | 'vision' | 'embedding';
export declare class OllamaClient {
    private ollamaUrl;
    private modelMap;
    constructor();
    private initModels;
    /**
     * Send a prompt to Ollama using a specific role-based model
     */
    generatePlan(prompt: string, role?: ModelRole, overrideModel?: string): Promise<ToolResult>;
    /**
     * Fallback method using curl CLI
     */
    generatePlanCLI(prompt: string, role?: ModelRole, overrideModel?: string): Promise<ToolResult>;
    private parseGeneratedResponse;
    private robustJSONParse;
    private escapePrompt;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<string[]>;
    /**
     * Get embedding for text using nomic-embed-text model
     */
    getEmbedding(text: string): Promise<Float32Array>;
}
export declare const ollamaClient: OllamaClient;
