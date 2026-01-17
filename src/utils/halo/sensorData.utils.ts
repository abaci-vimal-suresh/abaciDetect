import { Sensor } from '../../types/sensor';

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
            sensor.name.toLowerCase().includes(term) ||
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
 * Gets sensors belonging to a specific area by ID or name.
 */
export const getSensorsByArea = (
    sensors: Sensor[],
    areaId?: string | number,
    areaName?: string
): Sensor[] => {
    if (!areaId && !areaName) return [];

    return sensors.filter(sensor => {
        const targetId = Number(areaId);

        // Match by ID
        if (areaId && (Number(sensor.area?.id) === targetId || Number(sensor.area_id) === targetId)) {
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
