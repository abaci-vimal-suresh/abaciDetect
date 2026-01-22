import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';
import { queryKeys } from '../lib/queryClient';
import { Sensor, Area, SubArea, SensorRegistrationData, SensorConfig, User, UserActivity, UserRole, UserGroup, UserGroupCreateData, UserGroupUpdateData, SensorGroup, SensorGroupCreateData, SensorGroupUpdateData, UserCreateData, UserUpdateData } from '../types/sensor';
import useToasterNotification from '../hooks/useToasterNotification';
import { mockAreas, mockSubAreas, mockSensors, saveMockData, mockUsers, mockUserGroups, mockSensorGroups } from '../mockData/sensors';

export const USE_MOCK_DATA = true;

const mockPersonnelData: { [sensorId: string]: { name: string; contact: string; email: string } } = {};

const mockUserActivities: UserActivity[] = [
    { id: 1, user_id: 1, action: 'System Setup', timestamp: new Date().toISOString(), details: 'Admin created the system' },
    { id: 2, user_id: 2, action: 'Login', timestamp: new Date().toISOString(), details: 'John Doe logged in' }
];

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
            const { data } = await axiosInstance.post('/users/create/', userData);
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

            const { data } = await axiosInstance.patch(`/users/detail/${userId}/`, userData);
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


// Helper to adapt Backend API Area format to Frontend Area Interface
const mapBackendAreaToFrontend = (backendArea: any): Area => {
    return {
        id: backendArea.id,
        name: backendArea.name,
        sensor_count: backendArea.sensor_count,
        parent_id: backendArea.parent_id,

        // Map Backend 'area_plan' -> Frontend 'floor_plan_url'
        floor_plan_url: backendArea.area_plan,

        // Map Backend User Objects -> Frontend IDs
        person_in_charge_ids: backendArea.person_in_charge
            ? backendArea.person_in_charge.map((u: any) => u.id)
            : [],

        // Recursively map subareas
        subareas: backendArea.subareas
            ? backendArea.subareas.map(mapBackendAreaToFrontend)
            : [],

        // Map or Default other optional fields
        is_room: backendArea.subareas && backendArea.subareas.length === 0, // Heuristic: if leaf node, arguably a room? Or default false.
        floor_level: null, // Backend doesn't seem to send this yet, defaulting
        floor_height: 250, // Default
    };
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

            // Adapt the list
            return data.map(mapBackendAreaToFrontend) as Area[];
        },
    });
};


export const useCreateArea = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: { name: string; person_in_charge_ids?: number[] }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const newId = Math.max(...mockAreas.map(a => a.id)) + 1;
                const newArea: Area = {
                    id: newId,
                    name: data.name,
                    sensor_count: 0,
                    subareas: [],
                    parent_id: null,
                    person_in_charge_ids: data.person_in_charge_ids || []
                };
                mockAreas.push(newArea);
                saveMockData();
                return newArea;
            }
            const response = await axiosInstance.post('/administration/areas/', data);
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
                area_id: Number(subAreaId)
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
        mutationFn: async (data: { name: string; areaId: string; person_in_charge_ids?: number[] }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const parentArea = mockAreas.find(a => a.id == Number(data.areaId));
                const newId = Math.max(...mockAreas.map(a => a.id)) + 1;
                const newArea: Area = {
                    id: newId,
                    name: data.name,
                    parent_id: Number(data.areaId),
                    floor_level: parentArea?.floor_level ?? 0,
                    is_room: true,
                    sensor_count: 0,
                    subareas: [],
                    person_in_charge_ids: data.person_in_charge_ids || []
                };
                mockAreas.push(newArea);
                saveMockData();
                return newArea;
            }
            const response = await axiosInstance.post(`/administration/areas/`, {
                name: data.name,
                parent_id: Number(data.areaId),
                person_in_charge_ids: data.person_in_charge_ids
            });
            return response.data as Area;
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
        mutationFn: async ({ areaId, data }: { areaId: number; data: Partial<Area> }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const areaIndex = mockAreas.findIndex(a => a.id === areaId);
                if (areaIndex > -1) {
                    mockAreas[areaIndex] = { ...mockAreas[areaIndex], ...data };
                    saveMockData();
                    return mockAreas[areaIndex];
                }
                throw new Error('Area not found');
            }
            const response = await axiosInstance.patch(`/administration/areas/${areaId}/`, data);
            return response.data as Area;
        },
        onSuccess: (updatedArea) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showSuccessNotification(`Area "${updatedArea.name}" updated successfully!`);
        },
        onError: (error: any) => {
            showErrorNotification(error?.response?.data?.message || 'Failed to update area');
        }
    });
};

