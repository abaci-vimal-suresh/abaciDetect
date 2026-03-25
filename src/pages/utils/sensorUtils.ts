import { Sensor, SensorConfig, SensorLog } from '../../types/sensor';
import { SensorNode, HaloEventConfig, SensorLatestLog, AreaNode, AreaWall } from '../IoTVisualizer/Types/types';
import { findNodeById } from '../Dummy/dummyData';

export function enrichSensor(
    s: Sensor,
    tree: AreaNode,
): SensorNode {
    const isOnline = s.is_online ?? false;
    const areaId = typeof s.area === 'number' ? s.area : s.area?.id ?? null;

    // x_val=0 & y_val=0 is the API default for "Unplaced"
    const isUnplaced = (s.x_val === 0 && s.y_val === 0);
    const floorId = isUnplaced ? null : resolveFloorId(areaId, tree);

    return {
        // Spread all API fields
        ...s,
        // Override/compute Halo-specific fields
        id: Number(s.id),
        online_status: isOnline,
        sensor_status: isOnline ? 'online' : 'offline',
        floor_id: floorId,
        area_id: areaId,
        wall_ids: (s as any).walls?.map((w: any) => w.id) ?? [],
        sensor_group_ids: (s as any).sensor_groups?.map((g: any) => g.id) ?? [],
        x_val: s.x_val ?? 0,
        y_val: s.y_val ?? 0,
        z_val: s.z_val ?? 0.85,
        halo_color: isOnline ? '#06d6a0' : '#adb5bd',
        halo_radius: 5,
        halo_intensity: isOnline ? 0.35 : 0.15,
        event_configs: [],       // filled separately in Phase 4
        latest_log: null,     // filled separately in Phase 5
    } as SensorNode;
}

export function resolveFloorId(
    areaId: number | null | undefined,
    tree: AreaNode,
): number | null {
    if (!areaId) return null;
    const node = findNodeById(tree, areaId);
    if (!node) return null;
    if (node.area_type === 'Floor') return node.id;
    if (node.parent) {
        // Find parent node recursively
        return resolveFloorId(node.parent, tree);
    }
    return null;
}

export function adaptWall(w: any): AreaWall {
    return {
        ...w,
        area_id: w.area_id ?? w.area_ids?.[0],
        sub_area_id: w.sub_area_id ?? null,
        wall_shape: w.wall_shape ?? 'straight',
        r_z_offset: w.r_z_offset ?? 0,
        r_height: w.r_height ?? 3.0,
        thickness: w.thickness ?? 0.18,
        color: w.color ?? '#4a90d9',
        opacity: w.opacity ?? 0.85,
    };
}

export function adaptEventConfigs(
    configs: SensorConfig[]
): HaloEventConfig[] {
    return configs.map(c => ({
        id: c.id ?? 0,
        event_id: c.event_id ?? '',
        enabled: c.enabled ?? true,
        min_value: c.min_value ?? 0,
        threshold: c.threshold ?? 50,
        max_value: c.max_value ?? 100,
        led_color: c.led_color ?? 0x0088ff,
        led_pattern: c.led_pattern,
        led_priority: c.led_priority,
        sound: c.sound,
        halo_sensor: c.halo_sensor,
        current_value: null,
        is_triggered: false,
    }));
}

export function deriveHaloStatus(
    isOnline: boolean,
    configs: HaloEventConfig[],
): SensorNode['sensor_status'] {
    if (!isOnline) return 'offline';
    if (configs.some(c => c.is_triggered)) return 'alert';
    return 'online';
}

export function deriveHaloColor(
    status: SensorNode['sensor_status']
): string {
    const map = {
        online: '#06d6a0',
        offline: '#adb5bd',
        alert: '#e63946',
    };
    return map[status];
}

export function deriveHaloIntensity(
    status: SensorNode['sensor_status']
): number {
    const map = { online: 0.35, offline: 0.15, alert: 1.0 };
    return map[status];
}

export const METRIC_GROUPS = [
    {
        key: 'environment',
        label: 'Environment',
        icon: '🌡️',
        representative: 'temperature',
        repLabel: 'Temp',
        repUnit: '°C',
        metrics: ['temperature', 'humidity', 'pressure', 'light'],
    },
    {
        key: 'particles',
        label: 'Particles',
        icon: '🌫️',
        representative: 'pm25',
        repLabel: 'PM2.5',
        repUnit: 'µg',
        metrics: ['pm1', 'pm25', 'pm10'],
    },
    {
        key: 'air',
        label: 'Air Mix',
        icon: '🧪',
        representative: 'co2',
        repLabel: 'CO₂',
        repUnit: 'ppm',
        metrics: ['co', 'co2', 'tvoc', 'nh3', 'no2'],
    },
    {
        key: 'aqi',
        label: 'AQI Score',
        icon: '🛡️',
        representative: 'aqi',
        repLabel: 'AQI',
        repUnit: '',
        metrics: ['aqi', 'health'],
    },
    {
        key: 'motion',
        label: 'Activity',
        icon: '🏃',
        representative: 'movement',
        repLabel: 'Movement',
        repUnit: '',
        metrics: ['movement', 'motion'],
    },
    {
        key: 'sound',
        label: 'Sound',
        icon: '🔊',
        representative: 'noise',
        repLabel: 'Noise',
        repUnit: 'dB',
        metrics: ['sound', 'noise'],
    },
] as const;
