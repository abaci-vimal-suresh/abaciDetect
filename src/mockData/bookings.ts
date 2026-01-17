// Mock Data Generator for Bookings

import { Booking } from '../types/booking';
import { mockParkingSlots } from './parkingSlots';
import { mockVehicles } from './vehicles';

export const generateMockBookings = (): Booking[] => {
    const bookings: Booking[] = [];
    let bookingCounter = 1;

    // Get occupied and reserved slots
    const occupiedSlots = mockParkingSlots.filter(slot => slot.status === 'occupied');
    const reservedSlots = mockParkingSlots.filter(slot => slot.status === 'reserved');

    // Create active bookings for occupied slots
    occupiedSlots.forEach((slot) => {
        const vehicle = mockVehicles.find(v => v.id === slot.vehicleId);
        if (vehicle) {
            const checkInTime = new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000);

            bookings.push({
                id: `booking-${bookingCounter}`,
                slotId: slot.id,
                slotNumber: slot.slotNumber,
                vehicleId: vehicle.id,
                vehiclePlate: vehicle.licensePlate,
                vehicleType: vehicle.type,
                ownerName: vehicle.ownerName,
                status: 'active',
                checkInTime: checkInTime.toISOString(),
                amount: Math.floor(Math.random() * 20 + 5),
                createdAt: checkInTime.toISOString(),
                updatedAt: new Date().toISOString(),
            });
            bookingCounter++;
        }
    });

    // Create reserved bookings
    reservedSlots.forEach((slot) => {
        const vehicle = mockVehicles[Math.floor(Math.random() * mockVehicles.length)];
        const createdTime = new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000);

        bookings.push({
            id: `booking-${bookingCounter}`,
            slotId: slot.id,
            slotNumber: slot.slotNumber,
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.licensePlate,
            vehicleType: vehicle.type,
            ownerName: vehicle.ownerName,
            status: 'active',
            checkInTime: new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000).toISOString(),
            createdAt: createdTime.toISOString(),
            updatedAt: new Date().toISOString(),
            notes: 'Pre-booked',
        });
        bookingCounter++;
    });

    // Create completed bookings (last 30 days)
    for (let i = 0; i < 100; i++) {
        const slot = mockParkingSlots[Math.floor(Math.random() * mockParkingSlots.length)];
        const vehicle = mockVehicles[Math.floor(Math.random() * mockVehicles.length)];

        const checkInTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const duration = Math.floor(Math.random() * 480) + 30; // 30 min to 8 hours
        const checkOutTime = new Date(checkInTime.getTime() + duration * 60 * 1000);

        bookings.push({
            id: `booking-${bookingCounter}`,
            slotId: slot.id,
            slotNumber: slot.slotNumber,
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.licensePlate,
            vehicleType: vehicle.type,
            ownerName: vehicle.ownerName,
            status: 'completed',
            checkInTime: checkInTime.toISOString(),
            checkOutTime: checkOutTime.toISOString(),
            amount: Math.floor(duration / 60 * 5), // $5 per hour
            createdAt: checkInTime.toISOString(),
            updatedAt: checkOutTime.toISOString(),
        });
        bookingCounter++;
    }

    // Create some cancelled bookings
    for (let i = 0; i < 10; i++) {
        const slot = mockParkingSlots[Math.floor(Math.random() * mockParkingSlots.length)];
        const vehicle = mockVehicles[Math.floor(Math.random() * mockVehicles.length)];

        const createdTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

        bookings.push({
            id: `booking-${bookingCounter}`,
            slotId: slot.id,
            slotNumber: slot.slotNumber,
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.licensePlate,
            vehicleType: vehicle.type,
            ownerName: vehicle.ownerName,
            status: 'cancelled',
            checkInTime: new Date(createdTime.getTime() + 60 * 60 * 1000).toISOString(),
            createdAt: createdTime.toISOString(),
            updatedAt: new Date(createdTime.getTime() + 30 * 60 * 1000).toISOString(),
            notes: 'Cancelled by user',
        });
        bookingCounter++;
    }

    return bookings;
};

// Initial mock data
export const mockBookings = generateMockBookings();
