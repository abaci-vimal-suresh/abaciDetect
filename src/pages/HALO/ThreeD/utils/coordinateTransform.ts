import { Box3, Vector3 } from 'three';
import { Sensor, Area } from '../../../../types/sensor';

/**
 * Floor calibration data extracted from .glb model
 */
export interface FloorCalibration {
    width: number;
    depth: number;
    height: number;
    minX: number;
    minZ: number;
    minY: number;
    centerX: number;
    centerZ: number;
}

/**
 * Default calibration for the level-react-draco.glb model
 * These values are approximate and should be auto-calibrated when possible
 */
export const DEFAULT_FLOOR_CALIBRATION: FloorCalibration = {
    width: 30,
    depth: 30,
    height: 2.4,
    minX: -15,
    minZ: -15,
    minY: 0,
    centerX: 0,
    centerZ: 0
};

/**
 * Transform normalized sensor coordinates (0-1) to 3D world space
 */
export function transformSensorTo3D(
    sensor: Sensor,
    calibration: FloorCalibration,
    baseLevel: number = 0,
    floorSpacing: number = 4
): { x: number; y: number; z: number } {
    const x_val = sensor.x_val ?? 0.5;
    const y_val = sensor.y_val ?? 0.5;

    // Floor level determines the major vertical jump
    const floorY = baseLevel * floorSpacing;

    // verticalHeight determines the height WITHIN the floor context
    // In backend data, z_val (e.g. 0.9) is height within floor
    const z_max = sensor.z_max ?? sensor.boundary?.z_max ?? 1;
    const verticalOffset = (sensor.z_val !== undefined)
        ? sensor.z_val
        : z_max;

    // Map normalized coordinates to 3D space
    // No lift - sit exactly on image if verticalOffset is 0
    const BASE_LIFT = 0;
    const x = calibration.minX + (x_val * calibration.width);
    const z = calibration.minZ + (y_val * calibration.depth);
    const y = floorY + (verticalOffset * calibration.height) + BASE_LIFT;

    return { x, y, z };
}

/**
 * Transform normalized boundary to 3D box dimensions
 */
export function transformBoundaryTo3D(
    sensor: Sensor,
    calibration: FloorCalibration,
    baseLevel: number = 0,
    floorSpacing: number = 4
): { position: [number, number, number]; size: [number, number, number] } | null {
    // Check if sensor has boundary data
    const hasDirectBoundary = sensor.x_min !== undefined && sensor.x_max !== undefined;
    const hasNestedBoundary = sensor.boundary !== undefined;

    if (!hasDirectBoundary && !hasNestedBoundary) return null;

    const x_min = sensor.x_min ?? sensor.boundary?.x_min ?? 0;
    const x_max = sensor.x_max ?? sensor.boundary?.x_max ?? 1;
    const y_min = sensor.y_min ?? sensor.boundary?.y_min ?? 0;
    const y_max = sensor.y_max ?? sensor.boundary?.y_max ?? 1;
    const z_min = sensor.z_min ?? sensor.boundary?.z_min ?? 0;
    const z_max = sensor.z_max ?? sensor.boundary?.z_max ?? 1;

    const floorY = baseLevel * floorSpacing;
    const BASE_LIFT = 0; // Sit exactly on floor for accurate placement
    const MIN_HEIGHT_PELS = 25; // Guaranteed 3D volume even if data is thin

    // Calculate 3D coordinates
    const x3D_min = calibration.minX + (x_min * calibration.width);
    const x3D_max = calibration.minX + (x_max * calibration.width);
    const z3D_min = calibration.minZ + (y_min * calibration.depth);
    const z3D_max = calibration.minZ + (y_max * calibration.depth);

    // Vertical scaling
    let y3D_min = floorY + (z_min * calibration.height) + BASE_LIFT;
    let y3D_max = floorY + (z_max * calibration.height) + BASE_LIFT;

    // Ensure 3D volume
    if (Math.abs(y3D_max - y3D_min) < MIN_HEIGHT_PELS) {
        y3D_max = y3D_min + MIN_HEIGHT_PELS;
    }

    // Calculate center position and size
    const position: [number, number, number] = [
        (x3D_min + x3D_max) / 2,
        (y3D_min + y3D_max) / 2,
        (z3D_min + z3D_max) / 2
    ];

    const size: [number, number, number] = [
        Math.abs(x3D_max - x3D_min),
        Math.abs(y3D_max - y3D_min),
        Math.abs(z3D_max - z3D_min)
    ];

    return { position, size };
}

