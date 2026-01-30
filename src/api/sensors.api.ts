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
    SensorUpdatePayload, BackendSensor, BackendSensorReading, AlertFilter, Action
} from '../types/sensor';
import useToasterNotification from '../hooks/useToasterNotification';
import {
    mockAreas, mockSubAreas, mockSensors, saveMockData, mockUsers, mockUserGroups,
    mockSensorGroups, mockPersonnelData, mockUserActivities, mockAlerts, mockAlertTrends, mockSensorConfigs, mockAlertConfigurations
} from '../mockData/sensors';

export const USE_MOCK_DATA = false;


export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return JSON.parse(JSON.stringify(mockUsers));
            }
            const { data } = await axiosInstance.get('/users/list/');
            return data as User[];
        }
    });
};

export const useUser = (userId: string) => {
    return useQuery({
        queryKey: ['users', userId],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const user = mockUsers.find(u => u.id === Number(userId));
                if (!user) throw new Error('User not found');
                return user;
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const newId = Math.max(...mockUsers.map(u => u.id), 0) + 1;
                const newUser: User = {
                    ...userData,
                    id: newId,
                    created_at: new Date().toISOString(),
                    is_active: userData.is_active ?? true,
                    assigned_area_ids: (userData as any).assigned_area_ids || [], // Keep legacy if needed
                    head_id: userData.head_id || null,
                    head: userData.head_id ? mockUsers.find(u => u.id === userData.head_id) || null : null,
                    role: userData.role as UserRole
                };
                mockUsers.push(newUser);
                return newUser;
            }

            // Spec: POST /api/users/create/
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const userIndex = mockUsers.findIndex(u => u.id === userId);
                if (userIndex > -1) {
                    const updatedUser = {
                        ...mockUsers[userIndex],
                        ...userData,
                        head_id: userData.head_id !== undefined ? userData.head_id : mockUsers[userIndex].head_id,
                        head: userData.head_id ? mockUsers.find(u => u.id === userData.head_id) || null : (userData.head_id === null ? null : mockUsers[userIndex].head),
                        role: userData.role ? (userData.role.toLowerCase() === 'admin' ? 'admin' : 'viewer') : mockUsers[userIndex].role
                    } as User;
                    mockUsers[userIndex] = updatedUser;
                    return mockUsers[userIndex];
                }
                throw new Error('User not found');
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const userIndex = mockUsers.findIndex(u => u.id === userId);
                if (userIndex > -1) {
                    mockUsers.splice(userIndex, 1);
                    return { success: true };
                }
                throw new Error('User not found');
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return mockUserActivities.filter(a => a.user_id === Number(userId));
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Return a deep copy to ensure reference change triggers re-renders
                return JSON.parse(JSON.stringify(mockAreas));
            }

            // Spec: GET /api/areas/?include_subareas=true
            const { data } = await axiosInstance.get('/administration/areas/?include_subareas=true');

            // Return raw data
            return data as Area[];
        },
    });
};


export const useCreateArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: FormData | { name: string; area_type?: string; parent_id?: number | null; person_in_charge_ids?: number[] }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Handle both FormData and plain object
                let formValues: any;
                if (data instanceof FormData) {
                    formValues = {};
                    data.forEach((value, key) => {
                        if (key === 'person_in_charge_ids') {
                            formValues[key] = formValues[key] || [];
                            formValues[key].push(Number(value));
                        } else if (key === 'area_plan') {
                            formValues[key] = value; // Keep File object
                        } else {
                            formValues[key] = value;
                        }
                    });
                } else {
                    formValues = data;
                }

                const newId = Math.max(...mockAreas.map(a => a.id)) + 1;
                const newArea: Area = {
                    id: newId,
                    name: formValues.name,
                    area_type: formValues.area_type || 'building',
                    parent_id: formValues.parent_id ? Number(formValues.parent_id) : null,
                    sensor_count: 0,
                    subareas: [],
                    person_in_charge_ids: formValues.person_in_charge_ids || [],
                    // Handle file upload in mock mode
                    floor_plan_url: formValues.area_plan instanceof File
                        ? URL.createObjectURL(formValues.area_plan)
                        : null,
                };
                mockAreas.push(newArea);
                saveMockData();
                return newArea;
            }

            // Real backend: Send FormData or JSON
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id == sensorId);
                if (sensor) {
                    sensor.area_id = Number(subAreaId);
                    const targetArea = mockAreas.find(a => a.id == Number(subAreaId));
                    // IMPORTANT: Update area object and floor_level to match the area
                    if (targetArea) {
                        sensor.area = targetArea;
                        if (targetArea.floor_level !== undefined) {
                            sensor.floor_level = targetArea.floor_level;
                        }
                    }
                    saveMockData();
                }
                return { success: true };
            }
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

