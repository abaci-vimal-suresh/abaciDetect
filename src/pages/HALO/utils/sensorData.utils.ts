import { Sensor } from '../../../types/sensor';

/**
 * Safely extracts a metric value from a sensor's data structure.
 */
export const getSensorMetricValue = (sensor: Sensor, key: string): any => {
    if (!sensor.sensor_data) return 0;

    // Handle nested structures
    if (typeof sensor.sensor_data === 'object') {
        const data = sensor.sensor_data as any;
        if (key in data) return data[key];
        if (data.sensors && key in data.sensors) {
            return data.sensors[key];
        }
    }
    return 0;
};

/**
 * Filters a list of sensors based on a search term and status filter.
 */
export const filterSensors = (
    sensors: Sensor[],
    searchTerm: string,
    filterStatus: 'all' | 'active' | 'inactive'
): Sensor[] => {
    const term = searchTerm.toLowerCase();

    return sensors.filter(sensor => {
        const matchesSearch =
            (sensor.name || '').toLowerCase().includes(term) ||
            sensor.mac_address?.toLowerCase().includes(term) ||
            sensor.sensor_type?.toLowerCase().includes(term);

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && sensor.is_active) ||
            (filterStatus === 'inactive' && !sensor.is_active);

        return matchesSearch && matchesStatus;
    });
};

/**
 * Gets all descendant area IDs for a given area (including the area itself).
 * This allows us to show sensors from child areas when viewing a parent area.
 */
const getAllDescendantAreaIds = (areaId: number, allAreas: any[]): number[] => {
    const result = [areaId];
    const children = allAreas.filter(area => area.parent_id === areaId);

    children.forEach(child => {
        result.push(...getAllDescendantAreaIds(child.id, allAreas));
    });

    return result;
};

/**
 * Gets sensors belonging to a specific area by ID or name.
 * Now includes sensors from all child/descendant areas.
 */
export const getSensorsByArea = (
    sensors: Sensor[],
    areaId?: string | number,
    areaName?: string,
    allAreas?: any[]
): Sensor[] => {
    if (!areaId && !areaName) return [];

    const targetId = Number(areaId);

    // Get all descendant area IDs if areas are provided
    const areaIds = allAreas
        ? getAllDescendantAreaIds(targetId, allAreas)
        : [targetId];

    return sensors.filter(sensor => {
        // Match by ID (including child areas)
        // Handle case where sensor.area is an object (with id) or a number (the id itself)
        const sensorAreaId = typeof sensor.area === 'object' && sensor.area !== null
            ? sensor.area.id
            : sensor.area;

        const finalAreaId = Number(sensorAreaId) || Number(sensor.area_id);

        if (areaId && areaIds.includes(finalAreaId)) {
            return true;
        }

        // Match by Name fallback
        if (!sensor.area && !sensor.area_id && areaName && sensor.area_name === areaName) {
            return true;
        }

        return false;
    });
};

/**
 * Gets sensors that have no area assigned.
 */
export const getAvailableSensors = (sensors: Sensor[]): Sensor[] => {
    return sensors.filter(sensor => !sensor.area && !sensor.area_name);
};

/**
 * Normalizes a sensor metric to a 0-100 scale.
 * 100 = Optimal/Healthy, 0 = Critical.
 */
export const normalizeSensorMetric = (key: string, value: number | null): number => {
    if (value === null || value === undefined) return 50; // Neutral if no data

    switch (key) {
        case 'temperature':
            // Optimal ~22°C. Drop 10 points for every degree away.
            return Math.max(0, 100 - Math.abs(value - 22) * 10);
        case 'humidity':
            // Optimal ~45%. Drop 2 points for every % away.
            return Math.max(0, 100 - Math.abs(value - 45) * 2);
        case 'co2':
            // Optimal < 600. 1200 is critical.
            return Math.max(0, Math.min(100, 100 - (value - 500) / 7));
        case 'pm25':
            // Optimal < 12. 50 is critical.
            return Math.max(0, Math.min(100, 100 - value * 2));
        case 'sound':
        case 'noise':
            // Optimal < 40dB. 85dB is critical.
            return Math.max(0, Math.min(100, 100 - (value - 40) * 2));
        case 'light':
            // Optimal 300-500 lux.
            if (value < 300) return Math.min(100, (value / 300) * 100);
            return Math.max(0, 100 - (value - 500) / 10);
        case 'aqi':
            // Optimal 0. 100 is unhealthy.
            return Math.max(0, 100 - value);
        case 'movement':
            // Utilization: Higher is "more active"
            return Math.min(100, value * 10);
        default:
            return 50;
    }
};

/**
 * Calculates a series of 6 scores for the Radar Chart based on aggregated data.
 */
export const calculateRadarSeries = (data: any) => {
    if (!data) return [0, 0, 0, 0, 0, 0];

    // Helper to get midpoint of min/max or just a value
    const getVal = (key: string) => {
        const min = data[`${key}_min`];
        const max = data[`${key}_max`];
        if (min != null && max != null) return (Number(min) + Number(max)) / 2;
        return Number(min || max || 0);
    };

    return [
        normalizeSensorMetric('temperature', getVal('temperature')),
        normalizeSensorMetric('co2', getVal('co2')),
        normalizeSensorMetric('pm25', getVal('pm25')),
        normalizeSensorMetric('sound', getVal('sound')),
        normalizeSensorMetric('light', getVal('light')),
        normalizeSensorMetric('aqi', getVal('aqi')),
    ];
};

/**
 * Calculates Radar Chart series for a specific metric group.
 * Returns two series: 'Min' and 'Max'.
 */
export const calculateGroupRadarSeries = (data: any, metrics: any[]) => {
    if (!data || !metrics) return { categories: [], series: [] };

    const categories = metrics.map(m => m.label);

    const minValues = metrics.map(m => {
        const val = data[`${m.key}_min`];
        return normalizeSensorMetric(m.key, val != null ? Number(val) : null);
    });

    const maxValues = metrics.map(m => {
        const val = data[`${m.key}_max`];
        return normalizeSensorMetric(m.key, val != null ? Number(val) : null);
    });

    return {
        categories,
        series: [
            { name: 'Min Range', data: minValues },
            { name: 'Max Range', data: maxValues }
        ]
    };
};


