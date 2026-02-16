/**
 * Wall Drawing System - Default Constants
 * 
 * Centralized constants for wall creation and rendering.
 * Change these values in one place to affect the entire system.
 * 
 * Purpose: Fixes Issue #17 (hardcoded values scattered across 8+ files)
 */

// ============================================
// WALL GEOMETRY DEFAULTS
// ============================================

/**
 * Default wall height in meters
 * Used when creating new walls in both Area and Sensor modes
 */
export const DEFAULT_WALL_HEIGHT = 2.4;

/**
 * Default wall thickness in meters
 * Affects the 3D rendering depth of wall meshes
 */
export const DEFAULT_WALL_THICKNESS = 0.15;

/**
 * Default wall vertical offset in meters
 * How far above the floor surface the wall starts
 */
export const DEFAULT_WALL_Z_OFFSET = 0;

// ============================================
// WALL APPEARANCE DEFAULTS
// ============================================

/**
 * Default wall color (hex)
 * Standard white color for new walls
 */
export const DEFAULT_WALL_COLOR = '#ffffff';

/**
 * Default wall opacity (0-1)
 * Semi-transparent for glass-like walls
 */
export const DEFAULT_WALL_OPACITY = 0.7;

/**
 * Preset color palette for quick wall styling
 * Common architectural colors
 */
export const WALL_COLOR_PRESETS = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#e0e0e0' },
    { name: 'Concrete', value: '#95a5a6' },
    { name: 'Brick Red', value: '#c0392b' },
    { name: 'Glass Blue', value: '#a5d8ff' },
    { name: 'Wood Brown', value: '#8b7355' },
    { name: 'Black', value: '#2c3e50' },
    { name: 'Green Wall', value: '#27ae60' },
];

// ============================================
// WALL VALIDATION CONSTANTS
// ============================================

/**
 * Minimum wall length in meters
 * Prevents creation of tiny, invisible walls
 */
export const MIN_WALL_LENGTH = 0.01; // 1cm

/**
 * Maximum wall length in meters
 * Sanity check for extremely long walls
 */
export const MAX_WALL_LENGTH = 100; // 100m

/**
 * Minimum wall height in meters
 */
export const MIN_WALL_HEIGHT = 0.1; // 10cm

/**
 * Maximum wall height in meters
 */
export const MAX_WALL_HEIGHT = 10; // 10m

/**
 * Floor tolerance for checking if two points are on same floor
 * Used when validating wall endpoints
 */
export const FLOOR_Y_TOLERANCE = 0.5; // 50cm

// ============================================
// WALL PREVIEW APPEARANCE
// ============================================

/**
 * Opacity for wall preview during drawing
 * Lower than final to indicate it's not saved yet
 */
export const PREVIEW_WALL_OPACITY = 0.4;

/**
 * Color for wall preview during drawing
 */
export const PREVIEW_WALL_COLOR = '#ffd700'; // Gold

/**
 * Color for first point marker during drawing
 */
export const FIRST_POINT_MARKER_COLOR = '#ffff00'; // Yellow

/**
 * Size of first point marker sphere
 */
export const FIRST_POINT_MARKER_SIZE = 0.3;

// ============================================
// WALL INTERACTION CONSTANTS
// ============================================

/**
 * Emissive intensity for selected walls
 */
export const SELECTED_WALL_EMISSIVE = 0.5;

/**
 * Emissive intensity for hovered walls
 */
export const HOVERED_WALL_EMISSIVE = 0.2;

/**
 * Blinking animation speed for highlighted walls
 * Used when hovering over "Available Area Walls"
 */
export const BLINKING_ANIMATION_SPEED = 8;

/**
 * Wireframe opacity for selected/hovered walls
 */
export const WALL_WIREFRAME_OPACITY = 0.8;

/**
 * Wireframe opacity for hovered (not selected) walls
 */
export const WALL_WIREFRAME_OPACITY_HOVER = 0.4;

// ============================================
// WALL DRAG & MANIPULATION
// ============================================

/**
 * PivotControls scale for wall manipulation
 */
export const WALL_PIVOT_SCALE = 75;

/**
 * PivotControls line width
 */
export const WALL_PIVOT_LINE_WIDTH = 3;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get wall color preset by name
 */
export function getColorPresetByName(name: string): string | undefined {
    return WALL_COLOR_PRESETS.find(p => p.name === name)?.value;
}

/**
 * Get wall color preset by value
 */
export function getColorPresetByValue(value: string): string | undefined {
    return WALL_COLOR_PRESETS.find(p => p.value.toLowerCase() === value.toLowerCase())?.name;
}

/**
 * Check if a color is a preset
 */
export function isPresetColor(color: string): boolean {
    return WALL_COLOR_PRESETS.some(p => p.value.toLowerCase() === color.toLowerCase());
}