

import { Wall } from '../../../../types/sensor';


export interface WallDiff {
    created: Wall[];
    updated: Wall[];
    deleted: Wall[];
    unchanged: Wall[];
}

export interface WallDiffSummary {
    createdCount: number;
    updatedCount: number;
    deletedCount: number;
    unchangedCount: number;
    totalChanges: number;
    hasChanges: boolean;
}


export function calculateWallDiff(
    originalWalls: Wall[],
    currentWalls: Wall[]
): WallDiff {
    const created = currentWalls.filter(wall =>
        String(wall.id).startsWith('new-')
    );

    const deleted = originalWalls.filter(originalWall =>
        !currentWalls.find(currentWall => currentWall.id === originalWall.id)
    );

    const updated = currentWalls
        .filter(wall => !String(wall.id).startsWith('new-'))
        .filter(currentWall => {
            const originalWall = originalWalls.find(ow => ow.id === currentWall.id);
            if (!originalWall) return false;

            return !areWallsEqual(originalWall, currentWall);
        });

    const unchanged = currentWalls
        .filter(wall => !String(wall.id).startsWith('new-'))
        .filter(currentWall => {
            const originalWall = originalWalls.find(ow => ow.id === currentWall.id);
            if (!originalWall) return false;

            return areWallsEqual(originalWall, currentWall);
        });

    return {
        created,
        updated,
        deleted,
        unchanged
    };
}


export function getWallDiffSummary(diff: WallDiff): WallDiffSummary {
    const createdCount = diff.created.length;
    const updatedCount = diff.updated.length;
    const deletedCount = diff.deleted.length;
    const unchangedCount = diff.unchanged.length;
    const totalChanges = createdCount + updatedCount + deletedCount;
    const hasChanges = totalChanges > 0;

    return {
        createdCount,
        updatedCount,
        deletedCount,
        unchangedCount,
        totalChanges,
        hasChanges
    };
}


export function formatDiffSummary(diff: WallDiff): string {
    const summary = getWallDiffSummary(diff);

    if (!summary.hasChanges) {
        return 'No changes';
    }

    const parts: string[] = [];

    if (summary.createdCount > 0) {
        parts.push(`Create ${summary.createdCount}`);
    }

    if (summary.updatedCount > 0) {
        parts.push(`Update ${summary.updatedCount}`);
    }

    if (summary.deletedCount > 0) {
        parts.push(`Delete ${summary.deletedCount}`);
    }

    return parts.join(', ');
}


export function formatDiffSummaryVerbose(diff: WallDiff): string {
    const summary = getWallDiffSummary(diff);

    if (!summary.hasChanges) {
        return 'No changes to save';
    }

    const parts: string[] = [];

    if (summary.createdCount > 0) {
        const plural = summary.createdCount === 1 ? 'wall' : 'walls';
        parts.push(`Create ${summary.createdCount} ${plural}`);
    }

    if (summary.updatedCount > 0) {
        const plural = summary.updatedCount === 1 ? 'wall' : 'walls';
        parts.push(`Update ${summary.updatedCount} ${plural}`);
    }

    if (summary.deletedCount > 0) {
        const plural = summary.deletedCount === 1 ? 'wall' : 'walls';
        parts.push(`Delete ${summary.deletedCount} ${plural}`);
    }

    return parts.join(', ');
}


export function formatDiffDetailed(diff: WallDiff): string {
    const summary = getWallDiffSummary(diff);

    if (!summary.hasChanges) {
        return 'No changes to save.';
    }

    const lines: string[] = ['Changes to be saved:'];

    if (summary.createdCount > 0) {
        const plural = summary.createdCount === 1 ? 'wall' : 'walls';
        lines.push(`• ${summary.createdCount} ${plural} will be created`);
    }

    if (summary.updatedCount > 0) {
        const plural = summary.updatedCount === 1 ? 'wall' : 'walls';
        lines.push(`• ${summary.updatedCount} ${plural} will be updated`);
    }

    if (summary.deletedCount > 0) {
        const plural = summary.deletedCount === 1 ? 'wall' : 'walls';
        lines.push(`• ${summary.deletedCount} ${plural} will be deleted`);
    }

    return lines.join('\n');
}


