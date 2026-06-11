"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceStatusTool = exports.controlDeviceTool = exports.listDevicesTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const DeviceService_1 = require("../services/DeviceService");
// Initialize the device service
const deviceService = new DeviceService_1.DeviceService();
// List devices tool
const listDevicesTool = {
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
    async execute(args, context) {
        const type = args.type;
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list devices'
            };
        }
    }
};
exports.listDevicesTool = listDevicesTool;
// Control device tool
const controlDeviceTool = {
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
    async execute(args, context) {
        const deviceId = args.deviceId;
        const command = args.command;
        const params = args.params;
        try {
            const result = await deviceService.controlDevice(deviceId, command, params);
            if (result.success) {
                return {
                    success: true,
                    data: 'Device command executed successfully'
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to execute device command'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to control device'
            };
        }
    }
};
exports.controlDeviceTool = controlDeviceTool;
// Get device status tool
const getDeviceStatusTool = {
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
    async execute(args, context) {
        const deviceId = args.deviceId;
        try {
            const status = await deviceService.getDeviceStatus(deviceId);
            return {
                success: true,
                data: status
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get device status'
            };
        }
    }
};
exports.getDeviceStatusTool = getDeviceStatusTool;
// Register the tools
ToolRegistry_1.ToolRegistry.register(listDevicesTool);
ToolRegistry_1.ToolRegistry.register(controlDeviceTool);
ToolRegistry_1.ToolRegistry.register(getDeviceStatusTool);
