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
    macAddress?: string;
    serialNumber?: string;
    building?: string;
    floor?: number;
    zone?: string;
    subAreaId?: string;
    sensora?: string;
    autoUpdate?: boolean;
    lastActive?: string;
    createdAt?: string;
    updatedAt?: string;
    groupId?: string;
    area_name?: string;
    metrics?: SensorMetric[];
    name: string;
    sensor_type?: SensorType | string;
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
    subarea?: SubArea | null;
    area?: Area | null;
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
    // New fields for detailed sensor tracking
    manufacturer?: string;
    model?: string;
    install_date?: string;
    last_maintenance?: string;
    next_maintenance?: string;

    // Floor plan coordinates
    x_coordinate?: number;
    y_coordinate?: number;
    z_coordinate?: number;

    // Room properties
    room_name?: string;
    room_color?: string;

    // Movement boundary (normalized coordinates 0-1)
    boundary?: {
        x_min: number;
        x_max: number;
        y_min: number;
        y_max: number;
        z_min?: number; // NEW: For volumetric boundaries
        z_max?: number;
    };

    // NEW: 3D and Multi-floor support
    area_id?: number; // ✅ Foreign key to Area.id
    floor_level?: number; // Which floor this sensor is on


    // Personnel Information
    personnel_in_charge?: string;     // Name of responsible person
    personnel_contact?: string;        // Contact phone number
    personnel_email?: string;
}

// What to send to backend
export interface SensorPlacementPayload {
    sensorId: string;
    areaId: number;
    // Store normalized coordinates (0-1 range)
    x_coordinate: number; // 0.0 to 1.0
    y_coordinate: number; // 0.0 to 1.0
    // Optional: Store original image info for reference
    image_url?: string;
    image_width?: number;
    image_height?: number;
}
export interface Area {
    id: number;
    name: string;
    sensor_count: number;
    subareas: Area[]; // Changed to Area to support recursion
    description?: string;
    status?: 'Normal' | 'Warning' | 'Critical';
    createdAt?: string;
    parent_id: number | null; // ✅ Always use parent_id for hierarchy

    // Floor Plan Data
    floor_plan_image?: string;
    floor_plan_url?: string; // ✅ NEW: For uploaded floor plan persistence
    floor_plan_width?: number;
    floor_plan_height?: number;
    polygon_coords?: number[][];

    // NEW: Multi-floor support
    floor_level?: number | null; // e.g., 0 = ground, 1 = first floor, -1 = basement
    floor_height?: number; // Height of this floor in pixels (default: 200)
    is_room?: boolean; // True if this represents a physical room (has boundaries)

    // NEW: 3D Visualization metadata
    color?: string; // Room color for 3D view
    wall_opacity?: number;
    show_walls?: boolean;
    person_in_charge_ids?: number[]; // ✅ NEW: Link areas to multiple users
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

export type SensorType = 'HALO_SMART' | 'HALO_3C' | 'HALO_IOT' | 'HALO_CUSTOM';

export interface SensorRegistrationData {
    name: string;
    sensor_type?: SensorType | string;
    location?: string;
    ip_address?: string;
    mac_address?: string;
}

export interface SensorConfig {
    id?: number; // Optional on creation
    sensor_name: string;
    enabled: boolean;
    min_value?: number;
    threshold?: number;
    max_value?: number;
    device?: number; // ID of the device
    created_at?: string;
    updated_at?: string;
}

export const SENSOR_CONFIG_CHOICES = [
    // Temperature & Humidity
    { value: 'temp_c', label: 'Temperature (Celsius)' },
    { value: 'temp_f', label: 'Temperature (Fahrenheit)' },
    { value: 'humidity', label: 'Humidity (%)' },

    // Air Quality & Particles
    { value: 'pm1', label: 'Particulate Matter 1µm' },
    { value: 'pm10', label: 'Particulate Matter 10µm' },
    { value: 'pm25', label: 'Particulate Matter 2.5µm' },
    { value: 'tvoc', label: 'Total Volatile Organic Compounds' },
    { value: 'co2', label: 'Carbon Dioxide (ppm)' },
    { value: 'co', label: 'Carbon Monoxide (ppm)' },
    { value: 'no2', label: 'Nitrogen Dioxide (ppb)' },
    { value: 'nh3', label: 'Ammonia (ppb)' },

    // AQI Indices
    { value: 'aqi', label: 'Air Quality Index' },
    { value: 'pm10aqi', label: 'PM10 AQI' },
    { value: 'pm25aqi', label: 'PM2.5 AQI' },
    { value: 'coaqi', label: 'CO AQI' },
    { value: 'no2aqi', label: 'NO2 AQI' },

    // Environmental
    { value: 'light', label: 'Light Level (lux)' },
    { value: 'pressure_hpa', label: 'Atmospheric Pressure (hPa)' },

    // Audio & Motion
    { value: 'noise', label: 'Noise Level (dB)' },
    { value: 'motion', label: 'Motion Detection' },
    { value: 'aggression', label: 'Aggression Detection' },
    { value: 'gunshot', label: 'Gunshot Detection' },

    // Health Indices
    { value: 'health_index', label: 'Overall Health Index' },
    { value: 'hi_co2', label: 'CO2 Health Index' },
    { value: 'hi_hum', label: 'Humidity Health Index' },
    { value: 'hi_pm1', label: 'PM1 Health Index' },
    { value: 'hi_pm10', label: 'PM10 Health Index' },
    { value: 'hi_pm25', label: 'PM2.5 Health Index' },
    { value: 'hi_tvoc', label: 'TVOC Health Index' },
    { value: 'hi_no2', label: 'NO2 Health Index' },
];
export type UserRole = 'Admin' | 'Viewer' | 'admin' | 'viewer';

export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    last_login?: string;
    assigned_area_ids: number[]; // IDs of areas this user manages
}

export interface UserActivity {
    id: number;
    user_id: number;
    action: string;
    timestamp: string;
    details?: string;
}

// ============================================
// USER GROUPS
// ============================================

export interface UserGroup {
    id: number;
    name: string;
    description?: string;
    members: User[];
    member_count: number;
    created_at: string;
    updated_at: string;
}

export interface UserGroupCreateData {
    name: string;
    description?: string;
    member_ids?: number[];
}

export interface UserGroupUpdateData {
    name?: string;
    description?: string;
    member_ids?: number[];
}

export interface AddRemoveMembersData {
    member_ids: number[];
}