export function areWallsEqual(wall1: Wall, wall2: Wall): boolean {
    // Compare coordinates
    if (wall1.r_x1 !== wall2.r_x1) return false;
    if (wall1.r_y1 !== wall2.r_y1) return false;
    if (wall1.r_x2 !== wall2.r_x2) return false;
    if (wall1.r_y2 !== wall2.r_y2) return false;

    // Compare geometry properties
    if ((wall1.r_height ?? 2.4) !== (wall2.r_height ?? 2.4)) return false;
    if ((wall1.r_z_offset ?? 0) !== (wall2.r_z_offset ?? 0)) return false;
    if ((wall1.thickness ?? 0.15) !== (wall2.thickness ?? 0.15)) return false;

    // Compare appearance properties
    if ((wall1.color ?? '#ffffff') !== (wall2.color ?? '#ffffff')) return false;
    if ((wall1.opacity ?? 0.7) !== (wall2.opacity ?? 0.7)) return false;

    // Compare area_ids arrays
    const area1 = wall1.area_ids ?? [];
    const area2 = wall2.area_ids ?? [];

    if (area1.length !== area2.length) return false;

    // Sort and compare (order shouldn't matter)
    const sorted1 = [...area1].sort();
    const sorted2 = [...area2].sort();

    for (let i = 0; i < sorted1.length; i++) {
        if (sorted1[i] !== sorted2[i]) return false;
    }

    // Walls are equal
    return true;
}


export function getChangedProperties(originalWall: Wall, currentWall: Wall): string[] {
    const changes: string[] = [];

    // Check coordinates
    if (originalWall.r_x1 !== currentWall.r_x1) changes.push('r_x1');
    if (originalWall.r_y1 !== currentWall.r_y1) changes.push('r_y1');
    if (originalWall.r_x2 !== currentWall.r_x2) changes.push('r_x2');
    if (originalWall.r_y2 !== currentWall.r_y2) changes.push('r_y2');

    // Check geometry
    if ((originalWall.r_height ?? 2.4) !== (currentWall.r_height ?? 2.4)) {
        changes.push('r_height');
    }
    if ((originalWall.r_z_offset ?? 0) !== (currentWall.r_z_offset ?? 0)) {
        changes.push('r_z_offset');
    }
    if ((originalWall.thickness ?? 0.15) !== (currentWall.thickness ?? 0.15)) {
        changes.push('thickness');
    }

    // Check appearance
    if ((originalWall.color ?? '#ffffff') !== (currentWall.color ?? '#ffffff')) {
        changes.push('color');
    }
    if ((originalWall.opacity ?? 0.7) !== (currentWall.opacity ?? 0.7)) {
        changes.push('opacity');
    }

    // Check area_ids
    const area1 = originalWall.area_ids ?? [];
    const area2 = currentWall.area_ids ?? [];

    if (area1.length !== area2.length ||
        !area1.every(id => area2.includes(id)) ||
        !area2.every(id => area1.includes(id))) {
        changes.push('area_ids');
    }

    return changes;
}


export function formatChangedProperties(changes: string[]): string {
    const labels: Record<string, string> = {
        r_x1: 'Start X',
        r_y1: 'Start Y',
        r_x2: 'End X',
        r_y2: 'End Y',
        r_height: 'Height',
        r_z_offset: 'Vertical Offset',
        thickness: 'Thickness',
        color: 'Color',
        opacity: 'Opacity',
        area_ids: 'Linked Areas'
    };

    // Group coordinate changes
    const hasCoordChange = changes.some(c => ['r_x1', 'r_y1', 'r_x2', 'r_y2'].includes(c));
    const otherChanges = changes.filter(c => !['r_x1', 'r_y1', 'r_x2', 'r_y2'].includes(c));

    const result: string[] = [];

    if (hasCoordChange) {
        result.push('Position');
    }

    otherChanges.forEach(change => {
        result.push(labels[change] || change);
    });

    return result.join(', ');
}


export function hasAnyChanges(originalWalls: Wall[], currentWalls: Wall[]): boolean {
    const diff = calculateWallDiff(originalWalls, currentWalls);
    const summary = getWallDiffSummary(diff);
    return summary.hasChanges;
}


export function getDeletedWallIds(originalWalls: Wall[], currentWalls: Wall[]): (number | string)[] {
    return originalWalls
        .filter(ow => !currentWalls.find(cw => cw.id === ow.id))
        .map(ow => ow.id);
}


export function getWallsToCreate(diff: WallDiff): Partial<Wall>[] {
    return diff.created.map(wall => {
        const { id, created_at, updated_at, ...payload } = wall;
        return payload;
    });
}


export function getWallsToUpdate(diff: WallDiff): Wall[] {
    return diff.updated;
}


export function getWallIdsToDelete(diff: WallDiff): (number | string)[] {
    return diff.deleted.map(w => w.id);
}