import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';
import useToasterNotification from '../hooks/useToasterNotification';
import { mockSensors } from '../mockData/sensors';

const USE_MOCK_DATA = true;

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                let logs = mockSensors.map(s => ({
                    id: Math.floor(Math.random() * 10000),
                    sensor_id: Number(s.id.replace(/\D/g, '') || '0'),
                    device_name: s.name,
                    mac_address: s.mac_address,
                    is_online: s.is_online ?? true,
                    device_timestamp: s.last_heartbeat || new Date().toISOString(),
                    created_at: new Date().toISOString()
                }));

                if (filters?.sensor_id) {
                    logs = logs.filter(l => l.sensor_id === filters.sensor_id);
                }
                if (filters?.device_name) {
                    logs = logs.filter(l => l.device_name?.toLowerCase().includes(filters.device_name!.toLowerCase()));
                }
                if (filters?.mac_address) {
                    logs = logs.filter(l => l.mac_address === filters.mac_address);
                }

                return logs as HeartbeatLog[];
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return {
                    id: heartbeatId,
                    sensor_id: 1,
                    device_name: 'Mock Sensor',
                    mac_address: '00:00:00:00:00:00',
                    is_online: true,
                    device_timestamp: new Date().toISOString(),
                    created_at: new Date().toISOString()
                } as HeartbeatLog;
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { id: Math.floor(Math.random() * 10000), created_at: new Date().toISOString(), ...heartbeat } as HeartbeatLog;
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { id: heartbeatId, ...data } as HeartbeatLog;
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { success: true };
            }
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
