/**
 * Device Service - Handles device operations
 * 
 * This service handles device operations including:
 * - Controlling connected devices
 * - Monitoring device status
 * - Managing device configurations
 * - Handling device discovery and pairing
 */
import { execSync } from 'child_process';
import { platform } from 'os';

export class DeviceService {
  // Actual implementation for listing devices
  async listDevices(): Promise<{ name: string, type: string, id: string }[]> {
    // Only support Windows platforms
    if (platform() !== 'win32') {
      throw new Error('Device listing is only supported on Windows');
    }

    try {
      // Use PowerShell to get PnP devices
      const result = execSync(
        `powershell -Command "Get-PnpDevice -Status OK | Select-Object FriendlyName, Class, InstanceId | ConvertTo-Json"`,
        { encoding: 'utf8' }
      );
      
      // Parse the JSON output
      const devices = JSON.parse(result);
      
      // Handle both array and single object cases
      const deviceArray = Array.isArray(devices) ? devices : [devices];
      
      // Transform to required format
      return deviceArray.map((device: any) => ({
        name: device.FriendlyName || 'Unknown Device',
        type: device.Class || 'unknown',
        id: device.InstanceId || ''
      }));
    } catch (error) {
      console.error('Error listing devices:', error);
      throw new Error('Failed to list devices');
    }
  }

  async controlDevice(deviceId: string, command: string, params?: Record<string, unknown>): Promise<{ success: boolean, error?: string }> {
    // Only support Windows platforms
    if (platform() !== 'win32') {
      return { success: false, error: 'Device control is only supported on Windows' };
    }

    try {
      // Use PowerShell to enable/disable device
      if (command === 'enable') {
        execSync(
          `powershell -Command "Enable-PnpDevice -InstanceId '${deviceId}' -Confirm:$false"`,
          { encoding: 'utf8' }
        );
      } else if (command === 'disable') {
        execSync(
          `powershell -Command "Disable-PnpDevice -InstanceId '${deviceId}' -Confirm:$false"`,
          { encoding: 'utf8' }
        );
      } else {
        return { success: false, error: 'Unsupported command. Only "enable" and "disable" are supported.' };
      }
      
      return { success: true };
    } catch (error: any) {
      // Check if it's an access denied error
      if (error.message && error.message.includes('access denied')) {
        return { success: false, error: 'Requires administrator privileges' };
      }
      console.error('Error controlling device:', error);
      return { success: false, error: error.message || 'Failed to control device' };
    }
  }

  async getDeviceStatus(deviceId: string): Promise<{ status: string, problem?: string }> {
    // Only support Windows platforms
    if (platform() !== 'win32') {
      throw new Error('Device status is only supported on Windows');
    }

    try {
      const result = execSync(
        `powershell -Command "Get-PnpDevice -InstanceId '${deviceId}' | Select-Object Status, Problem | ConvertTo-Json"`,
        { encoding: 'utf8' }
      );
      
      // Parse the JSON output
      const device = JSON.parse(result);
      
      return {
        status: device.Status || 'unknown',
        problem: device.Problem || undefined
      };
    } catch (error) {
      console.error('Error getting device status:', error);
      throw new Error('Failed to get device status');
    }
  }
}

// Placeholder tool registrations (to be implemented in next phase)
/*
export const listDevicesTool = {
  name: 'list_devices',
  description: 'List all connected devices',
  // Tool implementation will be added in next phase
};

export const controlDeviceTool = {
  name: 'control_device',
  description: 'Control a specific device',
  // Tool implementation will be added in next phase
};
*/