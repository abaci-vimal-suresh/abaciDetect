import { RoomVisibilitySettings } from '../Sensors/components/RoomSettingsPanel';

/**
 * Default configurations for the 3D room visualization.
 */
export const DEFAULT_ROOM_SETTINGS: RoomVisibilitySettings = {
    wallOpacity: 0.1,
    floorOpacity: 1,
    ceilingOpacity: 0.5,
    showWalls: true,
    showFloor: true,
    showCeiling: true,
    showLabels: true,
    wallHeight: 120,
    visibleFloors: [],
    floorSpacing: 400,
    floorOffset: 50,
    floorOffsets: {},
    showFloorLabels: true,
    cameraPreset: 'isometric',
    sectionCutEnabled: false,
    sectionCutPlane: 'y',
    sectionCutPosition: 0.5,
    floorScales: {},
    visionMode: 'none'
};

/**
 * Synchronizes the wall height based on the floor spacing (60% ratio).
 */
export const syncWallHeight = (floorSpacing: number): number => {
    return Math.floor(floorSpacing * 0.3);
};
