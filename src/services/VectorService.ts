import * as fs from 'fs';
import * as path from 'path';
import { ollamaClient } from '../ui/OllamaClient';
import { ContextManager } from '../agent/ContextManager';

export interface VectorMetadata {
  content: string;
  source: string;
  type: 'conversation' | 'file' | 'email' | 'note' | 'fact';
  timestamp: string;
  tags?: string[];
  [key: string]: any;
}

const EMBEDDING_DIM = 768; // nomic-embed-text dimension
const EMBEDDING_BYTES = EMBEDDING_DIM * 4; // Float32

export class VectorService {
  private dataDir: string;
  private embeddingsFile: string;
  private metadataFile: string;
  private metadata: VectorMetadata[] = [];

  constructor() {
    this.dataDir = ContextManager.dataDir;
    this.embeddingsFile = path.join(this.dataDir, 'vector_store.bin');
    this.metadataFile = path.join(this.dataDir, 'vector_metadata.json');
    this.loadMetadata();
  }

  private loadMetadata(): void {
    try {
      if (fs.existsSync(this.metadataFile)) {
        this.metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
      }
    } catch (error) {
      console.error('Failed to load vector metadata:', error);
      this.metadata = [];
    }
  }

  private saveMetadata(): void {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(this.metadata, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save vector metadata:', error);
    }
  }

  /**
   * Add text to the vector store
   */
  async addText(content: string, metadata: Omit<VectorMetadata, 'content' | 'timestamp'>): Promise<void> {
    try {
      const embedding = await ollamaClient.getEmbedding(content);
      const meta: VectorMetadata = {
        source: metadata.source,
        type: metadata.type,
        tags: metadata.tags,
        ...metadata,
        content,
        timestamp: new Date().toISOString()
      };

      // Append vector to bin file
      fs.appendFileSync(this.embeddingsFile, Buffer.from(embedding.buffer));

      // Add to metadata and save
      this.metadata.push(meta);
      this.saveMetadata();

      console.log(`[VectorService] Indexed new ${meta.type} entry from ${meta.source}`);
    } catch (error) {
      console.error('[VectorService] Indexing failed:', error);
    }
  }

  /**
   * Search for similar content
   */
  async search(query: string, limit: number = 5): Promise<VectorMetadata[]> {
    if (!fs.existsSync(this.embeddingsFile) || this.metadata.length === 0) {
      return [];
    }

    try {
      const queryVec = await ollamaClient.getEmbedding(query);
      const buffer = fs.readFileSync(this.embeddingsFile);
      const numVectors = Math.floor(buffer.length / EMBEDDING_BYTES);

      const actualCount = Math.min(numVectors, this.metadata.length);
      const scores: { meta: VectorMetadata, score: number }[] = [];

      for (let i = 0; i < actualCount; i++) {
        const vectorBuffer = buffer.subarray(i * EMBEDDING_BYTES, (i + 1) * EMBEDDING_BYTES);
        const entryVec = new Float32Array(vectorBuffer.buffer, vectorBuffer.byteOffset, EMBEDDING_DIM);

        const similarity = this.cosineSimilarity(queryVec, entryVec);

        scores.push({
          meta: this.metadata[i],
          score: similarity
        });
      }

      // Sort by similarity descending
      scores.sort((a, b) => b.score - a.score);

      return scores.slice(0, limit).map(s => s.meta);
    } catch (error) {
      console.error('[VectorService] Search failed:', error);
      return [];
    }
  }

  /**
   * Index a file's content
   */
  async indexFile(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8');
      // For large files, we should chunk them. Simple line-based or size-based chunking.
      const chunks = this.chunkText(content, 1000); // 1000 chars per chunk

      for (let i = 0; i < chunks.length; i++) {
        await this.addText(chunks[i], {
          source: filePath,
          type: 'file',
          chunkIndex: i,
          totalChunks: chunks.length
        });
      }
    } catch (error) {
      console.error(`[VectorService] Failed to index file ${filePath}:`, error);
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const mag = Math.sqrt(magA) * Math.sqrt(magB);
    return mag === 0 ? 0 : dot / mag;
  }
}

export const vectorService = new VectorService();
