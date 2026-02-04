import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';
import useToasterNotification from '../hooks/useToasterNotification';
import { mockSensors } from '../mockData/sensors';

import { USE_MOCK_DATA } from '../config';

// Define SensorReading interface
export interface SensorReading {
    id: number;
    sensor_id: number;
    device_name: string;
    mac_address: string;
    timestamp: string;
    event_id?: number;
    // Add other fields as per your backend schema
    [key: string]: any;
}

/**
 * List all sensor readings with optional filters
 * GET /api/devices/readings/
 */
export const useSensorReadings = (filters?: {
    sensor_id?: number;
    device_name?: string;
    event_id?: number
}) => {
    return useQuery({
        queryKey: ['sensorReadings', filters],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                let readings = mockSensors
                    .filter(s => s.sensor_data)
                    .map(s => ({
                        id: Math.floor(Math.random() * 10000),
                        sensor_id: Number(s.id.replace(/\D/g, '') || '0'),
                        device_name: s.name,
                        mac_address: s.mac_address,
                        timestamp: s.last_heartbeat || new Date().toISOString(),
                        ...s.sensor_data?.sensors
                    }));

                if (filters?.sensor_id) {
                    readings = readings.filter(r => r.sensor_id === filters.sensor_id);
                }
                if (filters?.device_name) {
                    readings = readings.filter(r => r.device_name?.toLowerCase().includes(filters.device_name!.toLowerCase()));
                }

                return readings as SensorReading[];
            }
            const params = new URLSearchParams();
            if (filters?.sensor_id) params.append('sensor_id', filters.sensor_id.toString());
            if (filters?.device_name) params.append('device_name', filters.device_name);
            if (filters?.event_id) params.append('event_id', filters.event_id.toString());

            const { data } = await axiosInstance.get(`/api/devices/readings/?${params.toString()}`);
            return data as SensorReading[];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Get sensor reading by ID
 * GET /api/devices/readings/{id}/
 */
export const useSensorReading = (readingId: number) => {
    return useQuery({
        queryKey: ['sensorReadings', readingId],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Generate a random reading for the given ID
                return {
                    id: readingId,
                    sensor_id: 1,
                    device_name: 'Mock Sensor',
                    mac_address: '00:00:00:00:00:00',
                    timestamp: new Date().toISOString(),
                    temp_c: 22.5,
                    humidity: 45.2
                } as SensorReading;
            }
            const { data } = await axiosInstance.get(`/api/devices/readings/${readingId}/`);
            return data as SensorReading;
        },
        enabled: !!readingId
    });
};

/**
 * Create sensor reading
 * POST /api/devices/readings/
 */
export const useCreateSensorReading = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (reading: Omit<SensorReading, 'id'>) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { id: Math.floor(Math.random() * 10000), ...reading } as SensorReading;
            }
            const { data } = await axiosInstance.post('/api/devices/readings/', reading);
            return data as SensorReading;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sensorReadings'] });
            showSuccessNotification('Reading created successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to create reading'
            );
        }
    });
};

/**
 * Update sensor reading
 * PUT/PATCH /api/devices/readings/{id}/
 */
export const useUpdateSensorReading = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ readingId, data }: { readingId: number; data: Partial<SensorReading> }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { id: readingId, ...data } as SensorReading;
            }
            const { data: response } = await axiosInstance.patch(`/api/devices/readings/${readingId}/`, data);
            return response as SensorReading;
        },
        onSuccess: (_, { readingId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorReadings'] });
            queryClient.invalidateQueries({ queryKey: ['sensorReadings', readingId] });
            showSuccessNotification('Reading updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to update reading'
            );
        }
    });
};

/**
 * Delete sensor reading
 * DELETE /api/devices/readings/{id}/
 */
export const useDeleteSensorReading = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (readingId: number) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { success: true };
            }
            await axiosInstance.delete(`/api/devices/readings/${readingId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sensorReadings'] });
            showSuccessNotification('Reading deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to delete reading'
            );
        }
    });
};
