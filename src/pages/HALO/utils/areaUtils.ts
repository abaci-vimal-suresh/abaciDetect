import { Area } from '../../../types/sensor';
import { AreaNode } from '../Types/types';

export function buildAreaTree(areas: Area[]): AreaNode {
    const map = new Map<number, AreaNode>();

    // Pass 1 — create all nodes
    areas.forEach(a => {
        map.set(a.id, {
            id: a.id,
            name: a.name,
            area_type: mapAreaType(a.area_type ?? ''),
            parent: a.parent_id,
            status: 'Active',
            capacity: a.sensor_count ?? 0,
            offset_x: a.offset_x ?? 0,
            offset_y: a.offset_y ?? 0,
            offset_z: a.offset_z ?? 0,
            floor_level: a.floor_level ?? null,
            floor_width: a.floor_plan_width ?? null,
            floor_depth: a.floor_plan_height ?? null,
            floor_height: a.floor_height ?? 3.0,
            area_plan: a.area_plan ?? null,
            sensor_count: a.sensor_count,
            children: [],
        });
    });

    // Pass 2 — build tree
    let root: AreaNode | null = null;
    map.forEach(node => {
        if (node.parent === null) {
            root = node;
            return;
        }
        const parentNode = map.get(node.parent);
        if (parentNode) {
            if (!parentNode.children) parentNode.children = [];
            parentNode.children.push(node);
        }
    });

    return root!;
}

function mapAreaType(t: string): AreaNode['area_type'] {
    const m: Record<string, AreaNode['area_type']> = {
        site: 'Site',
        building: 'Building',
        floor: 'Floor',
        room: 'Area',
        others: 'Area',
    };
    return m[t.toLowerCase()] ?? 'Area';
}
