import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicAxios, authAxios } from '../axiosInstance';
import { mockAuthService, __mockSessionManager } from '../mockAuthService';
import useToasterNotification from '../hooks/useToasterNotification';
import Cookies from 'js-cookie';
import { USE_MOCK_DATA } from '../config';

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

const USE_MOCK_AUTH = USE_MOCK_DATA;

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface UserData {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
}

export interface LoginResponse {
    user: UserData;
    message: string;
    token?: string;
    access?: string;
    refresh?: string;
    refresh_token?: string;
}

export interface ProfileResponse {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Store authentication token (only for js-cookie strategy)
 */
/**
 * Store authentication tokens in cookies
 */
const storeToken = (name: 'token' | 'refresh_token', value: string): void => {
    if (AUTH_STRATEGY === 'js-cookie' || true) { // Always store as fallback if returned in body
        Cookies.set(name, value, {
            expires: name === 'refresh_token' ? 7 : 1, // 7 days for refresh, 1 day for access
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

/**
 * Auto-login a mock user when USE_MOCK_DATA is true
 */
export const autoLoginMock = () => {
    if (USE_MOCK_AUTH && !__mockSessionManager.isAuthenticated()) {
        __mockSessionManager.setSession('john_admin');
        console.log('🚀 Auto-logged in as mock user (john_admin)');
    }
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

            // Capture tokens if returned in the response body
            const accessToken = data.access || data.token;
            const refreshToken = data.refresh || data.refresh_token;

            if (accessToken) {
                storeToken('token', accessToken);
            }
            if (refreshToken) {
                storeToken('refresh_token', refreshToken);
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
            const { data } = await authAxios.get<ProfileResponse>('/users/profile/me/');
            return data;
        },
        enabled: options?.enabled !== false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Don't retry on 401 errors
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
