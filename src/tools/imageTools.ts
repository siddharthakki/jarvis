import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import * as fs from 'fs';
import * as path from 'path';
import { ContextManager } from '../agent/ContextManager';

// Configuration file paths
const CONFIG_PATH = path.join(ContextManager.dataDir, 'config', 'comfy', 'config.json');
const WORKFLOW_PATH = path.join(ContextManager.dataDir, 'config', 'comfy', 'workflow.json');
const EXAMPLE_CONFIG_PATH = path.join(ContextManager.dataDir, 'config', 'comfy', 'config.example.json');

/**
 * Generate Image Tool - Uses configured ComfyUI workflow instead of hard-coded approaches
 */
export const generateImageTool: Tool = {
  name: 'generate_image',
  description: 'Generate a high-quality image using configured ComfyUI workflow',
  schema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the image to generate'
      }
    },
    required: ['prompt']
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: false,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const prompt = args.prompt as string;
    const status = context?.statusCallback;

    try {
      // Load configuration
      const config = loadConfig();
      
      // Check if ComfyUI is available
      const response = await fetch(`${config.baseUrl}/system_stats`);
      if (!response.ok) {
        return {
          success: false,
          error: `ComfyUI is not running at ${config.baseUrl}`
        };
      }

      // Load workflow from configured path
      let workflowJson;
      try {
        workflowJson = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf-8'));
      } catch (error) {
        return {
          success: false,
          error: `Workflow file not found at ${WORKFLOW_PATH}`
        };
      }

      // Deep clone workflow
      const workflow = JSON.parse(JSON.stringify(workflowJson));

      // Inject prompt into configured prompt node IDs
      if (config.promptNodeIds && Array.isArray(config.promptNodeIds)) {
        for (const nodeId of config.promptNodeIds) {
          if (workflow[nodeId]) {
            workflow[nodeId].inputs[config.promptInputKey] = prompt;
          }
        }
      }

      // Inject seed into configured seed node IDs if present
      if (config.seedNodeIds && Array.isArray(config.seedNodeIds)) {
        const seed = Math.floor(Math.random() * 1000000);
        for (const nodeId of config.seedNodeIds) {
          if (workflow[nodeId]) {
            workflow[nodeId].inputs[config.seedInputKey] = seed;
          }
        }
      }

      // Inject width, height, steps if present
      if (config.widthNodeIds && Array.isArray(config.widthNodeIds)) {
        for (const nodeId of config.widthNodeIds) {
          if (workflow[nodeId]) {
            workflow[nodeId].inputs[config.widthInputKey] = 1024;
          }
        }
      }

      if (config.heightNodeIds && Array.isArray(config.heightNodeIds)) {
        for (const nodeId of config.heightNodeIds) {
          if (workflow[nodeId]) {
            workflow[nodeId].inputs[config.heightInputKey] = 1024;
          }
        }
      }

      if (config.stepsNodeIds && Array.isArray(config.stepsNodeIds)) {
        for (const nodeId of config.stepsNodeIds) {
          if (workflow[nodeId]) {
            workflow[nodeId].inputs[config.stepsInputKey] = 20;
          }
        }
      }

      status?.('JARVIS: Transmitting workflow to ComfyUI...');
      const promptResponse = await fetch(`${config.baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
      });

      if (!promptResponse.ok) {
        const errorText = await promptResponse.text();
        return {
          success: false,
          error: `ComfyUI /prompt failed: ${errorText}`
        };
      }

      const responseJson = await promptResponse.json();
      const { prompt_id } = responseJson;

      if (!prompt_id) {
        return {
          success: false,
          error: 'No prompt_id returned from ComfyUI'
        };
      }

      status?.('JARVIS: Neural artist is painting... (ComfyUI)');
      let completed = false;
      let fileName = '';
      let outputNodeIds: string[] = [];

      // Poll for completion
      for (let i = 0; i < 150; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const historyRes = await fetch(`${config.baseUrl}/history/${prompt_id}`);
        
        if (!historyRes.ok) {
          continue;
        }
        
        const history = await historyRes.json();

        if (history[prompt_id]) {
          completed = true;
          const output = history[prompt_id].outputs;
          
          // Find all nodes with images
          for (const nodeId in output) {
            if (output[nodeId].images && output[nodeId].images.length > 0) {
              fileName = output[nodeId].images[0].filename;
              outputNodeIds.push(nodeId);
              break;
            }
          }
          
          // If no image found, check all nodes for output keys
          if (!fileName) {
            const nodeOutputs: string[] = [];
            for (const nodeId in output) {
              nodeOutputs.push(`${nodeId}: ${JSON.stringify(output[nodeId])}`);
            }
            return {
              success: false,
              error: `ComfyUI execution completed but no image found in history outputs. Available keys: ${nodeOutputs.join(', ')}`
            };
          }
          
          break;
        }
      }

      if (!completed) {
        return {
          success: false,
          error: 'ComfyUI generation timed out'
        };
      }

      if (!fileName) {
        return {
          success: false,
          error: 'ComfyUI execution completed but no output image was found'
        };
      }

      // Download the image using /view endpoint
      const viewRes = await fetch(`${config.baseUrl}/view?filename=${fileName}&type=output`);
      
      if (!viewRes.ok) {
        return {
          success: false,
          error: `Failed to download image from ComfyUI: ${viewRes.status}`
        };
      }

      const buffer = await viewRes.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');

      // Save final PNG to generated directory
      const timestamp = Date.now();
      const localFileName = `jarvis_comfy_${timestamp}.png`;
      const outputDir = path.join(ContextManager.dataDir, 'generated', 'images');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filePath = path.join(outputDir, localFileName);
      fs.writeFileSync(filePath, Buffer.from(buffer));

      return {
        success: true,
        data: {
          message: 'High-fidelity image generated via ComfyUI, Sir.',
          filePath,
          base64: base64Data,
          promptId: prompt_id,
          filename: localFileName
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Image generation failed'
      };
    }
  }
};

/**
 * Load configuration from file or create example if missing
 */
function loadConfig(): any {
  // Check if config exists
  if (!fs.existsSync(CONFIG_PATH)) {
    // Create directory if it doesn't exist
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Create example config if missing
    if (!fs.existsSync(EXAMPLE_CONFIG_PATH)) {
      const exampleConfig = {
        "baseUrl": "http://127.0.0.1:8188",
        "workflowPath": "C:/Projects/jarvis/config/comfy/workflow.json",
        "outputDir": "C:/Projects/jarvis/generated/images",
        "promptNodeIds": ["6"],
        "promptInputKey": "text",
        "seedNodeIds": ["3"],
        "seedInputKey": "seed",
        "widthNodeIds": ["5"],
        "widthInputKey": "width",
        "heightNodeIds": ["5"],
        "heightInputKey": "height",
        "stepsNodeIds": ["3"],
        "stepsInputKey": "steps"
      };
      
      fs.writeFileSync(EXAMPLE_CONFIG_PATH, JSON.stringify(exampleConfig, null, 2));
    }
    
    throw new Error(`Configuration file not found at ${CONFIG_PATH}. Example configuration created.`);
  }

  // Load and parse config
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Failed to parse configuration: ${error}`);
  }
}

ToolRegistry.register(generateImageTool);