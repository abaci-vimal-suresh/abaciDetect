import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicAxios, authAxios } from '../axiosInstance';
import { mockAuthService } from '../mockAuthService';
import useToasterNotification from '../hooks/shared/useToasterNotification';
import Cookies from 'js-cookie';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Authentication Strategy:
 * - 'httponly': Uses HTTP-only cookies (recommended for production)
 *   Backend sets HttpOnly cookie, frontend uses withCredentials: true
 * - 'js-cookie': Uses JavaScript-accessible cookies
 *   Backend returns token, frontend stores in cookie and adds to Authorization header
 */
type AuthStrategy = 'httponly' | 'js-cookie';

const AUTH_STRATEGY: AuthStrategy =
    (import.meta.env.VITE_AUTH_STRATEGY as AuthStrategy) || 'httponly';

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true' || false;

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface UserData {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
    user_class: string;
    user_status: string;
}

export interface LoginResponse {
    data: UserData;
    message: string;
    token?: string; // Only present for js-cookie strategy
}

export interface ProfileResponse {
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
    user_status: string;
}

export interface OrganizationCheckResponse {
    organization_exists: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Store authentication token (only for js-cookie strategy)
 */
const storeToken = (token: string): void => {
    if (AUTH_STRATEGY === 'js-cookie') {
        Cookies.set('token', token, {
            expires: 7, // 7 days
            sameSite: 'Lax',
            secure: import.meta.env.PROD // Only secure in production
        });
    }
};

/**
 * Clear authentication token
 */
const clearToken = (): void => {
    if (AUTH_STRATEGY === 'js-cookie') {
        Cookies.remove('token');
    }
    // For httponly strategy, backend clears the cookie
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    if (USE_MOCK_AUTH) {
        return mockAuthService.isAuthenticated();
    }

    if (AUTH_STRATEGY === 'js-cookie') {
        return !!Cookies.get('token');
    }

    // For httponly strategy, we can't check the cookie from JS
    // We rely on the backend to validate the cookie
    return true; // Assume authenticated, let backend validate
};

// ============================================
// REACT QUERY HOOKS
// ============================================

/**
 * Login Hook
 * Handles user authentication with automatic token/session management
 */
export const useLogin = () => {
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
            if (USE_MOCK_AUTH) {
                // Use mock service
                const response = await mockAuthService.login(credentials);
                return response;
            }

            // Real API call
            const { data } = await publicAxios.post<LoginResponse>('/users/login/', credentials);

            // Store token if using js-cookie strategy
            if (AUTH_STRATEGY === 'js-cookie' && data.token) {
                storeToken(data.token);
            }

            return data;
        },
        onSuccess: (response) => {
            console.log('✅ Login Success:', response);
            showSuccessNotification('Login successful');
        },
        onError: (error: any) => {
            console.error('❌ Login Error:', error);

            let errorMessage = 'Error occurred, please check your connection and try again!';
            const status = error.response?.status;
            const serverMessage = error.response?.data?.message;

            if (status === 401 || status === 403) {
                errorMessage = serverMessage || 'Invalid credentials';
            } else if (status === 400) {
                errorMessage = serverMessage || errorMessage;
            }

            showErrorNotification(errorMessage);
        },
    });
};

/**
 * Logout Hook
 * Handles user logout with cleanup
 */
export const useLogout = () => {
    const queryClient = useQueryClient();
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (): Promise<void> => {
            if (USE_MOCK_AUTH) {
                await mockAuthService.logout();
                return;
            }

            // Real API call
            await authAxios.post('/users/logout/');

            // Clear token if using js-cookie strategy
            clearToken();
        },
        onSuccess: () => {
            console.log('✅ Logout Success');

            // Clear all cached queries
            queryClient.clear();

            showSuccessNotification('Logged out successfully');
        },
        onError: (error: any) => {
            console.error('❌ Logout Error:', error);

            // Even if logout fails, clear local state
            clearToken();
            queryClient.clear();

            showErrorNotification('Logout failed, but local session cleared');
        },
    });
};

/**
 * Profile Hook
 * Fetches the current user's profile
 */
export const useProfile = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['auth', 'profile'],
        queryFn: async (): Promise<ProfileResponse> => {
            if (USE_MOCK_AUTH) {
                const response = await mockAuthService.getProfile();
                return response;
            }

            // Real API call
            const { data } = await authAxios.get<ProfileResponse>('/users/profile/');
            return data;
        },
        enabled: options?.enabled !== false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Don't retry on 401 errors
    });
};

/**
 * Organization Check Hook
 * Checks if an organization exists for the current user
 */
export const useCheckOrganization = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['auth', 'organization'],
        queryFn: async (): Promise<OrganizationCheckResponse> => {
            if (USE_MOCK_AUTH) {
                const response = await mockAuthService.checkOrganization();
                return response;
            }

            // Real API call
            const { data } = await publicAxios.get<OrganizationCheckResponse>('/organization/check');
            return data;
        },
        enabled: options?.enabled !== false,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Password Reset Hook
 * Handles password reset functionality
 */
export const useResetPassword = () => {
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();

    return useMutation({
        mutationFn: async (data: {
            email: string;
            current_password: string;
            new_password: string;
        }): Promise<void> => {
            if (USE_MOCK_AUTH) {
                await mockAuthService.resetPassword(data);
                return;
            }

            // Real API call
            await authAxios.post('/users/reset-password/', data);
        },
        onSuccess: () => {
            showSuccessNotification('Password reset successfully');
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || 'Failed to reset password';
            showErrorNotification(errorMessage);
        },
    });
};

// ============================================
// EXPORTS
// ============================================

export const authConfig = {
    strategy: AUTH_STRATEGY,
    useMock: USE_MOCK_AUTH,
    isAuthenticated,
};

