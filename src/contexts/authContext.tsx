import React, { createContext, FC, ReactNode, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile, useLogout, authConfig, autoLoginMock } from '../api/auth.api';
import AbaciLoader from '../components/AbaciLoader/AbaciLoader';

export interface IAuthContextProps {
  user: any;
  setUser?(...args: unknown[]): unknown;
  userData: null | any;
  setUserData: null | any;
  setLogOut: null | any;
  organizationExists: boolean | null;
  isCheckingOrganization: boolean;
  recheckOrganization: () => Promise<void>;
}

const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

interface IAuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider: FC<IAuthContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<string>('');
  const [userData, setUserData] = useState<null | any>(null);
  const [organizationExists, setOrganizationExists] = useState<boolean | null>(true);
  const [isCheckingOrganization, setIsCheckingOrganization] = useState<boolean>(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Determine if current route is public
  const isPublicRoute =
    location.pathname.includes('/public') ||
    location.pathname === '/login' ||
    location.pathname === '/create-organization';

  // Use logout mutation
  const logoutMutation = useLogout();

  // Use profile query (disabled for public routes)
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useProfile({ enabled: !isPublicRoute && authConfig.isAuthenticated() });


  const clearAuthData = () => {
    setUser('');
    setUserData(null);
    setOrganizationExists(true);
    setIsCheckingOrganization(false);
  };

  const setLogOut = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clearAuthData();
        navigate('/login');
      },
      onError: (err) => {
        console.error('Logout error:', err);
        // Clear local state even if logout fails
        clearAuthData();
        navigate('/login');
      },
    });
  };

  // Function to check if organization exists (Dummy implementation)
  const checkOrganizationStatus = async (): Promise<void> => {
    setOrganizationExists(true);
    setIsCheckingOrganization(false);
  };

  // Update user data when profile is fetched
  useEffect(() => {
    if (profileData) {
      setUser(profileData.email);
      setUserData({ ...profileData, user_class: 'Envirol' });
    }
  }, [profileData]);


  // Handle profile fetch errors (redirect to login)
  useEffect(() => {
    if (isProfileError && !isPublicRoute) {
      console.error('Error fetching profile, redirecting to login');
      clearAuthData();
      navigate('/login');
    }
  }, [isProfileError, isPublicRoute, navigate]);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Skip auth check for public routes
      if (isPublicRoute) {
        setIsCheckingOrganization(false);
        return;
      }

      // Auto-login if in mock mode
      autoLoginMock();

      // Check if user is authenticated
      if (!authConfig.isAuthenticated()) {
        setIsCheckingOrganization(false);
        navigate('/login');
        return;
      }

      // Profile will be fetched automatically by useProfile hook
      // Wait for it to complete
      setIsCheckingOrganization(isLoadingProfile);
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update checking status based on query states
  useEffect(() => {
    if (!isPublicRoute) {
      setIsCheckingOrganization(isLoadingProfile);
    }
  }, [isLoadingProfile, isPublicRoute]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      userData,
      setUserData,
      setLogOut,
      organizationExists,
      isCheckingOrganization,
      recheckOrganization: checkOrganizationStatus,
    }),
    [user, userData, organizationExists, isCheckingOrganization],
  );

  // Show loader while checking authentication, but skip for public routes to speed up initial load
  if (isCheckingOrganization && !isPublicRoute) {
    return <AbaciLoader />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthContextProvider.propTypes = {
  // @ts-ignore
  children: PropTypes.node.isRequired,
};

export default AuthContext;