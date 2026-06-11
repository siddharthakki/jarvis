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
exports.vectorService = exports.VectorService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const OllamaClient_1 = require("../ui/OllamaClient");
const ContextManager_1 = require("../agent/ContextManager");
const EMBEDDING_DIM = 768; // nomic-embed-text dimension
const EMBEDDING_BYTES = EMBEDDING_DIM * 4; // Float32
class VectorService {
    constructor() {
        this.metadata = [];
        this.dataDir = ContextManager_1.ContextManager.dataDir;
        this.embeddingsFile = path.join(this.dataDir, 'vector_store.bin');
        this.metadataFile = path.join(this.dataDir, 'vector_metadata.json');
        this.loadMetadata();
    }
    loadMetadata() {
        try {
            if (fs.existsSync(this.metadataFile)) {
                this.metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
            }
        }
        catch (error) {
            console.error('Failed to load vector metadata:', error);
            this.metadata = [];
        }
    }
    saveMetadata() {
        try {
            fs.writeFileSync(this.metadataFile, JSON.stringify(this.metadata, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Failed to save vector metadata:', error);
        }
    }
    /**
     * Add text to the vector store
     */
    async addText(content, metadata) {
        try {
            const embedding = await OllamaClient_1.ollamaClient.getEmbedding(content);
            const meta = {
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
        }
        catch (error) {
            console.error('[VectorService] Indexing failed:', error);
        }
    }
    /**
     * Search for similar content
     */
    async search(query, limit = 5) {
        if (!fs.existsSync(this.embeddingsFile) || this.metadata.length === 0) {
            return [];
        }
        try {
            const queryVec = await OllamaClient_1.ollamaClient.getEmbedding(query);
            const buffer = fs.readFileSync(this.embeddingsFile);
            const numVectors = Math.floor(buffer.length / EMBEDDING_BYTES);
            const actualCount = Math.min(numVectors, this.metadata.length);
            const scores = [];
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
        }
        catch (error) {
            console.error('[VectorService] Search failed:', error);
            return [];
        }
    }
    /**
     * Index a file's content
     */
    async indexFile(filePath) {
        try {
            if (!fs.existsSync(filePath))
                return;
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
        }
        catch (error) {
            console.error(`[VectorService] Failed to index file ${filePath}:`, error);
        }
    }
    chunkText(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        return chunks;
    }
    cosineSimilarity(a, b) {
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
exports.VectorService = VectorService;
exports.vectorService = new VectorService();
