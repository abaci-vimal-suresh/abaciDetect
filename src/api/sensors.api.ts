import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import axios from 'axios';
import { authAxios as axiosInstance } from '../axiosInstance';
import { queryKeys } from '../lib/queryClient';
import {
    Sensor, Area, SubArea, SensorRegistrationData, SensorConfig, User, UserActivity, UserRole, UserGroup,
    UserGroupCreateData, UserGroupUpdateData, SensorGroup, SensorGroupCreateData, SensorGroupUpdateData,
    UserCreateData, UserUpdateData, Alert, AlertCreateData, AlertUpdateData, AlertFilters, AlertTrendResponse,
    AlertTrendFilters, AlertStatus, AlertType, AlertConfiguration, AlertConfigurationUpdateData,
    SensorUpdatePayload, BackendSensor, BackendSensorReading, AlertFilter, Action, SensorLogResponse, N8NAlertPayload
} from '../types/sensor';
import useToasterNotification from '../hooks/useToasterNotification';


export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/users/list/');
            return data as User[];
        }
    });
};

export const useUser = (userId: string) => {
    return useQuery({
        queryKey: ['users', userId],
        queryFn: async () => {
            const { data } = await axiosInstance.get(`/users/detail/${userId}/`);
            return data as User;
        },
        enabled: !!userId
    });
};

export const useAddUser = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (userData: UserCreateData) => {
            const payload = {
                ...userData,
                role: userData.role?.toLowerCase()
            };
            const { data } = await axiosInstance.post('/users/create/', payload);
            return data as User;
        },
        onSuccess: (newUser) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccessNotification(`User "${newUser.username}" created successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to create user');
        }
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ userId, userData }: { userId: number; userData: UserUpdateData }) => {
            const payload = {
                ...userData,
                role: userData.role?.toLowerCase()
            };
            const { data } = await axiosInstance.patch(`/users/detail/${userId}/`, payload);
            return data as User;
        },
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['users', updatedUser.id.toString()] });
            showSuccessNotification(`User "${updatedUser.username}" updated successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to update user');
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (userId: number) => {
            await axiosInstance.delete(`/users/detail/${userId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccessNotification('User deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to delete user');
        }
    });
};

export const useUserActivity = (userId: string) => {
    return useQuery({
        queryKey: ['users', userId, 'activity'],
        queryFn: async () => {
            const { data } = await axiosInstance.get(`/users/${userId}/activity`);
            return data as UserActivity[];
        },
        enabled: !!userId
    });
};


export const useAreas = () => {
    return useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/administration/areas/?include_subareas=true');
            return data as Area[];
        },
    });
};


export const useCreateArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: FormData | { name: string; area_type?: string; parent_id?: number | null; person_in_charge_ids?: number[] }) => {
            const headers = data instanceof FormData
                ? { 'Content-Type': 'multipart/form-data' }
                : {};
            const response = await axiosInstance.post('/administration/areas/', data, { headers });
            return response.data as Area;
        },
        onSuccess: (newArea) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showSuccessNotification(`Area "${newArea.name}" created successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to create area'
            );
        },
    });
}


export const useAddSensorToSubArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ sensorId, subAreaId }: { sensorId: string; subAreaId: string }) => {
            const { data } = await axiosInstance.patch(`/devices/sensors/${sensorId}/`, {
                area: Number(subAreaId)
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.lists() });
            showSuccessNotification('Sensor added to sub area successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to add sensor to sub area'
            );
        },
    });
};

export const useCreateSubArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: FormData | { name: string; areaId: string; area_type?: string; person_in_charge_ids?: number[] }) => {
            if (data instanceof FormData) {
                const headers = { 'Content-Type': 'multipart/form-data' };
                const response = await axiosInstance.post('/administration/areas/', data, { headers });
                return response.data as Area;
            } else {
                const response = await axiosInstance.post(`/administration/areas/`, {
                    name: data.name,
                    area_type: data.area_type || 'others',
                    parent_id: Number(data.areaId),
                    person_in_charge_ids: data.person_in_charge_ids
                });
                return response.data as Area;
            }
        },
        onSuccess: (newSubArea, variables) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showSuccessNotification(`Sub area "${newSubArea.name}" created successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to create sub area'
            );
        },
    });
};

export const useUpdateArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ areaId, data }: { areaId: number; data: any }) => {
            const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
            const response = await axiosInstance.patch(`/administration/areas/${areaId}/`, data, { headers });
            return response.data as Area;
        },
        onSuccess: (updatedArea) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showSuccessNotification(`Area "${updatedArea.name}" updated successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || error?.response?.data?.detail || 'Failed to update area');
        }
    });
};

