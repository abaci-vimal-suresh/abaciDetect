import React, { lazy, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../contexts/authContext';
import DeviceSettings from '../pages/settings/DeviceSettings';
// HALO IoT Pages
const HaloDashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const HaloSensorList = lazy(() => import('../pages/Sensors/SensorList'));
const HaloAlertHistory = lazy(() => import('../pages/Alerts/AlertHistory'));
const HaloAlertFilter = lazy(() => import('../pages/Alerts/AlertFilterPage'));
const HaloAlertActions = lazy(() => import('../pages/Alerts/AlertActionPage'));
const HaloAlertFlow = lazy(() => import('../pages/Alerts/AlertFlowPage'));
const HaloAlertFilterGroups = lazy(() => import('../pages/Alerts/AlertFilterGroupPage'));
const HaloFirmwareUpdate = lazy(() => import('../pages/Sensors/FirmwareUpdate'));
const HaloSensorIndividualDetail = lazy(() => import('../pages/Sensors/SensorIndividualDetail'));
const HaloSettings = lazy(() => import('../pages/settings/DeviceSettings'));
const HaloAreaMain = lazy(() => import('../pages/Area/AreaMain'));
const HaloAreaZoneView = lazy(() => import('../pages/Area/AreaZoneView'));
const HaloSensorGroupManager = lazy(() => import('../pages/Sensors/SensorGroupManager'));
const ThreeDPage = lazy(() => import('../pages/ThreeD_old/ThreeDPage'));
const HaloSystemSettings = lazy(() => import('../pages/settings/HaloSettings'));
const HaloSensorMonitoringDashboard = lazy(() => import('../pages/Sensors/SensorMonitoringDashboard'));
const DigitalTwinPage = lazy(() => import('../pages/IoTVisualizer/DigitalTwinPage'));
// User Pages
const Profile = lazy(() => import('../pages/Profile/Index'));
const UserListPage = lazy(() => import('../pages/Users/UserListPage'));
const UserDetailPage = lazy(() => import('../pages/Users/UserDetailPage'));
const UserGroupsPage = lazy(() => import('../pages/UserGroups/UserGroupsPage'));

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
		element: <HaloAreaMain />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/sensors/areas/:areaId/subzones',
		element: <HaloAreaZoneView />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/sensors/areas/:areaId/subzones/:subzoneId',
		element: <HaloAreaZoneView />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/sensors/detail/:id',
		element: <HaloSensorIndividualDetail />,
		allowedTo: ['Admin', 'Viewer'],
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
		path: '/halo/alerts/filter',
		element: <HaloAlertFilter />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/alerts/actions',
		element: <HaloAlertActions />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/alerts/flow',
		element: <HaloAlertFlow />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/alerts/groups',
		element: <HaloAlertFilterGroups />,
		allowedTo: ['Admin', 'Viewer'],
	},


	{
		path: '/halo/monitoring',
		element: <HaloSensorMonitoringDashboard />,
		allowedTo: ['Admin', 'Viewer'],
	},

	{
		path: '/halo/settings',
		element: <HaloSettings />,
		allowedTo: ['Admin'],
	},
	{
		path: '/halo/threed',
		element: <ThreeDPage />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/site-overview',
		element: <DigitalTwinPage />,
		allowedTo: ['Admin', 'Viewer'],
	},
	{
		path: '/halo/sensors/areas/:areaId/3d',
		element: <ThreeDPage />,
		allowedTo: ['Admin', 'Viewer'],
	},

	{
		path: '/halo/system-settings',
		element: <HaloSystemSettings />,
		allowedTo: ['Admin'],
	},

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