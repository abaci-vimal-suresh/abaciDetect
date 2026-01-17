import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import WebsocketProvider from '../../WebsocketWrapper/WebSocket';
import ErrorPage from '../../pages/PublicPages/ErrorPage';
import Login from '../../pages/Auth/Login';
import Registration from '../../pages/Auth/Registration';
import AuthContext from '../../contexts/authContext';
import Unauthorized from '../../pages/PublicPages/Unauthorized';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import RouteConfig from '../../routes/contentRoutes';
import CreateOrganizaton from '../../pages/Auth/CreateOrganization';
import EstablishmentSelfRegistration from '../../pages/PublicPages/EstablishmentSelfRegistration';

const ContentRoutes = () => {
  const { userData, isCheckingOrganization } = useContext(AuthContext);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Public routes don't need to wait for userData
    const isPublicRoute =
      location.pathname.startsWith('/public') ||
      location.pathname === '/login' ||
      location.pathname === '/create-organization';

    if (isPublicRoute || userData !== null) {
      setIsLoading(false);
    }
  }, [userData, location.pathname]);

  // Show loader while checking auth or loading
  if (isLoading || isCheckingOrganization) {
    return <AbaciLoader />;
  }

  // Check if current route is public
  const isPublicRoute =
    location.pathname.startsWith('/public') ||
    location.pathname === '/login' ||
    location.pathname === '/create-organization';

  // Redirect to login if not authenticated and not on public route
  if (!isPublicRoute && (!userData || Object.keys(userData).length === 0)) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if authenticated and trying to access login
  if (location.pathname === '/login' && userData && Object.keys(userData).length > 0) {
    return <Navigate to="/" replace />;
  }


  return (
    <WebsocketProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/create-organization" element={<CreateOrganizaton />} />
        <Route path="/public/activation/:string" element={<Registration />} />
        <Route path="/public/establishment-registration" element={<EstablishmentSelfRegistration />} />
        <Route path="/public/error" element={<ErrorPage />} />

        {/* Protected Routes with Role-Based Access */}
        {RouteConfig.map((page) => {
          // Check if route has role restrictions
          if (page.allowedTo) {
            if (page.allowedTo?.includes(userData?.role)) {
              return (
                <Route
                  path={page.path}
                  element={<ProtectedRoute element={page.element} />}
                  key={page.path}
                />
              );
            }
            // User doesn't have permission
            return (
              <Route
                path={page.path}
                element={<Unauthorized />}
                key={page.path}
              />
            );
          }

          // No role restriction - accessible to all authenticated users
          return (
            <Route
              path={page.path}
              element={<ProtectedRoute element={page.element} />}
              key={page.path}
            />
          );
        })}

        <Route path="*" element={<Navigate to="/public/error" />} />
      </Routes>
    </WebsocketProvider>
  );
};

export default ContentRoutes;