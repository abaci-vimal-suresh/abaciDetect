import { Area } from '../../../types/sensor';

export const METRIC_MAP: Record<string, { config: string; agg: string; unit: string; label: string }> = {
    temperature: { config: 'temp_c', agg: 'temperature', unit: '°C', label: 'Temperature' },
    humidity: { config: 'Humidity', agg: 'humidity', unit: '%', label: 'Humidity' },
    pressure: { config: 'Pressure', agg: 'pressure', unit: 'hPa', label: 'Pressure' },
    light: { config: 'Light', agg: 'light', unit: 'lux', label: 'Light' },
    co2: { config: 'CO2cal', agg: 'co2', unit: 'ppm', label: 'CO₂' },
    tvoc: { config: 'TVOC', agg: 'tvoc', unit: 'ppb', label: 'TVOC' },
    pm1: { config: 'PM1', agg: 'pm1', unit: 'µg/m³', label: 'PM1' },
    pm25: { config: 'PM2.5', agg: 'pm25', unit: 'µg/m³', label: 'PM2.5' },
    pm10: { config: 'PM10', agg: 'pm10', unit: 'µg/m³', label: 'PM10' },
    nh3: { config: 'NH3', agg: 'nh3', unit: 'ppm', label: 'NH₃' },
    no2: { config: 'NO2', agg: 'no2', unit: 'ppb', label: 'NO₂' },
    co: { config: 'CO', agg: 'co', unit: 'ppm', label: 'CO' },
    noise: { config: 'Sound', agg: 'noise', unit: 'dB', label: 'Noise' },
    movement: { config: 'Tamper', agg: 'movement', unit: 'mm/s', label: 'Movement' },
    health: { config: 'Health_Index', agg: 'health', unit: 'score', label: 'Health Index' },
    aqi: { config: 'AQI', agg: 'aqi', unit: 'index', label: 'AQI' },
};

export const EVENT_METRIC_KEYS = ['panic', 'acc_x', 'acc_y', 'acc_z'];

export const EVENT_MAP: Record<string, { config: string; label: string }> = {
    panic: { config: 'Panic', label: 'Panic Alert' },
    gunshot: { config: 'Gunshot', label: 'Gunshot' },
    help: { config: 'Help', label: 'Help Button' },
    tamper: { config: 'Tamper', label: 'Tamper' },
    masking: { config: 'Masking', label: 'Masking' },
    vape: { config: 'Vape', label: 'Vape Detection' },
    smoking: { config: 'Smoking', label: 'Smoking' },
};

export interface ThresholdEntry {
    min: number;
    max: number;
    source?: string;
    source_display?: string | null;
}

export type ConfigData = Record<string, ThresholdEntry>;

// ── Walk up parent chain to find nearest non-empty config ─────────────────────
export const getEffectiveConfig = (
    area: Area | undefined,
    areas: Area[] | undefined,
): ConfigData => {
    if (!area) return {};
    if (area.config_data && Object.keys(area.config_data).length > 0) {
        return area.config_data as ConfigData;
    }
    if (area.parent_id && areas) {
        const parent = areas.find(a => a.id === area.parent_id);
        return getEffectiveConfig(parent, areas);
    }
    return {};
};

// Skip: null values, both min+max = 0, event-type keys
export const isValidMetric = (
    key: string,
    aggData: Record<string, number | null>,
): boolean => {
    if (EVENT_METRIC_KEYS.includes(key)) return false;
    const min = aggData[`${key}_min`];
    const max = aggData[`${key}_max`];
    if (min === null || max === null || min === undefined || max === undefined) return false;
    if (min === 0 && max === 0) return false;
    return true;
};

export const IN_HG_TO_HPA = 33.8639;

// ── Normalize value to 0–100% of threshold range ─────────────────────────────
export const normalizeMetric = (value: number, minThreshold: number, maxThreshold: number): number => {
    if (maxThreshold === minThreshold) return value > maxThreshold ? 100 : 0;
    const range = maxThreshold - minThreshold;
    const normalized = ((value - minThreshold) / range) * 100;
    return normalized; // Return raw normalized % (can be > 100 or < 0 for mismatch detection)
};

