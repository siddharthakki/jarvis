import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import * as fs from 'fs';
import * as path from 'path';
import { ContextManager } from '../agent/ContextManager';

let discoveredComfyUrl: string | null = null;

/**
 * Generate Image Tool - Leverages ComfyUI if available, fallbacks to Ollama
 */
export const generateImageTool: Tool = {
  name: 'generate_image',
  description: 'Generate a high-quality image locally using ComfyUI or Ollama',
  schema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the image to generate'
      },
      quality: {
        type: 'string',
        enum: ['standard', 'high', 'ultra'],
        description: 'Quality tier (Ultra uses ComfyUI if available)',
        default: 'standard'
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

    // 1. Check if ComfyUI is available
    const comfyUrl = await discoverComfy();

    if (comfyUrl) {
      status?.('JARVIS: ComfyUI detected. Utilizing high-fidelity generation pipeline...');
      try {
        return await generateWithComfy(comfyUrl, prompt, status);
      } catch (error: any) {
        status?.(`JARVIS: ComfyUI execution failed: ${error.message}`);
        console.error('ComfyUI Error:', error);
        return {
          success: false,
          error: `ComfyUI failed: ${error.message}. Sir, I attempted to use the neural engine but encountered a technical obstacle.`
        };
      }
    }

    // 2. Fallback to Ollama ONLY if ComfyUI is physically offline
    status?.('JARVIS: ComfyUI offline. Attempting Ollama neural core fallback...');
    return generateWithOllama(prompt, status);
  }
};

async function discoverComfy(): Promise<string | null> {
  const endpoints = ['http://127.0.0.1:8188', 'http://localhost:8188'];
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/history`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        discoveredComfyUrl = url;
        return url;
      }
    } catch (e) {
      // Silently try next
    }
  }
  return null;
}

async function generateWithComfy(baseUrl: string, prompt: string, status?: (msg: string) => void): Promise<ToolResult> {
  try {
    // 0. Intelligent Node Discovery & Model Selection
    status?.('JARVIS: Analyzing ComfyUI object info for optimal workflow...');
    const infoRes = await fetch(`${baseUrl}/object_info`);
    const info = await infoRes.json();

    const unetLoaderInfo = info['UNETLoader'];
    const dualClipLoaderInfo = info['DualCLIPLoader'];

    const availableUnets = unetLoaderInfo?.input?.required?.unet_name?.[0] || [];
    const availableClips = dualClipLoaderInfo?.input?.required?.clip_name1?.[0] || [];

    const hasZImageModels = availableUnets.includes('z_image_bf16.safetensors') &&
                            availableClips.includes('t5xxl_fp16.safetensors');

    let workflow: any;
    const seed = Math.floor(Math.random() * 1000000);

    if (hasZImageModels) {
      status?.('JARVIS: Utilizing specialized Z-IMAGE pipeline...');
      const unetInputs: any = { "unet_name": "z_image_bf16.safetensors" };

      // Add weight_dtype if required by the node
      if (unetLoaderInfo?.input?.required?.weight_dtype) {
        unetInputs["weight_dtype"] = "default";
      }

      workflow = {
        "1": { "class_type": "UNETLoader", "inputs": unetInputs },
        "2": { "class_type": "DualCLIPLoader", "inputs": { "clip_name1": "t5xxl_fp16.safetensors", "clip_name2": "clip_l.safetensors", "type": "flux" } },
        "3": { "class_type": "VAELoader", "inputs": { "vae_name": "ae.safetensors" } },
        "4": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
        "5": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["2", 0] } },
        "6": { "class_type": "KSampler", "inputs": { "seed": seed, "steps": 20, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1", 0], "positive": ["5", 0], "negative": ["7", 0], "latent_image": ["4", 0] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "", "clip": ["2", 0] } },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["6", 0], "vae": ["3", 0] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "JARVIS_Z", "images": ["8", 0] } }
      };
    } else {
      const availableCkpts = info.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
      let selectedCkpt = availableCkpts.find((c: string) => c.toLowerCase().includes('xl')) ||
                        availableCkpts.find((c: string) => c.includes('z_image')) ||
                        availableCkpts[0];

      const isXL = selectedCkpt?.toLowerCase().includes('xl');
      status?.(`JARVIS: Utilizing standard checkpoint: ${selectedCkpt}`);

      workflow = {
        "3": { "class_type": "KSampler", "inputs": { "seed": seed, "steps": 25, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": selectedCkpt } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": isXL ? 1024 : 512, "height": isXL ? 1024 : 512, "batch_size": 1 } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "low quality, blurry, text, watermark", "clip": ["4", 1] } },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "JARVIS_COMFY", "images": ["8", 0] } }
      };
    }

    status?.('JARVIS: Transmitting workflow to ComfyUI...');
    const response = await fetch(`${baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ComfyUI API error: ${response.status} - ${errorText}`);
    }

    const promptResponse = await response.json();
    if (promptResponse.node_errors && Object.keys(promptResponse.node_errors).length > 0) {
      throw new Error(`ComfyUI Workflow errors: ${JSON.stringify(promptResponse.node_errors)}`);
    }

    const { prompt_id } = promptResponse;

    status?.('JARVIS: Neural artist is painting... (ComfyUI)');
    let completed = false;
    let fileName = '';

    for (let i = 0; i < 150; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const historyRes = await fetch(`${baseUrl}/history/${prompt_id}`);
      const history = await historyRes.json();

      if (history[prompt_id]) {
        completed = true;
        const output = history[prompt_id].outputs;
        for (const nodeId in output) {
          if (output[nodeId].images) {
            fileName = output[nodeId].images[0].filename;
            break;
          }
        }
        break;
      }
    }

    if (!completed) throw new Error('ComfyUI generation timed out.');
    if (!fileName) throw new Error('ComfyUI execution completed but no output image was found.');

    const viewRes = await fetch(`${baseUrl}/view?filename=${fileName}&type=output`);
    const buffer = await viewRes.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const localFileName = `jarvis_comfy_${Date.now()}.png`;
    const folderPath = path.join(ContextManager.dataDir, 'generated');
    const filePath = path.join(folderPath, localFileName);

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return {
      success: true,
      data: {
        message: 'High-fidelity image generated via ComfyUI, Sir.',
        filePath,
        base64: base64Data
      }
    };
  } catch (error: any) {
    throw error;
  }
}

async function generateWithOllama(prompt: string, status?: (msg: string) => void): Promise<ToolResult> {
  const model = 'x/z-image-turbo';
  try {
    status?.(`JARVIS: ComfyUI failed or unavailable. Attempting Ollama fallback with ${model}...`);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
    const result = await response.json();
    const base64Data = result.response;

    if (!base64Data) throw new Error('No image data received from model');

    const fileName = `jarvis_ollama_${Date.now()}.png`;
    const folderPath = path.join(ContextManager.dataDir, 'generated');
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(filePath, base64Data, 'base64');

    return {
      success: true,
      data: {
        message: 'Prototype image generated successfully, Sir.',
        filePath: filePath,
        base64: base64Data
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image generation failed'
    };
  }
}

ToolRegistry.register(generateImageTool);
