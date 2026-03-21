// src/pages/halo/Dummy/dummyData.ts

import { AreaNode, AreaWall, SensorNode, SensorLatestLog, HaloEventConfig } from '../IoTVisualizer/Types/types';

// ─────────────────────────────────────────────────────────────────────────────
// HALO EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export const HALO_EVENTS = [
    'Aggression', 'Alert', 'AQI', 'CO', 'CO2cal',
    'Gunshot', 'Health_Index', 'Help', 'Humidity', 'Light',
    'Masking', 'Motion', 'NH3', 'NO2', 'Panic',
    'PM1', 'PM10', 'PM2.5', 'Pressure', 'Smoking',
    'Sound', 'Tamper', 'temp_c', 'Temp_F', 'THC',
    'TVOC', 'Vape',
] as const;

export type HaloEventId = typeof HALO_EVENTS[number];

// ─────────────────────────────────────────────────────────────────────────────
// LED COLOR CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LED = {
    green: 0x00ff00,
    red: 0xff0000,
    orange: 0xff8800,
    yellow: 0xffff00,
    blue: 0x0088ff,
    cyan: 0x00ffff,
    purple: 0x8800ff,
    white: 0xffffff,
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR GENERATOR
// Generates N floor nodes with correct offset_z stacking
// ─────────────────────────────────────────────────────────────────────────────

