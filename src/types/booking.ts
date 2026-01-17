export type BookingStatus = 'active' | 'completed' | 'cancelled' | 'no-show';

export interface Booking {
    id: string;
    vehicleId: string;
    vehiclePlate: string;
    vehicleType: string;
    slotId: string;
    slotNumber: string;
    ownerName: string;
    checkInTime: string;
    checkOutTime?: string;
    status: 'active' | 'completed' | 'cancelled';
    amount?: number;
    createdAt: string;
    updatedAt: string;
    notes?: string;
}

export interface BookingFormData {
    slotId: string;
    vehicleId: string;
    checkInTime: string;
    notes?: string;
}

export interface BookingWithDetails extends Booking {
    slot: {
        slotNumber: string;
        floor: number;
        zone: string;
    };
    vehicle: {
        licensePlate: string;
        type: string;
        ownerName: string;
    };
}

export interface BookingStats {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    averageDuration: number; // in minutes
    todayBookings: number;
}

export interface DurationStats {
    lessThan1Hour: number;
    oneToThreeHours: number;
    threeToSixHours: number;
    moreThanSixHours: number;
}