// Updated: Create sub area using /areas/ with parent relationship
export const useCreateSubArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: FormData | { name: string; areaId: string; area_type?: string; person_in_charge_ids?: number[] }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Handle both FormData and plain object
                let formValues: any;
                let parentId: number;

                if (data instanceof FormData) {
                    formValues = {};
                    data.forEach((value, key) => {
                        if (key === 'person_in_charge_ids') {
                            formValues[key] = formValues[key] || [];
                            formValues[key].push(Number(value));
                        } else if (key === 'area_plan') {
                            formValues[key] = value; // Keep File object
                        } else if (key === 'parent_id') {
                            parentId = Number(value);
                        } else {
                            formValues[key] = value;
                        }
                    });
                } else {
                    formValues = data;
                    parentId = Number(data.areaId);
                }

                const parentArea = mockAreas.find(a => a.id == parentId);
                const newId = Math.max(...mockAreas.map(a => a.id)) + 1;
                const newArea: Area = {
                    id: newId,
                    name: formValues.name,
                    area_type: formValues.area_type || 'others',
                    parent_id: parentId,
                    floor_level: parentArea?.floor_level ?? 0,
                    is_room: true,
                    sensor_count: 0,
                    subareas: [],
                    person_in_charge_ids: formValues.person_in_charge_ids || [],
                    // Handle file upload in mock mode
                    floor_plan_url: formValues.area_plan instanceof File
                        ? URL.createObjectURL(formValues.area_plan)
                        : null,
                };
                mockAreas.push(newArea);
                saveMockData();
                return newArea;
            }

            // Real backend: Send FormData or JSON
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const areaIndex = mockAreas.findIndex(a => a.id === areaId);
                if (areaIndex > -1) {
                    const updates = data instanceof FormData ? Object.fromEntries((data as any).entries()) : data;
                    if (updates.area_plan instanceof File) {
                        (updates as any).floor_plan_url = URL.createObjectURL(updates.area_plan);
                    }
                    mockAreas[areaIndex] = { ...mockAreas[areaIndex], ...updates };
                    saveMockData();
                    return mockAreas[areaIndex];
                }
                throw new Error('Area not found');
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const index = mockAreas.findIndex(a => a.id === areaId);
                if (index > -1) {
                    mockAreas.splice(index, 1);
                    saveMockData();
                    return { success: true };
                }
                throw new Error('Area not found');
            }
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

// Updated: Fetch sensors for a specific subarea (area with parent)
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                let sensors = JSON.parse(JSON.stringify(mockSensors));

                // Apply filters to mock data
                if (filters?.areaId) {
                    const targetAreaId = Number(filters.areaId);

                    // Recursive helper to get all child area IDs
                    const getAllChildAreaIds = (id: number, all: Area[]): number[] => {
                        const ids = [id];
                        const children = all.filter(a => a.parent_id === id);
                        children.forEach(child => {
                            ids.push(...getAllChildAreaIds(child.id, all));
                        });
                        return ids;
                    };

                    const descendantIds = getAllChildAreaIds(targetAreaId, mockAreas);
                    sensors = sensors.filter((s: Sensor) => descendantIds.includes(Number(s.area_id)));
                }
                if (filters?.status && filters.status !== 'all') {
                    sensors = sensors.filter((s: Sensor) => s.is_active === (filters.status === 'active'));
                }
                if (filters?.sensor_type) {
                    sensors = sensors.filter((s: Sensor) => s.sensor_type === filters.sensor_type);
                }
                if (filters?.is_online !== undefined) {
                    sensors = sensors.filter((s: Sensor) => s.is_online === filters.is_online);
                }
                if (filters?.search) {
                    const searchLower = filters.search.toLowerCase();
                    sensors = sensors.filter((s: Sensor) =>
                        s.name?.toLowerCase().includes(searchLower) ||
                        s.location?.toLowerCase().includes(searchLower) ||
                        s.mac_address?.toLowerCase().includes(searchLower)
                    );
                }

                return sensors;
            }

            // ============================================
            // REAL BACKEND INTEGRATION WITH ADAPTER
            // ============================================

            // Build query params
            const params = new URLSearchParams();
            if (filters?.areaId) params.append('area', filters.areaId);  // Backend uses 'area' not 'area_id'
            if (filters?.status && filters.status !== 'all') {
                params.append('is_active', (filters.status === 'active').toString());
            }
            if (filters?.sensor_type) params.append('sensor_type', filters.sensor_type);
            if (filters?.is_online !== undefined) params.append('is_online', filters.is_online.toString());
            if (filters?.search) params.append('search', filters.search);

            // Fetch sensors from backend
            const { data: backendResponse } = await axiosInstance.get<Sensor[] | { results: Sensor[], count: number }>(
                `/devices/sensors/?${params.toString()}`
            );

            // Handle pagination (DRF returns { results: [], count: ... } for paginated responses)
            const backendSensors = Array.isArray(backendResponse)
                ? backendResponse
                : (backendResponse as any).results || [];

            // Return raw data
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id.toString() == sensorId.toString());
                if (!sensor) throw new Error('Sensor not found');
                return sensor;
            }

            // Fetch sensor metadata from backend
            const { data: backendSensor } = await axiosInstance.get<Sensor>(`/devices/sensors/${sensorId}/`);

            return backendSensor;
        },
        enabled: !!sensorId,
        // For sensor_4, use longer stale time since WebSocket provides real-time updates
        staleTime: isSensor4 ? 30 * 60 * 1000 : 5 * 60 * 1000, // 30 min vs 5 min
        // Keep previous data while updating to prevent loading flicker
        placeholderData: (previousData) => previousData,
    });
};

