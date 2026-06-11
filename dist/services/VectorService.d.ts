export interface VectorMetadata {
    content: string;
    source: string;
    type: 'conversation' | 'file' | 'email' | 'note' | 'fact';
    timestamp: string;
    tags?: string[];
    [key: string]: any;
}
export declare class VectorService {
    private dataDir;
    private embeddingsFile;
    private metadataFile;
    private metadata;
    constructor();
    private loadMetadata;
    private saveMetadata;
    /**
     * Add text to the vector store
     */
    addText(content: string, metadata: Omit<VectorMetadata, 'content' | 'timestamp'>): Promise<void>;
    /**
     * Search for similar content
     */
    search(query: string, limit?: number): Promise<VectorMetadata[]>;
    /**
     * Index a file's content
     */
    indexFile(filePath: string): Promise<void>;
    private chunkText;
    private cosineSimilarity;
}
export declare const vectorService: VectorService;
