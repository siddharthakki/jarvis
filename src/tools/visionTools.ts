import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { desktopCapturer, screen } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Vision Tool - Allows JARVIS to see your screen
 */
const takeScreenshotTool: Tool = {
  name: 'take_screenshot',
  description: 'Captures the current screen contents so JARVIS can analyze what you are looking at',
  schema: {
    type: 'object',
    properties: {
      displayId: {
        type: 'string',
        description: 'ID of the display to capture (defaults to primary)'
      }
    }
  },
  riskLevel: 'medium',
  mutatesWorkspace: false,
  requiresWorkspace: false,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: screen.getPrimaryDisplay().workAreaSize
      });

      const primarySource = sources[0];
      if (!primarySource) throw new Error('No screen source found');

      // Create a temporary file for the screenshot
      const tempPath = path.join(process.cwd(), 'temp_vision_capture.png');
      const imageBuffer = primarySource.thumbnail.toPNG();
      await fs.writeFile(tempPath, imageBuffer);

      return {
        success: true,
        data: {
          path: tempPath,
          message: "Screen captured. Analyzing optical data, Sir.",
          base64: imageBuffer.toString('base64')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize optical sensors'
      };
    }
  }
};

ToolRegistry.register(takeScreenshotTool);
export { takeScreenshotTool };
