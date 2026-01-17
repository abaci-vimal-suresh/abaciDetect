export const haloMenu = {
    dashboard: {
        id: 'halo-dashboard',
        text: 'Dashboard',
        path: '/halo/dashboard',
        icon: 'Dashboard',
        subMenu: null,
    },
    sensors: {
        id: 'halo-sensors',
        text: 'Sensors',
        path: '/halo/sensors',
        icon: 'Sensors',
        subMenu: {
            list: {
                id: 'sensors-list',
                text: 'All Sensors',
                path: '/halo/sensors/list',
                icon: 'ViewList',
            },
            areas: {
                id: 'sensor-areas',
                text: 'Sensor Areas',
                path: '/halo/sensors/areas',
                icon: 'GroupWork',
            },
            // firmware: {
            //     id: 'sensor-firmware',
            //     text: 'Firmware Update',
            //     path: '/halo/sensors/firmware',
            //     icon: 'SystemUpdate',
            // },
        },
    },
    monitoring: {
        id: 'halo-monitoring',
        text: 'Live Monitoring',
        path: '/halo/monitoring',
        icon: 'LiveTv',
        subMenu: null,
    },
    timetravel: {
        id: 'halo-timetravel',
        text: 'Time Travel',
        path: '/halo/timetravel',
        icon: 'History',
        subMenu: null,
    },
    alerts: {
        id: 'halo-alerts',
        text: 'Alerts',
        path: '/halo/alerts',
        icon: 'NotificationsActive',
        subMenu: {
            history: {
                id: 'halo-alerts-history',
                text: 'History',
                path: '/halo/alerts/history',
                icon: 'History',
            },
            configuration: {
                id: 'halo-alerts-config',
                text: 'Configuration',
                path: '/halo/alerts/config',
                icon: 'Tune',
            },
        },
    },
    reports: {
        id: 'halo-reports',
        text: 'Analytics',
        path: '/halo/reports',
        icon: 'Analytics',
        subMenu: null,
    },
    privacy: {
        id: 'halo-privacy',
        text: 'Privacy Controls',
        path: '/halo/privacy',
        icon: 'Security',
        subMenu: null,
    },
    settings: {
        id: 'halo-settings',
        text: 'Settings',
        path: '/halo/settings',
        icon: 'Settings',
        subMenu: null,
    },
    users: {
        id: 'halo-users',
        text: 'User Management',
        path: '/users',
        icon: 'Person',
        subMenu: {
            list: {
                id: 'users-list',
                text: 'All Users',
                path: '/users',
                icon: 'Person',
            },
            groups: {
                id: 'user-groups',
                text: 'User Groups',
                path: '/user-groups',
                icon: 'Groups',
            },
        },
    },
};

export const userMenu = {
    profile: {
        id: 'profile',
        text: 'Profile',
        path: '/profile',
        icon: 'Person',
    },
    settings: {
        id: 'settings',
        text: 'Settings',
        path: '/halo/settings',
        icon: 'Settings',
    },
};

export const authMenu = {
    login: {
        id: 'login',
        text: 'Login',
        path: '/login',
        icon: 'Login',
    },
    page404: {
        id: 'Page404',
        text: '404 Page',
        path: '/404',
        icon: 'ReportGmailerrorred',
    },
};