// ============================================
// NEW: SENSOR READINGS HOOKS
// ============================================

/**
 * Fetch latest sensor readings for a specific sensor
 * 
 * Backend stores readings separately from sensor metadata.
 * This hook fetches the latest reading by MAC address.
 * 
 * @param sensorId - Sensor ID to fetch readings for
 * @param options - Query options (refetch interval, etc.)
 */
export const useSensorReadings = (sensorId: string | number, options?: { refetchInterval?: number }) => {
    return useQuery({
        queryKey: ['sensorReadings', sensorId.toString()],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                // In mock mode, readings are embedded in sensor object
                await new Promise((resolve) => setTimeout(resolve, 300));
                const sensor = mockSensors.find(s => s.id.toString() === sensorId.toString());
                return sensor?.sensor_data;
            }

            // ============================================
            // REAL BACKEND: Fetch readings separately
            // ============================================

            // Step 1: Get sensor to find MAC address
            const { data: backendSensor } = await axiosInstance.get<Sensor>(
                `/devices/sensors/${sensorId}/`
            );

            if (!backendSensor.mac_address) {
                console.warn(`Sensor ${sensorId} has no MAC address, cannot fetch readings`);
                return null;
            }

            // Step 2: Fetch latest reading by MAC address
            const { data: readings } = await axiosInstance.get<any[]>(
                '/devices/readings/',
                {
                    params: {
                        mac_address: backendSensor.mac_address,
                        limit: 1  // Only get the latest reading
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
        // Poll for real-time updates (every 10 seconds by default)
        refetchInterval: options?.refetchInterval || 10000,
        staleTime: 5000, // Consider data stale after 5 seconds
    });
};

/**
 * Fetch sensor with combined metadata + latest readings
 * 
 * This hook combines:
 * 1. Sensor metadata (from useSensor)
 * 2. Latest readings (from useSensorReadings)
 * 
 * Perfect for 3D visualization where you need both!
 * 
 * @param sensorId - Sensor ID
 * @param options - Query options
 */
export const useSensorWithReadings = (sensorId: string | number, options?: { refetchInterval?: number }) => {
    const sensorQuery = useSensor(sensorId);
    const readingsQuery = useSensorReadings(sensorId, options);

    // Combine the results
    const combinedData = React.useMemo(() => {
        if (!sensorQuery.data) return undefined;

        // If we have readings, combine them with sensor metadata
        if (readingsQuery.data) {
            return { ...sensorQuery.data, sensor_data: readingsQuery.data };
        }

        // Otherwise, return sensor without readings
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


export const useRegisterSensor = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (registrationData: SensorRegistrationData) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 800));

                // Construct a new mock sensor
                const newSensor: Sensor = {
                    id: `S-${Math.floor(Math.random() * 10000)}`,
                    name: registrationData.name,
                    sensor_type: registrationData.sensor_type || 'HALO_SMART',
                    location: registrationData.location,
                    ip_address: registrationData.ip_address,
                    mac_address: registrationData.mac_address,
                    status: 'Inactive',
                    is_online: false,
                    is_active: false,
                    last_heartbeat: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                mockSensors.push(newSensor);
                saveMockData();
                return newSensor;
            }
            const { data } = await axiosInstance.post('/devices/sensors/', registrationData);
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                console.log(`Mock trigger sensor ${data.sensorId} with event ${data.event} at ${data.ip}`);
                return { success: true, message: 'Sensor triggered (Mock)' };
            }
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

// --- Sensor Configuration APIs ---

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
    }
}

