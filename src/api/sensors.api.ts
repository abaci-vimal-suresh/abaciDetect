import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../axiosInstance';
import { queryKeys } from '../lib/queryClient';
import { Sensor, Area, SubArea, SensorRegistrationData, SensorConfig, User, UserActivity, UserRole, UserGroup, UserGroupCreateData, UserGroupUpdateData } from '../types/sensor';
import useToasterNotification from '../hooks/useToasterNotification';
import { mockAreas, mockSubAreas, mockSensors, saveMockData, mockUsers, mockUserGroups } from '../mockData/sensors';
import { SensorGroup } from '../types/sensor';
import { mockSensorGroups } from '../mockData/sensors';

const USE_MOCK_DATA = true;

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
            const { data } = await axiosInstance.get('/users');
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
            const { data } = await axiosInstance.get(`/users/${userId}`);
            return data as User;
        },
        enabled: !!userId
    });
};

export const useAddUser = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (userData: any) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const newId = Math.max(...mockUsers.map(u => u.id)) + 1;
                const newUser: User = {
                    ...userData,
                    id: newId,
                    created_at: new Date().toISOString(),
                    is_active: true,
                    assigned_area_ids: userData.assigned_area_ids || []
                };
                mockUsers.push(newUser);
                return newUser;
            }

            // Format payload to match backend spec
            const { assigned_area_ids, ...rest } = userData;
            const payload = {
                ...rest,
                role: rest.role?.toLowerCase(), // Ensure 'admin' or 'viewer'
            };

            // Spec: POST /api/users/create/
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
        mutationFn: async ({ userId, userData }: { userId: number; userData: Partial<User> }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const userIndex = mockUsers.findIndex(u => u.id === userId);
                if (userIndex > -1) {
                    const updatedUser = {
                        ...mockUsers[userIndex],
                        ...userData,
                        role: userData.role ? (userData.role.toLowerCase() === 'admin' ? 'Admin' : 'Viewer') : mockUsers[userIndex].role
                    } as User;
                    mockUsers[userIndex] = updatedUser;
                    return mockUsers[userIndex];
                }
                throw new Error('User not found');
            }

            const { assigned_area_ids, ...rest } = userData;
            const payload = {
                ...rest,
                ...(rest.role && { role: rest.role.toLowerCase() as UserRole }),
            };

            const { data } = await axiosInstance.patch(`/users/${userId}/`, payload);
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
            await axiosInstance.delete(`/users/${userId}/`);
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
            const { data } = await axiosInstance.get('/areas/?include_subareas=true');

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
            const response = await axiosInstance.post('/areas/', data);
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
            const { data } = await axiosInstance.patch(`/sensors/${sensorId}/`, {
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
            const response = await axiosInstance.post(`/areas/`, {
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
            const response = await axiosInstance.patch(`/areas/${areaId}/`, data);
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
            const { data } = await axiosInstance.get(`/sensors/subareas/${subAreaId}/sensors/`);
            return data as Sensor[];
        },
        enabled: !!subAreaId,
    });
};

export const useSensors = (filters?: { areaId?: string; status?: 'all' | 'active' | 'inactive' }) => {
    return useQuery({
        queryKey: queryKeys.sensors.list(filters || {}),
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Return a deep copy to ensure reference change triggers re-renders
                return JSON.parse(JSON.stringify(mockSensors));
            }

            // Build query params
            const params = new URLSearchParams();
            if (filters?.areaId) params.append('area_id', filters.areaId);
            if (filters?.status && filters.status !== 'all') {
                params.append('is_active', (filters.status === 'active').toString());
            }

            const { data } = await axiosInstance.get(`/sensors?${params.toString()}`);
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
            const { data } = await axiosInstance.get(`/devices/${sensorId}/latest`);
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
            const { data } = await axiosInstance.post('/sensors/', registrationData);
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
        mutationFn: async (data: { sensorId: number; event: string; ip: string }) => {
            const response = await axiosInstance.post(`/trigger/sensor`, {
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
            const { data } = await axiosInstance.get(`/sensors/${sensorId}/configurations/`);
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
            const { data } = await axiosInstance.post(`/sensors/${sensorId}/add_configuration/`, config);
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
            const { data } = await axiosInstance.patch(`/sensors/${sensorId}/configurations/${configId}/`, config);
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
            await axiosInstance.delete(`/sensors/${sensorId}/configurations/${configId}/`);
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
            const { data } = await axiosInstance.patch(`/sensors/${sensorId}/`, personnelData);
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

            const { data } = await axiosInstance.patch(`/sensors/${sensorId}/`, {
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



export const useSensorGroups = () => {
    return useQuery({
        queryKey: ['sensorGroups'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return JSON.parse(JSON.stringify(mockSensorGroups));
            }
            // GET /api/sensor-groups/
            const { data } = await axiosInstance.get('/sensor-groups/');
            return data as SensorGroup[];
        }
    });
};

export const useCreateSensorGroup = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const newId = (mockSensorGroups.length + 1).toString();
                const newGroup = {
                    id: newId,
                    name: data.name,
                    description: data.description || '',
                    status: 'Normal',
                    sensorCount: 0,
                    activeAlerts: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                mockSensorGroups.push(newGroup);
                return newGroup;
            }
            // POST /api/sensor-groups/
            const { data: response } = await axiosInstance.post('/sensor-groups/', data);
            return response;
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

            const { data } = await axiosInstance.get(`/user-groups/?${params.toString()}`);
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

            const { data } = await axiosInstance.get(`/user-groups/${groupId}/`);
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

            const { data: response } = await axiosInstance.post('/user-groups/', data);
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

            const { data: response } = await axiosInstance.patch(`/user-groups/${groupId}/`, data);
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

            const { data } = await axiosInstance.post(`/user-groups/${groupId}/add_members/`, { member_ids });
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

            const { data } = await axiosInstance.post(`/user-groups/${groupId}/remove_members/`, { member_ids });
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

            await axiosInstance.delete(`/user-groups/${groupId}/`);
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