/**
 * Get sensor status color
 */
export function getSensorStatusColor(sensor: Sensor): string {
    const status = sensor.status?.toLowerCase();

    switch (status) {
        case 'critical':
            return '#EF4444';
        case 'warning':
            return '#F59E0B';
        case 'safe':
        default:
            return '#10B981';
    }
}

/**
 * Determine sensor status from sensor data
 */
export function calculateSensorStatus(sensor: Sensor): 'safe' | 'warning' | 'critical' {
    if (sensor.status) {
        const status = sensor.status.toLowerCase();
        if (status === 'critical') return 'critical';
        if (status === 'warning') return 'warning';
        return 'safe';
    }

    // Fallback: calculate from sensor data
    const val = sensor.sensor_data?.val || 0;
    const threshold = sensor.sensor_data?.threshold || 100;

    if (val >= threshold) return 'critical';
    if (val >= threshold * 0.8) return 'warning';
    return 'safe';
}

/**
 * Transform 3D world coordinates back to normalized sensor coordinates (0-1)
 */
export function transform3DToSensor(
    position: { x: number; y: number; z: number },
    calibration: FloorCalibration,
    baseLevel: number = 0,
    floorSpacing: number = 4
): { x_val: number; y_val: number; z_val: number } {
    const floorY = baseLevel * floorSpacing;
    const BASE_LIFT = 0;

    // Calculate normalized coordinates
    // Ensure we don't divide by zero
    const x_val = calibration.width !== 0
        ? (position.x - calibration.minX) / calibration.width
        : 0.5;

    const y_val = calibration.depth !== 0
        ? (position.z - calibration.minZ) / calibration.depth
        : 0.5;

    const z_val = calibration.height !== 0
        ? (position.y - floorY - BASE_LIFT) / calibration.height
        : 0;

    return {
        x_val: Math.max(0, Math.min(1, x_val)),
        y_val: Math.max(0, Math.min(1, y_val)),
        z_val: Math.max(0, Math.min(1, z_val))
    };
}

/**
 * Transform normalized wall coordinates to 3D position, rotation and size
 */
export function transformWallTo3D(
    wall: any, // Can be Wall or plain object from API
    calibration: FloorCalibration,
    baseLevelY: number = 0
): { position: [number, number, number]; rotation: [number, number, number]; size: [number, number, number] } {
    // 1. Map normalized points to 3D space
    const x1 = calibration.minX + (wall.r_x1 * calibration.width);
    const z1 = calibration.minZ + (wall.r_y1 * calibration.depth);
    const x2 = calibration.minX + (wall.r_x2 * calibration.width);
    const z2 = calibration.minZ + (wall.r_y2 * calibration.depth);

    // 2. Calculate vector and length
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);

    // 3. Calculate center point (Horizontal)
    const centerX = (x1 + x2) / 2;
    const centerZ = (z1 + z2) / 2;

    // 4. Calculate Vertical position and size
    const wallHeight = wall.r_height ?? 2.4;
    const zOffset = wall.r_z_offset ?? 0;
    const centerY = baseLevelY + zOffset + (wallHeight / 2);

    // 5. Calculate rotation (Y-axis)
    const rotationY = -Math.atan2(dz, dx);

    return {
        position: [centerX, centerY, centerZ],
        rotation: [0, rotationY, 0],
        size: [length, wallHeight, wall.thickness ?? 0.15]
    };
}

/**
 * Transform 3D world translation back to normalized wall coordinates
 */
