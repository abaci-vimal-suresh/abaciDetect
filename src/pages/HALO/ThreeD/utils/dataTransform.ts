import { Area } from "../../../../types/sensor";


export function flattenAreas(areas: any[], allAreas?: any[]): Area[] {
    const flat: Area[] = [];
    const seenIds = new Set<number>();

    const traverse = (items: any[]) => {
        items.forEach(item => {
            let areaObj: Area | undefined;

            if (typeof item === 'number' || typeof item === 'string') {
                areaObj = allAreas?.find(a => a.id === Number(item));
            } else if (item && typeof item === 'object') {
                areaObj = item as Area;
            }

            if (areaObj && !seenIds.has(areaObj.id)) {
                flat.push(areaObj);
                seenIds.add(areaObj.id);

                if (areaObj.subareas && areaObj.subareas.length > 0) {
                    traverse(areaObj.subareas);
                }
            }
        });
    };

    traverse(areas);
    return flat;
}
