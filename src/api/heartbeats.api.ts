import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';
import useToasterNotification from '../hooks/useToasterNotification';

import { USE_MOCK_DATA } from '../config';

// Define HeartbeatLog interface
export interface HeartbeatLog {
    id: number;
    sensor_id: number;
    device_name: string;
    mac_address: string;
    is_online: boolean;
    device_timestamp: string;
    created_at: string;
}

/**
 * List all heartbeat logs with optional filters
 * GET /api/devices/heartbeats/
 */
export const useHeartbeats = (filters?: {
    sensor_id?: number;
    device_name?: string;
    mac_address?: string
}) => {
    return useQuery({
        queryKey: ['heartbeats', filters],
        queryFn: async () => {

            const params = new URLSearchParams();
            if (filters?.sensor_id) params.append('sensor_id', filters.sensor_id.toString());
            if (filters?.device_name) params.append('device_name', filters.device_name);
            if (filters?.mac_address) params.append('mac_address', filters.mac_address);

            const { data } = await axiosInstance.get(`/api/devices/heartbeats/?${params.toString()}`);
            return data as HeartbeatLog[];
        },
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

/**
 * Get heartbeat log by ID
 * GET /api/devices/heartbeats/{id}/
 */
export const useHeartbeat = (heartbeatId: number) => {
    return useQuery({
        queryKey: ['heartbeats', heartbeatId],
        queryFn: async () => {

            const { data } = await axiosInstance.get(`/api/devices/heartbeats/${heartbeatId}/`);
            return data as HeartbeatLog;
        },
        enabled: !!heartbeatId
    });
};

/**
 * Create heartbeat log
 * POST /api/devices/heartbeats/
 */
export const useCreateHeartbeat = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (heartbeat: Omit<HeartbeatLog, 'id' | 'created_at'>) => {

            const { data } = await axiosInstance.post('/api/devices/heartbeats/', heartbeat);
            return data as HeartbeatLog;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['heartbeats'] });
            showSuccessNotification('Heartbeat created successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to create heartbeat'
            );
        }
    });
};

/**
 * Update heartbeat log
 * PUT/PATCH /api/devices/heartbeats/{id}/
 */
export const useUpdateHeartbeat = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ heartbeatId, data }: { heartbeatId: number; data: Partial<HeartbeatLog> }) => {

            const { data: response } = await axiosInstance.patch(`/api/devices/heartbeats/${heartbeatId}/`, data);
            return response as HeartbeatLog;
        },
        onSuccess: (_, { heartbeatId }) => {
            queryClient.invalidateQueries({ queryKey: ['heartbeats'] });
            queryClient.invalidateQueries({ queryKey: ['heartbeats', heartbeatId] });
            showSuccessNotification('Heartbeat updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to update heartbeat'
            );
        }
    });
};

/**
 * Delete heartbeat log
 * DELETE /api/devices/heartbeats/{id}/
 */
export const useDeleteHeartbeat = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (heartbeatId: number) => {

            await axiosInstance.delete(`/api/devices/heartbeats/${heartbeatId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['heartbeats'] });
            showSuccessNotification('Heartbeat deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to delete heartbeat'
            );
        }
    });
};
