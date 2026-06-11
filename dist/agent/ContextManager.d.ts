export interface Memory {
    session: Record<string, any>;
    projects: Record<string, any>;
    preferences: Record<string, any>;
    behavioral: Record<string, any>;
    learned: Record<string, any>;
}
interface HistoryEntry {
    input: string;
    output: any;
    timestamp: string;
}
export declare class ContextManager {
    private memory;
    private history;
    constructor();
    private ensureDataDir;
    loadMemory(): void;
    saveMemory(): void;
    getMemory(): Memory;
    getContext(): Record<string, any>;
    setContext(key: string, value: any): void;
    updateSession(update: Record<string, any>): void;
    updateProject(projectName: string, update: Record<string, any>): void;
    updatePreference(key: string, value: any): void;
    addHistory(input: string, output: any): void;
    private embedHistoryEntry;
    private extractAndLearn;
    private updateBehavioralPatterns;
    getHistory(limit?: number): HistoryEntry[];
    clearSession(): void;
    private static cosineSimilarity;
    static get dataDir(): string;
    /**
     * Get relevant memory entries based on query using embeddings and cosine similarity
     */
    getRelevantMemory(query: string, k?: number): Promise<any[]>;
}
export {};
