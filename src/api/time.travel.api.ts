import { useQuery } from '@tanstack/react-query';
import { publicAxios as axiosInstance } from '../axiosInstance';

// Types
export interface TimeTravelRequest {
    start_time: string;
    end_time: string;
    sensor_ids: number[];
}

export interface SensorReading {
    timestamp: string;
    value: number;
    unit: string;
}

export interface TimeTravelSensor {
    id: number;
    name: string;
    code: string;
    sensor_type: string;
    unit: string;
    location?: string;
    readings: SensorReading[];
    current_value?: number;
    timestamp?: string;
}

export interface TimeTravelData {
    start_time: string;
    end_time: string;
    sensors: TimeTravelSensor[];
}



const generateHistoricalReadings = (
    baseValue: number,
    variance: number,
    startTime: Date,
    endTime: Date,
    intervalMinutes: number = 3
): SensorReading[] => {
    const readings: SensorReading[] = [];
    const totalDuration = endTime.getTime() - startTime.getTime();
    const intervalMs = intervalMinutes * 60 * 1000;
    const numReadings = Math.floor(totalDuration / intervalMs);

    for (let i = 0; i <= numReadings; i++) {
        const timestamp = new Date(startTime.getTime() + i * intervalMs);
        
        const timeProgress = i / numReadings;
        const sineWave = Math.sin(timeProgress * Math.PI * 4) * variance * 0.5;
        const randomNoise = (Math.random() - 0.5) * variance * 0.5;
        const value = baseValue + sineWave + randomNoise;

        readings.push({
            timestamp: timestamp.toISOString(),
            value: Number(value.toFixed(2)),
            unit: ''
        });
    }

    return readings;
};

const mockAvailableSensors = [
    { id: 1, name: 'Assembly Temp Monitor', code: 'TEMP-AL-001', sensor_type: 'temperature', location: 'Assembly Line A', unit: '°C' },
    { id: 2, name: 'Assembly Humidity', code: 'HUM-AL-002', sensor_type: 'humidity', location: 'Assembly Line A', unit: '%' },
    { id: 3, name: 'Air Quality Monitor', code: 'AIR-AL-003', sensor_type: 'air_quality', location: 'Assembly Line A', unit: 'AQI' },
    { id: 4, name: 'Noise Level Monitor', code: 'NOISE-AL-004', sensor_type: 'noise', location: 'Assembly Line A', unit: 'dB' },
    { id: 5, name: 'Power Usage Monitor', code: 'PWR-AL-005', sensor_type: 'power', location: 'Assembly Line A', unit: 'kW' },
    { id: 6, name: 'Warehouse Temp A1', code: 'TEMP-WH-001', sensor_type: 'temperature', location: 'Warehouse Zone A', unit: '°C' },
    { id: 7, name: 'Warehouse Humidity B2', code: 'HUM-WH-002', sensor_type: 'humidity', location: 'Warehouse Zone B', unit: '%' },
    { id: 8, name: 'Office Floor 1 Temp', code: 'TEMP-OF-001', sensor_type: 'temperature', location: 'Office Floor 1', unit: '°C' },
    { id: 9, name: 'Office Air Quality', code: 'AIR-OF-002', sensor_type: 'air_quality', location: 'Office Floor 2', unit: 'AQI' },
    { id: 10, name: 'Data Center Temp', code: 'TEMP-DC-001', sensor_type: 'temperature', location: 'Server Rack A', unit: '°C' },
];

const generateMockTimeTravelData = (request: TimeTravelRequest): TimeTravelData => {
    const startTime = new Date(request.start_time);
    const endTime = new Date(request.end_time);

    // Base values and variance for different sensor types
    const sensorConfigs: Record<string, { base: number; variance: number; unit: string }> = {
        temperature: { base: 24.5, variance: 4, unit: '°C' },
        humidity: { base: 60, variance: 10, unit: '%' },
        air_quality: { base: 45, variance: 15, unit: 'AQI' },
        noise: { base: 65, variance: 12, unit: 'dB' },
        power: { base: 4.2, variance: 1.5, unit: 'kW' },
        light: { base: 450, variance: 100, unit: 'lux' },
    };

    const sensors: TimeTravelSensor[] = request.sensor_ids.map(sensorId => {
        const sensorInfo = mockAvailableSensors.find(s => s.id === sensorId);
        if (!sensorInfo) {
            throw new Error(`Sensor ${sensorId} not found`);
        }

        const config = sensorConfigs[sensorInfo.sensor_type] || { base: 50, variance: 10, unit: 'units' };
        const readings = generateHistoricalReadings(
            config.base,
            config.variance,
            startTime,
            endTime,
            3 // 3-minute intervals
        );

        return {
            id: sensorInfo.id,
            name: sensorInfo.name,
            code: sensorInfo.code,
            sensor_type: sensorInfo.sensor_type,
            unit: config.unit,
            location: sensorInfo.location,
            readings: readings
        };
    });

    return {
        start_time: request.start_time,
        end_time: request.end_time,
        sensors
    };
};



