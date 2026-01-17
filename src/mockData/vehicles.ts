// Mock Data Generator for Vehicles

import { Vehicle, VehicleType, VehicleStatus } from '../types/vehicle';

const vehicleTypes: VehicleType[] = ['car', 'motorcycle', 'suv', 'truck', 'van'];
const makes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Tesla', 'Nissan', 'Hyundai', 'Chevrolet'];
const colors = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray', 'Green', 'Yellow'];

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const generateLicensePlate = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let plate = '';
    for (let i = 0; i < 3; i++) {
        plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    plate += '-';
    for (let i = 0; i < 4; i++) {
        plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return plate;
};

export const generateMockVehicles = (count: number = 50): Vehicle[] => {
    const vehicles: Vehicle[] = [];

    for (let i = 1; i <= count; i++) {
        const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const make = makes[Math.floor(Math.random() * makes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        // 90% active, 8% inactive, 2% blocked
        const rand = Math.random();
        let status: VehicleStatus = 'active';
        if (rand < 0.08) status = 'inactive';
        else if (rand < 0.1) status = 'blocked';

        vehicles.push({
            id: `vehicle-${i}`,
            licensePlate: generateLicensePlate(),
            type,
            make,
            model: `Model ${Math.floor(Math.random() * 10) + 1}`,
            color,
            ownerName: `${firstName} ${lastName}`,
            ownerPhone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            ownerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
            status,
            registeredAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastParkedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            notes: Math.random() > 0.8 ? 'Regular customer' : undefined,
        });
    }

    return vehicles;
};

// Initial mock data
export const mockVehicles = generateMockVehicles(50);