export const useDeleteArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (areaId: number) => {
            await axiosInstance.delete(`/administration/areas/${areaId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showSuccessNotification('Area deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || error?.response?.data?.detail || 'Failed to delete area');
        }
    });
};

export const useSubAreaSensors = (subAreaId: string) => {
    return useQuery({
        queryKey: ['subareas', subAreaId, 'sensors'],
        queryFn: async () => {
            const { data: backendResponse } = await axiosInstance.get<Sensor[] | { results: Sensor[] }>(
                `/devices/sensors/?area=${subAreaId}`
            );

            const backendSensors = Array.isArray(backendResponse)
                ? backendResponse
                : (backendResponse as any).results || [];

            return backendSensors as Sensor[];
        },
        enabled: !!subAreaId,
    });
};

export const useSensors = (filters?: {
    areaId?: string;
    status?: 'all' | 'active' | 'inactive';
    sensor_type?: string;
    is_online?: boolean;
    search?: string;
}) => {
    return useQuery({
        queryKey: queryKeys.sensors.list(filters || {}),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.areaId) params.append('area', filters.areaId);
            if (filters?.status && filters.status !== 'all') {
                params.append('is_active', (filters.status === 'active').toString());
            }
            if (filters?.sensor_type) params.append('sensor_type', filters.sensor_type);
            if (filters?.is_online !== undefined) params.append('is_online', filters.is_online.toString());
            if (filters?.search) params.append('search', filters.search);

            const { data: backendResponse } = await axiosInstance.get<Sensor[] | { results: Sensor[], count: number }>(
                `/devices/sensors/?${params.toString()}`
            );

            const backendSensors = Array.isArray(backendResponse)
                ? backendResponse
                : (backendResponse as any).results || [];
            return backendSensors as Sensor[];
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
};



export const useSensor = (sensorId: string | number) => {
    const isSensor4 = sensorId.toString() === '4';

    return useQuery({
        queryKey: queryKeys.sensors.detail(sensorId.toString()),
        queryFn: async () => {
            const { data: backendSensor } = await axiosInstance.get<Sensor>(`/devices/sensors/${sensorId}/`);

            return backendSensor;
        },
        enabled: !!sensorId,
        staleTime: isSensor4 ? 30 * 60 * 1000 : 5 * 60 * 1000, // 30 min vs 5 min
        placeholderData: (previousData) => previousData,
    });
};


export const useSensorReadings = (sensorId: string | number, options?: { refetchInterval?: number }) => {
    return useQuery({
        queryKey: ['sensorReadings', sensorId.toString()],
        queryFn: async () => {
            const { data: backendSensor } = await axiosInstance.get<Sensor>(
                `/devices/sensors/${sensorId}/`
            );

            if (!backendSensor.mac_address) {
                console.warn(`Sensor ${sensorId} has no MAC address, cannot fetch readings`);
                return null;
            }

            const { data: readings } = await axiosInstance.get<any[]>(
                '/devices/readings/',
                {
                    params: {
                        mac_address: backendSensor.mac_address,
                        limit: 1
                    }
                }
            );

            if (!readings || readings.length === 0) {
                console.warn(`No readings found for sensor ${sensorId}`);
                return null;
            }

            const latestReading = readings[0];

            console.log('📡 Fetched sensor reading:', {
                sensorId,
                mac: backendSensor.mac_address,
                timestamp: latestReading.timestamp,
                temp: latestReading.sensors.temp_c
            });

            return latestReading;
        },
        enabled: !!sensorId,
        refetchInterval: options?.refetchInterval || 10000,
        staleTime: 5000,
    });
};

export const useSensorWithReadings = (sensorId: string | number, options?: { refetchInterval?: number }) => {
    const sensorQuery = useSensor(sensorId);
    const readingsQuery = useSensorReadings(sensorId, options);
    const combinedData = React.useMemo(() => {
        if (!sensorQuery.data) return undefined;

        if (readingsQuery.data) {
            return { ...sensorQuery.data, sensor_data: readingsQuery.data };
        }
        return sensorQuery.data;
    }, [sensorQuery.data, readingsQuery.data]);

    return {
        data: combinedData,
        isLoading: sensorQuery.isLoading || readingsQuery.isLoading,
        isError: sensorQuery.isError || readingsQuery.isError,
        error: sensorQuery.error || readingsQuery.error,
        refetch: () => {
            sensorQuery.refetch();
            readingsQuery.refetch();
        },
    };
};

export const useLatestSensorLog = (sensorId: string | number, options?: { refetchInterval?: number }) => {
    return useQuery({
        queryKey: ['latestSensorLog', sensorId.toString()],
        queryFn: async () => {
            const { data } = await axiosInstance.get<SensorLogResponse>(
                '/data-management/sensor-logs/latest/',
                {
                    params: { sensor_id: sensorId }
                }
            );

            return data.results && data.results.length > 0 ? data.results[0] : null;
        },
        enabled: !!sensorId,
        refetchInterval: options?.refetchInterval || 15000,
        staleTime: 15000,
    });
};


export interface AggregatedSensorDataResponse {
    area_ids: number[];
    area_ids_included: number[];
    sensor_group_ids: number[] | null;
    sensor_count: number;
    time_window: {
        from: string;
        to: string;
    };
    aggregated_data: {
        temperature_min: number | null;
        temperature_max: number | null;
        humidity_min: number | null;
        humidity_max: number | null;
        light_min: number | null;
        light_max: number | null;
        sound_min: number | null;
        sound_max: number | null;
        pressure_min: number | null;
        pressure_max: number | null;
        tvoc_min: number | null;
        tvoc_max: number | null;
        co2_min: number | null;
        co2_max: number | null;
        pm1_min: number | null;
        pm10_min: number | null;
        pm25_min: number | null;
        aqi_min: number | null;
        aqi_max: number | null;
        movement_min: number | null;
        movement_max: number | null;
        noise_min: number | null;
        noise_max: number | null;
        health_min: number | null;
        health_max: number | null;
        [key: string]: any;
    };
}

export const useAggregatedSensorData = (filters: {
    area_id?: number | string | (number | string)[];
    sensor_group_id?: number | string | (number | string)[];
}) => {
    return useQuery({
        queryKey: ['aggregatedSensorData', filters],
        queryFn: async () => {
            const { data } = await axiosInstance.get<AggregatedSensorDataResponse>('/data-management/sensor-logs/aggregated_data/', {
                params: {
                    area_id: Array.isArray(filters.area_id) ? filters.area_id.join(',') : filters.area_id,
                    sensor_group_id: Array.isArray(filters.sensor_group_id) ? filters.sensor_group_id.join(',') : filters.sensor_group_id
                }
            });
            return data;
        },
        enabled: !!filters.area_id || !!filters.sensor_group_id
    });
};


export const useRegisterSensor = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (registrationData: SensorRegistrationData) => {
            const payload = {
                ...registrationData,
                z_val: registrationData.z_val ?? 0.9,
                z_max: registrationData.z_max ?? 1.0,
            };

            const { data } = await axiosInstance.post('/devices/sensors/', payload);
            return data as Sensor;
        },
        onSuccess: (newSensor) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.lists() });
            showSuccessNotification(`Sensor "${newSensor.name}" registered successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to register sensor'
            );
        },
    });
};


