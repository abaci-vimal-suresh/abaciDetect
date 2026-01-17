import React, { createContext, FC, ReactNode, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockAuthService } from '../mockAuthService'; // Mock service
import AbaciLoader from '../components/AbaciLoader/AbaciLoader';

const USE_MOCK_AUTH = true; // Set to false when backend is ready

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
  const [organizationExists, setOrganizationExists] = useState<boolean | null>(null);
  const [isCheckingOrganization, setIsCheckingOrganization] = useState<boolean>(true);

  const navigate = useNavigate();
  const location = useLocation();

  const clearAuthData = () => {
    setUser('');
    setUserData(null);
    setOrganizationExists(null);
    setIsCheckingOrganization(false);
  };

  const setLogOut = () => {
    if (USE_MOCK_AUTH) {
      // Mock logout
      mockAuthService.logout()
        .then(() => {
          clearAuthData();
          navigate('/login');
        })
        .catch((err) => {
          console.error('Logout error:', err);
          clearAuthData();
          navigate('/login');
        });
    } else {
      // Real API logout (your existing code)
      // authAxios.post('/users/logout/')...
    }
  };

  // Function to check if organization exists
  const checkOrganizationStatus = async (): Promise<void> => {
    try {
      setIsCheckingOrganization(true);

      let orgExists: boolean;

      if (USE_MOCK_AUTH) {
        const response = await mockAuthService.checkOrganization();
        orgExists = response.organization_exists;
      } else {
        // Real API call (your existing code)
        // const response = await publicAxios.get('/organization/check');
        // orgExists = response.data.organization_exists;
      }

      setOrganizationExists(orgExists);

      // Redirect logic
      if (!orgExists && !location.pathname.includes('/create-organization')) {
        navigate('/create-organization');
      } else if (orgExists && location.pathname.includes('/create-organization')) {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error checking organization status:', error);
      setOrganizationExists(false);
    } finally {
      setIsCheckingOrganization(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async (): Promise<void> => {
    try {
      setIsCheckingOrganization(true);

      if (USE_MOCK_AUTH) {
        const response = await mockAuthService.getProfile();
        setUser(response.email);
        setUserData({ ...response, user_class: 'Envirol' });
      } else {
        // Real API call (your existing code)
        // const response = await authAxios.get('/users/profile/');
        // setUser(response.data.email);
        // setUserData({...response.data, user_class: 'Envirol'});
      }

      setIsCheckingOrganization(false);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      clearAuthData();

      // Redirect to login if unauthorized
      if (!location.pathname.includes('/public') &&
        !location.pathname.includes('/create-organization')) {
        navigate('/login');
      }
    }
  };

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Skip auth check for public routes
      const isPublicRoute =
        location.pathname.includes('/public') ||
        location.pathname === '/login' ||
        location.pathname === '/create-organization';

      if (isPublicRoute) {
        setIsCheckingOrganization(false);
        return;
      }

      // Check if user has active session
      if (USE_MOCK_AUTH) {
        if (mockAuthService.isAuthenticated()) {
          await fetchUserProfile();
        } else {
          setIsCheckingOrganization(false);
          navigate('/login');
        }
      } else {
        // For real API with HttpOnly cookies, just try to fetch profile
        // If it fails (401), user will be redirected to login
        await fetchUserProfile();
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Show loader while checking authentication
  if (isCheckingOrganization) {
    return <AbaciLoader />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthContextProvider.propTypes = {
  // @ts-ignore
  children: PropTypes.node.isRequired,
};

export default AuthContext;