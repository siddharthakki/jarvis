# ComfyUI Setup Guide

This document explains how to configure JARVIS to work with your local ComfyUI installation for image generation.

## Prerequisites

- ComfyUI installed and running locally
- Node.js environment configured
- JARVIS project properly set up

## Exporting Workflow from ComfyUI

1. Open your ComfyUI interface in a browser
2. Create or load your desired workflow
3. Click the **"Save"** button in ComfyUI
4. Select **"Save API Format"** 
5. Save the file as `workflow.json` in the JARVIS config directory:
   ```
   C:\Projects\jarvis\config\comfy\workflow.json
   ```

## Configuring JARVIS

The configuration file is located at:
```
C:\Projects\jarvis\config\comfy\config.json
```

If it doesn't exist, a sample configuration will be created automatically when you first try to generate an image.

### Configuration Parameters

```json
{
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
}
```

### Node ID Configuration

You need to identify the node IDs in your workflow that correspond to different parameters:

- **promptNodeIds**: Array of node IDs that accept text prompts
- **seedNodeIds**: Array of node IDs that accept seed values  
- **widthNodeIds**: Array of node IDs that accept width values
- **heightNodeIds**: Array of node IDs that accept height values
- **stepsNodeIds**: Array of node IDs that accept step values

To find these in your workflow:
1. Open the `workflow.json` file in a text editor
2. Look for nodes with input fields matching the parameter names
3. Set the appropriate node IDs in your config

## Testing ComfyUI

You can verify that ComfyUI is accessible from JARVIS:

```bash
curl http://127.0.0.1:8188/system_stats
```

This should return system information about your ComfyUI installation.

## Generated Images Location

Generated images are saved to:
```
C:\Projects\jarvis\generated\images\
```

Each image is named with the pattern: `jarvis_comfy_<timestamp>.png`

## Troubleshooting

### Common Issues

1. **ComfyUI Not Running**: Make sure ComfyUI is running on `http://127.0.0.1:8188`
2. **Workflow File Missing**: Ensure `workflow.json` exists at the configured path
3. **Node IDs Incorrect**: Verify that node IDs in config match your workflow
4. **Permission Denied**: Make sure JARVIS has read/write access to the directories

### Error Messages

- "ComfyUI is not running at http://127.0.0.1:8188" - ComfyUI server not accessible
- "Workflow file not found at ..." - Missing workflow.json file
- "No image found in history outputs" - Workflow executed but no output images generated

## Example Workflow Structure

Here's an example of what a typical workflow structure looks like for reference:

```json
{
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "seed": 12345,
      "steps": 20,
      "cfg": 7,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    }
  },
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "model.ckpt"
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "width": 1024,
      "height": 1024,
      "batch_size": 1
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "prompt here",
      "clip": ["4", 1]
    }
  }
}