export const useTriggerSensor = () => {
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();
    return useMutation({
        mutationFn: async (data: { sensorId: number | string; event: string; ip: string }) => {
            const response = await axiosInstance.post(`/devices/trigger/sensor/`, {
                event: data.event,
                ip_address: data.ip
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            showSuccessNotification(`Sensor triggered successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to trigger sensor'
            );
        },
    });
};


export interface RemoteSensorConfigItem {
    sensor_key: string;
    sensor_name: string;
}

export interface RemoteSensorConfigResponse {
    success: boolean;
    sensor_type: string;
    data: {
        sensor_type: string;
        model_name: string;
        sensors: RemoteSensorConfigItem[];
        event_sources?: Record<string, string>;
    };
    event_sources?: Record<string, string>;
    sensor_count?: number;
    timestamp?: string;
}

export const useRemoteSensorConfig = (sensorType?: string) => {
    return useQuery({
        queryKey: ['remoteSensorConfig', sensorType],
        queryFn: async () => {
            if (!sensorType) return null;
            const { data } = await axiosInstance.get(`/devices/sensor-config/`, {
                params: { sensor_type: sensorType }
            });
            return data as RemoteSensorConfigResponse;
        },
        enabled: !!sensorType,
        staleTime: 5 * 60 * 1000,
    });
};


export const useSensorConfigurations = (sensorId: string | number) => {
    return useQuery({
        queryKey: ['sensorConfigurations', sensorId.toString()],
        queryFn: async () => {
            if (!sensorId) return [];

            const { data } = await axiosInstance.get(`/devices/sensor-configurations/`, {
                params: { halo_sensor__sensor__id: sensorId }
            });
            return data as SensorConfig[];
        },
        enabled: !!sensorId,
    });
};

export const useAddSensorConfiguration = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ sensorId, config }: { sensorId: string | number; config: SensorConfig }) => {
            const { data } = await axiosInstance.post(`/devices/sensor-configurations/`, {
                ...config,
                device: sensorId
            });
            return data as SensorConfig;
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorConfigurations', sensorId.toString()] });
            showSuccessNotification('Configuration added successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to add configuration'
            );
        },
    });
};

export const useUpdateSensorConfiguration = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ sensorId, configId, config }: { sensorId: string | number; configId: number; config: Partial<SensorConfig> }) => {
            const { data } = await axiosInstance.patch(`/devices/sensor-configurations/${configId}/`, config);
            return data as SensorConfig;
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorConfigurations', sensorId.toString()] });
            showSuccessNotification('Configuration updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to update configuration'
            );
        },
    });
};

export const useDeleteSensorConfiguration = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ sensorId, configId }: { sensorId: string | number; configId: number }) => {
            await axiosInstance.delete(`/devices/sensor-configurations/${configId}/`);
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorConfigurations', sensorId.toString()] });
            showSuccessNotification('Configuration deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to delete configuration'
            );
        },
    });
};




export const useUpdateSensorPersonnel = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({
            sensorId,
            personnelData
        }: {
            sensorId: string | number;
            personnelData: {
                personnel_in_charge?: string;
                personnel_contact?: string;
                personnel_email?: string;
            }
        }) => {
            const { data } = await axiosInstance.patch(`/devices/sensors/${sensorId}/`, personnelData);
            return data as Sensor;
        },
        onSuccess: (updatedSensor, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.detail(sensorId.toString()) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.lists() });
            showSuccessNotification('Personnel information updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to update personnel information'
            );
        },
    });
};

export const useUpdatePersonnelInCharge = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({
            sensorId,
            personnelName
        }: {
            sensorId: string | number;
            personnelName: string;
        }) => {
            const { data } = await axiosInstance.patch(`/devices/sensors/${sensorId}/`, {
                personnel_in_charge: personnelName
            });
            return data as Sensor;
        },
        onSuccess: (updatedSensor, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.detail(String(sensorId)) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.lists() });
            showSuccessNotification('Personnel in charge updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to update personnel in charge'
            );
        },
    });
}


export const useUpdateSensor = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ sensorId, data }: { sensorId: string | number; data: Partial<SensorUpdatePayload> }) => {
            const backendPayload = data;

            const { data: response } = await axiosInstance.patch(`/devices/sensors/${sensorId}/`, backendPayload);
            return response as Sensor;
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.detail(String(sensorId)) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.lists() });
            showSuccessNotification('Sensor updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to update sensor'
            );
        }
    });
};

export const useDeleteSensor = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (sensorId: string | number) => {
            await axiosInstance.delete(`/devices/sensors/${sensorId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.lists() });
            showSuccessNotification('Sensor deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to delete sensor'
            );
        }
    });
};


export const useSensorGroups = (filters?: { search?: string }) => {
    return useQuery({
        queryKey: ['sensorGroups', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);

            const { data } = await axiosInstance.get(`/devices/sensor-groups/?${params.toString()}`);
            return data as SensorGroup[];
        }
    });
};

export const useCreateSensorGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: SensorGroupCreateData) => {
            const { data: response } = await axiosInstance.post('/devices/sensor-groups/', data);
            return response as SensorGroup;
        },
        onSuccess: (newGroup) => {
            queryClient.invalidateQueries({ queryKey: ['sensorGroups'] });
            showSuccessNotification(`Group "${newGroup.name}" created successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to create sensor group');
        }
    });
};

// Get sensor group by ID
export const useSensorGroup = (groupId: string | number) => {
    return useQuery({
        queryKey: ['sensorGroups', groupId],
        queryFn: async () => {
            const { data } = await axiosInstance.get(`/devices/sensor-groups/${groupId}/`);
            return data as SensorGroup;
        },
        enabled: !!groupId
    });
};

// Update sensor group
export const useUpdateSensorGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, data }: {
            groupId: string | number;
            data: SensorGroupUpdateData
        }) => {
            const { data: response } = await axiosInstance.patch(`/devices/sensor-groups/${groupId}/`, data);
            return response as SensorGroup;
        },
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorGroups'] });
            queryClient.invalidateQueries({ queryKey: ['sensorGroups', groupId] });
            showSuccessNotification('Sensor group updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to update sensor group'
            );
        }
    });
};

// Add members to sensor group
export const useAddSensorGroupMembers = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, sensor_ids }: { groupId: string | number; sensor_ids: any[] }) => {
            // Consolidate to standard PATCH endpoint as per documentation
            const { data } = await axiosInstance.patch(`/devices/sensor-groups/${groupId}/`, {
                sensor_ids: sensor_ids.map(id => Number(id))
            });
            return data as SensorGroup;
        },
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorGroups', groupId] });
            queryClient.invalidateQueries({ queryKey: ['sensorGroups'] });
            showSuccessNotification('Sensors added to group successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to add sensors'
            );
        }
    });
};

// Remove members from sensor group
export const useRemoveSensorGroupMembers = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, sensor_ids }: { groupId: string | number; sensor_ids: any[] }) => {
            const { data } = await axiosInstance.patch(`/devices/sensor-groups/${groupId}/`, {
                sensor_ids: sensor_ids.map(id => Number(id))
            });
            return data as SensorGroup;
        },
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorGroups', groupId] });
            queryClient.invalidateQueries({ queryKey: ['sensorGroups'] });
            showSuccessNotification('Sensors removed from group successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to remove sensors'
            );
        }
    });
};

// Delete sensor group
export const useDeleteSensorGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (groupId: string | number) => {
            await axiosInstance.delete(`/devices/sensor-groups/${groupId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sensorGroups'] });
            showSuccessNotification('Sensor group deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to delete sensor group'
            );
        }
    });
};


