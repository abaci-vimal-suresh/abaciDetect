export interface BackendSensor {
    id: number;
    name: string;
    mac_address: string;
    ip_address?: string;
    status?: string;
    is_active?: boolean;
    area?: number;
    subarea_id?: number;
}

export interface BackendSensorReading {
    id: number;
    mac_address: string;
    timestamp: string;
    sensors: SensorReadings;
}

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

export interface SensorLogEnvironmental {
    id: number;
    temperature_c: number;
    humidity_percent: number;
    light_lux: number;
    hg_mic: number;
    lg_mic: number;
    sound_db: number | null;
    pressure_hpa: number;
}

export interface SensorLogAir {
    id: number;
    tvoc: number;
    co2_eq: number;
    co2_cal: number;
    pm1: number;
    pm25: number;
    pm10: number;
    nh3: number;
    no2: number;
    co: number;
}

export interface SensorLogDerived {
    id: number;
    aqi: number;
    movement: number;
    motion: number;
    noise_db: number | null;
    gunshot: number;
    health_index: number;
    aggression: number;
}

export interface SensorLogOthers {
    id: number;
    acc_x: number;
    acc_y: number;
    acc_z: number;
    help: number | null;
    input: number;
    panic: number;
}

export interface SensorLog {
    id: number;
    sensor: number;
    sensor_name: string;
    area: number | null;
    readings_environmental: SensorLogEnvironmental;
    readings_air: SensorLogAir;
    readings_derived: SensorLogDerived;
    others: SensorLogOthers;
    recorded_at: string;
}

export interface SensorLogResponse {
    count: number;
    results: SensorLog[];
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
    // area?: Area | null;
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

    // Backend Coordinates (Direct Mapping)
    x_val?: number;
    y_val?: number;
    z_val?: number;

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
        boundary_opacity_val?: number;
    };

    // Backend Boundary (Direct Mapping)
    x_min?: number;
    x_max?: number;
    y_min?: number;
    y_max?: number;
    z_min?: number;
    z_max?: number;
    boundary_opacity_val?: number;

    // Spherical properties
    radius?: number;
    hemisphere_opacity_val?: number;

    // NEW: 3D and Multi-floor support
    area_id?: number; // ✅ Foreign key to Area.id
    floor_level?: number; // Which floor this sensor is on

    // Backend Area ID
    area?: number | Area | null; // Can be ID or object depending on endpoint

    // Personnel Information
    personnel_in_charge?: string;     // Name of responsible person
    personnel_contact?: string;        // Contact phone number
    personnel_email?: string;
    sensor_group_ids?: number[];
    username?: string;
    password?: string;
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
    area_plan?: string; // ✅ Backend field for floor plan image
    floor_plan_image?: string;
    floor_plan_url?: string; // ✅ NEW: For uploaded floor plan persistence
    floor_plan_width?: number;
    floor_plan_height?: number;
    polygon_coords?: number[][];
    boundary?: { x_min: number; x_max: number; y_min: number; y_max: number };

    // NEW: Multi-floor support
    floor_level?: number | null; // e.g., 0 = ground, 1 = first floor, -1 = basement
    floor_height?: number; // Height of this floor in pixels (default: 200)
    is_room?: boolean; // True if this represents a physical room (has boundaries)

    // NEW: 3D Visualization metadata
    color?: string; // Room color for 3D view
    wall_opacity?: number;
    show_walls?: boolean;
    person_in_charge_ids?: number[]; // ✅ NEW: Link areas to multiple users

    // NEW: 3D Positioning (Matches backend)
    offset_x?: number;
    offset_y?: number;
    offset_z?: number;
    scale_factor?: number;
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
    username?: string;
    password?: string;
    area_id?: number;
}

