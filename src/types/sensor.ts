export interface SensorReadings {
    co: number;
    aqi: number;
    co2: number;
    nh3: number;
    no2: number;
    pm1: number;
    pm10: number;
    pm25: number;
    tvoc: number;
    coaqi: number;
    light: number;
    noise: number;
    hi_co2: number;
    hi_hum: number;
    hi_no2: number;
    hi_pm1: number;
    motion: number;
    no2aqi: number;
    temp_c: number;
    temp_f: number;
    gunshot: number;
    hi_pm10: number;
    hi_pm25: number;
    hi_tvoc: number;
    pm10aqi: number;
    pm25aqi: number;
    humidity: number;
    aggression: number;
    health_index: number;
    pressure_hpa: number;
}

export interface SensorData {
    ip: string;
    mac: string;
    val: number;
    desc: string;
    room: string;
    time: string;
    wing: string;
    event: string;
    floor: string;
    device: string;
    source: string;
    sensors: SensorReadings;
    threshold: number;
    active_events: string;
    firmware_version: string;
    active_events_list: string[];
}

export interface Sensor {
    id: string;
    macAddress: string;
    serialNumber: string;
    building: string;
    floor: number;
    zone: string;
    subAreaId?: string;
    sensora?: string;
    autoUpdate: boolean;
    lastActive?: string;
    createdAt: string;
    updatedAt: string;
    groupId?: string;
    area_name?: string;
    metrics?: SensorMetric[];
    name: string;
    sensor_type?: string;
    location?: string;
    ip_address?: string;
    mac_address?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    is_active?: boolean;
    is_online?: boolean;
    last_heartbeat?: string | null;
    heartbeat_interval?: number;
    subarea_id?: number;
    area_id?: number;
    subarea: SubArea | null;
    area: Area | null;
    // Extended sensor data
    device_name?: string;
    timestamp?: string;
    event_id?: string;
    event_source?: string;
    event_value?: number;
    event_threshold?: number;
    active_events?: string;
    sensor_data?: SensorData;
    firmware_version?: string;
    building_wing?: string;
    building_floor?: string;
    building_room?: string;
    description?: string;
    personnel_in_charge?: string;
    personnel_contact?: string;
    personnel_email?: string;

    floor_level?: number;
    x_coordinate?: number;
    y_coordinate?: number;
    z_coordinate?: number;
    boundary?: {
        x_min: number;
        x_max: number;
        y_min: number;
        y_max: number;
    };
    room_name?: string;
    room_color?: string;
}
export interface Area {
    id: number;
    name: string;
    sensor_count: number;
    subareas?: SubArea[];
    description?: string;
    status?: 'Normal' | 'Warning' | 'Critical';
    subAreas?: SubArea[];
    createdAt?: string;
    parent_id?: number | null;
    floor_level?: number;
    is_room?: boolean;
    person_in_charge_ids?: number[];
    floor_plan_url?: string;
    floor_height?: number;
    color?: string;
}

export interface SubArea {
    id: number;
    name: string;
    area: {
        id: number;
        name: string;
        sensor_count: number;
    };
    sensor_count: number;
    subareas?: SubArea[];
    // Compatibility properties to make SubArea assignable to Area
    description?: string;
    status?: 'Normal' | 'Warning' | 'Critical';
    subAreas?: SubArea[];
    createdAt?: string;
}

export interface UserActivity {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details?: string;
    timestamp: string;
}

export type UserRole = 'Admin' | 'Viewer' | 'Manager';

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    last_login: string | null;
    date_joined: string;
    created_at: string;
    updated_at: string;
    assigned_area_ids: number[];
}

export interface UserGroup {
    id: number;
    name: string;
    description: string;
    user_count: number;
    created_at: string;
    updated_at: string;
    user_ids: number[]; // For mock data handling
}

export interface UserGroupCreateData {
    name: string;
    description?: string;
    user_ids?: number[];
}

export interface UserGroupUpdateData {
    name?: string;
    description?: string;
    user_ids?: number[] | null;
}




export interface SensorMetric {
    timestamp: string;
    type: 'temperature' | 'humidity' | 'air_quality' | 'co2';
    value: number;
    unit: string;
}

export interface SensorAnalytics {
    sensorId: string;
    averageTemperature: number;
    peakCO2: number;
    uptime: number;
    status: 'normal' | 'warning' | 'critical';
}

export interface SensorGroup {
    id: string;
    name: string;
    description?: string;
    sensorCount: number;
    activeAlerts: number;
    status: 'Normal' | 'Warning' | 'Critical';
    createdAt: string;
}

export interface SensorRegistrationData {
    name: string;
    sensor_type?: string;
    location?: string;
    ip_address?: string;
    mac_address?: string;
}

export interface SensorConfig {
    id: string;
    sensor_name: string;
    enabled: boolean;
    threshold: number;
    min_value?: number;
    max_value?: number;
    description?: string;
}

export interface SensorPlacementPayload {
    sensorId: string;
    areaId: number;
    x_coordinate: number;
    y_coordinate: number;
    image_url?: string | null;
}
