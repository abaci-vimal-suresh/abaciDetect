import React, { lazy, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../contexts/authContext';
import DeviceSettings from '../pages/HALO/Settings/DeviceSettings';

// HALO IoT Pages
const HaloDashboard = lazy(() => import('../pages/HALO/Dashboard/Dashboard'));
const HaloSensorList = lazy(() => import('../pages/HALO/Sensors/SensorList'));
const HaloPrivacySettings = lazy(() => import('../pages/HALO/Privacy/PrivacySettings'));
const HaloAlertHistory = lazy(() => import('../pages/HALO/Alerts/AlertHistory'));
const HaloAlertConfiguration = lazy(() => import('../pages/HALO/Alerts/AlertConfiguration'));
const HaloLiveMonitoring = lazy(() => import('../pages/HALO/Monitoring/LiveMonitoring'));
const HaloReports = lazy(() => import('../pages/HALO/Reports/Reports'));
const HaloFirmwareUpdate = lazy(() => import('../pages/HALO/Sensors/FirmwareUpdate'));
const HaloSensorGroupDetail = lazy(() => import('../pages/HALO/Sensors/SensorGroupDetail'));
const HaloSensorIndividualDetail = lazy(() => import('../pages/HALO/Sensors/SensorIndividualDetail'));
const HaloSettings = lazy(() => import('../pages/HALO/Settings/DeviceSettings'));
const HaloSensorMainArea = lazy(() => import('../pages/HALO/Sensors/SensorMainArea'));
const HaloSensorGroups = lazy(() => import('../pages/HALO/Sensors/SensorGroups'));
const HaloTimeTravel = lazy(() => import('../pages/HALO/TimeTravel/TimeTravelPlayback'));

// User Pages
// User Pages
const Profile = lazy(() => import('../pages/Profile/MyProfile'));
const Users = lazy(() => import('../pages/UserManagement/Manage/UserListView'));

const RootRedirect = () => {
	const { userData } = useContext(AuthContext);
	if (userData?.role === 'Admin') {
		return <Navigate to='/halo/dashboard' replace />;
	}
	return <Navigate to='/profile' replace />;
};

interface CustomRouteConfig {
	path: string;
	element: React.ReactNode;
	allowedTo?: string[];
}

const RouteConfig: CustomRouteConfig[] = [
	{
		path: '/',
		element: <RootRedirect />,
		allowedTo: ['Admin', 'User'],
	},
	// HALO IoT Routes
	{
		path: '/halo/dashboard',
		element: <HaloDashboard />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/sensors/list',
		element: <HaloSensorList />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/sensors/firmware',
		element: <HaloFirmwareUpdate />,
		allowedTo: ['Admin'],
	},
	// Main Areas (top level)
	{
		path: '/halo/sensors/areas',
		element: <HaloSensorMainArea />,
		allowedTo: ['Admin'],
	},
	// Sub Zones within an area
	{
		path: '/halo/sensors/areas/:areaId/subzones',
		element: <HaloSensorGroups />,
		allowedTo: ['Admin'],
	},
	// Sensors within a specific sub zone
	{
		path: '/halo/sensors/areas/:areaId/subzones/:subzoneId',
		element: <HaloSensorGroupDetail />,
		allowedTo: ['Admin'],
	},
	// Individual sensor detail
	{
		path: '/halo/sensors/detail/:id',
		element: <HaloSensorIndividualDetail />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/privacy',
		element: <HaloPrivacySettings />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/alerts/history',
		element: <HaloAlertHistory />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/alerts/config',
		element: <HaloAlertConfiguration />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/monitoring',
		element: <HaloLiveMonitoring />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/reports',
		element: <HaloReports />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/settings',
		element: <HaloSettings />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/timetravel',
		element: <HaloTimeTravel />,
		allowedTo: ['Admin'],
	},

	// User Management Routes
	{
		path: '/profile',
		element: <Profile />,
		allowedTo: ['Admin', 'User'],
	},
	{
		path: '/users',
		element: <Users />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/sensors/settings/:deviceId',
		element: <HaloSettings />,
		allowedTo: ['Admin'],
	},
	{
		path: '/settings',
		element: <DeviceSettings />,
		allowedTo: ['Admin'],
	},
];

export default RouteConfig;