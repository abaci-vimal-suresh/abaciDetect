import { Area } from "../../types/sensor";

export interface BreadcrumbPathItem {
    title: string;
    to: string;
    tag?: 'li';
}

// Builds a breadcrumb path from the main area to the current subarea.
export const buildAreaBreadcrumbPath = (
    currentArea: Area | undefined,
    allAreas: Area[] | undefined,
    rootAreaId: string | number
): BreadcrumbPathItem[] => {
    if (!currentArea || !allAreas || !rootAreaId) return [];

    const path: Area[] = [];
    let cur: Area | undefined = currentArea;
    const targetRootId = Number(rootAreaId);

    // Traverse up the tree until we hit the main area or root
    while (cur && cur.id !== targetRootId) {
        path.unshift(cur);

        // Try parent_id first
        let nextParent: Area | undefined = cur.parent_id
            ? allAreas.find(a => a.id === cur?.parent_id)
            : undefined;

        // Fallback: search which area contains this one in its subareas array
        if (!nextParent) {
            nextParent = allAreas.find(a => a.subareas?.some(s => s.id === cur?.id));
        }

        if (!nextParent || nextParent.id === cur.id) break;
        cur = nextParent;
    }

    return path.map((item, index) => ({
        title: item.name,
        to: index === path.length - 1 ? '' : `/halo/sensors/areas/${rootAreaId}/subzones/${item.id}`,
        tag: 'li' as const
    }));
};