export const useRemoteSensorConfig = (sensorType?: string) => {
    return useQuery({
        queryKey: ['remoteSensorConfig', sensorType],
        queryFn: async () => {
            if (!sensorType) return null;
            const { data } = await axios.get(`http://111.92.105.222:8081/api/devices/sensor-config/`, {
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                return mockSensorConfigs[sensorId.toString()] || [];
            }
            // GET /api/sensors/{id}/configurations/
            const { data } = await axiosInstance.get(`/devices/sensors/${sensorId}/configurations/`);
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
            // POST /api/sensors/{id}/add_configuration/
            const { data } = await axiosInstance.post(`/devices/sensors/${sensorId}/add_configuration/`, config);
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensorConfigs = mockSensorConfigs[sensorId.toString()];
                if (sensorConfigs) {
                    const configIndex = sensorConfigs.findIndex(c => c.id === configId);
                    if (configIndex > -1) {
                        sensorConfigs[configIndex] = { ...sensorConfigs[configIndex], ...config };
                        return sensorConfigs[configIndex];
                    }
                }
                // If not found, it might be a new one being added or just missing mock
                return { id: configId, ...config } as SensorConfig;
            }
            // PATCH /api/devices/sensors/{id}/update_configuration/?config_id={id}
            const { data } = await axiosInstance.patch(`/devices/sensors/${sensorId}/update_configuration/?config_id=${configId}`, config);
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
            // DELETE /api/devices/sensors/{id}/delete_configuration/?config_id={id}
            await axiosInstance.delete(`/devices/sensors/${sensorId}/delete_configuration/?config_id=${configId}`);
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

//personals allocation

// Initialize mock data from existing sensors
if (USE_MOCK_DATA) {
    mockSensors.forEach(sensor => {
        if (sensor.personnel_in_charge || sensor.personnel_contact || sensor.personnel_email) {
            mockPersonnelData[sensor.id] = {
                name: sensor.personnel_in_charge || '',
                contact: sensor.personnel_contact || '',
                email: sensor.personnel_email || ''
            };
        }
    });
}

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id.toString() == sensorId.toString());
                if (sensor) {
                    // Update personnel fields
                    if (personnelData.personnel_in_charge !== undefined) {
                        sensor.personnel_in_charge = personnelData.personnel_in_charge;
                    }
                    if (personnelData.personnel_contact !== undefined) {
                        sensor.personnel_contact = personnelData.personnel_contact;
                    }
                    if (personnelData.personnel_email !== undefined) {
                        sensor.personnel_email = personnelData.personnel_email;
                    }
                    saveMockData();
                    return sensor;
                }
                throw new Error('Sensor not found');
            }

            // PATCH /api/sensors/{id}/
            const { data } = await axiosInstance.patch(`/devices/sensors/${sensorId}/`, personnelData);
            return data as Sensor;
        },
        onSuccess: (updatedSensor, { sensorId }) => {
            // Invalidate relevant queries
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

// Optional: Dedicated hook for just updating personnel in charge name
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id.toString() == sensorId.toString());
                if (sensor) {
                    sensor.personnel_in_charge = personnelName;
                    saveMockData();
                    return sensor;
                }
                throw new Error('Sensor not found');
            }

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


// General-purpose sensor update hook
export const useUpdateSensor = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ sensorId, data }: { sensorId: string | number; data: Partial<SensorUpdatePayload> }) => {
            // DIRECT BACKEND: No transformation
            // We assume the UI now provides the correct backend structure (x_val, etc.)
            const backendPayload = data;

            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id.toString() == sensorId.toString());
                if (sensor) {
                    // Update mock data using transformed structure for consistency
                    Object.assign(sensor, data);
                    saveMockData();
                    return sensor;
                }
                throw new Error('Sensor not found');
            }

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

