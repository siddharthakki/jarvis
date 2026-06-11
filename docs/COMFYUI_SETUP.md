# ComfyUI Setup Guide

## Exporting Workflow from ComfyUI

1. Open your ComfyUI instance
2. Create or load your desired workflow
3. Click the "Save" button in ComfyUI
4. Select "Save (API Format)" option
5. Save the file as `C:\Projects\jarvis\config\comfy\workflow.json`

## Configuration

Edit `C:\Projects\jarvis\config\comfy\config.json` to match your workflow node IDs:
- `promptNodeIds`: Array of node IDs that contain the prompt input
- `seedNodeIds`: Array of node IDs that contain the seed input  
- `widthNodeIds`: Array of node IDs that contain the width input
- `heightNodeIds`: Array of node IDs that contain the height input
- `stepsNodeIds`: Array of node IDs that contain the steps input

## Testing ComfyUI

You can test if ComfyUI is running:
```bash
curl http://127.0.0.1:8188/system_stats
```

## Generated Images

Generated images are saved to: `C:\Projects\jarvis\generated\images\`
Files follow the naming pattern: `jarvis_comfy_<timestamp>.png`