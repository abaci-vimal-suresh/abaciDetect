

import * as THREE from 'three';
import { Wall } from '../../../../types/sensor';
import { FloorCalibration } from './coordinateTransform';
import {
    MIN_WALL_LENGTH,
    MAX_WALL_LENGTH,
    MIN_WALL_HEIGHT,
    MAX_WALL_HEIGHT,
    FLOOR_Y_TOLERANCE
} from '../../../../constants/wallDefaults';


export interface ValidationResult {
    valid: boolean;
    reason?: string;
    severity?: 'error' | 'warning' | 'info';
}


export function validateWallClick(
    point: THREE.Vector3,
    areaId: number | undefined,
    calibration: FloorCalibration
): ValidationResult {
    if (areaId === undefined) {
        return {
            valid: false,
            reason: 'Click must be on a floor surface. Try clicking directly on the floor plan.',
            severity: 'error'
        };
    }

    const normalizedX = (point.x - calibration.minX) / calibration.width;
    if (normalizedX < -0.1 || normalizedX > 1.1) {
        return {
            valid: false,
            reason: `Click is outside building bounds (X: ${normalizedX.toFixed(2)}). Click within the floor area.`,
            severity: 'error'
        };
    }

    const normalizedZ = (point.z - calibration.minZ) / calibration.depth;
    if (normalizedZ < -0.1 || normalizedZ > 1.1) {
        return {
            valid: false,
            reason: `Click is outside building bounds (Z: ${normalizedZ.toFixed(2)}). Click within the floor area.`,
            severity: 'error'
        };
    }

    if (normalizedX < 0.05 || normalizedX > 0.95 || normalizedZ < 0.05 || normalizedZ > 0.95) {
        return {
            valid: true,
            reason: 'Click is very close to the edge of the building. Wall may be cut off.',
            severity: 'warning'
        };
    }

    return { valid: true };
}


export function validateWallSegment(
    point1: THREE.Vector3,
    point2: THREE.Vector3,
    floorY: number
): ValidationResult {
    // Check 1: Both points must be on the same floor
    if (Math.abs(point1.y - floorY) > FLOOR_Y_TOLERANCE) {
        return {
            valid: false,
            reason: `First point is not on the floor surface (Y difference: ${Math.abs(point1.y - floorY).toFixed(2)}m)`,
            severity: 'error'
        };
    }

    if (Math.abs(point2.y - floorY) > FLOOR_Y_TOLERANCE) {
        return {
            valid: false,
            reason: `Second point is not on the floor surface (Y difference: ${Math.abs(point2.y - floorY).toFixed(2)}m). Walls must be on the same floor.`,
            severity: 'error'
        };
    }

    // Check 2: Calculate distance
    const distance = point1.distanceTo(point2);

    // Check 3: Minimum length
    if (distance < MIN_WALL_LENGTH) {
        return {
            valid: false,
            reason: `Wall too short (${(distance * 100).toFixed(1)}cm). Minimum length is ${(MIN_WALL_LENGTH * 100).toFixed(0)}cm.`,
            severity: 'error'
        };
    }

    // Check 4: Maximum length
    if (distance > MAX_WALL_LENGTH) {
        return {
            valid: false,
            reason: `Wall too long (${distance.toFixed(1)}m). Maximum length is ${MAX_WALL_LENGTH}m.`,
            severity: 'error'
        };
    }

    // Check 5: Warning for very short walls
    if (distance < 0.5) {
        return {
            valid: true,
            reason: `Wall is quite short (${distance.toFixed(2)}m). Consider making it longer for visibility.`,
            severity: 'warning'
        };
    }

    // Check 6: Warning for very long walls
    if (distance > 50) {
        return {
            valid: true,
            reason: `Wall is very long (${distance.toFixed(1)}m). Consider splitting into multiple segments.`,
            severity: 'warning'
        };
    }

    return { valid: true };
}


