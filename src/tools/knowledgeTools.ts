import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { vectorService } from '../services/VectorService';

/**
 * Remember Fact Tool - Save a fact to the long-term knowledge base
 */
export const rememberFactTool: Tool = {
  name: 'remember_fact',
  description: 'Store an important fact or piece of information in long-term memory',
  schema: {
    type: 'object',
    properties: {
      fact: {
        type: 'string',
        description: 'The fact to remember'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags for categorization'
      }
    },
    required: ['fact']
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: false,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const fact = args.fact as string;
    const tags = args.tags as string[] || [];

    try {
      await vectorService.addText(fact, {
        source: 'user_instruction',
        type: 'fact',
        tags
      });

      return {
        success: true,
        data: 'Fact committed to long-term memory, Sir.'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Memory encryption failed'
      };
    }
  }
};

/**
 * Search Knowledge Base Tool - Query long-term memory for relevant information
 */
export const searchKnowledgeBaseTool: Tool = {
  name: 'search_knowledge_base',
  description: 'Search your long-term memory and indexed files for relevant information',
  schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to search for'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 5)'
      }
    },
    required: ['query']
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: false,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const query = args.query as string;
    const limit = args.limit as number || 5;

    try {
      const results = await vectorService.search(query, limit);

      if (results.length === 0) {
        return {
          success: true,
          data: 'No relevant information found in long-term memory, Sir.'
        };
      }

      return {
        success: true,
        data: results.map(r => ({
          content: r.content,
          source: r.source,
          type: r.type,
          timestamp: r.timestamp
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Knowledge retrieval failed'
      };
    }
  }
};

/**
 * Index File for RAG Tool - Add a file to the knowledge base
 */
export const indexFileTool: Tool = {
  name: 'index_file',
  description: 'Add a file to the knowledge base for future retrieval and reasoning',
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to index'
      }
    },
    required: ['path']
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const filePath = args.path as string;

    try {
      await vectorService.indexFile(filePath);
      return {
        success: true,
        data: `File ${filePath} has been indexed into your long-term memory, Sir.`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File indexing failed'
      };
    }
  }
};

// Register the tools
ToolRegistry.register(rememberFactTool);
ToolRegistry.register(searchKnowledgeBaseTool);
ToolRegistry.register(indexFileTool);
