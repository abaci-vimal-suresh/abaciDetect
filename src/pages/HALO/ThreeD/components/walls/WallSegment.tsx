
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Wall } from '../../../../../types/sensor';
import { transformWallTo3D, FloorCalibration } from '../../utils/coordinateTransform';
import {
    SELECTED_WALL_EMISSIVE,
    HOVERED_WALL_EMISSIVE,
    BLINKING_ANIMATION_SPEED,
    WALL_WIREFRAME_OPACITY,
    WALL_WIREFRAME_OPACITY_HOVER,
    PREVIEW_WALL_OPACITY,
    PREVIEW_WALL_COLOR
} from '../../../../../constants/wallDefaults';

// ============================================
// BEZIER GEOMETRY BUILDER
// ============================================

function buildBezierGeometry(
    wall: Wall,
    floorWidth: number,
    floorDepth: number,
    capOnly: boolean = false
): THREE.BufferGeometry | null {
    const x1 = wall.r_x1 * floorWidth - floorWidth / 2;
    const z1 = wall.r_y1 * floorDepth - floorDepth / 2;
    const x2 = wall.r_x2 * floorWidth - floorWidth / 2;
    const z2 = wall.r_y2 * floorDepth - floorDepth / 2;

    const ctrlNx = wall.ctrl_x ?? (wall.r_x1 + wall.r_x2) / 2;
    const ctrlNy = wall.ctrl_y ?? (wall.r_y1 + wall.r_y2) / 2;
    const cx = ctrlNx * floorWidth - floorWidth / 2;
    const cz = ctrlNy * floorDepth - floorDepth / 2;

    const wallLength = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    if (wallLength < 0.01) return null;

    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const ctrlDist = Math.sqrt((cx - midX) ** 2 + (cz - midZ) ** 2);
    const maxCtrlDist = wallLength * 3;
    let safeCx = cx, safeCz = cz;
    if (ctrlDist > maxCtrlDist && ctrlDist > 0) {
        const ratio = maxCtrlDist / ctrlDist;
        safeCx = midX + (cx - midX) * ratio;
        safeCz = midZ + (cz - midZ) * ratio;
    }

    const STEPS = 48;
    const curvePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const mt = 1 - t;
        const bx = mt * mt * x1 + 2 * mt * t * safeCx + t * t * x2;
        const bz = mt * mt * z1 + 2 * mt * t * safeCz + t * t * z2;
        curvePoints.push(new THREE.Vector2(bx, bz));
    }

    if (curvePoints.length < 2) return null;

    const thickness = wall.thickness ?? 0.18;
    const wallHeight = capOnly ? 0.18 : (wall.r_height ?? 2.4);
    const startY = capOnly ? (wall.r_height ?? 2.4) - 0.18 : 0;
    const halfT = thickness / 2;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    const pts = curvePoints;
    const N = pts.length;

    const rights: THREE.Vector2[] = pts.map((_, i) => {
        let dx: number, dz: number;
        if (i === 0) { dx = pts[1].x - pts[0].x; dz = pts[1].y - pts[0].y; }
        else if (i === N - 1) { dx = pts[N - 1].x - pts[N - 2].x; dz = pts[N - 1].y - pts[N - 2].y; }
        else { dx = pts[i + 1].x - pts[i - 1].x; dz = pts[i + 1].y - pts[i - 1].y; }
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.0001) return new THREE.Vector2(1, 0);
        return new THREE.Vector2(dz / len, -dx / len);
    });

    for (let i = 0; i < N; i++) {
        const px = pts[i].x, pz = pts[i].y;
        const rx = rights[i].x, rz = rights[i].y;
        positions.push(px - rx * halfT, startY, pz - rz * halfT);
        positions.push(px - rx * halfT, startY + wallHeight, pz - rz * halfT);
        positions.push(px + rx * halfT, startY, pz + rz * halfT);
        positions.push(px + rx * halfT, startY + wallHeight, pz + rz * halfT);
        normals.push(-rx, 0, -rz, -rx, 0, -rz, rx, 0, rz, rx, 0, rz);
    }

    for (let i = 0; i < N - 1; i++) {
        const base = i * 4, next = (i + 1) * 4;
        indices.push(base + 0, next + 0, base + 1, next + 0, next + 1, base + 1);
        indices.push(base + 2, base + 3, next + 2, next + 2, base + 3, next + 3);
        indices.push(base + 1, next + 1, base + 3, next + 1, next + 3, base + 3);
        indices.push(base + 0, base + 2, next + 0, next + 0, base + 2, next + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// ============================================
// ARC GEOMETRY BUILDER
// ============================================

function buildArcGeometry(
    wall: Wall,
    floorWidth: number,
    floorDepth: number
): THREE.ExtrudeGeometry | null {
    const { arc_center_x, arc_center_z, arc_radius, arc_start_angle, arc_end_angle, arc_segments = 48, r_height, thickness } = wall as any;
    if (arc_center_x == null || arc_radius == null || arc_start_angle == null) return null;

    const cx = arc_center_x * floorWidth - floorWidth / 2;
    const cz = (arc_center_z ?? 0.5) * floorDepth - floorDepth / 2;
    const rOuter = arc_radius * floorWidth;
    const rInner = Math.max(0.05, rOuter - (thickness ?? 0.18));

    let startA = arc_start_angle;
    let endA = arc_end_angle ?? (startA + Math.PI * 2);
    if (endA <= startA) endA += Math.PI * 2;

    const shape = new THREE.Shape();
    for (let i = 0; i <= arc_segments; i++) {
        const angle = startA + (i / arc_segments) * (endA - startA);
        const px = cx + Math.cos(angle) * rOuter;
        const pz = -cz - Math.sin(angle) * rOuter;
        if (i === 0) shape.moveTo(px, pz); else shape.lineTo(px, pz);
    }
    for (let i = arc_segments; i >= 0; i--) {
        const angle = startA + (i / arc_segments) * (endA - startA);
        shape.lineTo(cx + Math.cos(angle) * rInner, -cz - Math.sin(angle) * rInner);
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, { depth: r_height ?? 2.4, bevelEnabled: false, steps: 1 });
}

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
    onEndpointDragStart?: () => void;
    onEndpointDragEnd?: () => void;
    floorWidth?: number;
    floorDepth?: number;
}

export const WallSegment: React.FC<WallSegmentProps> = ({
    wall,
    calibration,
    floorY,
    isSelected = false,
    isHovered = false,
    isBlinking = false,
    isPreview = false,
    isFocused = false,
    onClick,
    onHover,
    onDrag,
    onUpdateEndpoints,
    onEndpointDragStart,
    onEndpointDragEnd,
    floorWidth,
    floorDepth
}) => {
    const floorW = floorWidth ?? (calibration.width || 30);
    const floorD = floorDepth ?? (calibration.depth || 30);

    const isArc = !!(wall as any).arc_center_x;
    const isBezier = !isArc && !!((wall as any).ctrl_x);

    const arcGeometry = useMemo(() => {
        if (!isArc) return null;
        // Pass calibration to builders for accurate minX/minZ
        const wallWithCal = { ...wall, calibration };
        return buildArcGeometry(wallWithCal as any, floorW, floorD);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isArc, (wall as any).arc_center_x, (wall as any).arc_radius, floorW, floorD, calibration]);

    const bezierGeometry = useMemo(() => {
        if (!isBezier) return null;
        // Pass calibration to builders for accurate minX/minZ
        const wallWithCal = { ...wall, calibration };
        return buildBezierGeometry(wallWithCal as any, floorW, floorD);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBezier, (wall as any).ctrl_x, (wall as any).ctrl_y, wall.r_x1, wall.r_y1, wall.r_x2, wall.r_y2, floorW, floorD, calibration]);
    const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const dragStartProps = useRef<{ r_x1: number, r_y1: number, r_x2: number, r_y2: number } | null>(null);

    const { position, rotation, size } = useMemo(() => {
        const res = transformWallTo3D(wall, calibration, floorY);
        if (!isPreview && isSelected) {
            console.log(`[WallSegment:render] wall.id(${wall.id}) norm(${wall.r_x1.toFixed(3)}, ${wall.r_y1.toFixed(3)}) -> 3D position(${res.position[0].toFixed(2)}, ${res.position[2].toFixed(2)}) | calSize(${calibration.width}, ${calibration.depth}) | propSize(${floorWidth}, ${floorDepth})`);
        }
        return res;
    }, [wall, calibration, floorY, isPreview, isSelected, floorWidth, floorDepth]);

    //  NEW: Calculate start and end point 3D positions
    const startPos = useMemo(() => {
        const x = (wall.r_x1 * calibration.width) - calibration.width / 2;
        const z = (wall.r_y1 * calibration.depth) - calibration.depth / 2;
        const wallHeight = wall.r_height ?? 2.4;
        const zOffset = wall.r_z_offset ?? 0;
        const y = floorY + zOffset + (wallHeight / 2); // Center of handle vertically
        return new THREE.Vector3(x, y, z);
    }, [wall.r_x1, wall.r_y1, wall.r_height, wall.r_z_offset, calibration.width, calibration.depth, floorY]);

    const endPos = useMemo(() => {
        const x = (wall.r_x2 * calibration.width) - calibration.width / 2;
        const z = (wall.r_y2 * calibration.depth) - calibration.depth / 2;
        const wallHeight = wall.r_height ?? 2.4;
        const zOffset = wall.r_z_offset ?? 0;
        const y = floorY + zOffset + (wallHeight / 2); // Center of handle vertically
        return new THREE.Vector3(x, y, z);
    }, [wall.r_x2, wall.r_y2, wall.r_height, wall.r_z_offset, calibration.width, calibration.depth, floorY]);

    // ============================================
    // MATERIAL PROPERTIES
    // ============================================

    // Material properties based on wall opacity and color
    const isGlass = (wall.opacity ?? 1) < 0.8;

    //  MODIFIED: Use preview color if in preview mode
    const baseColor = isPreview
        ? PREVIEW_WALL_COLOR
        : (wall.color || (isGlass ? '#a5d8ff' : '#ffffff'));

    //  MODIFIED: Lower opacity for preview walls
    const opacity = isPreview
        ? PREVIEW_WALL_OPACITY
        : (wall.opacity ?? 0.7);

    // ============================================
    // ANIMATION FRAME (BLINKING, FOCUSED)
    // ============================================

    //  MODIFIED: Handle blinking, focused, and preview states
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


    if (isArc && arcGeometry) {
        return (
            <group>
                <mesh
                    geometry={arcGeometry}
                    position={[0, floorY, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    castShadow receiveShadow
                    onClick={(e) => { e.stopPropagation(); onClick?.(wall); }}
                    onPointerOver={(e) => { e.stopPropagation(); onHover?.(true); }}
                    onPointerOut={() => onHover?.(false)}
                >
                    <meshPhysicalMaterial
                        ref={materialRef}
                        color={baseColor} transparent opacity={opacity}
                        metalness={0.1} roughness={0.05} transmission={0.85}
                        thickness={0.8} ior={1.45} side={THREE.DoubleSide} depthWrite={false}
                    />
                </mesh>
            </group>
        );
    }

    if (isBezier && bezierGeometry) {
        return (
            <group>
                <mesh
                    geometry={bezierGeometry}
                    position={[0, floorY, 0]}
                    castShadow receiveShadow
                    onClick={(e) => { e.stopPropagation(); onClick?.(wall); }}
                    onPointerOver={(e) => { e.stopPropagation(); onHover?.(true); }}
                    onPointerOut={() => onHover?.(false)}
                >
                    <meshPhysicalMaterial
                        ref={materialRef}
                        color={baseColor} transparent opacity={opacity}
                        metalness={0} roughness={0.5}
                        thickness={wall.thickness ?? 0.15}
                    />
                </mesh>
            </group>
        );
    }

    // ============================================
    // STRAIGHT WALL (existing code - unchanged)
    // ============================================

    return (
        <group>
            {/* Wall mesh - no PivotControls */}
            {!isPreview && (
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
                        opacity={isGlass ? 0.3 : opacity}
                        metalness={isGlass ? 0.2 : 0.05}
                        roughness={isGlass ? 0.05 : 0.4}
                        transmission={isGlass ? 0.95 : 0}
                        thickness={wall.thickness ?? 0.15}
                        ior={1.45}
                        reflectivity={0.5}
                        clearcoat={isGlass ? 1.0 : 0.2}
                        envMapIntensity={1.2}
                        side={THREE.DoubleSide}
                    />

                    {/* Edge Glow */}
                    {(isSelected || isHovered || isBlinking || isFocused) && (
                        <mesh scale={[1.002, 1.002, 1.05]}>
                            <boxGeometry args={size} />
                            <meshBasicMaterial
                                color={
                                    isFocused ? '#4a90e2' : baseColor
                                }
                                wireframe
                                transparent
                                opacity={
                                    isBlinking || isSelected ? WALL_WIREFRAME_OPACITY :
                                        isFocused ? 0.6 :
                                            WALL_WIREFRAME_OPACITY_HOVER
                                }
                            />
                        </mesh>
                    )}
                </mesh>
            )}


            {/*  NEW: Interactive Endpoint Handles (Plane Drag) */}
            {!isPreview && isSelected && (
                <>
                    {/* START POINT HANDLE */}
                    <mesh
                        position={startPos}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            (e.target as Element).setPointerCapture(e.pointerId);
                            dragStartProps.current = { r_x1: wall.r_x1, r_y1: wall.r_y1, r_x2: wall.r_x2, r_y2: wall.r_y2 };
                            onEndpointDragStart?.();
                        }}
                        onPointerUp={(e) => {
                            e.stopPropagation();
                            (e.target as Element).releasePointerCapture(e.pointerId);
                            dragStartProps.current = null;
                            onEndpointDragEnd?.();
                        }}
                        onPointerMove={(e) => {
                            if (!dragStartProps.current) return;
                            e.stopPropagation();

                            // Raycast to floor plane
                            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
                            const interactionVector = new THREE.Vector3();
                            const intersect = e.ray.intersectPlane(plane, interactionVector);

                            if (intersect) {
                                // Convert to normalized coordinates
                                const nx = calibration.width !== 0 ? (intersect.x + calibration.width / 2) / calibration.width : 0.5;
                                const ny = calibration.depth !== 0 ? (intersect.z + calibration.depth / 2) / calibration.depth : 0.5;

                                // Clamp to 0-1
                                const r_x1 = Math.max(0, Math.min(1, nx));
                                const r_y1 = Math.max(0, Math.min(1, ny));

                                onUpdateEndpoints?.({ r_x1, r_y1 });
                            }
                        }}
                    >
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshBasicMaterial color="#f1c40f" depthTest={false} transparent opacity={0.8} />
                        <mesh scale={[1.5, 1.5, 1.5]}>
                            <sphereGeometry args={[0.2, 16, 16]} />
                            <meshBasicMaterial color="#f1c40f" wireframe transparent opacity={0.4} />
                        </mesh>
                    </mesh>

                    {/* END POINT HANDLE */}
                    <mesh
                        position={endPos}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            (e.target as Element).setPointerCapture(e.pointerId);
                            dragStartProps.current = { r_x1: wall.r_x1, r_y1: wall.r_y1, r_x2: wall.r_x2, r_y2: wall.r_y2 };
                            onEndpointDragStart?.();
                        }}
                        onPointerUp={(e) => {
                            e.stopPropagation();
                            (e.target as Element).releasePointerCapture(e.pointerId);
                            dragStartProps.current = null;
                            onEndpointDragEnd?.();
                        }}
                        onPointerMove={(e) => {
                            if (!dragStartProps.current) return;
                            e.stopPropagation();

                            // Raycast to floor plane
                            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
                            const interactionVector = new THREE.Vector3();
                            const intersect = e.ray.intersectPlane(plane, interactionVector);

                            if (intersect) {
                                // Convert to normalized coordinates
                                const nx = calibration.width !== 0 ? (intersect.x + calibration.width / 2) / calibration.width : 0.5;
                                const ny = calibration.depth !== 0 ? (intersect.z + calibration.depth / 2) / calibration.depth : 0.5;

                                // Clamp to 0-1
                                const r_x2 = Math.max(0, Math.min(1, nx));
                                const r_y2 = Math.max(0, Math.min(1, ny));

                                onUpdateEndpoints?.({ r_x2, r_y2 });
                            }
                        }}
                    >
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshBasicMaterial color="#f1c40f" depthTest={false} transparent opacity={0.8} />
                        <mesh scale={[1.5, 1.5, 1.5]}>
                            <sphereGeometry args={[0.2, 16, 16]} />
                            <meshBasicMaterial color="#f1c40f" wireframe transparent opacity={0.4} />
                        </mesh>
                    </mesh>
                </>
            )}

            {/*  NEW: Render preview walls without pivot controls */}
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
                            opacity={0.8}
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
 *  NEW: Helper function to check if a wall is in preview state
 * 
 * @param wall - Wall object
 * @returns True if wall is a preview (not saved)
 */
export function isWallPreview(wall: Wall): boolean {
    return String(wall.id).startsWith('new-') || wall.id === 'preview';
}

/**
 *  NEW: Helper function to get wall state description
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