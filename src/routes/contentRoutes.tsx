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
const HaloSensorGroupManager = lazy(() => import('../pages/HALO/Sensors/SensorGroupManager'));
const HaloTimeTravel = lazy(() => import('../pages/HALO/TimeTravel/TimeTravelPlayback'));
const AutocadViewer = lazy(() => import('../pages/HALO/Autocad/AutocadViewer'));
const ThreeDPage = lazy(() => import('../pages/HALO/ThreeD/ThreeDPage'));

const HaloSensorMonitoringDashboard = lazy(() => import('../pages/HALO/Sensors/SensorMonitoringDashboard'));

// User Pages
const Profile = lazy(() => import('../pages/Profile/Index'));
const UserListPage = lazy(() => import('../pages/HALO/Users/UserListPage'));
const UserDetailPage = lazy(() => import('../pages/HALO/Users/UserDetailPage'));
const UserGroupsPage = lazy(() => import('../pages/HALO/UserGroups/UserGroupsPage'));


const RootRedirect = () => {
	const { userData } = useContext(AuthContext);
	if (userData?.role?.toLowerCase() === 'admin') {
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
		allowedTo: ['Admin', 'Viewer'],
	},
	// HALO IoT Routes
	{
		path: '/halo/dashboard',
		element: <HaloDashboard />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/sensors/list',
		element: <HaloSensorList />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/sensors/firmware',
		element: <HaloFirmwareUpdate />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/sensors/groups',
		element: <HaloSensorGroupManager />,
		allowedTo: ['Admin', 'Viewer'],
	},
	// Main Areas (top level)
	{
		path: '/halo/sensors/areas',
		element: <HaloSensorMainArea />,
		allowedTo: ['Admin', 'Viewer'],
	},
	// Sub Zones within an area
	{
		path: '/halo/sensors/areas/:areaId/subzones',
		element: <HaloSensorGroups />,
		allowedTo: ['Admin', 'Viewer'],
	},
	// Sensors within a specific sub zone
	{
		path: '/halo/sensors/areas/:areaId/subzones/:subzoneId',
		element: <HaloSensorGroupDetail />,
		allowedTo: ['Admin', 'Viewer'],
	},
	// Individual sensor detail
	{
		path: '/halo/sensors/detail/:id',
		element: <HaloSensorIndividualDetail />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/privacy',
		element: <HaloPrivacySettings />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/alerts',
		element: <Navigate to='/halo/alerts/history' replace />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/alerts/history',
		element: <HaloAlertHistory />,
		allowedTo: ['Admin', 'Viewer'],
	},

	{
		path: '/halo/monitoring',
		element: <HaloSensorMonitoringDashboard />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/reports',
		element: <HaloReports />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/settings',
		element: <HaloSettings />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/timetravel',
		element: <HaloTimeTravel />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/autocad',
		element: <AutocadViewer />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/threed',
		element: <ThreeDPage />,
		allowedTo: ['Admin', 'Viewer'],
	},

	// User Management Routes
	{
		path: '/profile',
		element: <Profile />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/users',
		element: <UserListPage />,
		allowedTo: ['Admin'],
	},
	// {
	// 	path: '/users/create',
	// 	element: <UserCreatePage />,
	// 	allowedTo: ['Admin'],
	// },
	{
		path: '/users/:id',
		element: <UserDetailPage />,
		allowedTo: ['Admin'],
	},
	{
		path: '/user-groups',
		element: <UserGroupsPage />,
		allowedTo: ['Admin'],
	},
	// {
	// 	path: '/users/:id/edit',
	// 	element: <UserEditPage />,
	// 	allowedTo: ['Admin'],
	// },
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