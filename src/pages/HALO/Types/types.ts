
export type AreaType = 'Site' | 'Region' | 'Building' | 'Floor' | 'Area' | 'Sub Area';
export type WallType = 'outer' | 'partition' | 'glass';
export type Status = 'Active' | 'Inactive';
export type SensorStatus = 'online' | 'offline' | 'alert';
export type WallShape = 'straight' | 'arc' | 'bezier';

// ── Area Tree Node ────────────────────────────────────────────────────────────
export interface AreaNode {
    id: number;
    name: string;
    area_type: AreaType;
    parent: number | null;
    status: Status;
    capacity: number;
    is_default_top_area?: boolean;
    offset_x: number;
    offset_y: number;
    offset_z: number;
    floor_level: number | null;
    floor_width: number | null;
    floor_depth: number | null;
    floor_height: number | null;
    area_plan: string | null;
    children?: AreaNode[];
}

// ── Wall ──────────────────────────────────────────────────────────────────────
export interface AreaWall {
    id: number | string;
    area_id: number;
    sub_area_id?: number;
    r_x1: number;
    r_y1: number;
    r_x2: number;
    r_y2: number;
    r_height: number;
    r_z_offset: number;
    thickness: number;
    wall_type: WallType;
    color: string;
    opacity: number;
    wall_shape?: WallShape;
    // Arc fields
    arc_center_x?: number;
    arc_center_z?: number;
    arc_radius?: number;
    arc_start_angle?: number;
    arc_end_angle?: number;
    arc_segments?: number;
}

// ── Halo Event Config ─────────────────────────────────────────────────────────
// One sensor has many event configs — each maps to one of the HALO_EVENTS
export interface HaloEventConfig {
    id: number;
    event_id: string;        // e.g. 'Motion', 'CO2cal', 'temp_c'
    enabled: boolean;
    min_value: number;
    threshold: number;
    max_value: number;
    led_color: number;       // decimal e.g. 0xff0000 = red
    current_value: number | null;   // latest reading for this event
    is_triggered: boolean;          // current_value >= threshold
}

// ── Sensor Latest Log ─────────────────────────────────────────────────────────
// Mirrors real backend SensorLog structure
export interface SensorLatestLog {
    recorded_at: string;
    readings_environmental: {
        temperature_c: number | null;
        humidity_percent: number | null;
        light_lux: number | null;
        pressure_hpa: number | null;
        sound_db: number | null;
    };
    readings_air: {
        co2_eq: number | null;
        co2_cal: number | null;
        tvoc: number | null;
        co: number | null;
        nh3: number | null;
        no2: number | null;
        pm1: number | null;
        pm25: number | null;
        pm10: number | null;
    };
    readings_derived: {
        aqi: number | null;
        health_index: number | null;
        noise_db: number | null;
        motion: number | null;
        gunshot: number | null;
        aggression: number | null;
        movement: number | null;
    };
    others: {
        help: number | null;
        panic: number | null;
    };
}

// ── Sensor Node ───────────────────────────────────────────────────────────────
// This IS the halo — placed on a floor at (nx, ny)
export interface SensorNode {
    id: number;
    name: string;
    mac_address: string;
    ip_address: string | null;

    // Status
    online_status: boolean;
    sensor_status: SensorStatus;   // derived: 'online' | 'offline' | 'alert'

    // Position on floor — normalized 0.0–1.0
    // NULL = unplaced, valid number = placed on that floor
    floor_id: number | null;              // which floor this sensor is placed on
    area_id?: number | null;              // which room/area this sensor belongs to
    wall_ids?: (number | string)[];       // explicit list of walls to highlight
    x_val: number;                 // normalized X within floor_width
    y_val: number;                 // normalized Y within floor_depth
    z_val: number;                 // height (0=floor, 1=ceiling)

    // Halo visual — derived from worst active event
    halo_color: string;            // hex — green=online, red=alert, grey=offline
    halo_radius: number;           // metres — coverage radius
    halo_intensity: number;        // 0.0–1.0 pulse strength

    // Event configs — subset of HALO_EVENTS this sensor monitors
    event_configs: HaloEventConfig[];

    // Latest sensor readings
    latest_log: SensorLatestLog | null;
}

export interface SensorHalo {
    id: number | string;
    name: string;
    floor_id: number;
    nx: number;
    ny: number;
    radius: number;
    status: SensorStatus;
    color: string;
    intensity: number;
}

// ── Wall Drawing ──────────────────────────────────────────────────────────────
export interface Point2D {
    nx: number;
    ny: number;
}

export interface WallDrawSettings {
    wall_type: WallType;
    height: number;
    thickness: number;
    color: string;
    opacity: number;
}