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
    area_type?: string; // building, floor, room, etc.
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
    id: number;
    name: string;
    description?: string;
    sensor_list: Sensor[]; // Backend returns objects
    sensor_count: number;
    activeAlerts?: number;
    status?: 'Normal' | 'Warning' | 'Critical' | string;
    created_at: string;
    updated_at: string;
}

export interface SensorGroupCreateData {
    name: string;
    description?: string;
    sensor_ids?: string[];
    sensor_list?: Sensor[];
}

export interface SensorGroupUpdateData {
    name?: string;
    description?: string;
    sensor_ids?: string[];
}

export type SensorType = 'HALO_SMART' | 'HALO_3C' | 'HALO_IOT' | 'HALO_CUSTOM';

export interface SensorRegistrationData {
    name: string;
    sensor_type?: SensorType | string;
    location?: string;
    ip_address?: string;
    mac_address?: string;
    description?: string;
    area_id?: number;
    username?: string;
    password?: string;
}

export interface SensorConfig {
    id?: number; // Optional on creation
    sensor_name: string;
    sensor_type?: string;
    unit?: string;
    description?: string;
    enabled?: boolean;
    min_value?: number;
    threshold?: number;
    max_value?: number;
    recipients?: AlertRecipient[];
    actions?: AlertActionConfig;
    device?: number; // ID of the device
    created_at?: string;
    updated_at?: string;
}

export const SENSOR_CONFIG_CHOICES = [
    // Temperature & Humidity
    { value: 'temperature', label: 'Temperature' },
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
    head_id?: number | null; // ID of the head user
    head?: User | null; // Head user object
}

export interface UserCreateData {
    username: string;
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role: string;
    is_active?: boolean;
    head_id?: number | null;
    assigned_area_ids?: number[];
}

export interface UserUpdateData {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    is_active?: boolean;
    head_id?: number | null;
    assigned_area_ids?: number[];
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

// ============================================
// SENSOR READINGS & HEARTBEATS
// ============================================

export interface SensorReading {
    id: number;
    sensor_id: number;
    device_name: string;
    mac_address: string;
    timestamp: string;
    event_id?: number;
    [key: string]: any;
}

export interface HeartbeatLog {
    id: number;
    sensor_id: number;
    device_name: string;
    mac_address: string;
    is_online: boolean;
    device_timestamp: string;
    created_at: string;
}

// ============================================
// HALO DATA INGESTION
// ============================================

export interface HaloDataPayload {
    device_name: string;
    mac_address: string;
    ip_address: string;
    timestamp: string;
    sensor_data: Record<string, any>;
}

export interface HaloHeartbeatPayload {
    device_name: string;
    mac_address: string;
    ip_address: string;
    device_timestamp: string;
    is_online: boolean;
}

// ============================================
// MONITORING & HEALTH
// ============================================

export interface HeartbeatStatus {
    total_sensors: number;
    online_sensors: number;
    offline_sensors: number;
    last_update: string;
}

export interface DeviceHealth {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
}

// ============================================
// ALERTS
// ============================================

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed' | 'suspended';
export type AlertType = 'high_co2' | 'high_temperature' | 'high_humidity' | 'smoke_detected' |
    'motion_alert' | 'gunshot_detected' | 'aggression_detected' | 'aqi_warning' | 'sensor_offline' | 'custom';

export interface Alert {
    id: number;
    type: AlertType | string;
    status: AlertStatus;
    description: string;
    remarks?: string;
    sensor: number | {
        id: number;
        name: string;
    };
    sensor_name?: string;
    area: number | {
        id: number;
        name: string;
    };
    area_name?: string;
    user_acknowledged?: number | null;
    user_acknowledged_username?: string | null;
    time_of_acknowledgment?: string | null;
    created_at: string;
    updated_at: string;
}

export interface AlertCreateData {
    type: AlertType | string;
    status: AlertStatus;
    description: string;
    remarks?: string;
    sensor: number;
    area: number;
}

export interface AlertUpdateData {
    status?: AlertStatus;
    remarks?: string;
    user_acknowledged?: number;
}

export interface AlertFilters {
    type?: AlertType | string;
    status?: AlertStatus;
    sensor?: number;
    area?: number;
    search?: string;
}

export interface AlertTrendResponse {
    success: boolean;
    data: {
        period: '24h' | '7d';
        interval: 'hour' | 'day';
        chart_data: {
            labels: string[];
            values: number[];
        };
    };
}

export interface AlertTrendFilters {
    period: '24h' | '7d';
    type?: AlertType | string;
    status?: AlertStatus;
}

// ============================================
// ALERT CONFIGURATION
// ============================================

export interface AlertRecipient {
    id: number;
    type: 'user' | 'group';
    name?: string; // Optional for display
}

export interface AlertActionConfig {
    email: boolean;
    sms: boolean;
    push_notification: boolean;
    in_app: boolean;
}

export interface AlertConfiguration {
    id: number;
    parameter: string; // e.g., 'temp_c', 'co2' (matches SensorReadings keys)
    parameter_label: string; // e.g., 'Temperature (Celsius)'
    threshold_min?: number | null;
    threshold_max?: number | null;
    recipients: AlertRecipient[];
    actions: AlertActionConfig;
    enabled: boolean;
    created_at: string;
    updated_at: string;
    updated_by?: number; // User ID
}

export interface AlertConfigurationUpdateData {
    threshold_min?: number | null;
    threshold_max?: number | null;
    recipients?: AlertRecipient[];
    actions?: Partial<AlertActionConfig>;
    enabled?: boolean;
}