export interface SensorUpdatePayload {
    id?: number | string;
    name?: string;
    sensor_id?: string;
    sensor_type?: string;
    description?: string;
    is_active?: boolean;
    is_online?: boolean;
    username?: string;
    password?: string;
    sensor_group_ids?: number[];
    area_id?: number | null;
    area?: number | null;
    x_coordinate?: number;
    y_coordinate?: number;
    z_coordinate?: number;
    x_val?: number | null;
    y_val?: number | null;
    z_val?: number | null;
    x_min?: number;
    y_min?: number;
    x_max?: number;
    y_max?: number;
    z_min?: number;
    z_max?: number;
    boundary_opacity_val?: number;
    radius?: number;
    hemisphere_opacity_val?: number;
    boundary?: {
        x_min: number;
        y_min: number;
        x_max: number;
        y_max: number;
        z_min?: number;
        z_max?: number;
    };
}

export interface SensorConfig {
    id?: number; // Database ID
    sensor_name?: string; // Keep for legacy/mock (now optional)
    event_id?: string; // Backend key for sensor/event name
    halo_sensor?: number; // Backend sensor ID
    bn_instance?: number; // Backend instance number
    enabled?: boolean;
    min_value?: number;
    threshold?: number;
    max_value?: number;

    // LED & Audio
    led_color?: number; // Decimal color code
    led_pattern?: number;
    led_priority?: number; // 1-8
    sound?: string;

    // Actions & Timing
    relay1?: number; // seconds
    pause_minutes?: number; // minutes
    source?: string;
    conditions?: string;

    // Legacy mapping (to be removed once fully migrated)
    ledclr?: number;
    ledpat?: number;
    ledprority?: number;
    relay?: number;
    pause?: number;

    unit?: string;
    description?: string;
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

// ============================================
// ALERT FILTERS & ACTIONS
// ============================================

export interface Action {
    id: number;
    name: string;
    type: 'email' | 'sms' | 'push_notification' | 'webhook' | 'device_notification' | 'n8n_workflow' | 'slack' | 'teams' | 'custom';
    recipients: number[];
    user_groups?: number[];
    device_type?: 'HALO' | 'HALO_SMART' | 'HALO_IOT';
    device_list?: string;
    http_method?: 'GET' | 'POST' | 'PUT';
    webhook_url?: string;
    message_type?: string;
    message_template: string;
    is_active: boolean;

    // N8N Workflow specific fields
    n8n_workflow_url?: string;
    n8n_workflow_id?: string;
    n8n_api_key?: string;
    n8n_auth_header?: string; // Default: 'X-API-Key'
    n8n_timeout?: number; // Default: 30 seconds

    created_by?: number;
    created_at: string;
    updated_at: string;
}

export interface AlertFilter {
    id: number;
    name: string;
    description: string;
    area_ids: number[];
    sensor_config_ids: number[];
    alert_types?: string[]; // NEW: Multiple choices for alert types
    source_types?: string[]; // NEW: Multiple choices for source types
    action_for_min: boolean;
    action_for_max: boolean;
    action_for_threshold: boolean;
    sensor_group_ids?: number[]; // Optional
    action_ids?: number[]; // IDs for save
    weekdays?: number[]; // 0-6 (Mon-Sun)
    start_time?: string; // HH:MM
    end_time?: string; // HH:MM
    created_at: string;
    updated_at: string;

    // Rich data objects from API (GET responses)
    area_list?: Area[];
    sensor_groups?: SensorGroup[];
    actions?: Action[];