export const useSendHaloData = () => {
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: {
            device_name: string;
            mac_address: string;
            ip_address: string;
            timestamp: string;
            sensor_data: any;
        }) => {
            const { data: response } = await axiosInstance.post('/devices/halo/data/', data);
            return response;
        },
        onSuccess: () => {
            showSuccessNotification('Halo data sent successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to send Halo data'
            );
        }
    });
};

export const useSendHaloHeartbeat = () => {
    return useMutation({
        mutationFn: async (data: {
            device_name: string;
            mac_address: string;
            ip_address: string;
            device_timestamp: string;
            is_online: boolean;
        }) => {
            const { data: response } = await axiosInstance.post('/devices/halo/heartbeat/', data);
            return response;
        }
    });
};


export const useLatestReadings = () => {
    return useQuery({
        queryKey: ['latestReadings'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/devices/readings/latest/');
            return data;
        },
        refetchInterval: 5000,
        staleTime: 3000
    });
};




export const useAllSensorsLatestData = () => {
    return useQuery({
        queryKey: ['allSensorsLatestData'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/devices/latest-data/');
            return data;
        },
        refetchInterval: 5000,
        staleTime: 3000
    });
};


export const useActiveEvents = () => {
    return useQuery({
        queryKey: ['activeEvents'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/devices/events/active/');
            return data;
        },
        refetchInterval: 3000, // Refresh every 3 seconds
        staleTime: 2000
    });
};


