// Vehicle Management - Type Definitions

export type VehicleType = 'car' | 'motorcycle' | 'suv' | 'truck' | 'van';
export type VehicleStatus = 'active' | 'inactive' | 'blocked';

export interface Vehicle {
    id: string;
    licensePlate: string;
    type: VehicleType;
    make: string;
    model: string;
    color: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    status: VehicleStatus;
    registeredAt: string;
    lastParkedAt?: string;
    notes?: string;
}

export interface VehicleFormData {
    licensePlate: string;
    type: VehicleType;
    make: string;
    model: string;
    color: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    notes?: string;
}

export interface VehicleStats {
    totalVehicles: number;
    activeVehicles: number;
    inactiveVehicles: number;
    blockedVehicles: number;
    byType: {
        [key in VehicleType]: number;
    };
}
