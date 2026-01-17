export type MetricStatus = 'safe' | 'warning' | 'critical';

/**
 * Determines the status of a specific metric based on its value.
 * centralizes thresholds used in Sentinel and other dashboard views.
 */
export const getMetricStatus = (metric: string, value: number): MetricStatus => {
    if (value === undefined || value === null) return 'safe';
    const m = metric.toLowerCase();

    switch (m) {
        case 'temp_c':
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
            if (value < 65) return 'safe';
            if (value < 85) return 'warning';
            return 'critical';
        case 'pm25':
            if (value < 15) return 'safe';
            if (value < 35) return 'warning';
            return 'critical';
        case 'pm10':
            if (value < 50) return 'safe';
            if (value < 150) return 'warning';
            return 'critical';
        case 'pm1':
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
        default:
            return 'safe';
    }
};

/**
 * Returns the highest severity status from a list of statuses.
 */
export const getAggregatedStatus = (statuses: MetricStatus[]): MetricStatus => {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'safe';
};