export const useHeartbeatStatus = () => {
    return useQuery({
        queryKey: ['heartbeatStatus'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/devices/heartbeat/status/');
            return data as {
                total_sensors: number;
                online_sensors: number;
                offline_sensors: number;
                last_update: string;
            };
        },
        refetchInterval: 10000, // Refresh every 10 seconds
        staleTime: 8000
    });
};


export const useDeviceReadings = (deviceId: string) => {
    return useQuery({
        queryKey: ['deviceReadings', deviceId],
        queryFn: async () => {
            // Updated to use standardized readings endpoint with filter
            const { data } = await axiosInstance.get(`/devices/readings/?device_name=${deviceId}`);
            return data;
        },
        enabled: !!deviceId
    });
};


export const useDevices = () => {
    return useQuery({
        queryKey: ['devices'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/devices/devices/');
            return data;
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
    });
};


export const useDeviceHealth = () => {
    return useQuery({
        queryKey: ['deviceHealth'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/devices/health/');
            return data as {
                status: string;
                timestamp: string;
            };
        },
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 25000
    });
};




export const useUserGroups = (filters?: { search?: string; ordering?: string }) => {
    return useQuery({
        queryKey: ['userGroups', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.ordering) params.append('ordering', filters.ordering);

            const { data } = await axiosInstance.get(`/users/groups/?${params.toString()}`);
            return data as UserGroup[];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};


export const useUserGroup = (groupId: number | null) => {
    return useQuery({
        queryKey: ['userGroups', groupId],
        queryFn: async () => {
            if (!groupId) throw new Error('Group ID is required');
            const { data } = await axiosInstance.get(`/users/groups/${groupId}/`);
            return data as UserGroup;
        },
        enabled: !!groupId,
    });
};


export const useCreateUserGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: UserGroupCreateData) => {
            const { data: response } = await axiosInstance.post('/users/groups/', data);
            return response as UserGroup;
        },
        onSuccess: (newGroup) => {
            queryClient.invalidateQueries({ queryKey: ['userGroups'] });
            showSuccessNotification(`Group "${newGroup.name}" created successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to create group');
        },
    });
};


export const useUpdateUserGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, data }: { groupId: number; data: UserGroupUpdateData }) => {
            const { data: response } = await axiosInstance.patch(`/users/groups/${groupId}/`, data);
            return response as UserGroup;
        },
        onSuccess: (updatedGroup) => {
            queryClient.invalidateQueries({ queryKey: ['userGroups'] });
            queryClient.invalidateQueries({ queryKey: ['userGroups', updatedGroup.id] });
            showSuccessNotification(`Group "${updatedGroup.name}" updated successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to update group');
        },
    });
};


