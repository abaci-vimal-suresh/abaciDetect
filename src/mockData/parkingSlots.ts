import { ParkingSlot, SlotStatus, SlotType } from '../types/parking';

const zones = ['A', 'B', 'C', 'D'];
const floors = [1, 2, 3];
const slotTypes: SlotType[] = ['regular', 'vip', 'disabled', 'ev-charging'];

export const generateMockParkingSlots = (): ParkingSlot[] => {
    const slots: ParkingSlot[] = [];
    let slotCounter = 1;

    floors.forEach((floor) => {
        zones.forEach((zone) => {
            // 10 slots per zone per floor
            for (let i = 1; i <= 10; i++) {
                const slotNumber = `${zone}${floor}${String(i).padStart(2, '0')}`;

                // Randomly assign slot types
                let type: SlotType = 'regular';
                if (i === 1) type = 'disabled';
                else if (i === 2) type = 'ev-charging';
                else if (i === 10) type = 'vip';

                // Randomly assign status (70% available, 20% occupied, 5% reserved, 5% maintenance)
                const rand = Math.random();
                let status: SlotStatus = 'available';
                if (rand < 0.2) status = 'occupied';
                else if (rand < 0.25) status = 'reserved';
                else if (rand < 0.3) status = 'maintenance';

                slots.push({
                    id: `slot-${slotCounter}`,
                    slotNumber,
                    floor,
                    zone,
                    type,
                    status,
                    vehicleId: status === 'occupied' ? `vehicle-${Math.floor(Math.random() * 50) + 1}` : undefined,
                    bookingId: status === 'reserved' ? `booking-${Math.floor(Math.random() * 20) + 1}` : undefined,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString(),
                });

                slotCounter++;
            }
        });
    });

    return slots;
};

// Initial mock data
export const mockParkingSlots = generateMockParkingSlots();
