import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import * as fs from 'fs';
import * as path from 'path';
import { ContextManager } from '../agent/ContextManager';

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

    // 1. Check if ComfyUI is available (RTX 3090 Power)
    const comfyAvailable = await checkComfyStatus();

    if (comfyAvailable) {
      status?.('JARVIS: ComfyUI detected. Utilizing high-fidelity generation pipeline...');
      return generateWithComfy(prompt, status);
    }

    // 2. Fallback to Ollama (Legacy/Experimental)
    status?.('JARVIS: ComfyUI offline. Falling back to Ollama neural core...');
    return generateWithOllama(prompt, status);
  }
};

async function checkComfyStatus(): Promise<boolean> {
  try {
    const res = await fetch('http://127.0.0.1:8188/history', { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

async function generateWithComfy(prompt: string, status?: (msg: string) => void): Promise<ToolResult> {
  try {
    // 0. Intelligent Node Discovery & Model Selection
    status?.('JARVIS: Analyzing ComfyUI object info for optimal workflow...');
    const infoRes = await fetch('http://127.0.0.1:8188/object_info');
    const info = await infoRes.json();

    // Check if we have the UNET/Z-Image specialized loader (often used for newer models like Flux/Z-Image)
    const hasUnetLoader = !!info['UNETLoader'];
    const hasDualClipLoader = !!info['DualCLIPLoader'];

    // Select the best model path
    let workflow: any;
    const seed = Math.floor(Math.random() * 1000000);

    if (hasUnetLoader && hasDualClipLoader) {
      status?.('JARVIS: Utilizing specialized Z-IMAGE pipeline...');
      // Modern workflow for models like Flux or Z-Image
      workflow = {
        "1": { "class_type": "UNETLoader", "inputs": { "unet_name": "z_image_bf16.safetensors" } },
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
      // Classic Checkpoint Workflow (SDXL/SD1.5)
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

    // 2. Queue Prompt
    status?.('JARVIS: Transmitting workflow to ComfyUI...');
    const response = await fetch('http://127.0.0.1:8188/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) throw new Error(`ComfyUI API error: ${response.status}`);
    const { prompt_id } = await response.json();
    console.log(`[ComfyUI] Workflow queued. Prompt ID: ${prompt_id}`);

    // 3. Poll for Completion (Max 120 seconds)
    status?.('JARVIS: Neural artist is painting... (ComfyUI)');
    let completed = false;
    let fileName = '';

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const historyRes = await fetch(`http://127.0.0.1:8188/history/${prompt_id}`);
      const history = await historyRes.json();

      if (history[prompt_id]) {
        completed = true;
        const output = history[prompt_id].outputs;
        console.log(`[ComfyUI] Execution complete. Outputs found for node(s): ${Object.keys(output).join(', ')}`);
        // Find the node that saved the image (likely Node 9)
        for (const nodeId in output) {
          if (output[nodeId].images) {
            fileName = output[nodeId].images[0].filename;
            console.log(`[ComfyUI] Target image found: ${fileName}`);
            break;
          }
        }
        break;
      }
    }

    if (!completed) throw new Error('ComfyUI generation timed out.');

    // 4. Download Result
    const viewRes = await fetch(`http://127.0.0.1:8188/view?filename=${fileName}&type=output`);
    const buffer = await viewRes.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const localFileName = `jarvis_comfy_${Date.now()}.png`;
    const filePath = path.join(ContextManager.dataDir, 'generated', localFileName);

    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
    console.warn('ComfyUI failed, falling back to Ollama:', error.message);
    return generateWithOllama(prompt, status);
  }
}

async function generateWithOllama(prompt: string, status?: (msg: string) => void): Promise<ToolResult> {
  const model = 'x/z-image-turbo';
  try {
    status?.(`JARVIS: Generating rapid prototype using Ollama ${model}...`);

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
    const filePath = path.join(ContextManager.dataDir, 'generated', fileName);

    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
