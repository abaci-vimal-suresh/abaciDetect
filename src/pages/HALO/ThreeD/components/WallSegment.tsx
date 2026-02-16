/**
 * Wall Segment Component - 3D Rendering
 * 
 * Purpose: Render individual wall segments in 3D scene
 * 
 * ✨ ENHANCEMENTS:
 * - Added isPreview prop for visual distinction (Issue #6)
 * - Added isFocused prop for real-time editing feedback (Issue #8)
 * - Improved visual feedback for different states
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PivotControls } from '@react-three/drei';
import { Wall } from '../../../../types/sensor';
import { transformWallTo3D, FloorCalibration } from '../utils/coordinateTransform';
import {
    SELECTED_WALL_EMISSIVE,
    HOVERED_WALL_EMISSIVE,
    BLINKING_ANIMATION_SPEED,
    WALL_WIREFRAME_OPACITY,
    WALL_WIREFRAME_OPACITY_HOVER,
    WALL_PIVOT_SCALE,
    WALL_PIVOT_LINE_WIDTH,
    PREVIEW_WALL_OPACITY,
    PREVIEW_WALL_COLOR
} from '../../../../constants/wallDefaults';

interface WallSegmentProps {
    wall: Wall;
    calibration: FloorCalibration;
    floorY: number;
    isSelected?: boolean;
    isHovered?: boolean;
    isBlinking?: boolean;
    isPreview?: boolean;
    isFocused?: boolean;
    onClick?: (wall: Wall) => void;
    onHover?: (hovered: boolean) => void;
    onDrag?: (delta: { x: number, y: number, z: number }) => void;
    onUpdateEndpoints?: (points: { r_x1?: number, r_y1?: number, r_x2?: number, r_y2?: number }) => void;
}

export const WallSegment: React.FC<WallSegmentProps> = ({
    wall,
    calibration,
    floorY,
    isSelected = false,
    isHovered = false,
    isBlinking = false,
    isPreview = false, // ✨ NEW
    isFocused = false, // ✨ NEW
    onClick,
    onHover,
    onDrag,
    onUpdateEndpoints
}) => {
    const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const dragStartProps = useRef<{ r_x1: number, r_y1: number, r_x2: number, r_y2: number } | null>(null);

    const { position, rotation, size } = useMemo(() =>
        transformWallTo3D(wall, calibration, floorY),
        [wall, calibration, floorY]);

    // ✨ NEW: Calculate start and end point 3D positions
    const startPos = useMemo(() => {
        const x = calibration.minX + (wall.r_x1 * calibration.width);
        const z = calibration.minZ + (wall.r_y1 * calibration.depth);
        const wallHeight = wall.r_height ?? 2.4;
        const zOffset = wall.r_z_offset ?? 0;
        const y = floorY + zOffset + (wallHeight / 2); // Center of handle vertically
        return new THREE.Vector3(x, y, z);
    }, [wall.r_x1, wall.r_y1, wall.r_height, wall.r_z_offset, calibration, floorY]);

    const endPos = useMemo(() => {
        const x = calibration.minX + (wall.r_x2 * calibration.width);
        const z = calibration.minZ + (wall.r_y2 * calibration.depth);
        const wallHeight = wall.r_height ?? 2.4;
        const zOffset = wall.r_z_offset ?? 0;
        const y = floorY + zOffset + (wallHeight / 2); // Center of handle vertically
        return new THREE.Vector3(x, y, z);
    }, [wall.r_x2, wall.r_y2, wall.r_height, wall.r_z_offset, calibration, floorY]);

    // ============================================
    // MATERIAL PROPERTIES
    // ============================================

    // Material properties based on wall opacity and color
    const isGlass = (wall.opacity ?? 1) < 0.8;

    // ✨ MODIFIED: Use preview color if in preview mode
    const baseColor = isPreview
        ? PREVIEW_WALL_COLOR
        : (wall.color || (isGlass ? '#a5d8ff' : '#ffffff'));

    // ✨ MODIFIED: Lower opacity for preview walls
    const opacity = isPreview
        ? PREVIEW_WALL_OPACITY
        : (wall.opacity ?? 0.7);

    // ============================================
    // ANIMATION FRAME (BLINKING, FOCUSED)
    // ============================================

    // ✨ MODIFIED: Handle blinking, focused, and preview states
    useFrame((state) => {
        if (!materialRef.current) return;

        // Priority 1: Blinking (highest priority)
        if (isBlinking) {
            const pulse = 0.45 + Math.sin(state.clock.elapsedTime * BLINKING_ANIMATION_SPEED) * 0.35;
            materialRef.current.emissiveIntensity = pulse;
            materialRef.current.emissive.set(baseColor);
            return;
        }

        // Priority 2: Focused (when editing in overlay)
        if (isFocused) {
            // Gentle pulse for focused state
            const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
            materialRef.current.emissiveIntensity = pulse;
            materialRef.current.emissive.set('#4a90e2'); // Blue highlight
            return;
        }

        // Priority 3: Preview (gentle glow)
        if (isPreview) {
            // Subtle pulse for preview state
            const pulse = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            materialRef.current.emissiveIntensity = pulse;
            materialRef.current.emissive.set(PREVIEW_WALL_COLOR);
            return;
        }

        // Priority 4: Standard selection/hover highlighting
        materialRef.current.emissiveIntensity = isSelected
            ? SELECTED_WALL_EMISSIVE
            : isHovered
                ? HOVERED_WALL_EMISSIVE
                : 0;
        materialRef.current.emissive.set(
            isSelected || isHovered ? baseColor : '#000000'
        );
    });

    // ============================================
    // RENDER
    // ============================================

    return (
        <group>
            {/* ✨ MODIFIED: Hide pivot controls for preview walls */}
            {!isPreview && (
                <PivotControls
                    anchor={[0, 0, 0]}
                    depthTest={false}
                    scale={WALL_PIVOT_SCALE}
                    lineWidth={WALL_PIVOT_LINE_WIDTH}
                    fixed={true}
                    visible={isSelected}
                    activeAxes={[true, true, true]} // Allow all horizontal movements
                    onDrag={(local) => {
                        const pos = new THREE.Vector3();
                        pos.setFromMatrixPosition(local);
                        // Pass the delta movement
                        onDrag?.({ x: pos.x, y: pos.y, z: pos.z });
                    }}
                >
                    <mesh
                        position={position}
                        rotation={rotation}
                        castShadow
                        receiveShadow
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(wall);
                        }}
                        onPointerOver={(e) => {
                            e.stopPropagation();
                            onHover?.(true);
                        }}
                        onPointerOut={() => {
                            onHover?.(false);
                        }}
                    >
                        <boxGeometry args={size} />
                        <meshPhysicalMaterial
                            ref={materialRef}
                            color={baseColor}
                            transparent={true}
                            opacity={opacity}
                            metalness={isGlass ? 0.1 : 0}
                            roughness={isGlass ? 0.15 : 0.5}
                            transmission={isGlass ? 0.6 : 0}
                            thickness={wall.thickness ?? 0.15}
                            ior={1.5}
                            clearcoat={1.0}
                            envMapIntensity={1.0}
                        />

                        {/* ✨ MODIFIED: Edge Glow - Different styles for different states */}
                        {(isSelected || isHovered || isBlinking || isFocused || isPreview) && (
                            <mesh scale={[1.002, 1.002, 1.05]}>
                                <boxGeometry args={size} />
                                <meshBasicMaterial
                                    color={
                                        isFocused ? '#4a90e2' : // Blue for focused
                                            isPreview ? PREVIEW_WALL_COLOR : // Gold for preview
                                                baseColor // Original color for others
                                    }
                                    wireframe
                                    transparent
                                    opacity={
                                        isBlinking || isSelected ? WALL_WIREFRAME_OPACITY :
                                            isFocused ? 0.6 :
                                                isPreview ? 0.5 :
                                                    WALL_WIREFRAME_OPACITY_HOVER
                                    }
                                />
                            </mesh>
                        )}

                        {/* ✨ NEW: Dotted outline for preview walls */}
                        {isPreview && (
                            <mesh scale={[1.01, 1.01, 1.1]}>
                                <boxGeometry args={size} />
                                <meshBasicMaterial
                                    color={PREVIEW_WALL_COLOR}
                                    wireframe
                                    transparent
                                    opacity={0.8}
                                />
                            </mesh>
                        )}
                    </mesh>
                </PivotControls>
            )}

            {/* ✨ NEW: Interactive Endpoint Handles */}
            {!isPreview && isSelected && (
                <>
                    {/* START POINT HANDLE */}
                    <PivotControls
                        anchor={[0, 0, 0]}
                        depthTest={false}
                        scale={0.5}
                        lineWidth={2}
                        fixed={true}
                        visible={true}
                        activeAxes={[true, false, true]}
                        onDragStart={() => {
                            console.log('🐞 drag_debug: Start Point Drag Began', { wallId: wall.id });
                            dragStartProps.current = { r_x1: wall.r_x1, r_y1: wall.r_y1, r_x2: wall.r_x2, r_y2: wall.r_y2 };
                        }}
                        onDrag={(local) => {
                            const pos = new THREE.Vector3();
                            pos.setFromMatrixPosition(local);

                            // Convert delta back to normalized coordinates
                            const deltaX = calibration.width !== 0 ? pos.x / calibration.width : 0;
                            const deltaY = calibration.depth !== 0 ? pos.z / calibration.depth : 0;

                            const start = dragStartProps.current || { r_x1: wall.r_x1, r_y1: wall.r_y1 };

                            const newPoints = {
                                r_x1: Math.max(0, Math.min(1, start.r_x1 + deltaX)),
                                r_y1: Math.max(0, Math.min(1, start.r_y1 + deltaY))
                            };

                            console.log('🐞 drag_debug: Start Point Moved', {
                                wallId: wall.id,
                                deltaX, deltaY,
                                newPoints
                            });

                            onUpdateEndpoints?.(newPoints);
                        }}
                    >
                        <mesh position={startPos}>
                            <sphereGeometry args={[0.08, 16, 16]} />
                            <meshBasicMaterial color="#f1c40f" depthTest={false} transparent opacity={0.8} />
                            <mesh scale={[1.2, 1.2, 1.2]}>
                                <sphereGeometry args={[0.08, 16, 16]} />
                                <meshBasicMaterial color="#f1c40f" wireframe transparent opacity={0.4} />
                            </mesh>
                        </mesh>
                    </PivotControls>

                    {/* END POINT HANDLE */}
                    <PivotControls
                        anchor={[0, 0, 0]}
                        depthTest={false}
                        scale={0.5}
                        lineWidth={2}
                        fixed={true}
                        visible={true}
                        activeAxes={[true, false, true]}
                        onDragStart={() => {
                            console.log('🐞 drag_debug: End Point Drag Began', { wallId: wall.id });
                            dragStartProps.current = { r_x1: wall.r_x1, r_y1: wall.r_y1, r_x2: wall.r_x2, r_y2: wall.r_y2 };
                        }}
                        onDrag={(local) => {
                            const pos = new THREE.Vector3();
                            pos.setFromMatrixPosition(local);

                            // Convert delta back to normalized coordinates
                            const deltaX = calibration.width !== 0 ? pos.x / calibration.width : 0;
                            const deltaY = calibration.depth !== 0 ? pos.z / calibration.depth : 0;

                            const start = dragStartProps.current || { r_x2: wall.r_x2, r_y2: wall.r_y2 };

                            const newPoints = {
                                r_x2: Math.max(0, Math.min(1, start.r_x2 + deltaX)),
                                r_y2: Math.max(0, Math.min(1, start.r_y2 + deltaY))
                            };

                            console.log('🐞 drag_debug: End Point Moved', {
                                wallId: wall.id,
                                deltaX, deltaY,
                                newPoints
                            });

                            onUpdateEndpoints?.(newPoints);
                        }}
                    >
                        <mesh position={endPos}>
                            <sphereGeometry args={[0.08, 16, 16]} />
                            <meshBasicMaterial color="#f1c40f" depthTest={false} transparent opacity={0.8} />
                            <mesh scale={[1.2, 1.2, 1.2]}>
                                <sphereGeometry args={[0.08, 16, 16]} />
                                <meshBasicMaterial color="#f1c40f" wireframe transparent opacity={0.4} />
                            </mesh>
                        </mesh>
                    </PivotControls>
                </>
            )}

            {/* ✨ NEW: Render preview walls without pivot controls */}
            {isPreview && (
                <mesh
                    position={position}
                    rotation={rotation}
                    castShadow={false} // Don't cast shadows for preview
                    receiveShadow={false}
                >
                    <boxGeometry args={size} />
                    <meshPhysicalMaterial
                        ref={materialRef}
                        color={baseColor}
                        transparent={true}
                        opacity={opacity}
                        metalness={0}
                        roughness={0.5}
                        thickness={wall.thickness ?? 0.15}
                    />

                    {/* Preview outline */}
                    <mesh scale={[1.002, 1.002, 1.05]}>
                        <boxGeometry args={size} />
                        <meshBasicMaterial
                            color={PREVIEW_WALL_COLOR}
                            wireframe
                            transparent
                            opacity={0.5}
                        />
                    </mesh>

                    {/* Dotted overlay effect */}
                    <mesh scale={[1.01, 1.01, 1.1]}>
                        <boxGeometry args={size} />
                        <lineBasicMaterial
                            color={PREVIEW_WALL_COLOR}
                            transparent
                            opacity={0.8}
                            linewidth={2}
                        />
                    </mesh>
                </mesh>
            )}
        </group>
    );
};

/**
 * ✨ NEW: Helper function to check if a wall is in preview state
 * 
 * @param wall - Wall object
 * @returns True if wall is a preview (not saved)
 */
export function isWallPreview(wall: Wall): boolean {
    return String(wall.id).startsWith('new-') || wall.id === 'preview';
}

/**
 * ✨ NEW: Helper function to get wall state description
 * 
 * @param wall - Wall object
 * @param isPreview - Is in preview mode
 * @param isSelected - Is selected
 * @param isHovered - Is hovered
 * @returns State description
 */
export function getWallStateDescription(
    wall: Wall,
    isPreview: boolean,
    isSelected: boolean,
    isHovered: boolean
): string {
    if (isPreview) return 'Preview (not saved)';
    if (isSelected) return 'Selected';
    if (isHovered) return 'Hovered';
    if (String(wall.id).startsWith('new-')) return 'New (unsaved)';
    return 'Saved';
}