export const useAddGroupMembers = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, member_ids }: { groupId: number; member_ids: number[] }) => {
            const { data } = await axiosInstance.post(`/users/groups/${groupId}/add_members/`, { member_ids });
            return data as UserGroup;
        },
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['userGroups'] });
            queryClient.invalidateQueries({ queryKey: ['userGroups', groupId] });
            showSuccessNotification('Members added successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to add members');
        },
    });
};


export const useRemoveGroupMembers = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, member_ids }: { groupId: number; member_ids: number[] }) => {
            const { data } = await axiosInstance.post(`/users/groups/${groupId}/remove_members/`, { member_ids });
            return data as UserGroup;
        },
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['userGroups'] });
            queryClient.invalidateQueries({ queryKey: ['userGroups', groupId] });
            showSuccessNotification('Members removed successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to remove members');
        },
    });
};

/**
 * Delete user group
 * DELETE /api/users/groups/{id}/
 */
export const useDeleteUserGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (groupId: number) => {
            await axiosInstance.delete(`/users/groups/${groupId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userGroups'] });
            showSuccessNotification('Group deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to delete group');
        },
    });
};





// Get all alerts with optional filters
export const useAlerts = (filters?: AlertFilters) => {
    return useQuery({
        queryKey: ['alerts', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.type) params.append('type', filters.type);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.sensor) params.append('sensor', filters.sensor.toString());
            if (filters?.area) params.append('area', filters.area.toString());
            if (filters?.search) params.append('search', filters.search);

            const { data } = await axiosInstance.get(`/alert-management/alerts/?${params.toString()}`);
            return data as Alert[];
        },
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

// Get single alert by ID
export const useAlert = (alertId: number) => {
    return useQuery({
        queryKey: ['alerts', alertId],
        queryFn: async () => {
            const { data } = await axiosInstance.get(`/alert-management/alerts/${alertId}/`);
            return data as Alert;
        },
        enabled: !!alertId,
    });
};

// Create new alert
export const useCreateAlert = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (alertData: AlertCreateData) => {
            const { data } = await axiosInstance.post('/alert-management/alerts/', alertData);
            return data as Alert;
        },
        onSuccess: (newAlert) => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            showSuccessNotification(`Alert "${newAlert.type}" created successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to create alert');
        },
    });
};

// Update alert
export const useUpdateAlert = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ alertId, data }: { alertId: number; data: AlertUpdateData }) => {
            const { data: response } = await axiosInstance.patch(`/alert-management/alerts/${alertId}/`, data);
            return response as Alert;
        },
        onSuccess: (updatedAlert) => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['alerts', updatedAlert.id] });
            showSuccessNotification('Alert updated successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to update alert');
        },
    });
};

