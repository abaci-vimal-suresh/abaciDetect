import { Area, Sensor, SubArea, User } from '../types/sensor';

export const mockUsers: User[] = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@gmail.com',
        first_name: 'Arun',
        last_name: '',
        role: 'Admin',
        is_active: true,
        created_at: new Date().toISOString(),
        assigned_area_ids: []
    },
    {
        id: 2,
        username: 'viewer',
        email: 'viewer@gmail.com',
        first_name: 'Vimal',
        last_name: '',
        role: 'Viewer',
        is_active: true,
        created_at: new Date().toISOString(),
        assigned_area_ids: [101, 201] // Assigned to Ground Floor A and Ground Floor B
    },
    {
        id: 3,
        username: 'rooney',
        email: 'rooney@gmail.com',
        first_name: 'Rooney',
        last_name: 'Sullivan',
        role: 'Viewer',
        is_active: true,
        created_at: new Date().toISOString(),
        assigned_area_ids: [102] // Assigned to First Floor A
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

export const mockSensorGroups: any[] = [
    {
        id: "1",
        name: "Ammonia Sensors",
        description: "Sensors monitoring NH3 levels in bathrooms",
        status: "Normal",
        sensorCount: 0,
        activeAlerts: 0,
        createdAt: "2026-01-14T10:00:00.000Z",
        updatedAt: "2026-01-14T10:00:00.000Z"
    },
    {
        id: "2",
        name: "Security Cams",
        description: "Motion detection cameras in hallways",
        status: "Warning",
        sensorCount: 0,
        activeAlerts: 1,
        createdAt: "2026-01-14T11:00:00.000Z",
        updatedAt: "2026-01-14T11:00:00.000Z"
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
        sensor_count: 5,
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
    // UNASSIGNED SENSORS (For Testing Placement)
    {
        id: 'S-NEW-001',
        name: 'New Temp Sensor',
        sensor_type: 'Temperature',
        status: 'Inactive', // Inactive until placed
        ip_address: '192.168.1.101',
        location: 'Production Line A',
        mac_address: '00:1A:2B:3C:4D:01',
        sensor_data: { val: 0, threshold: 30.0, sensors: { temp_c: 0 } } as any,
    },
    {
        id: 'S-NEW-002',
        name: 'New Humidity Sensor',
        sensor_type: 'Humidity',
        status: 'Inactive',
        ip_address: '192.168.1.102',
        location: 'Storage Room 4',
        mac_address: '00:1A:2B:3C:4D:02',
        sensor_data: { val: 0, threshold: 60.0, sensors: { humidity: 0 } } as any,
    },
    {
        id: 'S-NEW-003',
        name: 'New Motion Sensor',
        sensor_type: 'Motion',
        status: 'Inactive',
        ip_address: '192.168.1.103',
        location: 'Main Entrance',
        mac_address: '00:1A:2B:3C:4D:03',
        sensor_data: { val: 0, threshold: 1, sensors: { motion: 0 } } as any,
    },
    // TEST SENSORS FOR BUILDING 3
    {
        id: 'S-B3-F1-R1',
        name: 'B3-F1-RoomA Sensor',
        sensor_type: 'Temperature',
        status: 'warning',
        area_id: 302,
        floor_level: 1,
        x_coordinate: 0.25,
        y_coordinate: 0.25,
        ip_address: '10.0.1.20',
        location: 'Building 3 - Floor 1 - Room A',
        mac_address: 'B3:F1:R1:00:01',
        sensor_data: { val: 28, threshold: 25.0, sensors: { temp_c: 28 } } as any,
    },
    {
        id: 'S-B3-F2-R2',
        name: 'B3-F2-RoomB Sensor',
        sensor_type: 'CO2',
        status: 'critical',
        area_id: 306,
        floor_level: 2,
        x_coordinate: 0.75,
        y_coordinate: 0.25,
        ip_address: '10.0.2.22',
        location: 'Building 3 - Floor 2 - Room B',
        mac_address: 'B3:F2:R2:00:02',
        sensor_data: { val: 1200, threshold: 1000, sensors: { co2: 1200 } } as any,
    },
    // LARGE UNASSIGNED POOL FOR TESTING
    { id: 'POOL-001', name: 'Ambient Sensor Alpha', sensor_type: 'Temperature', status: 'Inactive', ip_address: '172.16.0.11', location: 'Lab 1', mac_address: 'AA:00:11:22:33:44', sensor_data: { val: 0, threshold: 25 } as any },
    { id: 'POOL-002', name: 'Security Sensor Beta', sensor_type: 'Motion', status: 'Inactive', ip_address: '172.16.0.12', location: 'Server Room', mac_address: 'BB:00:11:22:33:44', sensor_data: { val: 0, threshold: 1 } as any },
    { id: 'POOL-003', name: 'Air Quality Delta', sensor_type: 'CO2', status: 'Inactive', ip_address: '172.16.0.13', location: 'Conference Room', mac_address: 'CC:00:11:22:33:44', sensor_data: { val: 0, threshold: 1000 } as any },
    { id: 'POOL-004', name: 'Humidity Sigma', sensor_type: 'Humidity', status: 'Inactive', ip_address: '172.16.0.14', location: 'Data Center', mac_address: 'DD:00:11:22:33:44', sensor_data: { val: 0, threshold: 60 } as any },
    { id: 'POOL-005', name: 'Pressure Omega', sensor_type: 'Pressure', status: 'Inactive', ip_address: '172.16.0.15', location: 'Roof Top', mac_address: 'EE:00:11:22:33:44', sensor_data: { val: 0, threshold: 1013 } as any },
    { id: 'POOL-006', name: 'Light Sensor Gamma', sensor_type: 'Light', status: 'Inactive', ip_address: '172.16.0.16', location: 'Cafeteria', mac_address: 'FF:00:11:22:33:44', sensor_data: { val: 0, threshold: 500 } as any },
    { id: 'POOL-007', name: 'VOC Sensor Epsilon', sensor_type: 'VOC', status: 'Inactive', ip_address: '172.16.0.17', location: 'Office Area', mac_address: 'A1:00:11:22:33:44', sensor_data: { val: 0, threshold: 200 } as any },
    { id: 'POOL-008', name: 'Acoustic Sensor Zeta', sensor_type: 'Sound', status: 'Inactive', ip_address: '172.16.0.18', location: 'Break Room', mac_address: 'B2:00:11:22:33:44', sensor_data: { val: 0, threshold: 80 } as any },

    // STATUS-SPECIFIC UNASSIGNED SENSORS (For Visual Testing)
    {
        id: 'TEST-CRITICAL',
        name: 'Critical Alert Sensor',
        sensor_type: 'Temperature',
        status: 'critical',
        sensor_data: { val: 45, threshold: 30, sensors: { temp_c: 45 } } as any
    },
    {
        id: 'TEST-WARNING',
        name: 'Warning Level Sensor',
        sensor_type: 'Humidity',
        status: 'warning',
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
        sensor_data: { val: 450, threshold: 1000, sensors: { co2: 450 } } as any
    },
    {
        id: 'TEST-GUNSHOT',
        name: 'Tactical Acoustic Sensor',
        sensor_type: 'Sound',
        status: 'critical',
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
                health_index: 96, hi_co2: 98, hi_tvoc: 95, hi_pm25: 97, hi_no2: 94,
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
                health_index: 62, hi_co2: 68, hi_tvoc: 65, hi_pm25: 67, hi_no2: 64,
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
                health_index: 12, hi_co2: 8, hi_tvoc: 12, hi_pm25: 10, hi_no2: 15,
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
                health_index: 35, hi_co2: 45, hi_tvoc: 40, hi_pm25: 38, hi_no2: 42,
                // Sound: Safe (Green)
                motion: 15, noise: 48, aggression: 0, gunshot: 0
            }
        } as any
    },
    // BUILDING B - GROUND FLOOR (201)
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
        sensor_data: { val: 22, threshold: 25, sensors: { temp_c: 22 } } as any
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
        sensor_data: { val: 55, threshold: 60, sensors: { humidity: 55 } } as any
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
        sensor_data: { val: 1500, threshold: 1000, sensors: { co2: 1500 } } as any
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
        sensor_data: { val: 21, threshold: 25, sensors: { temp_c: 21 } } as any
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
        sensor_data: { val: 52, threshold: 60, sensors: { humidity: 52 } } as any
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
        sensor_data: { val: 1800, threshold: 1000, sensors: { co2: 1800 } } as any
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
        sensor_data: { val: 20, threshold: 25, sensors: { temp_c: 20 } } as any
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
        sensor_data: { val: 50, threshold: 60, sensors: { humidity: 50 } } as any
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
        sensor_data: { val: 2100, threshold: 1000, sensors: { co2: 2100 } } as any
    },
    // ============================================
    // UNASSIGNED SENSORS (For Drag & Drop Practice)
    // ============================================
    {
        id: 'S-UN-01',
        name: 'Unassigned Temp-01',
        sensor_type: 'Temperature',
        status: 'safe',
        area_id: undefined,
        floor_level: undefined,
        x_coordinate: undefined,
        y_coordinate: undefined,
        sensor_data: { val: 22, threshold: 25, sensors: { temp_c: 22 } } as any
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
        sensor_data: { val: 65, threshold: 60, sensors: { humidity: 65 } } as any
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
        sensor_data: { val: 1500, threshold: 1000, sensors: { co2: 1500 } } as any
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

// Try to load persisted data on module initialization
loadMockData();
