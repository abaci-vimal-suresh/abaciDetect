import { Area, Sensor, SubArea, User, SensorGroup, UserActivity, Alert, AlertTrendResponse, SensorConfig, AlertConfiguration } from '../types/sensor';

export const mockUsers: User[] = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@gmail.com',
        first_name: 'Arun',
        last_name: '',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        assigned_area_ids: [],
        head_id: null,
        head: null
    },
    {
        id: 2,
        username: 'viewer',
        email: 'viewer@gmail.com',
        first_name: 'Vimal',
        last_name: '',
        role: 'viewer',
        is_active: true,
        created_at: new Date().toISOString(),
        assigned_area_ids: [101, 201], // Assigned to Ground Floor A and Ground Floor B
        head_id: 1,
        head: null
    },
    {
        id: 3,
        username: 'rooney',
        email: 'rooney@gmail.com',
        first_name: 'Rooney',
        last_name: 'Sullivan',
        role: 'viewer',
        is_active: true,
        created_at: new Date().toISOString(),
        assigned_area_ids: [102], // Assigned to First Floor A
        head_id: 1,
        head: null
    }
];

export const mockUserGroups: any[] = [
    {
        id: 1,
        name: 'Security Team',
        description: 'Security personnel who monitor alerts',
        members: [mockUsers[0], mockUsers[1]], // admin and viewer
        member_count: 2,
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z'
    },
    {
        id: 2,
        name: 'Maintenance Staff',
        description: 'Staff responsible for equipment maintenance',
        members: [mockUsers[2]], // rooney
        member_count: 1,
        created_at: '2026-01-15T11:00:00Z',
        updated_at: '2026-01-15T11:00:00Z'
    },
    {
        id: 3,
        name: 'Admin Group',
        description: 'System administrators with full access',
        members: [mockUsers[0]], // admin only
        member_count: 1,
        created_at: '2026-01-15T12:00:00Z',
        updated_at: '2026-01-15T12:00:00Z'
    }
];

export const mockSensorGroups: SensorGroup[] = [
    {
        id: 1,
        name: "Ammonia Sensors",
        description: "Sensors monitoring NH3 levels in bathrooms",
        status: "Normal",
        sensor_list: [],
        sensor_count: 0,
        activeAlerts: 0,
        created_at: "2026-01-14T10:00:00.000Z",
        updated_at: "2026-01-14T10:00:00.000Z"
    },
    {
        id: 2,
        name: "Security Cams",
        description: "Motion detection cameras in hallways",
        status: "Warning",
        sensor_list: [],
        sensor_count: 0,
        activeAlerts: 1,
        created_at: "2026-01-14T11:00:00.000Z",
        updated_at: "2026-01-14T11:00:00.000Z"
    }
];

export const mockSubAreas: SubArea[] = [];

export const mockAreas: Area[] = [
    // ============================================
    // BUILDING A (EXISTING)
    // ============================================
    {
        id: 100,
        name: 'Building A',
        sensor_count: 8,
        parent_id: null,
        floor_level: null,
        is_room: false,
        subareas: []
    },
    {
        id: 101,
        name: 'Ground Floor A',
        sensor_count: 5,
        parent_id: 100,
        floor_level: 0,
        floor_height: 250,
        is_room: false,
        floor_plan_url: '/assets/test_plans/new_floor_1.jpg',
        floor_plan_width: 1080,
        floor_plan_height: 720,
        subareas: [],
        person_in_charge_ids: [2]
    },
    {
        id: 102,
        name: 'First Floor A',
        sensor_count: 3,
        parent_id: 100,
        floor_level: 1,
        floor_height: 250,
        is_room: false,
        floor_plan_url: '/assets/test_plans/new_floor_2.png',
        floor_plan_width: 1080,
        floor_plan_height: 720,
        subareas: [],
        person_in_charge_ids: [3]
    },
    // ============================================
    // BUILDING B (3D TEST)
    // ============================================
    {
        id: 200,
        name: 'Building B (Empty)',
        sensor_count: 9,
        parent_id: null,
        floor_level: null,
        is_room: false,
        subareas: []
    },
    {
        id: 201,
        name: 'Ground Floor B',
        sensor_count: 3,
        parent_id: 200,
        floor_level: 0,
        floor_height: 250,
        is_room: false,
        floor_plan_url: '/assets/test_plans/new_floor_1.jpg',
        floor_plan_width: 1080,
        floor_plan_height: 720,
        subareas: [],
        person_in_charge_ids: [2]
    },
    {
        id: 202,
        name: 'First Floor B',
        sensor_count: 3,
        parent_id: 200,
        floor_level: 1,
        floor_height: 250,
        is_room: false,
        floor_plan_url: '/assets/test_plans/new_floor_2.png',
        floor_plan_width: 1080,
        floor_plan_height: 720,
        subareas: []
    },
    {
        id: 203,
        name: 'Second Floor B',
        sensor_count: 3,
        parent_id: 200,
        floor_level: 2,
        floor_height: 250,
        is_room: false,
        floor_plan_url: '/assets/test_plans/new_floor_3.jpg',
        floor_plan_width: 1080,
        floor_plan_height: 720,
        subareas: []
    },
    // ============================================
    // BUILDING 3 (NESTED HIERARCHY TEST)
    // ============================================
    {
        id: 300,
        name: 'Building 3 (Nested)',
        sensor_count: 0,
        parent_id: null,
        floor_level: null,
        is_room: false,
        subareas: []
    },
    {
        id: 301,
        name: 'Floor 1',
        sensor_count: 0,
        parent_id: 300,
        floor_level: 1,
        floor_height: 250,
        is_room: false,
        floor_plan_url: '/assets/test_plans/new_floor_2.png',
        floor_plan_width: 1080,
        floor_plan_height: 720,
        subareas: []
    },
    {
        id: 302,
        name: 'Room 1-A',
        sensor_count: 0,
        parent_id: 301,
        floor_level: 1,
        is_room: true,
        polygon_coords: [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]],
        subareas: []
    },
    {
        id: 303,
        name: 'Room 1-B',
        sensor_count: 0,
        parent_id: 301,
        floor_level: 1,
        is_room: true,
        polygon_coords: [[0.5, 0.1], [0.9, 0.1], [0.9, 0.4], [0.5, 0.4]],
        subareas: []
    },
    {
        id: 304,
        name: 'Floor 2',
        sensor_count: 0,
        parent_id: 300,
        floor_level: 2,
        floor_height: 250,
        is_room: false,
        floor_plan_url: '/assets/test_plans/new_floor_3.jpg',
        floor_plan_width: 1080,
        floor_plan_height: 720,
        subareas: []
    },
    {
        id: 305,
        name: 'Room 2-A',
        sensor_count: 0,
        parent_id: 304,
        floor_level: 2,
        is_room: true,
        polygon_coords: [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]],
        subareas: []
    },
    {
        id: 306,
        name: 'Room 2-B',
        sensor_count: 0,
        parent_id: 304,
        floor_level: 2,
        is_room: true,
        polygon_coords: [[0.5, 0.1], [0.9, 0.1], [0.9, 0.4], [0.5, 0.4]],
        subareas: []
    }
];


