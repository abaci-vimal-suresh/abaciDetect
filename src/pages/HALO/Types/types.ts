
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
    sensor_count?: number;
    person_in_charge_ids?: number[];
    config_data?: Record<string, { min: number; max: number }>;
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
    arc_center_x?: number;
    arc_center_z?: number;
    arc_radius?: number;
    arc_start_angle?: number;
    arc_end_angle?: number;
    arc_segments?: number;
    area_ids?: number[];
    ctrl_x?: number;
    ctrl_y?: number;
}

// ── Halo Event Config ─────────────────────────────────────────────────────────
export interface HaloEventConfig {
    id: number;
    event_id: string;
    enabled: boolean;
    min_value: number;
    threshold: number;
    max_value: number;
    led_color: number;
    led_pattern?: number;
    led_priority?: number;
    sound?: string;
    halo_sensor?: number;
    current_value: number | null;
    is_triggered: boolean;
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
        hg_mic?: number | null;
        lg_mic?: number | null;
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

    online_status: boolean;
    sensor_status: SensorStatus;

    floor_id: number | null;
    area_id?: number | null;
    wall_ids?: (number | string)[];
    x_val: number;
    y_val: number;
    z_val: number;

    halo_color: string;
    halo_radius: number;
    halo_intensity: number;
    event_configs: HaloEventConfig[];
    latest_log: SensorLatestLog | null;
    is_active?: boolean;
    is_online?: boolean;
    last_heartbeat?: string | null;
    sensor_type?: string;
    description?: string;
    firmware_version?: string;
    personnel_in_charge?: string;
    personnel_contact?: string;
    personnel_email?: string;
    sensor_group_ids?: number[];
    area?: number | null;
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