export function transform3DToWall(
    currentWall: any,
    translation3D: { x: number; y: number; z: number },
    calibration: FloorCalibration
): { r_x1: number; r_y1: number; r_x2: number; r_y2: number; r_z_offset: number } {
    // Calculate normalized deltas
    const deltaX = calibration.width !== 0 ? translation3D.x / calibration.width : 0;
    const deltaY = calibration.depth !== 0 ? translation3D.z / calibration.depth : 0;
    const deltaZ = translation3D.y; // Keep vertical in meters as per API expectation for z_offset if applicable

    return {
        r_x1: Math.max(0, Math.min(1, currentWall.r_x1 + deltaX)),
        r_y1: Math.max(0, Math.min(1, currentWall.r_y1 + deltaY)),
        r_x2: Math.max(0, Math.min(1, currentWall.r_x2 + deltaX)),
        r_y2: Math.max(0, Math.min(1, currentWall.r_y2 + deltaY)),
        r_z_offset: (currentWall.r_z_offset || 0) + deltaZ
    };
}

/**
 * Transform 3D world coordinates to normalized 0-1 coordinates
 * This is the INVERSE of the transformation used in transformWallTo3D
 * Used for converting raycasting click positions to wall coordinates
 * 
 * ✨ ENHANCED: Now includes validation and clamping (Fixes Issue #7)
 */
export function transform3DToNormalized(
    position: { x: number; y: number; z: number },
    calibration: FloorCalibration,
    baseLevelY: number = 0
): { x: number; y: number } {
    // Reverse the transformation from transformWallTo3D
    // Account for centering offset
    const adjustedX = position.x - calibration.minX;
    const adjustedZ = position.z - calibration.minZ;

    // Convert to normalized 0-1 coordinates
    const normalizedX = calibration.width !== 0 ? adjustedX / calibration.width : 0.5;
    const normalizedY = calibration.depth !== 0 ? adjustedZ / calibration.depth : 0.5;

    // ✨ NEW: Track if clamping occurred
    const wasClampedX = normalizedX < 0 || normalizedX > 1;
    const wasClampedY = normalizedY < 0 || normalizedY > 1;

    // ✨ NEW: Clamp to 0-1 range to ensure valid coordinates (Fixes Issue #7)
    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));

    // ✨ NEW: Warn if clamping occurred (helps with debugging)
    if (wasClampedX || wasClampedY) {
        console.warn('⚠️ Wall coordinates were outside bounds and have been clamped:', {
            original: {
                x: normalizedX.toFixed(3),
                y: normalizedY.toFixed(3)
            },
            clamped: {
                x: clampedX.toFixed(3),
                y: clampedY.toFixed(3)
            },
            position3D: {
                x: position.x.toFixed(2),
                y: position.y.toFixed(2),
                z: position.z.toFixed(2)
            },
            calibration: {
                minX: calibration.minX,
                minZ: calibration.minZ,
                width: calibration.width,
                depth: calibration.depth
            }
        });
    }

    return {
        x: clampedX,
        y: clampedY
    };
}

/**
 * ✨ NEW: Validate if 3D coordinates are within calibration bounds
 * 
 * Purpose: Pre-validate coordinates before transformation
 * 
 * @param position - 3D world position
 * @param calibration - Floor calibration
 * @returns Validation result with details
 */
export function validate3DCoordinates(
    position: { x: number; y: number; z: number },
    calibration: FloorCalibration
): {
    valid: boolean;
    withinBounds: boolean;
    normalizedX: number;
    normalizedZ: number;
    reason?: string;
} {
    const adjustedX = position.x - calibration.minX;
    const adjustedZ = position.z - calibration.minZ;

    const normalizedX = calibration.width !== 0 ? adjustedX / calibration.width : 0.5;
    const normalizedZ = calibration.depth !== 0 ? adjustedZ / calibration.depth : 0.5;

    const withinBounds = normalizedX >= 0 && normalizedX <= 1 && normalizedZ >= 0 && normalizedZ <= 1;

    if (!withinBounds) {
        return {
            valid: false,
            withinBounds: false,
            normalizedX,
            normalizedZ,
            reason: `Coordinates outside building bounds: X=${normalizedX.toFixed(2)}, Z=${normalizedZ.toFixed(2)}`
        };
    }

    return {
        valid: true,
        withinBounds: true,
        normalizedX,
        normalizedZ
    };
}