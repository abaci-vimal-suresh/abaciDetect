export const parkingMenu = {
    dashboard: {
        id: 'parking-dashboard',
        text: 'Dashboard',
        path: '/parking/dashboard',
        icon: 'Dashboard',
        subMenu: null,
    },
    parkingSlots: {
        id: 'parking-slots',
        text: 'Parking Slots',
        path: '/parking/slots',
        icon: 'LocalParking',
        subMenu: {
            list: {
                id: 'slots-list',
                text: 'All Slots',
                path: '/parking/slots/list',
                icon: 'ViewList',
            },
            add: {
                id: 'slots-add',
                text: 'Add Slot',
                path: '/parking/slots/add',
                icon: 'AddCircle',
            },
        },
    },
    vehicles: {
        id: 'vehicles',
        text: 'Vehicles',
        path: '/parking/vehicles',
        icon: 'DirectionsCar',
        subMenu: {
            list: {
                id: 'vehicles-list',
                text: 'All Vehicles',
                path: '/parking/vehicles/list',
                icon: 'ViewList',
            },
            register: {
                id: 'vehicles-register',
                text: 'Register Vehicle',
                path: '/parking/vehicles/register',
                icon: 'AddCircle',
            },
        },
    },
    bookings: {
        id: 'bookings',
        text: 'Bookings',
        path: '/parking/bookings',
        icon: 'EventNote',
        subMenu: {
            active: {
                id: 'bookings-active',
                text: 'Active Bookings',
                path: '/parking/bookings/active',
                icon: 'CheckCircle',
            },
            history: {
                id: 'bookings-history',
                text: 'Booking History',
                path: '/parking/bookings/history',
                icon: 'History',
            },
            create: {
                id: 'bookings-create',
                text: 'New Booking',
                path: '/parking/bookings/create',
                icon: 'AddCircle',
            },
        },
    },
    reports: {
        id: 'reports',
        text: 'Reports',
        path: '/parking/reports',
        icon: 'Assessment',
        subMenu: {
            occupancy: {
                id: 'reports-occupancy',
                text: 'Occupancy Report',
                path: '/parking/reports/occupancy',
                icon: 'PieChart',
            },
            usage: {
                id: 'reports-usage',
                text: 'Usage Statistics',
                path: '/parking/reports/usage',
                icon: 'BarChart',
            },
        },
    },
    settings: {
        id: 'settings',
        text: 'Settings',
        path: '/parking/settings',
        icon: 'Settings',
        subMenu: null,
    },
};

// User menu (keep from original)
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
        path: '/settings',
        icon: 'Settings',
    },
};

// Auth pages (keep from original)
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
