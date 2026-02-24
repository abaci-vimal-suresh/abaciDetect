import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';
import { PaginatedResponse } from '../types/sensor';

export type NotificationType = 'TASK' | 'ALERT' | 'INFO' | 'WARNING' | 'ERROR';
export type NotificationSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export interface AdminNotification {
    id: number;
    title: string;
    body: string;
    type: NotificationType;
    severity: NotificationSeverity;
    is_acknowledged_by_user: boolean;
    created_time: string;
    updated_time: string;
    acknowledged_at?: string;
    data?: any;
}

export interface NotificationFilters {
    search?: string;
    type?: NotificationType;
    severity?: NotificationSeverity;
    acknowledged?: boolean;
    limit?: number;
    offset?: number;
}

const queryKeys = {
    notifications: {
        all: ['adminNotifications'] as const,
        lists: () => [...queryKeys.notifications.all, 'list'] as const,
        list: (filters: NotificationFilters) => [...queryKeys.notifications.lists(), filters] as const,
        details: () => [...queryKeys.notifications.all, 'detail'] as const,
        detail: (id: number) => [...queryKeys.notifications.details(), id] as const,
    }
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useAdminNotifications = (filters: NotificationFilters = {}) => {
    return useQuery({
        queryKey: queryKeys.notifications.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.type) params.append('type', filters.type);
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.acknowledged !== undefined) params.append('acknowledged', String(filters.acknowledged));
            if (filters.limit !== undefined) params.append('limit', String(filters.limit));
            if (filters.offset !== undefined) params.append('offset', String(filters.offset));

            const queryString = params.toString();
            const url = `/administration/notifications/${queryString ? `?${queryString}` : ''}`;
            const { data } = await axiosInstance.get(url);
            return (Array.isArray(data) ? { results: data, count: data.length, next: null, previous: null } : data) as PaginatedResponse<AdminNotification>;
        },
        staleTime: 30000, // 30 seconds
    });
};

export const useAcknowledgeNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axiosInstance.patch(`/administration/notifications/${id}/acknowledge/`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await axiosInstance.patch(`/administration/notifications/mark-all-as-read/`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
};
