import { Sensor, Area, SubArea, User, UserGroup } from '../types/sensor';

export const mockSubAreas: SubArea[] = [

];

export const mockRoomBoundaries: Record<number, number[][]> = {};


export const mockAreas: Area[] = [

];

export const mockSensors: Sensor[] = [
    {
        id: '1',
        name: 'Main Entrance Sensor',
        mac_address: '00:1B:44:11:3A:B7',
        ip_address: '192.168.1.101',
        location: 'Lobby',
        is_active: true,
        sensor_type: 'Environment',
        status: 'Active',
        building: 'Main Building',
        floor: 1,
        zone: 'Entry',
        macAddress: '00:1B:44:11:3A:B7',
        serialNumber: 'SN-1001',
        autoUpdate: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subarea: null,
        area: null
    },
    {
        id: '2',
        name: 'Server Room Monitor',
        mac_address: '00:1B:44:11:3A:C8',
        ip_address: '192.168.1.102',
        location: 'Server Room',
        is_active: true,
        sensor_type: 'Temperature',
        status: 'Active',
        building: 'Main Building',
        floor: 2,
        zone: 'IT',
        macAddress: '00:1B:44:11:3A:C8',
        serialNumber: 'SN-1002',
        autoUpdate: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subarea: null,
        area: null
    },
    {
        id: '3',
        name: 'Cafeteria Smoke Detector',
        mac_address: '00:1B:44:11:3A:D9',
        ip_address: '192.168.1.103',
        location: 'Cafeteria',
        is_active: false,
        sensor_type: 'Safety',
        status: 'Inactive',
        building: 'Annex',
        floor: 1,
        zone: 'Common',
        macAddress: '00:1B:44:11:3A:D9',
        serialNumber: 'SN-1003',
        autoUpdate: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subarea: null,
        area: null
    },
    {
        id: '304',
        name: 'Halo_Abaci',
        device_name: 'Halo_Abaci',
        mac_address: 'B0B353D1A0CE',
        ip_address: '192.168.1.137',
        location: 'Room 301',
        is_active: true,
        sensor_type: 'Multi-Sensor',
        status: 'Active',
        building: 'North Wing',
        floor: 3,
        zone: 'Conference',
        macAddress: 'B0B353D1A0CE',
        serialNumber: 'SN-304',
        autoUpdate: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        created_at: '2025-12-23T12:28:22.855279Z',
        updated_at: new Date().toISOString(),
        subarea: null,
        area: null,
        timestamp: '2025-12-23T12:28:22.745507Z',
        event_id: 'Motion',
        event_source: 'Motion',
        event_value: 53.0,
        event_threshold: 50.0,
        active_events: 'Health_Index,AQI,PM1,PM10,CO2cal,Humidity,Motion',
        firmware_version: '2.11.0.6.409-3',
        building_wing: 'North Wing',
        building_floor: '3rd Floor',
        building_room: 'Room 301',
        description: 'Main conference room sensor',
        sensor_data: {
            ip: '192.168.1.137',
            mac: 'B0B353D1A0CE',
            val: 53.0,
            desc: '',
            room: 'Room 301',
            time: '12/23/2025 5:58:22 PM',
            wing: 'North Wing',
            event: 'Motion',
            floor: '3rd Floor',
            device: 'Halo_Abaci',
            source: 'Motion',
            sensors: {
                co: 0.03,
                aqi: 152.0,
                co2: 2027.0,
                nh3: 0.0,
                no2: 0.6,
                pm1: 48.0,
                pm10: 53.0,
                pm25: 52.0,
                tvoc: 10.0,
                coaqi: 0.0,
                light: 14.75,
                noise: 68.6,
                hi_co2: 5.0,
                hi_hum: 1.0,
                hi_no2: 1.0,
                hi_pm1: 4.0,
                motion: 53.0,
                no2aqi: 0.0,
                temp_c: 22.8,
                temp_f: 73.0,
                gunshot: 0.0,
                hi_pm10: 1.0,
                hi_pm25: 3.0,
                hi_tvoc: 1.0,
                pm10aqi: 52.0,
                pm25aqi: 152.0,
                humidity: 64.8,
                aggression: 66.8,
                health_index: 5.0,
                pressure_hpa: 1004.5
            },
            threshold: 50.0,
            active_events: 'Health_Index,AQI,PM1,PM10,CO2cal,Humidity,Motion',
            firmware_version: '2.11.0.6.409-3',
            active_events_list: [
                'Health_Index',
                'AQI',
                'PM1',
                'PM10',
                'CO2cal',
                'Humidity',
                'Motion'
            ]
        }
    }
];

export const mockUsers: User[] = [
    {
        id: 1,
        username: 'admin',
        first_name: 'System',
        last_name: 'Admin',
        email: 'admin@example.com',
        role: 'Admin',
        is_active: true,
        last_login: new Date().toISOString(),
        date_joined: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_area_ids: []
    },
    {
        id: 2,
        username: 'jdoe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'Viewer',
        is_active: true,
        last_login: new Date().toISOString(),
        date_joined: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_area_ids: [1]
    }
];

export const mockUserGroups: UserGroup[] = [
    {
        id: 1,
        name: 'Administrators',
        description: 'Full system access',
        user_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_ids: [1]
    },
    {
        id: 2,
        name: 'Viewers',
        description: 'Read-only access',
        user_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_ids: [2]
    }
];

export const mockSensorGroups: any[] = []; // Assuming SensorGroup type isn't fully set up yet or just using any for now in mock

// Helper to simulate saving mock data (in-memory only for this session)
export const saveMockData = (key: string, data: any) => {
    console.log(`[MOCK SAVE] ${key}:`, data);
    // In a real app with local storage mock, we might write to localStorage here
    // localStorage.setItem(key, JSON.stringify(data));
};


