// src/pages/halo/components/HaloFloorScene.tsx

import React, {
    useMemo, useRef, useEffect, useState, Suspense, useContext
} from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import {
    Grid, Html, useTexture,
    Line, ContactShadows
} from '@react-three/drei';
import { AreaNode, AreaWall, SensorHalo, SensorNode } from '../Types/types';
import { UseWallDrawingReturn } from '../Hooks/useWallDrawing';
import { DUMMY_WALLS } from '../Dummy/dummyData';
import { SceneLevel } from '../HaloPage/HaloPage';
import HaloSensorMarker from './HaloSensorMarker';
import ThemeContext from '../../../contexts/themeContext';

// ─────────────────────────────────────────────────────────────────────────────
// THEME HOOK
// ─────────────────────────────────────────────────────────────────────────────
const useHaloTheme = () => {
    const { darkModeStatus } = useContext(ThemeContext);
    return useMemo(() => {
        if (darkModeStatus) {
            return {
                floor: '#1d1a1aff',
                gridCell: '#2c3e50',
                gridSec: '#34495e',
                labelBg: 'rgba(13,17,23,0.85)',
                labelBorder: 'rgba(123,104,238,0.4)',
                labelTextColor: '#7b68ee',
                slabOpacity: 0.85
            };
        }
        return {
            floor: '#d1d5db',
            gridCell: '#9ca3af',
            gridSec: '#6b7280',
            labelBg: 'rgba(255,255,255,0.9)',
            labelBorder: 'rgba(100,116,139,0.3)',
            labelTextColor: '#475569',
            slabOpacity: 0.65
        };
    }, [darkModeStatus]);
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR PLAN IMAGE
// ─────────────────────────────────────────────────────────────────────────────

const FloorPlanImage: React.FC<{
    url: string; w: number; d: number;
}> = ({ url, w, d }) => {
    const texture = useTexture(url);
    const { gl } = useThree();

    useMemo(() => {
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
    }, [texture, gl]);

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            renderOrder={2}
        >
            <planeGeometry args={[w, d]} />
            <meshBasicMaterial
                map={texture}
                transparent
                opacity={0.88}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ARC GEOMETRY BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildArcGeometry(
    wall: AreaWall, fw: number, fd: number
): THREE.ExtrudeGeometry | null {
    const {
        arc_center_x, arc_center_z, arc_radius,
        arc_start_angle, arc_end_angle,
        arc_segments = 48, r_height, thickness,
    } = wall;

    if (
        arc_center_x == null || arc_center_z == null ||
        arc_radius == null ||
        arc_start_angle == null || arc_end_angle == null
    ) return null;

    const cx = arc_center_x * fw - fw / 2;
    const cz = arc_center_z * fd - fd / 2;
    const rOuter = arc_radius * fw;
    const rInner = Math.max(0.05, rOuter - (thickness ?? 0.18));

    let startA = arc_start_angle;
    let endA = arc_end_angle;
    if (endA <= startA) endA += Math.PI * 2;

    const shape = new THREE.Shape();

    for (let i = 0; i <= arc_segments; i++) {
        const t = i / arc_segments;
        const a = startA + t * (endA - startA);
        const px = cx + Math.cos(a) * rOuter;
        const pz = -cz - Math.sin(a) * rOuter;
        if (i === 0) shape.moveTo(px, pz);
        else shape.lineTo(px, pz);
    }
    for (let i = arc_segments; i >= 0; i--) {
        const t = i / arc_segments;
        const a = startA + t * (endA - startA);
        shape.lineTo(
            cx + Math.cos(a) * rInner,
            -cz - Math.sin(a) * rInner,
        );
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
        depth: r_height ?? 3.0,
        bevelEnabled: false,
        steps: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// WALL SEGMENT
// ─────────────────────────────────────────────────────────────────────────────

const WallSegment: React.FC<{
    wall: AreaWall;
    fw: number;
    fd: number;
    floorY: number;
    isPreview?: boolean;
    isSelected?: boolean;
    isAlert?: boolean;
    isBlinking?: boolean;
}> = ({
    wall, fw, fd, floorY,
    isPreview = false,
    isSelected = false,
    isAlert = false,
    isBlinking = false,
}) => {
        const meshRef = useRef<THREE.Mesh>(null);
        const isArc = wall.wall_shape === 'arc' || wall.arc_center_x != null;

        const arcGeo = useMemo(() => {
            if (!isArc) return null;
            return buildArcGeometry(wall, fw, fd);
        }, [
            isArc, wall.arc_center_x, wall.arc_center_z,
            wall.arc_radius, wall.arc_start_angle, wall.arc_end_angle,
            wall.r_height, wall.thickness, fw, fd,
        ]);

        useEffect(() => () => { arcGeo?.dispose(); }, [arcGeo]);

        // Pulse animation
        useFrame(({ clock }) => {
            if (!meshRef.current) return;
            const mat = meshRef.current.material as THREE.MeshStandardMaterial;
            const t = clock.getElapsedTime();
            if (isPreview) {
                mat.emissiveIntensity =
                    0.3 + Math.abs(Math.sin(t * 2.5)) * 0.6;
            } else if (isAlert) {
                // Selected area walls pulse strongly
                mat.emissiveIntensity =
                    0.6 + Math.abs(Math.sin(t * 4.0)) * 1.8;
            } else if (isBlinking) {
                // Fast yellow blink
                mat.emissiveIntensity =
                    0.45 + (Math.sin(t * 12.0) > 0 ? 2.5 : 0);
            } else if (isSelected) {
                mat.emissiveIntensity =
                    0.3 + Math.abs(Math.sin(t * 2.0)) * 0.5;
            }
        });

        const x1 = wall.r_x1 * fw - fw / 2;
        const z1 = wall.r_y1 * fd - fd / 2;
        const x2 = wall.r_x2 * fw - fw / 2;
        const z2 = wall.r_y2 * fd - fd / 2;
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        const ang = -Math.atan2(z2 - z1, x2 - x1);

        const h = wall.r_height ?? 3.0;
        const thickness = wall.thickness ?? 0.18;
        const baseY = floorY + (wall.r_z_offset ?? 0);
        const yCenter = baseY + h / 2;

        const color = isPreview
            ? '#f0c040'
            : isAlert
                ? '#e63946'
                : isBlinking
                    ? '#facc15'
                    : isSelected
                        ? '#ffec80'
                        : wall.color;

        const emissive = isPreview
            ? '#f0c040'
            : isAlert
                ? '#e63946'
                : isBlinking
                    ? '#facc15'
                    : isSelected
                        ? '#f0c040'
                        : '#000000';

        const emissiveIntensity = isPreview
            ? 0.5
            : isAlert
                ? 1.0
                : isBlinking
                    ? 1.5
                    : isSelected
                        ? 0.3
                        : 0;

        const material = (
            <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={
                    isPreview || isAlert || isBlinking
                        ? Math.max(wall.opacity, 0.8)
                        : wall.opacity
                }
                roughness={0.6}
                metalness={0.05}
                depthWrite={!isPreview}
            />
        );

        if (isArc) {
            if (!arcGeo) return null;
            return (
                <mesh
                    ref={meshRef}
                    geometry={arcGeo}
                    position={[0, baseY, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    castShadow receiveShadow
                    renderOrder={10}
                >
                    {material}
                </mesh>
            );
        }

        if (len < 0.01) return null;

        return (
            <mesh
                ref={meshRef}
                position={[cx, yCenter, cz]}
                rotation={[0, ang, 0]}
                castShadow receiveShadow
                renderOrder={10}
            >
                <boxGeometry args={[len, h, thickness]} />
                {material}
            </mesh>
        );
    };

// ─────────────────────────────────────────────────────────────────────────────
// SENSOR HALO MESH
// ─────────────────────────────────────────────────────────────────────────────

const SensorHaloMesh: React.FC<{
    halo: SensorHalo; fw: number; fd: number; floorY: number;
}> = ({ halo, fw, fd, floorY }) => {
    const outerRef = useRef<THREE.Mesh>(null);
    const innerRef = useRef<THREE.Mesh>(null);

    const wx = halo.nx * fw - fw / 2;
    const wz = halo.ny * fd - fd / 2;

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (outerRef.current) {
            const mat = outerRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.15 + Math.abs(Math.sin(t * 1.8))
                * halo.intensity * 0.35;
            outerRef.current.scale.setScalar(
                1 + Math.abs(Math.sin(t * 1.2)) * 0.08 * halo.intensity
            );
        }
        if (innerRef.current) {
            const mat = innerRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.04 + Math.abs(Math.sin(t * 2.2))
                * 0.06 * halo.intensity;
        }
    });

    return (
        <group position={[wx, floorY + 0.05, wz]}>
            <mesh ref={outerRef}
                rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
                <ringGeometry
                    args={[halo.radius - 0.3, halo.radius, 64]} />
                <meshBasicMaterial color={halo.color} transparent
                    opacity={0.3} depthWrite={false}
                    side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={innerRef}
                rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
                <circleGeometry args={[halo.radius - 0.3, 64]} />
                <meshBasicMaterial color={halo.color} transparent
                    opacity={0.06} depthWrite={false}
                    side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
                <circleGeometry args={[0.25, 24]} />
                <meshBasicMaterial color={halo.color}
                    transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <Html position={[0, 0.8, 0]} center
                distanceFactor={20}
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{
                    background: 'rgba(13,17,23,0.85)',
                    border: `1px solid ${halo.color}66`,
                    borderRadius: 4, padding: '2px 7px',
                    fontSize: 9, fontWeight: 700,
                    color: halo.color, whiteSpace: 'nowrap',
                    backdropFilter: 'blur(4px)',
                }}>
                    📡 {halo.name}
                </div>
            </Html>
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// DRAWING OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

const DrawingOverlay: React.FC<{
    drawing: UseWallDrawingReturn;
    fw: number; fd: number;
}> = ({ drawing, fw, fd }) => {
    const { anchorPoints, points, previewPoint, arcPreviewWall, isDrawing } = drawing;

    const previewPts = useMemo((): [number, number, number][] => {
        if (!isDrawing || anchorPoints.length === 0 || !previewPoint) return [];
        const last = anchorPoints[anchorPoints.length - 1];
        return [
            [last.nx * fw - fw / 2, 0.18, last.ny * fd - fd / 2],
            [previewPoint.nx * fw - fw / 2, 0.18, previewPoint.ny * fd - fd / 2],
        ];
    }, [anchorPoints, previewPoint, isDrawing, fw, fd]);

    if (!isDrawing) return null;

    return (
        <group>
            {anchorPoints.map((p, i) => (
                <mesh key={`a-${i}`}
                    position={[p.nx * fw - fw / 2, 0.22, p.ny * fd - fd / 2]}
                    renderOrder={8}>
                    <sphereGeometry args={[0.18, 12, 12]} />
                    <meshStandardMaterial color="#f0c040"
                        emissive="#f0c040" emissiveIntensity={1.2} />
                </mesh>
            ))}
            {points.map((p, i) => (
                <mesh key={`p-${i}`}
                    position={[p.nx * fw - fw / 2, 0.22, p.ny * fd - fd / 2]}
                    renderOrder={8}>
                    <sphereGeometry args={[0.13, 10, 10]} />
                    <meshStandardMaterial color="#48cae4"
                        emissive="#48cae4" emissiveIntensity={1.0} />
                </mesh>
            ))}
            {previewPts.length === 2 && (
                <Line points={previewPts} color="#ffea00"
                    lineWidth={1.5} dashed
                    dashSize={0.35} gapSize={0.18}
                    renderOrder={7} />
            )}
            {arcPreviewWall && (
                <WallSegment
                    wall={arcPreviewWall}
                    fw={fw} fd={fd} floorY={0} isPreview />
            )}
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RAYCAST FLOOR
// ─────────────────────────────────────────────────────────────────────────────

const RaycastFloor: React.FC<{
    fw: number; fd: number; floorY: number;
    drawing: UseWallDrawingReturn;
    isPlacing?: boolean;
    onSensorPlaced?: (nx: number, ny: number) => void;
    onUpdatePlacementPreview?: (nx: number, ny: number) => void;
}> = ({ fw, fd, floorY, drawing, isPlacing = false, onSensorPlaced, onUpdatePlacementPreview }) => {
    const isDrawingRef = useRef(false);
    const isClosedRef = useRef(false);
    const lastClickTime = useRef(0);
    const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        isDrawingRef.current = drawing.isDrawing;
        isClosedRef.current = drawing.isShapeClosed;
    }, [drawing.isDrawing, drawing.isShapeClosed]);

    useEffect(() => () => {
        if (clickTimer.current) clearTimeout(clickTimer.current);
    }, []);

    const toNorm = (pt: THREE.Vector3) => ({
        nx: (pt.x + fw / 2) / fw,
        ny: (pt.z + fd / 2) / fd,
    });

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, floorY + 0.05, 0]}
            onPointerMove={e => {
                e.stopPropagation();
                const { nx, ny } = toNorm((e as any).point);

                if (isDrawingRef.current && !isClosedRef.current) {
                    drawing.updatePreview(nx, ny);
                } else if (isPlacing) {
                    onUpdatePlacementPreview?.(nx, ny);
                }
            }}
            onPointerDown={e => {
                e.stopPropagation();
                const { nx, ny } = toNorm((e as any).point);

                if (isPlacing) {
                    onSensorPlaced?.(nx, ny);
                    return;
                }

                if (!isDrawingRef.current || isClosedRef.current) return;

                const now = Date.now();
                const delta = now - lastClickTime.current;
                lastClickTime.current = now;

                if (delta < 300) {
                    if (clickTimer.current) {
                        clearTimeout(clickTimer.current);
                        clickTimer.current = null;
                    }
                    drawing.finishDrawing();
                    return;
                }
                clickTimer.current = setTimeout(() => {
                    drawing.addPoint(nx, ny);
                    clickTimer.current = null;
                }, 310);
            }}
        >
            <planeGeometry args={[fw, fd]} />
            <meshBasicMaterial transparent opacity={0}
                depthWrite={false} colorWrite={false}
                side={THREE.DoubleSide} />
        </mesh>
    );
};

const SceneLights: React.FC = () => (
    <>
        <ambientLight intensity={0.55} color="#8a9ab0" />
        <directionalLight position={[20, 35, 15]}
            intensity={1.2} castShadow color="#fff8f0"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024} />
        <directionalLight position={[-15, 20, -10]}
            intensity={0.4} color="#c8e8ff" />
        <pointLight position={[0, 8, 0]}
            intensity={0.3} color="#ffffff" distance={60} />
    </>
);

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR SLAB — reusable across scene levels
// ─────────────────────────────────────────────────────────────────────────────

const FloorSlab: React.FC<{
    fw: number; fd: number; floorY: number;
    isSelected?: boolean;
    hasImage?: boolean;
}> = ({ fw, fd, floorY, isSelected = false, hasImage = false }) => {
    const theme = useHaloTheme();
    return (
        <group position={[0, floorY, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]} receiveShadow renderOrder={1}>
                <planeGeometry args={[fw, fd]} />
                <meshStandardMaterial
                    color={theme.floor}
                    transparent
                    opacity={hasImage ? 0.0 : theme.slabOpacity}
                    roughness={0.9} metalness={0} />
            </mesh>
            <lineSegments rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.01, 0]} renderOrder={3}>
                <edgesGeometry
                    args={[new THREE.PlaneGeometry(fw, fd)]} />
                <lineBasicMaterial
                    color={isSelected ? '#f0c040' : '#4a90d9'}
                    transparent
                    opacity={isSelected ? 0.8 : 0.35} />
            </lineSegments>
            {[
                [-fw / 2, 0, -fd / 2], [fw / 2, 0, -fd / 2],
                [-fw / 2, 0, fd / 2], [fw / 2, 0, fd / 2],
            ].map((pos, i) => (
                <mesh key={i}
                    position={pos as [number, number, number]}
                    renderOrder={9}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshBasicMaterial
                        color={isSelected ? '#f0c040' : '#4a90d9'}
                        transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── SCENE LEVEL: SITE
// Shows all buildings as simple labeled boxes
// ─────────────────────────────────────────────────────────────────────────────

const SiteScene: React.FC<{
    areaTree: AreaNode;
    wallsByFloor: Record<number, AreaWall[]>;
    sensors: SensorNode[];
    focusedSensorId: number | null;
    setFocusedSensorId: (id: number | null) => void;
    onSensorClick?: (sensor: SensorNode) => void;
    blinkingWallIds?: (number | string)[];
}> = ({ areaTree, wallsByFloor, sensors, focusedSensorId, setFocusedSensorId, onSensorClick, blinkingWallIds = [] }) => {
    const buildings = (areaTree.children ?? []).filter(
        c => c.area_type === 'Building'
    );

    const theme = useHaloTheme();

    return (
        <group>
            <SceneLights />
            <ContactShadows position={[0, -0.01, 0]}
                opacity={0.25} scale={300} blur={2}
                far={10} color="#000820" />

            {buildings.map(building => (
                <group
                    key={building.id}
                    position={[
                        building.offset_x ?? 0,
                        0,
                        building.offset_y ?? 0,
                    ]}
                >
                    <BuildingScene
                        building={building}
                        wallsByFloor={wallsByFloor}
                        sensors={sensors}
                        focusedSensorId={focusedSensorId}
                        setFocusedSensorId={setFocusedSensorId}
                        onSensorClick={onSensorClick}
                        blinkingWallIds={blinkingWallIds}
                    />
                </group>
            ))}

            <Grid position={[0, -0.01, 0]}
                infiniteGrid fadeDistance={300} fadeStrength={5}
                cellSize={2} sectionSize={10}
                cellColor={theme.gridCell} sectionColor={theme.gridSec}
                cellThickness={0.5} sectionThickness={1.0} />
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── SCENE LEVEL: BUILDING
// All floors stacked, walls per floor, halos visible
// ─────────────────────────────────────────────────────────────────────────────

const BuildingScene: React.FC<{
    building: AreaNode;
    wallsByFloor: Record<number, AreaWall[]>;
    sensors: SensorNode[];
    focusedSensorId: number | null;
    setFocusedSensorId: (id: number | null) => void;
    onSensorClick?: (sensor: SensorNode) => void;
    blinkingWallIds?: (number | string)[];
}> = ({ building, wallsByFloor, sensors, focusedSensorId, setFocusedSensorId, onSensorClick, blinkingWallIds = [] }) => {
    const floors = (building.children ?? [])
        .filter(c => c.area_type === 'Floor')
        .sort((a, b) => (a.floor_level ?? 0) - (b.floor_level ?? 0));

    const theme = useHaloTheme();

    return (
        <group>
            <ContactShadows position={[0, -0.01, 0]}
                opacity={0.3} scale={100} blur={2}
                far={10} color="#000820" />

            {floors.map(floor => {
                const fw = floor.floor_width ?? 20;
                const fd = floor.floor_depth ?? 15;
                const fy = floor.offset_z ?? 0;
                const walls = wallsByFloor[floor.id] ?? [];

                return (
                    <group key={floor.id}>
                        {/* Floor slab */}
                        <FloorSlab fw={fw} fd={fd} floorY={fy} />

                        {/* Floor plan image if uploaded */}
                        {floor.area_plan && (
                            <Suspense fallback={null}>
                                <group position={[0, fy, 0]}>
                                    <FloorPlanImage
                                        url={floor.area_plan}
                                        w={fw} d={fd} />
                                </group>
                            </Suspense>
                        )}

                        {/* Walls */}
                        {walls.map(wall => (
                            <WallSegment
                                key={wall.id}
                                wall={wall}
                                fw={fw} fd={fd}
                                floorY={fy}
                                isBlinking={blinkingWallIds.includes(wall.id)}
                            />
                        ))}

                        {/* Sensor Markers */}
                        {sensors
                            .filter(s => s.floor_id === floor.id)
                            .map(sensor => (
                                <HaloSensorMarker
                                    key={sensor.id}
                                    sensor={sensor}
                                    fw={fw}
                                    fd={fd}
                                    floorY={fy}
                                    isFocused={focusedSensorId === sensor.id}
                                    onClick={clickedSensor => {
                                        setFocusedSensorId(clickedSensor.id);
                                        onSensorClick?.(clickedSensor);
                                    }}
                                />
                            ))}

                        {/* Floor label */}
                        <Html
                            position={[fw / 2 + 1.5, fy + 0.5, 0]}
                            center distanceFactor={22}
                            style={{
                                pointerEvents: 'none',
                                userSelect: 'none',
                            }}>
                            <div style={{
                                background: theme.labelBg,
                                border: `1px solid ${theme.labelBorder}`,
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 9,
                                fontWeight: 600,
                                color: theme.labelTextColor,
                                whiteSpace: 'nowrap',
                                backdropFilter: 'blur(6px)',
                            }}>
                                {floor.name}
                                <span style={{ opacity: 0.5, marginLeft: 4 }}>
                                    L{floor.floor_level}
                                </span>
                            </div>
                        </Html>
                    </group>
                );
            })}

            <Grid position={[0, -0.01, 0]}
                infiniteGrid fadeDistance={80} fadeStrength={4}
                cellSize={1} sectionSize={5}
                cellColor={theme.gridCell} sectionColor={theme.gridSec}
                cellThickness={0.6} sectionThickness={1.2} />
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── SCENE LEVEL: FLOOR
// Single floor, full detail, drawing enabled
// ─────────────────────────────────────────────────────────────────────────────

const FloorScene: React.FC<{
    floor: AreaNode;
    walls: AreaWall[];
    sensors: SensorNode[];
    drawing: UseWallDrawingReturn;
    selectedAreaId: number | null;
    focusedSensorId: number | null;
    setFocusedSensorId: (id: number | null) => void;
    isPlacing?: boolean;
    placementPreview?: { nx: number; ny: number } | null;
    onSensorPlaced?: (nx: number, ny: number) => void;
    onSensorClick?: (sensor: SensorNode) => void;
    onUpdatePlacementPreview?: (nx: number, ny: number) => void;
    blinkingWallIds?: (number | string)[];
}> = ({
    floor, walls, sensors, drawing, selectedAreaId,
    focusedSensorId, setFocusedSensorId,
    isPlacing = false, placementPreview = null,
    onSensorPlaced, onSensorClick, onUpdatePlacementPreview,
    blinkingWallIds = []
}) => {
        const theme = useHaloTheme();
        const fw = floor.floor_width ?? 20;
        const fd = floor.floor_depth ?? 15;

        // Find which walls belong to selected area
        const areaWallIds = useMemo(() => {
            if (!selectedAreaId) return new Set<number | string>();
            return new Set(
                walls
                    .filter(w =>
                        w.sub_area_id === selectedAreaId ||
                        w.area_id === selectedAreaId
                    )
                    .map(w => w.id)
            );
        }, [walls, selectedAreaId]);

        return (
            <group>
                <SceneLights />
                <ContactShadows position={[0, -0.01, 0]}
                    opacity={0.3}
                    scale={Math.max(fw, fd) * 2}
                    blur={2} far={10} color="#000820" />

                {/* Floor slab */}
                <FloorSlab
                    fw={fw} fd={fd} floorY={0}
                    hasImage={!!floor.area_plan} />

                {/* Floor plan image */}
                {floor.area_plan && (
                    <Suspense fallback={null}>
                        <FloorPlanImage
                            url={floor.area_plan}
                            w={fw} d={fd} />
                    </Suspense>
                )}

                {/* Floor label */}
                <Html position={[fw / 2 + 1.5, 0.5, 0]}
                    center distanceFactor={22}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    <div style={{
                        background: theme.labelBg,
                        border: `1px solid ${theme.labelBorder}`,
                        borderRadius: 6, padding: '4px 10px',
                        fontSize: 10, fontWeight: 600,
                        color: theme.labelTextColor, whiteSpace: 'nowrap',
                        backdropFilter: 'blur(6px)',
                    }}>
                        {floor.name}
                        <span style={{ opacity: 0.6, marginLeft: 6 }}>
                            {fw}m × {fd}m
                        </span>
                    </div>
                </Html>

                {/* Walls — alert pulse if area selected */}
                {walls.map(wall => (
                    <WallSegment
                        key={wall.id}
                        wall={wall}
                        fw={fw} fd={fd} floorY={0}
                        isPreview={
                            typeof wall.id === 'number' && wall.id < 0 &&
                            drawing.drawnWalls.some(dw => dw.id === wall.id)
                        }
                        isAlert={
                            selectedAreaId !== null &&
                            areaWallIds.has(wall.id)
                        }
                        isSelected={
                            selectedAreaId === null && false
                        }
                        isBlinking={blinkingWallIds.includes(wall.id)}
                    />
                ))}

                {/* Sensor Markers */}
                {sensors.map(sensor => (
                    <HaloSensorMarker
                        key={sensor.id}
                        sensor={sensor}
                        fw={fw}
                        fd={fd}
                        floorY={0}
                        isFocused={focusedSensorId === sensor.id}
                        onClick={clickedSensor => {
                            setFocusedSensorId(clickedSensor.id);
                            onSensorClick?.(clickedSensor);
                        }}
                    />
                ))}

                {/* Ghost preview while placing */}
                {isPlacing && placementPreview && (
                    <group position={[
                        placementPreview.nx * fw - fw / 2,
                        0.05,
                        placementPreview.ny * fd - fd / 2,
                    ]}>
                        {/* Pulsing ring */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[1.5, 2.0, 48]} />
                            <meshBasicMaterial
                                color="#06d6a0"
                                transparent
                                opacity={0.5}
                                depthWrite={false}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                        {/* Center dot */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[0.25, 24]} />
                            <meshBasicMaterial
                                color="#06d6a0"
                                transparent opacity={0.9}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Vertical line */}
                        <mesh position={[0, 1.5, 0]}>
                            <cylinderGeometry args={[0.03, 0.03, 3.0, 8]} />
                            <meshBasicMaterial
                                color="#06d6a0"
                                transparent opacity={0.4}
                            />
                        </mesh>
                        <Html position={[0, 3.2, 0]} center distanceFactor={20}
                            style={{ pointerEvents: 'none' }}>
                            <div style={{
                                background: 'rgba(6,214,160,0.15)',
                                border: '1px solid rgba(6,214,160,0.5)',
                                borderRadius: 6, padding: '2px 10px',
                                fontSize: 10, fontWeight: 700,
                                color: '#06d6a0', whiteSpace: 'nowrap',
                            }}>
                                Click to place
                            </div>
                        </Html>
                    </group>
                )}

                <RaycastFloor
                    fw={fw} fd={fd} floorY={0}
                    drawing={drawing}
                    isPlacing={isPlacing}
                    onSensorPlaced={onSensorPlaced}
                    onUpdatePlacementPreview={onUpdatePlacementPreview}
                />

                {/* Drawing overlay */}
                <DrawingOverlay drawing={drawing} fw={fw} fd={fd} />

                <Grid position={[0, -0.005, 0]}
                    infiniteGrid
                    fadeDistance={Math.max(fw, fd) * 2.5}
                    fadeStrength={4}
                    cellSize={1} sectionSize={5}
                    cellColor={theme.gridCell} sectionColor={theme.gridSec}
                    cellThickness={0.6} sectionThickness={1.2} />
            </group>
        );
    };

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — switches between scene levels
// ─────────────────────────────────────────────────────────────────────────────

interface HaloFloorSceneProps {
    sceneLevel: SceneLevel;
    areaTree: AreaNode;
    selectedBuilding: AreaNode | null;
    selectedFloor: AreaNode | null;
    selectedAreaId: number | null;
    wallsByFloor: Record<number, AreaWall[]>;
    activeWalls: AreaWall[];
    sensors: SensorNode[];
    drawing: UseWallDrawingReturn;
    focusedSensorId: number | null;
    setFocusedSensorId: (id: number | null) => void;
    isPlacing?: boolean;
    placementPreview?: { nx: number; ny: number } | null;
    onSensorPlaced?: (nx: number, ny: number) => void;
    onSensorClick?: (sensor: SensorNode) => void;
    onUpdatePlacementPreview?: (nx: number, ny: number) => void;
    blinkingWallIds?: (number | string)[];
}

const HaloFloorScene: React.FC<HaloFloorSceneProps> = ({
    sceneLevel, areaTree, selectedBuilding, selectedFloor, selectedAreaId,
    wallsByFloor, activeWalls, sensors,
    drawing, focusedSensorId, setFocusedSensorId,
    isPlacing = false, placementPreview = null,
    onSensorPlaced, onSensorClick, onUpdatePlacementPreview,
    blinkingWallIds = []
}) => {
    switch (sceneLevel) {

        case 'site':
            return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                />
            );

        case 'building':
            if (!selectedBuilding) return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                />
            );
            return (
                <BuildingScene
                    building={selectedBuilding}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                />
            );

        case 'floor':
        case 'area':
            if (!selectedFloor) return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                />
            );
            return (
                <FloorScene
                    floor={selectedFloor}
                    walls={activeWalls}
                    sensors={sensors.filter(
                        s => s.floor_id === selectedFloor.id
                    )}
                    drawing={drawing}
                    selectedAreaId={selectedAreaId}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    isPlacing={isPlacing}
                    placementPreview={placementPreview}
                    onSensorPlaced={onSensorPlaced}
                    onUpdatePlacementPreview={onUpdatePlacementPreview}
                    blinkingWallIds={blinkingWallIds}
                />
            );

        default:
            return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    blinkingWallIds={blinkingWallIds}
                />
            );
    }
};

export default HaloFloorScene;