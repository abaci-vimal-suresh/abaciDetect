import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { USE_MOCK_DATA } from '../config';
import { publicAxios } from '../axiosInstance';

export interface SystemStatus {
    deviceId: string | null;
    isActivated: boolean;
    hasUsers: boolean;
}

export interface SystemConfig {
    id: number;
    is_activated: boolean;
    version: string;
    is_firstuser_created: boolean;
    created_at: string;
    updated_at: string;
    device_id: string;
}

const MOCK_SYSTEM_STATUS: SystemStatus = {
    deviceId: "HALO-12345",
    isActivated: true,
    hasUsers: true,
};

let mockHasUsers = true;

export const fetchSystemStatus = async (): Promise<SystemStatus> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ...MOCK_SYSTEM_STATUS,
                    hasUsers: mockHasUsers,
                });
            }, 500);
        });
    }
    // TODO: Replace with real API call
    return { ...MOCK_SYSTEM_STATUS, hasUsers: mockHasUsers };
};

export const setMockHasUsers = (hasUsers: boolean) => {
    mockHasUsers = hasUsers;
};

export const useSystemStatus = () => {
    return useQuery({
        queryKey: ['systemStatus'],
        queryFn: fetchSystemStatus,
    });
};

/**
 * Fetch System Configuration
 */
export const fetchSystemConfig = async (): Promise<SystemConfig> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: 1,
                    is_activated: true,
                    version: "1.0.0",
                    is_firstuser_created: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    device_id: "HALO-12345",
                });
            }, 500);
        });
    }

    const { data } = await publicAxios.get<SystemConfig>('/administration/system-config/');
    return data;
};

/**
 * Hook for System Configuration
 */
export const useSystemConfig = () => {
    return useQuery({
        queryKey: ['systemConfig'],
        queryFn: fetchSystemConfig,
    });
};

/**
 * Hook for License Key Generation
 */
export const useGenerateLicenseKey = () => {
    return useMutation({
        mutationFn: async (deviceId: string) => {
            if (USE_MOCK_DATA) {
                console.log('🚀 Mock Generating License Key for:', deviceId);
                return new Promise((resolve) => setTimeout(() => resolve({ message: 'License key generated' }), 800));
            }
            const { data } = await publicAxios.post('/administration/generate-license-key/', { device_id: deviceId });
            return data;
        },
        onSuccess: () => {
            console.log('✅ License Key Generated Successfully');
        },
        onError: (error: any) => {
            console.error('❌ License Generation Error:', error);
        }
    });
};

/**
 * Hook for License Key Validation
 */
export const useValidateLicense = () => {
    return useMutation({
        mutationFn: async (payload: { device_id: string; license_key: string }) => {
            if (USE_MOCK_DATA) {
                console.log('🚀 Mock Validating License Key:', payload);
                if (payload.license_key === 'HALO-SUCCESS-123') {
                    return new Promise((resolve) => setTimeout(() => resolve({ message: 'License validated successfully' }), 800));
                }
                return new Promise((_, reject) => setTimeout(() => reject(new Error('Invalid license key')), 800));
            }
            const { data } = await publicAxios.post('/administration/validate-license/', payload);
            return data;
        },
        onSuccess: () => {
            console.log('✅ License Validated Successfully');
        },
        onError: (error: any) => {
            console.error('❌ License Validation Error:', error);
        }
    });
};
/**
 * Hook for Super Admin Registration
 */
export const useRegisterSuperAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            if (USE_MOCK_DATA) {
                console.log('🚀 Mock Registering Super Admin:', payload);
                return new Promise((resolve) => setTimeout(() => resolve({ message: 'Super admin created' }), 800));
            }

            // Standardize role to lowercase as expected by /users/create/
            const processedPayload = {
                ...payload,
                role: payload.role?.toLowerCase() || 'admin'
            };

            const { data } = await publicAxios.post('/users/create/', processedPayload);
            return data;
        },
        onSuccess: () => {
            console.log('✅ Super Admin Registered Successfully');
            // Invalidate system config to update UI and hide setup pages
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        },
        onError: (error: any) => {
            console.error('❌ Super Admin Registration Error:', error);
        }
    });
};
