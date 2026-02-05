import { Area, Sensor } from '../../../types/sensor';

export const DUMMY_AREAS: Area[] = [
    {
        id: 1,
        name: 'Main Building',
        area_type: 'building',
        sensor_count: 5,
        subareas: [],
        parent_id: null,
    },
    {
        id: 10,
        name: 'Ground Floor',
        area_type: 'floor',
        sensor_count: 2,
        subareas: [],
        parent_id: 1,
        floor_level: 0,
        floor_plan_url: '/floor_tiles.glb',
        color: '#3b82f6',
    },
    {
        id: 11,
        name: 'First Floor',
        area_type: 'floor',
        sensor_count: 2,
        subareas: [],
        parent_id: 1,
        floor_level: 1,
        floor_plan_url: '/floor_tiles.glb',
        color: '#10b981',
    },
    {
        id: 12,
        name: 'Second Floor',
        area_type: 'floor',
        sensor_count: 1,
        subareas: [],
        parent_id: 1,
        floor_level: 2,
        floor_plan_url: '/floor_tiles.glb',
        color: '#f59e0b',
    }
];

export const DUMMY_SENSORS: Sensor[] = [
    // FLOOR 0 - Ground Floor (Busy area, mixed status)
    {
        id: 'S-001',
        name: 'Main Entrance',
        area_id: 10,
        floor_level: 0,
        x_val: 0.15,
        y_val: 0.2, // Near front
        z_val: 0,
        status: 'safe',
        sensor_data: { val: 22, threshold: 50, sensors: { temp_c: 22.5, humidity: 45, co2: 600 } } as any,
        x_min: 0.05, x_max: 0.25, y_min: 0.1, y_max: 0.3, z_min: 0, z_max: 1
    },
    {
        id: 'S-002',
        name: 'Lobby Reception',
        area_id: 10,
        floor_level: 0,
        x_val: 0.5,
        y_val: 0.5, // Center
        z_val: 0,
        status: 'warning',
        sensor_data: { val: 45, threshold: 50, sensors: { temp_c: 24.5, humidity: 48, co2: 950 } } as any,
        x_min: 0.4, x_max: 0.6, y_min: 0.4, y_max: 0.6, z_min: 0, z_max: 1
    },
    {
        id: 'S-003',
        name: 'Cafeteria',
        area_id: 10,
        floor_level: 0,
        x_val: 0.8,
        y_val: 0.2,
        z_val: 0,
        status: 'critical',
        sensor_data: { val: 65, threshold: 50, sensors: { temp_c: 28.0, humidity: 60, co2: 1200 } } as any,
        x_min: 0.7, x_max: 0.9, y_min: 0.1, y_max: 0.3, z_min: 0, z_max: 1
    },
    {
        id: 'S-004',
        name: 'Rear Exit',
        area_id: 10,
        floor_level: 0,
        x_val: 0.5,
        y_val: 0.85,
        z_val: 0,
        status: 'safe',
        sensor_data: { val: 15, threshold: 50, sensors: { temp_c: 21.0, humidity: 40, co2: 400 } } as any,
        x_min: 0.4, x_max: 0.6, y_min: 0.75, y_max: 0.95, z_min: 0, z_max: 1
    },

    // FLOOR 1 - Offices (Structured layout)
    {
        id: 'S-101',
        name: 'Open Office West',
        area_id: 11,
        floor_level: 1,
        x_val: 0.25,
        y_val: 0.3,
        z_val: 1,
        status: 'safe',
        sensor_data: { val: 20, threshold: 50, sensors: { temp_c: 21.5, humidity: 42, co2: 550 } } as any,
        x_min: 0.1, x_max: 0.4, y_min: 0.1, y_max: 0.5, z_min: 0, z_max: 1
    },
    {
        id: 'S-102',
        name: 'Conference Room A',
        area_id: 11,
        floor_level: 1,
        x_val: 0.75,
        y_val: 0.3,
        z_val: 1,
        status: 'critical', // High CO2 in meeting
        sensor_data: { val: 55, threshold: 50, sensors: { temp_c: 26.5, humidity: 55, co2: 1500 } } as any,
        x_min: 0.6, x_max: 0.9, y_min: 0.1, y_max: 0.5, z_min: 0, z_max: 1
    },
    {
        id: 'S-103',
        name: 'Server Room',
        area_id: 11,
        floor_level: 1,
        x_val: 0.25,
        y_val: 0.75,
        z_val: 1,
        status: 'warning', // Getting warm
        sensor_data: { val: 40, threshold: 50, sensors: { temp_c: 25.5, humidity: 30, co2: 400 } } as any,
        x_min: 0.1, x_max: 0.4, y_min: 0.6, y_max: 0.9, z_min: 0, z_max: 1
    },
    {
        id: 'S-104',
        name: 'Executive Office',
        area_id: 11,
        floor_level: 1,
        x_val: 0.75,
        y_val: 0.75,
        z_val: 1,
        status: 'safe',
        sensor_data: { val: 18, threshold: 50, sensors: { temp_c: 22.0, humidity: 45, co2: 450 } } as any,
        x_min: 0.6, x_max: 0.9, y_min: 0.6, y_max: 0.9, z_min: 0, z_max: 1
    },

    // // FLOOR 2 - Penthouse / Small Floor (Centered)
    // {
    //     id: 'S-201',
    //     name: 'Penthouse Control',
    //     area_id: 12,
    //     floor_level: 2,
    //     x_val: 0.5,
    //     y_val: 0.5, // Dead center
    //     z_val: 2,
    //     status: 'warning',
    //     sensor_data: { val: 35, threshold: 50, sensors: { temp_c: 23.5, humidity: 40, co2: 500 } } as any,
    //     x_min: 0.3, x_max: 0.7, y_min: 0.3, y_max: 0.7, z_min: 0, z_max: 1
    // }
];
