import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../contexts/authContext';

interface RouteGuardProps {
    children: React.ReactNode;
    allowedTo?: string[];
}

/**
 * RouteGuard component to restrict access based on user roles.
 * Wraps protected routes and checks if the current user has the required permissions.
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedTo }) => {
    const { userData, isCheckingOrganization } = useContext(AuthContext);
    const location = useLocation();

    // If we're still checking auth, don't redirect yet
    if (isCheckingOrganization) {
        return null; // Or a smaller loader
    }

    // If no user is logged in, redirect to login
    if (!userData) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If roles are specified, check if user has access
    if (allowedTo && allowedTo.length > 0) {
        // We normalize to case-insensitive comparison for robustness, 
        // but prefer 'Admin' and 'Viewer' as standard.
        const userRole = userData.role?.toLowerCase();
        const hasAccess = allowedTo.some(role => role.toLowerCase() === userRole);

        if (!hasAccess) {
            // Redirect to a safe page if unauthorized
            // For now, redirect to profile or a dashboard they *do* have access to
            console.warn(`Unauthorized access attempt to ${location.pathname} by role: ${userData.role}`);
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default RouteGuard;
