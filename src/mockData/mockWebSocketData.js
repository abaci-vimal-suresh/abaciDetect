// Mock WebSocket Data Generator for Sensor_4
// This utility generates realistic sensor data updates for testing real-time WebSocket integration

/**
 * Generates random sensor data that mimics real sensor_4 emissions
 * @returns {Object} Sensor data object matching the expected WebSocket message format
 */
export const generateMockSensor4Data = () => {
    const baseTemp = 22;
    const baseHumidity = 60;
    const baseCO2 = 800;
    const baseAQI = 50;

    // Add realistic variations
    const temp_c = +(baseTemp + (Math.random() * 6 - 3)).toFixed(1);
    const temp_f = +(temp_c * 9 / 5 + 32).toFixed(1);
    const humidity = +(baseHumidity + (Math.random() * 20 - 10)).toFixed(1);
    const co2 = Math.floor(baseCO2 + (Math.random() * 400 - 200));
    const aqi = Math.floor(baseAQI + (Math.random() * 100 - 20));
    const pm25 = Math.floor(10 + Math.random() * 40);
    const pm10 = Math.floor(pm25 + Math.random() * 20);
    const pm1 = Math.floor(pm25 * 0.8);

    return {
        id: '4',
        sensor_id: '4',
        device_id: '4',
        name: 'Sensor_4 - Real-time Test',
        device_name: 'Halo_Sensor_4',
        mac_address: 'B0:B3:53:D1:A0:CF',
        ip_address: '192.168.1.104',
        location: 'Test Lab',
        is_active: true,
        sensor_type: 'Multi-Sensor',
        status: 'Active',
        timestamp: new Date().toISOString(),
        type: 'sensor_update', // Event type
        message: 'Sensor data updated',

        sensor_data: {
            ip: '192.168.1.104',
            mac: 'B0:B3:53:D1:A0:CF',
            device: 'Halo_Sensor_4',
            room: 'Test Lab',
            time: new Date().toLocaleString(),
            event: 'air_quality',
            source: 'Environmental',

            sensors: {
                // Temperature
                temp_c,
                temp_f,

                // Humidity
                humidity,

                // Air Quality
                aqi,
                pm1,
                pm25,
                pm10,
                pm25aqi: Math.floor(pm25 * 2.5),
                pm10aqi: Math.floor(pm10 * 1.5),

                // Gases
                co2,
                co: +(Math.random() * 0.1).toFixed(2),
                no2: +(Math.random() * 2).toFixed(1),
                nh3: +(Math.random() * 0.5).toFixed(1),
                tvoc: Math.floor(Math.random() * 50),
                coaqi: Math.floor(Math.random() * 10),
                no2aqi: Math.floor(Math.random() * 20),

                // Environmental
                pressure_hpa: +(1000 + Math.random() * 20).toFixed(1),
                light: +(Math.random() * 100).toFixed(2),

                // Sound
                noise: +(50 + Math.random() * 30).toFixed(1),
                gunshot: 0,
                aggression: +(Math.random() * 20).toFixed(1),

                // Motion
                motion: +(Math.random() * 100).toFixed(1),

                // Health Indices
                health_index: Math.floor(1 + Math.random() * 8),
                hi_pm1: Math.floor(1 + Math.random() * 5),
                hi_pm25: Math.floor(1 + Math.random() * 5),
                hi_pm10: Math.floor(1 + Math.random() * 3),
                hi_co2: Math.floor(1 + Math.random() * 6),
                hi_tvoc: Math.floor(1 + Math.random() * 3),
                hi_hum: Math.floor(1 + Math.random() * 3),
                hi_no2: Math.floor(1 + Math.random() * 3),
            },

            active_events: 'AQI,PM25,CO2cal,Temperature',
            active_events_list: ['AQI', 'PM25', 'CO2cal', 'Temperature'],
            firmware_version: '2.11.0.6.409-3',
        }
    };
};

/**
 * Simulates WebSocket emissions at regular intervals
 * Useful for testing without a real WebSocket server
 * 
 * @param {Function} callback - Function to call with generated data
 * @param {number} interval - Interval in milliseconds (default: 3000)
 * @returns {Function} Cleanup function to stop the simulation
 */
export const startMockWebSocketEmissions = (callback, interval = 3000) => {
    console.log('🧪 Starting mock WebSocket emissions for sensor_4...');

    const intervalId = setInterval(() => {
        const mockData = generateMockSensor4Data();
        console.log('📡 Mock sensor_4 emission:', mockData);
        callback(mockData);
    }, interval);

    // Return cleanup function
    return () => {
        console.log('🛑 Stopping mock WebSocket emissions');
        clearInterval(intervalId);
    };
};

/**
 * Generates a specific event type for testing
 * @param {string} eventType - Type of event ('alert', 'air_quality', 'sound_event', etc.)
 * @returns {Object} Event-specific sensor data
 */
export const generateMockEvent = (eventType) => {
    const baseData = generateMockSensor4Data();

    switch (eventType) {
        case 'alert':
            return {
                ...baseData,
                type: 'alert',
                message: '🚨 High CO2 levels detected!',
                sensor_data: {
                    ...baseData.sensor_data,
                    sensors: {
                        ...baseData.sensor_data.sensors,
                        co2: 2500, // High CO2
                        hi_co2: 8,
                    }
                }
            };

        case 'air_quality':
            return {
                ...baseData,
                type: 'air_quality',
                message: 'Air quality update',
                sensor_data: {
                    ...baseData.sensor_data,
                    sensors: {
                        ...baseData.sensor_data.sensors,
                        aqi: 150, // Unhealthy AQI
                        pm25: 80,
                    }
                }
            };

        case 'sound_event':
            return {
                ...baseData,
                type: 'sound_event',
                message: '🔊 Loud noise detected',
                sensor_data: {
                    ...baseData.sensor_data,
                    sensors: {
                        ...baseData.sensor_data.sensors,
                        noise: 95,
                        aggression: 75,
                    }
                }
            };

        case 'status_update':
            return {
                ...baseData,
                type: 'status_update',
                message: 'Sensor status updated',
                data: {
                    status: 'Active',
                    is_active: true,
                }
            };

        default:
            return baseData;
    }
};

// Example usage (for testing in browser console):
// import { startMockWebSocketEmissions, generateMockSensor4Data } from './mockWebSocketData';
// const stopEmissions = startMockWebSocketEmissions((data) => console.log('Received:', data), 2000);
// To stop: stopEmissions();
