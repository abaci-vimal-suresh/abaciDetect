import { SensorConfig } from '../../types/sensor';

/**
 * Metric status types:
 * - 'safe' | 'warning' | 'critical' (standard data states)
 * - 'success' | 'warning' | 'danger' (bootstrap color mapping)
 */
export type MetricStatus = 'safe' | 'warning' | 'critical';
export type BootstrapStatus = 'safe' | 'warning' | 'danger';

/**
 * Determines the status of a specific metric based on its value (HARDCODED defaults).
 * Centralizes thresholds used in Sentinel and other dashboard views.
 */
export const getMetricStatus = (metric: string, value: number): MetricStatus => {
    if (value === undefined || value === null) return 'safe';
    const m = metric.toLowerCase();

    switch (m) {
        case 'temp_c':
        case 'temperature':
            if (value >= 18 && value <= 26) return 'safe';
            if (value >= 15 && value <= 32) return 'warning';
            return 'critical';
        case 'humidity':
            if (value >= 30 && value <= 60) return 'safe';
            if (value >= 20 && value <= 75) return 'warning';
            return 'critical';
        case 'co2':
        case 'co2cal':
            if (value < 1000) return 'safe';
            if (value < 2000) return 'warning';
            return 'critical';
        case 'aqi':
            if (value <= 50) return 'safe';
            if (value <= 100) return 'warning';
            return 'critical';
        case 'tvoc':
            if (value < 500) return 'safe';
            if (value < 1500) return 'warning';
            return 'critical';
        case 'noise':
        case 'sound':
            if (value < 65) return 'safe';
            if (value < 85) return 'warning';
            return 'critical';
        case 'pm25':
        case 'pm2.5':
            if (value < 15) return 'safe';
            if (value < 35) return 'warning';
            return 'critical';
        case 'pm10':
        case 'pm10.0':
            if (value < 50) return 'safe';
            if (value < 150) return 'warning';
            return 'critical';
        case 'pm1':
        case 'pm1.0':
            if (value < 12) return 'safe';
            if (value < 35) return 'warning';
            return 'critical';
        case 'health_index':
            if (value >= 80) return 'safe';
            if (value >= 60) return 'warning';
            return 'critical';
        case 'gunshot':
            return value > 0 ? 'critical' : 'safe';
        case 'aggression':
            if (value === 0) return 'safe';
            if (value < 50) return 'warning';
            return 'critical';
        case 'motion':
            return value > 5 ? 'warning' : 'safe';
        case 'nh3':
            if (value < 0.2) return 'safe';
            if (value < 1.0) return 'warning';
            return 'critical';
        case 'co':
            if (value < 0.05) return 'safe';
            if (value < 0.2) return 'warning';
            return 'critical';
        case 'no2':
            if (value < 0.5) return 'safe';
            if (value < 1.5) return 'warning';
            return 'critical';
        default:
            return 'safe';
    }
};

/**
 * Determines the status of a sensor metric based on CONFIGURED thresholds.
 */
export const getMetricStatusFromConfig = (
    metricName: string,
    currentValue: number | undefined | null,
    configurations: SensorConfig[]
): BootstrapStatus => {
    if (currentValue === undefined || currentValue === null || isNaN(currentValue)) {
        return 'safe';
    }

    const config = configurations?.find(c =>
        c.sensor_name === metricName && c.enabled
    );

    if (!config || config.threshold === undefined) {
        return 'safe';
    }

    const { min_value, max_value, threshold } = config;

    // DANGER
    if (currentValue > threshold ||
        (min_value !== undefined && currentValue < min_value) ||
        (max_value !== undefined && currentValue > max_value)) {
        return 'danger';
    }

    // WARNING (80-100% of threshold)
    const thresholdPercentage = (currentValue / threshold) * 100;
    if (thresholdPercentage >= 80) {
        return 'warning';
    }

    return 'safe';
};

/**
 * Retrieves the configuration for a specific sensor metric.
 */
export const getConfigForMetric = (
    metricName: string,
    configurations: SensorConfig[]
): SensorConfig | undefined => {
    return configurations?.find(c =>
        c.sensor_name === metricName && c.enabled
    );
};

/**
 * Checks if a metric has an active configuration.
 */
export const hasActiveConfig = (
    metricName: string,
    configurations: SensorConfig[]
): boolean => {
    return getConfigForMetric(metricName, configurations) !== undefined;
};

/**
 * Returns the highest severity status from a list of statuses.
 */
export const getAggregatedStatus = (statuses: MetricStatus[]): MetricStatus => {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'safe';
};

/**
 * Gets the appropriate bootstrap color for a MetricStatus.
 */
export const getStatusColor = (status: MetricStatus | BootstrapStatus): string => {
    switch (status) {
        case 'safe':
            return 'success';
        case 'warning':
            return 'warning';
        case 'critical':
        case 'danger':
            return 'danger';
        default:
            return 'secondary';
    }
};

/**
 * Gets a human-readable status label.
 */
export const getStatusLabel = (status: MetricStatus | BootstrapStatus): string => {
    switch (status) {
        case 'safe':
            return 'Normal';
        case 'warning':
            return 'Warning';
        case 'critical':
        case 'danger':
            return 'Critical';
        default:
            return 'Unknown';
    }
};