// Delete sensor hook
export const useDeleteSensor = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (sensorId: string | number) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const index = mockSensors.findIndex(s => s.id.toString() == sensorId.toString());
                if (index > -1) {
                    mockSensors.splice(index, 1);
                    saveMockData();
                    return { success: true };
                }
                throw new Error('Sensor not found');
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                let groups = JSON.parse(JSON.stringify(mockSensorGroups));

                // Apply search filter
                if (filters?.search) {
                    const searchLower = filters.search.toLowerCase();
                    groups = groups.filter((g: SensorGroup) =>
                        g.name.toLowerCase().includes(searchLower) ||
                        g.description?.toLowerCase().includes(searchLower)
                    );
                }

                return groups;
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const newId = mockSensorGroups.length + 1;

                // Fetch sensors for mock data if IDs provided
                const groupSensors = data.sensor_ids
                    ? mockSensors.filter(s => data.sensor_ids!.includes(s.id))
                    : [];

                const newGroup: SensorGroup = {
                    id: newId,
                    name: data.name,
                    description: data.description || '',
                    sensor_list: groupSensors,
                    sensor_count: groupSensors.length,
                    activeAlerts: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                mockSensorGroups.push(newGroup);
                return newGroup;
            }
            // POST /api/devices/sensor-groups/
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const group = mockSensorGroups.find(g => g.id.toString() === groupId.toString());
                if (!group) throw new Error('Sensor group not found');
                return JSON.parse(JSON.stringify(group));
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const group = mockSensorGroups.find(g => g.id.toString() === groupId.toString());
                if (group) {
                    if (data.name !== undefined) group.name = data.name;
                    if (data.description !== undefined) group.description = data.description;
                    if (data.sensor_ids !== undefined) {
                        const newSensors = mockSensors.filter(s => data.sensor_ids!.includes(s.id));
                        // group.sensor_list = newSensors;
                        group.sensor_count = newSensors.length;
                    }
                    return group;
                }
                throw new Error('Sensor group not found');
            }


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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const group = mockSensorGroups.find(g => g.id.toString() === groupId.toString());
                if (group) {
                    // Treat sensor_ids as the NEW full list of sensors for the group
                    const updatedSensors = mockSensors.filter(s =>
                        sensor_ids.some(id => String(id) === String(s.id))
                    );
                    group.sensor_list = updatedSensors;
                    group.sensor_count = updatedSensors.length;
                    group.updated_at = new Date().toISOString();
                    return { success: true };
                }
                throw new Error('Sensor group not found');
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const group = mockSensorGroups.find(g => g.id.toString() === groupId.toString());
                if (group) {
                    // Treat sensor_ids as the NEW full list of sensors for the group
                    const updatedSensors = mockSensors.filter(s =>
                        sensor_ids.some(id => String(id) === String(s.id))
                    );
                    group.sensor_list = updatedSensors;
                    group.sensor_count = updatedSensors.length;
                    group.updated_at = new Date().toISOString();
                    return { success: true };
                }
                throw new Error('Sensor group not found');
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const index = mockSensorGroups.findIndex(g => g.id.toString() === groupId.toString());
                if (index > -1) {
                    mockSensorGroups.splice(index, 1);
                    return { success: true };
                }
                throw new Error('Sensor group not found');
            }
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

// ============================================
// HALO DATA INGESTION & REAL-TIME QUERY HOOKS
// ============================================

/**
 * Send Halo sensor data
 * POST /api/devices/halo/data/
 */
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.mac_address === data.mac_address);
                if (sensor) {
                    sensor.sensor_data = data.sensor_data;
                    sensor.last_heartbeat = data.timestamp;
                    saveMockData();
                    return sensor;
                }
                return { success: true };
            }
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

/**
 * Send Halo heartbeat
 * POST /api/devices/halo/heartbeat/
 */
export const useSendHaloHeartbeat = () => {
    return useMutation({
        mutationFn: async (data: {
            device_name: string;
            mac_address: string;
            ip_address: string;
            device_timestamp: string;
            is_online: boolean;
        }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.mac_address === data.mac_address);
                if (sensor) {
                    sensor.is_online = data.is_online;
                    sensor.last_heartbeat = data.device_timestamp;
                    saveMockData();
                }
                return { success: true };
            }
            const { data: response } = await axiosInstance.post('/devices/halo/heartbeat/', data);
            return response;
        }
    });
};

/**
 * Get latest sensor readings
 * GET /api/devices/readings/latest/
 */
export const useLatestReadings = () => {
    return useQuery({
        queryKey: ['latestReadings'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Return latest 10 readings from sensors that have data
                return mockSensors
                    .filter(s => s.sensor_data)
                    .slice(0, 10)
                    .map(s => ({
                        id: Math.floor(Math.random() * 1000),
                        sensor_id: s.id,
                        device_name: s.name,
                        mac_address: s.mac_address,
                        timestamp: s.last_heartbeat || new Date().toISOString(),
                        ...s.sensor_data?.sensors
                    }));
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return mockSensors.map(s => ({
                    sensor_id: s.id,
                    device_name: s.name,
                    mac_address: s.mac_address,
                    is_online: s.is_online ?? true,
                    sensor_data: s.sensor_data,
                    timestamp: s.last_heartbeat
                }));
            }
            const { data } = await axiosInstance.get('/devices/latest-data/');
            return data;
        },
        refetchInterval: 5000, // Refresh every 5 seconds
        staleTime: 3000
    });
};

/**
 * Get active events
 * GET /api/devices/events/active/
 */
