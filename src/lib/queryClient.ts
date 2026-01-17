import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: 5 minutes
            staleTime: 5 * 60 * 1000,

            // Garbage collection time (renamed from cacheTime in v5)
            gcTime: 10 * 60 * 1000,

            // Retry failed requests 3 times
            retry: 3,

            // Don't refetch on window focus (can be enabled per query)
            refetchOnWindowFocus: false,

            // Refetch on mount if data is stale
            refetchOnMount: true,

            // Refetch on reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,

            // Garbage collection time for mutations
            gcTime: 5 * 60 * 1000,
        },
    },
});

// Query keys factory for better organization
export const queryKeys = {
    // Parking Slots
    parkingSlots: {
        all: ['parkingSlots'] as const,
        lists: () => [...queryKeys.parkingSlots.all, 'list'] as const,
        list: (filters: any) => [...queryKeys.parkingSlots.lists(), { filters }] as const,
        details: () => [...queryKeys.parkingSlots.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.parkingSlots.details(), id] as const,
    },

    // Vehicles
    vehicles: {
        all: ['vehicles'] as const,
        lists: () => [...queryKeys.vehicles.all, 'list'] as const,
        list: (filters: any) => [...queryKeys.vehicles.lists(), { filters }] as const,
        details: () => [...queryKeys.vehicles.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
    },

    // Bookings
    bookings: {
        all: ['bookings'] as const,
        lists: () => [...queryKeys.bookings.all, 'list'] as const,
        list: (filters: any) => [...queryKeys.bookings.lists(), { filters }] as const,
        details: () => [...queryKeys.bookings.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
        active: () => [...queryKeys.bookings.all, 'active'] as const,
        history: (filters: any) => [...queryKeys.bookings.all, 'history', { filters }] as const,
    },

    // Users
    users: {
        all: ['users'] as const,
        lists: () => [...queryKeys.users.all, 'list'] as const,
        list: (filters: any) => [...queryKeys.users.lists(), { filters }] as const,
        details: () => [...queryKeys.users.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.users.details(), id] as const,
        current: () => [...queryKeys.users.all, 'current'] as const,
    },

    // Payments
    payments: {
        all: ['payments'] as const,
        lists: () => [...queryKeys.payments.all, 'list'] as const,
        list: (filters: any) => [...queryKeys.payments.lists(), { filters }] as const,
        details: () => [...queryKeys.payments.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    },

    // Analytics
    analytics: {
        all: ['analytics'] as const,
        dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
        revenue: (period: string) => [...queryKeys.analytics.all, 'revenue', period] as const,
        occupancy: (period: string) => [...queryKeys.analytics.all, 'occupancy', period] as const,
    },

    // Sensors
    sensors: {
        all: ['sensors'] as const,
        lists: () => [...queryKeys.sensors.all, 'list'] as const,
        list: (filters: any) => [...queryKeys.sensors.lists(), { filters }] as const,
        details: () => [...queryKeys.sensors.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.sensors.details(), id] as const,
    },
};