function generateFloors(
    buildingId: number,
    startFloorId: number,
    count: number,
    width: number,
    depth: number,
    height: number,
    areaNames?: string[],   // optional sub-area names for ground floor
): AreaNode[] {
    return Array.from({ length: count }, (_, i) => {
        const isGround = i === 0;
        const isRoof = i === count - 1;
        const floorName = isGround ? 'Ground Floor'
            : isRoof ? 'Roof Level'
                : `Floor ${i + 1}`;

        const children: AreaNode[] = isGround && areaNames
            ? areaNames.map((name, ai) => ({
                id: startFloorId + 1000 + ai,
                name,
                area_type: 'Area' as const,
                parent: startFloorId + i,
                status: 'Active' as const,
                capacity: Math.floor((width * depth * 0.4) / areaNames.length),
                offset_x: 0,
                offset_y: 0,
                offset_z: 0,
                floor_level: null,
                floor_width: null,
                floor_depth: null,
                floor_height: null,
                area_plan: null,
                children: [],
            }))
            : [];

        return {
            id: startFloorId + i,
            name: floorName,
            area_type: 'Floor' as const,
            parent: buildingId,
            status: 'Active' as const,
            capacity: Math.floor(width * depth * 0.4),
            offset_x: 0,
            offset_y: 0,
            offset_z: i * height,
            floor_level: i + 1,
            floor_width: width,
            floor_depth: depth,
            floor_height: height,
            area_plan: null,
            children,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// AREA TREE
// ─────────────────────────────────────────────────────────────────────────────

// North Block floors (2 floors, manual — keep existing IDs)
const northBlockFloors: AreaNode[] = [
    {
        id: 10,
        name: 'Ground Floor',
        area_type: 'Floor',
        parent: 2,
        status: 'Active',
        capacity: 100,
        offset_x: 0, offset_y: 0, offset_z: 0,
        floor_level: 1,
        floor_width: 30,
        floor_depth: 20,
        floor_height: 3.5,
        area_plan: null,
        children: [
            {
                id: 100,
                name: 'Reception',
                area_type: 'Area',
                parent: 10,
                status: 'Active',
                capacity: 20,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
            {
                id: 101,
                name: 'Lobby',
                area_type: 'Area',
                parent: 10,
                status: 'Active',
                capacity: 40,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
            {
                id: 102,
                name: 'Security Desk',
                area_type: 'Area',
                parent: 10,
                status: 'Active',
                capacity: 5,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
        ],
    },
    {
        id: 11,
        name: 'First Floor',
        area_type: 'Floor',
        parent: 2,
        status: 'Active',
        capacity: 150,
        offset_x: 0, offset_y: 0, offset_z: 3.5,
        floor_level: 2,
        floor_width: 30,
        floor_depth: 20,
        floor_height: 3.5,
        area_plan: null,
        children: [
            {
                id: 110,
                name: 'Open Office',
                area_type: 'Area',
                parent: 11,
                status: 'Active',
                capacity: 80,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
            {
                id: 111,
                name: 'Conference Room A',
                area_type: 'Area',
                parent: 11,
                status: 'Active',
                capacity: 20,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
            {
                id: 112,
                name: 'Server Room',
                area_type: 'Area',
                parent: 11,
                status: 'Active',
                capacity: 5,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
        ],
    },
];

// South Block floors (1 floor, manual — keep existing IDs)
const southBlockFloors: AreaNode[] = [
    {
        id: 20,
        name: 'Ground Floor',
        area_type: 'Floor',
        parent: 3,
        status: 'Active',
        capacity: 80,
        offset_x: 0, offset_y: 0, offset_z: 0,
        floor_level: 1,
        floor_width: 25,
        floor_depth: 18,
        floor_height: 3.0,
        area_plan: null,
        children: [
            {
                id: 200,
                name: 'Canteen',
                area_type: 'Area',
                parent: 20,
                status: 'Active',
                capacity: 50,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
            {
                id: 201,
                name: 'Storage',
                area_type: 'Area',
                parent: 20,
                status: 'Active',
                capacity: 10,
                offset_x: 0, offset_y: 0, offset_z: 0,
                floor_level: null, floor_width: null,
                floor_depth: null, floor_height: null,
                area_plan: null, children: [],
            },
        ],
    },
];

// Tower Block — 30 floors generated
// IDs: building=4, floors start at 300 (300–329)
// Ground floor sub-areas start at 301000
const towerFloors = generateFloors(
    4,      // buildingId
    300,    // startFloorId — floors will be 300,301,...329
    30,     // count
    40,     // floor_width  (metres)
    35,     // floor_depth  (metres)
    3.8,    // floor_height (metres) — slightly taller than other buildings
    // Ground floor area names
    ['Main Lobby', 'Reception', 'Security Hub', 'Retail A', 'Retail B'],
);

export const HALO_DUMMY_TREE: AreaNode = {
    id: 1,
    name: 'HQ Campus',
    area_type: 'Site',
    parent: null,
    status: 'Active',
    capacity: 5000,
    is_default_top_area: true,
    offset_x: 0, offset_y: 0, offset_z: 0,
    floor_level: null, floor_width: null,
    floor_depth: null, floor_height: null,
    area_plan: null,
    children: [
        // ── North Block ───────────────────────────────────────────────────────
        {
            id: 2,
            name: 'North Block',
            area_type: 'Building',
            parent: 1,
            status: 'Active',
            capacity: 300,
            offset_x: 0, offset_y: 0, offset_z: 0,
            floor_level: null, floor_width: null,
            floor_depth: null, floor_height: null,
            area_plan: null,
            children: northBlockFloors,
        },

        // ── South Block ───────────────────────────────────────────────────────
        {
            id: 3,
            name: 'South Block',
            area_type: 'Building',
            parent: 1,
            status: 'Active',
            capacity: 200,
            offset_x: 40, offset_y: 0, offset_z: 0,
            floor_level: null, floor_width: null,
            floor_depth: null, floor_height: null,
            area_plan: null,
            children: southBlockFloors,
        },

        // ── Tower Block — 30 floors ───────────────────────────────────────────
        {
            id: 4,
            name: 'Tower Block',
            area_type: 'Building',
            parent: 1,
            status: 'Active',
            capacity: 3000,
            offset_x: 80,  // placed to the right of South Block
            offset_y: 0,
            offset_z: 0,
            floor_level: null, floor_width: null,
            floor_depth: null, floor_height: null,
            area_plan: null,
            children: towerFloors,
        },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// WALLS
// ─────────────────────────────────────────────────────────────────────────────

// Helper — generate outer boundary walls for any rectangular floor
function generateOuterWalls(
    floorId: number,
    height: number,
    color: string,
): AreaWall[] {
    return [
        {
            id: `w-${floorId}-n`,
            area_id: floorId,
            r_x1: 0.05, r_y1: 0.05,
            r_x2: 0.95, r_y2: 0.05,
            r_height: height, r_z_offset: 0,
            thickness: 0.2,
            wall_type: 'outer',
            color, opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: `w-${floorId}-s`,
            area_id: floorId,
            r_x1: 0.05, r_y1: 0.95,
            r_x2: 0.95, r_y2: 0.95,
            r_height: height, r_z_offset: 0,
            thickness: 0.2,
            wall_type: 'outer',
            color, opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: `w-${floorId}-w`,
            area_id: floorId,
            r_x1: 0.05, r_y1: 0.05,
            r_x2: 0.05, r_y2: 0.95,
            r_height: height, r_z_offset: 0,
            thickness: 0.2,
            wall_type: 'outer',
            color, opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: `w-${floorId}-e`,
            area_id: floorId,
            r_x1: 0.95, r_y1: 0.05,
            r_x2: 0.95, r_y2: 0.95,
            r_height: height, r_z_offset: 0,
            thickness: 0.2,
            wall_type: 'outer',
            color, opacity: 0.85,
            wall_shape: 'straight',
        },
    ];
}

export const DUMMY_WALLS: Record<number, AreaWall[]> = {

    // ── North Block Ground Floor (id: 10) ─────────────────────────────────────
    10: [
        ...generateOuterWalls(10, 3.5, '#4a90d9'),
        // Reception partition
        {
            id: 'w-10-p1', area_id: 10, sub_area_id: 100,
            r_x1: 0.38, r_y1: 0.05,
            r_x2: 0.38, r_y2: 0.65,
            r_height: 3.5, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#7b68ee', opacity: 0.75,
            wall_shape: 'straight',
        },
        // Security desk partition
        {
            id: 'w-10-p2', area_id: 10, sub_area_id: 102,
            r_x1: 0.70, r_y1: 0.60,
            r_x2: 0.95, r_y2: 0.60,
            r_height: 2.0, r_z_offset: 0,
            thickness: 0.10,
            wall_type: 'partition',
            color: '#48cae4', opacity: 0.65,
            wall_shape: 'straight',
        },
        {
            id: 'w-10-p3', area_id: 10, sub_area_id: 102,
            r_x1: 0.70, r_y1: 0.60,
            r_x2: 0.70, r_y2: 0.95,
            r_height: 2.0, r_z_offset: 0,
            thickness: 0.10,
            wall_type: 'partition',
            color: '#48cae4', opacity: 0.65,
            wall_shape: 'straight',
        },
        // Glass facade
        {
            id: 'w-10-glass', area_id: 10,
            r_x1: 0.38, r_y1: 0.65,
            r_x2: 0.62, r_y2: 0.65,
            r_height: 2.8, r_z_offset: 0,
            thickness: 0.06,
            wall_type: 'glass',
            color: '#90c8e0', opacity: 0.35,
            wall_shape: 'straight',
        },
    ],

    // ── North Block First Floor (id: 11) ──────────────────────────────────────
    11: [
        ...generateOuterWalls(11, 3.5, '#48cae4'),
        // Conference Room A
        {
            id: 'w-11-conf-s', area_id: 11, sub_area_id: 111,
            r_x1: 0.60, r_y1: 0.05,
            r_x2: 0.60, r_y2: 0.45,
            r_height: 3.5, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#7b68ee', opacity: 0.8,
            wall_shape: 'straight',
        },
        {
            id: 'w-11-conf-e', area_id: 11, sub_area_id: 111,
            r_x1: 0.60, r_y1: 0.45,
            r_x2: 0.95, r_y2: 0.45,
            r_height: 3.5, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'glass',
            color: '#90c8e0', opacity: 0.4,
            wall_shape: 'straight',
        },
        // Server Room
        {
            id: 'w-11-srv-n', area_id: 11, sub_area_id: 112,
            r_x1: 0.72, r_y1: 0.68,
            r_x2: 0.95, r_y2: 0.68,
            r_height: 3.5, r_z_offset: 0,
            thickness: 0.15,
            wall_type: 'outer',
            color: '#f4a261', opacity: 0.9,
            wall_shape: 'straight',
        },
        {
            id: 'w-11-srv-w', area_id: 11, sub_area_id: 112,
            r_x1: 0.72, r_y1: 0.68,
            r_x2: 0.72, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0,
            thickness: 0.15,
            wall_type: 'outer',
            color: '#f4a261', opacity: 0.9,
            wall_shape: 'straight',
        },
    ],

    // ── South Block Ground Floor (id: 20) ─────────────────────────────────────
    20: [
        ...generateOuterWalls(20, 3.0, '#52b788'),
        // Canteen divider
        {
            id: 'w-20-canteen', area_id: 20, sub_area_id: 200,
            r_x1: 0.05, r_y1: 0.55,
            r_x2: 0.70, r_y2: 0.55,
            r_height: 3.0, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#52b788', opacity: 0.7,
            wall_shape: 'straight',
        },
        // Storage
        {
            id: 'w-20-stor-n', area_id: 20, sub_area_id: 201,
            r_x1: 0.70, r_y1: 0.55,
            r_x2: 0.95, r_y2: 0.55,
            r_height: 3.0, r_z_offset: 0,
            thickness: 0.15,
            wall_type: 'outer',
            color: '#f4a261', opacity: 0.88,
            wall_shape: 'straight',
        },
        {
            id: 'w-20-stor-w', area_id: 20, sub_area_id: 201,
            r_x1: 0.70, r_y1: 0.55,
            r_x2: 0.70, r_y2: 0.95,
            r_height: 3.0, r_z_offset: 0,
            thickness: 0.15,
            wall_type: 'outer',
            color: '#f4a261', opacity: 0.88,
            wall_shape: 'straight',
        },
    ],

    // ── Tower Ground Floor (id: 300) ──────────────────────────────────────────
    300: [
        ...generateOuterWalls(300, 3.8, '#7a3a6f'),
        // Main lobby open area — central glass divider
        {
            id: 'w-300-glass-1', area_id: 300,
            r_x1: 0.35, r_y1: 0.10,
            r_x2: 0.35, r_y2: 0.90,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.06,
            wall_type: 'glass',
            color: '#90c8e0', opacity: 0.3,
            wall_shape: 'straight',
        },
        // Retail A box
        {
            id: 'w-300-retail-a-n', area_id: 300,
            r_x1: 0.60, r_y1: 0.10,
            r_x2: 0.95, r_y2: 0.10,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#a87ca1', opacity: 0.75,
            wall_shape: 'straight',
        },
        {
            id: 'w-300-retail-a-s', area_id: 300,
            r_x1: 0.60, r_y1: 0.45,
            r_x2: 0.95, r_y2: 0.45,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#a87ca1', opacity: 0.75,
            wall_shape: 'straight',
        },
        {
            id: 'w-300-retail-a-w', area_id: 300,
            r_x1: 0.60, r_y1: 0.10,
            r_x2: 0.60, r_y2: 0.45,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#a87ca1', opacity: 0.75,
            wall_shape: 'straight',
        },
        // Retail B box
        {
            id: 'w-300-retail-b-n', area_id: 300,
            r_x1: 0.60, r_y1: 0.55,
            r_x2: 0.95, r_y2: 0.55,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#a87ca1', opacity: 0.75,
            wall_shape: 'straight',
        },
        {
            id: 'w-300-retail-b-s', area_id: 300,
            r_x1: 0.60, r_y1: 0.90,
            r_x2: 0.95, r_y2: 0.90,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#a87ca1', opacity: 0.75,
            wall_shape: 'straight',
        },
        {
            id: 'w-300-retail-b-w', area_id: 300,
            r_x1: 0.60, r_y1: 0.55,
            r_x2: 0.60, r_y2: 0.90,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.12,
            wall_type: 'partition',
            color: '#a87ca1', opacity: 0.75,
            wall_shape: 'straight',
        },
    ],

    // ── Tower Floor 5 (id: 304) ───────────────────────────────────────────────
    304: [
        ...generateOuterWalls(304, 3.8, '#7a3a6f'),
        // Open plan office with meeting pods
        {
            id: 'w-304-pod1', area_id: 304,
            r_x1: 0.10, r_y1: 0.10,
            r_x2: 0.35, r_y2: 0.10,
            r_height: 2.4, r_z_offset: 0,
            thickness: 0.10,
            wall_type: 'glass',
            color: '#90c8e0', opacity: 0.4,
            wall_shape: 'straight',
        },
        {
            id: 'w-304-pod1b', area_id: 304,
            r_x1: 0.10, r_y1: 0.10,
            r_x2: 0.10, r_y2: 0.35,
            r_height: 2.4, r_z_offset: 0,
            thickness: 0.10,
            wall_type: 'glass',
            color: '#90c8e0', opacity: 0.4,
            wall_shape: 'straight',
        },
        {
            id: 'w-304-pod1c', area_id: 304,
            r_x1: 0.10, r_y1: 0.35,
            r_x2: 0.35, r_y2: 0.35,
            r_height: 2.4, r_z_offset: 0,
            thickness: 0.10,
            wall_type: 'glass',
            color: '#90c8e0', opacity: 0.4,
            wall_shape: 'straight',
        },
        {
            id: 'w-304-pod1d', area_id: 304,
            r_x1: 0.35, r_y1: 0.10,
            r_x2: 0.35, r_y2: 0.35,
            r_height: 2.4, r_z_offset: 0,
            thickness: 0.10,
            wall_type: 'glass',
            color: '#90c8e0', opacity: 0.4,
            wall_shape: 'straight',
        },
    ],

    // ── Tower Floor 10 (id: 309) ──────────────────────────────────────────────
    309: [
        ...generateOuterWalls(309, 3.8, '#7a3a6f'),
        // Executive floor — large partition
        {
            id: 'w-309-exec', area_id: 309,
            r_x1: 0.50, r_y1: 0.05,
            r_x2: 0.50, r_y2: 0.95,
            r_height: 3.8, r_z_offset: 0,
            thickness: 0.15,
            wall_type: 'partition',
            color: '#7a3a6f', opacity: 0.8,
            wall_shape: 'straight',
        },
    ],

    // ── Tower Floor 20 (id: 319) ──────────────────────────────────────────────
    319: [
        ...generateOuterWalls(319, 3.8, '#7a3a6f'),
    ],

    // ── Tower Floor 30 / Roof (id: 329) ──────────────────────────────────────
    329: [
        ...generateOuterWalls(329, 1.2, '#7a3a6f'),
        // Roof parapet — thicker walls, shorter
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SENSORS
// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_SENSORS: SensorNode[] = [

    // ── North Block Ground Floor (floor_id: 10) ───────────────────────────────

    {
        id: 1,
        name: 'HALO-GF-01',
        mac_address: 'AA:BB:CC:DD:EE:01',
        ip_address: '192.168.1.101',
        online_status: true,
        sensor_status: 'online',
        floor_id: 10,
        area_id: 100,
        wall_ids: ['w-10-p1', 'w-10-glass'],
        x_val: 0.22,
        y_val: 0.35,
        z_val: 0.85,
        halo_color: '#06d6a0',
        halo_radius: 5,
        halo_intensity: 0.4,
        event_configs: [
            {
                id: 101, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: 12, is_triggered: false,
            },
            {
                id: 102, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange,
                current_value: 22.4, is_triggered: false,
            },
            {
                id: 103, event_id: 'Humidity', enabled: true,
                min_value: 20, threshold: 75, max_value: 100,
                led_color: LED.cyan,
                current_value: 48.2, is_triggered: false,
            },
            {
                id: 104, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple,
                current_value: 612, is_triggered: false,
            },
            {
                id: 105, event_id: 'AQI', enabled: true,
                min_value: 0, threshold: 100, max_value: 500,
                led_color: LED.green,
                current_value: 34, is_triggered: false,
            },
            {
                id: 106, event_id: 'Sound', enabled: true,
                min_value: 0, threshold: 85, max_value: 130,
                led_color: LED.yellow,
                current_value: 42, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 45000).toISOString(),
            readings_environmental: {
                temperature_c: 22.4,
                humidity_percent: 48.2,
                light_lux: 380,
                pressure_hpa: 1013.2,
                sound_db: 42,
            },
            readings_air: {
                co2_eq: 612, co2_cal: 598,
                tvoc: 125, co: 0.8,
                nh3: 0.2, no2: 18,
                pm1: 4, pm25: 7, pm10: 12,
            },
            readings_derived: {
                aqi: 34,
                health_index: 4.2,
                noise_db: 42,
                motion: 12,
                gunshot: 0,
                aggression: 0,
                movement: 5,
            },
            others: { help: 0, panic: 0 },
        },
    },

    {
        id: 2,
        name: 'HALO-GF-02',
        mac_address: 'AA:BB:CC:DD:EE:02',
        ip_address: '192.168.1.102',
        online_status: true,
        sensor_status: 'alert',
        floor_id: 10,
        area_id: 101,
        wall_ids: ['w-10-p2', 'w-10-p3', 'w-10-n', 'w-10-e'],
        x_val: 0.72,
        y_val: 0.30,
        z_val: 0.85,
        halo_color: '#e63946',
        halo_radius: 6,
        halo_intensity: 1.0,
        event_configs: [
            {
                id: 201, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.red,
                current_value: 88, is_triggered: true,
            },
            {
                id: 202, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple,
                current_value: 1340, is_triggered: true,
            },
            {
                id: 203, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange,
                current_value: 28.1, is_triggered: false,
            },
            {
                id: 204, event_id: 'Aggression', enabled: true,
                min_value: 0, threshold: 70, max_value: 100,
                led_color: LED.red,
                current_value: 15, is_triggered: false,
            },
            {
                id: 205, event_id: 'Gunshot', enabled: true,
                min_value: 0, threshold: 80, max_value: 100,
                led_color: LED.red,
                current_value: 0, is_triggered: false,
            },
            {
                id: 206, event_id: 'AQI', enabled: true,
                min_value: 0, threshold: 100, max_value: 500,
                led_color: LED.orange,
                current_value: 118, is_triggered: true,
            },
            {
                id: 207, event_id: 'TVOC', enabled: true,
                min_value: 0, threshold: 500, max_value: 1000,
                led_color: LED.purple,
                current_value: 342, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 15000).toISOString(),
            readings_environmental: {
                temperature_c: 28.1,
                humidity_percent: 62.5,
                light_lux: 510,
                pressure_hpa: 1012.8,
                sound_db: 71,
            },
            readings_air: {
                co2_eq: 1340, co2_cal: 1298,
                tvoc: 342, co: 2.1,
                nh3: 0.8, no2: 32,
                pm1: 18, pm25: 28, pm10: 45,
            },
            readings_derived: {
                aqi: 118,
                health_index: 2.8,
                noise_db: 71,
                motion: 88,
                gunshot: 0,
                aggression: 15,
                movement: 72,
            },
            others: { help: 0, panic: 0 },
        },
    },
    {
        id: 3,
        name: 'HALO-FF-01',
        mac_address: 'AA:BB:CC:DD:EE:03',
        ip_address: '192.168.1.103',
        online_status: true,
        sensor_status: 'online',
        floor_id: 11,
        area_id: 110,
        wall_ids: ['w-11-n', 'w-11-w', 'w-11-conf-s'],
        x_val: 0.30,
        y_val: 0.55,
        z_val: 0.80,
        halo_color: '#06d6a0',
        halo_radius: 7,
        halo_intensity: 0.35,
        event_configs: [
            {
                id: 301, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: 35, is_triggered: false,
            },
            {
                id: 302, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange,
                current_value: 23.8, is_triggered: false,
            },
            {
                id: 303, event_id: 'Humidity', enabled: true,
                min_value: 20, threshold: 75, max_value: 100,
                led_color: LED.cyan,
                current_value: 51.0, is_triggered: false,
            },
            {
                id: 304, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple,
                current_value: 820, is_triggered: false,
            },
            {
                id: 305, event_id: 'Light', enabled: true,
                min_value: 0, threshold: 1000, max_value: 2000,
                led_color: LED.yellow,
                current_value: 640, is_triggered: false,
            },
            {
                id: 306, event_id: 'Health_Index', enabled: true,
                min_value: 0, threshold: 2, max_value: 5,
                led_color: LED.green,
                current_value: 3.9, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 60000).toISOString(),
            readings_environmental: {
                temperature_c: 23.8,
                humidity_percent: 51.0,
                light_lux: 640,
                pressure_hpa: 1013.5,
                sound_db: 38,
            },
            readings_air: {
                co2_eq: 820, co2_cal: 805,
                tvoc: 98, co: 0.5,
                nh3: 0.1, no2: 14,
                pm1: 3, pm25: 5, pm10: 8,
            },
            readings_derived: {
                aqi: 28,
                health_index: 3.9,
                noise_db: 38,
                motion: 35,
                gunshot: 0,
                aggression: 0,
                movement: 20,
            },
            others: { help: 0, panic: 0 },
        },
    },

    {
        id: 4,
        name: 'HALO-FF-02',
        mac_address: 'AA:BB:CC:DD:EE:04',
        ip_address: '192.168.1.104',
        online_status: true,
        sensor_status: 'alert',
        floor_id: 11,
        area_id: 112,
        wall_ids: ['w-11-srv-n', 'w-11-srv-w'],
        x_val: 0.83,
        y_val: 0.82,
        z_val: 0.90,
        halo_color: '#e63946',
        halo_radius: 4,
        halo_intensity: 0.9,
        event_configs: [
            {
                id: 401, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 30, max_value: 60,
                led_color: LED.red,
                current_value: 38.2, is_triggered: true,
            },
            {
                id: 402, event_id: 'Humidity', enabled: true,
                min_value: 20, threshold: 65, max_value: 100,
                led_color: LED.cyan,
                current_value: 28.4, is_triggered: false,
            },
            {
                id: 403, event_id: 'CO', enabled: true,
                min_value: 0, threshold: 9, max_value: 50,
                led_color: LED.red,
                current_value: 1.2, is_triggered: false,
            },
            {
                id: 404, event_id: 'Tamper', enabled: true,
                min_value: 0, threshold: 1, max_value: 1,
                led_color: LED.orange,
                current_value: 0, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 30000).toISOString(),
            readings_environmental: {
                temperature_c: 38.2,
                humidity_percent: 28.4,
                light_lux: 120,
                pressure_hpa: 1014.0,
                sound_db: 55,
            },
            readings_air: {
                co2_eq: 480, co2_cal: 465,
                tvoc: 55, co: 1.2,
                nh3: 0.0, no2: 8,
                pm1: 2, pm25: 3, pm10: 5,
            },
            readings_derived: {
                aqi: 22,
                health_index: 3.1,
                noise_db: 55,
                motion: 5,
                gunshot: 0,
                aggression: 0,
                movement: 2,
            },
            others: { help: 0, panic: 0 },
        },
    },

    // ── South Block Ground Floor (floor_id: 20) ───────────────────────────────

    {
        id: 5,
        name: 'HALO-SB-01',
        mac_address: 'AA:BB:CC:DD:EE:05',
        ip_address: '192.168.1.201',
        online_status: false,
        sensor_status: 'offline',
        floor_id: 20,
        area_id: 200,
        wall_ids: ['w-20-canteen', 'w-20-n', 'w-20-w'],
        x_val: 0.35,
        y_val: 0.30,
        z_val: 0.80,
        halo_color: '#adb5bd',
        halo_radius: 5,
        halo_intensity: 0.15,
        event_configs: [
            {
                id: 501, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: null, is_triggered: false,
            },
            {
                id: 502, event_id: 'Smoking', enabled: true,
                min_value: 0, threshold: 50, max_value: 100,
                led_color: LED.red,
                current_value: null, is_triggered: false,
            },
            {
                id: 503, event_id: 'Vape', enabled: true,
                min_value: 0, threshold: 50, max_value: 100,
                led_color: LED.purple,
                current_value: null, is_triggered: false,
            },
        ],
        latest_log: null,
    },

    {
        id: 6,
        name: 'HALO-SB-02',
        mac_address: 'AA:BB:CC:DD:EE:06',
        ip_address: '192.168.1.202',
        online_status: true,
        sensor_status: 'online',
        floor_id: 20,
        area_id: 201,
        wall_ids: ['w-20-stor-n', 'w-20-stor-w', 'w-20-s', 'w-20-e'],
        x_val: 0.82,
        y_val: 0.78,
        z_val: 0.75,
        halo_color: '#06d6a0',
        halo_radius: 3,
        halo_intensity: 0.25,
        event_configs: [
            {
                id: 601, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: 2, is_triggered: false,
            },
            {
                id: 602, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 40, max_value: 60,
                led_color: LED.orange,
                current_value: 19.6, is_triggered: false,
            },
            {
                id: 603, event_id: 'PM2.5', enabled: true,
                min_value: 0, threshold: 35, max_value: 150,
                led_color: LED.yellow,
                current_value: 6.2, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 90000).toISOString(),
            readings_environmental: {
                temperature_c: 19.6,
                humidity_percent: 55.8,
                light_lux: 80,
                pressure_hpa: 1013.8,
                sound_db: 28,
            },
            readings_air: {
                co2_eq: 440, co2_cal: 428,
                tvoc: 45, co: 0.3,
                nh3: 0.0, no2: 9,
                pm1: 2, pm25: 6, pm10: 9,
            },
            readings_derived: {
                aqi: 18,
                health_index: 4.6,
                noise_db: 28,
                motion: 2,
                gunshot: 0,
                aggression: 0,
                movement: 1,
            },
            others: { help: 0, panic: 0 },
        },
    },

    // ── Tower Block sensors ───────────────────────────────────────────────────
    // Ground floor (floor_id: 300)
    {
        id: 10,
        name: 'HALO-TWR-GF-01',
        mac_address: 'AA:BB:CC:DD:FF:01',
        ip_address: '192.168.2.101',
        online_status: true,
        sensor_status: 'online',
        floor_id: 300,
        x_val: 0.20,
        y_val: 0.50,
        z_val: 0.85,
        halo_color: '#06d6a0',
        halo_radius: 6,
        halo_intensity: 0.38,
        event_configs: [
            {
                id: 1001, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: 55, is_triggered: false,
            },
            {
                id: 1002, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange,
                current_value: 21.2, is_triggered: false,
            },
            {
                id: 1003, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple,
                current_value: 720, is_triggered: false,
            },
            {
                id: 1004, event_id: 'AQI', enabled: true,
                min_value: 0, threshold: 100, max_value: 500,
                led_color: LED.green,
                current_value: 42, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 20000).toISOString(),
            readings_environmental: {
                temperature_c: 21.2,
                humidity_percent: 52.0,
                light_lux: 420,
                pressure_hpa: 1013.0,
                sound_db: 58,
            },
            readings_air: {
                co2_eq: 720, co2_cal: 705,
                tvoc: 110, co: 0.6,
                nh3: 0.1, no2: 15,
                pm1: 5, pm25: 9, pm10: 14,
            },
            readings_derived: {
                aqi: 42,
                health_index: 3.8,
                noise_db: 58,
                motion: 55,
                gunshot: 0,
                aggression: 0,
                movement: 38,
            },
            others: { help: 0, panic: 0 },
        },
    },

    // Tower Floor 5 (floor_id: 304) — alert state
    {
        id: 11,
        name: 'HALO-TWR-F5-01',
        mac_address: 'AA:BB:CC:DD:FF:02',
        ip_address: '192.168.2.102',
        online_status: true,
        sensor_status: 'alert',
        floor_id: 304,
        x_val: 0.25,
        y_val: 0.25,
        z_val: 0.85,
        halo_color: '#e63946',
        halo_radius: 6,
        halo_intensity: 0.95,
        event_configs: [
            {
                id: 1101, event_id: 'Gunshot', enabled: true,
                min_value: 0, threshold: 80, max_value: 100,
                led_color: LED.red,
                current_value: 92, is_triggered: true,
            },
            {
                id: 1102, event_id: 'Aggression', enabled: true,
                min_value: 0, threshold: 70, max_value: 100,
                led_color: LED.red,
                current_value: 85, is_triggered: true,
            },
            {
                id: 1103, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: 95, is_triggered: true,
            },
            {
                id: 1104, event_id: 'Sound', enabled: true,
                min_value: 0, threshold: 85, max_value: 130,
                led_color: LED.yellow,
                current_value: 110, is_triggered: true,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 5000).toISOString(),
            readings_environmental: {
                temperature_c: 25.0,
                humidity_percent: 45.0,
                light_lux: 300,
                pressure_hpa: 1011.5,
                sound_db: 110,
            },
            readings_air: {
                co2_eq: 650, co2_cal: 635,
                tvoc: 88, co: 0.9,
                nh3: 0.2, no2: 20,
                pm1: 6, pm25: 10, pm10: 16,
            },
            readings_derived: {
                aqi: 55,
                health_index: 2.2,
                noise_db: 110,
                motion: 95,
                gunshot: 92,
                aggression: 85,
                movement: 90,
            },
            others: { help: 1, panic: 1 },
        },
    },

    // Tower Floor 10 (floor_id: 309) — online
    {
        id: 12,
        name: 'HALO-TWR-F10-01',
        mac_address: 'AA:BB:CC:DD:FF:03',
        ip_address: '192.168.2.103',
        online_status: true,
        sensor_status: 'online',
        floor_id: 309,
        x_val: 0.28,
        y_val: 0.55,
        z_val: 0.85,
        halo_color: '#06d6a0',
        halo_radius: 7,
        halo_intensity: 0.30,
        event_configs: [
            {
                id: 1201, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: 18, is_triggered: false,
            },
            {
                id: 1202, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange,
                current_value: 22.0, is_triggered: false,
            },
            {
                id: 1203, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple,
                current_value: 550, is_triggered: false,
            },
            {
                id: 1204, event_id: 'AQI', enabled: true,
                min_value: 0, threshold: 100, max_value: 500,
                led_color: LED.green,
                current_value: 25, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 15000).toISOString(),
            readings_environmental: {
                temperature_c: 22.0,
                humidity_percent: 48.5,
                light_lux: 450,
                pressure_hpa: 1013.2,
                sound_db: 32,
            },
            readings_air: {
                co2_eq: 550, co2_cal: 538,
                tvoc: 95, co: 0.4,
                nh3: 0.1, no2: 12,
                pm1: 3, pm25: 6, pm10: 10,
            },
            readings_derived: {
                aqi: 25,
                health_index: 4.1,
                noise_db: 32,
                motion: 18,
                gunshot: 0,
                aggression: 0,
                movement: 10,
            },
            others: { help: 0, panic: 0 },
        },
    },

    {
        id: 13,
        name: 'HALO-TWR-F20-01',
        mac_address: 'AA:BB:CC:DD:FF:04',
        ip_address: '192.168.2.104',
        online_status: true,
        sensor_status: 'online',
        floor_id: 319,
        x_val: 0.50,
        y_val: 0.50,
        z_val: 0.85,
        halo_color: '#06d6a0',
        halo_radius: 5,
        halo_intensity: 0.35,
        event_configs: [
            {
                id: 1301, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue,
                current_value: 8, is_triggered: false,
            },
            {
                id: 1302, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange,
                current_value: 20.8, is_triggered: false,
            },
            {
                id: 1303, event_id: 'AQI', enabled: true,
                min_value: 0, threshold: 100, max_value: 500,
                led_color: LED.green,
                current_value: 16, is_triggered: false,
            },
        ],
        latest_log: {
            recorded_at: new Date(Date.now() - 10000).toISOString(),
            readings_environmental: {
                temperature_c: 20.8,
                humidity_percent: 40.0,
                light_lux: 580,
                pressure_hpa: 1013.0,
                sound_db: 28,
            },
            readings_air: {
                co2_eq: 480, co2_cal: 465,
                tvoc: 55, co: 0.3,
                nh3: 0.0, no2: 8,
                pm1: 2, pm25: 3, pm10: 5,
            },
            readings_derived: {
                aqi: 16,
                health_index: 4.7,
                noise_db: 28,
                motion: 8,
                gunshot: 0,
                aggression: 0,
                movement: 4,
            },
            others: { help: 0, panic: 0 },
        },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATED STATS (Mock)
// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_AGGREGATED_DATA = {
    aggregated_data: {
        temperature_min: 19.6, temperature_max: 38.2,
        temperature_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        temperature_max_sensor: { sensor_id: 4, sensor__name: 'HALO-FF-02' },

        humidity_min: 28.4, humidity_max: 62.5,
        humidity_min_sensor: { sensor_id: 4, sensor__name: 'HALO-FF-02' },
        humidity_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },

        light_min: 80, light_max: 640,
        light_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        light_max_sensor: { sensor_id: 3, sensor__name: 'HALO-FF-01' },

        pressure_min: 1011.5, pressure_max: 1014.0,
        pressure_min_sensor: { sensor_id: 11, sensor__name: 'HALO-TWR-F5-01' },
        pressure_max_sensor: { sensor_id: 4, sensor__name: 'HALO-FF-02' },

        sound_min: 28,
        sound_max: 110,
        sound_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        sound_max_sensor: { sensor_id: 11, sensor__name: 'HALO-TWR-F5-01' },

        co2_min: 428,
        co2_max: 1340,
        co2_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        co2_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },

        tvoc_min: 45,
        tvoc_max: 342,
        tvoc_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        tvoc_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },

        pm1_min: 2, pm1_max: 18,
        pm25_min: 3, pm25_max: 28,
        pm10_min: 5, pm10_max: 45,

        pm1_min_sensor: { sensor_id: 4, sensor__name: 'HALO-FF-02' },
        pm1_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },
        pm25_min_sensor: { sensor_id: 4, sensor__name: 'HALO-FF-02' },
        pm25_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },
        pm10_min_sensor: { sensor_id: 4, sensor__name: 'HALO-FF-02' },
        pm10_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },

        aqi_min: 16, aqi_max: 118,
        aqi_min_sensor: { sensor_id: 13, sensor__name: 'HALO-TWR-F20-01' },
        aqi_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },

        health_min: 2.2, health_max: 4.7,
        health_min_sensor: { sensor_id: 11, sensor__name: 'HALO-TWR-F5-01' },
        health_max_sensor: { sensor_id: 13, sensor__name: 'HALO-TWR-F20-01' },

        noise_min: 28, noise_max: 110,
        noise_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        noise_max_sensor: { sensor_id: 11, sensor__name: 'HALO-TWR-F5-01' },

        motion_min: 2, motion_max: 95,
        movement_min: 1, movement_max: 90,

        motion_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        motion_max_sensor: { sensor_id: 11, sensor__name: 'HALO-TWR-F5-01' },
        movement_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        movement_max_sensor: { sensor_id: 11, sensor__name: 'HALO-TWR-F5-01' },

        co_min: 0.3, co_max: 2.1,
        no2_min: 8, no2_max: 32,
        nh3_min: 0.0, nh3_max: 0.8,

        co_min_sensor: { sensor_id: 6, sensor__name: 'HALO-SB-02' },
        co_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },
        no2_min_sensor: { sensor_id: 4, sensor__name: 'HALO-FF-02' },
        no2_max_sensor: { sensor_id: 2, sensor__name: 'HALO-GF-02' },
        nh3_min_sensor: null,
        nh3_max_sensor: null,
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively find an AreaNode by its ID in the tree
 */
export function findNodeById(root: AreaNode, id: number | null): AreaNode | null {
    if (id === null) return null;
    if (root.id === id) return root;
    if (root.children) {
        for (const child of root.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Filter sensors by floor_id
 */
export function getSensorsForFloor(sensors: SensorNode[], floorId: number | null): SensorNode[] {
    if (floorId === null) return [];
    return sensors.filter(s => s.floor_id === floorId);
}

