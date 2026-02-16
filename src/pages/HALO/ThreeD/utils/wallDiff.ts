/**
 * Wall Difference Calculation Utilities
 * 
 * Purpose: Fixes Issue #14 (Save button shows no summary of changes)
 * 
 * Problem:
 * - User clicks "Save Changes" but has no idea what will happen
 * - Could accidentally delete walls or create duplicates
 * - No way to review changes before committing
 * 
 * Solution:
 * - Calculate diff between original and current wall states
 * - Show clear summary: "Create 2, Update 1, Delete 3"
 * - Allow user to review before saving
 */

import { Wall } from '../../../../types/sensor';

// ============================================
// DIFF TYPES
// ============================================

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

// ============================================
// DIFF CALCULATION
// ============================================

/**
 * Calculate the difference between original and current wall states
 * 
 * Categorizes walls into:
 * - Created: New walls (ID starts with "new-")
 * - Updated: Existing walls with modified properties
 * - Deleted: Original walls not present in current state
 * - Unchanged: Walls that haven't been modified
 * 
 * @param originalWalls - Initial wall state (from API)
 * @param currentWalls - Current wall state (after edits)
 * @returns Detailed diff object
 */
export function calculateWallDiff(
    originalWalls: Wall[],
    currentWalls: Wall[]
): WallDiff {
    // Identify created walls (new IDs)
    const created = currentWalls.filter(wall =>
        String(wall.id).startsWith('new-')
    );

    // Identify deleted walls (in original but not in current)
    const deleted = originalWalls.filter(originalWall =>
        !currentWalls.find(currentWall => currentWall.id === originalWall.id)
    );

    // Identify updated walls (in both, but with different properties)
    const updated = currentWalls
        .filter(wall => !String(wall.id).startsWith('new-')) // Only existing walls
        .filter(currentWall => {
            const originalWall = originalWalls.find(ow => ow.id === currentWall.id);
            if (!originalWall) return false;

            // Compare wall properties to detect changes
            return !areWallsEqual(originalWall, currentWall);
        });

    // Identify unchanged walls (in both, with same properties)
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

/**
 * Get summary statistics from a wall diff
 * 
 * @param diff - Wall diff object
 * @returns Summary with counts and flags
 */
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

// ============================================
// FORMATTING
// ============================================

/**
 * Format diff summary as human-readable text
 * 
 * Examples:
 * - "Create 2, Update 1, Delete 3"
 * - "Create 1 wall"
 * - "Update 2 walls"
 * - "No changes"
 * 
 * @param diff - Wall diff object
 * @returns Formatted string
 */
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

/**
 * Format diff summary with wall/walls pluralization
 * 
 * Examples:
 * - "Create 1 wall, Update 2 walls"
 * - "Delete 3 walls"
 * 
 * @param diff - Wall diff object
 * @returns Formatted string with proper pluralization
 */
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

/**
 * Format diff as detailed multi-line description
 * 
 * Example:
 * ```
 * Changes to be saved:
 * • 2 walls will be created
 * • 1 wall will be updated
 * • 3 walls will be deleted
 * ```
 * 
 * @param diff - Wall diff object
 * @returns Multi-line formatted string
 */
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

// ============================================
// COMPARISON UTILITIES
// ============================================

/**
 * Compare two walls for equality
 * 
 * Compares all relevant properties except timestamps
 * 
 * @param wall1 - First wall
 * @param wall2 - Second wall
 * @returns True if walls are equal
 */
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

/**
 * Get list of changed properties between two walls
 * 
 * @param originalWall - Original wall
 * @param currentWall - Current wall
 * @returns Array of property names that changed
 */
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

/**
 * Format changed properties as human-readable text
 * 
 * Example: "Position, Height, Color"
 * 
 * @param changes - Array of changed property names
 * @returns Formatted string
 */
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

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if any changes exist in current state
 * 
 * @param originalWalls - Original walls
 * @param currentWalls - Current walls
 * @returns True if any changes exist
 */
export function hasAnyChanges(originalWalls: Wall[], currentWalls: Wall[]): boolean {
    const diff = calculateWallDiff(originalWalls, currentWalls);
    const summary = getWallDiffSummary(diff);
    return summary.hasChanges;
}

/**
 * Get IDs of walls that will be deleted
 * 
 * @param originalWalls - Original walls
 * @param currentWalls - Current walls
 * @returns Array of wall IDs to delete
 */
export function getDeletedWallIds(originalWalls: Wall[], currentWalls: Wall[]): (number | string)[] {
    return originalWalls
        .filter(ow => !currentWalls.find(cw => cw.id === ow.id))
        .map(ow => ow.id);
}

/**
 * Get walls that need to be created (API payload)
 * 
 * Strips temporary IDs and returns payload-ready objects
 * 
 * @param diff - Wall diff object
 * @returns Array of wall objects ready for POST
 */
export function getWallsToCreate(diff: WallDiff): Partial<Wall>[] {
    return diff.created.map(wall => {
        const { id, created_at, updated_at, ...payload } = wall;
        return payload;
    });
}

/**
 * Get walls that need to be updated (API payload)
 * 
 * @param diff - Wall diff object
 * @returns Array of wall objects ready for PATCH
 */
export function getWallsToUpdate(diff: WallDiff): Wall[] {
    return diff.updated;
}

/**
 * Get IDs of walls to delete (API payload)
 * 
 * @param diff - Wall diff object
 * @returns Array of wall IDs ready for DELETE
 */
export function getWallIdsToDelete(diff: WallDiff): (number | string)[] {
    return diff.deleted.map(w => w.id);
}