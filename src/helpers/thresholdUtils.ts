import { SensorConfig } from '../types/sensor';

/**
 * Metric status types for color coding
 */
export type MetricStatus = 'safe' | 'warning' | 'danger';

/**
 * Determines the status of a sensor metric based on configured thresholds
 * 
 * @param metricName - The sensor metric name (e.g., 'humidity', 'temp_c', 'tvoc')
 * @param currentValue - The current sensor reading value
 * @param configurations - Array of sensor threshold configurations
 * @returns MetricStatus - 'safe', 'warning', or 'danger'
 * 
 * Logic:
 * - DANGER: Value exceeds threshold OR outside min/max range
 * - WARNING: Value is 80-100% of threshold
 * - SAFE: Value is within acceptable range
 */
export const getMetricStatusFromConfig = (
    metricName: string,
    currentValue: number | undefined | null,
    configurations: SensorConfig[]
): MetricStatus => {
    // Handle invalid values
    if (currentValue === undefined || currentValue === null || isNaN(currentValue)) {
        return 'safe';
    }

    // Find active configuration for this metric
    const config = configurations?.find(c =>
        c.sensor_name === metricName && c.enabled
    );

    // No configuration found - return safe (will use hardcoded fallback in component)
    if (!config || config.threshold === undefined) {
        return 'safe';
    }

    const { min_value, max_value, threshold } = config;

    // DANGER CONDITIONS
    // 1. Value exceeds configured threshold
    if (currentValue > threshold) {
        return 'danger';
    }

    // 2. Value is below minimum acceptable value
    if (min_value !== undefined && currentValue < min_value) {
        return 'danger';
    }

    // 3. Value is above maximum acceptable value
    if (max_value !== undefined && currentValue > max_value) {
        return 'danger';
    }

    // WARNING CONDITION
    // Value is 80-100% of threshold (approaching limit)
    const thresholdPercentage = (currentValue / threshold) * 100;
    if (thresholdPercentage >= 80 && thresholdPercentage <= 100) {
        return 'warning';
    }

    // SAFE: Value is within acceptable range
    return 'safe';
};

/**
 * Retrieves the configuration for a specific sensor metric
 * 
 * @param metricName - The sensor metric name
 * @param configurations - Array of sensor threshold configurations
 * @returns SensorConfig or undefined if not found
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
 * Checks if a metric has an active configuration
 * 
 * @param metricName - The sensor metric name
 * @param configurations - Array of sensor threshold configurations
 * @returns boolean - true if configuration exists and is enabled
 */
export const hasActiveConfig = (
    metricName: string,
    configurations: SensorConfig[]
): boolean => {
    return getConfigForMetric(metricName, configurations) !== undefined;
};

/**
 * Calculates the percentage of current value relative to threshold
 * 
 * @param currentValue - The current sensor reading
 * @param threshold - The configured threshold value
 * @returns number - Percentage (0-100+)
 */
export const getThresholdPercentage = (
    currentValue: number,
    threshold: number
): number => {
    if (threshold === 0) return 0;
    return (currentValue / threshold) * 100;
};

/**
 * Gets a human-readable status label
 * 
 * @param status - The metric status
 * @returns string - Display label
 */
export const getStatusLabel = (status: MetricStatus): string => {
    switch (status) {
        case 'safe':
            return 'Normal';
        case 'warning':
            return 'Warning';
        case 'danger':
            return 'Critical';
        default:
            return 'Unknown';
    }
};

/**
 * Gets the appropriate color for a status
 * 
 * @param status - The metric status
 * @returns string - Bootstrap color name
 */
export const getStatusColor = (status: MetricStatus): string => {
    switch (status) {
        case 'safe':
            return 'success';
        case 'warning':
            return 'warning';
        case 'danger':
            return 'danger';
        default:
            return 'secondary';
    }
};
