import { Area } from '../../types/sensor';
import { AreaNode } from '../IoTVisualizer/Types/types';

export function buildAreaTree(areas: Area[]): AreaNode {
    const map = new Map<number, AreaNode>();

    // Pass 1 — create all nodes
    areas.forEach(a => {
        const areaType = mapAreaType(a.area_type ?? '');
        const isFloor = areaType === 'Floor';
        map.set(a.id, {
            id: a.id,
            name: a.name,
            area_type: areaType,
            parent: a.parent_id ?? null,
            status: 'Active',
            capacity: a.sensor_count ?? 0,
            offset_x: a.offset_x ?? 0,
            offset_y: a.offset_y ?? 0,
            offset_z: a.offset_z ?? 0,
            floor_level: (a as any).floor_level ?? null,
            // Backend doesn't send floor dimensions — default to sensible values for floors
            floor_width: (a as any).floor_plan_width ?? (isFloor ? 20 : null),
            floor_depth: (a as any).floor_plan_height ?? (isFloor ? 15 : null),
            floor_height: (a as any).floor_height ?? (isFloor ? 3.0 : null),
            area_plan: a.area_plan ?? null,
            sensor_count: a.sensor_count,
            children: [],
        });
    });

    // Pass 2 — build tree, collect all root-level nodes
    const roots: AreaNode[] = [];
    map.forEach(node => {
        if (node.parent === null) {
            roots.push(node);
            return;
        }
        const parentNode = map.get(node.parent);
        if (parentNode) {
            if (!parentNode.children) parentNode.children = [];
            parentNode.children.push(node);
        }
    });

    // Pass 3 — auto-stack floors for every building whose floors all have offset_z = 0
    map.forEach(node => {
        if (node.area_type !== 'Building') return;
        const floors = (node.children ?? []).filter(c => c.area_type === 'Floor');
        autoStackFloors(floors);
    });

    // Single root that IS already a Site → return directly
    if (roots.length === 1 && roots[0].area_type === 'Site') return roots[0];

    // Single non-Site root (e.g. one Building with no site parent), or
    // multiple roots → wrap in a virtual Site node so the tree always has one root
    return {
        id: 0,
        name: 'Site',
        area_type: 'Site',
        parent: null,
        status: 'Active',
        capacity: 0,
        is_default_top_area: true,
        offset_x: 0,
        offset_y: 0,
        offset_z: 0,
        floor_level: null,
        floor_width: null,
        floor_depth: null,
        floor_height: null,
        area_plan: null,
        children: roots,
    };
}

// Auto-assign cumulative offset_z for floors whose backend offsets are all 0.
// Sorts by name keywords (basement < ground < first < second …) then by id.
function autoStackFloors(floors: AreaNode[]): void {
    if (floors.length === 0) return;
    const allAtZero = floors.every(f => (f.offset_z ?? 0) === 0);
    if (!allAtZero) return; // backend already set real offsets — don't override

    const sorted = [...floors].sort((a, b) => {
        const la = guessFloorLevel(a.name);
        const lb = guessFloorLevel(b.name);
        if (la !== lb) return la - lb;
        return a.id - b.id; // tie-break by id (creation order)
    });

    let cumZ = 0;
    sorted.forEach((floor, i) => {
        floor.offset_z = cumZ;
        floor.floor_level = i + 1;
        cumZ += floor.floor_height ?? 3.0;
    });
}

// Map a floor name to a numeric level for sorting.
function guessFloorLevel(name: string): number {
    const n = name.toLowerCase();
    if (/basement|underground|b\d/.test(n)) return -1;
    if (/ground|lobby|g\.?f|gf\b|floor\s*0|level\s*0/.test(n)) return 0;
    if (/\b1st|first|floor\s*1|level\s*1|1f\b/.test(n)) return 1;
    if (/\b2nd|second|floor\s*2|level\s*2|2f\b/.test(n)) return 2;
    if (/\b3rd|third|floor\s*3|level\s*3|3f\b/.test(n)) return 3;
    if (/\b4th|fourth|floor\s*4|level\s*4/.test(n)) return 4;
    if (/\b5th|fifth|floor\s*5|level\s*5/.test(n)) return 5;
    if (/roof|top|terrace|penthouse/.test(n)) return 99;
    // extract any leading number (e.g. "floor 7" → 7)
    const m = n.match(/(\d+)/);
    return m ? parseInt(m[1]) : 50;
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
