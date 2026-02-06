import { Area } from "../../../../types/sensor";

/**
 * Flattens a recursive Area hierarchy into a single array.
 * Useful for finding all floors or rooms across a whole building tree.
 */
export function flattenAreas(areas: Area[]): Area[] {
    const flat: Area[] = [];
    const seenIds = new Set<number>();

    const traverse = (items: Area[]) => {
        items.forEach(item => {
            if (!seenIds.has(item.id)) {
                flat.push(item);
                seenIds.add(item.id);
            }
            if (item.subareas && item.subareas.length > 0) {
                traverse(item.subareas);
            }
        });
    };

    traverse(areas);
    return flat;
}
