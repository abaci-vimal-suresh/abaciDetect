export interface Alert {
    id: string;
    timestamp: string;
    type: 'Vape' | 'Noise' | 'Tamper' | 'AirQuality' | 'Gunshot' | 'Aggression';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    message: string;
    sensorId: string;
    location: string;
    status: 'Active' | 'Resolved' | 'Acknowledged';
}

export const generateMockAlerts = (count: number = 20): Alert[] => {
    const alerts: Alert[] = [];
    const types: Alert['type'][] = ['Vape', 'Noise', 'Tamper', 'AirQuality', 'Gunshot', 'Aggression'];
    const severities: Alert['severity'][] = ['Low', 'Medium', 'High', 'Critical'];
    const statuses: Alert['status'][] = ['Active', 'Resolved', 'Acknowledged'];

    const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    for (let i = 0; i < count; i++) {
        // Generate a random date within the last 7 days
        const date = new Date();
        date.setDate(date.getDate() - getRandomInt(0, 7));
        date.setHours(getRandomInt(0, 23), getRandomInt(0, 59));

        alerts.push({
            id: `alert-${getRandomInt(10000, 99999)}`,
            timestamp: date.toISOString(),
            type: getRandomElement(types),
            severity: getRandomElement(severities),
            message: `Detected abnormal ${getRandomElement(['levels', 'activity', 'sound'])} in zone`,
            sensorId: `HALO-${getRandomInt(1000, 9999)}`,
            location: `Building ${getRandomElement(['A', 'B', 'C'])}, Floor ${getRandomInt(1, 5)}, Room ${getRandomInt(101, 599)}`,
            status: getRandomElement(statuses),
        });
    }

    // Sort by timestamp descending
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const MOCK_ALERTS = generateMockAlerts(50);