    // Legacy fields (to be kept for backward compatibility if needed)
    alert_type?: string;
    is_direct_device_alert?: boolean;
    is_custom_alert_filter?: boolean;
}

export const ALERT_TYPE_CHOICES = [
    { value: 'sensor_offline', label: 'Sensor Offline' },
    { value: 'threshold_exceeded', label: 'Threshold Exceeded' },
    { value: 'anomaly_detected', label: 'Anomaly Detected' },
    { value: 'device_error', label: 'Device Error' },
    { value: 'high_air_quality', label: 'High Air Quality' },
    { value: 'motion_detected', label: 'Motion Detected' },
    { value: 'aggression_detected', label: 'Aggression Detected' },
    { value: 'gunshot_detected', label: 'Gunshot Detected' },
    { value: 'other', label: 'Other' },
    { value: 'temp_c', label: 'Temperature (Celsius)' },
    { value: 'temp_f', label: 'Temperature (Fahrenheit)' },
    { value: 'humidity', label: 'Humidity (%)' },
    { value: 'light', label: 'Light Level (lux)' },
    { value: 'pressure_hpa', label: 'Atmospheric Pressure (hPa)' },
    { value: 'noise', label: 'Noise Level (dB)' },

    // Air quality sensors
    { value: 'tvoc', label: 'Total Volatile Organic Compounds' },
    { value: 'co2', label: 'Carbon Dioxide (ppm)' },
    { value: 'co2_cal', label: 'CO2 Calibrated' },
    { value: 'co2_eq', label: 'CO2 Equivalent' },
    { value: 'nh3', label: 'Ammonia (ppb)' },
    { value: 'no2', label: 'Nitrogen Dioxide (ppb)' },
    { value: 'co', label: 'Carbon Monoxide (ppm)' },

    // Particulate matter sensors
    { value: 'pm1', label: 'Particulate Matter 1µm' },
    { value: 'pm10', label: 'Particulate Matter 10µm' },
    { value: 'pm25', label: 'Particulate Matter 2.5µm' },

    // Air quality index
    { value: 'aqi', label: 'Air Quality Index' },
    { value: 'pm10aqi', label: 'PM10 AQI' },
    { value: 'pm25aqi', label: 'PM2.5 AQI' },
    { value: 'coaqi', label: 'CO AQI' },
    { value: 'no2aqi', label: 'NO2 AQI' },

    // Derived metrics
    { value: 'motion', label: 'Motion Detection' },
    { value: 'aggression', label: 'Aggression Detection' },
    { value: 'gunshot', label: 'Gunshot Detection' },
    { value: 'health_index', label: 'Overall Health Index' },
    { value: 'hi_co2', label: 'CO2 Health Index' },
    { value: 'hi_hum', label: 'Humidity Health Index' },
    { value: 'hi_pm1', label: 'PM1 Health Index' },
    { value: 'hi_pm10', label: 'PM10 Health Index' },
    { value: 'hi_pm25', label: 'PM2.5 Health Index' },
    { value: 'hi_tvoc', label: 'TVOC Health Index' },
    { value: 'hi_no2', label: 'NO2 Health Index' },

    // Accelerometer
    { value: 'acc_x', label: 'Accelerometer X' },
    { value: 'acc_y', label: 'Accelerometer Y' },
    { value: 'acc_z', label: 'Accelerometer Z' },

    // Other readings
    { value: 'help', label: 'Help/Emergency Button' },
    { value: 'input', label: 'Input/External Trigger' },
    { value: 'panic', label: 'Panic Button' },
];

export const ALERT_SOURCE_CHOICES = [
    { value: 'Internal', label: 'Internal System' },
    { value: 'External', label: 'External System' },
    { value: 'Manual', label: 'Manual Entry' },
];

// ============================================
// N8N WORKFLOW INTEGRATION
// ============================================

export interface N8NAlertPayload {
    // Webhook metadata
    payload_version: string; // e.g., "1.0"
    timestamp: string; // ISO 8601
    source: string; // "HALO Alert System"

    // Alert information
    alert: {
        id: number;
        type: AlertType | string;
        severity: 'critical' | 'warning' | 'info';
        status: AlertStatus;
        description: string;
        remarks?: string;
        created_at: string;
        updated_at: string;
        value?: number | string; // Threshold violation value
    };

    // Sensor context
    sensor: {
        id: number;
        name: string;
        type?: string;
        mac_address?: string;
        ip_address?: string;
        location?: string;
        is_online?: boolean;
        last_heartbeat?: string | null;
    };

    // Area context
    area: {
        id: number;
        name: string;
        area_type?: string;
        parent_area?: {
            id: number;
            name: string;
        } | null;
    };

    // Alert filter context
    filter: {
        id: number;
        name: string;
        description?: string;
        threshold_min?: number;
        threshold_max?: number;
        trigger_condition: 'min_violation' | 'max_violation' | 'threshold_violation';
    };

    // Action metadata
    action: {
        id: number;
        name: string;
        type: string;
        workflow_id?: string;
    };

    // Additional sensor readings (if available)
    sensor_readings?: {
        temperature?: number;
        humidity?: number;
        co2?: number;
        aqi?: number;
        [key: string]: any;
    };
}
