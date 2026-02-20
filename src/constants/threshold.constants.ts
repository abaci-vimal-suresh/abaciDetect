import { SensorConfig } from '../types/sensor';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ThresholdManagementSectionProps {
    deviceId: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Sensor Defaults
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SENSOR_VALUES: Record<string, { min: number; max: number; threshold: number }> = {
    temperature: { min: 0, max: 50, threshold: 28 },
    temp_f: { min: 32, max: 122, threshold: 82 },
    humidity: { min: 0, max: 100, threshold: 65 },
    pm1: { min: 0, max: 1000, threshold: 35 },
    pm10: { min: 0, max: 1000, threshold: 50 },
    pm25: { min: 0, max: 1000, threshold: 35 },
    tvoc: { min: 0, max: 60000, threshold: 4000 },
    co2: { min: 400, max: 5000, threshold: 1200 },
    co: { min: 0, max: 50, threshold: 9 },
    no2: { min: 0, max: 1000, threshold: 100 },
    nh3: { min: 0, max: 1000, threshold: 50 },
    aqi: { min: 0, max: 500, threshold: 100 },
    pm10aqi: { min: 0, max: 500, threshold: 100 },
    pm25aqi: { min: 0, max: 500, threshold: 100 },
    coaqi: { min: 0, max: 500, threshold: 100 },
    no2aqi: { min: 0, max: 500, threshold: 100 },
    light: { min: 0, max: 10000, threshold: 5000 },
    pressure_hpa: { min: 900, max: 1100, threshold: 1050 },
    noise: { min: 30, max: 120, threshold: 85 },
    motion: { min: 0, max: 100, threshold: 50 },
    aggression: { min: 0, max: 100, threshold: 70 },
    gunshot: { min: 0, max: 1, threshold: 1 },
    health_index: { min: 0, max: 100, threshold: 40 },
    hi_co2: { min: 0, max: 100, threshold: 50 },
    hi_hum: { min: 0, max: 100, threshold: 50 },
    hi_pm1: { min: 0, max: 100, threshold: 50 },
    hi_pm10: { min: 0, max: 100, threshold: 50 },
    hi_pm25: { min: 0, max: 100, threshold: 50 },
    hi_tvoc: { min: 0, max: 100, threshold: 50 },
    hi_no2: { min: 0, max: 100, threshold: 50 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sensor Key → Event Source Key mapping
// ─────────────────────────────────────────────────────────────────────────────

export const SENSOR_KEY_TO_EVENT_SOURCE_KEY: Record<string, string> = {
    aggression: 'Aggression',
    aqi: 'AQI',
    co: 'CO',
    co2: 'CO2cal',
    gunshot: 'Gunshot',
    health_index: 'Health_Index',
    humidity: 'Humidity',
    light: 'Light',
    motion: 'Motion',
    nh3: 'NH3',
    no2: 'NO2',
    pm1: 'PM1',
    pm25: 'PM2.5',
    pm10: 'PM10',
    pressure_hpa: 'Pressure',
    temp_f: 'Temp_F',
    noise: 'Sound',
    temp_c: 'Temp_C',
    tvoc: 'TVOC',
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk config device / sub-type options
// ─────────────────────────────────────────────────────────────────────────────

export const BULK_DEVICE_TYPES = [
    { value: 'Halo', label: 'Halo' },
    { value: 'Axis', label: 'Axis' },
];

export const BULK_SUB_TYPES: Record<string, { value: string; label: string }[]> = {
    Halo: [
        { value: 'HALO', label: 'HALO' },
        { value: 'HALO_2C', label: 'HALO 2C' },
        { value: 'HALO_3C', label: 'HALO 3C' },
    ],
    Axis: [{ value: 'AXIS_CAMERA', label: 'Axis Camera' }],
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock / Demo data (used when API has no configs yet)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_CONFIGS: SensorConfig[] = [
    {
        id: 1,
        sensor_name: 'temperature',
        enabled: true,
        min_value: 0,
        max_value: 50,
        threshold: 28,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        sensor_name: 'humidity',
        enabled: true,
        min_value: 0,
        max_value: 100,
        threshold: 65,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        sensor_name: 'co2',
        enabled: false,
        min_value: 400,
        max_value: 5000,
        threshold: 1200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        sensor_name: 'pm25',
        enabled: true,
        min_value: 0,
        max_value: 1000,
        threshold: 35,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 5,
        sensor_name: 'tvoc',
        enabled: true,
        min_value: 0,
        max_value: 60000,
        threshold: 4000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const MOCK_SENSOR_DATA = {
    id: 'mock-sensor-1',
    sensor_data: {
        sensors: {
            temperature: 32.5, // Above threshold (28) - WARNING
            humidity: 58.2,    // Below threshold (65) - SAFE
            co2: 1450,         // Above threshold (1200) - WARNING
            pm25: 42,          // Above threshold (35) - WARNING
            tvoc: 350,         // Below threshold (4000) - SAFE
            light: 450,
            noise: 45,
            pm10: 45,
            pressure_hpa: 1013,
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Default form state
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_FORM_DATA: Partial<SensorConfig> = {
    sensor_name: 'temperature',
    event_id: 'temperature',
    min_value: 0,
    max_value: 50,
    threshold: 28,
    enabled: true,
    led_color: 16777215,  // White
    led_pattern: 200004,
    led_priority: 1,
    relay1: 0,
    sound: '',
    source: '',
    pause_minutes: 0,
    bn_instance: 0,
};