// Delete alert
export const useDeleteAlert = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (alertId: number) => {
            await axiosInstance.delete(`/alert-management/alerts/${alertId}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            showSuccessNotification('Alert deleted successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to delete alert');
        },
    });
};


// Get alert trends
export const useAlertTrends = (filters: AlertTrendFilters) => {
    return useQuery({
        queryKey: ['alerts', 'trends', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('period', filters.period);
            if (filters.type) params.append('type', filters.type);
            if (filters.status) params.append('status', filters.status);

            const { data } = await axiosInstance.get(`/alert-management/alerts/trends/?${params.toString()}`);
            return data as AlertTrendResponse;
        },
        staleTime: 2 * 60 * 1000,
        enabled: !!filters.period,
    });
};






export const useAlertConfigurations = () => {
    return useQuery({
        queryKey: ['alertConfigurations'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/alerts/configurations/');
            return data as AlertConfiguration[];
        }
    });
};





export const useSaveAlertConfiguration = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (config: Partial<AlertConfiguration> & { id?: number }) => {
            if (config.id) {
                const { data } = await axiosInstance.patch(`/alerts/configurations/${config.id}/`, config);
                return data;
            } else {
                const { data } = await axiosInstance.post('/alerts/configurations/', config);
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertConfigurations'] });
            showSuccessNotification('Alert configuration saved successfully');
        },
        onError: (err) => {
            showErrorNotification('Failed to save alert configuration');
        }
    });
};






export const useAlertFilters = (filters?: { search?: string; area_id?: number }) => {
    return useQuery({
        queryKey: ['alertFilters', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.area_id) params.append('area_id', filters.area_id.toString());

            const { data } = await axiosInstance.get(`/alert-management/alert-filters/?${params.toString()}`);
            return data as AlertFilter[];
        }
    });
};






export const useActions = (filters?: { search?: string; type?: string; is_active?: boolean }) => {
    return useQuery({
        queryKey: ['actions', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.type) params.append('type', filters.type);
            if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

            const { data } = await axiosInstance.get(`/alert-management/actions/?${params.toString()}`);
            return data as Action[];
        }
    });
};





export const useCreateAlertFilter = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (filterData: Partial<AlertFilter>) => {
            const { data } = await axiosInstance.post('/alert-management/alert-filters/', filterData);
            return data as AlertFilter;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertFilters'] });
            showSuccessNotification('Alert filter created successfully');
        },
        onError: () => {
            showErrorNotification('Failed to create alert filter');
        }
    });
};






export const useUpdateAlertFilter = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<AlertFilter> }) => {
            const { data: response } = await axiosInstance.patch(`/alert-management/alert-filters/${id}/`, data);
            return response as AlertFilter;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertFilters'] });
            showSuccessNotification('Alert filter updated successfully');
        },
        onError: () => {
            showErrorNotification('Failed to update alert filter');
        }
    });
};





export const useDeleteAlertFilter = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (id: number) => {
            await axiosInstance.delete(`/alert-management/alert-filters/${id}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertFilters'] });
            showSuccessNotification('Alert filter deleted successfully');
        },
        onError: () => {
            showErrorNotification('Failed to delete alert filter');
        }
    });
};





export const useCreateAction = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (actionData: Partial<Action>) => {
            const { data } = await axiosInstance.post('/alert-management/actions/', actionData);
            return data as Action;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actions'] });
            showSuccessNotification('Action created successfully');
        },
        onError: () => {
            showErrorNotification('Failed to create action');
        }
    });
};






export const useUpdateAction = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Action> }) => {
            const { data: response } = await axiosInstance.patch(`/alert-management/actions/${id}/`, data);
            return response as Action;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actions'] });
            showSuccessNotification('Action updated successfully');
        },
        onError: () => {
            showErrorNotification('Failed to update action');
        }
    });
};







export const useDeleteAction = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (id: number) => {
            await axiosInstance.delete(`/alert-management/actions/${id}/`);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actions'] });
            showSuccessNotification('Action deleted successfully');
        },
        onError: () => {
            showErrorNotification('Failed to delete action');
        }
    });
};






