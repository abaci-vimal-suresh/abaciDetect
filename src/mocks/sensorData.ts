export interface SensorData {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'offline' | 'alert';
    metrics: {
        voc: number;
        co2: number;
        temperature: number;
        humidity: number;
        noise: number;
        particulates: number;
    };
    lastUpdated: string;
}

export const mockSensors: SensorData[] = [
    {
        id: 'HALO-001',
        name: 'Conference Room A',
        location: 'Floor 1, East Wing',
        status: 'online',
        metrics: {
            voc: 150,
            co2: 650,
            temperature: 22.5,
            humidity: 45,
            noise: 42,
            particulates: 12,
        },
        lastUpdated: new Date().toISOString(),
    },
    {
        id: 'HALO-002',
        name: 'Main Lobby',
        location: 'Ground Floor',
        status: 'online',
        metrics: {
            voc: 180,
            co2: 720,
            temperature: 24.1,
            humidity: 48,
            noise: 55,
            particulates: 15,
        },
        lastUpdated: new Date().toISOString(),
    },
    {
        id: 'HALO-003',
        name: 'Server Room',
        location: 'Floor 2, Central',
        status: 'online',
        metrics: {
            voc: 90,
            co2: 450,
            temperature: 19.8,
            humidity: 35,
            noise: 65,
            particulates: 5,
        },
        lastUpdated: new Date().toISOString(),
    },
    {
        id: 'HALO-004',
        name: 'Kitchenette',
        location: 'Floor 1, West Wing',
        status: 'alert',
        metrics: {
            voc: 850,
            co2: 1200,
            temperature: 26.5,
            humidity: 55,
            noise: 70,
            particulates: 45,
        },
        lastUpdated: new Date().toISOString(),
    }
];

export const getSensorStats = () => {
    return {
        total: mockSensors.length,
        online: mockSensors.filter(s => s.status === 'online').length,
        alerts: mockSensors.filter(s => s.status === 'alert').length,
        avgTemperature: mockSensors.reduce((acc, s) => acc + s.metrics.temperature, 0) / mockSensors.length,
        avgHumidity: mockSensors.reduce((acc, s) => acc + s.metrics.humidity, 0) / mockSensors.length,
    };
};