export const useActiveEvents = () => {
    return useQuery({
        queryKey: ['activeEvents'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Filter sensors with non-safe statuses
                return mockSensors
                    .filter(s => s.status && !['safe', 'Normal', 'Inactive'].includes(s.status))
                    .map(s => ({
                        id: Math.floor(Math.random() * 1000),
                        sensor_id: s.id,
                        device_name: s.name,
                        event_type: s.status,
                        severity: s.status === 'critical' ? 'High' : 'Medium',
                        timestamp: new Date().toISOString(),
                        is_active: true
                    }));
            }
            const { data } = await axiosInstance.get('/devices/events/active/');
            return data;
        },
        refetchInterval: 3000, // Refresh every 3 seconds
        staleTime: 2000
    });
};

/**
 * Get heartbeat status
 * GET /api/devices/heartbeat/status/
 */
export const useHeartbeatStatus = () => {
    return useQuery({
        queryKey: ['heartbeatStatus'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const total = mockSensors.length;
                const online = mockSensors.filter(s => s.is_online !== false).length;
                const offline = total - online;
                return {
                    total_sensors: total,
                    online_sensors: online,
                    offline_sensors: offline,
                    last_update: new Date().toISOString()
                };
            }
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

/**
 * Get device readings
 * GET /api/devices/devices/{device_id}/readings/
 */
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

/**
 * List all devices
 * GET /api/devices/devices/
 */
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

/**
 * Device health check
 * GET /api/devices/health/
 */
export const useDeviceHealth = () => {
    return useQuery({
        queryKey: ['deviceHealth'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // System is healthy if more than 50% sensors are online
                const online = mockSensors.filter(s => s.is_online !== false).length;
                const healthy = online > mockSensors.length / 2;
                return {
                    status: healthy ? 'Healthy' : 'Degraded',
                    timestamp: new Date().toISOString()
                };
            }
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

// ============================================
// USER GROUPS API HOOKS
// ============================================

/**
 * Fetch all user groups
 * GET /api/user-groups/
 */
export const useUserGroups = (filters?: { search?: string; ordering?: string }) => {
    return useQuery({
        queryKey: ['userGroups', filters],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return JSON.parse(JSON.stringify(mockUserGroups));
            }

            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.ordering) params.append('ordering', filters.ordering);

            const { data } = await axiosInstance.get(`/users/groups/?${params.toString()}`);
            return data as UserGroup[];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Fetch single user group details
 * GET /api/user-groups/{id}/
 */
export const useUserGroup = (groupId: number | null) => {
    return useQuery({
        queryKey: ['userGroups', groupId],
        queryFn: async () => {
            if (!groupId) throw new Error('Group ID is required');

            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const group = mockUserGroups.find(g => g.id === groupId);
                if (!group) throw new Error('Group not found');
                return group;
            }

            const { data } = await axiosInstance.get(`/users/groups/${groupId}/`);
            return data as UserGroup;
        },
        enabled: !!groupId,
    });
};

/**
 * Create new user group
 * POST /api/user-groups/
 */
export const useCreateUserGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: UserGroupCreateData) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const newId = Math.max(...mockUserGroups.map(g => g.id), 0) + 1;
                const members = data.member_ids
                    ? mockUsers.filter(u => data.member_ids!.includes(u.id))
                    : [];
                const newGroup: UserGroup = {
                    id: newId,
                    name: data.name,
                    description: data.description || '',
                    members,
                    member_count: members.length,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                mockUserGroups.push(newGroup);
                return newGroup;
            }

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

/**
 * Update user group
 * PUT/PATCH /api/user-groups/{id}/
 */
export const useUpdateUserGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, data }: { groupId: number; data: UserGroupUpdateData }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const groupIndex = mockUserGroups.findIndex(g => g.id === groupId);
                if (groupIndex > -1) {
                    const members = data.member_ids
                        ? mockUsers.filter(u => data.member_ids!.includes(u.id))
                        : mockUserGroups[groupIndex].members;

                    mockUserGroups[groupIndex] = {
                        ...mockUserGroups[groupIndex],
                        ...data,
                        members,
                        member_count: members.length,
                        updated_at: new Date().toISOString(),
                    };
                    return mockUserGroups[groupIndex];
                }
                throw new Error('Group not found');
            }

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

/**
 * Add members to group
 * POST /api/user-groups/{id}/add_members/
 */
export const useAddGroupMembers = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, member_ids }: { groupId: number; member_ids: number[] }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const groupIndex = mockUserGroups.findIndex(g => g.id === groupId);
                if (groupIndex > -1) {
                    const newMembers = mockUsers.filter(u => member_ids.includes(u.id));
                    const existingMemberIds = mockUserGroups[groupIndex].members.map((m: User) => m.id);
                    const uniqueNewMembers = newMembers.filter(m => !existingMemberIds.includes(m.id));

                    mockUserGroups[groupIndex].members.push(...uniqueNewMembers);
                    mockUserGroups[groupIndex].member_count = mockUserGroups[groupIndex].members.length;
                    mockUserGroups[groupIndex].updated_at = new Date().toISOString();

                    return mockUserGroups[groupIndex];
                }
                throw new Error('Group not found');
            }

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

/**
 * Remove members from group
 * POST /api/user-groups/{id}/remove_members/
 */
export const useRemoveGroupMembers = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ groupId, member_ids }: { groupId: number; member_ids: number[] }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const groupIndex = mockUserGroups.findIndex(g => g.id === groupId);
                if (groupIndex > -1) {
                    mockUserGroups[groupIndex].members = mockUserGroups[groupIndex].members.filter(
                        (m: User) => !member_ids.includes(m.id)
                    );
                    mockUserGroups[groupIndex].member_count = mockUserGroups[groupIndex].members.length;
                    mockUserGroups[groupIndex].updated_at = new Date().toISOString();

                    return mockUserGroups[groupIndex];
                }
                throw new Error('Group not found');
            }

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
 * DELETE /api/user-groups/{id}/
 */