export const mockRoomBoundaries: Record<number, number[][]> = {
    // Building A Rooms removed - they should start empty
};

export const mockSensors: Sensor[] = [
    {
        id: 'S-NEW-001',
        name: 'New Temp Sensor',
        sensor_type: 'Temperature',
        status: 'Inactive', // Inactive until placed
        is_online: false,
        ip_address: '192.168.1.101',
        location: 'Production Line A',
        mac_address: '00:1A:2B:3C:4D:01',
        sensor_data: { val: 0, threshold: 30.0, sensors: { temp_c: 24.5, temp_f: 76.1, humidity: 45.0, pressure_hpa: 1013, co2: 600, tvoc: 100, aqi: 45, pm25: 12, pm1: 5, pm10: 15, noise: 40, light: 500, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 98, hi_co2: 98, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any,
    },
    {
        id: 'S-NEW-002',
        name: 'New Humidity Sensor',
        sensor_type: 'Humidity',
        status: 'Inactive',
        is_online: true,
        ip_address: '192.168.1.102',
        location: 'Storage Room 4',
        mac_address: '00:1A:2B:3C:4D:02',
        sensor_data: { val: 0, threshold: 60.0, sensors: { temp_c: 22.5, temp_f: 72.5, humidity: 45, pressure_hpa: 1013, co2: 550, tvoc: 80, aqi: 40, pm25: 10, pm1: 5, pm10: 12, noise: 35, light: 450, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 99, hi_co2: 99, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any,
    },
    {
        id: 'S-NEW-003',
        name: 'New Motion Sensor',
        sensor_type: 'Motion',
        status: 'Inactive',
        is_online: true,
        ip_address: '192.168.1.103',
        location: 'Main Entrance',
        mac_address: '00:1A:2B:3C:4D:03',
        sensor_data: { val: 0, threshold: 1, sensors: { temp_c: 23.0, temp_f: 73.4, humidity: 42.0, pressure_hpa: 1013, co2: 580, tvoc: 90, aqi: 42, pm25: 11, pm1: 5, pm10: 14, noise: 38, light: 480, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 98, hi_co2: 98, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any,
    },
    // TEST SENSORS FOR BUILDING 3
    {
        id: 'S-B3-F1-R1',
        name: 'B3-F1-RoomA Sensor',
        sensor_type: 'Temperature',
        status: 'warning',
        is_online: true,
        area_id: 302,
        floor_level: 1,
        x_coordinate: 0.25,
        y_coordinate: 0.25,
        ip_address: '10.0.1.20',
        location: 'Building 3 - Floor 1 - Room A',
        mac_address: 'B3:F1:R1:00:01',
        sensor_data: { val: 28, threshold: 25.0, sensors: { temp_c: 28, temp_f: 82.4, humidity: 48.0, pressure_hpa: 1010, co2: 750, tvoc: 150, aqi: 55, pm25: 18, pm1: 8, pm10: 22, noise: 50, light: 550, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 90, hi_co2: 95, hi_hum: 98, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 98, hi_tvoc: 95, gunshot: 0, aggression: 0 } } as any,
    },
    {
        id: 'S-B3-F2-R2',
        name: 'B3-F2-RoomB Sensor',
        sensor_type: 'CO2',
        status: 'critical',
        is_online: false,
        area_id: 306,
        floor_level: 2,
        x_coordinate: 0.75,
        y_coordinate: 0.25,
        ip_address: '10.0.2.22',
        location: 'Building 3 - Floor 2 - Room B',
        mac_address: 'B3:F2:R2:00:02',
        sensor_data: { val: 1200, threshold: 1000, sensors: { temp_c: 26.5, temp_f: 79.7, humidity: 55.0, pressure_hpa: 1008, co2: 1200, tvoc: 400, aqi: 85, pm25: 35, pm1: 15, pm10: 45, noise: 65, light: 600, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 85, hi_co2: 80, hi_hum: 95, hi_no2: 95, hi_pm1: 95, hi_pm10: 90, hi_pm25: 85, hi_tvoc: 80, gunshot: 0, aggression: 0 } } as any,
    },
    // LARGE UNASSIGNED POOL FOR TESTING
    { id: 'POOL-001', name: 'Ambient Sensor Alpha', sensor_type: 'Temperature', status: 'Inactive', ip_address: '172.16.0.11', location: 'Lab 1', mac_address: 'AA:00:11:22:33:44', sensor_data: { val: 0, threshold: 25, sensors: { temp_c: 23, temp_f: 73.4, humidity: 45, pressure_hpa: 1013, co2: 600, tvoc: 100, aqi: 45, pm25: 12, pm1: 5, pm10: 15, noise: 40, light: 500, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 98, hi_co2: 98, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any },
    { id: 'POOL-002', name: 'Security Sensor Beta', sensor_type: 'Motion', status: 'Inactive', ip_address: '172.16.0.12', location: 'Server Room', mac_address: 'BB:00:11:22:33:44', sensor_data: { val: 0, threshold: 1, sensors: { temp_c: 22, temp_f: 71.6, humidity: 42, pressure_hpa: 1013, co2: 550, tvoc: 80, aqi: 40, pm25: 10, pm1: 4, pm10: 12, noise: 35, light: 450, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 99, hi_co2: 99, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any },
    { id: 'POOL-003', name: 'Air Quality Delta', sensor_type: 'CO2', status: 'Inactive', ip_address: '172.16.0.13', location: 'Conference Room', mac_address: 'CC:00:11:22:33:44', sensor_data: { val: 0, threshold: 1000, sensors: { temp_c: 24, temp_f: 75.2, humidity: 48, pressure_hpa: 1012, co2: 800, tvoc: 120, aqi: 55, pm25: 15, pm1: 6, pm10: 20, noise: 50, light: 550, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 95, hi_co2: 95, hi_hum: 98, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 98, hi_tvoc: 95, gunshot: 0, aggression: 0 } } as any },
    { id: 'POOL-004', name: 'Humidity Sigma', sensor_type: 'Humidity', status: 'Inactive', ip_address: '172.16.0.14', location: 'Data Center', mac_address: 'DD:00:11:22:33:44', sensor_data: { val: 0, threshold: 60, sensors: { temp_c: 21, temp_f: 69.8, humidity: 35, pressure_hpa: 1014, co2: 500, tvoc: 50, aqi: 30, pm25: 8, pm1: 3, pm10: 10, noise: 60, light: 400, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 99, hi_co2: 100, hi_hum: 95, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any },
    { id: 'POOL-005', name: 'Pressure Omega', sensor_type: 'Pressure', status: 'Inactive', ip_address: '172.16.0.15', location: 'Roof Top', mac_address: 'EE:00:11:22:33:44', sensor_data: { val: 0, threshold: 1013, sensors: { temp_c: 20, temp_f: 68.0, humidity: 40, pressure_hpa: 1013, co2: 500, tvoc: 60, aqi: 40, pm25: 12, pm1: 5, pm10: 15, noise: 40, light: 800, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 98, hi_co2: 100, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 98, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any },
    { id: 'POOL-006', name: 'Light Sensor Gamma', sensor_type: 'Light', status: 'Inactive', ip_address: '172.16.0.16', location: 'Cafeteria', mac_address: 'FF:00:11:22:33:44', sensor_data: { val: 0, threshold: 500, sensors: { temp_c: 24, temp_f: 75.2, humidity: 55, pressure_hpa: 1012, co2: 700, tvoc: 120, aqi: 65, pm25: 18, pm1: 8, pm10: 25, noise: 65, light: 750, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 88, hi_co2: 90, hi_hum: 95, hi_no2: 95, hi_pm1: 95, hi_pm10: 90, hi_pm25: 88, hi_tvoc: 90, gunshot: 0, aggression: 0 } } as any },
    { id: 'POOL-007', name: 'VOC Sensor Epsilon', sensor_type: 'VOC', status: 'Inactive', ip_address: '172.16.0.17', location: 'Office Area', mac_address: 'A1:00:11:22:33:44', sensor_data: { val: 0, threshold: 200, sensors: { temp_c: 23, temp_f: 73.4, humidity: 48, pressure_hpa: 1012, co2: 600, tvoc: 150, aqi: 55, pm25: 15, pm1: 6, pm10: 20, noise: 50, light: 600, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 92, hi_co2: 95, hi_hum: 98, hi_no2: 98, hi_pm1: 98, hi_pm10: 95, hi_pm25: 95, hi_tvoc: 90, gunshot: 0, aggression: 0 } } as any },
    { id: 'POOL-008', name: 'Acoustic Sensor Zeta', sensor_type: 'Sound', status: 'Inactive', ip_address: '172.16.0.18', location: 'Break Room', mac_address: 'B2:00:11:22:33:44', sensor_data: { val: 0, threshold: 80, sensors: { temp_c: 22, temp_f: 71.6, humidity: 50, pressure_hpa: 1013, co2: 650, tvoc: 90, aqi: 48, pm25: 14, pm1: 5, pm10: 18, noise: 70, light: 550, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 94, hi_co2: 95, hi_hum: 95, hi_no2: 98, hi_pm1: 98, hi_pm10: 95, hi_pm25: 95, hi_tvoc: 95, gunshot: 0, aggression: 0 } } as any },

    // STATUS-SPECIFIC UNASSIGNED SENSORS (For Visual Testing)
    {
        id: 'TEST-CRITICAL',
        name: 'Critical Alert Sensor',
        sensor_type: 'Temperature',
        status: 'critical',
        is_online: true,
        sensor_data: { val: 45, threshold: 30, sensors: { temp_c: 45, humidity: 25.0, co2: 600, tvoc: 300, aqi: 120, pm25: 45, noise: 75, light: 800, motion: 1, smoke: 1, gas: 0 } } as any
    },
    {
        id: 'TEST-WARNING',
        name: 'Warning Level Sensor',
        sensor_type: 'Humidity',
        status: 'warning',
        is_online: true,
        mac_address: '00:1A:2B:3C:4D:99',
        ip_address: '192.168.1.99',
        firmware_version: '3.4.2',
        last_heartbeat: new Date().toISOString(),
        location: 'Main Office - Section B',
        sensor_data: {
            val: 58,
            threshold: 60,
            firmware_version: '3.4.2',
            ip: '192.168.1.99',
            mac: '00:1A:2B:3C:4D:99',
            time: new Date().toISOString(),
            sensors: {
                temp_c: 24.5,
                temp_f: 76.1,
                humidity: 58.2,
                pressure_hpa: 1012.4,
                light: 450,
                pm1: 12.5,
                pm25: 18.2,
                pm10: 25.4,
                co: 0.5,
                nh3: 15,
                no2: 22.4,
                co2: 850,
                tvoc: 145,
                aqi: 72,
                coaqi: 45,
                no2aqi: 58,
                pm10aqi: 62,
                pm25aqi: 70,
                health_index: 68,
                hi_co2: 85,
                hi_tvoc: 90,
                hi_pm25: 88,
                hi_no2: 92,
                motion: 1,
                noise: 55,
                aggression: 0,
                gunshot: 0,
            }
        } as any
    },
    {
        id: 'TEST-SAFE',
        name: 'Safe Pulse Sensor',
        sensor_type: 'CO2',
        status: 'safe',
        is_online: true,
        sensor_data: { val: 450, threshold: 1000, sensors: { temp_c: 22.0, temp_f: 71.6, humidity: 45.0, pressure_hpa: 1013, co2: 450, tvoc: 80, aqi: 35, pm25: 8, pm1: 3, pm10: 10, noise: 40, light: 500, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 99, hi_co2: 99, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'TEST-GUNSHOT',
        name: 'Tactical Acoustic Sensor',
        sensor_type: 'Sound',
        status: 'critical',
        is_online: false,
        mac_address: '00:DE:AD:BE:EF:01',
        ip_address: '192.168.1.50',
        firmware_version: '4.0.1',
        location: 'High Security Perimeter',
        sensor_data: {
            val: 120,
            threshold: 80,
            firmware_version: '4.0.1',
            ip: '192.168.1.50',
            mac: '00:DE:AD:BE:EF:01',
            time: new Date().toISOString(),
            sensors: {
                temp_c: 42.5,
                temp_f: 108.5,
                humidity: 15.2,
                pressure_hpa: 1008.4,
                light: 10,
                pm1: 85.5,
                pm25: 120.2,
                pm10: 150.4,
                co: 12.5,
                nh3: 450,
                no2: 88.4,
                co2: 2450,
                tvoc: 1200,
                aqi: 185,
                coaqi: 145,
                no2aqi: 160,
                pm10aqi: 180,
                pm25aqi: 195,
                health_index: 22,
                hi_co2: 15,
                hi_tvoc: 20,
                hi_pm25: 18,
                hi_no2: 25,
                motion: 3,
                noise: 115,
                aggression: 1,
                gunshot: 1,
            }
        } as any
    },
    {
        id: 'SENTINEL-SAFE',
        name: 'Sentinel Alpha-1 (Safe)',
        sensor_type: 'Multi-Sensor',
        status: 'safe',
        mac_address: '00:S1:A2:F3:E4:01',
        ip_address: '10.0.0.101',
        firmware_version: 'v4.2.0',
        location: 'Executive Lounge - South',
        area_id: 101,
        sensor_data: {
            val: 32,
            threshold: 100,
            sensors: {
                temp_c: 22.4, temp_f: 72.3, humidity: 42.5, pressure_hpa: 1013.2, light: 550,
                pm1: 4.2, pm25: 7.8, pm10: 12.4,
                co: 0.1, nh3: 2.5, no2: 5.4, co2: 445, tvoc: 45,
                aqi: 28, coaqi: 15, no2aqi: 22, pm10aqi: 30, pm25aqi: 35,
                health_index: 96, hi_co2: 98, hi_tvoc: 95, hi_pm25: 97, hi_no2: 94, hi_hum: 98, hi_pm1: 99, hi_pm10: 97,
                motion: 1, noise: 42, aggression: 0, gunshot: 0
            }
        } as any
    },
    {
        id: 'SENTINEL-WARNING',
        name: 'Sentinel Beta-2 (Warning)',
        sensor_type: 'Multi-Sensor',
        status: 'warning',
        mac_address: '00:W1:A2:R3:N4:02',
        ip_address: '10.0.0.102',
        firmware_version: 'v4.2.0',
        location: 'Production Line B',
        area_id: 102,
        sensor_data: {
            val: 78,
            threshold: 100,
            sensors: {
                temp_c: 28.5, temp_f: 83.3, humidity: 62.5, pressure_hpa: 1005.2, light: 850,
                pm1: 24.2, pm25: 48.8, pm10: 62.4,
                co: 1.5, nh3: 42.5, no2: 35.4, co2: 1250, tvoc: 445,
                aqi: 88, coaqi: 65, no2aqi: 72, pm10aqi: 80, pm25aqi: 85,
                health_index: 62, hi_co2: 68, hi_tvoc: 65, hi_pm25: 67, hi_no2: 64, hi_hum: 70, hi_pm1: 75, hi_pm10: 65,
                motion: 12, noise: 78, aggression: 0, gunshot: 0
            }
        } as any
    },
    {
        id: 'SENTINEL-CRITICAL',
        name: 'Sentinel Gamma-9 (Critical)',
        sensor_type: 'Multi-Sensor',
        status: 'critical',
        mac_address: '00:C1:R2:I3:T4:03',
        ip_address: '10.0.0.103',
        firmware_version: 'v4.2.0',
        location: 'Hazardous Storage Yard',
        area_id: 201,
        sensor_data: {
            val: 145,
            threshold: 100,
            sensors: {
                temp_c: 45.4, temp_f: 113.7, humidity: 12.5, pressure_hpa: 998.2, light: 15,
                pm1: 94.2, pm25: 148.8, pm10: 212.4,
                co: 12.5, nh3: 152.5, no2: 95.4, co2: 3250, tvoc: 1845,
                aqi: 215, coaqi: 165, no2aqi: 172, pm10aqi: 190, pm25aqi: 205,
                health_index: 12, hi_co2: 8, hi_tvoc: 12, hi_pm25: 10, hi_no2: 15, hi_hum: 30, hi_pm1: 20, hi_pm10: 10,
                motion: 5, noise: 122, aggression: 1, gunshot: 1
            }
        } as any
    },
    {
        id: 'SENTINEL-MIXED-STATUS',
        name: 'Sentinel Delta-X (Mixed Status)',
        sensor_type: 'Multi-Sensor',
        status: 'warning',
        mac_address: '00:M1:X2:S3:T4:04',
        ip_address: '10.0.0.104',
        firmware_version: 'v4.2.0',
        location: 'Research Lab 7',
        area_id: 102,
        sensor_data: {
            val: 85,
            threshold: 100,
            sensors: {
                // Environment: Safe (Green)
                temp_c: 22.4, temp_f: 72.3, humidity: 45.5, pressure_hpa: 1013.2, light: 650,
                // Particulates: Warning (Yellow)
                pm1: 12.2, pm25: 42.8, pm10: 65.4,
                // Gases: Critical (Red Pulse)
                co: 1.5, nh3: 15.5, no2: 8.4, co2: 2450, tvoc: 1850,
                // AQI: Warning (Yellow)
                aqi: 82, coaqi: 45, no2aqi: 32, pm10aqi: 70, pm25aqi: 85,
                // Health: Critical (Red Pulse) [Sentinel Scale: Lower is worse]
                health_index: 35, hi_co2: 45, hi_tvoc: 40, hi_pm25: 38, hi_no2: 42, hi_hum: 50, hi_pm1: 55, hi_pm10: 45,
                // Sound: Safe (Green)
                motion: 15, noise: 48, aggression: 0, gunshot: 0
            }
        } as any
    },
    // ============================================
    // BUILDING A - GROUND FLOOR (101)
    // ============================================
    {
        id: 'S-A-G-TEMP-01',
        name: 'Ground Floor A - Temperature Sensor 1',
        sensor_type: 'Temperature',
        status: 'safe',
        is_online: true,
        area_id: 101,
        floor_level: 0,
        x_coordinate: 0.25,
        y_coordinate: 0.25,
        boundary: { x_min: 0.15, x_max: 0.35, y_min: 0.15, y_max: 0.35 },
        ip_address: '192.168.1.111',
        location: 'Building A - Ground Floor - Zone A',
        mac_address: 'AA:BB:CC:DD:EE:11',
        sensor_data: { val: 22.5, threshold: 25, sensors: { temp_c: 22.5, temp_f: 72.5, humidity: 46.0, pressure_hpa: 1012, co2: 620, tvoc: 110, aqi: 48, pm25: 14, pm1: 6, pm10: 18, noise: 44, light: 520, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 95, hi_co2: 95, hi_hum: 98, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-A-G-HUM-02',
        name: 'Ground Floor A - Humidity Sensor 2',
        sensor_type: 'Humidity',
        status: 'safe',
        is_online: true,
        area_id: 101,
        floor_level: 0,
        x_coordinate: 0.65,
        y_coordinate: 0.35,
        boundary: { x_min: 0.55, x_max: 0.75, y_min: 0.25, y_max: 0.45 },
        ip_address: '192.168.1.112',
        location: 'Building A - Ground Floor - Zone B',
        mac_address: 'AA:BB:CC:DD:EE:12',
        sensor_data: { val: 45, threshold: 60, sensors: { temp_c: 22.8, temp_f: 73.0, humidity: 45, pressure_hpa: 1013, co2: 610, tvoc: 105, aqi: 46, pm25: 13, pm1: 5, pm10: 16, noise: 43, light: 510, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 96, hi_co2: 96, hi_hum: 98, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-A-G-CO2-03',
        name: 'Ground Floor A - CO2 Sensor 3',
        sensor_type: 'CO2',
        status: 'warning',
        is_online: true,
        area_id: 101,
        floor_level: 0,
        x_coordinate: 0.45,
        y_coordinate: 0.65,
        boundary: { x_min: 0.35, x_max: 0.55, y_min: 0.55, y_max: 0.75 },
        ip_address: '192.168.1.113',
        location: 'Building A - Ground Floor - Zone C',
        mac_address: 'AA:BB:CC:DD:EE:13',
        sensor_data: { val: 950, threshold: 1000, sensors: { temp_c: 23.5, temp_f: 74.3, humidity: 50.0, pressure_hpa: 1011, co2: 950, tvoc: 250, aqi: 75, pm25: 25, pm1: 10, pm10: 35, noise: 55, light: 580, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 80, hi_co2: 85, hi_hum: 95, hi_no2: 100, hi_pm1: 98, hi_pm10: 95, hi_pm25: 90, hi_tvoc: 90, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-A-G-MOTION-04',
        name: 'Ground Floor A - Motion Sensor 4',
        sensor_type: 'Motion',
        status: 'safe',
        is_online: true,
        area_id: 101,
        floor_level: 0,
        x_coordinate: 0.8,
        y_coordinate: 0.7,
        boundary: { x_min: 0.7, x_max: 0.9, y_min: 0.6, y_max: 0.8 },
        ip_address: '192.168.1.114',
        location: 'Building A - Ground Floor - Zone D',
        mac_address: 'AA:BB:CC:DD:EE:14',
        sensor_data: { val: 1, threshold: 1, sensors: { temp_c: 22.6, temp_f: 72.7, humidity: 45.5, pressure_hpa: 1013, co2: 605, tvoc: 102, aqi: 44, pm25: 12, pm1: 5, pm10: 15, noise: 42, light: 515, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 97, hi_co2: 97, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-A-G-MULTI-05',
        name: 'Ground Floor A - Multi Sensor 5',
        sensor_type: 'Multi-Sensor',
        status: 'critical',
        is_online: true,
        area_id: 101,
        floor_level: 0,
        x_coordinate: 0.15,
        y_coordinate: 0.75,
        boundary: { x_min: 0.05, x_max: 0.25, y_min: 0.65, y_max: 0.85 },
        ip_address: '192.168.1.115',
        location: 'Building A - Ground Floor - Zone E',
        mac_address: 'AA:BB:CC:DD:EE:15',
        sensor_data: {
            val: 125,
            threshold: 100,
            sensors: {
                temp_c: 38.5, temp_f: 101.3, humidity: 75.5, pressure_hpa: 1002.2, light: 250,
                pm1: 65.2, pm25: 95.8, pm10: 125.4,
                co: 8.5, nh3: 85.5, no2: 65.4, co2: 1850, tvoc: 950,
                aqi: 145, coaqi: 125, no2aqi: 135, pm10aqi: 150, pm25aqi: 155,
                health_index: 35, hi_co2: 30, hi_tvoc: 35, hi_pm25: 32, hi_no2: 38, hi_hum: 40, hi_pm1: 45, hi_pm10: 35,
                motion: 3, noise: 95, aggression: 0, gunshot: 0
            }
        } as any
    },
    // ============================================
    // BUILDING A - FIRST FLOOR (102)
    // ============================================
    {
        id: 'S-A-F1-TEMP-01',
        name: 'First Floor A - Temperature Sensor 1',
        sensor_type: 'Temperature',
        status: 'safe',
        is_online: true,
        area_id: 102,
        floor_level: 1,
        x_coordinate: 0.3,
        y_coordinate: 0.2,
        boundary: { x_min: 0.2, x_max: 0.4, y_min: 0.1, y_max: 0.3 },
        ip_address: '192.168.1.121',
        location: 'Building A - First Floor - Office Area',
        mac_address: 'AA:BB:CC:DD:FF:21',
        sensor_data: { val: 21.8, threshold: 25, sensors: { temp_c: 21.8, temp_f: 71.2, humidity: 44.0, pressure_hpa: 1014, co2: 590, tvoc: 95, aqi: 38, pm25: 9, pm1: 4, pm10: 12, noise: 39, light: 490, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 98, hi_co2: 98, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-A-F1-HUM-02',
        name: 'First Floor A - Humidity Sensor 2',
        sensor_type: 'Humidity',
        status: 'warning',
        is_online: true,
        area_id: 102,
        floor_level: 1,
        x_coordinate: 0.7,
        y_coordinate: 0.4,
        boundary: { x_min: 0.6, x_max: 0.8, y_min: 0.3, y_max: 0.5 },
        ip_address: '192.168.1.122',
        location: 'Building A - First Floor - Conference Room',
        mac_address: 'AA:BB:CC:DD:FF:22',
        sensor_data: { val: 58, threshold: 60, sensors: { temp_c: 24.0, temp_f: 75.2, humidity: 58, pressure_hpa: 1010, co2: 650, tvoc: 130, aqi: 55, pm25: 16, pm1: 7, pm10: 22, noise: 48, light: 540, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 90, hi_co2: 95, hi_hum: 90, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 95, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-A-F1-CO2-03',
        name: 'First Floor A - CO2 Sensor 3',
        sensor_type: 'CO2',
        status: 'critical',
        is_online: false,
        area_id: 102,
        floor_level: 1,
        x_coordinate: 0.5,
        y_coordinate: 0.75,
        boundary: { x_min: 0.4, x_max: 0.6, y_min: 0.65, y_max: 0.85 },
        ip_address: '192.168.1.123',
        location: 'Building A - First Floor - Server Room',
        mac_address: 'AA:BB:CC:DD:FF:23',
        sensor_data: { val: 1650, threshold: 1000, sensors: { temp_c: 28.5, temp_f: 83.3, humidity: 55.0, pressure_hpa: 1005, co2: 1650, tvoc: 600, aqi: 150, pm25: 55, pm1: 25, pm10: 75, noise: 85, light: 700, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 45, hi_co2: 40, hi_hum: 90, hi_no2: 95, hi_pm1: 90, hi_pm10: 85, hi_pm25: 80, hi_tvoc: 70, gunshot: 0, aggression: 0 } } as any
    },
    // ============================================
    // BUILDING B - GROUND FLOOR (201)
    // ============================================
    {
        id: 'S-B2-G-SAFE',
        name: 'B2-G Safe Sensor',
        sensor_type: 'Temperature',
        status: 'safe',
        area_id: 201,
        floor_level: 0,
        x_coordinate: 0.2,
        y_coordinate: 0.2,
        boundary: { x_min: 0.1, x_max: 0.3, y_min: 0.1, y_max: 0.3 },
        sensor_data: { val: 22, threshold: 25, sensors: { temp_c: 22, temp_f: 71.6, humidity: 45, pressure_hpa: 1013, co2: 500, tvoc: 75, aqi: 35, pm25: 10, pm1: 4, pm10: 14, noise: 40, light: 500, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 98, hi_co2: 99, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-B2-G-WARN',
        name: 'B2-G Warning Sensor',
        sensor_type: 'Humidity',
        status: 'warning',
        area_id: 201,
        floor_level: 0,
        x_coordinate: 0.5,
        y_coordinate: 0.5,
        boundary: { x_min: 0.4, x_max: 0.6, y_min: 0.4, y_max: 0.6 },
        sensor_data: { val: 55, threshold: 60, sensors: { temp_c: 24, temp_f: 75.2, humidity: 55, pressure_hpa: 1010, co2: 700, tvoc: 150, aqi: 65, pm25: 25, pm1: 10, pm10: 35, noise: 55, light: 550, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 85, hi_co2: 90, hi_hum: 90, hi_no2: 95, hi_pm1: 95, hi_pm10: 90, hi_pm25: 90, hi_tvoc: 90, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-B2-G-CRIT',
        name: 'B2-G Critical Sensor',
        sensor_type: 'CO2',
        status: 'critical',
        area_id: 201,
        floor_level: 0,
        x_coordinate: 0.8,
        y_coordinate: 0.8,
        boundary: { x_min: 0.7, x_max: 0.9, y_min: 0.7, y_max: 0.9 },
        sensor_data: { val: 1500, threshold: 1000, sensors: { temp_c: 26, temp_f: 78.8, humidity: 60, pressure_hpa: 1005, co2: 1500, tvoc: 500, aqi: 120, pm25: 60, pm1: 25, pm10: 80, noise: 70, light: 600, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 55, hi_co2: 50, hi_hum: 85, hi_no2: 90, hi_pm1: 85, hi_pm10: 80, hi_pm25: 65, hi_tvoc: 75, gunshot: 0, aggression: 0 } } as any
    },
    // BUILDING B - FIRST FLOOR (202)
    {
        id: 'S-B2-F1-SAFE',
        name: 'B2-F1 Safe Sensor',
        sensor_type: 'Temperature',
        status: 'safe',
        area_id: 202,
        floor_level: 1,
        x_coordinate: 0.3,
        y_coordinate: 0.3,
        boundary: { x_min: 0.2, x_max: 0.4, y_min: 0.2, y_max: 0.4 },
        sensor_data: { val: 21, threshold: 25, sensors: { temp_c: 21, temp_f: 69.8, humidity: 42, pressure_hpa: 1015, co2: 480, tvoc: 60, aqi: 30, pm25: 8, pm1: 3, pm10: 12, noise: 38, light: 480, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 99, hi_co2: 100, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-B2-F1-WARN',
        name: 'B2-F1 Warning Sensor',
        sensor_type: 'Humidity',
        status: 'warning',
        area_id: 202,
        floor_level: 1,
        x_coordinate: 0.6,
        y_coordinate: 0.6,
        boundary: { x_min: 0.5, x_max: 0.7, y_min: 0.5, y_max: 0.7 },
        sensor_data: { val: 52, threshold: 60, sensors: { temp_c: 23, temp_f: 73.4, humidity: 52, pressure_hpa: 1012, co2: 650, tvoc: 110, aqi: 50, pm25: 18, pm1: 8, pm10: 25, noise: 52, light: 530, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 88, hi_co2: 90, hi_hum: 92, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 95, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-B2-F1-CRIT',
        name: 'B2-F1 Critical Sensor',
        sensor_type: 'CO2',
        status: 'critical',
        area_id: 202,
        floor_level: 1,
        x_coordinate: 0.9,
        y_coordinate: 0.1,
        boundary: { x_min: 0.8, x_max: 1.0, y_min: 0.0, y_max: 0.2 },
        sensor_data: { val: 1800, threshold: 1000, sensors: { temp_c: 27, temp_f: 80.6, humidity: 65, pressure_hpa: 1002, co2: 1800, tvoc: 800, aqi: 160, pm25: 75, pm1: 30, pm10: 95, noise: 85, light: 650, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 35, hi_co2: 30, hi_hum: 80, hi_no2: 85, hi_pm1: 80, hi_pm10: 75, hi_pm25: 60, hi_tvoc: 50, gunshot: 0, aggression: 0 } } as any
    },
    // BUILDING B - SECOND FLOOR (203)
    {
        id: 'S-B2-F2-SAFE',
        name: 'B2-F2 Safe Sensor',
        sensor_type: 'Temperature',
        status: 'safe',
        area_id: 203,
        floor_level: 2,
        x_coordinate: 0.1,
        y_coordinate: 0.9,
        boundary: { x_min: 0.0, x_max: 0.2, y_min: 0.8, y_max: 1.0 },
        sensor_data: { val: 20, threshold: 25, sensors: { temp_c: 20, temp_f: 68.0, humidity: 40, pressure_hpa: 1016, co2: 450, tvoc: 50, aqi: 25, pm25: 5, pm1: 2, pm10: 8, noise: 35, light: 450, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 100, hi_co2: 100, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-B2-F2-WARN',
        name: 'B2-F2 Warning Sensor',
        sensor_type: 'Humidity',
        status: 'warning',
        area_id: 203,
        floor_level: 2,
        x_coordinate: 0.4,
        y_coordinate: 0.1,
        boundary: { x_min: 0.3, x_max: 0.5, y_min: 0.0, y_max: 0.2 },
        sensor_data: { val: 50, threshold: 60, sensors: { temp_c: 22, temp_f: 71.6, humidity: 50, pressure_hpa: 1012, co2: 600, tvoc: 100, aqi: 45, pm25: 15, pm1: 6, pm10: 20, noise: 50, light: 500, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 92, hi_co2: 95, hi_hum: 95, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 95, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-B2-F2-CRIT',
        name: 'B2-F2 Critical Sensor',
        sensor_type: 'CO2',
        status: 'critical',
        area_id: 203,
        floor_level: 2,
        x_coordinate: 0.7,
        y_coordinate: 0.4,
        boundary: { x_min: 0.6, x_max: 0.8, y_min: 0.3, y_max: 0.5 },
        sensor_data: { val: 2100, threshold: 1000, sensors: { temp_c: 29, temp_f: 84.2, humidity: 70, pressure_hpa: 1000, co2: 2100, tvoc: 950, aqi: 190, pm25: 90, pm1: 35, pm10: 110, noise: 90, light: 700, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 25, hi_co2: 20, hi_hum: 70, hi_no2: 80, hi_pm1: 75, hi_pm10: 70, hi_pm25: 50, hi_tvoc: 40, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-UN-01',
        name: 'Unassigned Temp-01',
        sensor_type: 'Temperature',
        status: 'safe',
        area_id: undefined,
        floor_level: undefined,
        x_coordinate: undefined,
        y_coordinate: undefined,
        sensor_data: { val: 22, threshold: 25, sensors: { temp_c: 22, temp_f: 71.6, humidity: 44, pressure_hpa: 1013, co2: 550, tvoc: 80, aqi: 40, pm25: 10, pm1: 4, pm10: 14, noise: 40, light: 500, motion: 0, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 98, hi_co2: 99, hi_hum: 100, hi_no2: 100, hi_pm1: 100, hi_pm10: 100, hi_pm25: 100, hi_tvoc: 100, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-UN-02',
        name: 'Unassigned Hum-02',
        sensor_type: 'Humidity',
        status: 'warning',
        area_id: undefined,
        floor_level: undefined,
        x_coordinate: undefined,
        y_coordinate: undefined,
        sensor_data: { val: 65, threshold: 60, sensors: { temp_c: 25, temp_f: 77.0, humidity: 65, pressure_hpa: 1008, co2: 800, tvoc: 200, aqi: 90, pm25: 40, pm1: 15, pm10: 55, noise: 60, light: 600, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 70, hi_co2: 80, hi_hum: 75, hi_no2: 90, hi_pm1: 85, hi_pm10: 80, hi_pm25: 75, hi_tvoc: 80, gunshot: 0, aggression: 0 } } as any
    },
    {
        id: 'S-UN-03',
        name: 'Unassigned CO2-03',
        sensor_type: 'CO2',
        status: 'critical',
        area_id: undefined,
        floor_level: undefined,
        x_coordinate: undefined,
        y_coordinate: undefined,
        sensor_data: { val: 1500, threshold: 1000, sensors: { temp_c: 26, temp_f: 78.8, humidity: 60, pressure_hpa: 1006, co2: 1500, tvoc: 600, aqi: 120, pm25: 65, pm1: 28, pm10: 85, noise: 75, light: 650, motion: 1, smoke: 0, gas: 0, co: 0, nh3: 0, no2: 0, coaqi: 0, no2aqi: 0, pm10aqi: 0, pm25aqi: 0, health_index: 50, hi_co2: 45, hi_hum: 80, hi_no2: 85, hi_pm1: 80, hi_pm10: 75, hi_pm25: 60, hi_tvoc: 70, gunshot: 0, aggression: 0 } } as any
    }
];

// ============================================
// AUTOMATICALLY POPULATE SUBAREAS HIERARCHY
// ============================================
export const syncHierarchy = () => {
    mockAreas.forEach(area => {
        const children = mockAreas.filter(child => child.parent_id == area.id);
        area.subareas = children;
    });
};

// ============================================
// LOCALSTORAGE PERSISTENCE LAYER
// ============================================
const STORAGE_KEY = 'sensor_mock_data_v1';

// We store the INITIAL hardcoded data to ensure they are always present
const initialHardcodedAreas = [...mockAreas];
const initialHardcodedSensors = [...mockSensors];

export const loadMockData = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);

            // Clear and reload sensors with smart merge
            if (parsed.sensors) {
                mockSensors.length = 0;
                mockSensors.push(...parsed.sensors);

                // Sync new hardcoded properties (IP, Location, MAC) for existing sensors
                // and add back any missing hardcoded sensors
                initialHardcodedSensors.forEach(initial => {
                    const existing = mockSensors.find(s => s.id === initial.id);
                    if (existing) {
                        // Force sync metadata that might be new in the code but missing in storage
                        if (!existing.ip_address && initial.ip_address) existing.ip_address = initial.ip_address;
                        if (!existing.location && initial.location) existing.location = initial.location;
                        if (!existing.mac_address && initial.mac_address) existing.mac_address = initial.mac_address;
                        if (!existing.firmware_version && initial.firmware_version) existing.firmware_version = initial.firmware_version;
                        if (!existing.last_heartbeat && initial.last_heartbeat) existing.last_heartbeat = initial.last_heartbeat;

                        // Force sync sensor_data for TEST sensors to ensure user sees latest mock readings
                        if (initial.id.startsWith('TEST-')) {
                            existing.sensor_data = initial.sensor_data;
                        }
                    } else {
                        // Add missing sensor
                        mockSensors.push({ ...initial });
                    }
                });
            }

            // Smart Merge for Areas:
            // 1. Start with the stored areas
            if (parsed.areas) {
                mockAreas.length = 0;
                mockAreas.push(...parsed.areas);

                // 2. Add back any hardcoded area that is MISSING from storage
                // OR sync specific hardcoded properties like floor_plan_url to existing ones
                initialHardcodedAreas.forEach(initial => {
                    const existing = mockAreas.find(a => a.id === initial.id);
                    if (!existing) {
                        console.log(`🔄 Syncing missing hardcoded area: ${initial.name} (${initial.id})`);
                        mockAreas.push({ ...initial });
                    } else if (initial.floor_plan_url && (existing.floor_plan_url !== initial.floor_plan_url || existing.floor_plan_url?.startsWith('blob:'))) {
                        // Force sync floor plan if it was changed in code
                        // OR if current storage contains a temporary blob URL (they expire on refresh)
                        existing.floor_plan_url = initial.floor_plan_url;
                        if (initial.floor_plan_width) existing.floor_plan_width = initial.floor_plan_width;
                        if (initial.floor_plan_height) existing.floor_plan_height = initial.floor_plan_height;
                    }
                });
            }

            // 3. Final sanitization: Revert any temporary 'blob:' URLs to defaults or null
            // (These are uploaded images that expired on page refresh)
            mockAreas.forEach(area => {
                if (area.floor_plan_url?.startsWith('blob:')) {
                    const initial = initialHardcodedAreas.find(i => i.id === area.id);
                    area.floor_plan_url = initial?.floor_plan_url || null;
                }
            });

            if (parsed.alertConfigurations) {
                mockAlertConfigurations.length = 0;
                mockAlertConfigurations.push(...parsed.alertConfigurations);
            }

            // Always rebuild hierarchy after loading/merging
            syncHierarchy();

            console.log('✅ Mock data loaded and synced from localStorage');
            return true;
        }
    } catch (err) {
        console.warn('⚠️ Failed to load mock data:', err);
    }

    // Fallback: still need to sync hierarchy if no storage found
    syncHierarchy();
    return false;
};

export const saveMockData = () => {
    try {
        const dataToSave = {
            sensors: mockSensors,
            areas: mockAreas,
            alertConfigurations: mockAlertConfigurations,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('✅ Mock data saved to localStorage');
        return true;
    } catch (err) {
        console.warn('⚠️ Failed to save mock data:', err);
        return false;
    }
};


export const mockPersonnelData: { [sensorId: string]: { name: string; contact: string; email: string } } = {};

export const mockUserActivities: UserActivity[] = [
    { id: 1, user_id: 1, action: 'System Setup', timestamp: new Date().toISOString(), details: 'Admin created the system' },
    { id: 2, user_id: 2, action: 'Login', timestamp: new Date().toISOString(), details: 'John Doe logged in' }
];

export const mockAlerts: Alert[] = [
    {
        id: 1,
        type: 'high_co2',
        status: 'active',
        description: 'CO2 levels exceeded threshold of 1000 ppm',
        remarks: 'Needs ventilation',
        sensor: 101,
        sensor_name: 'Sensor-A-G-CO2-03',
        area: 101,
        area_name: 'Ground Floor A',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        type: 'smoke_detected',
        status: 'active',
        description: 'Smoke detected in Server Room',
        remarks: 'Emergency protocol initiated',
        sensor: 701,
        sensor_name: 'S-A-F1-CO2-03',
        area: 102,
        area_name: 'First Floor A',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        type: 'high_temperature',
        status: 'resolved',
        description: 'Temperature spike in Building B',
        remarks: 'HVAC adjusted',
        sensor: 201,
        sensor_name: 'S-B2-G-WARN',
        area: 201,
        area_name: 'Ground Floor B',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
        id: 4,
        type: 'motion_alert',
        status: 'active',
        description: 'Unauthorized motion in Warehouse',
        sensor: 5,
        sensor_name: 'Perimeter-Cam',
        area: 200,
        area_name: 'Building B (Empty)',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 5,
        type: 'aqi_warning',
        status: 'acknowledged',
        description: 'Air Quality Index warning',
        remarks: 'Team notified',
        sensor: 470,
        sensor_name: 'SENTINEL-MIXED-STATUS',
        area: 102,
        area_name: 'First Floor A',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 43200000).toISOString()
    }
];

export const mockAlertTrends: AlertTrendResponse = {
    success: true,
    data: {
        period: '24h',
        interval: 'hour',
        chart_data: {
            labels: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
            values: [2, 3, 1, 0, 2, 4, 5, 3, 2, 1, 3, 4, 5, 6, 4, 3, 2, 1, 2, 3, 4, 2, 1, 0]
        }
    }
};


export const mockSensorConfigs: { [sensorId: string]: SensorConfig[] } = {
    'S-A-G-TEMP-01': [
        { id: 1, sensor_name: 'temp_c', enabled: true, min_value: 15, max_value: 30, threshold: 25 },
        { id: 2, sensor_name: 'humidity', enabled: false, min_value: 20, max_value: 80, threshold: 60 }
    ],
    'S-A-G-CO2-03': [
        { id: 3, sensor_name: 'co2', enabled: true, min_value: 0, max_value: 2000, threshold: 1000 }
    ]
};

export const mockAlertConfigurations: AlertConfiguration[] = [
    {
        id: 1,
        parameter: 'temp_c',
        parameter_label: 'Temperature (Celsius)',
        threshold_min: 18,
        threshold_max: 28,
        recipients: [
            { id: 1, type: 'user', name: 'admin' },
            { id: 1, type: 'group', name: 'Security Team' }
        ],
        actions: {
            email: true,
            sms: false,
            push_notification: true,
            in_app: true
        },
        enabled: true,
        created_at: '2026-01-20T10:00:00Z',
        updated_at: '2026-01-20T10:00:00Z',
        updated_by: 1
    },
    {
        id: 2,
        parameter: 'co2',
        parameter_label: 'Carbon Dioxide (ppm)',
        threshold_max: 1000,
        recipients: [
            { id: 1, type: 'group', name: 'Security Team' }
        ],
        actions: {
            email: true,
            sms: true,
            push_notification: true,
            in_app: true
        },
        enabled: true,
        created_at: '2026-01-20T10:00:00Z',
        updated_at: '2026-01-20T10:00:00Z',
        updated_by: 1
    },
    {
        id: 3,
        parameter: 'humidity',
        parameter_label: 'Humidity (%)',
        threshold_min: 30,
        threshold_max: 60,
        recipients: [
            { id: 2, type: 'user', name: 'viewer' }
        ],
        actions: {
            email: false,
            sms: false,
            push_notification: false,
            in_app: true
        },
        enabled: true,
        created_at: '2026-01-20T10:00:00Z',
        updated_at: '2026-01-20T10:00:00Z',
        updated_by: 1
    }
];

// Try to load persisted data on module initialization
loadMockData();