// ── Color based on normalized % ───────────────────────────────────────────────
export const getStatusColor = (normalizedValue: number, isMismatch?: boolean): string => {
    if (isMismatch) return '#9ca3af';             // Gray — unit mismatch / setup needed
    if (normalizedValue >= 90) return '#ef4444'; // Red — critical
    if (normalizedValue >= 70) return '#f59e0b'; // Amber — warning
    return '#10b981';                            // Green — safe
};

export const getStatusColorClass = (normalizedValue: number, isMismatch?: boolean): string => {
    if (isMismatch) return 'secondary';
    if (normalizedValue >= 90) return 'danger';
    if (normalizedValue >= 70) return 'warning';
    return 'success';
};

// ── Processed metric ready for display ───────────────────────────────────────
export interface ProcessedMetric {
    key: string;
    label: string;
    unit: string;
    rawMin: number;
    rawMax: number;
    thresholdMin: number;
    thresholdMax: number;
    normalizedValue: number;
    statusColor: string;
    statusColorClass: string;
    hasThreshold: boolean;
    isScaleMismatch: boolean; // New: Flag for unit mismatches
    isAutoConverted?: boolean; // New: Flag for auto-converted units (e.g. pressure)
}

export const buildProcessedMetrics = (
    aggData: Record<string, number | null>,
    config: ConfigData,
    filterKeys?: string[],
): ProcessedMetric[] => {
    const keys = filterKeys || Object.keys(METRIC_MAP);

    return keys.reduce<ProcessedMetric[]>((acc, key) => {
        if (!isValidMetric(key, aggData)) return acc;
        const mapping = METRIC_MAP[key];
        if (!mapping) return acc;

        const rawMin = aggData[`${key}_min`] as number;
        const rawMax = aggData[`${key}_max`] as number;
        const threshold = config[mapping.config];

        const hasThreshold = !!threshold;
        let thresholdMin = threshold?.min ?? 0;
        let thresholdMax = threshold?.max ?? rawMax * 2;
        let isAutoConverted = false;

        // Pressure Unit Sniffer: if config looks like inHg (< 100) but reading is hPa (> 400)
        if (key === 'pressure' && hasThreshold && thresholdMax < 100 && rawMax > 400) {
            thresholdMin *= IN_HG_TO_HPA;
            thresholdMax *= IN_HG_TO_HPA;
            isAutoConverted = true;
        }

        const rawNormalized = normalizeMetric(rawMax, thresholdMin, thresholdMax);

        // Heuristic: If reading is > 4x the threshold max, or drastically below min, it's likely a unit mismatch
        // If we auto-converted, we trust the scale more, so we lower the flag unless it's still way off
        const isScaleMismatch = hasThreshold && !isAutoConverted && (rawNormalized > 400 || rawNormalized < -200);

        // Clamp for UI gauge display
        const clampedNormalized = Math.min(Math.max(rawNormalized, 0), 100);

        acc.push({
            key,
            label: mapping.label,
            unit: mapping.unit,
            rawMin,
            rawMax,
            thresholdMin,
            thresholdMax,
            normalizedValue: clampedNormalized,
            statusColor: getStatusColor(rawNormalized, isScaleMismatch),
            statusColorClass: getStatusColorClass(rawNormalized, isScaleMismatch),
            hasThreshold,
            isScaleMismatch,
            isAutoConverted,
        });

        return acc;
    }, []);
};

// ── Event status for detection panel ─────────────────────────────────────────
export interface EventStatus {
    key: string;
    label: string;
    triggered: boolean;
}

export const buildEventStatuses = (aggData: Record<string, number | null>): EventStatus[] => {
    return Object.entries(EVENT_MAP).reduce<EventStatus[]>((acc, [key, { label }]) => {
        const max = aggData[`${key}_max`];
        if (max === null || max === undefined) return acc;
        acc.push({ key, label, triggered: max > 0 });
        return acc;
    }, []);
};