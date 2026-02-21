
export const DEFAULT_WALL_HEIGHT = 2.4;

export const DEFAULT_WALL_THICKNESS = 0.15;

export const DEFAULT_WALL_Z_OFFSET = 0;

export const DEFAULT_WALL_COLOR = '#ffffff';


export const DEFAULT_WALL_OPACITY = 0.7;


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

export const MIN_WALL_LENGTH = 0.01; // 1cm


export const MAX_WALL_LENGTH = 100; // 100m


export const MIN_WALL_HEIGHT = 0.1; // 10cm
export const MAX_WALL_HEIGHT = 10; // 10m

export const FLOOR_Y_TOLERANCE = 0.5; // 50cm
export const PREVIEW_WALL_OPACITY = 0.4;

export const PREVIEW_WALL_COLOR = '#ffd700'; // Gold
export const FIRST_POINT_MARKER_COLOR = '#ffff00'; // Yellow
export const FIRST_POINT_MARKER_SIZE = 0.3;

export const SELECTED_WALL_EMISSIVE = 0.5;
export const HOVERED_WALL_EMISSIVE = 0.2;

export const BLINKING_ANIMATION_SPEED = 8;
export const WALL_WIREFRAME_OPACITY = 0.8;
export const WALL_WIREFRAME_OPACITY_HOVER = 0.4;

export const WALL_PIVOT_SCALE = 75;
export const WALL_PIVOT_LINE_WIDTH = 3;

export function getColorPresetByName(name: string): string | undefined {
    return WALL_COLOR_PRESETS.find(p => p.name === name)?.value;
}


export function getColorPresetByValue(value: string): string | undefined {
    return WALL_COLOR_PRESETS.find(p => p.value.toLowerCase() === value.toLowerCase())?.name;
}


export function isPresetColor(color: string): boolean {
    return WALL_COLOR_PRESETS.some(p => p.value.toLowerCase() === color.toLowerCase());
}