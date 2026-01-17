import { useQuery } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';

export interface DeviceConfig {
    id: string;
    device_name: string;
    sensor_name?: string;
    firmware_version?: string;
    update_available?: boolean;
    last_calibrated?: string;
    next_calibration?: string;
}

const USE_MOCK_DATA = true;

const mockDeviceConfig: DeviceConfig = {
    id: '1',
    device_name: 'Main Entrance Sensor',
    sensor_name: 'Main Entrance Sensor',
    firmware_version: '2.1.0',
    update_available: false,
    last_calibrated: '2023-01-01',
    next_calibration: '2024-01-01'
};

export const useDeviceConfig = (deviceId: string) => {
    return useQuery({
        queryKey: ['deviceConfig', deviceId],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Return mock data, ideally varying by ID but for now static is fine
                return mockDeviceConfig;
            }
            const { data } = await axiosInstance.get(`/devices/${deviceId}/config`);
            return data as DeviceConfig;
        },
        enabled: !!deviceId
    });
};
