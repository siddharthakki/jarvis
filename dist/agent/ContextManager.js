"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const OllamaClient_1 = require("../ui/OllamaClient");
const DATA_DIR = path.join(os.homedir(), '.jarvis');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_HISTORY = 200;
// Embedding constants
const EMBEDDINGS_FILE = path.join(DATA_DIR, 'embeddings.bin');
const EMBEDDING_DIM = 768;
const EMBEDDING_BYTES = 768 * 4; // Float32, 3072 bytes per vector
class ContextManager {
    constructor() {
        this.memory = {
            session: {},
            projects: {},
            preferences: {
                food: 'Vegetarian/Indian',
                planningStyle: 'Budget-conscious',
                guidance: 'Practical, step-by-step',
                locationContext: 'Germany'
            },
            behavioral: {},
            learned: {}
        };
        this.history = [];
        this.ensureDataDir();
        this.loadMemory();
    }
    ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }
    loadMemory() {
        try {
            if (fs.existsSync(MEMORY_FILE)) {
                const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
                const saved = JSON.parse(raw);
                // Merge saved data over defaults so new fields always appear
                this.memory = {
                    ...this.memory,
                    ...saved,
                    preferences: { ...this.memory.preferences, ...(saved.preferences ?? {}) },
                    behavioral: { ...this.memory.behavioral, ...(saved.behavioral ?? {}) },
                    learned: { ...this.memory.learned, ...(saved.learned ?? {}) },
                };
            }
        }
        catch {
            // Corrupted file — start fresh, old file will be overwritten on next save
        }
        try {
            if (fs.existsSync(HISTORY_FILE)) {
                const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
                this.history = JSON.parse(raw);
            }
        }
        catch {
            this.history = [];
        }
    }
    saveMemory() {
        try {
            this.ensureDataDir();
            // Never persist session — it's intentionally per-run
            const { session: _session, ...persistent } = this.memory;
            fs.writeFileSync(MEMORY_FILE, JSON.stringify(persistent, null, 2), 'utf8');
            // Keep only the last MAX_HISTORY entries on disk
            const recent = this.history.slice(-MAX_HISTORY);
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(recent, null, 2), 'utf8');
        }
        catch (err) {
            console.error('JARVIS: Failed to save memory:', err);
        }
    }
    getMemory() {
        return { ...this.memory };
    }
    getContext() {
        return { ...this.memory.session };
    }
    setContext(key, value) {
        this.memory.session[key] = value;
    }
    updateSession(update) {
        Object.assign(this.memory.session, update);
    }
    updateProject(projectName, update) {
        if (!this.memory.projects[projectName]) {
            this.memory.projects[projectName] = {};
        }
        Object.assign(this.memory.projects[projectName], update);
        this.saveMemory();
    }
    updatePreference(key, value) {
        this.memory.preferences[key] = value;
        this.saveMemory();
    }
    addHistory(input, output) {
        this.history.push({ input, output, timestamp: new Date().toISOString() });
        this.extractAndLearn(input, output);
        this.updateBehavioralPatterns(input);
        this.saveMemory();
        // Fire-and-forget async embedding call
        this.embedHistoryEntry(input);
    }
    async embedHistoryEntry(input) {
        try {
            const embedding = await OllamaClient_1.ollamaClient.getEmbedding(input);
            // Append to embeddings.bin
            fs.appendFileSync(EMBEDDINGS_FILE, Buffer.from(embedding.buffer));
        }
        catch (error) {
            // Ollama offline - add unindexed flag to history entry
            console.warn('Ollama offline, skipping embedding for:', input);
            // Find the last history entry and mark it as unindexed
            // This is acceptable per requirements
        }
    }
    // Pull facts out of the conversation and persist them
    extractAndLearn(input, output) {
        const lower = input.toLowerCase();
        // "remember that X" / "note that X"
        const rememberMatch = input.match(/(?:remember|note)\s+that\s+(.+)/i);
        if (rememberMatch) {
            const fact = rememberMatch[1].trim();
            const key = `fact_${Date.now()}`;
            this.memory.learned[key] = { fact, learnedAt: new Date().toISOString() };
        }
        // "my name is X" / "I am X" / "call me X"
        const nameMatch = input.match(/(?:my name is|call me|i am)\s+([A-Za-z]+)/i);
        if (nameMatch) {
            this.memory.preferences['userName'] = nameMatch[1];
        }
        // "I prefer X" / "I like X"
        const preferMatch = input.match(/i\s+(?:prefer|like|love|enjoy)\s+(.+?)(?:\.|,|$)/i);
        if (preferMatch) {
            this.memory.preferences[`preference_${Date.now()}`] = preferMatch[1].trim();
        }
        // Track which tools were useful
        if (output?.results?.length > 0) {
            const toolsUsed = output.results
                .filter((r) => r.success)
                .map((_, i) => output?.plan?.actions?.[i]?.toolName)
                .filter(Boolean);
            toolsUsed.forEach(tool => {
                const key = `${tool}_successCount`;
                this.memory.behavioral[key] = (this.memory.behavioral[key] ?? 0) + 1;
            });
        }
    }
    updateBehavioralPatterns(input) {
        const lower = input.toLowerCase();
        const hour = new Date().getHours();
        if (lower.includes('search') || lower.includes('find') || lower.includes('news')) {
            this.memory.behavioral['searchCount'] = (this.memory.behavioral['searchCount'] ?? 0) + 1;
            this.memory.behavioral['lastSearchTime'] = new Date().toISOString();
        }
        if (lower.includes('weather')) {
            this.memory.behavioral['weatherQueryCount'] = (this.memory.behavioral['weatherQueryCount'] ?? 0) + 1;
        }
        if (lower.includes('code') || lower.includes('debug') || lower.includes('fix')) {
            this.memory.behavioral['codingQueryCount'] = (this.memory.behavioral['codingQueryCount'] ?? 0) + 1;
        }
        // Track active hours
        const hourKey = `activeHour_${hour}`;
        this.memory.behavioral[hourKey] = (this.memory.behavioral[hourKey] ?? 0) + 1;
    }
    getHistory(limit) {
        const src = limit ? this.history.slice(-limit) : [...this.history];
        return src;
    }
    clearSession() {
        this.memory.session = {};
    }
    // Expose the data dir so other services can store alongside memory
    // Cosine similarity function for embeddings
    static cosineSimilarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < 768; i++) {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }
    static get dataDir() {
        return DATA_DIR;
    }
    /**
     * Get relevant memory entries based on query using embeddings and cosine similarity
     */
    async getRelevantMemory(query, k = 5) {
        try {
            // Get query embedding
            const queryVec = await OllamaClient_1.ollamaClient.getEmbedding(query);
            // Check if embeddings file exists
            if (!fs.existsSync(EMBEDDINGS_FILE)) {
                return [];
            }
            // Read all embeddings
            const buffer = fs.readFileSync(EMBEDDINGS_FILE);
            const numVectors = Math.floor(buffer.length / EMBEDDING_BYTES);
            // Load history from memory.json
            // this.loadMemory(); // Reload to make sure we have the latest history - removed as unnecessary
            if (this.history.length === 0) {
                return [];
            }
            const scores = [];
            for (let i = 0; i < Math.min(numVectors, this.history.length); i++) {
                // Extract vector from buffer
                const vectorBuffer = buffer.subarray(i * EMBEDDING_BYTES, (i + 1) * EMBEDDING_BYTES);
                const entryVec = new Float32Array(vectorBuffer.buffer, vectorBuffer.byteOffset, EMBEDDING_DIM);
                // Compute cosine similarity
                const similarity = ContextManager.cosineSimilarity(queryVec, entryVec);
                // Compute recency score (later = more recent = higher)
                const recencyScore = i / this.history.length;
                // Weighted score: 80% similarity, 20% recency
                const score = similarity * 0.8 + recencyScore * 0.2;
                scores.push({
                    entry: this.history[i],
                    score: score
                });
            }
            // Sort by score descending and return top K
            scores.sort((a, b) => b.score - a.score);
            return scores.slice(0, k).map(item => item.entry);
        }
        catch (error) {
            console.warn('Failed to get relevant memory:', error);
            return [];
        }
    }
}
exports.ContextManager = ContextManager;
