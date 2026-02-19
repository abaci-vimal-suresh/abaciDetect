
import { Sensor, Wall, SensorUpdatePayload } from '../../../../types/sensor';


export interface SensorPositionPreview {
    sensorId: string | number;
    x_val: number;
    y_val: number;
    z_val: number;
}


export interface SensorWallsPreview {
    sensorId: string | number;
    walls: Wall[];
}


export interface AreaWallsPreview {
    areaId: number;
    walls: Wall[];
}


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


export interface PendingWall {
    areaId: number;
    wall: Partial<Wall>;
}


export type PreviewState =
    | { type: 'sensor_position'; data: SensorPositionPreview }
    | { type: 'sensor_walls'; data: SensorWallsPreview }
    | { type: 'area_walls'; data: AreaWallsPreview }
    | { type: 'wall_drawing'; data: WallDrawingPreview }
    | { type: 'pending_wall'; data: PendingWall }
    | null;


export function isSensorPositionPreview(state: PreviewState): state is { type: 'sensor_position'; data: SensorPositionPreview } {
    return !!state && state.type === 'sensor_position';
}


export function isSensorWallsPreview(state: PreviewState): state is { type: 'sensor_walls'; data: SensorWallsPreview } {
    return !!state && state.type === 'sensor_walls';
}


export function isAreaWallsPreview(state: PreviewState): state is { type: 'area_walls'; data: AreaWallsPreview } {
    return !!state && state.type === 'area_walls';
}


export function isWallDrawingPreview(state: PreviewState): state is { type: 'wall_drawing'; data: WallDrawingPreview } {
    return !!state && state.type === 'wall_drawing';
}


export function isPendingWallPreview(state: PreviewState): state is { type: 'pending_wall'; data: PendingWall } {
    return !!state && state.type === 'pending_wall';
}


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


export function createSensorWallsPreview(
    sensorId: string | number,
    walls: Wall[]
): PreviewState {
    return {
        type: 'sensor_walls',
        data: { sensorId, walls }
    };
}


export function createAreaWallsPreview(
    areaId: number,
    walls: Wall[]
): PreviewState {
    return {
        type: 'area_walls',
        data: { areaId, walls }
    };
}


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


export function createPendingWallPreview(
    areaId: number,
    wall: Partial<Wall>
): PreviewState {
    return {
        type: 'pending_wall',
        data: { areaId, wall }
    };
}


export function extractSensorId(state: PreviewState): string | number | null {
    if (isSensorPositionPreview(state)) return state.data.sensorId;
    if (isSensorWallsPreview(state)) return state.data.sensorId;
    return null;
}


export function extractAreaId(state: PreviewState): number | null {
    if (isAreaWallsPreview(state)) return state.data.areaId;
    if (isWallDrawingPreview(state)) return state.data.areaId;
    if (isPendingWallPreview(state)) return state.data.areaId;
    return null;
}

export function extractWalls(state: PreviewState): Wall[] | null {
    if (isSensorWallsPreview(state)) return state.data.walls;
    if (isAreaWallsPreview(state)) return state.data.walls;
    return null;
}


export function affectsSensor(state: PreviewState, sensorId: string | number): boolean {
    const previewSensorId = extractSensorId(state);
    return previewSensorId !== null && String(previewSensorId) === String(sensorId);
}


export function affectsArea(state: PreviewState, areaId: number): boolean {
    const previewAreaId = extractAreaId(state);
    return previewAreaId !== null && previewAreaId === areaId;
}