export const useDeleteUserGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (groupId: number) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const index = mockUserGroups.findIndex(g => g.id === groupId);
                if (index > -1) {
                    mockUserGroups.splice(index, 1);
                    return { success: true };
                }
                throw new Error('Group not found');
            }

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

// ============================================
// ALERTS API
// ============================================


// Get all alerts with optional filters
export const useAlerts = (filters?: AlertFilters) => {
    return useQuery({
        queryKey: ['alerts', filters],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                let filtered = [...mockAlerts];

                if (filters?.type) {
                    filtered = filtered.filter(alert => alert.type === filters.type);
                }
                if (filters?.status) {
                    filtered = filtered.filter(alert => alert.status === filters.status);
                }
                if (filters?.sensor) {
                    filtered = filtered.filter(alert => {
                        const sId = typeof alert.sensor === 'object' ? alert.sensor.id : alert.sensor;
                        return sId === filters.sensor;
                    });
                }
                if (filters?.area) {
                    filtered = filtered.filter(alert => {
                        const aId = typeof alert.area === 'object' ? alert.area.id : alert.area;
                        return aId === filters.area;
                    });
                }
                if (filters?.search) {
                    const searchLower = filters.search.toLowerCase();
                    filtered = filtered.filter(alert => {
                        const sName = alert.sensor_name || (typeof alert.sensor === 'object' ? alert.sensor.name : '');
                        const aName = alert.area_name || (typeof alert.area === 'object' ? alert.area.name : '');
                        return (
                            alert.type.toLowerCase().includes(searchLower) ||
                            alert.description.toLowerCase().includes(searchLower) ||
                            sName.toLowerCase().includes(searchLower) ||
                            aName.toLowerCase().includes(searchLower)
                        );
                    });
                }

                return filtered;
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                const alert = mockAlerts.find(a => a.id === alertId);
                if (!alert) throw new Error('Alert not found');
                return alert;
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const newId = Math.max(...mockAlerts.map(a => a.id), 0) + 1;
                const newAlert: Alert = {
                    id: newId,
                    type: alertData.type,
                    status: alertData.status,
                    description: alertData.description,
                    remarks: alertData.remarks,
                    sensor: { id: alertData.sensor, name: `Sensor-${alertData.sensor}` },
                    area: { id: alertData.area, name: `Area-${alertData.area}` },
                    user_acknowledged: null,
                    time_of_acknowledgment: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                mockAlerts.push(newAlert);
                return newAlert;
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const alertIndex = mockAlerts.findIndex(a => a.id === alertId);
                if (alertIndex > -1) {
                    mockAlerts[alertIndex] = {
                        ...mockAlerts[alertIndex],
                        ...data,
                        updated_at: new Date().toISOString(),
                        time_of_acknowledgment: data.user_acknowledged ? new Date().toISOString() : mockAlerts[alertIndex].time_of_acknowledgment,
                        remarks: data.remarks || mockAlerts[alertIndex].remarks,
                    };
                    return mockAlerts[alertIndex];
                }
                throw new Error('Alert not found');
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const alertIndex = mockAlerts.findIndex(a => a.id === alertId);
                if (alertIndex > -1) {
                    mockAlerts.splice(alertIndex, 1);
                    return { success: true };
                }
                throw new Error('Alert not found');
            }

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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return mockAlertTrends;
            }
            const params = new URLSearchParams();
            params.append('period', filters.period);
            if (filters.type) params.append('type', filters.type);
            if (filters.status) params.append('status', filters.status);

            const { data } = await axiosInstance.get(`/alert-management/alerts/trends/?${params.toString()}`);
            return data as AlertTrendResponse;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        enabled: !!filters.period,
    });
};


