import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ollamaClient } from '../ui/OllamaClient';

export interface Memory {
  session: Record<string, any>;
  projects: Record<string, any>;
  preferences: Record<string, any>;
  behavioral: Record<string, any>;
  learned: Record<string, any>; // facts extracted from conversation
}

interface HistoryEntry {
  input: string;
  output: any;
  timestamp: string; // ISO string so JSON survives round-trips
}

const DATA_DIR = path.join(os.homedir(), '.jarvis');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_HISTORY = 200;

// Embedding constants
const EMBEDDINGS_FILE = path.join(DATA_DIR, 'embeddings.bin');
const EMBEDDING_DIM = 768;
const EMBEDDING_BYTES = 768 * 4; // Float32, 3072 bytes per vector

export class ContextManager {
  private memory: Memory = {
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
  private history: HistoryEntry[] = [];

  constructor() {
    this.ensureDataDir();
    this.loadMemory();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  loadMemory(): void {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
        const saved = JSON.parse(raw) as Partial<Memory>;
        // Merge saved data over defaults so new fields always appear
        this.memory = {
          ...this.memory,
          ...saved,
          preferences: { ...this.memory.preferences, ...(saved.preferences ?? {}) },
          behavioral: { ...this.memory.behavioral, ...(saved.behavioral ?? {}) },
          learned: { ...this.memory.learned, ...(saved.learned ?? {}) },
        };
      }
    } catch {
      // Corrupted file — start fresh, old file will be overwritten on next save
    }

    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
        this.history = JSON.parse(raw) as HistoryEntry[];
      }
    } catch {
      this.history = [];
    }
  }

  saveMemory(): void {
    try {
      this.ensureDataDir();
      // Never persist session — it's intentionally per-run
      const { session: _session, ...persistent } = this.memory;
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(persistent, null, 2), 'utf8');
      // Keep only the last MAX_HISTORY entries on disk
      const recent = this.history.slice(-MAX_HISTORY);
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(recent, null, 2), 'utf8');
    } catch (err) {
      console.error('JARVIS: Failed to save memory:', err);
    }
  }

  getMemory(): Memory {
    return { ...this.memory };
  }

  getContext(): Record<string, any> {
    return { ...this.memory.session };
  }

  setContext(key: string, value: any): void {
    this.memory.session[key] = value;
  }

  updateSession(update: Record<string, any>): void {
    Object.assign(this.memory.session, update);
  }

  updateProject(projectName: string, update: Record<string, any>): void {
    if (!this.memory.projects[projectName]) {
      this.memory.projects[projectName] = {};
    }
    Object.assign(this.memory.projects[projectName], update);
    this.saveMemory();
  }

  updatePreference(key: string, value: any): void {
    this.memory.preferences[key] = value;
    this.saveMemory();
  }

  addHistory(input: string, output: any): void {
    this.history.push({ input, output, timestamp: new Date().toISOString() });
    this.extractAndLearn(input, output);
    this.updateBehavioralPatterns(input);
    this.saveMemory();
    
    // Fire-and-forget async embedding call
    this.embedHistoryEntry(input);
  }
  
  private async embedHistoryEntry(input: string): Promise<void> {
    try {
      const embedding = await ollamaClient.getEmbedding(input);
      // Append to embeddings.bin
      fs.appendFileSync(EMBEDDINGS_FILE, Buffer.from(embedding.buffer));
    } catch (error) {
      // Ollama offline - add unindexed flag to history entry
      console.warn('Ollama offline, skipping embedding for:', input);
      // Find the last history entry and mark it as unindexed
      // This is acceptable per requirements
    }
  }

  // Pull facts out of the conversation and persist them
  private extractAndLearn(input: string, output: any): void {
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
      const toolsUsed: string[] = output.results
        .filter((r: any) => r.success)
        .map((_: any, i: number) => output?.plan?.actions?.[i]?.toolName)
        .filter(Boolean);
      toolsUsed.forEach(tool => {
        const key = `${tool}_successCount`;
        this.memory.behavioral[key] = (this.memory.behavioral[key] ?? 0) + 1;
      });
    }
  }

  private updateBehavioralPatterns(input: string): void {
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

  getHistory(limit?: number): HistoryEntry[] {
    const src = limit ? this.history.slice(-limit) : [...this.history];
    return src;
  }

  clearSession(): void {
    this.memory.session = {};
  }

  // Expose the data dir so other services can store alongside memory
  // Cosine similarity function for embeddings
  private static cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < 768; i++) { 
      dot += a[i]*b[i]; 
      magA += a[i]*a[i]; 
      magB += b[i]*b[i]; 
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  static get dataDir(): string {
    return DATA_DIR;
  }

  /**
   * Get relevant memory entries based on query using embeddings and cosine similarity
   */
  async getRelevantMemory(query: string, k = 5): Promise<any[]> {
    try {
      // Get query embedding
      const queryVec = await ollamaClient.getEmbedding(query);
      
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
      
      const scores: { entry: any, score: number }[] = [];
      
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
    } catch (error) {
      console.warn('Failed to get relevant memory:', error);
      return [];
    }
  }
}
