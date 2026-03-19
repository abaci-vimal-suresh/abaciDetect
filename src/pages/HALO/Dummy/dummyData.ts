
import { AreaNode, AreaWall, SensorNode, SensorLatestLog, HaloEventConfig } from '../Types/types';

// ─────────────────────────────────────────────────────────────────────────────
// HALO EVENTS — full list
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
// LED COLOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Decimal LED colors matching old project convention
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
// AREA TREE
// 2 Buildings — North Block (2 floors) + South Block (1 floor)
// ─────────────────────────────────────────────────────────────────────────────

export const HALO_DUMMY_TREE: AreaNode = {
    id: 1,
    name: 'HQ Campus',
    area_type: 'Site',
    parent: null,
    status: 'Active',
    capacity: 500,
    is_default_top_area: true,
    offset_x: 0, offset_y: 0, offset_z: 0,
    floor_level: null, floor_width: null,
    floor_depth: null, floor_height: null,
    area_plan: null,
    children: [
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
            children: [
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
                            area_plan: null,
                            children: [],
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
                            area_plan: null,
                            children: [],
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
                            area_plan: null,
                            children: [],
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
                            area_plan: null,
                            children: [],
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
                            area_plan: null,
                            children: [],
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
                            area_plan: null,
                            children: [],
                        },
                    ],
                },
            ],
        },
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
            children: [
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
                            area_plan: null,
                            children: [],
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
                            area_plan: null,
                            children: [],
                        },
                    ],
                },
            ],
        },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// WALLS
