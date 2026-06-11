import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';

/**
 * Computer Control Tool - Direct mouse and keyboard control via bridge.py
 */
export const computerControlTool: Tool = {
  name: 'computer_control',
  description: 'Control the computer mouse and keyboard directly',
  schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['mouse_move', 'mouse_click', 'mouse_double_click', 'key_press', 'type_text', 'hotkey', 'scroll'],
        description: 'The action to perform'
      },
      x: {
        type: 'number',
        description: 'X coordinate for mouse actions'
      },
      y: {
        type: 'number',
        description: 'Y coordinate for mouse actions'
      },
      key: {
        type: 'string',
        description: 'Key to press for key_press action'
      },
      text: {
        type: 'string',
        description: 'Text to type for type_text action'
      },
      keys: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of keys for hotkey action (e.g., ["ctrl", "c"])'
      },
      clicks: {
        type: 'number',
        description: 'Number of scroll clicks (positive for up, negative for down)'
      },
      button: {
        type: 'string',
        enum: ['left', 'right', 'middle'],
        description: 'Mouse button for click action',
        default: 'left'
      }
    },
    required: ['action']
  },
  riskLevel: 'medium',
  mutatesWorkspace: false,
  requiresWorkspace: false,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const status = context?.statusCallback;

    try {
      status?.(`Executing computer control action: ${args.action}...`);

      const response = await fetch('http://localhost:8765/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Unknown error occurred in computer control'
        };
      }

      return {
        success: true,
        data: result.image ? { message: 'Screenshot captured', base64: result.image } : `Action ${args.action} executed successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute computer control action'
      };
    }
  }
};

ToolRegistry.register(computerControlTool);
