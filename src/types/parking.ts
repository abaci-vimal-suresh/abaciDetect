// Parking Management System - Type Definitions

export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type SlotType = 'regular' | 'vip' | 'disabled' | 'ev-charging';
export type VehicleType = 'car' | 'motorcycle' | 'suv' | 'truck';

export interface ParkingSlot {
	id: string;
	slotNumber: string;
	floor: number;
	zone: string;
	type: SlotType;
	status: SlotStatus;
	vehicleId?: string; // ID of vehicle currently parked (if occupied)
	bookingId?: string; // ID of active booking (if reserved)
	createdAt: string;
	updatedAt: string;
}

export interface ParkingSlotFormData {
	slotNumber: string;
	floor: number;
	zone: string;
	type: SlotType;
	status: SlotStatus;
}

export interface ParkingStats {
	totalSlots: number;
	availableSlots: number;
	occupiedSlots: number;
	reservedSlots: number;
	maintenanceSlots: number;
	occupancyRate: number; // percentage
}

export interface FloorStats {
	floor: number;
	totalSlots: number;
	availableSlots: number;
	occupiedSlots: number;
}

export interface ZoneStats {
	zone: string;
	totalSlots: number;
	availableSlots: number;
	occupiedSlots: number;
}