const USE_MOCK_DATA = true; // Toggle for development


export const useTimeTravelSensors = () => {
    return useQuery({
        queryKey: ['timetravel', 'sensors'],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                return mockAvailableSensors;
            }
            const { data } = await axiosInstance.get('/timetravel/sensors/');
            return data;
        },
    });
};

/**
 * Get historical data for time travel playback
 */
export const useTimeTravelData = (request: TimeTravelRequest) => {
    return useQuery({
        queryKey: ['timetravel', 'data', request],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 800));
                return generateMockTimeTravelData(request);
            }
            const { data } = await axiosInstance.post('/timetravel/data/', request);
            return data as TimeTravelData;
        },
        enabled: request.sensor_ids.length > 0,
        // Don't refetch automatically since this is historical data
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Get sensor reading at a specific point in time
 */
export const useSensorAtTime = (sensorId: number, timestamp: string) => {
    return useQuery({
        queryKey: ['timetravel', 'sensor', sensorId, timestamp],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                
                const sensorInfo = mockAvailableSensors.find(s => s.id === sensorId);
                if (!sensorInfo) return null;

                const config = {
                    temperature: { base: 24.5, variance: 4, unit: '°C' },
                    humidity: { base: 60, variance: 10, unit: '%' },
                    air_quality: { base: 45, variance: 15, unit: 'AQI' },
                    noise: { base: 65, variance: 12, unit: 'dB' },
                    power: { base: 4.2, variance: 1.5, unit: 'kW' },
                }[sensorInfo.sensor_type] || { base: 50, variance: 10, unit: 'units' };

                return {
                    sensor_id: sensorId,
                    timestamp: timestamp,
                    value: config.base + (Math.random() - 0.5) * config.variance,
                    unit: config.unit
                };
            }
            const { data } = await axiosInstance.get(`/timetravel/sensor/${sensorId}/`, {
                params: { timestamp }
            });
            return data;
        },
        enabled: !!sensorId && !!timestamp,
    });
};

/**
 * Get comparison data between two time periods
 */
export const useTimeTravelCompare = (
    sensorId: number,
    period1: { start: string; end: string },
    period2: { start: string; end: string }
) => {
    return useQuery({
        queryKey: ['timetravel', 'compare', sensorId, period1, period2],
        queryFn: async () => {
            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 600));
                
                const sensorInfo = mockAvailableSensors.find(s => s.id === sensorId);
                if (!sensorInfo) return null;

                const config = {
                    temperature: { base: 24.5, variance: 4 },
                    humidity: { base: 60, variance: 10 },
                    air_quality: { base: 45, variance: 15 },
                }[sensorInfo.sensor_type] || { base: 50, variance: 10 };

                return {
                    sensor_id: sensorId,
                    period1: {
                        ...period1,
                        avg_value: config.base + (Math.random() - 0.5) * config.variance,
                        min_value: config.base - config.variance,
                        max_value: config.base + config.variance,
                    },
                    period2: {
                        ...period2,
                        avg_value: config.base + (Math.random() - 0.5) * config.variance,
                        min_value: config.base - config.variance,
                        max_value: config.base + config.variance,
                    }
                };
            }
            const { data } = await axiosInstance.post('/timetravel/compare/', {
                sensor_id: sensorId,
                period1,
                period2
            });
            return data;
        },
        enabled: !!sensorId,
    });
};

/**
 * Export time travel data
 */
export const useExportTimeTravelData = () => {
    return async (request: TimeTravelRequest, format: 'csv' | 'json') => {
        if (USE_MOCK_DATA) {
            const data = generateMockTimeTravelData(request);
            
            if (format === 'json') {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `timetravel_${Date.now()}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else if (format === 'csv') {
                // Generate CSV
                let csv = 'Timestamp,Sensor,Value,Unit\n';
                data.sensors.forEach(sensor => {
                    sensor.readings.forEach(reading => {
                        csv += `${reading.timestamp},${sensor.name},${reading.value},${sensor.unit}\n`;
                    });
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `timetravel_${Date.now()}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
            return;
        }

        const { data } = await axiosInstance.post('/timetravel/export/', {
            ...request,
            format
        }, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetravel_${Date.now()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate time difference in human-readable format
 */
export const getTimeDifference = (time1: Date, time2: Date): string => {
    const diff = Math.abs(time2.getTime() - time1.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

/**
 * Format timestamp relative to current time
 */
export const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 0) {
        return 'In the future';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
        return `${minutes} minutes ago`;
    }
    return `${hours} hours ${minutes} minutes ago`;
};