export declare class DeviceService {
    listDevices(): Promise<{
        name: string;
        type: string;
        id: string;
    }[]>;
    controlDevice(deviceId: string, command: string, params?: Record<string, unknown>): Promise<{
        success: boolean;
        error?: string;
    }>;
    getDeviceStatus(deviceId: string): Promise<{
        status: string;
        problem?: string;
    }>;
}