// Normalized 0.0–1.0 relative to floor_width / floor_depth
// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_WALLS: Record<number, AreaWall[]> = {

    // ── Floor 10: Ground Floor — North Block ──────────────────────────────────
    10: [
        // Outer perimeter
        {
            id: 'w-10-north', area_id: 10,
            r_x1: 0.05, r_y1: 0.05, r_x2: 0.95, r_y2: 0.05,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#4a90d9', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-10-south', area_id: 10,
            r_x1: 0.05, r_y1: 0.95, r_x2: 0.95, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#4a90d9', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-10-west', area_id: 10,
            r_x1: 0.05, r_y1: 0.05, r_x2: 0.05, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#4a90d9', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-10-east', area_id: 10,
            r_x1: 0.95, r_y1: 0.05, r_x2: 0.95, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#4a90d9', opacity: 0.85,
            wall_shape: 'straight',
        },
        // Reception partition — divides left third
        {
            id: 'w-10-p1', area_id: 10, sub_area_id: 100,
            r_x1: 0.38, r_y1: 0.05, r_x2: 0.38, r_y2: 0.65,
            r_height: 3.5, r_z_offset: 0, thickness: 0.12,
            wall_type: 'partition', color: '#7b68ee', opacity: 0.75,
            wall_shape: 'straight',
        },
        // Security desk partition — bottom right corner
        {
            id: 'w-10-p2', area_id: 10, sub_area_id: 102,
            r_x1: 0.70, r_y1: 0.60, r_x2: 0.95, r_y2: 0.60,
            r_height: 2.0, r_z_offset: 0, thickness: 0.10,
            wall_type: 'partition', color: '#48cae4', opacity: 0.65,
            wall_shape: 'straight',
        },
        {
            id: 'w-10-p3', area_id: 10, sub_area_id: 102,
            r_x1: 0.70, r_y1: 0.60, r_x2: 0.70, r_y2: 0.95,
            r_height: 2.0, r_z_offset: 0, thickness: 0.10,
            wall_type: 'partition', color: '#48cae4', opacity: 0.65,
            wall_shape: 'straight',
        },
        // Glass facade — entrance area
        {
            id: 'w-10-glass', area_id: 10,
            r_x1: 0.38, r_y1: 0.65, r_x2: 0.62, r_y2: 0.65,
            r_height: 2.8, r_z_offset: 0, thickness: 0.06,
            wall_type: 'glass', color: '#90c8e0', opacity: 0.35,
            wall_shape: 'straight',
        },
    ],

    // ── Floor 11: First Floor — North Block ───────────────────────────────────
    11: [
        // Outer perimeter
        {
            id: 'w-11-north', area_id: 11,
            r_x1: 0.05, r_y1: 0.05, r_x2: 0.95, r_y2: 0.05,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#48cae4', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-11-south', area_id: 11,
            r_x1: 0.05, r_y1: 0.95, r_x2: 0.95, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#48cae4', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-11-west', area_id: 11,
            r_x1: 0.05, r_y1: 0.05, r_x2: 0.05, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#48cae4', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-11-east', area_id: 11,
            r_x1: 0.95, r_y1: 0.05, r_x2: 0.95, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#48cae4', opacity: 0.85,
            wall_shape: 'straight',
        },
        // Conference Room A — top right box
        {
            id: 'w-11-conf-s', area_id: 11, sub_area_id: 111,
            r_x1: 0.60, r_y1: 0.05, r_x2: 0.60, r_y2: 0.45,
            r_height: 3.5, r_z_offset: 0, thickness: 0.12,
            wall_type: 'partition', color: '#7b68ee', opacity: 0.8,
            wall_shape: 'straight',
        },
        {
            id: 'w-11-conf-e', area_id: 11, sub_area_id: 111,
            r_x1: 0.60, r_y1: 0.45, r_x2: 0.95, r_y2: 0.45,
            r_height: 3.5, r_z_offset: 0, thickness: 0.12,
            wall_type: 'glass', color: '#90c8e0', opacity: 0.4,
            wall_shape: 'straight',
        },
        // Server Room — bottom right tight box
        {
            id: 'w-11-srv-n', area_id: 11, sub_area_id: 112,
            r_x1: 0.72, r_y1: 0.68, r_x2: 0.95, r_y2: 0.68,
            r_height: 3.5, r_z_offset: 0, thickness: 0.15,
            wall_type: 'outer', color: '#f4a261', opacity: 0.9,
            wall_shape: 'straight',
        },
        {
            id: 'w-11-srv-w', area_id: 11, sub_area_id: 112,
            r_x1: 0.72, r_y1: 0.68, r_x2: 0.72, r_y2: 0.95,
            r_height: 3.5, r_z_offset: 0, thickness: 0.15,
            wall_type: 'outer', color: '#f4a261', opacity: 0.9,
            wall_shape: 'straight',
        },
    ],

    // ── Floor 20: Ground Floor — South Block ──────────────────────────────────
    20: [
        // Outer perimeter
        {
            id: 'w-20-north', area_id: 20,
            r_x1: 0.05, r_y1: 0.05, r_x2: 0.95, r_y2: 0.05,
            r_height: 3.0, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#52b788', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-20-south', area_id: 20,
            r_x1: 0.05, r_y1: 0.95, r_x2: 0.95, r_y2: 0.95,
            r_height: 3.0, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#52b788', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-20-west', area_id: 20,
            r_x1: 0.05, r_y1: 0.05, r_x2: 0.05, r_y2: 0.95,
            r_height: 3.0, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#52b788', opacity: 0.85,
            wall_shape: 'straight',
        },
        {
            id: 'w-20-east', area_id: 20,
            r_x1: 0.95, r_y1: 0.05, r_x2: 0.95, r_y2: 0.95,
            r_height: 3.0, r_z_offset: 0, thickness: 0.2,
            wall_type: 'outer', color: '#52b788', opacity: 0.85,
            wall_shape: 'straight',
        },
        // Canteen divider — horizontal mid wall
        {
            id: 'w-20-canteen', area_id: 20, sub_area_id: 200,
            r_x1: 0.05, r_y1: 0.55, r_x2: 0.70, r_y2: 0.55,
            r_height: 3.0, r_z_offset: 0, thickness: 0.12,
            wall_type: 'partition', color: '#52b788', opacity: 0.7,
            wall_shape: 'straight',
        },
        // Storage — bottom right box
        {
            id: 'w-20-stor-n', area_id: 20, sub_area_id: 201,
            r_x1: 0.70, r_y1: 0.55, r_x2: 0.95, r_y2: 0.55,
            r_height: 3.0, r_z_offset: 0, thickness: 0.15,
            wall_type: 'outer', color: '#f4a261', opacity: 0.88,
            wall_shape: 'straight',
        },
        {
            id: 'w-20-stor-w', area_id: 20, sub_area_id: 201,
            r_x1: 0.70, r_y1: 0.55, r_x2: 0.70, r_y2: 0.95,
            r_height: 3.0, r_z_offset: 0, thickness: 0.15,
            wall_type: 'outer', color: '#f4a261', opacity: 0.88,
            wall_shape: 'straight',
        },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SENSOR NODES (Halo Sensors)
// Each sensor = one physical Halo device on a floor
// event_configs = subset of HALO_EVENTS this sensor monitors
// latest_log = simulated live readings
// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_SENSORS: SensorNode[] = [

    // ── Sensor 1: HALO-GF-01 — Ground Floor North, Reception area ────────────
    // Status: ONLINE, no triggers
    {
        id: 1,
        name: 'HALO-GF-01',
        mac_address: 'AA:BB:CC:DD:EE:01',
        ip_address: '192.168.1.101',
        online_status: true,
        sensor_status: 'online',
        floor_id: 10,
        x_val: 0.22,   // left third — reception area
        y_val: 0.35,
        z_val: 0.85,   // near ceiling
        halo_color: '#06d6a0',   // green
        halo_radius: 5,
        halo_intensity: 0.4,
        event_configs: [
            {
                id: 101, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue, current_value: 12, is_triggered: false,
            },
            {
                id: 102, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange, current_value: 22.4, is_triggered: false,
            },
            {
                id: 103, event_id: 'Humidity', enabled: true,
                min_value: 20, threshold: 75, max_value: 100,
                led_color: LED.cyan, current_value: 48.2, is_triggered: false,
            },
            {
                id: 104, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple, current_value: 612, is_triggered: false,
            },
            {
                id: 105, event_id: 'AQI', enabled: true,
                min_value: 0, threshold: 100, max_value: 500,
                led_color: LED.green, current_value: 34, is_triggered: false,
            },
            {
                id: 106, event_id: 'Sound', enabled: true,
                min_value: 0, threshold: 85, max_value: 130,
                led_color: LED.yellow, current_value: 42, is_triggered: false,
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

    // ── Sensor 2: HALO-GF-02 — Ground Floor North, Lobby ─────────────────────
    // Status: ALERT — Motion + CO2 both triggered
    {
        id: 2,
        name: 'HALO-GF-02',
        mac_address: 'AA:BB:CC:DD:EE:02',
        ip_address: '192.168.1.102',
        online_status: true,
        sensor_status: 'alert',
        floor_id: 10,
        x_val: 0.72,   // right side — lobby
        y_val: 0.30,
        z_val: 0.85,
        halo_color: '#e63946',   // red — alert
        halo_radius: 6,
        halo_intensity: 1.0,
        event_configs: [
            {
                id: 201, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.red, current_value: 88, is_triggered: true,
            },
            {
                id: 202, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple, current_value: 1340, is_triggered: true,
            },
            {
                id: 203, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange, current_value: 28.1, is_triggered: false,
            },
            {
                id: 204, event_id: 'Aggression', enabled: true,
                min_value: 0, threshold: 70, max_value: 100,
                led_color: LED.red, current_value: 15, is_triggered: false,
            },
            {
                id: 205, event_id: 'Gunshot', enabled: true,
                min_value: 0, threshold: 80, max_value: 100,
                led_color: LED.red, current_value: 0, is_triggered: false,
            },
            {
                id: 206, event_id: 'AQI', enabled: true,
                min_value: 0, threshold: 100, max_value: 500,
                led_color: LED.orange, current_value: 118, is_triggered: true,
            },
            {
                id: 207, event_id: 'TVOC', enabled: true,
                min_value: 0, threshold: 500, max_value: 1000,
                led_color: LED.purple, current_value: 342, is_triggered: false,
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

    // ── Sensor 3: HALO-FF-01 — First Floor North, Open Office ────────────────
    // Status: ONLINE — mild readings
    {
        id: 3,
        name: 'HALO-FF-01',
        mac_address: 'AA:BB:CC:DD:EE:03',
        ip_address: '192.168.1.103',
        online_status: true,
        sensor_status: 'online',
        floor_id: 11,
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
                led_color: LED.blue, current_value: 35, is_triggered: false,
            },
            {
                id: 302, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 35, max_value: 50,
                led_color: LED.orange, current_value: 23.8, is_triggered: false,
            },
            {
                id: 303, event_id: 'Humidity', enabled: true,
                min_value: 20, threshold: 75, max_value: 100,
                led_color: LED.cyan, current_value: 51.0, is_triggered: false,
            },
            {
                id: 304, event_id: 'CO2cal', enabled: true,
                min_value: 400, threshold: 1000, max_value: 2000,
                led_color: LED.purple, current_value: 820, is_triggered: false,
            },
            {
                id: 305, event_id: 'Light', enabled: true,
                min_value: 0, threshold: 1000, max_value: 2000,
                led_color: LED.yellow, current_value: 640, is_triggered: false,
            },
            {
                id: 306, event_id: 'Pressure', enabled: true,
                min_value: 950, threshold: 1050, max_value: 1100,
                led_color: LED.white, current_value: 1013.5, is_triggered: false,
            },
            {
                id: 307, event_id: 'Health_Index', enabled: true,
                min_value: 0, threshold: 2, max_value: 5,
                led_color: LED.green, current_value: 3.9, is_triggered: false,
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

    // ── Sensor 4: HALO-FF-02 — First Floor North, Server Room ────────────────
    // Status: ALERT — Temperature critical
    {
        id: 4,
        name: 'HALO-FF-02',
        mac_address: 'AA:BB:CC:DD:EE:04',
        ip_address: '192.168.1.104',
        online_status: true,
        sensor_status: 'alert',
        floor_id: 11,
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
                led_color: LED.red, current_value: 38.2, is_triggered: true,
            },
            {
                id: 402, event_id: 'Humidity', enabled: true,
                min_value: 20, threshold: 65, max_value: 100,
                led_color: LED.cyan, current_value: 28.4, is_triggered: false,
            },
            {
                id: 403, event_id: 'CO', enabled: true,
                min_value: 0, threshold: 9, max_value: 50,
                led_color: LED.red, current_value: 1.2, is_triggered: false,
            },
            {
                id: 404, event_id: 'Tamper', enabled: true,
                min_value: 0, threshold: 1, max_value: 1,
                led_color: LED.orange, current_value: 0, is_triggered: false,
            },
            {
                id: 405, event_id: 'Masking', enabled: true,
                min_value: 0, threshold: 1, max_value: 1,
                led_color: LED.orange, current_value: 0, is_triggered: false,
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

    // ── Sensor 5: HALO-SB-01 — South Block, Canteen ──────────────────────────
    // Status: OFFLINE
    {
        id: 5,
        name: 'HALO-SB-01',
        mac_address: 'AA:BB:CC:DD:EE:05',
        ip_address: '192.168.1.201',
        online_status: false,
        sensor_status: 'offline',
        floor_id: 20,
        x_val: 0.35,
        y_val: 0.30,
        z_val: 0.80,
        halo_color: '#adb5bd',   // grey — offline
        halo_radius: 5,
        halo_intensity: 0.15,
        event_configs: [
            {
                id: 501, event_id: 'Motion', enabled: true,
                min_value: 0, threshold: 60, max_value: 100,
                led_color: LED.blue, current_value: null, is_triggered: false,
            },
            {
                id: 502, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 40, max_value: 60,
                led_color: LED.orange, current_value: null, is_triggered: false,
            },
            {
                id: 503, event_id: 'Smoking', enabled: true,
                min_value: 0, threshold: 50, max_value: 100,
                led_color: LED.red, current_value: null, is_triggered: false,
            },
            {
                id: 504, event_id: 'Vape', enabled: true,
                min_value: 0, threshold: 50, max_value: 100,
                led_color: LED.purple, current_value: null, is_triggered: false,
            },
            {
                id: 505, event_id: 'THC', enabled: true,
                min_value: 0, threshold: 30, max_value: 100,
                led_color: LED.green, current_value: null, is_triggered: false,
            },
        ],
        latest_log: null,   // offline — no log
    },

    // ── Sensor 6: HALO-SB-02 — South Block, Storage ──────────────────────────
    // Status: ONLINE — very quiet area
    {
        id: 6,
        name: 'HALO-SB-02',
        mac_address: 'AA:BB:CC:DD:EE:06',
        ip_address: '192.168.1.202',
        online_status: true,
        sensor_status: 'online',
        floor_id: 20,
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
                led_color: LED.blue, current_value: 2, is_triggered: false,
            },
            {
                id: 602, event_id: 'temp_c', enabled: true,
                min_value: 15, threshold: 40, max_value: 60,
                led_color: LED.orange, current_value: 19.6, is_triggered: false,
            },
            {
                id: 603, event_id: 'Humidity', enabled: true,
                min_value: 20, threshold: 80, max_value: 100,
                led_color: LED.cyan, current_value: 55.8, is_triggered: false,
            },
            {
                id: 604, event_id: 'CO', enabled: true,
                min_value: 0, threshold: 9, max_value: 50,
                led_color: LED.red, current_value: 0.3, is_triggered: false,
            },
            {
                id: 605, event_id: 'PM2.5', enabled: true,
                min_value: 0, threshold: 35, max_value: 150,
                led_color: LED.yellow, current_value: 6.2, is_triggered: false,
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
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function findNodeById(root: AreaNode, id: number): AreaNode | null {
    if (root.id === id) return root;
    for (const child of root.children ?? []) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
}

export function getAllFloors(root: AreaNode): AreaNode[] {
    const floors: AreaNode[] = [];
    const traverse = (node: AreaNode) => {
        if (node.area_type === 'Floor') floors.push(node);
        node.children?.forEach(traverse);
    };
    traverse(root);
    return floors;
}

export function getAllBuildings(root: AreaNode): AreaNode[] {
    const buildings: AreaNode[] = [];
    const traverse = (node: AreaNode) => {
        if (node.area_type === 'Building') buildings.push(node);
        node.children?.forEach(traverse);
    };
    traverse(root);
    return buildings;
}

export function getSensorsForFloor(
    floorId: number,
    sensors: SensorNode[]
): SensorNode[] {
    return sensors.filter(s => s.floor_id === floorId);
}

// Derive halo color from worst active event
export function deriveHaloColor(sensor: SensorNode): string {
    if (!sensor.online_status) return '#adb5bd';
    const hasAlert = sensor.event_configs.some(e => e.is_triggered);
    if (hasAlert) return '#e63946';
    return '#06d6a0';
}

// Derive halo intensity from triggered event count
export function deriveHaloIntensity(sensor: SensorNode): number {
    if (!sensor.online_status) return 0.15;
    const triggered = sensor.event_configs.filter(e => e.is_triggered).length;
    if (triggered === 0) return 0.3 + Math.random() * 0.1;
    return Math.min(1.0, 0.6 + triggered * 0.15);
}