// ============================================
// ALERT CONFIGURATION API
// ============================================

export const useAlertConfigurations = () => {
    return useQuery({
        queryKey: ['alertConfigurations'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return JSON.parse(JSON.stringify(mockAlertConfigurations));
            }
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
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));

                if (config.id) {
                    const index = mockAlertConfigurations.findIndex(c => c.id === config.id);
                    if (index > -1) {
                        const updated = {
                            ...mockAlertConfigurations[index],
                            ...config,
                            updated_at: new Date().toISOString()
                        } as AlertConfiguration;
                        mockAlertConfigurations[index] = updated;
                        saveMockData();
                        return updated;
                    }
                    throw new Error('Configuration not found');
                } else {
                    // Create new
                    const newId = Math.max(...mockAlertConfigurations.map(c => c.id), 0) + 1;
                    const newConfig = {
                        ...config,
                        id: newId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        enabled: config.enabled ?? true,
                        recipients: config.recipients || [],
                        actions: config.actions || { email: false, sms: false, push_notification: false, in_app: false }
                    } as AlertConfiguration;
                    mockAlertConfigurations.push(newConfig);
                    saveMockData();
                    return newConfig;
                }
            }

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

// ============================================
// ALERT FILTERS & ACTIONS API
// ============================================

/**
 * Fetch all alert filters
 * GET /api/alert-management/alert-filters/
 */
export const useAlertFilters = (filters?: { search?: string; area_id?: number }) => {
    return useQuery({
        queryKey: ['alertFilters', filters],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return [
                    {
                        id: 1,
                        name: "HighAirQuality_Critical",
                        description: "Trigger actions for critical air quality alerts",
                        area_ids: [1, 2, 3],
                        sensor_config_ids: [5, 6, 7],
                        action_for_min: true,
                        action_for_max: true,
                        action_for_threshold: true,
                        sensor_group_ids: [1],
                        action_ids: [1, 2, 3],
                        weekdays: [0, 1, 2, 3, 4], // Mon-Fri
                        start_time: "09:00",
                        end_time: "17:00",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ] as AlertFilter[];
            }

            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.area_id) params.append('area_id', filters.area_id.toString());

            const { data } = await axiosInstance.get(`/alert-management/alert-filters/?${params.toString()}`);
            return data as AlertFilter[];
        }
    });
};

/**
 * Fetch all actions
 * GET /api/alert-management/actions/
 */
export const useActions = (filters?: { search?: string; type?: string; is_active?: boolean }) => {
    return useQuery({
        queryKey: ['actions', filters],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return [
                    {
                        id: 1,
                        name: "SendAQIAlert_ToBuildings",
                        type: "email",
                        recipients: [1, 2, 5],
                        user_groups: [1, 2],
                        device_type: 'HALO',
                        device_list: "device_001,device_002,device_003",
                        message_type: "critical",
                        message_template: "Alert: {alert_type} detected in {area_name}. Sensor: {sensor_name}. Description: {description}",
                        is_active: true,
                        http_method: 'POST',
                        webhook_url: 'https://api.example.com/webhook',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ] as Action[];
            }

            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.type) params.append('type', filters.type);
            if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

            const { data } = await axiosInstance.get(`/alert-management/actions/?${params.toString()}`);
            return data as Action[];
        }
    });
};

/**
 * Create new alert filter
 * POST /api/alert-management/alert-filters/
 */
export const useCreateAlertFilter = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (filterData: Partial<AlertFilter>) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { ...filterData, id: Math.floor(Math.random() * 1000) } as AlertFilter;
            }
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

/**
 * Update alert filter
 * PATCH /api/alert-management/alert-filters/{id}/
 */
export const useUpdateAlertFilter = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<AlertFilter> }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { id, ...data } as AlertFilter;
            }
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

/**
 * Delete alert filter
 * DELETE /api/alert-management/alert-filters/{id}/
 */
export const useDeleteAlertFilter = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (id: number) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { success: true };
            }
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
/**
 * Create new action
 * POST /api/alert-management/actions/
 */
export const useCreateAction = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (actionData: Partial<Action>) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { ...actionData, id: Math.floor(Math.random() * 1000), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Action;
            }
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

/**
 * Update action
 * PATCH /api/alert-management/actions/{id}/
 */
export const useUpdateAction = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Action> }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { id, ...data, updated_at: new Date().toISOString() } as Action;
            }
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

/**
 * Delete action
 * DELETE /api/alert-management/actions/{id}/
 */
export const useDeleteAction = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (id: number) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { success: true };
            }
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
