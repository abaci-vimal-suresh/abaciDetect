import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';
import useToasterNotification from '../hooks/useToasterNotification';


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


export const useSensorReading = (readingId: number) => {
    return useQuery({
        queryKey: ['sensorReadings', readingId],
        queryFn: async () => {

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