export function validateWallHeight(height: number): ValidationResult {
    if (height < MIN_WALL_HEIGHT) {
        return {
            valid: false,
            reason: `Wall height too low (${height}m). Minimum is ${MIN_WALL_HEIGHT}m.`,
            severity: 'error'
        };
    }

    if (height > MAX_WALL_HEIGHT) {
        return {
            valid: false,
            reason: `Wall height too high (${height}m). Maximum is ${MAX_WALL_HEIGHT}m.`,
            severity: 'error'
        };
    }

    // Warning for unusual heights
    if (height < 1.0) {
        return {
            valid: true,
            reason: `Wall height is quite low (${height}m). Typical walls are 2-3m.`,
            severity: 'warning'
        };
    }

    if (height > 5.0) {
        return {
            valid: true,
            reason: `Wall height is quite high (${height}m). Typical walls are 2-3m.`,
            severity: 'warning'
        };
    }

    return { valid: true };
}


export function validateWallColor(color: string): ValidationResult {
    // Check if valid hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (!hexRegex.test(color)) {
        return {
            valid: false,
            reason: `Invalid color format: "${color}". Use hex format like #ffffff`,
            severity: 'error'
        };
    }

    return { valid: true };
}


export function validateWallOpacity(opacity: number): ValidationResult {
    if (opacity < 0 || opacity > 1) {
        return {
            valid: false,
            reason: `Opacity must be between 0 and 1 (got ${opacity})`,
            severity: 'error'
        };
    }

    // Warning for nearly invisible walls
    if (opacity < 0.1) {
        return {
            valid: true,
            reason: `Opacity is very low (${opacity}). Wall may be hard to see.`,
            severity: 'warning'
        };
    }

    return { valid: true };
}


export function validateWallThickness(thickness: number): ValidationResult {
    if (thickness <= 0) {
        return {
            valid: false,
            reason: `Thickness must be greater than 0 (got ${thickness})`,
            severity: 'error'
        };
    }

    if (thickness > 1.0) {
        return {
            valid: false,
            reason: `Thickness too large (${thickness}m). Maximum is 1m.`,
            severity: 'error'
        };
    }

    // Warning for very thin walls
    if (thickness < 0.05) {
        return {
            valid: true,
            reason: `Thickness is very thin (${(thickness * 100).toFixed(1)}cm). Wall may be hard to see.`,
            severity: 'warning'
        };
    }

    return { valid: true };
}


export function validateNormalizedCoordinate(value: number, label: string): ValidationResult {
    if (value < 0 || value > 1) {
        return {
            valid: false,
            reason: `${label} must be between 0 and 1 (got ${value.toFixed(3)})`,
            severity: 'error'
        };
    }

    return { valid: true };
}


export function validateWallObject(wall: Partial<Wall>): ValidationResult {
    // Required fields check
    if (wall.r_x1 === undefined || wall.r_y1 === undefined ||
        wall.r_x2 === undefined || wall.r_y2 === undefined) {
        return {
            valid: false,
            reason: 'Wall is missing required coordinates (r_x1, r_y1, r_x2, r_y2)',
            severity: 'error'
        };
    }

    // Validate normalized coordinates
    const coords = [
        { value: wall.r_x1, label: 'r_x1' },
        { value: wall.r_y1, label: 'r_y1' },
        { value: wall.r_x2, label: 'r_x2' },
        { value: wall.r_y2, label: 'r_y2' }
    ];

    for (const { value, label } of coords) {
        const result = validateNormalizedCoordinate(value, label);
        if (!result.valid) return result;
    }

    // Validate wall height if provided
    if (wall.r_height !== undefined) {
        const result = validateWallHeight(wall.r_height);
        if (!result.valid) return result;
    }

    // Validate color if provided
    if (wall.color !== undefined) {
        const result = validateWallColor(wall.color);
        if (!result.valid) return result;
    }

    // Validate opacity if provided
    if (wall.opacity !== undefined) {
        const result = validateWallOpacity(wall.opacity);
        if (!result.valid) return result;
    }

    // Validate thickness if provided
    if (wall.thickness !== undefined) {
        const result = validateWallThickness(wall.thickness);
        if (!result.valid) return result;
    }

    // Check for zero-length walls
    const dx = wall.r_x2 - wall.r_x1;
    const dy = wall.r_y2 - wall.r_y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 0.01) { // Less than 1% of building size
        return {
            valid: false,
            reason: 'Wall start and end points are too close (zero-length wall)',
            severity: 'error'
        };
    }

    return { valid: true };
}