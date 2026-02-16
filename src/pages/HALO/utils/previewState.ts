/**
 * Unified Preview State Management
 * 
 * Purpose: Fixes Issue #3 (fragmented preview state in ThreeDPage)
 * 
 * Problem:
 * - ThreeDPage had 3 separate preview states: previewSensor, previewAreaWalls, newlyCreatedWall
 * - BuildingScene didn't know which one to use
 * - Race conditions and conflicts between preview types
 * 
 * Solution:
 * - Discriminated union type for type-safe preview state
 * - Single source of truth
 * - TypeScript ensures correct usage
 */

import { Sensor, Wall, SensorUpdatePayload } from '../../../types/sensor';

// ============================================
// PREVIEW STATE TYPES
// ============================================

/**
 * Sensor position preview
 * Used when dragging a sensor in 3D space
 */
export interface SensorPositionPreview {
    sensorId: string | number;
    x_val: number;
    y_val: number;
    z_val: number;
}

/**
 * Sensor walls preview
 * Used when editing walls linked to a sensor
 */
export interface SensorWallsPreview {
    sensorId: string | number;
    walls: Wall[];
}

/**
 * Area walls preview
 * Used when editing walls for an entire area/floor
 */
export interface AreaWallsPreview {
    areaId: number;
    walls: Wall[];
}

/**
 * Wall drawing preview
 * Used during the 2-click wall creation process
 */
export interface WallDrawingPreview {
    areaId: number;
    firstPoint: {
        x: number;
        y: number;
        z: number;
        floorY: number;
    };
    previewEndPoint?: {
        x: number;
        y: number;
        z: number;
    };
}

/**
 * Pending wall (not yet saved)
 * Used to buffer a wall that was just drawn but not committed
 */
export interface PendingWall {
    areaId: number;
    wall: Partial<Wall>;
}

// ============================================
// DISCRIMINATED UNION
// ============================================

/**
 * Unified preview state using discriminated union
 * 
 * TypeScript will ensure you check the 'type' field before accessing data
 * 
 * Example usage:
 * ```typescript
 * if (previewState?.type === 'sensor_position') {
 *     // TypeScript knows previewState.data is SensorPositionPreview
 *     const { x_val, y_val } = previewState.data;
 * }
 * ```
 */
export type PreviewState =
    | { type: 'sensor_position'; data: SensorPositionPreview }
    | { type: 'sensor_walls'; data: SensorWallsPreview }
    | { type: 'area_walls'; data: AreaWallsPreview }
    | { type: 'wall_drawing'; data: WallDrawingPreview }
    | { type: 'pending_wall'; data: PendingWall }
    | null;

// ============================================
// HELPER FUNCTIONS - TYPE GUARDS
// ============================================

/**
 * Type guard: Check if preview is sensor position
 */
export function isSensorPositionPreview(state: PreviewState): state is { type: 'sensor_position'; data: SensorPositionPreview } {
    return state !== null && state.type === 'sensor_position';
}

/**
 * Type guard: Check if preview is sensor walls
 */
export function isSensorWallsPreview(state: PreviewState): state is { type: 'sensor_walls'; data: SensorWallsPreview } {
    return state !== null && state.type === 'sensor_walls';
}

/**
 * Type guard: Check if preview is area walls
 */
export function isAreaWallsPreview(state: PreviewState): state is { type: 'area_walls'; data: AreaWallsPreview } {
    return state !== null && state.type === 'area_walls';
}

/**
 * Type guard: Check if preview is wall drawing
 */
export function isWallDrawingPreview(state: PreviewState): state is { type: 'wall_drawing'; data: WallDrawingPreview } {
    return state !== null && state.type === 'wall_drawing';
}

/**
 * Type guard: Check if preview is pending wall
 */
export function isPendingWallPreview(state: PreviewState): state is { type: 'pending_wall'; data: PendingWall } {
    return state !== null && state.type === 'pending_wall';
}

// ============================================
// HELPER FUNCTIONS - CREATORS
// ============================================

/**
 * Create sensor position preview state
 */
export function createSensorPositionPreview(
    sensorId: string | number,
    x_val: number,
    y_val: number,
    z_val: number
): PreviewState {
    return {
        type: 'sensor_position',
        data: { sensorId, x_val, y_val, z_val }
    };
}

/**
 * Create sensor walls preview state
 */
export function createSensorWallsPreview(
    sensorId: string | number,
    walls: Wall[]
): PreviewState {
    return {
        type: 'sensor_walls',
        data: { sensorId, walls }
    };
}

/**
 * Create area walls preview state
 */
export function createAreaWallsPreview(
    areaId: number,
    walls: Wall[]
): PreviewState {
    return {
        type: 'area_walls',
        data: { areaId, walls }
    };
}

/**
 * Create wall drawing preview state
 */
export function createWallDrawingPreview(
    areaId: number,
    firstPoint: { x: number; y: number; z: number; floorY: number },
    previewEndPoint?: { x: number; y: number; z: number }
): PreviewState {
    return {
        type: 'wall_drawing',
        data: { areaId, firstPoint, previewEndPoint }
    };
}

/**
 * Create pending wall preview state
 */
export function createPendingWallPreview(
    areaId: number,
    wall: Partial<Wall>
): PreviewState {
    return {
        type: 'pending_wall',
        data: { areaId, wall }
    };
}

// ============================================
// HELPER FUNCTIONS - EXTRACTORS
// ============================================

/**
 * Extract sensor ID from preview state (if applicable)
 */
export function extractSensorId(state: PreviewState): string | number | null {
    if (isSensorPositionPreview(state)) return state.data.sensorId;
    if (isSensorWallsPreview(state)) return state.data.sensorId;
    return null;
}

/**
 * Extract area ID from preview state (if applicable)
 */
export function extractAreaId(state: PreviewState): number | null {
    if (isAreaWallsPreview(state)) return state.data.areaId;
    if (isWallDrawingPreview(state)) return state.data.areaId;
    if (isPendingWallPreview(state)) return state.data.areaId;
    return null;
}

/**
 * Extract walls from preview state (if applicable)
 */
export function extractWalls(state: PreviewState): Wall[] | null {
    if (isSensorWallsPreview(state)) return state.data.walls;
    if (isAreaWallsPreview(state)) return state.data.walls;
    return null;
}

/**
 * Check if preview state affects a specific sensor
 */
export function affectsSensor(state: PreviewState, sensorId: string | number): boolean {
    const previewSensorId = extractSensorId(state);
    return previewSensorId !== null && String(previewSensorId) === String(sensorId);
}

/**
 * Check if preview state affects a specific area
 */
export function affectsArea(state: PreviewState, areaId: number): boolean {
    const previewAreaId = extractAreaId(state);
    return previewAreaId !== null && previewAreaId === areaId;
}