// Updated: Fetch sensors for a specific subarea (area with parent)
export const useSubAreaSensors = (subAreaId: string) => {
    return useQuery({
        queryKey: ['subareas', subAreaId, 'sensors'],
        queryFn: async () => {
            const { data } = await axiosInstance.get(`/devices/sensors/?area_id=${subAreaId}`);
            return data as Sensor[];
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

            // Build query params
            const params = new URLSearchParams();
            if (filters?.areaId) params.append('area_id', filters.areaId);
            if (filters?.status && filters.status !== 'all') {
                params.append('is_active', (filters.status === 'active').toString());
            }
            if (filters?.sensor_type) params.append('sensor_type', filters.sensor_type);
            if (filters?.is_online !== undefined) params.append('is_online', filters.is_online.toString());
            if (filters?.search) params.append('search', filters.search);

            const { data } = await axiosInstance.get(`/devices/sensors/?${params.toString()}`);
            return data as Sensor[];
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
};



export const useSensor = (sensorId: string) => {
    const isSensor4 = sensorId === '4';

    return useQuery({
        queryKey: queryKeys.sensors.detail(sensorId),
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id == sensorId);
                if (!sensor) throw new Error('Sensor not found');
                return sensor;
            }
            // Use /devices/{id}/latest to get real-time sensor data
            const { data } = await axiosInstance.get(`/devices/sensors/${sensorId}/`);
            return data as Sensor;
        },
        enabled: !!sensorId,
        // For sensor_4, use longer stale time since WebSocket provides real-time updates
        staleTime: isSensor4 ? 30 * 60 * 1000 : 5 * 60 * 1000, // 30 min vs 5 min
        // Keep previous data while updating to prevent loading flicker
        placeholderData: (previousData) => previousData,
    });
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
            const response = await axiosInstance.post(`/devices/trigger/`, {
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


export const useSensorConfigurations = (sensorId: string) => {
    return useQuery({
        queryKey: ['sensorConfigurations', sensorId],
        queryFn: async () => {
            if (!sensorId) return [];
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
        mutationFn: async ({ sensorId, config }: { sensorId: string; config: SensorConfig }) => {
            // POST /api/sensors/{id}/add_configuration/
            const { data } = await axiosInstance.post(`/devices/sensors/${sensorId}/add_configuration/`, config);
            return data as SensorConfig;
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorConfigurations', sensorId] });
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
        mutationFn: async ({ sensorId, configId, config }: { sensorId: string; configId: number; config: Partial<SensorConfig> }) => {
            // PUT/PATCH /api/sensors/{id}/configurations/{config_id}/
            const { data } = await axiosInstance.patch(`/devices/sensors/${sensorId}/configurations/${configId}/`, config);
            return data as SensorConfig;
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorConfigurations', sensorId] });
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
        mutationFn: async ({ sensorId, configId }: { sensorId: string; configId: number }) => {
            // DELETE /api/sensors/{id}/configurations/{config_id}/
            await axiosInstance.delete(`/devices/sensors/${sensorId}/configurations/${configId}/`);
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: ['sensorConfigurations', sensorId] });
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
            sensorId: string;
            personnelData: {
                personnel_in_charge?: string;
                personnel_contact?: string;
                personnel_email?: string;
            }
        }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id == sensorId);
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
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.detail(sensorId) });
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
            sensorId: string;
            personnelName: string;
        }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id == sensorId);
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
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.detail(sensorId) });
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
        mutationFn: async ({ sensorId, data }: { sensorId: string; data: Partial<Sensor> }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const sensor = mockSensors.find(s => s.id == sensorId);
                if (sensor) {
                    Object.assign(sensor, data);
                    saveMockData();
                    return sensor;
                }
                throw new Error('Sensor not found');
            }

            const { data: response } = await axiosInstance.patch(`/devices/sensors/${sensorId}/`, data);
            return response as Sensor;
        },
        onSuccess: (_, { sensorId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sensors.detail(sensorId) });
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
        mutationFn: async (sensorId: string) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const index = mockSensors.findIndex(s => s.id == sensorId);
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
                    ? mockSensors.filter(s => data.sensor_ids!.includes(Number(s.id)))
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
                        const newSensors = mockSensors.filter(s => data.sensor_ids!.includes(Number(s.id)));
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
                    if (!group.sensor_list) group.sensor_list = [];

                    const newSensors = mockSensors.filter(s => sensor_ids.includes(s.id));
                    const currentIds = group.sensor_list.map(s => Number(s.id));
                    const toAddObj = newSensors.filter(s => !currentIds.includes(Number(s.id)));

                    group.sensor_list.push(...toAddObj);
                    group.sensor_count = group.sensor_list.length;
                    group.updated_at = new Date().toISOString();
                    return { success: true };
                }
                throw new Error('Sensor group not found');
            }
            // Consolidate to standard PATCH endpoint as per documentation
            const { data } = await axiosInstance.patch(`/devices/sensor-groups/${groupId}/`, { sensor_ids });
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
                    if (group.sensor_list) {
                        group.sensor_list = group.sensor_list.filter(s => !sensor_ids.includes(Number(s.id)));
                        group.sensor_count = group.sensor_list.length;
                    }
                    group.updated_at = new Date().toISOString();
                    return { success: true };
                }
                throw new Error('Sensor group not found');
            }
            const { data } = await axiosInstance.patch(`/devices/sensor-groups/${groupId}/`, { sensor_ids });
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
        refetchInterval: 5000, // Refresh every 5 seconds
        staleTime: 3000
    });
};

/**
 * Get all sensors' latest data
 * GET /api/devices/sensors/latest-data/
 */
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
            const { data } = await axiosInstance.get('/devices/sensors/latest-data/');
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