export const buildN8NAlertPayload = (
    alert: Alert,
    sensor: any,
    area: any,
    filter: AlertFilter,
    action: Action,
    sensorReadings?: any
): N8NAlertPayload => {
    const severity: 'critical' | 'warning' | 'info' =
        (alert.type.includes('smoke') || alert.type.includes('fire') || alert.type === 'sensor_offline')
            ? 'critical'
            : (alert.type.includes('high') || alert.type.includes('warning'))
                ? 'warning'
                : 'info';

    let triggerCondition: 'min_violation' | 'max_violation' | 'threshold_violation' = 'threshold_violation';
    if (filter.action_for_min) triggerCondition = 'min_violation';
    if (filter.action_for_max) triggerCondition = 'max_violation';

    return {
        payload_version: "1.0",
        timestamp: new Date().toISOString(),
        source: "HALO Alert System",
        alert: {
            id: alert.id,
            type: alert.type,
            severity,
            status: alert.status,
            description: alert.description,
            remarks: alert.remarks,
            created_at: alert.created_at,
            updated_at: alert.updated_at,
            value: alert.description
        },
        sensor: {
            id: typeof sensor === 'object' ? sensor.id : sensor,
            name: typeof sensor === 'object' ? sensor.name : `Sensor-${sensor}`,
            type: typeof sensor === 'object' ? sensor.sensor_type : undefined,
            mac_address: typeof sensor === 'object' ? sensor.mac_address : undefined,
            ip_address: typeof sensor === 'object' ? sensor.ip_address : undefined,
            location: typeof sensor === 'object' ? sensor.location : undefined,
            is_online: typeof sensor === 'object' ? sensor.is_online : undefined,
            last_heartbeat: typeof sensor === 'object' ? sensor.last_heartbeat : undefined
        },
        area: {
            id: typeof area === 'object' ? area.id : area,
            name: typeof area === 'object' ? area.name : `Area-${area}`,
            area_type: typeof area === 'object' ? area.area_type : undefined,
            parent_area: typeof area === 'object' && area.parent_id
                ? { id: area.parent_id, name: area.parent_name || `Area-${area.parent_id}` }
                : null
        },
        filter: {
            id: filter.id,
            name: filter.name,
            description: filter.description,
            threshold_min: undefined,
            threshold_max: undefined,
            trigger_condition: triggerCondition
        },
        action: {
            id: action.id,
            name: action.name,
            type: action.type,
            workflow_id: action.n8n_workflow_id
        },
        sensor_readings: sensorReadings || undefined
    };
};






export const triggerN8NWorkflow = async (
    action: Action,
    payload: N8NAlertPayload
): Promise<{ success: boolean; response?: any; error?: string }> => {
    if (!action.n8n_workflow_url) {
        return { success: false, error: 'No webhook URL configured' };
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (action.n8n_api_key) {
            const headerName = action.n8n_auth_header || 'X-API-Key';
            headers[headerName] = action.n8n_api_key;
        }

        const timeout = (action.n8n_timeout || 30) * 1000;

        console.log('🚀 Triggering N8N workflow:', {
            workflow_id: action.n8n_workflow_id,
            url: action.n8n_workflow_url,
            alert_id: payload.alert.id,
            sensor: payload.sensor.name
        });

        const { data } = await axios.post(
            action.n8n_workflow_url,
            payload,
            {
                headers,
                timeout
            }
        );

        console.log(' N8N workflow response:', data);

        return { success: true, response: data };
    } catch (error: any) {
        console.error(' N8N workflow failed:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Webhook request failed'
        };
    }
};





export const useSyncHaloConfigs = () => {
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sensorId: string | number) => {
            const { data } = await axiosInstance.post(`/devices/sensor-configurations/sync_all_from_sensor/`, {
                sensor_id: sensorId
            });
            return data;
        },
        onSuccess: (data, sensorId) => {
            queryClient.invalidateQueries({ queryKey: ['sensorConfigurations', sensorId.toString()] });
            showSuccessNotification('Halo configurations synchronized successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                'Failed to sync Halo configurations'
            );
        }
    });
};




export interface WaveFilesResponse {
    success: boolean;
    sensor_ip: string;
    wavefiles: string[];
    count: number;
}





export const useWaveFiles = (ip_address?: string, username?: string, password?: string) => {
    return useQuery({
        queryKey: ['wavefiles', ip_address, username, password],
        queryFn: async () => {
            const { data } = await axiosInstance.get('devices/wavefiles/list/', {
                params: {
                    ip_address,
                    username,
                    password
                }
            });
            return data as WaveFilesResponse;
        },
        enabled: !!ip_address && !!username && !!password
    });
};






export const useUploadWaveFile = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ ip_address, username, password, file }: { ip_address: string; username: string; password: string; file: File }) => {
            const url = `devices/wavefiles/add/${file.name}/?ip_address=${encodeURIComponent(ip_address)}&username=${encodeURIComponent(username || 'admin')}&password=${encodeURIComponent(password || 'Abcd@123')}`;

            const { data } = await axiosInstance.post(url, file, {
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wavefiles'] });
            showSuccessNotification('Sound file uploaded successfully!');
        },
        onError: (error: any) => {
            showErrorNotification(
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.response?.data?.error ||
                'Failed to upload sound file'
            );
        }
    });
};
