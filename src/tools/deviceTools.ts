/**
 * Device Tools - Tools for interacting with devices
 */
import { Tool, ToolContext, ToolResult } from './ToolTypes';
import { ToolRegistry } from './ToolRegistry';
import { DeviceService } from '../services/DeviceService';

// Initialize the device service
const deviceService = new DeviceService();

// List devices tool
const listDevicesTool: Tool = {
  name: 'list_devices',
  description: 'List all connected devices',
  schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Filter devices by type (optional)'
      }
    },
    required: []
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const type = args.type as string;

    try {
      const devices = await deviceService.listDevices();
      // Filter by type if specified
      let result = devices;
      if (type) {
        result = devices.filter(device => device.type === type);
      }
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list devices'
      };
    }
  }
};

// Control device tool
const controlDeviceTool: Tool = {
  name: 'control_device',
  description: 'Control a specific device',
  schema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'ID of the device to control'
      },
      command: {
        type: 'string',
        description: 'Command to send to the device (enable or disable)'
      },
      params: {
        type: 'object',
        description: 'Parameters for the command (optional)'
      }
    },
    required: ['deviceId', 'command']
  },
  riskLevel: 'medium',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const deviceId = args.deviceId as string;
    const command = args.command as string;
    const params = args.params as Record<string, unknown>;

    try {
      const result = await deviceService.controlDevice(deviceId, command, params);
      if (result.success) {
        return {
          success: true,
          data: 'Device command executed successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to execute device command'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to control device'
      };
    }
  }
};

// Get device status tool
const getDeviceStatusTool: Tool = {
  name: 'get_device_status',
  description: 'Get status information for a specific device',
  schema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'ID of the device to get status for'
      }
    },
    required: ['deviceId']
  },
  riskLevel: 'safe',
  mutatesWorkspace: false,
  requiresWorkspace: true,
  async execute(args: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const deviceId = args.deviceId as string;

    try {
      const status = await deviceService.getDeviceStatus(deviceId);
      return {
        success: true,
        data: status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get device status'
      };
    }
  }
};

// Register the tools
ToolRegistry.register(listDevicesTool);
ToolRegistry.register(controlDeviceTool);
ToolRegistry.register(getDeviceStatusTool);

export { listDevicesTool, controlDeviceTool, getDeviceStatusTool };
