import React, { Suspense, useMemo, useState, useRef, useEffect } from 'react';
import Icon from '../../icon/Icon';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid, Html, useTexture, Line, Environment, ContactShadows } from '@react-three/drei';
import {
    AreaNode, AreaWall, SensorNode, CountingLinePosition, OccupancySnapshot
} from '../../../utils/threeD/types';
import { getUtilizationColor, getUtilizationOpacity, getSensorsForFloor, denormalizeSensorPosition } from '../../../utils/threeD/dummyData';
import { UseWallDrawingReturn } from '../../../hooks/useWallDrawing';
import { UseSensorPlacementReturn } from '../../../hooks/useSensorPlacement';
import { WallSegment } from '../walls/WallSegment';
import { SensorBeam3D } from '../sensors/SensorBeam3D';
import { CountingLineHandle } from '../sensors/CountingLineHandle';
import { SubAreaSlab } from './SubAreaSlab';
import { GlassTower } from './GlassTower';
import { PersonModel } from '../people/PersonModel';
import { useTransientPeople } from '../../../hooks/useTransientPeople';
import { TransientPerson } from '../people/TransientPerson';
import useDarkMode from '../../../hooks/useDarkMode';

// ── LOD Constants ──────────────────────────────────────
const PEOPLE_VISIBLE_DISTANCE = 60;
const BUILDING_LOD_MID = 60;
const BUILDING_LOD_FAR = 120;

// -------------------------------------------------------
// COLOURS — floor slab per level
// -------------------------------------------------------
const FLOOR_SLAB_COLORS = ['#4a90d9', '#7b68ee', '#48cae4', '#52b788', '#f4a261'];
const FLOOR_SLAB_ALPHA = [0.14, 0.12, 0.11, 0.10, 0.09];

// Recursive helper to check if an area is inside another area's hierarchy
const isAreaChildOf = (targetId: number, parentNode: AreaNode): boolean => {
    if (parentNode.id === targetId) return true;
    if (!parentNode.children) return false;
    for (const child of parentNode.children) {
        if (isAreaChildOf(targetId, child)) return true;
    }
    return false;
};

// -------------------------------------------------------
// UTILS
// -------------------------------------------------------
const findAreaName = (nodes: AreaNode[], targetId: number): string | null => {
    for (const node of nodes) {
        if (node.id === targetId) return node.name;
        if (node.children) {
            const name = findAreaName(node.children, targetId);
            if (name) return name;
        }
    }
    return null;
};

// Recursive helper to collect all walls in an area's hierarchy
const collectHierarchicalWalls = (node: AreaNode, wallsByFloor: Record<number, AreaWall[]>): AreaWall[] => {
    let walls = wallsByFloor[node.id] ?? [];
    if (node.children) {
        node.children.forEach(child => {
            walls = [...walls, ...collectHierarchicalWalls(child, wallsByFloor)];
        });
    }
    return walls;
};

function useCameraDistance(worldX: number, worldZ: number): number {
    const [dist, setDist] = useState(999);
    const { camera } = useThree();
    useFrame(() => {
        const d = camera.position.distanceTo(
            new THREE.Vector3(worldX, 0, worldZ)
        );
        setDist(d);
    });
    return dist;
}

// -------------------------------------------------------
// SENSOR MARKER
// -------------------------------------------------------
interface SensorMarkerProps {
    sensor: SensorNode;
    floor: AreaNode;
    floorY: number;
}

const SensorMarker: React.FC<SensorMarkerProps & { isPending?: boolean }> = ({ sensor, floor, floorY, isPending }) => {
    const pos = useMemo(() => denormalizeSensorPosition(sensor, floor), [sensor, floor]);
    if (!pos) return null;

    const online = sensor.online_status;
    const color = isPending ? '#f0c040' : (online ? '#00e676' : '#f44336');
    const worldPos: [number, number, number] = [pos.x, floorY + pos.y, pos.z];

    return (
        <group position={worldPos} rotation={[0, (sensor.position!.rotation_y * Math.PI) / 180, 0]}>
            <mesh castShadow>
                <boxGeometry args={[0.25, 0.15, 0.15]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isPending ? 0.6 : 0.3} />
            </mesh>
            <mesh position={[0.18, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.08, 8]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <pointLight color={color} intensity={0.3} distance={2} />
            <Html distanceFactor={22} position={[0, 0.35, 0]} center>
                <div style={{
                    background: isPending ? 'rgba(240,192,64,0.15)' : 'rgba(0,0,0,0.6)',
                    border: '1px solid ' + color,
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 9,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    color,
                }}>
                    📷 {sensor.sensor_name}{isPending ? ' ●' : ''}
                </div>
            </Html>
        </group>
    );
};

// -------------------------------------------------------
// FLOOR PLANE — slab + occupancy heatmap colour
// -------------------------------------------------------
interface FloorPlaneProps {
    floor: AreaNode;
    floorY: number;
    isSelected: boolean;
    selectedAreaId?: number | null;
    occupancy?: OccupancySnapshot;
    onClick: () => void;
    onEditClick?: () => void;
    forceInvisible?: boolean;
}

const FloorPlane: React.FC<FloorPlaneProps & { showLabel?: boolean }> = ({ floor, floorY, isSelected, selectedAreaId, occupancy,
    onClick, onEditClick,
    forceInvisible = false,
    showLabel = true
}) => {
    const [hovered, setHovered] = useState(false);
    const [isLabelHovered, setIsLabelHovered] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);

    const w = floor.floor_width ?? 20;
    const d = floor.floor_depth ?? 15;
    const occ = occupancy?.[floor.id];

    const isSelectedAreaInFloor = selectedAreaId !== null && isAreaChildOf(selectedAreaId!, floor);

    const hasRealOccupancy = occ && (occ as any).current_occupancy > 0;
    const occUtilization = hasRealOccupancy
        ? ((occ as any).current_occupancy / (occ as any).capacity) * 100
        : 0;

    const slabColor = isSelectedAreaInFloor
        ? '#f0c040'
        : '#b0bec5';

    const baseAlpha = isSelectedAreaInFloor
        ? 0.35
        : hasRealOccupancy
            ? getUtilizationOpacity(occUtilization)
            : floor.area_plan ? 0 : 0;

    const showSlab = !forceInvisible && (hasRealOccupancy || isSelectedAreaInFloor);
    const showEdges = !forceInvisible && (floor.area_plan != null || isSelected || isSelectedAreaInFloor);

    const baseTargetAlpha = hasRealOccupancy ? baseAlpha : 0;
    const targetAlpha = isSelected ? 0.45 : hovered ? (hasRealOccupancy ? baseAlpha + 0.15 : 0.1) : baseTargetAlpha;

    useFrame(() => {
        if (!meshRef.current) return;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        // EARLY EXIT — skip if already at target (saves CPU every frame)
        const diff = Math.abs(mat.opacity - targetAlpha);
        if (diff < 0.001) return;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetAlpha, 0.1);
    });

    return (
        <group position={[0, floorY, 0]}>
            {showSlab && (
                <mesh
                    ref={meshRef}
                    rotation={[-Math.PI / 2, 0, 0]}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                    onPointerOut={() => setHovered(false)}
                >
                    <planeGeometry args={[w, d]} />
                    <meshStandardMaterial
                        color={slabColor}
                        transparent
                        opacity={baseAlpha}
                        depthWrite={true}
                        polygonOffset
                        polygonOffsetFactor={1}
                    />
                </mesh>
            )}

            {showEdges && (
                <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
                    <edgesGeometry args={[new THREE.PlaneGeometry(w, d)]} />
                    <lineBasicMaterial
                        color={isSelected ? '#f0c040' : '#b0bec5'}
                        transparent
                        opacity={isSelected ? 0.8 : 0.15}
                    />
                </lineSegments>
            )}

            {floor.area_plan && (
                <Suspense fallback={null}>
                    <FloorPlanImage url={floor.area_plan} w={w} d={d} />
                </Suspense>
            )}

            {showLabel !== false && (
                <Html position={[w / 2 + 0.5, 0.8, 0]} distanceFactor={20} center>
                <div style={{
                    background: isSelectedAreaInFloor ? 'rgba(240,192,64,0.3)' : isSelected ? 'rgba(74,144,217,0.22)' : 'rgba(128,128,128,0.18)',
                    border: `1px solid ${isSelectedAreaInFloor ? '#ffea00' : isSelected ? 'rgba(74,144,217,0.8)' : 'rgba(200,200,200,0.3)'}`,
                    borderRadius: 5,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(4px)',
                    userSelect: 'none',
                    color: isSelectedAreaInFloor ? '#fff080' : 'white',
                }}
                    onPointerOver={() => setIsLabelHovered(true)}
                    onPointerOut={() => setIsLabelHovered(false)}
                >
                    {isSelectedAreaInFloor
                        ? findAreaName([floor], selectedAreaId!) // Show sub-area name if one is selected inside this floor
                        : floor.name
                    }
                    {isSelectedAreaInFloor && <span style={{ marginLeft: 6, fontWeight: 800 }}>· Selected Area</span>}
                    {occ && !isSelectedAreaInFloor && <span style={{ opacity: 0.7, marginLeft: 4 }}>· {occ.current_occupancy}/{occ.capacity}</span>}
                    <span
                        onClick={(e) => { e.stopPropagation(); onEditClick?.(); }}
                        style={{
                            marginLeft: 8, cursor: 'pointer',
                            opacity: isLabelHovered ? 0.9 : 0.2,
                            transition: 'opacity 0.2s', fontSize: 12
                        }}
                        title="Edit properties"
                    >⚙</span>
                </div>
            </Html>
            )}
        </group>
    );
};

// -------------------------------------------------------
// FLOOR PLAN IMAGE OVERLAY
// -------------------------------------------------------
const FloorPlanImage: React.FC<{ url: string; w: number; d: number }> = ({ url, w, d }) => {
    const texture = useTexture(url);
    const { gl } = useThree();

    useMemo(() => {
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
        texture.anisotropy = maxAnisotropy;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.premultiplyAlpha = false;
        texture.needsUpdate = true;
    }, [texture, gl]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={2}>
            <planeGeometry args={[w, d]} />
            <meshBasicMaterial
                map={texture}
                transparent
                opacity={0.82}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// -------------------------------------------------------
// ARC COVER SHAPE HELPER
// Builds a FILLED arc disc (or sector) for floor coverage
// -------------------------------------------------------
function buildArcCoverShape(
    arcWall: AreaWall,
    fw: number,
    fd: number,
): THREE.ShapeGeometry | null {
    if (arcWall.arc_center_x == null || arcWall.arc_radius == null) return null;

    const cx = arcWall.arc_center_x * fw - fw / 2;
    const cz = arcWall.arc_center_z! * fd - fd / 2;
    const rOuter = arcWall.arc_radius * fw;

    let startA = arcWall.arc_start_angle ?? 0;
    let endA = arcWall.arc_end_angle ?? (Math.PI * 2);
    if (endA <= startA) endA += Math.PI * 2;

    const segments = arcWall.arc_segments ?? 64;
    const isFullCircle = (endA - startA) >= Math.PI * 2 - 0.01;
    const shape = new THREE.Shape();

    if (isFullCircle) {
        // Full filled disc
        shape.absarc(cx, -cz, rOuter, 0, Math.PI * 2, false);
    } else {
        // Filled pie sector
        shape.moveTo(cx, -cz);
        shape.lineTo(
            cx + Math.cos(startA) * rOuter,
            -(cz + Math.sin(startA) * rOuter)
        );
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const angle = startA + t * (endA - startA);
            shape.lineTo(
                cx + Math.cos(angle) * rOuter,
                -(cz + Math.sin(angle) * rOuter)
            );
        }
        shape.lineTo(cx, -cz);
    }

    shape.closePath();
    return new THREE.ShapeGeometry(shape, segments);
}

// -------------------------------------------------------
// ARC FLOOR SLAB — solid-ish transparent base for arc floors
// -------------------------------------------------------
const ArcFloorSlab: React.FC<{
    floor: AreaNode;
    arcWall: AreaWall;
    floorY: number;
    isSelected: boolean;
    selectedAreaId: number | null;
    occupancy?: OccupancySnapshot;
    onClick: () => void;
    showLabel?: boolean;
}> = ({ floor, arcWall, floorY, isSelected, selectedAreaId, occupancy, onClick, showLabel = true }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { darkModeStatus } = useDarkMode();
    const [hovered, setHovered] = useState(false);

    const fw = floor.floor_width ?? 20;
    const fd = floor.floor_depth ?? 15;

    // Helper to check if any area in this floor's children is selected
    const isSelectedAreaInFloor = selectedAreaId !== null && isAreaChildOf(selectedAreaId!, floor);

    const occ = occupancy?.[floor.id];
    const hasRealOccupancy = occ && (occ as any).current_occupancy > 0;
    const occUtilization = hasRealOccupancy
        ? ((occ as any).current_occupancy / (occ as any).capacity) * 100
        : 0;

    const slabColor = isSelectedAreaInFloor
        ? '#f0c040'
        : darkModeStatus
            ? '#3a6a8a'
            : '#c8e4f2';

    const baseAlpha = isSelectedAreaInFloor
        ? 0.35
        : hasRealOccupancy
            ? 0.30
            : 0.15;

    const showSlab = hasRealOccupancy || isSelectedAreaInFloor;

    const targetAlpha = isSelected ? 0.45 : hovered ? (hasRealOccupancy ? baseAlpha + 0.15 : 0.1) : (hasRealOccupancy ? baseAlpha : 0);

    useFrame(() => {
        if (!meshRef.current) return;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        // EARLY EXIT — skip if already at target (saves CPU every frame)
        const diff = Math.abs(mat.opacity - targetAlpha);
        if (diff < 0.001) return;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetAlpha, 0.1);
    });

    const geometry = useMemo(
        () => buildArcCoverShape(arcWall, fw, fd),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [arcWall.arc_center_x, arcWall.arc_center_z, arcWall.arc_radius,
        arcWall.arc_start_angle, arcWall.arc_end_angle, fw, fd]
    );

    useEffect(() => {
        return () => { geometry?.dispose(); };
    }, [geometry]);

    if (!geometry) return null;

    return (
        <group>
            {showSlab && (
                <mesh
                    ref={meshRef}
                    geometry={geometry}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, floorY + 0.01, 0]}
                    renderOrder={2}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                    onPointerOut={() => setHovered(false)}
                >
                    <meshPhysicalMaterial
                        color={slabColor}
                        transparent
                        opacity={baseAlpha}
                        metalness={0.0}
                        roughness={0.1}
                        transmission={0.3}
                        thickness={0.1}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}
        </group>
    );
};// -------------------------------------------------------
// CEILING SLAB — horizontal cap for buildings with custom walls
// -------------------------------------------------------
// -------------------------------------------------------
// WALKING PERSON COMPONENTS (Mock / Real Occupancy)
// -------------------------------------------------------

function getMockPersonCount(floor: AreaNode, occupancy: OccupancySnapshot): number {
    const occ = occupancy?.[floor.id];
    if (occ && (occ as any).current_occupancy > 0) {
        // Show roughly 1 person per 10 actual occupants, min 1, max 8
        return Math.min(8, Math.max(1, Math.round((occ as any).current_occupancy / 10)));
    }
    // No data — show 1-3 mock people based on floor index (deterministic, not random)
    const floorIndex = floor.floor_level ?? 0;
    return [2, 1, 3, 2, 1][floorIndex % 5];
}

function getPersonWalkParams(personIndex: number, totalPeople: number, floorId: number) {
    const seed = (floorId * 7 + personIndex * 13) % 100;
    // Spread people evenly around the ellipse with slight offset per seed
    const startAngle = (personIndex / totalPeople) * Math.PI * 2 + (seed * 0.06);
    // Vary speed slightly so people don't bunch together over time
    const speed = 0.18 + (seed % 20) * 0.008; // 0.18–0.34 rad/s
    return { startAngle, speed };
}

interface WalkingPersonProps {
    floorY: number;
    rx: number;         // world-unit X radius — passed in pre-calculated
    rz: number;         // world-unit Z radius — passed in pre-calculated
    personIndex: number;
    totalPeople: number;
    floorId: number;
    scale?: number;
}

const WalkingPerson: React.FC<WalkingPersonProps> = React.memo(({
    floorY, rx, rz, personIndex, totalPeople, floorId, scale = 0.012
}) => {
    const { startAngle, speed } = useMemo(
        () => getPersonWalkParams(personIndex, totalPeople, floorId),
        [personIndex, totalPeople, floorId]
    );

    return (
        <PersonModel
            floorY={floorY}
            rx={rx}
            rz={rz}
            startAngle={startAngle}
            speed={speed}
            scale={scale}
        />
    );
});

interface FloorPersonsProps {
    floor: AreaNode;
    floorY: number;
    occupancy: OccupancySnapshot;
    walls?: AreaWall[];
    scalePerPerson?: number;
}

const FloorPersons: React.FC<FloorPersonsProps> = React.memo(({
    floor, floorY, occupancy, walls = [], scalePerPerson = 1.0
}) => {
    const count = getMockPersonCount(floor, occupancy);
    const fw = floor.floor_width ?? 20;
    const fd = floor.floor_depth ?? 15;

    // Find arc wall to get the actual interior radius
    const arcWall = walls.find(
        w => (w.wall_type === 'outer' || w.wall_type === 'glass')
            && w.arc_center_x != null && w.arc_radius != null
    );

    // Safe walk radius — stay well inside the walls
    // For arc buildings: use inner edge of arc wall
    // For rectangular buildings: use 18% of min dimension
    const safeRx = arcWall
        ? (arcWall.arc_radius! * fw) * 0.30
        : fw * 0.18;
    const safeRz = arcWall
        ? (arcWall.arc_radius! * fw) * 0.30
        : fd * 0.18;

    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <WalkingPerson
                    key={`person-${floor.id}-${i}`}
                    floorY={floorY}
                    rx={safeRx}
                    rz={safeRz}
                    personIndex={i}
                    totalPeople={count}
                    floorId={floor.id}
                    scale={scalePerPerson}
                />
            ))}
        </>
    );
});

// -------------------------------------------------------
// SINGLE BUILDING at world offset position
// -------------------------------------------------------
interface SingleBuildingProps {
    building: AreaNode;
    worldOffsetX: number;
    worldOffsetZ: number;
    selectedFloorId: number | null;
    selectedAreaId?: number | null;
    selectedWallId: number | string | null;
    showSensors: boolean;
    showCountingLines: boolean;
    occupancy: OccupancySnapshot;
    wallsByFloor: Record<number, AreaWall[]>;
    sensors: SensorNode[];
    onFloorClick: (id: number) => void;
    onWallClick: (wall: AreaWall, floor: AreaNode) => void;
    onWallPatch?: (wallId: number | string, patch: Partial<AreaWall>) => void;
    onEditArea: (node: AreaNode) => void;
    linesMode?: boolean;
    selectedLineId?: number | null;
    onSelectLine?: (id: number | null) => void;
    onPatchCountingLine?: (sensorId: number, lineId: number, patch: any) => Promise<void>;
    placingLine?: any;
    drawing?: UseWallDrawingReturn;
    sensorPlacement?: UseSensorPlacementReturn;
    onPlacingLineUpdate?: (state: any) => void;
    isBuildingView?: boolean;
}

const SingleBuilding: React.FC<SingleBuildingProps> = ({
    building, worldOffsetX, worldOffsetZ,
    selectedFloorId, selectedAreaId, selectedWallId,
    showSensors, showCountingLines, occupancy,
    wallsByFloor, sensors,
    onFloorClick, onWallClick, onWallPatch, onEditArea,
    linesMode, selectedLineId, onSelectLine, onPatchCountingLine,
    drawing, sensorPlacement, onPlacingLineUpdate,
    placingLine, isBuildingView,
}) => {
    const { darkModeStatus } = useDarkMode();
    const [hoveredWallId, setHoveredWallId] = useState<number | null>(null);
    const [isLabelHovered, setIsLabelHovered] = useState(false);
    const [isBuildingHovered, setIsBuildingHovered] = useState(false);
    const [mouseWorldPos, setMouseWorldPos] = useState<[number, number, number] | null>(null);

    const isPlacingRef = useRef(false);
    const isDrawingRef = useRef(false);
    const lastClickTime = useRef(0);
    const clickTimer = useRef<any>(null);

    useEffect(() => {
        isPlacingRef.current = !!sensorPlacement?.isPlacing;
        isDrawingRef.current = !!drawing?.isDrawing;
    }, [sensorPlacement?.isPlacing, drawing?.isDrawing]);

    const handlePointerMove = (e: any, floor: AreaNode) => {
        if (!isPlacingRef.current && !isDrawingRef.current && !placingLine) return;
        const floorW = floor.floor_width ?? 20;
        const floorD = floor.floor_depth ?? 15;
        const nx = (e.point.x - worldOffsetX + floorW / 2) / floorW;
        const ny = (e.point.z - worldOffsetZ + floorD / 2) / floorD;
        setMouseWorldPos([e.point.x, e.point.y, e.point.z]);
        if (isPlacingRef.current && sensorPlacement) sensorPlacement.updatePreview(nx, ny);
        if (isDrawingRef.current && drawing) drawing.updatePreview(nx, ny);
        if (placingLine && onPlacingLineUpdate) {
            onPlacingLineUpdate({ ...placingLine, x1: nx, y1: ny });
        }
    };

    const handlePointerDown = (e: any, floor: AreaNode) => {
        if (!isPlacingRef.current && !isDrawingRef.current && !placingLine) return;
        e.stopPropagation();
        const floorW = floor.floor_width ?? 20;
        const floorD = floor.floor_depth ?? 15;
        const nx = (e.point.x - worldOffsetX + floorW / 2) / floorW;
        const ny = (e.point.z - worldOffsetZ + floorD / 2) / floorD;
        if (isPlacingRef.current && sensorPlacement) sensorPlacement.placeSensor(nx, ny, floor.id);
        if (isDrawingRef.current && drawing) drawing.addPoint(nx, ny);
        if (placingLine && onPlacingLineUpdate && placingLine.step === 1) {
            onPlacingLineUpdate({ ...placingLine, x1: nx, y1: ny, step: 2 });
        } else if (placingLine && onPatchCountingLine && placingLine.step === 2) {
            onPatchCountingLine(placingLine.sensorId, placingLine.lineId, {
                line_r_x1: placingLine.x1, line_r_y1: placingLine.y1,
                line_r_x2: nx, line_r_y2: ny
            });
            onPlacingLineUpdate?.(null);
        }
    };

    const floors = useMemo(() =>
        (building.children ?? [])
            .filter(c => c.area_type === 'Floor')
            .sort((a, b) => (a.floor_level ?? 0) - (b.floor_level ?? 0)),
        [building]
    );

    const wallsByFloorId = useMemo(() => {
        const map = new Map<number, AreaWall[]>();
        floors.forEach(floor => {
            map.set(floor.id, collectHierarchicalWalls(floor, wallsByFloor));
        });
        return map;
    }, [floors, wallsByFloor]);

    const maxW = floors.reduce((m, f) => Math.max(m, f.floor_width ?? 20), 0);
    const totalHeight = floors.reduce((h, f) => h + (f.floor_height ?? 3), 0);

    const buildingRadius = useMemo(() => {
        for (const floor of floors) {
            const floorWalls = wallsByFloorId.get(floor.id) ?? [];
            const arcWall = floorWalls.find(w => w.arc_center_x != null);
            if (arcWall && arcWall.arc_radius != null) {
                return arcWall.arc_radius * (floor.floor_width ?? 20);
            }
        }
        return maxW / 2;
    }, [floors, wallsByFloorId, maxW]);

    const cameraDistance = useCameraDistance(worldOffsetX, worldOffsetZ);
    const isDistant = cameraDistance > BUILDING_LOD_FAR;
    const isMidRange = cameraDistance > BUILDING_LOD_MID && cameraDistance <= BUILDING_LOD_FAR;

    const hiddenFloors = useMemo(() => {
        const set = new Set<number>();
        floors.forEach(f => {
            const walls = wallsByFloorId.get(f.id) ?? [];
            if (walls.length > 0) set.add(f.id);
        });
        return set;
    }, [floors, wallsByFloorId]);

    const [sceneReady, setSceneReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setSceneReady(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (isDistant) {
        return (
            <group position={[worldOffsetX, 0, worldOffsetZ]}>
                <mesh position={[0, totalHeight / 2, 0]}>
                    <boxGeometry args={[maxW * 0.9, totalHeight, maxW * 0.9]} />
                    <meshStandardMaterial
                        color="#4a90d9"
                        transparent
                        opacity={0.35}
                        metalness={0.3}
                        roughness={0.4}
                    />
                </mesh>
                <Html position={[0, totalHeight + 2, 0]} distanceFactor={40} center>
                    <div style={{
                        color: '#fff', fontSize: 10, fontWeight: 700,
                        background: 'rgba(0,0,0,0.4)', padding: '2px 8px',
                        borderRadius: 4, whiteSpace: 'nowrap'
                    }}>
                        {building.name}
                    </div>
                </Html>
            </group>
        );
    }

    return (
        <group
            position={[worldOffsetX, 0, worldOffsetZ]}
            onPointerOver={(e) => { e.stopPropagation(); setIsBuildingHovered(true); }}
            onPointerOut={() => setIsBuildingHovered(false)}
        >
            <GlassTower
                floors={floors}
                worldOffsetX={0}
                worldOffsetZ={0}
                isHovered={isBuildingHovered}
                hiddenFloors={hiddenFloors}
            />

            {floors.map((floor, idx) => {
                const floorY = floor.offset_z ?? 0;
                const isSelected = selectedFloorId === floor.id;
                const walls = wallsByFloorId.get(floor.id) ?? [];
                const floorSensors = showSensors ? sensors.filter(s => s.position?.position_area_id === floor.id) : [];

                const arcWall = walls.find(w => w.arc_center_x != null);

                return (
                    <group
                        key={floor.id}
                        onPointerMove={(e) => handlePointerMove(e, floor)}
                        onPointerDown={(e) => handlePointerDown(e, floor)}
                    >
                        {arcWall ? (
                            <ArcFloorSlab
                                floor={floor}
                                arcWall={arcWall}
                                floorY={floorY}
                                isSelected={isSelected}
                                selectedAreaId={selectedAreaId ?? null}
                                occupancy={occupancy}
                                onClick={() => onFloorClick(floor.id)}
                                showLabel={!isMidRange && cameraDistance < 80}
                            />
                        ) : (
                            <FloorPlane
                                floor={floor}
                                floorY={floorY}
                                isSelected={isSelected}
                                selectedAreaId={selectedAreaId}
                                occupancy={occupancy}
                                onClick={() => onFloorClick(floor.id)}
                                onEditClick={() => onEditArea(floor)}
                                showLabel={!isMidRange && cameraDistance < 80}
                            />
                        )}


                        {walls.map(wall => (
                            <WallSegment
                                key={wall.id}
                                wall={wall}
                                floorWidth={floor.floor_width ?? 20}
                                floorDepth={floor.floor_depth ?? 15}
                                floorY={floorY}
                                isSelected={selectedWallId === wall.id}
                                isHovered={hoveredWallId === wall.id}
                                isFacade={wall.wall_type === 'outer' || wall.wall_type === 'glass' || (wall.wall_type as string) === 'inner'}
                                onClick={() => onWallClick(wall, floor)}
                                onHover={(hovered) => setHoveredWallId(hovered ? wall.id as number : null)}
                                isOccupancyAlert={(() => {
                                    const areaId = wall.sub_area_id || wall.area_id;
                                    const occ = occupancy[areaId];
                                    return !!(occ && occ.alert_threshold > 0 && occ.current_occupancy >= occ.alert_threshold);
                                })()}
                            />
                        ))}

                        {!isMidRange && showSensors && floorSensors.map(sensor => (
                            <SensorMarker
                                key={sensor.id}
                                sensor={sensor}
                                floor={floor}
                                floorY={floorY}
                                isPending={sensorPlacement?.activeSensor?.id === sensor.id || !!(sensorPlacement?.pendingPlacements && sensorPlacement.pendingPlacements[sensor.id])}
                            />
                        ))}

                        {!isMidRange && showSensors && floorSensors.flatMap(sensor => {
                            const lines = sensor.counting_lines.length > 0
                                ? sensor.counting_lines
                                : [{ id: `dummy-${sensor.id}`, line_r_x1: null } as any];
                            return lines.map(line => (
                                <SensorBeam3D
                                    key={`beam-${sensor.id}-${line.id}`}
                                    line={line}
                                    sensor={sensor}
                                    floorWidth={floor.floor_width ?? 20}
                                    floorDepth={floor.floor_depth ?? 15}
                                    floorHeight={floor.floor_height ?? 3.2}
                                    floorY={floorY}
                                    isSelected={selectedLineId === line.id}
                                    isLinesMode={linesMode ?? false}
                                    onClick={() => {
                                        if (line.id.toString().startsWith('dummy')) return;
                                        onSelectLine?.(selectedLineId === line.id ? null : line.id);
                                    }}
                                />
                            ));
                        })}

                        {/* Localized Room Slabs for building view */}
                        {(floor.children ?? []).map(subArea => {
                            const roomWalls = walls.filter(w => w.sub_area_id === subArea.id);
                            if (roomWalls.length === 0) return null;
                            return (
                                <SubAreaSlab
                                    key={subArea.id}
                                    area={subArea}
                                    walls={roomWalls}
                                    floorWidth={floor.floor_width ?? 20}
                                    floorDepth={floor.floor_depth ?? 15}
                                    floorY={floorY}
                                    occupancy={occupancy}
                                    isSelected={selectedAreaId === subArea.id}
                                    onClick={() => onEditArea(subArea)}
                                />
                            );
                        })}

                        {/* Floating label for selected area near walls */}
                        {(() => {
                            const selectedAreaWalls = selectedAreaId ? walls.filter(w => w.area_id === selectedAreaId || w.sub_area_id === selectedAreaId) : [];
                            const firstSelectedWall = selectedAreaWalls[0];
                            if (!firstSelectedWall) return null;

                            const floorW = floor.floor_width ?? 20;
                            const floorD = floor.floor_depth ?? 15;

                            return (
                                <Html
                                    position={[
                                        ((firstSelectedWall.r_x1 + firstSelectedWall.r_x2) / 2) * floorW - floorW / 2,
                                        floorY + (firstSelectedWall.r_height ?? 3) + 0.5,
                                        ((firstSelectedWall.r_y1 + firstSelectedWall.r_y2) / 2) * floorD - floorD / 2
                                    ]}
                                    center
                                    distanceFactor={15}
                                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                                >
                                    <div style={{
                                        background: '#f0c040',
                                        color: '#000',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        whiteSpace: 'nowrap',
                                        border: '1px solid rgba(0,0,0,0.2)',
                                        animation: 'pulse 1.5s infinite ease-in-out'
                                    }}>
                                        🎯 {findAreaName([building], selectedAreaId!) ?? 'Selected Area'}
                                    </div>
                                    <style>{`
                                        @keyframes pulse {
                                            0% { transform: scale(1); opacity: 0.9; }
                                            50% { transform: scale(1.1); opacity: 1; }
                                            100% { transform: scale(1); opacity: 0.9; }
                                        }
                                    `}</style>
                                </Html>
                            );
                        })()}

                        {sceneReady && cameraDistance < PEOPLE_VISIBLE_DISTANCE && (
                            <FloorPersons
                                floor={floor}
                                floorY={floorY}
                                occupancy={occupancy}
                                walls={walls}
                                scalePerPerson={isBuildingView ? 0.5 : 0.42}
                            />
                        )}
                    </group>
                );
            })}

            {!isMidRange && !isDistant && (
                <FloorCountIndicator floors={floors} buildingRadius={buildingRadius} />
            )}


            {/* Building label */}
            <Html position={[0, (floors.length * 4.5) + 4, 0]} distanceFactor={22} center>
                <div style={{
                    background: 'rgba(128,128,128,0.18)',
                    border: '1.5px solid rgba(180,180,180,0.4)',
                    borderRadius: 8,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    opacity: isLabelHovered ? 1 : 0.8,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    transform: isLabelHovered ? 'scale(1.05)' : 'scale(1)',
                    pointerEvents: 'auto',
                }}
                    onPointerOver={() => setIsLabelHovered(true)}
                    onPointerOut={() => setIsLabelHovered(false)}
                    onClick={() => onEditArea?.(building)}
                >
                    {building.name}
                </div>
            </Html>

            {/* Inner floors visualization */}
        </group>
    );
};

// -------------------------------------------------------
// FLOOR COUNT INDICATOR
// -------------------------------------------------------
interface FloorCountIndicatorProps {
    floors: AreaNode[];
    buildingRadius: number;
}

const FloorCountIndicator: React.FC<FloorCountIndicatorProps> = React.memo(({ floors, buildingRadius }) => {
    const { darkModeStatus } = useDarkMode();

    // Only render floor labels when camera is close enough to read them
    const { camera } = useThree();
    const [showLabels, setShowLabels] = useState(false);
    useFrame(() => {
        const d = camera.position.length(); // rough distance from origin
        if ((d < 80) !== showLabels) setShowLabels(d < 80);
    });

    if (floors.length === 0) return null;

    const totalHeight = floors.reduce((acc, f) => acc + (f.floor_height ?? 3.0), 0);
    const barX = buildingRadius + 1.5;

    return (
        <group position={[barX, 0, 0]}>
            <mesh position={[0, totalHeight / 2, 0]}>
                <boxGeometry args={[0.08, totalHeight, 0.08]} />
                <meshStandardMaterial
                    color={darkModeStatus ? '#4a5a6a' : '#a0b0c0'}
                    metalness={0.8} roughness={0.2}
                />
            </mesh>
            {floors.map((floor, i) => {
                const fy = floor.offset_z ?? 0;
                const fh = floor.floor_height ?? 3.0;
                return (
                    <group key={`floor-ind-${floor.id}`} position={[0, fy + fh / 2, 0]}>
                        <mesh position={[-0.2, 0, 0]}>
                            <boxGeometry args={[0.4, 0.04, 0.04]} />
                            <meshBasicMaterial color={darkModeStatus ? '#8a9ab0' : '#708090'} />
                        </mesh>
                        {showLabels && (
                            <Html position={[0.4, 0, 0]} center distanceFactor={15}>
                                <div style={{
                                    color: darkModeStatus ? '#8a9ab0' : '#5a6a7a',
                                    fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace',
                                    background: darkModeStatus ? 'rgba(10,15,30,0.6)' : 'rgba(255,255,255,0.6)',
                                    padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap'
                                }}>
                                    F{i + 1}
                                </div>
                            </Html>
                        )}
                    </group>
                );
            })}
        </group>
    );
});

// -------------------------------------------------------
// GROUND PLANE
// -------------------------------------------------------
const GroundPlane: React.FC<{ wide?: boolean }> = ({ wide }) => {
    const { darkModeStatus } = useDarkMode();
    const size = wide ? 400 : 150;
    const groundColor = darkModeStatus ? '#0a0f1e' : '#e8ecf0';
    const gridColor = darkModeStatus ? '#1a2233' : '#dde4ea';

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial color={groundColor} roughness={0.9} metalness={0.0} />
            </mesh>
            <gridHelper args={[size, size, gridColor, gridColor]} position={[0, -0.04, 0]} />
        </group>
    );
};

// -------------------------------------------------------
// SCENE ENVIRONMENT
// -------------------------------------------------------
const SceneEnvironment: React.FC<{ wide?: boolean }> = ({ wide }) => {
    const { darkModeStatus } = useDarkMode();
    const ambientIntensity = darkModeStatus ? 0.35 : 0.75;
    const sunIntensity = darkModeStatus ? 0.8 : 1.5;
    const skyIntensity = darkModeStatus ? 0.25 : 0.6;
    const ambientColor = darkModeStatus ? '#8a9ab0' : '#e8f4ff';
    const sunColor = darkModeStatus ? '#ffdab9' : '#fff8f0';

    return (
        <group>
            <fog attach="fog" args={[darkModeStatus ? '#0a0f1e' : '#e8eef4', wide ? 100 : 80, wide ? 400 : 300]} />
            <Environment preset="city" />
            <ambientLight intensity={ambientIntensity} color={ambientColor} />
            <directionalLight
                position={[20, 35, 15]} intensity={sunIntensity} castShadow color={sunColor}
                shadow-mapSize-width={1024} shadow-mapSize-height={1024}
                shadow-camera-far={150} shadow-camera-near={1}
            />
            <directionalLight position={[0, 30, 0]} intensity={skyIntensity} color={darkModeStatus ? '#5a7a9a' : '#c8e8ff'} />
            <directionalLight position={[-20, 15, -10]} intensity={darkModeStatus ? 0.3 : 0.5} color={darkModeStatus ? '#3a4a5a' : '#ddeeff'} />
            <directionalLight position={[25, 10, -10]} intensity={darkModeStatus ? 0.25 : 0.4} color={darkModeStatus ? '#4a5a6a' : '#ffffff'} />
            <pointLight position={[0, -2, 0]} intensity={darkModeStatus ? 0.1 : 0.2} color="#f0ece4" distance={wide ? 150 : 60} />
            <GroundPlane wide={wide} />
            <ContactShadows
                position={[0, 0, 0]}
                opacity={darkModeStatus ? 0.25 : 0.4}
                scale={100} blur={2.4} far={10}
                color={darkModeStatus ? '#000000' : '#000820'}
            />
        </group>
    );
};

// -------------------------------------------------------
// BuildingScene
// -------------------------------------------------------
export interface BuildingSceneProps {
    building: AreaNode;
    selectedFloorId: number | null;
    selectedAreaId?: number | null;
    onFloorClick: (floorId: number) => void;
    selectedWallId: number | string | null;
    onWallClick: (wall: AreaWall, floor: AreaNode) => void;
    showSensors?: boolean;
    showCountingLines?: boolean;
    occupancy?: OccupancySnapshot;
    wallsByFloor?: Record<number, AreaWall[]>;
    sensors?: SensorNode[];
    onWallPatch?: (wallId: number | string, patch: Partial<AreaWall>) => void;
    onEditArea: (node: AreaNode) => void;
    linesMode?: boolean;
    selectedLineId?: number | null;
    placingLine?: { sensorId: number; lineId: number; step: 1 | 2; x1?: number; y1?: number; } | null;
    onSelectLine?: (id: number | null) => void;
    onPlacingLineUpdate?: (state: any) => void;
    onPatchCountingLine?: (sensorId: number, lineId: number, patch: any) => Promise<void>;
    drawing?: UseWallDrawingReturn;
    sensorPlacement?: UseSensorPlacementReturn;
    isBuildingView?: boolean;
}

export const BuildingScene: React.FC<BuildingSceneProps> = ({
    building, selectedFloorId, selectedAreaId, onFloorClick,
    selectedWallId, onWallClick,
    showSensors = true, showCountingLines = true,
    occupancy = {}, wallsByFloor = {}, sensors = [],
    onWallPatch, onEditArea, linesMode, selectedLineId, placingLine,
    onSelectLine, onPatchCountingLine, drawing, sensorPlacement, onPlacingLineUpdate, isBuildingView,
}) => {
    if (!building) return null;
    return (
        <group>
            <SceneEnvironment />
            <SingleBuilding
                building={building}
                worldOffsetX={building.offset_x ?? 0}
                worldOffsetZ={building.offset_y ?? 0}
                selectedFloorId={selectedFloorId}
                selectedAreaId={selectedAreaId}
                selectedWallId={selectedWallId}
                showSensors={showSensors}
                showCountingLines={showCountingLines}
                occupancy={occupancy}
                wallsByFloor={wallsByFloor}
                sensors={sensors}
                onFloorClick={onFloorClick}
                onWallClick={onWallClick}
                onWallPatch={onWallPatch}
                onEditArea={onEditArea}
                linesMode={linesMode}
                selectedLineId={selectedLineId}
                onSelectLine={onSelectLine}
                onPatchCountingLine={onPatchCountingLine}
                drawing={drawing}
                sensorPlacement={sensorPlacement}
                onPlacingLineUpdate={onPlacingLineUpdate}
                isBuildingView={isBuildingView ?? true}
            />
        </group>
    );
};

// -------------------------------------------------------
// RegionScene
// -------------------------------------------------------
export interface RegionSceneProps {
    buildings: (AreaNode & { worldX: number; worldY: number })[];
    selectedFloorId: number | null;
    selectedAreaId?: number | null;
    onFloorClick: (floorId: number) => void;
    selectedWallId: number | string | null;
    onWallClick: (wall: AreaWall, floor: AreaNode) => void;
    showSensors?: boolean;
    showCountingLines?: boolean;
    occupancy?: OccupancySnapshot;
    wallsByFloor?: Record<number, AreaWall[]>;
    sensors?: SensorNode[];
    onWallPatch?: (wallId: number | string, patch: Partial<AreaWall>) => void;
    onEditArea: (node: AreaNode) => void;
    linesMode?: boolean;
    selectedLineId?: number | null;
    onSelectLine?: (id: number | null) => void;
    onPatchCountingLine?: (sensorId: number, lineId: number, patch: any) => Promise<void>;
    placingLine?: any;
    drawing?: UseWallDrawingReturn;
    sensorPlacement?: UseSensorPlacementReturn;
    onPlacingLineUpdate?: (state: any) => void;
    isBuildingView?: boolean;
}

export const RegionScene: React.FC<RegionSceneProps> = ({
    buildings, selectedFloorId, selectedAreaId, onFloorClick,
    selectedWallId, onWallClick,
    showSensors = true, showCountingLines = true,
    occupancy = {}, wallsByFloor = {}, sensors = [],
    onWallPatch, onEditArea, linesMode, selectedLineId,
    onSelectLine, onPatchCountingLine, drawing, sensorPlacement,
    onPlacingLineUpdate, placingLine, isBuildingView,
}) => {
    return (
        <group>
            <SceneEnvironment wide />
            {buildings.map(building => (
                <SingleBuilding
                    key={building.id}
                    building={building}
                    worldOffsetX={building.worldX}
                    worldOffsetZ={building.worldY}
                    selectedFloorId={selectedFloorId}
                    selectedAreaId={selectedAreaId}
                    selectedWallId={selectedWallId}
                    showSensors={showSensors}
                    showCountingLines={showCountingLines}
                    occupancy={occupancy}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    onFloorClick={onFloorClick}
                    onWallClick={onWallClick}
                    onWallPatch={onWallPatch}
                    onEditArea={onEditArea}
                    linesMode={linesMode}
                    selectedLineId={selectedLineId}
                    onSelectLine={onSelectLine}
                    onPatchCountingLine={onPatchCountingLine}
                    drawing={drawing}
                    sensorPlacement={sensorPlacement}
                    onPlacingLineUpdate={onPlacingLineUpdate}
                    placingLine={placingLine}
                    isBuildingView={isBuildingView}
                />
            ))}
        </group>
    );
};

// -------------------------------------------------------
// BezierHandle
// -------------------------------------------------------
interface BezierHandleProps {
    wall: AreaWall;
    floorWidth: number;
    floorDepth: number;
    floorY: number;
    onDrag: (wallId: number | string, ctrlNx: number, ctrlNy: number) => void;
    onDragEnd: (wallId: number | string, ctrlNx: number, ctrlNy: number) => void;
}

const BezierHandle: React.FC<BezierHandleProps> = ({ wall, floorWidth, floorDepth, floorY, onDrag, onDragEnd }) => {
    const isDragging = useRef(false);

    const ctrlNx = wall.ctrl_x ?? (wall.r_x1 + wall.r_x2) / 2;
    const ctrlNy = wall.ctrl_y ?? (wall.r_y1 + wall.r_y2) / 2;
    const wx = ctrlNx * floorWidth - floorWidth / 2;
    const wz = ctrlNy * floorDepth - floorDepth / 2;
    const wy = wall.r_z_offset + wall.r_height / 2 + 0.1;

    const ax = wall.r_x1 * floorWidth - floorWidth / 2;
    const az = wall.r_y1 * floorDepth - floorDepth / 2;
    const bx = wall.r_x2 * floorWidth - floorWidth / 2;
    const bz = wall.r_y2 * floorDepth - floorDepth / 2;

    const guidePoints = useMemo(() => [
        new THREE.Vector3(ax, wy, az),
        new THREE.Vector3(wx, wy, wz),
        new THREE.Vector3(bx, wy, bz)
    ], [ax, az, wx, wz, bx, bz, wy]);
    const guideGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(guidePoints), [guidePoints]);
    const guideMat = useMemo(() => new THREE.LineDashedMaterial({ color: 0xf0c040, dashSize: 0.3, gapSize: 0.18, linewidth: 1 }), []);
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -(wy)), [wy]);

    return (
        <group>
            <primitive object={new THREE.Line(guideGeom, guideMat)} onUpdate={(l: THREE.Line) => l.computeLineDistances()} />
            <mesh
                position={[wx, wy, wz]}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    isDragging.current = true;
                    (e.target as any).setPointerCapture?.(e.pointerId);
                    document.body.style.cursor = 'grabbing';
                }}
                onPointerMove={(e) => {
                    if (!isDragging.current) return;
                    e.stopPropagation();
                    const target = new THREE.Vector3();
                    e.ray.intersectPlane(dragPlane, target);
                    if (!target) return;
                    target.y = floorY;
                    let newCtrlX = (target.x + floorWidth / 2) / floorWidth;
                    let newCtrlY = (target.z + floorDepth / 2) / floorDepth;
                    newCtrlX = Math.max(0.02, Math.min(0.98, newCtrlX));
                    newCtrlY = Math.max(0.02, Math.min(0.98, newCtrlY));
                    const midNx = (wall.r_x1 + wall.r_x2) / 2;
                    const midNy = (wall.r_y1 + wall.r_y2) / 2;
                    const wallLenN = Math.sqrt((wall.r_x2 - wall.r_x1) ** 2 + (wall.r_y2 - wall.r_y1) ** 2);
                    const maxDistN = wallLenN * 3;
                    const dxN = newCtrlX - midNx;
                    const dyN = newCtrlY - midNy;
                    const distN = Math.sqrt(dxN ** 2 + dyN ** 2);
                    if (distN > maxDistN && distN > 0) {
                        const ratio = maxDistN / distN;
                        newCtrlX = midNx + dxN * ratio;
                        newCtrlY = midNy + dyN * ratio;
                    }
                    onDrag(wall.id, newCtrlX, newCtrlY);
                }}
                onPointerUp={(e) => {
                    if (!isDragging.current) return;
                    e.stopPropagation();
                    isDragging.current = false;
                    document.body.style.cursor = 'grab';
                    const curNx = wall.ctrl_x ?? (wall.r_x1 + wall.r_x2) / 2;
                    const curNy = wall.ctrl_y ?? (wall.r_y1 + wall.r_y2) / 2;
                    onDragEnd(wall.id, curNx, curNy);
                }}
                onPointerOver={() => { if (!isDragging.current) document.body.style.cursor = 'grab'; }}
                onPointerOut={() => { if (!isDragging.current) document.body.style.cursor = ''; }}
            >
                <sphereGeometry args={[0.25, 14, 14]} />
                <meshStandardMaterial color="#f0c040" emissive="#f0c040" emissiveIntensity={0.9} roughness={0.2} metalness={0.4} />
            </mesh>
        </group>
    );
};

// -------------------------------------------------------
// FloorScene — single isolated floor
// -------------------------------------------------------
export interface FloorSceneProps {
    floor: AreaNode;
    selectedAreaId?: number | null;
    selectedWallId: number | string | null;
    onWallClick: (wall: AreaWall, floor: AreaNode) => void;
    showSensors?: boolean;
    showCountingLines?: boolean;
    occupancy?: OccupancySnapshot;
    drawing?: UseWallDrawingReturn;
    sensorPlacement?: UseSensorPlacementReturn;
    wallsByFloor?: Record<number, AreaWall[]>;
    sensors?: SensorNode[];
    onWallPatch?: (wallId: number | string, patch: Partial<AreaWall>) => void;
    onEditArea: (node: AreaNode) => void;
    linesMode?: boolean;
    selectedLineId?: number | null;
    placingLine?: { sensorId: number; lineId: number; step: 1 | 2; x1?: number; y1?: number; } | null;
    onSelectLine?: (id: number | null) => void;
    onPlacingLineUpdate?: (state: any) => void;
    onPatchCountingLine?: (sensorId: number, lineId: number, patch: any) => Promise<void>;
}

const FloorGlassShell: React.FC<{
    floorW: number; floorD: number; floorH: number; floorY: number;
}> = ({ floorW, floorD, floorH, floorY }) => {
    const { darkModeStatus } = useDarkMode();
    return (
        <group>
            {[
                { pos: [0, floorY + floorH / 2, floorD / 2] as [number, number, number], args: [floorW, floorH, 0.05] as [number, number, number] },
                { pos: [0, floorY + floorH / 2, -floorD / 2] as [number, number, number], args: [floorW, floorH, 0.05] as [number, number, number] },
                { pos: [-floorW / 2, floorY + floorH / 2, 0] as [number, number, number], args: [0.05, floorH, floorD] as [number, number, number] },
                { pos: [floorW / 2, floorY + floorH / 2, 0] as [number, number, number], args: [0.05, floorH, floorD] as [number, number, number] },
            ].map((panel, i) => (
                <mesh key={i} position={panel.pos} renderOrder={3}>
                    <boxGeometry args={panel.args} />
                    <meshPhysicalMaterial
                        color="#d0e8f2" transparent opacity={0.15}
                        metalness={0.1} roughness={0.05}
                        transmission={0.9} thickness={0.5}
                        side={THREE.DoubleSide} depthWrite={false}
                    />
                </mesh>
            ))}

            {/* Floor base slab for FloorScene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY + 0.01, 0]} renderOrder={2}>
                <planeGeometry args={[floorW, floorD]} />
                <meshPhysicalMaterial
                    color={darkModeStatus ? '#2a4a6a' : '#c8e4f2'}
                    transparent opacity={darkModeStatus ? 0.15 : 0.30}
                    transmission={0.4} thickness={0.1}
                    side={THREE.DoubleSide} depthWrite={false}
                />
            </mesh>
        </group>
    );
};

export const FloorScene: React.FC<FloorSceneProps> = ({
    floor, selectedAreaId, selectedWallId, onWallClick,
    showSensors = true, showCountingLines = true,
    occupancy = {},
    drawing, sensorPlacement,
    wallsByFloor = {}, sensors: sensorsProp = [],
    onWallPatch, onEditArea,
    linesMode, selectedLineId, placingLine,
    onSelectLine, onPlacingLineUpdate, onPatchCountingLine,
}) => {
    const { darkModeStatus } = useDarkMode();
    const [mouseWorldPos, setMouseWorldPos] = useState<[number, number, number] | null>(null);
    const [hoveredWallId, setHoveredWallId] = useState<number | null>(null);
    const [editingBezierWallId, setEditingBezierWallId] = useState<number | string | null>(null);
    const [localWallOverrides, setLocalWallOverrides] = useState<Record<number | string, Partial<AreaWall>>>({});

    const { transientPeople, addTransientPerson, removeTransientPerson } = useTransientPeople();

    const sensors = useMemo(() => {
        if (!floor) return [];
        const rawSensors = showSensors ? getSensorsForFloor(floor.id, sensorsProp) : [];
        if (!sensorPlacement || Object.keys(sensorPlacement.pendingPlacements).length === 0) return rawSensors;
        return rawSensors.map(s => {
            const pending = sensorPlacement.pendingPlacements[s.id];
            if (pending) return { ...s, position: { ...pending, position_area_id: floor.id } };
            return s;
        });
    }, [floor, sensorsProp, showSensors, sensorPlacement?.pendingPlacements]);

    useEffect(() => {
        const handleTransientEvent = (e: any) => {
            const { sensorId, direction, areaId } = e.detail;

            // Is this sensor on our floor?
            const targetSensor = sensors.find(s => s.id === sensorId);
            if (!targetSensor) return;

            // Does it have a counting line?
            const line = targetSensor.counting_lines?.[0];
            if (!line || line.line_r_x1 == null) return;

            const fw = floor.floor_width ?? 20;
            const fd = floor.floor_depth ?? 15;

            // Denormalize sensor position
            const sensorPos = denormalizeSensorPosition(targetSensor, floor);
            if (!sensorPos) return;

            // Denormalize line points
            const x1 = line.line_r_x1 * fw - fw / 2;
            const z1 = line.line_r_y1! * fd - fd / 2;
            const x2 = line.line_r_x2! * fw - fw / 2;
            const z2 = line.line_r_y2! * fd - fd / 2;

            const midX = (x1 + x2) / 2;
            const midZ = (z1 + z2) / 2;

            // End point is the sensor location at floor level
            const end = new THREE.Vector3(sensorPos.x, 0, sensorPos.z);

            // Start point: Project from sensor through midpoint, then beyond
            // vector from sensor to mid
            const vX = midX - sensorPos.x;
            const vZ = midZ - sensorPos.z;

            // Normalize and extend
            const vLen = Math.sqrt(vX * vX + vZ * vZ) || 1;
            const dirX = vX / vLen;
            const dirZ = vZ / vLen;

            // Start roughly 2-3 meters away, on the other side of the line
            const offsetDist = Math.max(vLen + 1.2, 2.5);
            const start = new THREE.Vector3(
                sensorPos.x + dirX * offsetDist,
                0,
                sensorPos.z + dirZ * offsetDist
            );

            // Trigger animation
            if (direction === 'out') {
                // If exiting, maybe walk from sensor outwards?
                // User said "walk from outside of counting line to sensor place"
                // so we'll stick to that for 'in' at least.
                addTransientPerson(start, end, 0, 3.5);
            } else {
                addTransientPerson(start, end, 0, 3.5);
            }
        };

        window.addEventListener('transient-person-event', handleTransientEvent);
        return () => window.removeEventListener('transient-person-event', handleTransientEvent);
    }, [sensors, floor, addTransientPerson]);

    const isDrawingRef = useRef(false);
    useEffect(() => { isDrawingRef.current = drawing?.isDrawing ?? false; }, [drawing?.isDrawing]);

    const isPlacingRef = useRef(false);
    useEffect(() => { isPlacingRef.current = sensorPlacement?.isPlacing ?? false; }, [sensorPlacement?.isPlacing]);

    const lastClickTime = useRef<number>(0);
    const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => { return () => { if (clickTimer.current) clearTimeout(clickTimer.current); }; }, []);

    const previewLineRef = useRef<THREE.Line>(null!);
    const lineMaterial = useMemo(() => new THREE.LineDashedMaterial({ color: 0xffea00, dashSize: 0.4, gapSize: 0.2, linewidth: 2 }), []);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry(), []);

    const fw = floor?.floor_width ?? 20;
    const fd = floor?.floor_depth ?? 15;
    const fh = floor?.floor_height ?? 3.0;

    useEffect(() => {
        if (!previewLineRef.current) return;
        const line = previewLineRef.current;
        if (drawing?.isDrawing && drawing.points.length > 0 && drawing.previewPoint) {
            const last = drawing.points[drawing.points.length - 1];
            const p1 = new THREE.Vector3(last.nx * fw - fw / 2, 0.15, last.ny * fd - fd / 2);
            const p2 = new THREE.Vector3(drawing.previewPoint.nx * fw - fw / 2, 0.15, drawing.previewPoint.ny * fd - fd / 2);
            const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            line.geometry.dispose();
            line.geometry = geom;
            line.computeLineDistances();
            line.visible = true;
        } else {
            line.visible = false;
        }
    }, [drawing?.points, drawing?.previewPoint, drawing?.isDrawing, fw, fd]);

    const walls = useMemo(() => {
        if (!floor) return [];
        return collectHierarchicalWalls(floor, wallsByFloor);
    }, [floor, wallsByFloor]);

    if (!floor) return null;

    const floorW = floor.floor_width ?? 20;
    const floorD = floor.floor_depth ?? 15;
    const floorHasWalls = walls.length > 0;

    // Find arc facade wall for this floor
    const arcFacadeWall = walls.find(
        w => (w.wall_type === 'outer' || w.wall_type === 'glass') && w.arc_center_x != null
    );

    const handlePointerDown = (e: any) => {
        const pt = e.point;
        const nx = (pt.x + floorW / 2) / floorW;
        const ny = (pt.z + floorD / 2) / floorD;
        if (isPlacingRef.current && sensorPlacement) {
            e.stopPropagation();
            sensorPlacement.placeSensor(nx, ny, floor.id);
            return;
        }
        if (placingLine && onPlacingLineUpdate && onPatchCountingLine) {
            e.stopPropagation();
            if (placingLine.step === 1) {
                onPlacingLineUpdate({ ...placingLine, step: 2, x1: nx, y1: ny });
            } else {
                onPatchCountingLine(placingLine.sensorId, placingLine.lineId, {
                    line_r_x1: placingLine.x1, line_r_y1: placingLine.y1,
                    line_r_x2: nx, line_r_y2: ny, line_r_height: 0.3,
                });
                onPlacingLineUpdate(null);
                setMouseWorldPos(null);
                if (onSelectLine) onSelectLine(placingLine.lineId);
            }
            return;
        }
        if (!isDrawingRef.current || !drawing) return;
        e.stopPropagation();
        const now = Date.now();
        const timeSinceLast = now - lastClickTime.current;
        lastClickTime.current = now;
        if (timeSinceLast < 300) {
            if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
            drawing.finishDrawing();
            return;
        }
        clickTimer.current = setTimeout(() => { drawing.addPoint(nx, ny); clickTimer.current = null; }, 310);
    };

    const handlePointerMove = (e: any) => {
        const pt = e.point;
        const nx = (pt.x + floorW / 2) / floorW;
        const ny = (pt.z + floorD / 2) / floorD;
        if (isPlacingRef.current && sensorPlacement) { e.stopPropagation(); sensorPlacement.updatePreview(nx, ny); return; }
        if (placingLine?.step === 2) setMouseWorldPos([pt.x, 0.15, pt.z]);
        if (!isDrawingRef.current || !drawing) return;
        e.stopPropagation();
        drawing.updatePreview(nx, ny);
    };

    const allWalls = [...walls, ...(drawing?.drawnWalls ?? [])];

    return (
        <group>
            <SceneEnvironment />
            <group position={[0, 0, 0]}>
                {/* Transparent raycast surface */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}>
                    <planeGeometry args={[floorW, floorD]} />
                    <meshBasicMaterial color="#000000" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} colorWrite={false} />
                </mesh>

                {floor.area_plan && (
                    <Suspense fallback={null}>
                        <FloorPlanImage url={floor.area_plan} w={floorW} d={floorD} />
                    </Suspense>
                )}


                <FloorPlane
                    floor={floor} floorY={0} isSelected={true}
                    occupancy={occupancy} onClick={() => { }} onEditClick={() => onEditArea(floor)}
                    selectedAreaId={selectedAreaId}
                />

                {/* Localized Room Slabs */}
                {(floor.children ?? []).map(subArea => {
                    const roomWalls = allWalls.filter(w => w.sub_area_id === subArea.id);
                    if (roomWalls.length === 0) return null;
                    return (
                        <SubAreaSlab
                            key={subArea.id}
                            area={subArea}
                            walls={roomWalls}
                            floorWidth={floorW}
                            floorDepth={floorD}
                            floorY={0}
                            occupancy={occupancy}
                            isSelected={selectedAreaId === subArea.id}
                            onClick={() => onEditArea(subArea)}
                        />
                    );
                })}

                {/* Transient People */}
                {transientPeople.map(p => (
                    <TransientPerson
                        key={p.id}
                        startPos={p.startPos}
                        endPos={p.endPos}
                        floorY={p.floorY}
                        duration={p.duration}
                        onComplete={() => removeTransientPerson(p.id)}
                        scale={0.012}
                    />
                ))}

                {/* Arc floor slab for FloorScene */}
                {arcFacadeWall && (
                    <ArcFloorSlab
                        floor={floor} arcWall={arcFacadeWall}
                        floorY={0} isSelected={true}
                        selectedAreaId={selectedAreaId}
                        occupancy={occupancy} onClick={() => { }}
                    />
                )}



                {/* Glass shell — only when no walls AND no arc wall */}
                {!floorHasWalls && !arcFacadeWall && (
                    <FloorGlassShell floorW={floorW} floorD={floorD} floorH={floor.floor_height ?? 3.0} floorY={0} />
                )}

                {/* Corner columns for FloorScene if building has walls but they don't cover everything */}
                {floorHasWalls && (
                    <group />
                )}

                {allWalls.map(wall => {
                    const isDrawnThisSession = drawing?.drawnWalls.some(dw => dw.id === wall.id) ?? false;
                    const override = localWallOverrides[wall.id];
                    const wallToRender = override ? { ...wall, ...override } : wall;
                    // Check against both area_id and sub_area_id for maximum compatibility
                    const isAreaSelected = selectedAreaId !== null && (wall.area_id === selectedAreaId || wall.sub_area_id === selectedAreaId);

                    return (
                        <WallSegment
                            key={wall.id}
                            wall={wallToRender}
                            floorWidth={floorW} floorDepth={floorD}
                            floorY={isDrawnThisSession ? 0.05 : 0}
                            isSelected={selectedWallId === wall.id}
                            isHovered={hoveredWallId === wall.id}
                            isAreaSelected={isAreaSelected}
                            isOccupancyAlert={(() => {
                                const areaId = wall.sub_area_id || wall.area_id;
                                const occ = occupancy[areaId];
                                return !!(occ && occ.alert_threshold > 0 && occ.current_occupancy >= occ.alert_threshold);
                            })()}
                            isFacade={wall.wall_type === 'outer' || wall.wall_type === 'glass' || (wall.wall_type as string) === 'inner'}
                            isPreview={isDrawnThisSession}
                            renderOrder={10}
                            onClick={(w) => { if (drawing?.isDrawing) return; setEditingBezierWallId(w.id); onWallClick(w, floor); }}
                            onHover={(h) => (!drawing?.isDrawing ? setHoveredWallId(h ? wall.id as number : null) : undefined)}
                            onUpdateEndpoints={(ep) => drawing?.updateWallEndpoints(wall.id as number, ep)}
                        />
                    );
                })}

                {/* Floating label for selected area near walls in FloorScene */}
                {(() => {
                    const selectedAreaWalls = allWalls.filter(w => w.area_id === selectedAreaId || w.sub_area_id === selectedAreaId);
                    const firstWall = selectedAreaWalls[0];
                    if (!firstWall || !selectedAreaId) return null;
                    const areaName = findAreaName([floor], selectedAreaId!);

                    return (
                        <Html
                            position={[
                                ((firstWall.r_x1 + firstWall.r_x2) / 2) * floorW - floorW / 2,
                                (firstWall.r_height ?? 3) + 0.5,
                                ((firstWall.r_y1 + firstWall.r_y2) / 2) * floorD - floorD / 2
                            ]}
                            center
                            distanceFactor={15}
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                            <div style={{
                                background: '#f0c040',
                                color: '#000',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(0,0,0,0.2)',
                                animation: 'pulse 1.5s infinite ease-in-out'
                            }}>
                                🎯 {areaName}
                            </div>
                        </Html>
                    );
                })()}

                {editingBezierWallId && !drawing?.isDrawing && (() => {
                    const baseWall = allWalls.find(w => w.id === editingBezierWallId);
                    if (!baseWall) return null;
                    const override = localWallOverrides[editingBezierWallId] ?? {};
                    const editWall = { ...baseWall, ...override };
                    return (
                        <BezierHandle
                            key={`bh-${editingBezierWallId}`}
                            wall={editWall} floorWidth={floorW} floorDepth={floorD} floorY={0}
                            onDrag={(id, nx, ny) => setLocalWallOverrides(prev => ({ ...prev, [id]: { wall_shape: 'bezier', ctrl_x: nx, ctrl_y: ny } as Partial<AreaWall> }))}
                            onDragEnd={(id, nx, ny) => {
                                const midNx = (baseWall.r_x1 + baseWall.r_x2) / 2;
                                const midNy = (baseWall.r_y1 + baseWall.r_y2) / 2;
                                const isStraight = Math.sqrt((nx - midNx) ** 2 + (ny - midNy) ** 2) < 0.02;
                                const patch = isStraight
                                    ? { wall_shape: 'straight' as const, ctrl_x: undefined, ctrl_y: undefined }
                                    : { wall_shape: 'bezier' as const, ctrl_x: nx, ctrl_y: ny };
                                setLocalWallOverrides(prev => ({ ...prev, [id]: patch }));
                                if (onWallPatch) onWallPatch(id, patch);
                            }}
                        />
                    );
                })()}

                <FloorPersons
                    floor={floor}
                    floorY={0}
                    occupancy={occupancy}
                    walls={allWalls}
                    scalePerPerson={0.5}
                />

                {drawing?.isDrawing && (
                    <>
                        {drawing.anchorPoints.map((p, idx) => {
                            const wx = p.nx * floorW - floorW / 2;
                            const wz = p.ny * floorD - floorD / 2;
                            return (
                                <mesh key={`anchor-${idx}`} position={[wx, 0.25, wz]} renderOrder={7}>
                                    <sphereGeometry args={[0.20, 10, 10]} />
                                    <meshStandardMaterial color="#f0c040" emissive="#f0c040" emissiveIntensity={1.4} />
                                </mesh>
                            );
                        })}
                        {drawing.points.map((p, idx) => {
                            const wx = p.nx * floorW - floorW / 2;
                            const wz = p.ny * floorD - floorD / 2;
                            return (
                                <mesh key={`pt-${idx}`} position={[wx, 0.25, wz]} renderOrder={7}>
                                    <sphereGeometry args={[0.14, 8, 8]} />
                                    <meshStandardMaterial color="#48cae4" emissive="#48cae4" emissiveIntensity={1.0} />
                                </mesh>
                            );
                        })}
                        <primitive
                            ref={previewLineRef}
                            object={(() => { const l = new THREE.Line(lineGeometry, lineMaterial); l.renderOrder = 7; return l; })()}
                            visible={false}
                        />
                        <Grid infiniteGrid fadeDistance={40} fadeStrength={5} cellSize={0.5} sectionSize={2.5}
                            sectionThickness={1.2}
                            sectionColor={darkModeStatus ? '#3a4a5a' : '#d0d0d0'}
                            cellColor={darkModeStatus ? '#2a3a4a' : '#b0b0b0'}
                            cellThickness={0.8} position={[0, 0, 0]} rotation={[0, 0, 0]}
                        />
                        {drawing.arcPreviewWall && (
                            <WallSegment
                                key="arc-preview" wall={drawing.arcPreviewWall}
                                floorWidth={floorW} floorDepth={floorD} floorY={0.05}
                                isSelected={false} isHovered={false} isPreview={true}
                                renderOrder={6} onClick={() => { }} onHover={() => { }}
                            />
                        )}
                    </>
                )}

                {sensors.filter(s => {
                    if (!s.position) return false;
                    if (s.counting_lines.some(cl => cl.line_r_x1 !== null)) return false;
                    if (linesMode) return false;
                    return true;
                }).map(sensor => (
                    <SensorMarker key={sensor.id} sensor={sensor} floor={floor} floorY={0}
                        isPending={!!sensorPlacement?.pendingPlacements[sensor.id]}
                    />
                ))}

                {placingLine?.step === 2 && placingLine.x1 != null && (
                    <mesh position={[placingLine.x1 * floorW - floorW / 2, 0.2, placingLine.y1! * floorD - floorD / 2]} renderOrder={7}>
                        <sphereGeometry args={[0.18, 10, 10]} />
                        <meshStandardMaterial color="#f4a261" emissive="#f4a261" emissiveIntensity={1.0} />
                    </mesh>
                )}

                {placingLine?.step === 2 && placingLine.x1 != null && mouseWorldPos && (
                    <Line
                        points={[[placingLine.x1 * floorW - floorW / 2, 0.15, placingLine.y1! * floorD - floorD / 2], mouseWorldPos]}
                        color="#f4a261" lineWidth={2} dashed dashSize={0.3} gapSize={0.2}
                    />
                )}

                {(linesMode || showCountingLines) && sensors.map(sensor => {
                    const lines = sensor.counting_lines.length > 0
                        ? sensor.counting_lines
                        : [{ id: `dummy-${sensor.id}`, line_r_x1: null } as any];
                    return lines.map(line => (
                        <SensorBeam3D
                            key={`beam-${line.id}`} line={line} sensor={sensor}
                            floorWidth={floorW} floorDepth={floorD}
                            floorHeight={floor.floor_height ?? 3.0} floorY={0.15}
                            isSelected={selectedLineId === line.id} isLinesMode={linesMode ?? false}
                            onClick={() => {
                                if (line.id.toString().startsWith('dummy')) return;
                                if (onSelectLine) onSelectLine(selectedLineId === line.id ? null : line.id);
                            }}
                        />
                    ));
                })}

                {linesMode && selectedLineId && (() => {
                    const sensor = sensors.find(s => s.counting_lines.some(l => l.id === selectedLineId));
                    const line = sensor?.counting_lines.find(l => l.id === selectedLineId);
                    if (!sensor || !line || line.line_r_x1 == null) return null;
                    return (
                        <CountingLineHandle
                            key={`handle-${line.id}`} line={line} sensor={sensor}
                            floorWidth={floorW} floorDepth={floorD} floorY={0.15}
                            onDragEnd={async (endpoint, nx, ny) => {
                                if (!onPatchCountingLine) return;
                                const patch = endpoint === 'start' ? { line_r_x1: nx, line_r_y1: ny } : { line_r_x2: nx, line_r_y2: ny };
                                await onPatchCountingLine(sensor.id, line.id, patch);
                            }}
                        />
                    );
                })()}

                {sensorPlacement?.isPlacing && sensorPlacement.previewPosition && (() => {
                    const px = sensorPlacement.previewPosition.nx * floorW - floorW / 2;
                    const pz = sensorPlacement.previewPosition.ny * floorD - floorD / 2;
                    const py = sensorPlacement.placementSettings.z_val * (floor.floor_height ?? 3.0);
                    return (
                        <group position={[px, py, pz]}>
                            <mesh>
                                <boxGeometry args={[0.35, 0.2, 0.2]} />
                                <meshStandardMaterial color="#f0c040" transparent opacity={0.7} emissive="#f0c040" emissiveIntensity={0.5} />
                            </mesh>
                            <mesh rotation={[Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[0.4, 0.5, 16]} />
                                <meshBasicMaterial color="#f0c040" transparent opacity={0.5} side={THREE.DoubleSide} />
                            </mesh>
                            <Html distanceFactor={22} position={[0, 0.5, 0]} center>
                                <div style={{ background: 'rgba(240,192,64,0.2)', border: '1px solid #f0c040', borderRadius: 4, padding: '2px 8px', fontSize: 9, color: '#f0c040', fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                                    📷 {sensorPlacement.activeSensor?.sensor_name}
                                </div>
                            </Html>
                        </group>
                    );
                })()}

                <Grid infiniteGrid fadeDistance={40} fadeStrength={5} cellSize={0.5} sectionSize={2.5}
                    sectionThickness={1.2}
                    sectionColor={darkModeStatus ? '#3a4a5a' : '#d0d0d0'}
                    cellColor={darkModeStatus ? '#2a3a4a' : '#b0b0b0'}
                    cellThickness={0.8} position={[0, 0, 0]} rotation={[0, 0, 0]}
                />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                    <circleGeometry args={[25, 64]} />
                    <meshStandardMaterial color="#000000" transparent opacity={0.02} roughness={1} metalness={0} />
                </mesh>
            </group>
        </group>
    );
};
import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { AreaNode } from '../../../utils/threeD/types';


interface GlassTowerProps {
    floors: AreaNode[];
    worldOffsetX: number;
    worldOffsetZ: number;
    isHovered?: boolean;
    hiddenFloors?: Set<number>;
}


// ── Constants ──────────────────────────────────────────
const GLASS_COLOR = '#90c8e0';   // blue-grey glass
const GLASS_OPACITY = 0.05;        // more transparent
const GLASS_OPACITY_HOVER = 0.25;   // more visible on hover
const FRAME_COLOR = '#b0c4d8';   // lighter frame lines
const COLUMN_COLOR = '#7a9ab5';
const SLAB_EDGE_COLOR = '#c8dce8';
const SLAB_EDGE_HEIGHT = 0.18;        // visible floor band
const COLUMN_RADIUS = 0.18;
const GROUND_SHADOW_COLOR = '#000000';


function buildMullionGeometry(floors: AreaNode[]): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];
    const matrix = new THREE.Matrix4();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);


    floors.forEach(floor => {
        const fy = floor.offset_z ?? 0;
        const fw = floor.floor_width ?? 20;
        const fd = floor.floor_depth ?? 15;
        const fh = floor.floor_height ?? 3.0;
        const fhw = fw / 2;
        const fhd = fd / 2;
        const panelH = fh - SLAB_EDGE_HEIGHT;
        const panelY = fy + SLAB_EDGE_HEIGHT + panelH / 2;
        const mullionW = 0.06;
        const mullionH = panelH;
        const mullionD = 0.06;


        // Front + Back face mullions
        const frontCount = Math.floor(fw / 2.5) - 1;
        for (let i = 0; i < frontCount; i++) {
            const mx = -fhw + (i + 1) * (fw / Math.floor(fw / 2.5));
            // Front
            const geoFront = boxGeo.clone();
            matrix.makeTranslation(mx, panelY, fhd + 0.01);
            matrix.scale(new THREE.Vector3(mullionW, mullionH, mullionD));
            geoFront.applyMatrix4(matrix);
            geometries.push(geoFront);
            // Back
            const geoBack = boxGeo.clone();
            matrix.makeTranslation(mx, panelY, -fhd - 0.01);
            matrix.scale(new THREE.Vector3(mullionW, mullionH, mullionD));
            geoBack.applyMatrix4(matrix);
            geometries.push(geoBack);
        }


        // Left + Right face mullions
        const sideCount = Math.floor(fd / 2.5) - 1;
        for (let i = 0; i < sideCount; i++) {
            const mz = -fhd + (i + 1) * (fd / Math.floor(fd / 2.5));
            // Left
            const geoLeft = boxGeo.clone();
            matrix.makeTranslation(-fhw - 0.01, panelY, mz);
            matrix.scale(new THREE.Vector3(mullionD, mullionH, mullionW));
            geoLeft.applyMatrix4(matrix);
            geometries.push(geoLeft);
            // Right
            const geoRight = boxGeo.clone();
            matrix.makeTranslation(fhw + 0.01, panelY, mz);
            matrix.scale(new THREE.Vector3(mullionD, mullionH, mullionW));
            geoRight.applyMatrix4(matrix);
            geometries.push(geoRight);
        }
    });


    if (geometries.length === 0) {
        return new THREE.BufferGeometry();
    }


    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    boxGeo.dispose();
    return merged;
}


function buildSlabEdgeGeometry(floors: AreaNode[], hiddenFloors: Set<number>): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];
    const matrix = new THREE.Matrix4();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);


    floors.forEach(floor => {
        if (hiddenFloors.has(floor.id)) return;
        const fy = floor.offset_z ?? 0;
        const fw = floor.floor_width ?? 20;
        const fd = floor.floor_depth ?? 15;
        const fhw = fw / 2;
        const fhd = fd / 2;
        const slabY = fy + SLAB_EDGE_HEIGHT / 2;


        // Front
        const gf = boxGeo.clone();
        matrix.compose(
            new THREE.Vector3(0, slabY, fhd),
            new THREE.Quaternion(),
            new THREE.Vector3(fw, SLAB_EDGE_HEIGHT, 0.06)
        );
        gf.applyMatrix4(matrix);
        geometries.push(gf);


        // Back
        const gb = boxGeo.clone();
        matrix.compose(
            new THREE.Vector3(0, slabY, -fhd),
            new THREE.Quaternion(),
            new THREE.Vector3(fw, SLAB_EDGE_HEIGHT, 0.06)
        );
        gb.applyMatrix4(matrix);
        geometries.push(gb);


        // Left
        const gl = boxGeo.clone();
        matrix.compose(
            new THREE.Vector3(-fhw, slabY, 0),
            new THREE.Quaternion(),
            new THREE.Vector3(0.06, SLAB_EDGE_HEIGHT, fd)
        );
        gl.applyMatrix4(matrix);
        geometries.push(gl);


        // Right
        const gr = boxGeo.clone();
        matrix.compose(
            new THREE.Vector3(fhw, slabY, 0),
            new THREE.Quaternion(),
            new THREE.Vector3(0.06, SLAB_EDGE_HEIGHT, fd)
        );
        gr.applyMatrix4(matrix);
        geometries.push(gr);
    });


    if (geometries.length === 0) return new THREE.BufferGeometry();
    const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    boxGeo.dispose();
    return merged;
}


export const GlassTower: React.FC<GlassTowerProps> = React.memo(({
    floors, worldOffsetX, worldOffsetZ, isHovered = false, hiddenFloors = new Set<number>()
}) => {
    if (!floors.length) return null;


    const buildingW = Math.max(...floors.map(f => f.floor_width ?? 20));
    const buildingD = Math.max(...floors.map(f => f.floor_depth ?? 15));


    const bottomY = Math.min(...floors.map(f => f.offset_z ?? 0));
    const topFloor = floors[floors.length - 1];
    const topY = (topFloor.offset_z ?? 0) + (topFloor.floor_height ?? 3.0);


    const hw = buildingW / 2;
    const hd = buildingD / 2;


    const mullionGeometry = useMemo(
        () => buildMullionGeometry(floors.filter(f => !hiddenFloors.has(f.id))),
        [floors, hiddenFloors]
    );


    const slabEdgeGeometry = useMemo(
        () => buildSlabEdgeGeometry(floors, hiddenFloors),
        [floors, hiddenFloors]
    );


    useEffect(() => {
        return () => {
            mullionGeometry?.dispose();
            slabEdgeGeometry?.dispose();
        };
    }, [mullionGeometry, slabEdgeGeometry]);


    return (
        <group position={[worldOffsetX, 0, worldOffsetZ]}>


            {/* Ground shadow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[buildingW + 2, buildingD + 2]} />
                <meshBasicMaterial color={GROUND_SHADOW_COLOR} transparent opacity={0.08} depthWrite={false} />
            </mesh>


            {/* Per-floor glass panels */}
            {floors.map((floor) => {
                if (hiddenFloors.has(floor.id)) return null;
                const fy = floor.offset_z ?? 0;
                const fh = floor.floor_height ?? 3.0;
                const fw = floor.floor_width ?? buildingW;
                const fd = floor.floor_depth ?? buildingD;
                const fhw = fw / 2;
                const fhd = fd / 2;
                const panelH = fh - SLAB_EDGE_HEIGHT;
                const panelY = fy + SLAB_EDGE_HEIGHT + panelH / 2;


                return (
                    <group key={floor.id}>
                        {/* Front panel */}
                        <mesh position={[0, panelY, fhd]} renderOrder={3}>
                            <planeGeometry args={[fw, panelH]} />
                            <meshStandardMaterial
                                color={GLASS_COLOR}
                                transparent
                                opacity={isHovered ? GLASS_OPACITY_HOVER : GLASS_OPACITY}
                                metalness={0.15}
                                roughness={0.05}
                                envMapIntensity={0.8}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Back panel */}
                        <mesh position={[0, panelY, -fhd]} rotation={[0, Math.PI, 0]} renderOrder={3}>
                            <planeGeometry args={[fw, panelH]} />
                            <meshStandardMaterial
                                color={GLASS_COLOR}
                                transparent
                                opacity={isHovered ? GLASS_OPACITY_HOVER : GLASS_OPACITY}
                                metalness={0.15}
                                roughness={0.05}
                                envMapIntensity={0.8}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Left panel */}
                        <mesh position={[-fhw, panelY, 0]} rotation={[0, -Math.PI / 2, 0]} renderOrder={3}>
                            <planeGeometry args={[fd, panelH]} />
                            <meshStandardMaterial
                                color={GLASS_COLOR}
                                transparent
                                opacity={isHovered ? GLASS_OPACITY_HOVER : GLASS_OPACITY}
                                metalness={0.15}
                                roughness={0.05}
                                envMapIntensity={0.8}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                        {/* Right panel */}
                        <mesh position={[fhw, panelY, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={3}>
                            <planeGeometry args={[fd, panelH]} />
                            <meshStandardMaterial
                                color={GLASS_COLOR}
                                transparent
                                opacity={isHovered ? GLASS_OPACITY_HOVER : GLASS_OPACITY}
                                metalness={0.15}
                                roughness={0.05}
                                envMapIntensity={0.8}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                    </group>
                );
            })}


            {/* Merged geometries */}
            {mullionGeometry && mullionGeometry.attributes.position && (
                <mesh geometry={mullionGeometry} renderOrder={4}>
                    <meshStandardMaterial
                        color={FRAME_COLOR}
                        transparent
                        opacity={0.35}
                        metalness={0.6}
                        roughness={0.3}
                    />
                </mesh>
            )}


            {slabEdgeGeometry && slabEdgeGeometry.attributes.position && (
                <mesh geometry={slabEdgeGeometry} renderOrder={3}>
                    <meshStandardMaterial
                        color={SLAB_EDGE_COLOR}
                        transparent
                        opacity={0.25}
                        metalness={0.3}
                        roughness={0.6}
                    />
                </mesh>
            )}


            {/* Columns (keeping individual for now as they are few) */}
            {floors.map((floor) => {
                if (hiddenFloors.has(floor.id)) return null;
                const fy = floor.offset_z ?? 0;
                const fh = floor.floor_height ?? 3.0;
                const fw = floor.floor_width ?? buildingW;
                const fd = floor.floor_depth ?? buildingD;
                const fhw = fw / 2;
                const fhd = fd / 2;
                const colH = fh;
                const colY = fy + colH / 2;
                return (
                    <group key={`cols-${floor.id}`}>
                        <mesh position={[-fhw, colY, -fhd]}><cylinderGeometry args={[COLUMN_RADIUS, COLUMN_RADIUS, colH, 8]} /><meshStandardMaterial color={COLUMN_COLOR} metalness={0.5} roughness={0.4} /></mesh>
                        <mesh position={[fhw, colY, -fhd]}><cylinderGeometry args={[COLUMN_RADIUS, COLUMN_RADIUS, colH, 8]} /><meshStandardMaterial color={COLUMN_COLOR} metalness={0.5} roughness={0.4} /></mesh>
                        <mesh position={[-fhw, colY, fhd]}><cylinderGeometry args={[COLUMN_RADIUS, COLUMN_RADIUS, colH, 8]} /><meshStandardMaterial color={COLUMN_COLOR} metalness={0.5} roughness={0.4} /></mesh>
                        <mesh position={[fhw, colY, fhd]}><cylinderGeometry args={[COLUMN_RADIUS, COLUMN_RADIUS, colH, 8]} /><meshStandardMaterial color={COLUMN_COLOR} metalness={0.5} roughness={0.4} /></mesh>
                    </group>
                );
            })}


        </group>
    );
});


import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AreaNode, AreaWall, OccupancySnapshot } from '../../../utils/threeD/types';
import { generateRoomShape, calculateCentroid } from '../../../utils/threeD/geometryUtils';
import { getUtilizationColor } from '../../../utils/threeD/dummyData';
import useDarkMode from '../../../hooks/useDarkMode';


interface SubAreaSlabProps {
    area: AreaNode;
    walls: AreaWall[];
    floorWidth: number;
    floorDepth: number;
    floorY: number;
    occupancy?: OccupancySnapshot;
    isSelected: boolean;
    onClick: () => void;
}


export const SubAreaSlab: React.FC<SubAreaSlabProps> = ({
    area,
    walls,
    floorWidth,
    floorDepth,
    floorY,
    occupancy,
    isSelected,
    onClick,
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { darkModeStatus } = useDarkMode();
    const [hovered, setHovered] = useState(false);


    // 1. Generate geometry from walls
    const geometry = useMemo(
        () => {
            const shape = generateRoomShape(walls, floorWidth, floorDepth);
            if (!shape) return null;
            return new THREE.ShapeGeometry(shape);
        },
        [walls, floorWidth, floorDepth]
    );


    // 2. Calculate Centroid for Label
    const centroid = useMemo(
        () => calculateCentroid(walls, floorWidth, floorDepth),
        [walls, floorWidth, floorDepth]
    );


    // 3. Determine occupancy color
    const occ = occupancy?.[area.id];
    const utilization = occ?.utilization_percent ?? 0;
    const hasOccupancy = utilization > 0;


    const slabColor = isSelected
        ? '#f0c040'
        : darkModeStatus ? '#2a4a6a' : '#c8e4f2';


    // 4. Animation Logic
    const baseAlpha = isSelected ? 0.35 : hasOccupancy ? 0.25 : 0.15;
    const targetAlpha = isSelected ? 0.45 : hovered ? baseAlpha + 0.15 : baseAlpha;


    useFrame(() => {
        if (!meshRef.current) return;
        const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetAlpha, 0.1);
    });


    if (!geometry) return null;


    return (
        <group>
            <mesh
                ref={meshRef}
                geometry={geometry}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, floorY + 0.02, 0]} // Slightly above main floor slab
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={() => setHovered(false)}
                renderOrder={5}
            >
                <meshPhysicalMaterial
                    color={slabColor}
                    transparent
                    opacity={baseAlpha}
                    metalness={0.05}
                    roughness={0.2}
                    transmission={0.4}
                    thickness={0.1}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>


            {/* Room Label */}
            <Html
                position={[centroid.x, floorY + 0.5, centroid.z]}
                center
                distanceFactor={15}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'all 0.3s ease',
                    opacity: hovered || isSelected ? 1 : 0.7,
                }}
            >
                <div style={{
                    background: darkModeStatus ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: isSelected ? '2px solid #f0c040' : (darkModeStatus ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)'),
                    borderRadius: '8px',
                    padding: '6px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    color: darkModeStatus ? '#f8fafc' : '#0f172a',
                    minWidth: '100px',
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        {area.name}
                    </span>
                    {hasOccupancy && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: getUtilizationColor(utilization),
                                boxShadow: `0 0 8px ${getUtilizationColor(utilization)}`,
                            }} />
                            <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.9 }}>
                                {utilization}% Utilization
                            </span>
                        </div>
                    )}
                </div>
            </Html>
        </group>
    );
};


import React from 'react';
import Icon from '../../icon/Icon';
import { SensorNode } from '../../../utils/threeD/types';
import { UseSensorPlacementReturn } from '../../../hooks/useSensorPlacement';
import useDarkMode from '../../../hooks/useDarkMode';
import { useThreeDTheme } from '../../../utils/threeD/theme';
import styles from '../../../styles/threeD/SensorPlacementPanel.module.scss';


interface SensorPlacementPanelProps {
    sensors: SensorNode[];
    placement: UseSensorPlacementReturn;
    currentFloorId: number | null;
    currentFloorHeight?: number | null;
    onSaveAll: () => void;
    onRemoveSensor: (sensorId: number) => Promise<void>;
    headerless?: boolean;
}


const MOUNT_ICONS: Record<string, string> = {
    wall: 'Videocam',
    ceiling: 'Sensors',
    floor: 'Sensors',
    pole: 'MyLocation',
};


const MOUNT_TYPES = ['wall', 'ceiling', 'floor', 'pole'] as const;


const SensorPlacementPanel: React.FC<SensorPlacementPanelProps> = ({
    sensors,
    placement,
    currentFloorId,
    currentFloorHeight,
    onSaveAll,
    onRemoveSensor,
    headerless = false,
}) => {
    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);
    if (currentFloorId === null) return null;


    const [removingId, setRemovingId] = React.useState<number | null>(null);


    const { isPlacing, activeSensor, previewPosition, pendingPlacements, placementSettings } = placement;


    const handleRemove = async (sensorId: number) => {
        setRemovingId(sensorId);
        try {
            await onRemoveSensor(sensorId);
        } catch (err) {
            console.error('Failed to remove placement', err);
        } finally {
            setRemovingId(null);
        }
    };


    // ─── Group sensors ───────────────────────────────────────────────────────
    const unplaced: SensorNode[] = [];
    const onThisFloor: SensorNode[] = [];
    const onOtherFloor: SensorNode[] = [];


    for (const s of sensors) {
        const pending = pendingPlacements[s.id];
        if (pending) {
            onThisFloor.push(s);
        } else if (!s.position) {
            unplaced.push(s);
        } else if (s.position.position_area_id === currentFloorId) {
            onThisFloor.push(s);
        } else {
            onOtherFloor.push(s);
        }
    }


    const pendingCount = Object.keys(pendingPlacements).length;


    const themeVars = {
        '--header-border': t.headerBorder,
        '--text-primary': t.textPrimary,
        '--text-secondary': t.textSecondary,
        '--text-muted': t.textMuted,
        '--input-border': t.inputBorder,
        '--warning-bg': t.warningBackground,
        '--badge-bg': t.badgeBg,
        '--accent-yellow': dark ? '#f0c040' : '#d97706',
        '--accent-blue': dark ? '#48cae4' : '#0077b6',
    } as React.CSSProperties;


    return (
        <div className={styles.panelContent} style={themeVars}>
            {/* Header */}
            {!headerless && (
                <div className={styles.header}>
                    <span><Icon icon="Videocam" size="xs" /> Sensors</span>
                    {pendingCount > 0 && (
                        <span className={styles.unsavedBadge}>
                            {pendingCount} unsaved
                        </span>
                    )}
                </div>
            )}


            {/* Placement settings — shown when actively placing */}
            {isPlacing && activeSensor && (
                <div className={styles.placingSettings}>
                    <div className={styles.placingTitle}>
                        Placing: {activeSensor.sensor_name}
                    </div>


                    {/* Mount type */}
                    <div className={styles.settingLabel}>
                        Mount Type
                    </div>
                    <div className={styles.mountTypes}>
                        {MOUNT_TYPES.map(mt => {
                            const active = placementSettings.mount_type === mt;
                            return (
                                <button
                                    key={mt}
                                    className={`${styles.mountButton} ${active ? styles.active : ''}`}
                                    onClick={() => placement.updateSettings({ mount_type: mt })}
                                    title={mt}
                                >
                                    <Icon icon={MOUNT_ICONS[mt] as any} size="xs" />
                                </button>
                            );
                        })}
                    </div>


                    {/* Height slider */}
                    <div className={styles.settingLabel}>
                        Height (z)
                    </div>
                    <div className={styles.sliderWrapper}>
                        <input
                            type="range" min={0} max={1} step={0.01}
                            value={placementSettings.z_val}
                            onChange={e => placement.updateSettings({ z_val: parseFloat(e.target.value) })}
                            className={styles.slider}
                        />
                        <span className={styles.sliderValue}>
                            {placementSettings.z_val.toFixed(2)}
                        </span>
                    </div>
                    {currentFloorHeight && (
                        <div className={styles.settingHelp}>
                            ≈ {(placementSettings.z_val * currentFloorHeight).toFixed(2)}m above floor
                        </div>
                    )}


                    {/* Rotation slider */}
                    <div className={styles.settingLabel}>
                        Rotation
                    </div>
                    <div className={`${styles.sliderWrapper} ${styles.mb10}`}>
                        <input
                            type="range" min={0} max={360} step={1}
                            value={placementSettings.rotation_y}
                            onChange={e => placement.updateSettings({ rotation_y: parseInt(e.target.value) })}
                            className={styles.slider}
                        />
                        <span className={styles.sliderValue}>
                            {placementSettings.rotation_y}°
                        </span>
                    </div>


                    {/* Live preview position */}
                    <div className={styles.previewBox}>
                        <div className={styles.settingLabel}>
                            Live Position
                        </div>
                        {previewPosition ? (
                            <div className={styles.coords}>
                                <span>nx: <span className={styles.coordValue}>{previewPosition.nx.toFixed(3)}</span></span>
                                <span>ny: <span className={styles.coordValue}>{previewPosition.ny.toFixed(3)}</span></span>
                            </div>
                        ) : (
                            <div className={styles.emptyCoords}>
                                Move mouse over the floor…
                            </div>
                        )}
                    </div>


                    <div className={styles.clickHint}>
                        Click on floor to place
                    </div>
                    <button
                        className={styles.cancelPlacingBtn}
                        onClick={placement.cancelPlacing}
                    >
                        <Icon icon="Close" size="xs" /> Cancel Placement
                    </button>
                </div>
            )}


            {/* Sensor list */}
            <div className={styles.scrollArea}>


                {/* Unplaced */}
                {unplaced.length > 0 && (
                    <>
                        <div className={styles.sectionLabel}>Unplaced ({unplaced.length})</div>
                        {unplaced.map(sensor => {
                            const isActive = activeSensor?.id === sensor.id;
                            return (
                                <div key={sensor.id} className={`${styles.sensorRow} ${isActive ? styles.active : ''}`}>
                                    <span className={styles.sensorIcon}><Icon icon="Videocam" size="xs" /></span>
                                    <span className={`${styles.sensorName} ${isActive ? styles.isActive : ''}`}>
                                        {sensor.sensor_name}
                                    </span>
                                    <button
                                        className={`${styles.actionBtn} ${isActive ? styles.active : ''}`}
                                        onClick={() => isActive
                                            ? placement.cancelPlacing()
                                            : placement.startPlacing(sensor)}
                                    >
                                        {isActive ? <><Icon icon="Close" size="xxs" /> Placing…</> : 'Place →'}
                                    </button>
                                </div>
                            );
                        })}
                    </>
                )}


                {/* On this floor */}
                {onThisFloor.length > 0 && (
                    <>
                        <div className={styles.sectionLabel}>This Floor ({onThisFloor.length})</div>
                        {onThisFloor.map(sensor => {
                            const isPending = !!pendingPlacements[sensor.id];
                            const isActive = activeSensor?.id === sensor.id;
                            return (
                                <div key={sensor.id} className={`${styles.sensorRow} ${isActive ? styles.active : (isPending ? styles.pending : '')}`}>
                                    <span className={styles.sensorIcon}>
                                        {isPending ? <Icon icon="Star" size="xs" style={{ color: '#f0c040' }} /> : (sensor.online_status ? <Icon icon="CheckCircle" size="xs" style={{ color: '#22c55e' }} /> : <Icon icon="Error" size="xs" style={{ color: '#ef4444' }} />)}
                                    </span>
                                    <span className={`${styles.sensorName} ${isActive ? styles.isActive : (isPending ? styles.isPending : '')}`}>
                                        {sensor.sensor_name}
                                        {isPending && <span className={styles.pendingDot}>●</span>}
                                    </span>
                                    <button
                                        className={`${styles.actionBtn} ${isActive ? styles.active : ''}`}
                                        onClick={() => isActive
                                            ? placement.cancelPlacing()
                                            : placement.startPlacing(sensor)}
                                    >
                                        {isActive ? <><Icon icon="Close" size="xxs" /> Placing…</> : 'Move'}
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.remove}`}
                                        onClick={() => isPending ? placement.removePlacement(sensor.id) : handleRemove(sensor.id)}
                                        disabled={removingId === sensor.id}
                                        title={isPending ? "Clear unsaved placement" : "Remove placement"}
                                    >
                                        {removingId === sensor.id ? <Icon icon="Schedule" size="xxs" /> : <Icon icon="Close" size="xxs" />}
                                    </button>
                                </div>
                            );
                        })}
                    </>
                )}


                {/* Other floors */}
                {onOtherFloor.length > 0 && (
                    <>
                        <div className={styles.sectionLabel}>Other Floors ({onOtherFloor.length})</div>
                        {onOtherFloor.map(sensor => (
                            <div key={sensor.id} className={`${styles.sensorRow} ${styles.dimmed}`}>
                                <span className={styles.sensorIcon}><Icon icon="Videocam" size="xs" /></span>
                                <span className={styles.sensorName}>
                                    {sensor.sensor_name}
                                </span>
                                <span className={styles.otherFloorInfo}>
                                    Area {sensor.position?.position_area_id}
                                </span>
                            </div>
                        ))}
                    </>
                )}


                {unplaced.length === 0 && onThisFloor.length === 0 && (
                    <div className={styles.noSensors}>
                        No sensors available
                    </div>
                )}
            </div>


            {/* Save / Clear footer */}
            <div className={styles.footer}>
                <button
                    className={`${styles.saveButton} ${pendingCount > 0 ? styles.ready : ''}`}
                    onClick={pendingCount > 0 ? onSaveAll : undefined}
                    disabled={pendingCount === 0}
                >
                    <Icon icon="Save" size="xs" style={{ marginRight: 6 }} /> Save All ({pendingCount})
                </button>
                {pendingCount > 0 && (
                    <button
                        className={styles.clearButton}
                        onClick={placement.clearAllPlacements}
                        title="Clear all pending placements"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};


export default SensorPlacementPanel;


import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SensorNode, CountingLinePosition } from '../../../utils/threeD/types';


interface CountingLine3DProps {
    line: CountingLinePosition;
    sensor: SensorNode;
    floorWidth: number;
    floorDepth: number;
    floorY: number;
    isSelected: boolean;
    isLinesMode: boolean;
    onClick: () => void;
}


export const CountingLine3D: React.FC<CountingLine3DProps> = ({
    line,
    sensor,
    floorWidth,
    floorDepth,
    floorY,
    isSelected,
    isLinesMode,
    onClick,
}) => {
    // ---- Unpositioned line (pulsing locator above sensor) ----
    if (line.line_r_x1 == null || line.line_r_y1 == null) {
        if (!isLinesMode || !sensor.position) return null;


        const sensorWorldX = sensor.position.x_val! * floorWidth - floorWidth / 2;
        const sensorWorldZ = sensor.position.y_val! * floorDepth - floorDepth / 2;


        // Pulse logic inside a separate component or ref using useFrame
        return (
            <UnpositionedLineIndicator
                x={sensorWorldX}
                y={floorY + 0.4}
                z={sensorWorldZ}
                sensorName={sensor.sensor_name}
                onClick={onClick}
            />
        );
    }


    // ---- Positioned line ----
    const wx1 = line.line_r_x1! * floorWidth - floorWidth / 2;
    const wz1 = line.line_r_y1! * floorDepth - floorDepth / 2;
    const wx2 = line.line_r_x2! * floorWidth - floorWidth / 2;
    const wz2 = line.line_r_y2! * floorDepth - floorDepth / 2;


    const cx = (wx1 + wx2) / 2;
    const cz = (wz1 + wz2) / 2;
    const length = Math.sqrt((wx2 - wx1) ** 2 + (wz2 - wz1) ** 2);
    if (length < 0.01) return null;


    const angle = -Math.atan2(wz2 - wz1, wx2 - wx1);
    const height = line.line_r_height ?? 2.0;
    const cy = floorY + height / 2;


    const color = line.line_color || '#ff6b6b';


    return (
        <group position={[cx, cy, cz]} rotation={[0, angle, 0]}>
            <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <boxGeometry args={[length, height, 0.04]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={isSelected ? 0.85 : 0.55}
                    emissive={color}
                    emissiveIntensity={isSelected ? 0.6 : 0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>


            {/* Display-only handles for selected state */}
            {isSelected && (
                <>
                    <mesh position={[-length / 2, 0, 0]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
                    </mesh>
                    <mesh position={[length / 2, 0, 0]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
                    </mesh>
                </>
            )}


            {/* Tooltip when selected */}
            {isSelected && (
                <Html position={[0, height / 2 + 0.3, 0]} center>
                    <div style={{
                        background: 'rgba(10,16,28,0.92)',
                        border: `1px solid ${color}44`,
                        borderRadius: 6, padding: '4px 8px',
                        fontSize: 9, color: 'white', whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                    }}>
                        <div style={{ color: color, fontWeight: 700 }}>
                            {sensor.sensor_name}
                        </div>
                        {(line.areas_following_direction_names ?? []).length > 0 && (
                            <div>→ {(line.areas_following_direction_names ?? []).join(', ')}</div>
                        )}
                        {(line.areas_opposite_direction_names ?? []).length > 0 && (
                            <div>← {(line.areas_opposite_direction_names ?? []).join(', ')}</div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
};


// ── Pulse Indicator for unpositioned lines ────────────────────────────────
const UnpositionedLineIndicator: React.FC<{
    x: number; y: number; z: number;
    sensorName: string;
    onClick: () => void;
}> = ({ x, y, z, sensorName, onClick }) => {
    const matRef = React.useRef<THREE.MeshStandardMaterial>(null);


    useFrame(({ clock }) => {
        if (!matRef.current) return;
        const pulse = 0.5 + Math.abs(Math.sin(clock.getElapsedTime() * 3)) * 0.5;
        matRef.current.emissiveIntensity = pulse;
    });


    return (
        <group position={[x, y, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <mesh>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial
                    ref={matRef}
                    color="#f4a261"
                    emissive="#f4a261"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <Html position={[0, 0.3, 0]} center>
                <div style={{
                    background: 'rgba(244,162,97,0.15)',
                    border: '1px solid rgba(244,162,97,0.4)',
                    borderRadius: 4, padding: '2px 6px',
                    fontSize: 9, color: '#f4a261', whiteSpace: 'nowrap',
                }}>
                    {sensorName} · line unset
                </div>
            </Html>
        </group>
    );
};


import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { SensorNode, CountingLinePosition } from '../../../utils/threeD/types';


interface CountingLineHandleProps {
    line: CountingLinePosition;
    sensor: SensorNode;
    floorWidth: number;
    floorDepth: number;
    floorY: number;
    onDragEnd: (endpoint: 'start' | 'end', nx: number, ny: number) => void;
}


export const CountingLineHandle: React.FC<CountingLineHandleProps> = ({
    line, floorWidth, floorDepth, floorY, onDragEnd
}) => {
    const isDragging = useRef(false);
    const activeEndpoint = useRef<'start' | 'end' | null>(null);


    const wy = floorY + (line.line_r_height ?? 2.0) / 2;


    const dragPlane = useMemo(
        () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -(wy)),
        [wy]
    );


    const handlePointerDown = (endpoint: 'start' | 'end') => (e: any) => {
        e.stopPropagation();
        isDragging.current = true;
        activeEndpoint.current = endpoint;
        (e.target as any).setPointerCapture?.(e.pointerId);
        document.body.style.cursor = 'grabbing';
    };


    const handlePointerMove = (e: any) => {
        if (!isDragging.current || !activeEndpoint.current) return;
        e.stopPropagation();


        // Visual feedback during drag can be added here if we lift state
        // Currently it snaps at the end of drag like BezierHandle unless we lift state.
        // For Counting Lines, snapping at the end is fine for now according to instructions.
    };


    const handlePointerUp = (e: any) => {
        if (!isDragging.current || !activeEndpoint.current) return;
        e.stopPropagation();
        isDragging.current = false;
        document.body.style.cursor = 'grab';


        const target = new THREE.Vector3();
        e.ray.intersectPlane(dragPlane, target);
        if (target) {
            const nx = (target.x + floorWidth / 2) / floorWidth;
            const ny = (target.z + floorDepth / 2) / floorDepth;
            const clampedX = Math.max(0, Math.min(1, nx));
            const clampedY = Math.max(0, Math.min(1, ny));
            onDragEnd(activeEndpoint.current, clampedX, clampedY);
        }
        activeEndpoint.current = null;
    };


    if (line.line_r_x1 == null || line.line_r_y1 == null) return null;


    const wx1 = line.line_r_x1 * floorWidth - floorWidth / 2;
    const wz1 = line.line_r_y1 * floorDepth - floorDepth / 2;
    const wx2 = line.line_r_x2! * floorWidth - floorWidth / 2;
    const wz2 = line.line_r_y2! * floorDepth - floorDepth / 2;


    return (
        <group>
            {/* Start Handle */}
            <mesh
                position={[wx1, wy, wz1]}
                onPointerDown={handlePointerDown('start')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOver={() => { document.body.style.cursor = 'grab'; }}
                onPointerOut={() => { document.body.style.cursor = ''; }}
            >
                <sphereGeometry args={[0.25, 14, 14]} />
                <meshStandardMaterial color="#48cae4" emissive="#48cae4" emissiveIntensity={0.8} />
            </mesh>


            {/* End Handle */}
            <mesh
                position={[wx2, wy, wz2]}
                onPointerDown={handlePointerDown('end')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOver={() => { document.body.style.cursor = 'grab'; }}
                onPointerOut={() => { document.body.style.cursor = ''; }}
            >
                <sphereGeometry args={[0.25, 14, 14]} />
                <meshStandardMaterial color="#48cae4" emissive="#48cae4" emissiveIntensity={0.8} />
            </mesh>
        </group>
    );
};


import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SensorNode, CountingLinePosition } from '../../../utils/threeD/types';


interface SensorBeam3DProps {
    line: CountingLinePosition;
    sensor: SensorNode;
    floorWidth: number;
    floorDepth: number;
    floorHeight: number;      // Actual floor height in meters
    floorY: number;           // top of floor slab Y
    isSelected: boolean;
    isLinesMode: boolean;
    onClick: () => void;
}


// Mount height defaults when z_val is 0
const MOUNT_HEIGHT: Record<string, number> = {
    ceiling: 2.8,
    wall: 1.8,
    pole: 2.2,
    floor: 0.1,
};


const DoorFrame: React.FC<{
    x: number; y: number; z: number;
    baseY: number;
    rotationY: number;
    width: number;
    color: string;
}> = ({ x, y, z, baseY, rotationY, width, color }) => {
    const frameHeight = y - baseY;
    const barWidth = width;
    const barThickness = 0.08;
    const barDepth = 0.12;


    return (
        <group position={[x, baseY, z]} rotation={[0, rotationY, 0]}>
            {/* Horizontal top bar — where sensor is mounted */}
            <mesh position={[0, frameHeight + barThickness / 2, 0]}>
                <boxGeometry args={[barWidth, barThickness, barDepth]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    metalness={0.9}
                    roughness={0.1}
                    emissive="#000000"
                    side={THREE.DoubleSide}
                />
            </mesh>


            {/* Side Pillars */}
            <mesh position={[-barWidth / 2, frameHeight / 2, 0]}>
                <boxGeometry args={[0.08, frameHeight, 0.1]} />
                <meshStandardMaterial color="#111" metalness={0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[barWidth / 2, frameHeight / 2, 0]}>
                <boxGeometry args={[0.08, frameHeight, 0.1]} />
                <meshStandardMaterial color="#111" metalness={0.8} side={THREE.DoubleSide} />
            </mesh>


            {/* Stylized Glass Sliding Panels (transparent + slight tint) */}
            <mesh position={[-barWidth / 4 - 0.05, (frameHeight - barThickness) / 2, -0.02]}>
                <boxGeometry args={[barWidth / 2 - 0.1, frameHeight - barThickness, 0.015]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.08}
                    metalness={0.2}
                    roughness={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
            <mesh position={[barWidth / 4 + 0.05, (frameHeight - barThickness) / 2, 0.02]}>
                <boxGeometry args={[barWidth / 2 - 0.1, frameHeight - barThickness, 0.015]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.08}
                    metalness={0.2}
                    roughness={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
};


export const SensorBeam3D: React.FC<SensorBeam3DProps> = ({
    line, sensor, floorWidth, floorDepth, floorHeight, floorY,
    isSelected, isLinesMode, onClick,
}) => {


    // ── Sensor world position ──────────────────────────────────────────
    const mountType = sensor.position?.mount_type ?? 'wall';


    // Sensor height: use z_val (normalized 0-1) scaled by floor height
    const sensorY = floorY + (
        (sensor.position?.z_val ?? 0) > 0
            ? (sensor.position!.z_val! * floorHeight)
            : MOUNT_HEIGHT[mountType] ?? 2.0
    );


    const sensorWorldX = (sensor.position?.x_val ?? 0) * floorWidth
        - floorWidth / 2;
    const sensorWorldZ = (sensor.position?.y_val ?? 0) * floorDepth
        - floorDepth / 2;


    // ── Positioned logic (Beam/Plane) ─────────────────────────────────
    const isPositioned = line.line_r_x1 != null;
    const lx1 = isPositioned ? line.line_r_x1! * floorWidth - floorWidth / 2 : 0;
    const lz1 = isPositioned ? line.line_r_y1! * floorDepth - floorDepth / 2 : 0;
    const lx2 = isPositioned ? line.line_r_x2! * floorWidth - floorWidth / 2 : 0;
    const lz2 = isPositioned ? line.line_r_y2! * floorDepth - floorDepth / 2 : 0;
    const lineFloorY = floorY + 0.01;
    const lineTopY = floorY + (line.line_r_height ?? 0.3);


    const color = line.line_color || '#ff6b6b';


    const apexX = sensorWorldX;
    const apexZ = sensorWorldZ;
    const apexY = sensorY;


    // Door width: match line if positioned, else default stylish 1.6m
    const doorWidth = isPositioned
        ? Math.sqrt((lx2 - lx1) ** 2 + (lz2 - lz1) ** 2)
        : 1.6;


    const rotationY = ((sensor.position?.rotation_y ?? 0) * Math.PI) / 180;
    const beamApexY = apexY - 0.07;


    // Line rotation angle (along the tripwire)
    const lineAngle = isPositioned ? -Math.atan2(lz2 - lz1, lx2 - lx1) : rotationY;


    return (
        <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {/* Pulsing indicator for unpositioned sensors in lines mode */}
            {!isPositioned && isLinesMode && sensor.position && (
                <UnpositionedIndicator
                    x={sensorWorldX}
                    y={sensorY}
                    z={sensorWorldZ}
                    sensorName={sensor.sensor_name}
                    onClick={onClick}
                />
            )}


            {/* Realistic Door Frame context */}
            {sensor.position && (
                <DoorFrame
                    x={apexX}
                    y={apexY}
                    z={apexZ}
                    baseY={floorY}
                    rotationY={lineAngle}
                    width={doorWidth}
                    color={color}
                />
            )}


            {/* Sensor body (mounted on top bar of the door) */}
            {sensor.position && (
                <SensorBody
                    x={apexX}
                    y={apexY + 0.04} // mount on top of door bar
                    z={apexZ}
                    rotationY={lineAngle}
                    color={color}
                    isSelected={isSelected}
                />
            )}


            {/* Beam and Plane (Only if line is positioned) */}
            {isPositioned && (
                <>
                    <BeamPyramid
                        apex={[apexX, beamApexY, apexZ]}
                        lineStart={[lx1, lineFloorY, lz1]}
                        lineEnd={[lx2, lineFloorY, lz2]}
                        lineTopStart={[lx1, lineTopY, lz1]}
                        lineTopEnd={[lx2, lineTopY, lz2]}
                        color={color}
                        isSelected={isSelected}
                        mountType={mountType}
                        lineFloorY={lineFloorY}
                        lx1={lx1} lz1={lz1} lx2={lx2} lz2={lz2}
                    />


                    <CountingLinePlane
                        x1={lx1} z1={lz1}
                        x2={lx2} z2={lz2}
                        floorY={lineFloorY}
                        height={line.line_r_height ?? 0.3}
                        color={color}
                        isSelected={isSelected}
                    />
                </>
            )}


            {/* ── Tooltip when selected ── */}
            {isSelected && (
                <Html
                    position={[apexX, apexY + 0.35, apexZ]}
                    center
                >
                    <div style={{
                        background: 'rgba(10,16,28,0.93)',
                        border: `1px solid ${color}55`,
                        borderRadius: 7, padding: '5px 10px',
                        fontSize: 10, color: 'white',
                        whiteSpace: 'nowrap', pointerEvents: 'none',
                        boxShadow: `0 0 12px ${color}33`,
                    }}>
                        <div style={{
                            color, fontWeight: 700, marginBottom: 2
                        }}>
                            📡 {sensor.sensor_name}
                        </div>
                        <div style={{
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: 9, marginBottom: 3
                        }}>
                            {/* Mounted on counting line · {apexY.toFixed(1)}m high */}
                        </div>
                        {(line.areas_following_direction_names ?? []).length > 0 && (
                            <div style={{ color: '#52b788', fontSize: 9 }}>
                                → IN: {line.areas_following_direction_names?.join(', ')}
                            </div>
                        )}
                        {(line.areas_opposite_direction_names ?? []).length > 0 && (
                            <div style={{ color: '#e63946', fontSize: 9 }}>
                                ← OUT: {line.areas_opposite_direction_names?.join(', ')}
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
};


const SensorBody: React.FC<{
    x: number; y: number; z: number;
    rotationY: number;
    color: string;
    isSelected: boolean;
}> = ({ x, y, z, rotationY, color, isSelected }) => {


    return (
        <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
            {/* Main sensor body — wider than tall */}
            <mesh>
                <boxGeometry args={[0.3, 0.08, 0.15]} />
                <meshStandardMaterial
                    color="#1a1a2e"
                    metalness={0.85}
                    roughness={0.25}
                    emissive="#111122"
                />
            </mesh>


            {/* Lens — faces downward (toward floor) */}
            <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.045, 0.03, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isSelected ? 1.2 : 0.5}
                    metalness={0.6}
                />
            </mesh>


            {/* Lens glass */}
            <mesh position={[0, -0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.01, 16]} />
                <meshStandardMaterial
                    color="#88ccff"
                    emissive="#4488ff"
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.8}
                />
            </mesh>


            {/* Status LED dot — green if online */}
            <mesh position={[0.12, 0.02, 0]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial
                    color="#52b788"
                    emissive="#52b788"
                    emissiveIntensity={0.9}
                />
            </mesh>


            {/* Mount bracket — small box on top connecting to door frame */}
            <mesh position={[0, 0.07, 0]}>
                <boxGeometry args={[0.08, 0.06, 0.08]} />
                <meshStandardMaterial color="#2a2a3e" metalness={0.9} />
            </mesh>
        </group>
    );
};


const BeamPyramid: React.FC<{
    apex: [number, number, number];
    lineStart: [number, number, number];
    lineEnd: [number, number, number];
    lineTopStart: [number, number, number];
    lineTopEnd: [number, number, number];
    color: string;
    isSelected: boolean;
    mountType: string;
    lineFloorY: number;
    lx1: number; lz1: number; lx2: number; lz2: number;
}> = ({ apex, lineStart, lineEnd, lineTopStart, lineTopEnd,
    color, isSelected, lineFloorY, lx1, lz1, lx2, lz2 }) => {


        const outerGeometry = useMemo(() => {
            const geo = new THREE.BufferGeometry();
            const [ax, ay, az] = apex;
            const bl = lineStart; const br = lineEnd;
            const tr = lineTopEnd; const tl = lineTopStart;


            const vertices = new Float32Array([
                ax, ay, az, bl[0], bl[1], bl[2], br[0], br[1], br[2],
                ax, ay, az, br[0], br[1], br[2], tr[0], tr[1], tr[2],
                ax, ay, az, tr[0], tr[1], tr[2], tl[0], tl[1], tl[2],
                ax, ay, az, tl[0], tl[1], tl[2], bl[0], bl[1], bl[2],
            ]);


            geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            return geo;
        }, [apex, lineStart, lineEnd, lineTopStart, lineTopEnd]);


        const innerGeometry = useMemo(() => {
            const geo = new THREE.BufferGeometry();
            const s = 0.85; // scale factor toward center
            const cx = (lineStart[0] + lineEnd[0]) / 2;
            const cz = (lineStart[2] + lineEnd[2]) / 2;


            const shrink = (p: number[], axis: 'x' | 'z') => {
                if (axis === 'x') return cx + (p[0] - cx) * s;
                return cz + (p[2] - cz) * s;
            };


            const bl = lineStart; const br = lineEnd;
            const tr = lineTopEnd; const tl = lineTopStart;
            const [ax, ay, az] = apex;


            const vertices = new Float32Array([
                ax, ay, az, shrink(bl, 'x'), bl[1], shrink(bl, 'z'), shrink(br, 'x'), br[1], shrink(br, 'z'),
                ax, ay, az, shrink(br, 'x'), br[1], shrink(br, 'z'), shrink(tr, 'x'), tr[1], shrink(tr, 'z'),
                ax, ay, az, shrink(tr, 'x'), tr[1], shrink(tr, 'z'), shrink(tl, 'x'), tl[1], shrink(tl, 'z'),
                ax, ay, az, shrink(tl, 'x'), tl[1], shrink(tl, 'z'), shrink(bl, 'x'), bl[1], shrink(bl, 'z'),
            ]);


            geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            return geo;
        }, [apex, lineStart, lineEnd, lineTopStart, lineTopEnd]);


        const threeColor = useMemo(() => new THREE.Color(color), [color]);


        // Footprint
        const footprintCX = (lx1 + lx2) / 2;
        const footprintCZ = (lz1 + lz2) / 2;
        const footprintLength = Math.sqrt((lx2 - lx1) ** 2 + (lz2 - lz1) ** 2);
        const footprintAngle = -Math.atan2(lz2 - lz1, lx2 - lx1);
        const spread = (apex[1] - lineFloorY) * 0.3;


        // Center glow axis
        const lineCenterFloorX = (lineStart[0] + lineEnd[0]) / 2;
        const lineCenterFloorZ = (lineStart[2] + lineEnd[2]) / 2;
        const beamCenterLength = apex[1] - lineStart[1];
        const beamCenterY = (apex[1] + lineStart[1]) / 2;


        return (
            <group renderOrder={10}>
                {/* Transparent outer pyramid */}
                <mesh geometry={outerGeometry} renderOrder={10}>
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={isSelected ? 0.22 : 0.10}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>


                {/* Transparent inner pyramid for depth */}
                <mesh geometry={innerGeometry} renderOrder={11}>
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={isSelected ? 0.30 : 0.14}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>


                {/* Center glow axis removed per user request */}


                {/* Floor footprint */}
                <mesh
                    position={[footprintCX, lineFloorY + 0.01, footprintCZ]}
                    rotation={[-Math.PI / 2, 0, footprintAngle]}
                    renderOrder={10}
                >
                    <planeGeometry args={[footprintLength, spread]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={isSelected ? 0.20 : 0.08}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>


            </group>
        );
    };


const CountingLinePlane: React.FC<{
    x1: number; z1: number;
    x2: number; z2: number;
    floorY: number;
    height: number;
    color: string;
    isSelected: boolean;
}> = ({ x1, z1, x2, z2, floorY, height, color, isSelected }) => {


    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    if (length < 0.01) return null;


    const angle = -Math.atan2(z2 - z1, x2 - x1);
    const cy = floorY + height / 2;


    return (
        <group position={[cx, cy, cz]} rotation={[0, angle, 0]}>
            <mesh>
                <boxGeometry args={[length, height, 0.03]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={isSelected ? 0.75 : 0.45}
                    emissive={color}
                    emissiveIntensity={isSelected ? 0.5 : 0.15}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>


        </group>
    );
};


const UnpositionedIndicator: React.FC<{
    x: number; y: number; z: number;
    sensorName: string;
    onClick: () => void;
}> = ({ x, y, z, sensorName, onClick }) => {
    const matRef = React.useRef<THREE.MeshStandardMaterial>(null);


    useFrame(({ clock }) => {
        if (!matRef.current) return;
        matRef.current.emissiveIntensity =
            0.4 + Math.abs(Math.sin(clock.getElapsedTime() * 2.5)) * 0.6;
    });


    return (
        <group position={[x, y, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <mesh>
                <sphereGeometry args={[0.15, 10, 10]} />
                <meshStandardMaterial
                    ref={matRef}
                    color="#f4a261"
                    emissive="#f4a261"
                    emissiveIntensity={0.8}
                    transparent opacity={0.9}
                />
            </mesh>
            <Html position={[0, 0.3, 0]} center>
                <div style={{
                    background: 'rgba(244,162,97,0.15)',
                    border: '1px solid rgba(244,162,97,0.4)',
                    borderRadius: 4, padding: '2px 6px',
                    fontSize: 9, color: '#f4a261',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                }}>
                    {sensorName} · line unset
                </div>
            </Html>
        </group>
    );
};


import useDarkMode from '../../../hooks/useDarkMode';
import type { UseWallDrawingReturn } from '../../../hooks/useWallDrawing';
import type { AreaNode } from '../../../utils/threeD/types';
import { useThreeDTheme } from '../../../utils/threeD/theme';
import Icon from '../../icon/Icon';
import styles from '../../../styles/threeD/WallDrawerPanel.module.scss';


interface WallDrawerPanelProps {
    drawing: UseWallDrawingReturn;
    onSaveAll: () => void;
    subAreas: AreaNode[];
}


const WallDrawerPanel: React.FC<WallDrawerPanelProps> = ({ drawing, onSaveAll, subAreas }) => {
    const {
        isDrawing,
        isShapeClosed,
        drawingMode,
        setDrawingMode,
        anchorPoints,
        points,
        previewPoint,
        arcPreviewWall,
        drawnWalls,
        settings,
        finishDrawing,
        cancelDrawing,
        removeWall,
        clearAllWalls,
        updateSettings,
        targetAreaId,
        setTargetAreaId,
    } = drawing;


    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);


    if (!isDrawing) return null;


    const themeVars = {
        '--panel-bg': t.panelBg,
        '--panel-border': t.panelBorder,
        '--header-bg': t.headerBg,
        '--header-border': t.headerBorder,
        '--text-primary': t.textPrimary,
        '--text-secondary': t.textSecondary,
        '--text-muted': t.textMuted,
        '--input-bg': t.inputBg,
        '--input-border': t.inputBorder,
        '--badge-bg': t.badgeBg,
    } as React.CSSProperties;


    return (
        <div className={styles.panel} style={themeVars}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Icon icon="Edit" size="sm" />
                </div>
                <span className={styles.title}>Divide Areas</span>
                <button
                    onClick={cancelDrawing}
                    className={styles.closeButton}
                    title="Cancel Drawing"
                >✕</button>
            </div>


            {/* Scrollable body */}
            <div className={styles.body}>


                {isShapeClosed && (
                    <div className={styles.successIndicator}>
                        <div className={styles.successTitle}>
                            ✅ Shape closed — {drawnWalls.length} walls ready
                        </div>
                        <div className={styles.successHelp}>
                            Save to commit or Clear to discard
                        </div>
                    </div>
                )}


                {!isShapeClosed && (
                    <>
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>Shape Mode</div>
                            <div className={styles.modeToggle}>
                                {(['straight', 'arc'] as const).map((mode) => {
                                    const active = drawingMode === mode;
                                    return (
                                        <button
                                            key={mode}
                                            onClick={() => setDrawingMode(mode)}
                                            className={`${styles.modeButton} ${active ? styles.active : ''}`}
                                        >
                                            {mode === 'straight' ? '━ Straight' : '〜 Arc'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        {/* Settings */}
                        <div className={styles.settingsSection}>
                            <div className={styles.sectionTitle}>Settings</div>


                            <div className={styles.settingsList}>
                                <label className={styles.settingRow}>
                                    <span className={styles.settingLabel}>Type</span>
                                    <select
                                        value={settings.wall_type}
                                        onChange={e => updateSettings({ wall_type: e.target.value as any })}
                                        className={styles.input}
                                    >
                                        <option value="outer">Outer</option>
                                        <option value="partition">Partition</option>
                                        <option value="glass">Glass</option>
                                    </select>
                                </label>


                                <label className={styles.settingRow}>
                                    <span className={styles.settingLabelHighlight}>Assign to Area</span>
                                    <select
                                        value={targetAreaId ?? ''}
                                        onChange={e => setTargetAreaId(e.target.value ? parseInt(e.target.value) : null)}
                                        className={styles.inputHighlight}
                                    >
                                        <option value="">-- No Area --</option>
                                        {subAreas.map(area => (
                                            <option key={area.id} value={area.id}>{area.name}</option>
                                        ))}
                                    </select>
                                </label>


                                <label className={styles.settingRow}>
                                    <span className={styles.settingLabel}>Height (m)</span>
                                    <input
                                        type="number" step="0.1" min="0.1"
                                        value={settings.height}
                                        onChange={e => updateSettings({ height: parseFloat(e.target.value) || 0 })}
                                        className={styles.inputSmall}
                                    />
                                </label>


                                <label className={styles.settingRow}>
                                    <span className={styles.settingLabel}>Thickness (m)</span>
                                    <input
                                        type="number" step="0.05" min="0.05"
                                        value={settings.thickness}
                                        onChange={e => updateSettings({ thickness: parseFloat(e.target.value) || 0 })}
                                        className={styles.inputSmall}
                                    />
                                </label>


                                <label className={styles.settingRow}>
                                    <span className={styles.settingLabel}>Color / Opacity</span>
                                    <div className={styles.colorPickerGroup}>
                                        <input
                                            type="color"
                                            value={settings.color}
                                            onChange={e => updateSettings({ color: e.target.value })}
                                            className={styles.colorPicker}
                                        />
                                        <input
                                            type="range" min="0" max="1" step="0.05"
                                            value={settings.opacity}
                                            onChange={e => updateSettings({ opacity: parseFloat(e.target.value) })}
                                            className={styles.opacitySlider}
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>


                        {/* Anchor Chain Status */}
                        <div className={styles.anchorSection}>
                            <div className={styles.sectionTitle}>Anchor Chain{anchorPoints.length > 0 ? ` (${anchorPoints.length})` : ''}</div>
                            <div className={styles.settingsList}>
                                {anchorPoints.length === 0 && points.length === 0 && !arcPreviewWall && (
                                    <span className={styles.anchorHelp}>
                                        {drawingMode === 'straight'
                                            ? 'Click to place first point. Double-click to close.'
                                            : 'Click 3 points: start → end → on-arc. Switch mode anytime.'}
                                    </span>
                                )}
                                {anchorPoints.length > 0 && (
                                    <div className={styles.anchorRow}>
                                        <span className={styles.anchorLabel}>Last anchor</span>
                                        <span className={styles.anchorValue}>
                                            {anchorPoints[anchorPoints.length - 1].nx.toFixed(2)}, {anchorPoints[anchorPoints.length - 1].ny.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {drawingMode === 'arc' && points.length > 0 && points.length < 3 && (
                                    <span className={styles.anchorHighlight}>
                                        {points.length === 1 ? 'Click endpoint of arc…' : 'Move cursor to preview — click to confirm arc.'}
                                    </span>
                                )}
                                {previewPoint && anchorPoints.length > 0 && drawingMode === 'straight' && (
                                    <div className={styles.previewRow}>
                                        <span className={styles.previewLabel}>Preview →</span>
                                        <span className={styles.previewValue}>
                                            {previewPoint.nx.toFixed(2)}, {previewPoint.ny.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>


            {/* Footer actions */}
            <div className={styles.footer}>
                <div className={styles.buttonRow}>
                    <button
                        onClick={() => { if (drawnWalls.length > 0) removeWall(drawnWalls[drawnWalls.length - 1].id as number); }}
                        disabled={drawnWalls.length === 0}
                        className={styles.undoButton}
                    >Undo Last</button>
                    <button
                        onClick={clearAllWalls}
                        disabled={drawnWalls.length === 0}
                        className={styles.clearButton}
                    >Clear All</button>
                </div>
                {/* Close Shape button — hidden during isShapeClosed */}
                {!isShapeClosed && (
                    <button
                        onClick={finishDrawing}
                        disabled={anchorPoints.length < 3}
                        className={styles.closeButtonAction}
                        title={anchorPoints.length >= 3 ? 'Close the polygon with a final wall' : 'Need at least 3 anchor points'}
                    >⬡ Close Shape{anchorPoints.length >= 3 ? ` (${anchorPoints.length} pts)` : ''}</button>
                )}
                <button
                    onClick={() => { onSaveAll(); }}
                    disabled={drawnWalls.length === 0}
                    className={styles.saveButton}
                >💾 Save All Walls</button>
            </div>
        </div>
    );
};


export default WallDrawerPanel;


import React, { useState, useEffect } from 'react';
import Icon from '../../icon/Icon';
import { AreaWall } from '../../../utils/threeD/types';
import useDarkMode from '../../../hooks/useDarkMode';
import { useThreeDTheme } from '../../../utils/threeD/theme';
import styles from '../../../styles/threeD/WallEditPanel.module.scss';


interface WallEditPanelProps {
    wall: AreaWall;
    onClose: () => void;
    onUpdate: (updated: AreaWall) => void;
    onSave: (wall: AreaWall) => Promise<void>;
    onDelete?: (wallId: number) => void;
    embed?: boolean;
}


const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className={styles.row}>
        <span className={styles.rowLabel}>{label}</span>
        {children}
    </label>
);


const WallEditPanel: React.FC<WallEditPanelProps> = ({ wall, onClose, onUpdate, onSave, onDelete, embed }) => {
    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);


    const [local, setLocal] = useState<AreaWall>({ ...wall });
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);


    // Re-sync if the external wall changes (e.g. bezier drag updates ctrl_x/y)
    useEffect(() => { setLocal(prev => ({ ...prev, ...wall })); }, [
        wall.ctrl_x, wall.ctrl_y, wall.wall_shape,
    ]);


    const update = (patch: Partial<AreaWall>) => {
        const next = { ...local, ...patch };
        setLocal(next);
        onUpdate(next);
    };


    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const mergedWall: AreaWall = {
                ...wall,
                ...local,
                // Ensure bezier control point is included if shape is bezier
                wall_shape: local.wall_shape ?? wall.wall_shape ?? 'straight',
                ctrl_x: local.ctrl_x ?? wall.ctrl_x ?? null,
                ctrl_y: local.ctrl_y ?? wall.ctrl_y ?? null,
            };
            await onSave(mergedWall);
        } catch (err: any) {
            setSaveError(err?.response?.data?.detail ?? err.message ?? 'Save failed');
            setIsSaving(false);
        }
    };


    const shapeColor: Record<string, string> = {
        straight: 'rgba(255,255,255,0.45)',
        arc: '#48cae4',
        bezier: '#f0c040',
    };
    const shape = local.wall_shape ?? 'straight';


    const themeVars = {
        '--panel-bg': t.panelBg,
        '--panel-border': t.panelBorder,
        '--panel-shadow': t.panelShadow,
        '--text-primary': t.textPrimary,
        '--text-secondary': t.textSecondary,
        '--text-muted': t.textMuted,
        '--header-border': t.headerBorder,
        '--input-bg': t.inputBg,
        '--input-border': t.inputBorder,
        '--badge-bg': t.badgeBg,
        '--accent-blue': dark ? '#48cae4' : '#0077b6',
        '--accent-orange': dark ? '#f0c040' : '#d97706',
        '--error-bg': t.errorBackground,
        '--error-border': t.errorBorder,
        '--save-btn-bg': isSaving ? `${dark ? '#48cae4' : '#0077b6'}10` : `${dark ? '#48cae4' : '#0077b6'}26`,
        '--save-btn-border': `${dark ? '#48cae4' : '#0077b6'}80`,
        '--save-btn-disabled-bg': `${dark ? '#48cae4' : '#0077b6'}10`,
        '--save-btn-disabled-text': `${dark ? '#48cae4' : '#0077b6'}80`,
    } as React.CSSProperties;


    return (
        <div
            className={`${styles.panel} ${embed ? styles.embedded : ''}`}
            style={themeVars}
        >
            {/* Header */}
            {!embed && (
                <div className={styles.header}>
                    <span className={styles.headerTitle}>
                        <span className={styles.editIcon}><Icon icon="Edit" size="xs" /></span> Edit Wall
                        <span className={styles.wallId}>&nbsp;#{wall.id}</span>
                    </span>
                    <button
                        onClick={onClose}
                        className={styles.closeBtn}
                        title="Close"
                    ><Icon icon="Close" size="xs" /></button>
                </div>
            )}


            {/* Body */}
            <div className={styles.body}>


                {/* Shape (read-only badge) */}
                <div className={styles.section}>
                    <div className={styles.label}>Shape</div>
                    <span
                        className={styles.badge}
                        style={{
                            border: `1px solid ${shapeColor[shape] ?? t.inputBorder}`,
                            color: shapeColor[shape] ?? t.textSecondary,
                        }}
                    >{shape}</span>
                </div>


                {/* Editable properties */}
                <div className={`${styles.section} ${styles.properties}`}>
                    <div className={styles.label}>Properties</div>


                    <Row label="Type">
                        <select
                            value={local.wall_type}
                            onChange={e => update({ wall_type: e.target.value as any })}
                            className={styles.input}
                        >
                            <option value="outer">Outer</option>
                            <option value="partition">Partition</option>
                            <option value="glass">Glass</option>
                        </select>
                    </Row>


                    <Row label="Height (m)">
                        <input
                            type="number" step="0.1" min="0.1"
                            value={local.r_height}
                            onChange={e => update({ r_height: parseFloat(e.target.value) || 0 })}
                            className={styles.input}
                        />
                    </Row>


                    <Row label="Thickness (m)">
                        <input
                            type="number" step="0.05" min="0.05"
                            value={local.thickness}
                            onChange={e => update({ thickness: parseFloat(e.target.value) || 0 })}
                            className={styles.input}
                        />
                    </Row>


                    <Row label="Z Offset (m)">
                        <input
                            type="number" step="0.1" min="0"
                            value={local.r_z_offset}
                            onChange={e => update({ r_z_offset: parseFloat(e.target.value) || 0 })}
                            className={styles.input}
                        />
                    </Row>


                    <Row label="Color">
                        <div className={styles.colorPickerRow}>
                            <input
                                type="color" value={local.color}
                                onChange={e => update({ color: e.target.value })}
                                className={styles.colorInput}
                            />
                            <span className={styles.colorText}>{local.color}</span>
                        </div>
                    </Row>


                    <Row label="Opacity">
                        <div className={styles.sliderRow}>
                            <input
                                type="range" min="0" max="1" step="0.05"
                                value={local.opacity}
                                onChange={e => update({ opacity: parseFloat(e.target.value) })}
                                className={styles.slider}
                            />
                            <span className={styles.sliderValue}>
                                {local.opacity.toFixed(2)}
                            </span>
                        </div>
                    </Row>
                </div>


                {/* Bezier control point (read-only — set by dragging) */}
                {shape === 'bezier' && (
                    <div className={styles.section}>
                        <div className={styles.label}>
                            Bezier Control Point <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.6 }}>(drag in scene)</span>
                        </div>
                        <div className={styles.bezierPointContainer}>
                            <div className={styles.bezierPoint}>
                                <span className={`${styles.label} ${styles.mini}`}>ctrl_x</span>
                                <span className={styles.readonly}>{(local.ctrl_x ?? 0).toFixed(3)}</span>
                            </div>
                            <div className={styles.bezierPoint}>
                                <span className={`${styles.label} ${styles.mini}`}>ctrl_y</span>
                                <span className={styles.readonly}>{(local.ctrl_y ?? 0).toFixed(3)}</span>
                            </div>
                        </div>
                    </div>
                )}


                {/* Endpoints */}
                <div className={`${styles.section} ${styles.noBorder}`}>
                    <div className={styles.label}>Endpoints (normalized)</div>
                    <div className={styles.grid}>
                        {([['r_x1', 'x₁'], ['r_y1', 'y₁'], ['r_x2', 'x₂'], ['r_y2', 'y₂']] as const).map(([key, label]) => (
                            <div key={key} className={styles.bezierPoint}>
                                <span className={`${styles.label} ${styles.mini}`}>{label}</span>
                                <span className={styles.readonly}>{(local[key as keyof AreaWall] as number ?? 0).toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Error Display */}
            {saveError && (
                <div className={styles.errorDisplay} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon icon="Warning" size="xxs" /> {saveError}
                </div>
            )}


            {/* Footer */}
            <div className={`${styles.footer} ${embed ? styles.embedded : ''}`}>
                <button
                    onClick={onClose}
                    disabled={isSaving}
                    className={styles.cancelBtn}
                >Cancel</button>
                <button
                    onClick={() => onDelete?.(wall.id as number)}
                    disabled={isSaving}
                    className={styles.deleteBtn}
                    title="Delete this wall"
                ><Icon icon="Delete" size="xs" /></button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={styles.saveBtn}
                >{isSaving ? 'Saving...' : <><Icon icon="Save" size="xs" style={{ marginRight: 6 }} /> Save Wall</>}</button>
            </div>
        </div>
    );
};


export default WallEditPanel;


import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AreaWall, WallType } from '../../../utils/threeD/types';


// ------------------------------------
// Wall material config by wall_type
// ------------------------------------
const WALL_CONFIG: Record<WallType, { roughness: number; metalness: number; depthWrite: boolean }> = {
    outer: { roughness: 0.7, metalness: 0.1, depthWrite: true },
    partition: { roughness: 0.6, metalness: 0.05, depthWrite: true },
    glass: { roughness: 0.05, metalness: 0.1, depthWrite: false },
};


interface WallSegmentProps {
    wall: AreaWall;
    floorWidth: number;   // real metres — for denormalization
    floorDepth: number;
    floorY: number;       // Three.js Y position of the floor (offset_z)
    isSelected: boolean;
    isHovered: boolean;
    isPreview?: boolean;  // Gold pulsing style for walls drawn this session
    onClick: (wall: AreaWall) => void;
    onHover: (hovered: boolean) => void;
    onUpdateEndpoints?: (endpoints: { r_x1: number; r_y1: number; r_x2: number; r_y2: number }) => void;
    renderOrder?: number;
    isFacade?: boolean;
    isBuildingHovered?: boolean;
    isAreaSelected?: boolean;
    isOccupancyAlert?: boolean;
}


// ------------------------------------
// Arc wall geometry builder
// ------------------------------------
function buildArcGeometry(
    wall: AreaWall,
    floorWidth: number,
    floorDepth: number,
): THREE.ExtrudeGeometry | null {
    const {
        arc_center_x, arc_center_z,
        arc_radius, arc_start_angle, arc_end_angle,
        arc_segments = 48,
        r_height,
        thickness,
    } = wall;


    if (
        arc_center_x == null || arc_center_z == null ||
        arc_radius == null || arc_start_angle == null || arc_end_angle == null
    ) return null;


    // Denormalize to real metres. arc_radius is normalized by floor_width.
    const cx = arc_center_x * floorWidth - floorWidth / 2;
    const cz = arc_center_z * floorDepth - floorDepth / 2;
    const rOuter = arc_radius * floorWidth;
    const rInner = Math.max(0.05, rOuter - thickness);


    // Build a closed 2D shape in XZ plane (x horizontal, z vertical here):
    //   outer arc points (forward) + inner arc points (backward) = wall cross-section
    const segments = arc_segments;


    // Normalise angle range so we always sweep in the positive direction
    let startA = arc_start_angle;
    let endA = arc_end_angle;
    if (endA <= startA) endA += Math.PI * 2;


    const shape = new THREE.Shape();


    // Outer arc — start to end
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startA + t * (endA - startA);
        const px = cx + Math.cos(angle) * rOuter;
        // shape Y → world -Z after rotation{[-π/2,0,0]}, so negate BOTH cz and sin
        // to get world Z = -shape_Y = cz + sin(angle)*r (correct)
        const pz = -cz - Math.sin(angle) * rOuter;
        if (i === 0) shape.moveTo(px, pz);
        else shape.lineTo(px, pz);
    }


    // Inner arc — end back to start (closing the shape)
    for (let i = segments; i >= 0; i--) {
        const t = i / segments;
        const angle = startA + t * (endA - startA);
        const px = cx + Math.cos(angle) * rInner;
        const pz = -cz - Math.sin(angle) * rInner;  // same negation: -cz - sin
        shape.lineTo(px, pz);
    }


    shape.closePath();


    // Extrude upward (depth = wall height). The shape sits in XY of Three's extrude system.
    // We extrude along +Z of the extrusion system, then rotate the mesh to align with world Y-up.
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: r_height,
        bevelEnabled: false,
        steps: 1,
    };


    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}


/**
 * Builds a thin curved cap geometry for arc walls to represent the slab band.
 */
function buildArcCapGeometry(
    wall: AreaWall,
    floorWidth: number,
    floorDepth: number,
): THREE.ExtrudeGeometry | null {
    const {
        arc_center_x, arc_center_z,
        arc_radius, arc_start_angle, arc_end_angle,
        arc_segments = 48,
        thickness = 0.18,
    } = wall;


    if (
        arc_center_x == null || arc_center_z == null ||
        arc_radius == null || arc_start_angle == null || arc_end_angle == null
    ) return null;


    const cx = arc_center_x * floorWidth - floorWidth / 2;
    const cz = arc_center_z * floorDepth - floorDepth / 2;
    const rOuter = arc_radius * floorWidth;
    const rInner = Math.max(0.05, rOuter - thickness);
    const capHeight = 0.18; // slab band height


    let startA = arc_start_angle;
    let endA = arc_end_angle;
    if (endA <= startA) endA += Math.PI * 2;


    const segments = arc_segments;
    const shape = new THREE.Shape();


    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startA + t * (endA - startA);
        const px = cx + Math.cos(angle) * rOuter;
        const pz = -cz - Math.sin(angle) * rOuter;
        if (i === 0) shape.moveTo(px, pz);
        else shape.lineTo(px, pz);
    }
    for (let i = segments; i >= 0; i--) {
        const t = i / segments;
        const angle = startA + t * (endA - startA);
        const px = cx + Math.cos(angle) * rInner;
        const pz = -cz - Math.sin(angle) * rInner;
        shape.lineTo(px, pz);
    }
    shape.closePath();


    return new THREE.ExtrudeGeometry(shape, {
        depth: capHeight,
        bevelEnabled: false,
        steps: 1,
    });
}


// ------------------------------------
// Bezier wall geometry builder (QuadraticBezierCurve3 path → ExtrudeGeometry)
// Gives a flat rectangular cross-section like the straight wall, not a round tube.
// ------------------------------------
function buildBezierGeometry(
    wall: AreaWall,
    floorWidth: number,
    floorDepth: number,
    capOnly: boolean = false,
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


    // Clamp control point
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const ctrlDist = Math.sqrt((cx - midX) ** 2 + (cz - midZ) ** 2);
    const maxCtrlDist = wallLength * 3;
    let safeCx = cx, safeCz = cz;
    if (ctrlDist > maxCtrlDist && ctrlDist > 0) {
        const radius = 0.09; // half of 0.18
        const ratio = maxCtrlDist / ctrlDist;
        safeCx = midX + (cx - midX) * ratio;
        safeCz = midZ + (cz - midZ) * ratio;
    }


    // Sample bezier curve in XZ plane only — Y is always 0
    const STEPS = 48;
    const curvePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const mt = 1 - t;
        // Quadratic bezier formula
        const bx = mt * mt * x1 + 2 * mt * t * safeCx + t * t * x2;
        const bz = mt * mt * z1 + 2 * mt * t * safeCz + t * t * z2;
        curvePoints.push(new THREE.Vector2(bx, bz));
    }


    if (curvePoints.length < 2) return null;


    const thickness = 0.18;
    const wallHeight = capOnly ? 0.18 : (wall.r_height ?? 3.0);
    const startY = capOnly ? (wall.r_height ?? 3.0) - 0.18 : 0;
    const halfT = thickness / 2;


    // Build vertex buffer manually
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];


    // For each point on curve, compute normal in XZ plane
    const pts = curvePoints;
    const N = pts.length;


    // Compute per-point tangent and right-normal in XZ
    const rights: THREE.Vector2[] = pts.map((_, i) => {
        let dx: number, dz: number;
        if (i === 0) {
            dx = pts[1].x - pts[0].x;
            dz = pts[1].y - pts[0].y;
        } else if (i === N - 1) {
            dx = pts[N - 1].x - pts[N - 2].x;
            dz = pts[N - 1].y - pts[N - 2].y;
        } else {
            dx = pts[i + 1].x - pts[i - 1].x;
            dz = pts[i + 1].y - pts[i - 1].y;
        }
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.0001) return new THREE.Vector2(1, 0);
        return new THREE.Vector2(dz / len, -dx / len);
    });


    // Generate 4 vertices per curve point:
    // Layout: [inner_bottom, inner_top, outer_bottom, outer_top]
    for (let i = 0; i < N; i++) {
        const px = pts[i].x;
        const pz = pts[i].y;
        const rx = rights[i].x;
        const rz = rights[i].y;


        // inner bottom
        positions.push(px - rx * halfT, startY, pz - rz * halfT);
        // inner top
        positions.push(px - rx * halfT, startY + wallHeight, pz - rz * halfT);
        // outer bottom
        positions.push(px + rx * halfT, startY, pz + rz * halfT);
        // outer top
        positions.push(px + rx * halfT, startY + wallHeight, pz + rz * halfT);


        normals.push(-rx, 0, -rz);  // inner bottom
        normals.push(-rx, 0, -rz);  // inner top
        normals.push(rx, 0, rz);  // outer bottom
        normals.push(rx, 0, rz);  // outer top
    }


    // Indices for inner face, outer face, top cap, bottom cap
    for (let i = 0; i < N - 1; i++) {
        const base = i * 4;
        const next = (i + 1) * 4;


        // Inner face
        indices.push(base + 0, next + 0, base + 1);
        indices.push(next + 0, next + 1, base + 1);


        // Outer face
        indices.push(base + 2, base + 3, next + 2);
        indices.push(next + 2, base + 3, next + 3);


        // Top cap
        indices.push(base + 1, next + 1, base + 3);
        indices.push(next + 1, next + 3, base + 3);


        // Bottom cap
        indices.push(base + 0, base + 2, next + 0);
        indices.push(next + 0, base + 2, next + 2);
    }


    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();


    return geo;
}


// ------------------------------------
// Component
// ------------------------------------
export const WallSegment: React.FC<WallSegmentProps> = ({
    wall, floorWidth, floorDepth, floorY,
    isSelected, isHovered, isPreview = false,
    onClick, onHover, renderOrder = 0,
    isFacade = false,
    isBuildingHovered = false,
    isAreaSelected = false,
    isOccupancyAlert = false,
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const cfg = WALL_CONFIG[wall.wall_type];


    // Determine if this is an arc wall
    const isArc = wall.wall_shape === 'arc' || wall.arc_center_x != null;
    let isBezier = wall.wall_shape === 'bezier' || (wall.ctrl_x != null && wall.wall_shape !== 'arc');


    // ---- Arc geometries (memoized) ----
    const arcGeometry = useMemo(() => {
        if (!isArc) return null;
        return buildArcGeometry(wall, floorWidth, floorDepth);
    }, [
        isArc,
        wall.arc_center_x, wall.arc_center_z,
        wall.arc_radius, wall.arc_start_angle, wall.arc_end_angle,
        wall.arc_segments, wall.r_height, wall.thickness,
        floorWidth, floorDepth,
    ]);


    const arcCapGeometry = useMemo(() => {
        if (!isArc || !isFacade) return null;
        return buildArcCapGeometry(wall, floorWidth, floorDepth);
    }, [isArc, isFacade, wall.arc_center_x, wall.arc_center_z,
        wall.arc_radius, wall.arc_start_angle, wall.arc_end_angle,
        wall.arc_segments, wall.r_height, wall.thickness,
        floorWidth, floorDepth]);


    // ---- Bezier geometries (memoized) ----
    const bezierGeometry = useMemo(() => {
        if (!isBezier) return null;
        return buildBezierGeometry(wall, floorWidth, floorDepth);
    }, [
        isBezier,
        wall.r_x1, wall.r_y1, wall.r_x2, wall.r_y2,
        wall.ctrl_x, wall.ctrl_y,
        wall.r_height, wall.r_z_offset, wall.thickness,
        floorWidth, floorDepth,
    ]);


    const bezierCapGeometry = useMemo(() => {
        if (!isBezier || !isFacade) return null;
        return buildBezierGeometry(wall, floorWidth, floorDepth, true);
    }, [isBezier, isFacade,
        wall.r_x1, wall.r_y1, wall.r_x2, wall.r_y2,
        wall.ctrl_x, wall.ctrl_y,
        wall.r_height, wall.r_z_offset, wall.thickness,
        floorWidth, floorDepth]);


    // ---- Straight wall geometry values ----
    const x1 = wall.r_x1 * floorWidth - floorWidth / 2;
    const z1 = wall.r_y1 * floorDepth - floorDepth / 2;
    const x2 = wall.r_x2 * floorWidth - floorWidth / 2;
    const z2 = wall.r_y2 * floorDepth - floorDepth / 2;
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const thickness = wall.thickness ?? 0.18;
    const height = wall.r_height ?? 3.0;
    const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    const angle = -Math.atan2(z2 - z1, x2 - x1);


    // Position walls so they start at floorY and grow upward
    const wallBaseY = floorY + (wall.r_z_offset ?? 0);
    const yBase = wallBaseY + height / 2;


    // Animate opacity and emissive on selection / hover / preview / building-wide hover
    const targetOpacity = isSelected ? 0.95 : (isHovered || (isFacade && isBuildingHovered) || isAreaSelected) ? wall.opacity + 0.2 : wall.opacity;
    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;


        // Opacity lerp with early exit
        const diff = Math.abs(mat.opacity - Math.min(targetOpacity, 1.0));
        if (diff > 0.001) {
            mat.opacity = THREE.MathUtils.lerp(
                mat.opacity, Math.min(targetOpacity, 1.0), 0.12
            );
        }


        // Emissive pulse — only when actively needed
        if (isPreview) {
            mat.emissiveIntensity = 0.3 + Math.abs(
                Math.sin(clock.getElapsedTime() * 2.5)
            ) * 0.5;
        } else if (isAreaSelected) {
            mat.emissiveIntensity = 0.4 + Math.abs(
                Math.sin(clock.getElapsedTime() * 4)
            ) * 1.5;
        } else if (isOccupancyAlert) {
            mat.emissiveIntensity = 0.8 + Math.abs(
                Math.sin(clock.getElapsedTime() * 6)
            ) * 2.5;
        }
    });


    const wallColor = isPreview ? '#f0c040' : (isSelected || isAreaSelected) ? '#ffec80' : (isOccupancyAlert && !isFacade) ? '#ff3d00' : wall.color;
    const emissive = isPreview ? '#f0c040' : (isSelected || isAreaSelected) ? '#f0c040' : isOccupancyAlert ? '#ff3d00' : isHovered ? '#201010' : '#000000';


    const sharedMaterial = isFacade ? (
        <meshPhysicalMaterial
            color={isAreaSelected ? "#ffdf00" : "#a8d8ea"}
            transparent
            opacity={0.13}
            metalness={0.05}
            roughness={0.02}
            transmission={isAreaSelected ? 0.6 : 0.88}
            thickness={0.8}
            ior={1.45}
            side={THREE.DoubleSide}
            depthWrite={false}
            envMapIntensity={isAreaSelected ? 2.0 : 1.2}
            emissive={isAreaSelected ? "#f0c040" : (isOccupancyAlert ? "#ff3d00" : "#000000")}
            emissiveIntensity={0}
        />
    ) : (
        <meshStandardMaterial
            color={wallColor}
            emissive={emissive}
            emissiveIntensity={isPreview ? 0.5 : (isAreaSelected ? 1.0 : (isOccupancyAlert ? 2.0 : 0.25))}
            transparent
            opacity={isPreview || isAreaSelected || isOccupancyAlert ? Math.max(wall.opacity, 0.7) : wall.opacity}
            roughness={isPreview ? 0.4 : cfg.roughness}
            metalness={isPreview ? 0.2 : cfg.metalness}
            depthWrite={isPreview ? false : cfg.depthWrite}
            side={wall.wall_type === 'glass' ? THREE.DoubleSide : THREE.FrontSide}
        />
    );


    const facadeEffects = isFacade && !isArc && !isBezier && (
        <>
            {/* Top slab edge band — straight walls only */}
            <mesh position={[0, height / 2 - 0.09, 0]} renderOrder={11}>
                <boxGeometry args={[length, 0.18, thickness + 0.02]} />
                <meshStandardMaterial
                    color="#c8dce8"
                    transparent
                    opacity={0.55}
                    metalness={0.3}
                    roughness={0.5}
                />
            </mesh>


            {/* Glass contact shadow on floor */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -height / 2 + 0.01, 0]}
                renderOrder={9}
            >
                <planeGeometry args={[length, 0.3]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.06}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>


            {/* Soft glow at base — reflected light on floor */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -height / 2 + 0.015, 0]}
                renderOrder={9}
            >
                <planeGeometry args={[length, 0.8]} />
                <meshBasicMaterial
                    color="#90c8e0"
                    transparent
                    opacity={0.04}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </>
    );


    const eventHandlers = {
        onClick: (e: any) => { e.stopPropagation(); onClick(wall); },
        onPointerOver: (e: any) => { e.stopPropagation(); onHover(true); },
        onPointerOut: () => onHover(false),
    };


    // ---- Arc wall rendering ----
    if (isArc) {
        if (!arcGeometry) return null;
        return (
            <group>
                <mesh
                    ref={meshRef}
                    geometry={arcGeometry}
                    position={[0, wallBaseY, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    castShadow
                    receiveShadow
                    renderOrder={10}
                    {...eventHandlers}
                >
                    {sharedMaterial}
                </mesh>


                {/* Curved slab cap on top of arc wall */}
                {arcCapGeometry && isFacade && (
                    <mesh
                        geometry={arcCapGeometry}
                        position={[0, wallBaseY + (wall.r_height ?? 3.0) - 0.09, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        renderOrder={11}
                    >
                        <meshStandardMaterial
                            color="#c8dce8"
                            transparent
                            opacity={0.55}
                            metalness={0.3}
                            roughness={0.5}
                        />
                    </mesh>
                )}
            </group>
        );
    }


    // ---- Bezier wall rendering ----
    // ExtrudeGeometry with extrudePath bakes XZ positions from the curve.
    // Position the mesh at floorY + r_z_offset; the shape starts at Y=0
    // and the r_height dimension goes up — no +height/2 offset needed.
    if (isBezier) {
        if (!bezierGeometry) {
            // Fallback — render as straight wall so it never disappears
            // This shows during degenerate drag states
            isBezier = false; // fall through to straight wall rendering below
        } else {
            return (
                <group>
                    <mesh
                        ref={meshRef}
                        geometry={bezierGeometry}
                        position={[0, wallBaseY, 0]}
                        castShadow
                        receiveShadow
                        renderOrder={10}
                        {...eventHandlers}
                    >
                        {sharedMaterial}
                    </mesh>


                    {/* Curved slab cap on top of bezier wall */}
                    {bezierCapGeometry && isFacade && (
                        <mesh
                            geometry={bezierCapGeometry}
                            position={[0, wallBaseY, 0]}
                            renderOrder={11}
                        >
                            <meshStandardMaterial
                                color="#c8dce8"
                                transparent
                                opacity={0.55}
                                metalness={0.3}
                                roughness={0.5}
                            />
                        </mesh>
                    )}
                </group>
            );
        }
    }


    // ---- Straight wall rendering (unchanged) ----
    if (length < 0.01) return null;


    return (
        <mesh
            ref={meshRef}
            position={[cx, yBase, cz]}
            rotation={[0, angle, 0]}
            castShadow
            receiveShadow
            renderOrder={10}
            {...eventHandlers}
        >
            <boxGeometry args={[length, height, thickness]} />
            {sharedMaterial}
            {facadeEffects}
        </mesh>
    );
};


import React, { useState, useEffect, useMemo } from 'react';
import { AreaNode, AreaType } from '../../../utils/threeD/types';
import useDarkMode from '../../../hooks/useDarkMode';
import { useThreeDTheme } from '../../../utils/threeD/theme';
import styles from '../../../styles/threeD/AddAreaPanel.module.scss';


interface AddAreaPanelProps {
    parentNode: AreaNode;
    onClose: () => void;
    onCreated: (newNode: AreaNode) => void;
    onCreate: (payload: any) => Promise<AreaNode>;
    headerless?: boolean;
}


const Row: React.FC<{ label: string; children: React.ReactNode; help?: string }> = ({ label, children, help }) => (
    <div className={styles.row}>
        <div className={styles.rowHeader}>
            <span className={styles.rowLabel}>{label}</span>
            {children}
        </div>
        {help && <span className={styles.rowHelp}>{help}</span>}
    </div>
);


const AddAreaPanel: React.FC<AddAreaPanelProps> = ({ parentNode, onClose, onCreated, onCreate, headerless }) => {
    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);


    // Determine possible child types based on parent type
    const availableTypes: AreaType[] = useMemo(() => {
        switch (parentNode.area_type) {
            case 'Site': return ['Region', 'Building'];
            case 'Region': return ['Region', 'Building'];
            case 'Building': return ['Floor'];
            case 'Floor': return ['Area'];
            case 'Area': return ['Sub Area'];
            default: return ['Area'];
        }
    }, [parentNode.area_type]);


    const [childType, setChildType] = useState<AreaType>(availableTypes[0]);


    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [capacity, setCapacity] = useState(10);
    const [alertThreshold, setAlertThreshold] = useState(8);
    const [isThresholdManual, setIsThresholdManual] = useState(false);


    // Floor-specific
    const [floorWidth, setFloorWidth] = useState(parentNode.floor_width || 20);
    const [floorDepth, setFloorDepth] = useState(parentNode.floor_depth || 15);
    const [floorHeight, setFloorHeight] = useState(3.0);
    const [floorLevel, setFloorLevel] = useState((parentNode.children?.length || 0) + 1);
    const [offsetZ, setOffsetZ] = useState(0);
    const [isOffsetZManual, setIsOffsetZManual] = useState(false);


    // Building-specific
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);


    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // Auto-calculate thresholds
    useEffect(() => {
        if (!isThresholdManual) {
            setAlertThreshold(Math.floor(capacity * 0.8));
        }
    }, [capacity, isThresholdManual]);


    // Auto-calculate floor Z offset
    useEffect(() => {
        if (!isOffsetZManual && childType === 'Floor') {
            setOffsetZ((floorLevel - 1) * floorHeight);
        }
    }, [floorLevel, floorHeight, isOffsetZManual, childType]);


    const themeVars = {
        '--panel-bg': t.panelBg,
        '--panel-border': t.panelBorder,
        '--panel-shadow': t.panelShadow,
        '--header-border': t.headerBorder,
        '--text-primary': t.textPrimary,
        '--text-secondary': t.textSecondary,
        '--text-muted': t.textMuted,
        '--input-bg': t.inputBg,
        '--input-border': t.inputBorder,
        '--badge-bg': t.badgeBg,
        '--accent-color': dark ? '#48cae4' : '#0077b6',
    } as React.CSSProperties;


    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }


        setIsSaving(true);
        setError(null);


        try {
            const payload: any = {
                name,
                description,
                area_type: childType,
                parent: parentNode.id,
                capacity,
                alert_threshold: alertThreshold,
                status: 'Active',
            };


            if (childType === 'Building' || childType === 'Region') {
                payload.offset_x = offsetX;
                payload.offset_y = offsetY;
                payload.is_building = childType === 'Building';
            } else if (childType === 'Floor') {
                payload.floor_width = floorWidth;
                payload.floor_depth = floorDepth;
                payload.floor_height = floorHeight;
                payload.floor_level = floorLevel;
                payload.offset_z = offsetZ;
                payload.is_floor = true;
            }


            const newNode = await onCreate(payload);
            onCreated(newNode);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create area');
            setIsSaving(false);
        }
    };


    return (
        <div
            className={headerless ? styles.panelHeaderless : styles.panel}
            style={themeVars}
        >
            {!headerless && (
                <div className={styles.header}>
                    <h3 className={styles.title}>Add Area under {parentNode.name}</h3>
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                    >×</button>
                </div>
            )}


            <div className={styles.form}>
                {availableTypes.length > 1 && (
                    <div className={styles.section}>
                        <div className={styles.label}>Select Type</div>
                        <div className={styles.typeSelector}>
                            {availableTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setChildType(type)}
                                    className={`${styles.typeButton} ${childType === type ? styles.active : ''}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}


                <div className={styles.section}>
                    <div className={styles.label}>Basic Info</div>
                    <Row label="Name">
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={`${childType} Name`}
                            className={styles.input}
                        />
                    </Row>
                    <Row label="Capacity">
                        <input
                            type="number"
                            value={capacity}
                            onChange={e => setCapacity(parseInt(e.target.value) || 0)}
                            className={styles.inputSmall}
                        />
                    </Row>
                    <Row label="Alert Threshold" help="Notify when occupancy exceeds this">
                        <div className={styles.flexRow}>
                            <input
                                type="number"
                                value={alertThreshold}
                                onChange={e => {
                                    setAlertThreshold(parseInt(e.target.value) || 0);
                                    setIsThresholdManual(true);
                                }}
                                className={styles.inputSmall}
                            />
                            {isThresholdManual && (
                                <button
                                    onClick={() => setIsThresholdManual(false)}
                                    className={styles.autoButton}
                                >↺ Auto</button>
                            )}
                        </div>
                    </Row>
                </div>


                {/* Building/Region fields (Placement) */}
                {(childType === 'Building' || childType === 'Region') && (
                    <div className={styles.section}>
                        <div className={styles.label}>Placement in Parent</div>
                        <div className={styles.flexRow}>
                            <Row label="X (m)" help="Shift Right">
                                <input
                                    type="number"
                                    value={offsetX}
                                    onChange={e => setOffsetX(parseFloat(e.target.value) || 0)}
                                    className={styles.inputSmall}
                                    style={{ width: 70 }}
                                />
                            </Row>
                            <Row label="Y (m)" help="Shift Depth">
                                <input
                                    type="number"
                                    value={offsetY}
                                    onChange={e => setOffsetY(parseFloat(e.target.value) || 0)}
                                    className={styles.inputSmall}
                                    style={{ width: 70 }}
                                />
                            </Row>
                        </div>
                    </div>
                )}


                {/* Floor fields */}
                {childType === 'Floor' && (
                    <div className={styles.section}>
                        <div className={styles.label}>Floor Dimensions</div>
                        <Row label="Width (m)">
                            <input
                                type="number"
                                value={floorWidth}
                                onChange={e => setFloorWidth(parseFloat(e.target.value) || 0)}
                                className={styles.inputMedium}
                            />
                        </Row>
                        <Row label="Depth (m)">
                            <input
                                type="number"
                                value={floorDepth}
                                onChange={e => setFloorDepth(parseFloat(e.target.value) || 0)}
                                className={styles.inputMedium}
                            />
                        </Row>
                        <Row label="Height (m)">
                            <input
                                type="number"
                                value={floorHeight}
                                onChange={e => setFloorHeight(parseFloat(e.target.value) || 0)}
                                className={styles.inputMedium}
                            />
                        </Row>
                        <Row label="Level #">
                            <input
                                type="number"
                                value={floorLevel}
                                onChange={e => setFloorLevel(parseInt(e.target.value) || 0)}
                                className={styles.inputMedium}
                            />
                        </Row>
                        <Row label="Z Offset (m)" help="Stacking height (Level × Height)">
                            <div className={styles.flexRow}>
                                <input
                                    type="number"
                                    value={offsetZ}
                                    onChange={e => {
                                        setOffsetZ(parseFloat(e.target.value) || 0);
                                        setIsOffsetZManual(true);
                                    }}
                                    className={styles.inputMedium}
                                />
                                {isOffsetZManual && (
                                    <button
                                        onClick={() => setIsOffsetZManual(false)}
                                        className={styles.autoButton}
                                    >↺ Auto</button>
                                )}
                            </div>
                        </Row>
                    </div>
                )}
            </div>


            {/* Error display */}
            {error && (
                <div className={styles.error}>
                    ⚠ {error}
                </div>
            )}


            {/* Footer */}
            <div className={styles.footer}>
                <button
                    onClick={onClose}
                    disabled={isSaving}
                    className={styles.cancelButton}
                >Cancel</button>
                <button
                    onClick={handleCreate}
                    disabled={isSaving}
                    className={styles.createButton}
                >
                    {isSaving ? 'Creating...' : `➕ Create ${childType}`}
                </button>
            </div>
        </div>
    );
};


export default AddAreaPanel;


import React, { useEffect, useRef, useState } from 'react';
import { AreaNode } from '../../../utils/threeD/types';
import ConfirmationModal from '../../common/ConfirmationModal';
import useDarkMode from '../../../hooks/useDarkMode';
import { useThreeDTheme } from '../../../utils/threeD/theme';
import styles from '../../../styles/threeD/AreaPlanUploader.module.scss';


interface AreaPlanUploaderProps {
    floor: AreaNode;
    onUpload: (areaId: number, file: File) => Promise<AreaNode>;
    onRemove: (areaId: number) => Promise<AreaNode>;
    onClose: () => void;
    chartVisible?: boolean;
    headerless?: boolean;
}


const AreaPlanUploader: React.FC<AreaPlanUploaderProps> = ({
    floor,
    onUpload,
    onRemove,
    onClose,
    headerless
}) => {
    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);


    const fileInputRef = useRef<HTMLInputElement>(null);


    // Clean up preview URL
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);


    const handleFileSelect = (file: File) => {
        setUploadError(null);
        setUploadSuccess(false);


        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file');
            return;
        }


        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File too large (max 10MB)');
            return;
        }


        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
    };


    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };


    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        setUploadError(null);
        try {
            await onUpload(floor.id, selectedFile);
            setUploadSuccess(true);
            setSelectedFile(null);
            setPreview(null);
            setTimeout(() => setUploadSuccess(false), 2000);
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };


    const handleRemove = async () => {
        setIsRemoving(true);
        try {
            await onRemove(floor.id);
            setShowConfirmRemove(false);
        } catch (err: any) {
            setUploadError(err.message || 'Removal failed');
            setShowConfirmRemove(false);
        } finally {
            setIsRemoving(false);
        }
    };


    const fileName = floor.area_plan ? floor.area_plan.split('/').pop() || '' : '';
    const displayFileName = fileName.length > 22 ? fileName.substring(0, 19) + '...' : fileName;


    const themeVars = {
        '--panel-bg': t.panelBg,
        '--panel-border': t.panelBorder,
        '--panel-shadow': t.panelShadow,
        '--text-primary': t.textPrimary,
        '--text-secondary': t.textSecondary,
        '--text-muted': t.textMuted,
        '--header-border': t.headerBorder,
        '--input-bg': t.inputBg,
        '--input-border': t.inputBorder,
        '--error-border': t.errorBorder,
        '--accent-blue': dark ? '#48cae4' : '#0077b6',
        '--dropzone-dragging-bg': dark ? 'rgba(72,202,228,0.07)' : 'rgba(0,119,182,0.05)',
        '--upload-btn-bg': `${dark ? '#48cae4' : '#0077b6'}26`,
        '--upload-btn-border': `${dark ? '#48cae4' : '#0077b6'}80`,
    } as React.CSSProperties;


    return (
        <div
            className={`${styles.uploaderPanel} ${headerless ? styles.headerless : ''}`}
            style={themeVars}
        >
            {!headerless && (
                <div className={styles.header}>
                    <h3>Floor Plan for {floor.name}</h3>
                    <button
                        onClick={onClose}
                        className={styles.closeBtn}
                    >×</button>
                </div>
            )}


            <div className={styles.content}>
                {/* Current Plan Section */}
                {floor.area_plan && !selectedFile && (
                    <div className={styles.currentPlanSection}>
                        <img
                            src={floor.area_plan}
                            alt="Current plan"
                            className={styles.currentPlanImg}
                        />
                        <div className={styles.fileInfoRow}>
                            <span title={fileName} className={styles.fileName}>
                                {displayFileName}
                            </span>
                            <button
                                onClick={() => setShowConfirmRemove(true)}
                                disabled={isRemoving}
                                className={styles.removeBtn}
                            >
                                {isRemoving ? 'Removing...' : '🗑 Remove'}
                            </button>
                        </div>
                    </div>
                )}


                <ConfirmationModal
                    isOpen={showConfirmRemove}
                    title="Remove Floor Plan"
                    message={`Are you sure you want to remove the floor plan for ${floor.name}? This action cannot be undone.`}
                    confirmText="Remove Plan"
                    cancelText="Keep Plan"
                    onConfirm={handleRemove}
                    onCancel={() => setShowConfirmRemove(false)}
                    danger
                />


                {/* Upload Section */}
                <div className={styles.uploadSection}>
                    <span className={styles.sectionLabel}>
                        {floor.area_plan ? 'REPLACE PLAN' : 'UPLOAD NEW PLAN'}
                    </span>


                    {!selectedFile ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`${styles.dropzone} ${isDragging ? styles.isDragging : ''}`}
                            >
                                <span className={styles.dropIcon}>📁</span>
                                <span className={styles.dropText}>Drop image here</span>
                                <span className={styles.dropSubtext}>or click to browse</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        ) : (
                            <div className={styles.selectedFileContainer}>
                                <div className={styles.selectedFileInfo}>
                                    <span className={styles.fileName}>
                                        {selectedFile.name}
                                    </span>
                                    <span className={styles.selectedFileSize}>
                                        {(selectedFile.size / 1024).toFixed(0)} KB
                                    </span>
                                </div>


                            {preview && (
                                <img
                                    src={preview}
                                    className={styles.previewImg}
                                    alt="Preview"
                                />
                            )}


                            <div className={styles.buttonRow}>
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className={styles.uploadBtn}
                                >
                                    {isUploading ? 'Uploading...' : '⬆ Upload Plan'}
                                </button>
                                <button
                                    onClick={() => { setSelectedFile(null); setPreview(null); }}
                                    className={styles.cancelUploadBtn}
                                >✕</button>
                            </div>
                        </div>
                    )}


                    {uploadError && (
                        <div className={styles.errorMessage}>
                            ⚠ {uploadError}
                        </div>
                    )}


                    {uploadSuccess && (
                        <div className={styles.successMessage}>
                            ✅ Plan uploaded!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default AreaPlanUploader;


import React, { useState } from 'react';
import { AreaNode, OccupancySnapshot } from '../../../utils/threeD/types';
import useDarkMode from '../../../hooks/useDarkMode';
import { useThreeDTheme, getAccentColor, getOccupancyColor } from '../../../utils/threeD/theme';
import styles from '../../../styles/threeD/BuildingSidebar.module.scss';




const Ico = {
    Site: ({ c }: { c: string }) => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    Region: ({ c }: { c: string }) => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    ),
    Building: ({ c }: { c: string }) => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
    ),
    Floor: ({ c }: { c: string }) => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18" />
        </svg>
    ),
    Area: ({ c }: { c: string }) => (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <rect x="3" y="3" width="18" height="18" rx="3" />
        </svg>
    ),
    ChevronDown: ({ c }: { c: string }) => (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    ChevronRight: ({ c }: { c: string }) => (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    Edit: ({ c }: { c: string }) => (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    Plus: ({ c }: { c: string }) => (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Explorer: ({ c }: { c: string }) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
};






function NodeIcon({ type, isTopLevel, dark }: { type: string; isTopLevel?: boolean; dark: boolean }) {
    const muted = dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)';
    if (isTopLevel) return <Ico.Site c={muted} />;
    const c = getAccentColor(type);
    switch (type) {
        case 'Building': return <Ico.Building c={c} />;
        case 'Floor': return <Ico.Floor c={c} />;
        case 'Area':
        case 'Sub Area': return <Ico.Area c={c} />;
        case 'Region': return <Ico.Region c={c} />;
        default: return <Ico.Area c={muted} />;
    }
}


// ─── OccBar ─────────────────────────────────────────────────────────────────────


const OccBar: React.FC<{ pct: number; trackColor: string }> = ({ pct }) => (
    <div className={styles.occBar}>
        <div
            className={styles.occBarFill}
            style={{
                width: `${Math.min(pct, 100)}%`,
                background: getOccupancyColor(pct),
            }}
        />
    </div>
);


// ─── SidebarRow ─────────────────────────────────────────────────────────────────


interface RowProps {
    node: AreaNode;
    depth: number;
    isSelected: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    dark: boolean;
    occupancy?: OccupancySnapshot[number];
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onAdd: (e: React.MouseEvent) => void;
    isTopLevel?: boolean;
    badge?: string;
    uid: string;
}


const SidebarRow: React.FC<RowProps> = ({
    node, depth, isSelected, isExpanded, hasChildren, dark,
    occupancy, onClick, onEdit, onAdd, isTopLevel, badge,
}) => {
    const t = useThreeDTheme(dark);
    const occ = occupancy;
    const pct = occ?.utilization_percent ?? 0;
    const accent = getAccentColor(node.area_type);
    const chevronColor = isSelected ? accent : t.textMuted;


    return (
        <div
            className={`${styles.row} ${isSelected ? styles.selected : ''}`}
            onClick={onClick}
            style={{
                paddingLeft: 10 + depth * 16,
                paddingRight: 6,
                borderLeft: isSelected ? `2px solid ${accent}` : '2px solid transparent',
            }}
        >
            {Array.from({ length: depth }).map((_, i) => (
                <div key={i} className={styles.indentLine} style={{
                    left: 18 + i * 16,
                }} />
            ))}


            <div className={styles.chevronWrapper}>
                {hasChildren
                    ? isExpanded
                        ? <Ico.ChevronDown c={chevronColor} />
                        : <Ico.ChevronRight c={chevronColor} />
                    : null}
            </div>


            <div className={styles.iconWrapper}>
                <NodeIcon type={node.area_type} isTopLevel={isTopLevel} dark={dark} />
            </div>


            <span
                className={styles.name}
                style={{
                    fontSize: isTopLevel ? 11 : 12,
                    fontWeight: isSelected ? 600 : 400,
                    color: isTopLevel
                        ? t.textMuted
                        : isSelected
                            ? t.textSelected
                            : t.textPrimary,
                }}
            >
                {node.name}
            </span>


            {badge && (
                <span className={styles.badge}>
                    {badge}
                </span>
            )}


            {occ !== undefined && (
                <div className={styles.occWrapper}>
                    <OccBar pct={pct} trackColor={t.barTrack} />
                    <span
                        className={styles.occCount}
                        style={{
                            color: getOccupancyColor(pct),
                        }}
                    >
                        {occ.people_total_occupancy ?? 0}/{occ.capacity}
                    </span>
                </div>
            )}


            <div className={styles.actions}>
                <button
                    className={styles.btn}
                    title={isTopLevel ? 'Editing disabled' : `Edit ${node.name}`}
                    onClick={onEdit}
                    style={{
                        cursor: isTopLevel ? 'not-allowed' : 'pointer',
                        opacity: isTopLevel ? 0.4 : 1,
                    }}
                >
                    <Ico.Edit c="currentColor" />
                </button>
                <button
                    className={styles.btnAdd}
                    title={`Add child to ${node.name}`}
                    onClick={onAdd}
                >
                    <Ico.Plus c="currentColor" />
                </button>
            </div>
        </div>
    );
};


interface SubTreeProps {
    items: AreaNode[];
    depth: number;
    dark: boolean;
    selectedFloorId: number | null;
    selectedAreaId: number | null;
    occupancy: OccupancySnapshot;
    onSelectFloor: (id: number) => void;
    onSelectArea: (id: number) => void;
    onAddChild: (n: AreaNode) => void;
    onEditNode: (n: AreaNode) => void;
}


const SubTree: React.FC<SubTreeProps> = ({
    items, depth, dark,
    selectedFloorId, selectedAreaId, occupancy,
    onSelectFloor, onSelectArea, onAddChild, onEditNode,
}) => {
    const [open, setOpen] = useState<Record<number, boolean>>({});
    return (
        <>
            {items.map(item => {
                const isFloor = item.area_type === 'Floor';
                const isArea = item.area_type === 'Area' || item.area_type === 'Sub Area';
                const isSelected = (isFloor && selectedFloorId === item.id) || (isArea && selectedAreaId === item.id);
                const hasChildren = (item.children ?? []).length > 0;
                const isOpen = !!open[item.id];


                return (
                    <React.Fragment key={item.id}>
                        <SidebarRow
                            node={item}
                            depth={depth}
                            dark={dark}
                            isSelected={isSelected}
                            isExpanded={isOpen}
                            hasChildren={hasChildren}
                            occupancy={occupancy[item.id]}
                            uid={`n${item.id}`}
                            onClick={() => {
                                if (isFloor) onSelectFloor(item.id);
                                if (isArea) onSelectArea(item.id);
                                if (hasChildren) setOpen(s => ({ ...s, [item.id]: !s[item.id] }));
                            }}
                            onEdit={e => { e.stopPropagation(); onEditNode(item); }}
                            onAdd={e => { e.stopPropagation(); onAddChild(item); }}
                        />
                        {hasChildren && isOpen && (
                            <SubTree
                                items={item.children ?? []}
                                depth={depth + 1}
                                dark={dark}
                                selectedFloorId={selectedFloorId}
                                selectedAreaId={selectedAreaId}
                                occupancy={occupancy}
                                onSelectFloor={onSelectFloor}
                                onSelectArea={onSelectArea}
                                onAddChild={onAddChild}
                                onEditNode={onEditNode}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};


interface NodeProps {
    node: AreaNode;
    depth: number;
    dark: boolean;
    selectedRegionId: number | null;
    selectedBuildingId: number | null;
    selectedFloorId: number | null;
    selectedAreaId: number | null;
    occupancy: OccupancySnapshot;
    onSelectRegion: (n: AreaNode) => void;
    onSelectBuilding: (n: AreaNode) => void;
    onSelectFloor: (id: number) => void;
    onSelectArea: (id: number) => void;
    onAddChild: (n: AreaNode) => void;
    onEditNode: (n: AreaNode) => void;
}


const TreeNode: React.FC<NodeProps> = ({
    node, depth, dark,
    selectedRegionId, selectedBuildingId, selectedFloorId, selectedAreaId,
    occupancy,
    onSelectRegion, onSelectBuilding, onSelectFloor, onSelectArea,
    onAddChild, onEditNode,
}) => {
    const [expanded, setExpanded] = useState(depth < 2);
    const hasChildren = (node.children ?? []).length > 0;
    const isTopLevel = node.is_default_top_area;


    if (node.area_type === 'Region') {
        const isSelected = selectedRegionId === node.id && !isTopLevel;
        return (
            <>
                <SidebarRow
                    node={node}
                    depth={depth}
                    dark={dark}
                    isSelected={isSelected}
                    isExpanded={expanded}
                    hasChildren={hasChildren}
                    isTopLevel={isTopLevel}
                    uid={`n${node.id}`}
                    onClick={() => { onSelectRegion(node); setExpanded(e => !e); }}
                    onEdit={e => { e.stopPropagation(); onEditNode(node); }}
                    onAdd={e => { e.stopPropagation(); onAddChild(node); }}
                />
                {expanded && (node.children ?? []).map(child => (
                    <TreeNode
                        key={child.id}
                        node={child}
                        depth={isTopLevel ? depth : depth + 1}
                        dark={dark}
                        selectedRegionId={selectedRegionId}
                        selectedBuildingId={selectedBuildingId}
                        selectedFloorId={selectedFloorId}
                        selectedAreaId={selectedAreaId}
                        occupancy={occupancy}
                        onSelectRegion={onSelectRegion}
                        onSelectBuilding={onSelectBuilding}
                        onSelectFloor={onSelectFloor}
                        onSelectArea={onSelectArea}
                        onAddChild={onAddChild}
                        onEditNode={onEditNode}
                    />
                ))}
            </>
        );
    }


    if (node.area_type === 'Building') {
        const isSelected = selectedBuildingId === node.id;
        const floors = (node.children ?? []).filter(c => c.area_type === 'Floor');
        return (
            <>
                <SidebarRow
                    node={node}
                    depth={depth}
                    dark={dark}
                    isSelected={isSelected}
                    isExpanded={expanded}
                    hasChildren={hasChildren}
                    badge={`${floors.length}F`}
                    uid={`n${node.id}`}
                    onClick={() => { onSelectBuilding(node); setExpanded(e => !e); }}
                    onEdit={e => { e.stopPropagation(); onEditNode(node); }}
                    onAdd={e => { e.stopPropagation(); onAddChild(node); }}
                />
                {expanded && (
                    <SubTree
                        items={node.children ?? []}
                        depth={depth + 1}
                        dark={dark}
                        selectedFloorId={selectedFloorId}
                        selectedAreaId={selectedAreaId}
                        occupancy={occupancy}
                        onSelectFloor={onSelectFloor}
                        onSelectArea={onSelectArea}
                        onAddChild={onAddChild}
                        onEditNode={onEditNode}
                    />
                )}
            </>
        );
    }


    return null;
};


interface BuildingSidebarProps {
    root: AreaNode | null;
    selectedRegionId: number | null;
    selectedBuildingId: number | null;
    selectedFloorId: number | null;
    selectedAreaId: number | null;
    occupancy: OccupancySnapshot;
    onSelectRegion: (n: AreaNode) => void;
    onSelectBuilding: (n: AreaNode) => void;
    onSelectFloor: (id: number) => void;
    onSelectArea: (id: number) => void;
    onAddChild: (n: AreaNode) => void;
    onEditNode: (n: AreaNode) => void;
    loading?: boolean;
}


const BuildingSidebar: React.FC<BuildingSidebarProps> = ({
    root, selectedRegionId, selectedBuildingId, selectedFloorId, selectedAreaId,
    occupancy, onSelectRegion, onSelectBuilding, onSelectFloor, onSelectArea,
    onAddChild, onEditNode, loading,
}) => {
    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);


    const themeVars = {
        '--header-bg': t.headerBg,
        '--header-border': t.headerBorder,
        '--text-primary': t.textPrimary,
        '--text-muted': t.textMuted,
        '--text-selected': t.textSelected,
        '--row-active': t.rowActive,
        '--row-hover': t.rowHover,
        '--indent-line': t.indentLine,
        '--badge-bg': t.badgeBg,
        '--badge-text': t.badgeText,
        '--bar-track': t.barTrack,
        '--btn-color': t.btnColor,
        '--btn-hover-bg': t.btnHoverBg,
        '--btn-hover-color': t.btnHoverColor,
        '--btn-add-hover-bg': dark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
        '--scroll-thumb': t.scrollThumb,
    } as React.CSSProperties;


    return (
        <div
            className={styles.sidebar}
            style={themeVars}
        >
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.explorerIconWrapper} style={{
                    background: dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                    border: `1px solid ${dark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.25)'}`,
                }}>
                    <Ico.Explorer c="#6366f1" />
                </div>
                <span className={styles.headerTitle}>
                    Area Explorer
                </span>
            </div>


            {/* ── Tree body — scrolls vertically, NEVER horizontally ── */}
            <div className={styles.body}>
                {loading || !root ? (
                    <div className={styles.emptyState}>
                        {loading ? 'Loading areas…' : 'No areas found'}
                    </div>
                ) : (
                    <TreeNode
                        node={root}
                        depth={0}
                        dark={dark}
                        selectedRegionId={selectedRegionId}
                        selectedBuildingId={selectedBuildingId}
                        selectedFloorId={selectedFloorId}
                        selectedAreaId={selectedAreaId}
                        occupancy={occupancy}
                        onSelectRegion={onSelectRegion}
                        onSelectBuilding={onSelectBuilding}
                        onSelectFloor={onSelectFloor}
                        onSelectArea={onSelectArea}
                        onAddChild={onAddChild}
                        onEditNode={onEditNode}
                    />
                )}
            </div>
        </div>
    );
};




export default BuildingSidebar;
import React, { useState, useEffect } from 'react';
import { AreaNode } from '../../../utils/threeD/types';
import useDarkMode from '../../../hooks/useDarkMode';
import { useThreeDTheme } from '../../../utils/threeD/theme';
import styles from '../../../styles/threeD/EditAreaPanel.module.scss';


interface EditAreaPanelProps {
    node: AreaNode;
    onSave: (areaId: number, patch: Record<string, any>) => Promise<AreaNode>;
    onDelete: (areaId: number) => Promise<void>;
    onSaved: (updated: AreaNode) => void;
    onDeleted: (areaId: number) => void;
}


const extractApiError = (err: any): string => {
    const data = err?.response?.data;
    if (!data) return err?.message ?? 'Request failed';
    if (typeof data === 'string') return data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.non_field_errors) return data.non_field_errors.join(' ');
    const firstKey = Object.keys(data)[0];
    const firstVal = data[firstKey];
    if (Array.isArray(firstVal)) return `${firstKey}: ${firstVal.join(' ')}`;
    return JSON.stringify(data);
};


const EditAreaPanel: React.FC<EditAreaPanelProps> = ({
    node, onSave, onDelete, onSaved, onDeleted
}) => {
    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);
    // ── Local State ─────────────────────────────────────────────────────────
    const [name, setName] = useState(node.name);
    const [status, setStatus] = useState(node.status);
    const [capacity, setCapacity] = useState(node.capacity);
    const [alertThreshold, setAlertThreshold] = useState(node.alert_threshold);
    const [description, setDescription] = useState(node.description ?? '');


    // Floor specific
    const [floorWidth, setFloorWidth] = useState(node.floor_width ?? 20);
    const [floorDepth, setFloorDepth] = useState(node.floor_depth ?? 15);
    const [floorHeight, setFloorHeight] = useState(node.floor_height ?? 3.5);
    const [floorLevel, setFloorLevel] = useState(node.floor_level ?? 0);


    // Position Offsets
    const [offsetX, setOffsetX] = useState(node.offset_x ?? 0);
    const [offsetZ, setOffsetZ] = useState(node.offset_z ?? 0);


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteStep, setDeleteStep] = useState(0); // 0=init, 1=confirm


    // Sync state when node changes (e.g. user selects a different node while panel open)
    useEffect(() => {
        setName(node.name);
        setStatus(node.status);
        setCapacity(node.capacity);
        setAlertThreshold(node.alert_threshold);
        setDescription(node.description ?? '');
        setFloorWidth(node.floor_width ?? 20);
        setFloorDepth(node.floor_depth ?? 15);
        setFloorHeight(node.floor_height ?? 3.5);
        setFloorLevel(node.floor_level ?? 0);
        setOffsetX(node.offset_x ?? 0);
        setOffsetZ(node.offset_z ?? 0);
        setError(null);
        setDeleteStep(0);
    }, [node]);


    const handleSave = async () => {
        setError(null);
        setLoading(true);
        try {
            const patch: Record<string, any> = {};
            if (name !== node.name) patch.name = name;
            if (status !== node.status) patch.status = status;
            if (capacity !== node.capacity) patch.capacity = capacity;
            if (alertThreshold !== node.alert_threshold) patch.alert_threshold = alertThreshold;
            if (description !== node.description) patch.description = description;


            if (node.area_type === 'Floor') {
                if (floorWidth !== node.floor_width) patch.floor_width = floorWidth;
                if (floorDepth !== node.floor_depth) patch.floor_depth = floorDepth;
                if (floorHeight !== node.floor_height) patch.floor_height = floorHeight;
                if (floorLevel !== node.floor_level) patch.floor_level = floorLevel;
                if (offsetX !== node.offset_x) patch.offset_x = offsetX;
                if (offsetZ !== node.offset_z) patch.offset_z = offsetZ;
            } else if (node.area_type === 'Building' || node.area_type === 'Region') {
                if (offsetX !== node.offset_x) patch.offset_x = offsetX;
            }


            if (Object.keys(patch).length === 0) {
                onSaved(node);
                return;
            }


            const updated = await onSave(node.id, patch);
            onSaved(updated);
        } catch (err: any) {
            setError(extractApiError(err));
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async () => {
        setError(null);
        setLoading(true);
        try {
            await onDelete(node.id);
            onDeleted(node.id);
        } catch (err: any) {
            setError(extractApiError(err));
            setDeleteStep(0);
        } finally {
            setLoading(false);
        }
    };


    const isFloor = node.area_type === 'Floor';
    const isBuildingOrRegion = node.area_type === 'Building' || node.area_type === 'Region';


    const themeVars = {
        '--text-primary': t.textPrimary,
        '--text-secondary': t.textSecondary,
        '--text-muted': t.textMuted,
        '--header-border': t.headerBorder,
        '--input-bg': t.inputBg,
        '--input-border': t.inputBorder,
        '--input-focus-bg': dark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,1)',
        '--warning-bg': t.warningBackground,
        '--warning-border': t.warningBorder,
        '--error-bg': t.errorBackground,
        '--error-border': t.errorBorder,
        '--error-text': dark ? '#ff8a80' : '#d62828',
        '--badge-bg': t.badgeBg,
        '--accent-blue': dark ? '#48cae4' : '#0077b6',
        '--accent-orange': dark ? '#f4a261' : '#e76f51',
        '--auto-btn-hover-text': dark ? 'white' : '#0077b6',
        '--delete-btn-text': dark ? 'rgba(230, 57, 70, 0.6)' : 'rgba(230, 57, 70, 0.8)',
    } as React.CSSProperties;


    if (node.is_default_top_area) {
        return (
            <div className={styles.readOnlySection} style={themeVars}>
                <div className={styles.warningBox}>
                    <div className={styles.warningTitle}>
                        ⚠ Site editing temporarily disabled
                    </div>
                    <div className={styles.warningText}>
                        Default top-level area properties are managed in Organization Settings.
                    </div>
                </div>


                {/* Show current values as read-only */}
                <div className={styles.readOnlyLabel}>
                    Current Values (read-only)
                </div>
                {[
                    ['Name', node.name],
                    ['Capacity', node.capacity],
                    ['Alert Threshold', node.alert_threshold],
                    ['Status', node.status],
                ].map(([label, value]) => (
                    <div key={label} className={styles.readOnlyRow}>
                        <span className={styles.readOnlyKey}>{label}</span>
                        <span className={styles.readOnlyValue}>{value}</span>
                    </div>
                ))}
            </div>
        );
    }


    return (
        <div className={styles.panelContent} style={themeVars}>
            {error && (
                <div className={styles.errorBox}>
                    ⚠ {error}
                </div>
            )}


            <div className={styles.section}>
                <label className={styles.label}>Name</label>
                <input
                    className={styles.input}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Area name"
                />
            </div>


            <div className={styles.grid}>
                <div className={styles.section}>
                    <label className={styles.label}>Status</label>
                    <select
                        className={styles.input}
                        value={status}
                        onChange={e => setStatus(e.target.value as "Active" | "Inactive")}
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
                <div className={styles.section}>
                    <label className={styles.label}>Capacity</label>
                    <input
                        className={styles.input}
                        type="number"
                        value={capacity}
                        onChange={e => setCapacity(parseInt(e.target.value) || 0)}
                    />
                    {node.is_default_top_area && (
                        <div className={styles.subHint}>
                            This is the total site capacity. All child area capacities
                            must not exceed this value combined.
                        </div>
                    )}
                </div>
            </div>


            <div className={styles.section}>
                <label className={styles.label}>
                    Alert Threshold (%)
                    <span className={styles.hint}>
                        = {Math.round((capacity * alertThreshold) / 100)} people
                    </span>
                </label>
                <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={100}
                    value={alertThreshold}
                    onChange={e => setAlertThreshold(parseInt(e.target.value) || 0)}
                />
                <div className={styles.subHint}>
                    Alert fires when occupancy reaches this % of capacity
                </div>
            </div>


            <div className={styles.section}>
                <label className={styles.label}>Description</label>
                <textarea
                    className={styles.input}
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ resize: 'none' }}
                />
            </div>


            {isFloor && (
                <>
                    <div className={styles.header}>Floor Dimensions</div>
                    <div className={styles.grid}>
                        <div className={styles.section}>
                            <label className={styles.label}>Width (m)</label>
                            <input
                                className={styles.input}
                                type="number"
                                step="0.1"
                                value={floorWidth}
                                onChange={e => setFloorWidth(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className={styles.section}>
                            <label className={styles.label}>Depth (m)</label>
                            <input
                                className={styles.input}
                                type="number"
                                step="0.1"
                                value={floorDepth}
                                onChange={e => setFloorDepth(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <div className={styles.grid}>
                        <div className={styles.section}>
                            <label className={styles.label}>Height (m)</label>
                            <input
                                className={styles.input}
                                type="number"
                                step="0.1"
                                value={floorHeight}
                                onChange={e => setFloorHeight(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className={styles.section}>
                            <label className={styles.label}>Level</label>
                            <input
                                className={styles.input}
                                type="number"
                                value={floorLevel}
                                onChange={e => setFloorLevel(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>


                    <div className={styles.header}>Position Offsets</div>
                    <div className={styles.grid}>
                        <div className={styles.section}>
                            <label className={styles.label}>X Offset (m)</label>
                            <input
                                className={styles.input}
                                type="number"
                                step="0.1"
                                value={offsetX}
                                onChange={e => setOffsetX(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className={styles.section}>
                            <label className={styles.label}>
                                Z Offset (m)
                                <button
                                    className={styles.autoBtn}
                                    onClick={() => setOffsetZ(floorLevel * floorHeight)}
                                    title="Calculate from level x height"
                                >Auto</button>
                            </label>
                            <input
                                className={styles.input}
                                type="number"
                                step="0.1"
                                value={offsetZ}
                                onChange={e => setOffsetZ(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </>
            )}


            {isBuildingOrRegion && (
                <>
                    <div className={styles.header}>Position</div>
                    <div className={styles.section}>
                        <label className={styles.label}>X Offset (m)</label>
                        <input
                            className={styles.input}
                            type="number"
                            step="0.5"
                            value={offsetX}
                            onChange={e => setOffsetX(parseFloat(e.target.value) || 0)}
                        />
                        <div className={styles.subHint}>
                            Horizontal position relative to parent
                        </div>
                    </div>
                </>
            )}


            <div className={styles.actions}>
                <button
                    className={styles.saveBtn}
                    disabled={loading}
                    onClick={handleSave}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>


                {!node.is_default_top_area && (
                    deleteStep === 0 ? (
                        <button
                            className={styles.deleteBtn}
                            onClick={() => setDeleteStep(1)}
                            disabled={loading}
                        >
                            🗑 Delete {node.area_type}
                        </button>
                    ) : (
                        <div className={styles.deleteConfirm}>
                            <div className={styles.deleteWarn}>
                                ⚠ This will delete "{node.name}" and all its descendants. This cannot be undone.
                            </div>
                            <div className={styles.deleteRow}>
                                <button
                                    className={styles.cancelBtn}
                                    onClick={() => setDeleteStep(0)}
                                    disabled={loading}
                                >Cancel</button>
                                <button
                                    className={styles.confirmBtn}
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    {loading ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};


export default EditAreaPanel;


import React from 'react';
import { AreaNode, AreaWall, OccupancyEntry as AreaOccupancy } from '../../../utils/threeD/types';
import { getUtilizationColor } from '../../../utils/threeD/dummyData';


interface FloorInfoPanelProps {
    floor: AreaNode;
    selectedWall: AreaWall | null;
    occupancy?: AreaOccupancy;
    onClose: () => void;
}


const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="threed-infopanel__row">
        <span className="threed-infopanel__label">{label}</span>
        <span className="threed-infopanel__value">{value}</span>
    </div>
);


const FloorInfoPanel: React.FC<FloorInfoPanelProps> = ({ floor, selectedWall, occupancy, onClose }) => {
    const utilColor = occupancy ? getUtilizationColor(occupancy.utilization_percent) : undefined;


    return (
        <div className="threed-infopanel">
            <div className="threed-infopanel__header">
                <span>🔲 {floor.name}</span>
                <button className="threed-infopanel__close" onClick={onClose}>✕</button>
            </div>


            <div className="threed-infopanel__body">
                <Row label="Level" value={floor.floor_level !== null ? `Level ${floor.floor_level}` : '—'} />
                <Row label="Size" value={floor.floor_width && floor.floor_depth
                    ? `${floor.floor_width}m × ${floor.floor_depth}m`
                    : '—'} />
                <Row label="Height" value={floor.floor_height ? `${floor.floor_height}m` : '—'} />
                <Row label="Capacity" value={floor.capacity} />
                <Row label="Status" value={
                    <span className={`threed-infopanel__status threed-infopanel__status--${floor.status.toLowerCase()}`}>
                        {floor.status}
                    </span>
                } />


                {/* Live occupancy */}
                {occupancy && (
                    <div className="threed-infopanel__section">
                        <div className="threed-infopanel__section-title">Live Occupancy</div>
                        <Row label="In" value={occupancy.people_total_in} />
                        <Row label="Out" value={occupancy.people_total_out} />
                        <Row label="Current" value={<strong>{occupancy.people_total_occupancy}</strong>} />
                        <Row label="Utilization" value={
                            <span style={{ color: utilColor, fontWeight: 700 }}>
                                {occupancy.utilization_percent.toFixed(1)}%
                            </span>
                        } />
                        {/* Utilization bar */}
                        <div style={{
                            height: 5, borderRadius: 3,
                            background: 'rgba(128,128,128,0.2)',
                            marginTop: 2,
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(occupancy.utilization_percent, 100)}%`,
                                background: utilColor,
                                borderRadius: 3,
                                transition: 'width 0.5s ease, background 0.5s ease',
                            }} />
                        </div>
                    </div>
                )}


                {/* Selected wall */}
                {selectedWall && (
                    <div className="threed-infopanel__section">
                        <div className="threed-infopanel__section-title">Selected Wall</div>
                        <Row label="ID" value={`#${selectedWall.id}`} />
                        <Row label="Type" value={selectedWall.wall_type} />
                        <Row label="Height" value={`${selectedWall.r_height}m`} />
                        <Row label="Thickness" value={`${selectedWall.thickness}m`} />
                        <Row label="Z-Offset" value={`${selectedWall.r_z_offset}m`} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <div style={{
                                width: 12, height: 12, borderRadius: 3,
                                background: selectedWall.color,
                                border: '1px solid rgba(255,255,255,0.3)',
                            }} />
                            <span className="threed-infopanel__label">{selectedWall.color}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default FloorInfoPanel;


import useDarkMode from '../../../hooks/useDarkMode';
import type { AreaNode, SensorNode, AreaWall } from '../../../utils/threeD/types';
import type { UseSensorPlacementReturn } from '../../../hooks/useSensorPlacement';
import { useThreeDTheme } from '../../../utils/threeD/theme';
import Icon from '../../icon/Icon';
import SensorPlacementPanel from '../sensors/SensorPlacementPanel';
import AreaPlanUploader from './AreaPlanUploader';
import AddAreaPanel from './AddAreaPanel';
import EditAreaPanel from './EditAreaPanel';
import WallEditPanel from '../walls/WallEditPanel';
import styles from '../../../styles/threeD/UnifiedRightPanel.module.scss';


export type RightPanelMode =
    | 'sensors'
    | 'plan'
    | 'add_area'
    | 'edit_area'
    | 'edit_wall'
    | 'lines'
    | null;


interface UnifiedRightPanelProps {
    mode: RightPanelMode;
    // For sensors mode:
    selectedFloor: AreaNode | null;
    sensors: SensorNode[];
    sensorPlacement: UseSensorPlacementReturn;
    onSaveAllPlacements: () => void;
    onRemoveSensor: (sensorId: number) => Promise<void>;
    // For plan mode:
    onUploadPlan: (areaId: number, file: File) => Promise<AreaNode>;
    onRemovePlan: (areaId: number) => Promise<AreaNode>;
    // For add_area mode:
    addingChildOf: AreaNode | null;
    onCreateArea: (payload: any) => Promise<AreaNode>;
    onCreatedArea: (newNode: AreaNode) => void;
    // For edit_area mode:
    editingArea: AreaNode | null;
    onPatchArea: (areaId: number, patch: Record<string, any>) => Promise<AreaNode>;
    onDeleteArea: (areaId: number) => Promise<void>;
    onAreaDeleted: (areaId: number) => void;
    // For edit_wall mode:
    editingWall: AreaWall | null;
    onSaveWall: (wall: AreaWall) => Promise<void>;
    onDeleteWall: (wallId: number) => void;
    // For lines mode:
    linesMode?: boolean;
    selectedLineId?: number | null;
    onSelectLine?: (id: number | null) => void;
    onStartPlacingLine?: (sensorId: number, lineId: number) => void;
    onClearLine?: (sensorId: number, lineId: number) => Promise<void>;
    floorSensors?: SensorNode[];
    // General:
    onClose: () => void;
    hidden?: boolean;
}


const UnifiedRightPanel: React.FC<UnifiedRightPanelProps> = ({
    mode,
    selectedFloor,
    sensors,
    sensorPlacement,
    onSaveAllPlacements,
    onRemoveSensor,
    onUploadPlan,
    onRemovePlan,
    addingChildOf,
    onCreateArea,
    onCreatedArea,
    editingArea,
    onPatchArea,
    onDeleteArea,
    onAreaDeleted,
    editingWall,
    onSaveWall,
    onDeleteWall,
    selectedLineId,
    onSelectLine,
    onStartPlacingLine,
    onClearLine,
    floorSensors,
    onClose,
    hidden,
}) => {
    const { darkModeStatus: dark } = useDarkMode();
    const t = useThreeDTheme(dark);
    const isOpen = mode !== null;


    const themeVars = {
        '--panel-bg': t.panelBg,
        '--panel-border': t.panelBorder,
        '--header-bg': t.headerBg,
        '--header-border': t.headerBorder,
        '--text-primary': t.textPrimary,
        '--text-secondary': t.textSecondary,
        '--text-muted': t.textMuted,
        '--input-bg': t.inputBg,
        '--input-border': t.inputBorder,
    } as React.CSSProperties;


    const renderHeader = () => {
        let iconName = '';
        let title = '';
        let subtitle = '';
        let accent = '#6366f1';


        switch (mode) {
            case 'sensors':
                iconName = 'Sensors';
                title = 'Sensors';
                subtitle = selectedFloor?.name || '';
                accent = '#3b82f6';
                break;
            case 'plan':
                iconName = 'Map';
                title = 'Floor Plan';
                subtitle = selectedFloor?.name || '';
                accent = '#10b981';
                break;
            case 'add_area':
                iconName = 'PostAdd';
                title = 'Add Area';
                subtitle = `under ${addingChildOf?.name || '...'}`;
                accent = '#6366f1';
                break;
            case 'edit_area':
                iconName = 'Edit';
                title = 'Edit Area';
                subtitle = editingArea?.name || '';
                accent = '#10b981';
                break;
            case 'edit_wall':
                iconName = 'Architecture';
                title = 'Edit Wall';
                subtitle = selectedFloor?.name || '';
                accent = '#6366f1';
                break;
            case 'lines':
                iconName = 'Timeline';
                title = 'Counting Lines';
                subtitle = selectedFloor?.name || '';
                accent = '#f59e0b';
                break;
        }


        return (
            <div className={styles.header}>
                <div className={styles.iconWrapper} style={{
                    background: `${accent}15`,
                    border: `1px solid ${accent}40`,
                }}>
                    <Icon icon={iconName} size="sm" style={{ color: accent }} />
                </div>


                <div className={styles.titleWrapper}>
                    <span className={styles.title}>{title}</span>
                    {subtitle && (
                        <span className={styles.subtitle}>
                            {subtitle}
                        </span>
                    )}
                </div>


                <button
                    onClick={onClose}
                    className={styles.closeButton}
                >
                    <Icon icon="Close" size="xs" />
                </button>
            </div>
        );
    };


    return (
        <div
            className={`${styles.panel} ${hidden ? styles.hidden : (isOpen ? styles.visible : styles.hidden)}`}
            style={themeVars}
        >
            {renderHeader()}


            <div className={styles.body}>
                {mode === 'sensors' && selectedFloor && (
                    <SensorPlacementPanel
                        sensors={sensors}
                        placement={sensorPlacement}
                        currentFloorId={selectedFloor.id}
                        currentFloorHeight={selectedFloor.floor_height}
                        onSaveAll={onSaveAllPlacements}
                        onRemoveSensor={onRemoveSensor}
                        headerless={true}
                    />
                )}


                {mode === 'plan' && selectedFloor && (
                    <AreaPlanUploader
                        floor={selectedFloor}
                        onUpload={onUploadPlan}
                        onRemove={onRemovePlan}
                        onClose={onClose}
                        headerless={true}
                    />
                )}


                {mode === 'add_area' && addingChildOf && (
                    <AddAreaPanel
                        parentNode={addingChildOf}
                        onCreate={onCreateArea}
                        onCreated={onCreatedArea}
                        onClose={onClose}
                        headerless={true}
                    />
                )}


                {mode === 'edit_area' && editingArea && (
                    <EditAreaPanel
                        node={editingArea}
                        onSave={onPatchArea}
                        onDelete={onDeleteArea}
                        onSaved={() => onClose()}
                        onDeleted={onAreaDeleted}
                    />
                )}


                {mode === 'edit_wall' && editingWall && (
                    <WallEditPanel
                        wall={editingWall}
                        onSave={onSaveWall}
                        onDelete={onDeleteWall}
                        onUpdate={() => { }} // Internal state handled by WallEditPanel
                        onClose={onClose}
                        embed={true}
                    />
                )}


                {mode === 'lines' && (
                    <div className={styles.sensorGroup}>
                        {(floorSensors ?? []).length === 0 ? (
                            <div className={styles.emptyState}>
                                No sensors placed on this floor
                            </div>
                        ) : (
                            (floorSensors ?? []).map(sensor => (
                                <div key={sensor.id} className={styles.sensorRow}>
                                    {/* Sensor header */}
                                    <div className={styles.sensorHeader}>
                                        <span className={styles.statusDot} style={{
                                            background: sensor.online_status ? '#52b788' : '#e63946',
                                        }} />
                                        <span className={styles.sensorName}>
                                            {sensor.sensor_name}
                                        </span>
                                        <span className={styles.lineCount}>
                                            {sensor.counting_lines.length} line{sensor.counting_lines.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>


                                    {/* Counting lines */}
                                    {sensor.counting_lines.map(line => {
                                        const placed = line.line_r_x1 !== null;
                                        const isSelected = selectedLineId === line.id;
                                        return (
                                            <div
                                                key={line.id}
                                                onClick={() => onSelectLine?.(isSelected ? null : line.id)}
                                                className={`${styles.lineItem} ${isSelected ? styles.selected : ''}`}
                                            >
                                                <div className={styles.lineMain}>
                                                    <span className={styles.lineDot} style={{
                                                        background: line.line_color,
                                                    }} />
                                                    <span className={styles.lineName}>{line.name}</span>
                                                    <span className={placed ? styles.statusBadgeSet : styles.statusBadgeUnset}>
                                                        {placed ? '✓ set' : '! unset'}
                                                    </span>
                                                </div>


                                                {isSelected && placed && (
                                                    <div className={styles.lineActions}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onStartPlacingLine?.(sensor.id, line.id);
                                                            }}
                                                            className={styles.buttonPlace}
                                                        >
                                                            <Icon icon="Edit" size="xs" /> Re-place
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onClearLine?.(sensor.id, line.id);
                                                            }}
                                                            className={styles.buttonUnset}
                                                        >
                                                            <Icon icon="Delete" size="xs" /> Unset
                                                        </button>
                                                    </div>
                                                )}


                                                {!placed && (
                                                    <div className={styles.lineCoords}>
                                                        ({line.line_r_x1?.toFixed(2)}, {line.line_r_y1?.toFixed(2)})
                                                        → ({line.line_r_x2?.toFixed(2)}, {line.line_r_y2?.toFixed(2)})
                                                    </div>
                                                )}


                                                {/* Direction areas */}
                                                {isSelected && (
                                                    <div className={styles.directionGroup}>
                                                        {line.areas_following_direction_names.length > 0 && (
                                                            <div className={styles.directionFollowing}>
                                                                → {line.areas_following_direction_names.join(', ')}
                                                            </div>
                                                        )}
                                                        {line.areas_opposite_direction_names.length > 0 && (
                                                            <div className={styles.directionOpposite}>
                                                                ← {line.areas_opposite_direction_names.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}


                                                {/* Place button for unset lines */}
                                                {!placed && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStartPlacingLine?.(sensor.id, line.id);
                                                        }}
                                                        className={styles.placeButtonFull}
                                                    >
                                                        <Icon icon="LocationOn" size="xs" /> Click floor to place
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                )}


                {/* Empty states */}
                {mode === 'sensors' && !selectedFloor && (
                    <div className={styles.panelEmptyState}>
                        Select a floor to manage sensors
                    </div>
                )}
                {mode === 'plan' && !selectedFloor && (
                    <div className={styles.panelEmptyState}>
                        Select a floor to manage its plan
                    </div>
                )}
                {mode === 'edit_area' && !editingArea && (
                    <div className={styles.panelEmptyState}>
                        Select an area to edit
                    </div>
                )}
                {mode === 'edit_wall' && !editingWall && (
                    <div className={styles.panelEmptyState}>
                        Select a wall to edit
                    </div>
                )}
            </div>
        </div>
    );
};


export default UnifiedRightPanel;


import { useState, useCallback, useEffect, useRef } from 'react';
import { AreaWall, WallType } from '../utils/threeD/types';


export interface Point2D {
    nx: number;
    ny: number;
}


export interface WallDrawingSettings {
    wall_type: WallType;
    height: number;
    thickness: number;
    color: string;
    opacity: number;
}


export interface WallDrawingState {
    isDrawing: boolean;
    drawingMode: 'straight' | 'arc';
    /** Master anchor chain — one point added per completed segment endpoint */
    anchorPoints: Point2D[];
    /** Pending clicks for the in-progress segment (0-2 for arc, 0 for straight) */
    points: Point2D[];
    previewPoint: Point2D | null;
    arcPreviewWall: AreaWall | null;
    drawnWalls: AreaWall[];
    settings: WallDrawingSettings;
    /** True after finishDrawing — keeps panel open so user can save the closed shape */
    isShapeClosed: boolean;
    /** The specific sub-area these walls are intended for */
    targetAreaId: number | null;
}


export interface UseWallDrawingOptions {
    floorHeight?: number;
}


export interface UseWallDrawingReturn extends WallDrawingState {
    startDrawing: () => void;
    cancelDrawing: () => void;
    finishDrawing: () => void;
    addPoint: (nx: number, ny: number) => void;
    updatePreview: (nx: number, ny: number) => void;
    removeWall: (id: number) => void;
    clearAllWalls: () => void;
    clearShapeClosed: () => void;
    updateSettings: (partial: Partial<WallDrawingSettings>) => void;
    updateWallEndpoints: (id: number, endpoints: { r_x1: number; r_y1: number; r_x2: number; r_y2: number }) => void;
    setDrawingMode: (mode: 'straight' | 'arc') => void;
    setTargetAreaId: (id: number | null) => void;
}


const DEFAULT_SETTINGS: WallDrawingSettings = {
    wall_type: 'outer',
    height: 3.0,
    thickness: 0.18,
    color: '#8f1919',
    opacity: 0.8,
};


// ---------------------------------------------------------------------------
// Arc math helpers
// ---------------------------------------------------------------------------


function circumcenter(
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
): { x: number; y: number } | null {
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(D) < 1e-10) return null;
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
    return { x: ux, y: uy };
}


/**
 * Build an arc AreaWall from 3 points.
 * All geometry is computed in real metre space to handle non-square floors
 * (e.g. 80×50m). Results are stored normalized for the renderer.
 */
function buildArcWall(
    p1: Point2D, p2: Point2D, p3: Point2D,
    floorId: number,
    settings: WallDrawingSettings,
    targetAreaId: number | null,
    floorWidth: number,
    floorDepth: number,
): AreaWall | null {
    const toM = (p: Point2D) => ({ x: p.nx * floorWidth, y: p.ny * floorDepth });
    const m1 = toM(p1), m2 = toM(p2), m3 = toM(p3);


    const center = circumcenter(m1.x, m1.y, m2.x, m2.y, m3.x, m3.y);
    if (!center) return null;


    const radius = Math.sqrt((m1.x - center.x) ** 2 + (m1.y - center.y) ** 2);


    let startAngle = Math.atan2(m1.y - center.y, m1.x - center.x);
    let endAngle = Math.atan2(m2.y - center.y, m2.x - center.x);
    const p3Angle = Math.atan2(m3.y - center.y, m3.x - center.x);


    const normalizeAfter = (a: number, base: number) => {
        while (a < base) a += Math.PI * 2;
        while (a >= base + Math.PI * 2) a -= Math.PI * 2;
        return a;
    };


    const endCCW = normalizeAfter(endAngle, startAngle);
    const p3CCW = normalizeAfter(p3Angle, startAngle);
    if (!(p3CCW >= 0 && p3CCW <= endCCW)) {
        [startAngle, endAngle] = [endAngle, startAngle];
    }


    return {
        id: -(Date.now() + Math.floor(Math.random() * 10000)),
        area_id: floorId,
        r_x1: p1.nx, r_y1: p1.ny,
        r_x2: p2.nx, r_y2: p2.ny,
        r_height: settings.height,
        r_z_offset: 0.0,
        thickness: settings.thickness,
        wall_type: settings.wall_type,
        color: settings.color,
        opacity: settings.opacity,
        wall_shape: 'arc',
        arc_center_x: center.x / floorWidth,
        arc_center_z: center.y / floorDepth,
        arc_radius: radius / floorWidth,
        arc_start_angle: startAngle,
        arc_end_angle: endAngle,
        arc_segments: 48,
        sub_area_id: targetAreaId ?? undefined,
    };
}


// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------


export function useWallDrawing(
    floorId: number | null,
    floorWidth: number = 20,
    floorDepth: number = 15,
    options?: UseWallDrawingOptions
): UseWallDrawingReturn {
    const floorHeight = options?.floorHeight ?? 3.0;


    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingMode, setDrawingModeState] = useState<'straight' | 'arc'>('straight');
    const [anchorPoints, setAnchorPointsState] = useState<Point2D[]>([]);
    const [points, setPoints] = useState<Point2D[]>([]);
    const [previewPoint, setPreviewPoint] = useState<Point2D | null>(null);
    const [arcPreviewWall, setArcPreviewWall] = useState<AreaWall | null>(null);
    const [drawnWalls, setDrawnWalls] = useState<AreaWall[]>([]);
    const [settings, setSettings] = useState<WallDrawingSettings>({
        ...DEFAULT_SETTINGS,
        height: floorHeight
    });
    const [isShapeClosed, setIsShapeClosed] = useState(false);
    const [targetAreaId, _setTargetAreaId] = useState<number | null>(null);
    const targetAreaIdRef = useRef<number | null>(null);


    const setTargetAreaId = useCallback((id: number | null) => {
        _setTargetAreaId(id);
        targetAreaIdRef.current = id;
        // Updating already drawn walls in this session to the new area
        setDrawnWalls(prev => prev.map(w => ({ ...w, sub_area_id: id ?? undefined })));
    }, []);


    // Refs — always fresh values accessible from Three.js callbacks
    const isDrawingRef = useRef(false);
    const isShapeClosedRef = useRef(false);
    const drawingModeRef = useRef<'straight' | 'arc'>('straight');
    const anchorPointsRef = useRef<Point2D[]>([]);
    const pointsRef = useRef<Point2D[]>([]);
    const settingsRef = useRef<WallDrawingSettings>(DEFAULT_SETTINGS);
    const floorWidthRef = useRef(floorWidth);
    const floorDepthRef = useRef(floorDepth);
    const floorIdRef = useRef(floorId);


    useEffect(() => { settingsRef.current = settings; }, [settings]);
    useEffect(() => { floorWidthRef.current = floorWidth; floorDepthRef.current = floorDepth; }, [floorWidth, floorDepth]);
    useEffect(() => { floorIdRef.current = floorId; }, [floorId]);


    // Update height when floorHeight changes
    useEffect(() => {
        updateSettings({ height: floorHeight });
    }, [floorHeight]);


    // ── Sync helpers ────────────────────────────────────────────────────────


    const setIsDrawingSync = (val: boolean) => {
        isDrawingRef.current = val;
        setIsDrawing(val);
    };


    const setIsShapeClosedSync = (val: boolean) => {
        isShapeClosedRef.current = val;
        setIsShapeClosed(val);
    };


    const setPointsSync = (updater: (prev: Point2D[]) => Point2D[]) => {
        setPoints(prev => {
            const next = updater(prev);
            pointsRef.current = next;
            return next;
        });
    };


    const setAnchorPoints = useCallback((updater: ((prev: Point2D[]) => Point2D[]) | Point2D[]) => {
        setAnchorPointsState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            anchorPointsRef.current = next;
            return next;
        });
    }, []);


    const resetAll = () => {
        setIsDrawingSync(false);
        setIsShapeClosedSync(false);
        setPointsSync(() => []);
        setAnchorPoints([]);
        setDrawnWalls([]);
        setPreviewPoint(null);
        setArcPreviewWall(null);
    };


    // ── Escape key ──────────────────────────────────────────────────────────


    useEffect(() => {
        if (!isDrawingRef.current) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') resetAll();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawing]);


    // ── Drawing mode toggle ─────────────────────────────────────────────────


    const setDrawingMode = useCallback((mode: 'straight' | 'arc') => {
        drawingModeRef.current = mode;
        setDrawingModeState(mode);
        // Carry last anchor as seed if switching to arc, otherwise clear pending
        const lastAnchor = anchorPointsRef.current.length > 0
            ? anchorPointsRef.current[anchorPointsRef.current.length - 1]
            : null;
        setPointsSync(() => (lastAnchor && mode === 'arc') ? [lastAnchor] : []);
        setPreviewPoint(null);
        setArcPreviewWall(null);
    }, []);


    // ── Session lifecycle ───────────────────────────────────────────────────


    const startDrawing = useCallback(() => {
        setIsDrawingSync(true);
        setPointsSync(() => []);
        setAnchorPoints([]);
        setPreviewPoint(null);
        setArcPreviewWall(null);
    }, []);


    const cancelDrawing = useCallback(() => { resetAll(); }, []);


    /**
     * Finish / double-click:
     * If ≥3 anchors exist, add a closing wall from last anchor → first anchor.
     * Sets pendingSave=true so the panel stays open for the user to save.
     */
    const finishDrawing = useCallback(() => {
        const anchors = anchorPointsRef.current;
        const fid = floorIdRef.current;


        if (anchors.length >= 3 && fid != null) {
            const first = anchors[0];
            const last = anchors[anchors.length - 1];
            const dist = Math.sqrt((first.nx - last.nx) ** 2 + (first.ny - last.ny) ** 2);
            if (dist > 0.005) {
                const s = settingsRef.current;
                const closingWall: AreaWall = {
                    id: -(Date.now() + Math.floor(Math.random() * 10000)),
                    area_id: fid,
                    r_x1: last.nx, r_y1: last.ny,
                    r_x2: first.nx, r_y2: first.ny,
                    r_height: s.height,
                    r_z_offset: 0.0,
                    thickness: s.thickness,
                    wall_type: s.wall_type,
                    color: s.color,
                    opacity: s.opacity,
                    sub_area_id: targetAreaId ?? undefined,
                };
                setDrawnWalls(w => [...w, closingWall]);
            }
        }


        // Shape is closed, await save
        setPointsSync(() => []);
        setPreviewPoint(null);
        setArcPreviewWall(null);
        setIsShapeClosedSync(true);
    }, [targetAreaId]);


    // ── addPoint ────────────────────────────────────────────────────────────


    const addPoint = useCallback((nx: number, ny: number) => {
        if (!isDrawingRef.current || floorIdRef.current == null || isShapeClosedRef.current) return;
        const fid = floorIdRef.current;


        if (drawingModeRef.current === 'straight') {
            // ── Straight: every click = one more wall segment ──────────────
            const anchors = anchorPointsRef.current;


            if (anchors.length === 0) {
                // Very first click → seed the anchor chain, no wall yet
                setAnchorPoints(prev => {
                    const next = [...prev, { nx, ny }];
                    anchorPointsRef.current = next;
                    return next;
                });
            } else {
                // Subsequent click → wall from last anchor → new point
                const from = anchors[anchors.length - 1];
                const s = settingsRef.current;
                const newWall: AreaWall = {
                    id: -(Date.now() + Math.floor(Math.random() * 10000)),
                    area_id: fid,
                    r_x1: from.nx, r_y1: from.ny,
                    r_x2: nx, r_y2: ny,
                    r_height: s.height,
                    r_z_offset: 0.0,
                    thickness: s.thickness,
                    wall_type: s.wall_type,
                    color: s.color,
                    opacity: s.opacity,
                    sub_area_id: targetAreaId ?? undefined,
                };
                setDrawnWalls(w => [...w, newWall]);
                setAnchorPoints(prev => {
                    const next = [...prev, { nx, ny }];
                    anchorPointsRef.current = next;
                    return next;
                });
            }
            // No pending points in straight mode — anchor chain is the state
            setPointsSync(() => []);


        } else {
            // ── Arc: accumulate 3 clicks, then emit arc ───────────────────
            setPointsSync(prev => {
                const nextPoints = [...prev, { nx, ny }];


                if (nextPoints.length === 3) {
                    const [p1, p2, p3] = nextPoints;
                    const s = settingsRef.current;
                    const w = floorWidthRef.current;
                    const d = floorDepthRef.current;
                    const arcWall = buildArcWall(p1, p2, p3, fid, s, targetAreaId, w, d);
                    if (arcWall) {
                        setDrawnWalls(walls => [...walls, arcWall]);
                    }


                    // p2 is the arc endpoint → becomes next anchor
                    setAnchorPoints(prev => {
                        const next = [...prev, p2];
                        anchorPointsRef.current = next;
                        return next;
                    });
                    setArcPreviewWall(null);
                    setPreviewPoint(null);
                    return []; // reset for next arc or next segment
                }


                return nextPoints;
            });
        }
    }, [targetAreaId]);


    // ── updatePreview ───────────────────────────────────────────────────────


    const updatePreview = useCallback((nx: number, ny: number) => {
        if (!isDrawingRef.current || isShapeClosedRef.current) {
            setPreviewPoint(null);
            setArcPreviewWall(null);
            return;
        }


        const pts = pointsRef.current;
        const anchors = anchorPointsRef.current;


        if (drawingModeRef.current === 'straight') {
            // Show preview line from last anchor → cursor
            if (anchors.length > 0) {
                setPreviewPoint({ nx, ny });
            } else {
                setPreviewPoint(null);
            }
            setArcPreviewWall(null);


        } else {
            // Arc mode
            const arcStart = pts.length > 0 ? pts[0] : null;
            const arcMid = pts.length > 1 ? pts[1] : null;


            if (!arcStart) {
                // No arc clicks yet — if we have an anchor, show a line from anchor to cursor
                if (anchors.length > 0) setPreviewPoint({ nx, ny });
                else setPreviewPoint(null);
                setArcPreviewWall(null);


            } else if (!arcMid) {
                // 1 arc click placed — straight preview from p1 → cursor
                setPreviewPoint({ nx, ny });
                setArcPreviewWall(null);


            } else {
                // 2 arc clicks placed — full live arc preview
                setPreviewPoint(null);
                const s = settingsRef.current;
                const w = floorWidthRef.current;
                const d = floorDepthRef.current;
                const fid = floorIdRef.current ?? -1;
                const preview = buildArcWall(arcStart, arcMid, { nx, ny }, fid, s, targetAreaId, w, d);
                setArcPreviewWall(preview ? { ...preview, opacity: 0.6 } : null);
            }
        }
    }, [targetAreaId]);


    // ── Other callbacks ─────────────────────────────────────────────────────


    const removeWall = useCallback((id: number) => {
        setDrawnWalls(prev => prev.filter(w => w.id !== id));
    }, []);


    const clearAllWalls = useCallback(() => {
        setDrawnWalls([]);
        setIsShapeClosedSync(false);
        resetAll();
    }, []);


    const clearShapeClosed = useCallback(() => {
        setDrawnWalls([]);
        setIsShapeClosedSync(false);
    }, []);


    const updateSettings = useCallback((partial: Partial<WallDrawingSettings>) => {
        setSettings(s => {
            const next = { ...s, ...partial };
            settingsRef.current = next;
            return next;
        });
    }, []);


    const updateWallEndpoints = useCallback((
        id: number,
        endpoints: { r_x1: number; r_y1: number; r_x2: number; r_y2: number },
    ) => {
        setDrawnWalls(prev => prev.map(w => w.id === id ? { ...w, ...endpoints } : w));
    }, []);


    return {
        isDrawing,
        drawingMode,
        anchorPoints,
        points,
        previewPoint,
        arcPreviewWall,
        drawnWalls,
        settings,
        isShapeClosed,
        startDrawing,
        cancelDrawing,
        finishDrawing,
        addPoint,
        updatePreview,
        removeWall,
        clearAllWalls,
        clearShapeClosed,
        updateSettings,
        updateWallEndpoints,
        setDrawingMode,
        targetAreaId,
        setTargetAreaId,
    };
}


import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '../../components/icon/Icon';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera, Environment, Loader, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { BuildingScene, RegionScene, FloorScene } from '../../components/threeD/scene/BuildingScene';
import SpatialMapView from '../../components/threeD/views/SpatialMapView';
import IsometricBuildingView from '../../components/threeD/views/IsometricBuildingView';
import BuildingSidebar from '../../components/threeD/panels/BuildingSidebar';
import WallDrawerPanel from '../../components/threeD/walls/WallDrawerPanel';
import UnifiedRightPanel, { RightPanelMode } from '../../components/threeD/panels/UnifiedRightPanel';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import FloorOccupancyChart from '../../components/threeD/occupancy/FloorOccupancyChart';
import { useWallDrawing } from '../../hooks/useWallDrawing';
import { useSensorPlacement } from '../../hooks/useSensorPlacement';
import { useThreeDData } from '../../hooks/useThreeDData';
import useDarkMode from '../../hooks/useDarkMode';
import {
    findAreaById, getAllBuildingsRecursive, GLOBAL_DEMO_ROOT, MASTER_DEMO_OCCUPANCY,
    DUMMY_SENSORS, WALLS_BY_FLOOR as DUMMY_WALLS
} from '../../utils/threeD/dummyData';
import { GET_MEGA_OCCUPANCY, GET_MEGA_SENSORS, GET_MEGA_WALLS } from '../../utils/threeD/megaDemoData';
import { AreaNode, AreaWall } from '../../utils/threeD/types';
import styles from './ThreeDPage.module.scss';


const ZoomOnlyWhenLocked: React.FC<{ shouldLock: boolean }> = ({ shouldLock }) => {
    const { camera, gl } = useThree();
    useEffect(() => {
        if (!shouldLock) return;
        const canvas = gl.domElement;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.12 : 0.89;
            const newY = Math.max(5, Math.min(200, camera.position.y * factor));
            camera.position.setY(newY);
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, [shouldLock, camera, gl]);
    return null;
};


const ThreeDPage: React.FC = () => {
    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
    const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
    const [selectedWall, setSelectedWall] = useState<AreaWall | null>(null);
    const [viewMode, setViewMode] = useState<'3d' | 'spatial' | 'isometric'>('spatial');
    const [isMock, setIsMock] = useState(() => {
        const saved = localStorage.getItem('threed_demo_mode');
        return saved === null ? true : saved === 'true';
    });
    const [lastOccupancyUpdate, setLastOccupancyUpdate] = useState<Date | null>(null);
    const [showConfirmDeleteWall, setShowConfirmDeleteWall] = useState<{ id: number; floorId: number } | null>(null);
    const { darkModeStatus } = useDarkMode();


    const {
        areaTree, sensors, occupancy, wallsByFloor, loadingTree,
        loadWallsForFloor, handleSaveWalls, handlePatchWall, handleDeleteWall,
        handlePlaceSensor, handleCreateArea, handleUploadAreaPlan,
        handleRemoveAreaPlan, handlePatchArea, handleDeleteArea,
        handleRemoveSensorPlacement, handlePatchCountingLine, handleClearCountingLine,
    } = useThreeDData();


    const augmentedAreaTree = useMemo(() => {
        if (!isMock) {
            if (!areaTree) return null;
            const filterDemo = (node: AreaNode): AreaNode | null => {
                if (node.id < 0) return null;
                return {
                    ...node,
                    children: (node.children ?? []).map(filterDemo).filter((c): c is AreaNode => c !== null)
                };
            };
            return filterDemo(areaTree);
        }
        return GLOBAL_DEMO_ROOT;
    }, [areaTree, isMock]);


    const selectedRegion = useMemo(() => {
        if (!selectedRegionId || !augmentedAreaTree) return null;
        return findAreaById(augmentedAreaTree, selectedRegionId);
    }, [selectedRegionId, augmentedAreaTree]);


    const selectedBuilding = useMemo(() => {
        if (!selectedBuildingId || !augmentedAreaTree) return null;
        return findAreaById(augmentedAreaTree, selectedBuildingId);
    }, [selectedBuildingId, augmentedAreaTree]);


    const selectedFloor = useMemo(() => {
        if (!selectedFloorId || !augmentedAreaTree) return null;
        return findAreaById(augmentedAreaTree, selectedFloorId);
    }, [selectedFloorId, augmentedAreaTree]);


    const augmentedOccupancy = useMemo(() => {
        if (!isMock) return occupancy;
        return { ...MASTER_DEMO_OCCUPANCY, ...GET_MEGA_OCCUPANCY() };
    }, [isMock, occupancy]);


    const augmentedSensors = useMemo(() => {
        if (!isMock) return sensors;
        return [...GET_MEGA_SENSORS(), ...DUMMY_SENSORS];
    }, [isMock, sensors]);


    const augmentedWallsByFloor = useMemo(() => {
        if (!isMock) return wallsByFloor;
        const dummyWalls: Record<number, AreaWall[]> = {};
        Object.entries(DUMMY_WALLS).forEach(([id, resp]) => { dummyWalls[Number(id)] = resp.walls; });
        return { ...GET_MEGA_WALLS(), ...dummyWalls };
    }, [wallsByFloor, isMock]);


    const isSiteLevel = !selectedRegionId && !selectedBuildingId && !selectedFloorId;


    const [showSidebar, setShowSidebar] = useState(true);
    const [showSensors, setShowSensors] = useState(true);
    const [showCountingLines, setShowCountingLines] = useState(true);


    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(null);
    const [addingChildOf, setAddingChildOf] = useState<AreaNode | null>(null);
    const [editingArea, setEditingArea] = useState<AreaNode | null>(null);
    const [editingWall, setEditingWall] = useState<AreaWall | null>(null);


    const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
    const [linesMode, setLinesMode] = useState(false);
    const [placingLine, setPlacingLine] = useState<{
        sensorId: number; lineId: number; step: 1 | 2;
        x1?: number; y1?: number;
    } | null>(null);


    const wallDrawing = useWallDrawing(
        selectedFloorId,
        selectedFloor?.floor_width ?? 20,
        selectedFloor?.floor_depth ?? 15,
        { floorHeight: selectedFloor?.floor_height ?? 3.0 }
    );


    const sensorPlacement = useSensorPlacement();


    useEffect(() => {
        if (selectedAreaId) wallDrawing.setTargetAreaId(selectedAreaId);
    }, [selectedAreaId]);


    useEffect(() => {
        if (!isMock) {
            const isDemo = (id: number | null) => id !== null && id < 0;
            if (isDemo(selectedRegionId)) setSelectedRegionId(null);
            if (isDemo(selectedBuildingId)) setSelectedBuildingId(null);
            if (isDemo(selectedFloorId)) setSelectedFloorId(null);
            if (isDemo(selectedAreaId)) setSelectedAreaId(null);
        }
    }, [isMock, selectedRegionId, selectedBuildingId, selectedFloorId, selectedAreaId]);


    const handleSelectRegion = (node: AreaNode) => {
        setSelectedRegionId(node.id);
        setSelectedBuildingId(null);
        setSelectedFloorId(null);
        setSelectedAreaId(null);
        setSelectedWall(null);
        setRightPanelMode(null);
    };


    const handleSelectBuilding = (node: AreaNode) => {
        setSelectedBuildingId(node.id);
        setSelectedRegionId(null);
        setSelectedFloorId(null);
        setSelectedAreaId(null);
        setSelectedWall(null);
        setRightPanelMode(null);
    };


    const handleSelectFloor = (floorId: number) => {
        if (selectedFloorId === floorId) {
            setSelectedFloorId(null);
            setSelectedAreaId(null);
            setSelectedWall(null);
            setRightPanelMode(null);
        } else {
            setSelectedFloorId(floorId);
            setSelectedAreaId(null);
            setSelectedWall(null);
            loadWallsForFloor(floorId);
            setLinesMode(false);
            setSelectedLineId(null);
            setPlacingLine(null);
        }
    };


    const handleSelectArea = (areaId: number) => {
        setSelectedAreaId(areaId);
        if (!isMock) loadWallsForFloor(areaId);
    };


    const handleEditArea = (node: AreaNode) => {
        setEditingArea(node);
        setRightPanelMode('edit_area');
    };


    const handleWallClick = (wall: AreaWall, floor: AreaNode) => {
        setSelectedWall(wall);
        setEditingWall(wall);
        setSelectedFloorId(floor.id);
        setRightPanelMode('edit_wall');
    };


    const handleAreaDeleted = (areaId: number) => {
        if (selectedFloorId === areaId) setSelectedFloorId(null);
        if (selectedBuildingId === areaId) setSelectedBuildingId(null);
        if (selectedAreaId === areaId) setSelectedAreaId(null);
        if (editingArea?.id === areaId) setEditingArea(null);
        setRightPanelMode(null);
    };


    const handleSaveSensorPlacements = async () => {
        const entries = Object.entries(sensorPlacement.pendingPlacements);
        for (const [sensorId, pos] of entries) {
            await handlePlaceSensor(parseInt(sensorId), {
                position_area: pos.position_area_id ?? selectedFloorId!,
                x_val: pos.x_val ?? 0,
                y_val: pos.y_val ?? 0,
                z_val: pos.z_val ?? 0,
                rotation_y: pos.rotation_y ?? 0,
                mount_type: pos.mount_type ?? 'wall',
            });
        }
        sensorPlacement.clearAllPlacements();
    };


    const safeSelectedBuilding = (!isMock && selectedBuilding && selectedBuilding.id < 0) ? null : selectedBuilding;
    const safeSelectedRegion = (!isMock && selectedRegion && selectedRegion.id < 0) ? null : selectedRegion;
    const effectiveRoot = safeSelectedBuilding || safeSelectedRegion || augmentedAreaTree;


    let sceneLabel = '';
    if (selectedFloor) {
        sceneLabel = `🔲 ${selectedFloor.name}`;
        if (selectedAreaId && augmentedAreaTree) {
            const area = findAreaById(augmentedAreaTree, selectedAreaId);
            if (area) sceneLabel += ` · ${area.name}`;
        }
    } else if (selectedBuilding) {
        sceneLabel = `🏢 ${selectedBuilding.name}`;
    } else if (selectedRegion) {
        sceneLabel = `📍 ${selectedRegion.name}`;
    }


    const priorPanelMode = useRef<RightPanelMode>(null);
    const cameraControlsRef = useRef<any>(null);


    useEffect(() => {
        if (occupancy && Object.keys(occupancy).length > 0) setLastOccupancyUpdate(new Date());
    }, [occupancy]);


    const isLocked = wallDrawing.isDrawing || sensorPlacement.isPlacing || placingLine !== null || linesMode;


    useEffect(() => {
        const cc = cameraControlsRef.current;
        if (!cc) return;


        if (wallDrawing.isDrawing || sensorPlacement.isPlacing) {
            cc.rotatePolarTo(0.01, true);
            cc.rotateAzimuthTo(0, true);
            const floorW = selectedFloor?.floor_width ?? 20;
            const floorD = selectedFloor?.floor_depth ?? 15;
            const maxDim = Math.max(floorW, floorD);
            cc.setPosition(0, maxDim * 1.4, 0.001, true);
            cc.setTarget(0, 0, 0, true);
            cc.minPolarAngle = 0; cc.maxPolarAngle = 0.01;
            cc.minAzimuthAngle = -0.01; cc.maxAzimuthAngle = 0.01;
            cc.mouseButtons.left = 0; cc.mouseButtons.right = 0;
            cc.enabled = true;
        } else if (rightPanelMode === 'edit_wall') {
            cc.rotatePolarTo(0.01, true);
            cc.minPolarAngle = 0; cc.maxPolarAngle = 0.01;
            cc.minAzimuthAngle = -0.01; cc.maxAzimuthAngle = 0.01;
            cc.mouseButtons.left = 0; cc.mouseButtons.right = 0;
            cc.enabled = true;
        } else if (isLocked) {
            cc.rotatePolarTo(0.01, true);
            cc.minPolarAngle = 0; cc.maxPolarAngle = 0.01;
            cc.mouseButtons.left = 0; cc.mouseButtons.right = 0;
            cc.enabled = false;
        } else {
            cc.enabled = true;
            cc.minPolarAngle = 0.05; cc.maxPolarAngle = Math.PI / 2.1;
            cc.minAzimuthAngle = -Infinity; cc.maxAzimuthAngle = Infinity;
            cc.mouseButtons.left = 1; cc.mouseButtons.right = 2;
        }
    }, [wallDrawing.isDrawing, rightPanelMode, isLocked, selectedFloor]);


    useEffect(() => {
        if (wallDrawing.isDrawing || sensorPlacement.isPlacing) {
            if (!priorPanelMode.current) priorPanelMode.current = rightPanelMode;
            setRightPanelMode(null);
        } else {
            if (priorPanelMode.current === 'sensors') setRightPanelMode('sensors');
            priorPanelMode.current = null;
        }
    }, [wallDrawing.isDrawing, sensorPlacement.isPlacing]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (wallDrawing.isDrawing) { wallDrawing.cancelDrawing(); return; }
                if (placingLine) { setPlacingLine(null); return; }
                if (linesMode) { setLinesMode(false); setSelectedLineId(null); setRightPanelMode(null); return; }
                if (sensorPlacement.isPlacing) { sensorPlacement.cancelPlacing(); return; }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [wallDrawing, placingLine, linesMode]);


    const cameraPos: [number, number, number] = selectedFloor ? [0, 20, 25] : selectedRegion ? [0, 45, 65] : [30, 30, 35];
    const regionBuildings = useMemo(() => {
        if (!augmentedAreaTree) return [];
        return getAllBuildingsRecursive(augmentedAreaTree);
    }, [augmentedAreaTree]);


    return (
        <div className={styles.page}>
            <div className={styles.topbar}>
                <div className={styles.title}>
                    <button
                        className={`${styles.drawerBtn} ${showSidebar ? styles.active : ''}`}
                        onClick={() => setShowSidebar(s => !s)}
                        title={showSidebar ? "Hide Explorer" : "Show Explorer"}
                    >
                        <span className={styles.titleIcon}><Icon icon="ViewSidebar" size="sm" /></span>
                    </button>
                    Site Analytics
                    {sceneLabel && <span style={{ fontWeight: 400, fontSize: 13, opacity: 0.55 }}>&nbsp;— {sceneLabel}</span>}
                </div>


                <div className={styles.viewSwitcherPill}>
                    {[
                        { id: '3d', label: '3D', icon: 'ViewInAr', title: '3D View' },
                        { id: 'spatial', label: 'Spatial', icon: 'GridView', title: 'Spatial Overview' },
                        { id: 'isometric', label: 'Isometric', icon: 'Iso', title: 'Isometric View' },
                    ].map(v => {
                        const isDisabled = v.id === '3d' && isSiteLevel;
                        const isActive = viewMode === v.id;
                        return (
                            <button
                                key={v.id}
                                className={`${styles.viewBtn} ${isDisabled ? styles.disabled : ''} ${isActive ? styles.active : ''}`}
                                onClick={() => !isDisabled && setViewMode(v.id as any)}
                                disabled={isDisabled}
                                title={isDisabled ? 'Select an area/building to enable 3D view' : v.title}
                                style={{ '--btn-active-bg': darkModeStatus ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)' } as React.CSSProperties}
                            >
                                <Icon icon={v.icon} size="sm" />
                                {v.label}
                            </button>
                        );
                    })}
                </div>


                <div className={styles.controls}>
                    <button
                        className={styles.modeToggleBtn}
                        onClick={() => {
                            const next = !isMock;
                            setIsMock(next);
                            localStorage.setItem('threed_demo_mode', String(next));
                            setSelectedRegionId(null); setSelectedBuildingId(null); setSelectedFloorId(null); setSelectedAreaId(null);
                        }}
                        style={{
                            border: isMock ? '1px solid #6045b2ff' : '1px solid #06d6a0',
                            background: isMock ? 'rgba(255,209,102,0.08)' : 'rgba(6,214,160,0.08)',
                            color: isMock ? '#6045b2ff' : '#06d6a0',
                        }}
                    >
                        <Icon icon={isMock ? 'SensorsOff' : 'Sensors'} size="sm" />
                        {isMock ? 'Demo Mode' : 'Live Mode'}
                    </button>


                    {viewMode === '3d' && (
                        <>
                            <div className={styles.divider} />
                            <div className={styles.toolPill}>
                                {selectedFloor && (() => {
                                    const active = wallDrawing.isDrawing;
                                    return (
                                        <button
                                            onClick={() => active ? wallDrawing.finishDrawing() : wallDrawing.startDrawing()}
                                            title={active ? `Drawing… (${wallDrawing.points.length} pts)` : 'Divide Areas'}
                                            className={`${styles.toolBtn} ${active ? styles.drawActive : ''}`}
                                        ><Icon icon="Edit" size="sm" /></button>
                                    );
                                })()}


                                {!wallDrawing.isDrawing && (() => {
                                    const active = rightPanelMode === 'sensors';
                                    return (
                                        <button
                                            onClick={() => setRightPanelMode(m => m === 'sensors' ? null : 'sensors')}
                                            title="Sensors"
                                            className={`${styles.toolBtn} ${active ? styles.active : ''}`}
                                            style={{ '--btn-active-bg': darkModeStatus ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)' } as React.CSSProperties}
                                        ><Icon icon="Videocam" size="sm" /></button>
                                    );
                                })()}


                                {!wallDrawing.isDrawing && selectedFloor && (() => {
                                    const active = rightPanelMode === 'plan';
                                    return (
                                        <button
                                            onClick={() => setRightPanelMode(m => m === 'plan' ? null : 'plan')}
                                            title="Floor Plan"
                                            className={`${styles.toolBtn} ${active ? styles.active : ''}`}
                                            style={{ '--btn-active-bg': darkModeStatus ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)' } as React.CSSProperties}
                                        ><Icon icon="Map" size="sm" /></button>
                                    );
                                })()}


                                {!wallDrawing.isDrawing && selectedFloor && (() => {
                                    const active = linesMode;
                                    return (
                                        <button
                                            onClick={() => {
                                                const next = !linesMode;
                                                setLinesMode(next);
                                                if (next) setRightPanelMode('lines');
                                                else { setRightPanelMode(null); setSelectedLineId(null); setPlacingLine(null); }
                                            }}
                                            title="Counting Lines"
                                            className={`${styles.toolBtn} ${active ? styles.active : ''}`}
                                            style={{ '--btn-active-bg': darkModeStatus ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)' } as React.CSSProperties}
                                        ><Icon icon="Timeline" size="sm" /></button>
                                    );
                                })()}
                            </div>
                        </>
                    )}
                </div>
            </div>


            <div className={styles.layout}>
                {showSidebar && (
                    <BuildingSidebar
                        root={augmentedAreaTree}
                        selectedRegionId={selectedRegionId} selectedBuildingId={selectedBuildingId}
                        selectedFloorId={selectedFloorId} selectedAreaId={selectedAreaId}
                        occupancy={augmentedOccupancy}
                        onSelectRegion={handleSelectRegion} onSelectBuilding={handleSelectBuilding}
                        onSelectFloor={handleSelectFloor} onSelectArea={handleSelectArea}
                        onAddChild={(node) => { setAddingChildOf(node); setRightPanelMode('add_area'); }}
                        onEditNode={handleEditArea} loading={loadingTree}
                    />
                )}


                <div
                    className={`${styles.canvasWrapper} ${darkModeStatus ? styles.darkMode : styles.lightMode}`}
                    style={{ cursor: wallDrawing.isDrawing ? 'crosshair' : (sensorPlacement.isPlacing ? 'cell' : undefined) }}
                >
                    {!effectiveRoot ? (
                        <div className={styles.placeholder}>Select a Region or Building from the explorer</div>
                    ) : viewMode === 'spatial' ? (
                        <SpatialMapView
                            root={effectiveRoot} occupancy={augmentedOccupancy} sensors={augmentedSensors}
                            wallsByFloor={augmentedWallsByFloor} onSelectBuilding={handleSelectBuilding}
                            onSelectFloor={handleSelectFloor} selectedBuildingId={selectedBuildingId}
                            selectedFloorId={selectedFloorId} onSwitchTo3D={() => setViewMode('3d')}
                            lastUpdated={lastOccupancyUpdate}
                        />
                    ) : viewMode === 'isometric' ? (
                        <IsometricBuildingView
                            root={effectiveRoot} occupancy={augmentedOccupancy} sensors={augmentedSensors}
                            wallsByFloor={augmentedWallsByFloor} onSelectBuilding={handleSelectBuilding}
                            onSelectFloor={handleSelectFloor} selectedBuildingId={selectedBuildingId}
                            selectedFloorId={selectedFloorId} onSwitchTo3D={() => setViewMode('3d')}
                            lastUpdated={lastOccupancyUpdate}
                        />
                    ) : (viewMode === '3d' && isSiteLevel) ? (
                        <div className={styles.restrictedView} style={{ '--loading-bg': darkModeStatus ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' } as React.CSSProperties}>
                            <div className={styles.icon}>
                                <Icon icon="Apartment" size="xl" />
                            </div>
                            <div>
                                <h2>Site View Restricted</h2>
                                <p>Please select a specific <b>Region</b>, <b>Building</b>, or <b>Floor</b> from the explorer.</p>
                            </div>
                            <button className={styles.actionBtn} onClick={() => setViewMode('spatial')}>Switch to Spatial Overview</button>
                        </div>
                    ) : (
                        <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
                            <PerspectiveCamera makeDefault position={cameraPos} fov={45} />
                            <CameraControls ref={cameraControlsRef} makeDefault minDistance={5} maxDistance={200} dollyToCursor />
                            <ZoomOnlyWhenLocked shouldLock={isLocked} />
                            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                                <GizmoViewcube font="bold 12px Inter, sans-serif" textColor="#ffffff" color="#2a3a4a" hoverColor="#3a4a5a" strokeColor="#ffffff33" opacity={0.8} />
                            </GizmoHelper>
                            <Environment preset="night" />
                            <Suspense fallback={null}>
                                {selectedFloorId && augmentedAreaTree ? (
                                    <FloorScene
                                        floor={selectedFloor!} selectedAreaId={selectedAreaId} selectedWallId={selectedWall?.id ?? null}
                                        onWallClick={handleWallClick} onWallPatch={handlePatchWall} onEditArea={handleEditArea}
                                        showSensors={showSensors} showCountingLines={showCountingLines} occupancy={augmentedOccupancy}
                                        drawing={wallDrawing} sensorPlacement={sensorPlacement} wallsByFloor={augmentedWallsByFloor}
                                        sensors={augmentedSensors} linesMode={linesMode} selectedLineId={selectedLineId}
                                        placingLine={placingLine} onSelectLine={setSelectedLineId} onPlacingLineUpdate={setPlacingLine}
                                        onPatchCountingLine={handlePatchCountingLine}
                                    />
                                ) : selectedBuilding ? (
                                    <BuildingScene
                                        building={selectedBuilding} selectedFloorId={selectedFloorId} selectedAreaId={selectedAreaId}
                                        selectedWallId={selectedWall?.id ?? null} onFloorClick={handleSelectFloor} onWallClick={handleWallClick}
                                        onWallPatch={handlePatchWall} onEditArea={handleEditArea} showSensors={showSensors}
                                        occupancy={augmentedOccupancy} wallsByFloor={augmentedWallsByFloor} sensors={augmentedSensors}
                                        linesMode={linesMode} selectedLineId={selectedLineId} onSelectLine={setSelectedLineId}
                                        onPatchCountingLine={handlePatchCountingLine}
                                    />
                                ) : (
                                    <RegionScene
                                        buildings={regionBuildings} selectedFloorId={selectedFloorId} selectedAreaId={selectedAreaId}
                                        selectedWallId={selectedWall?.id ?? null} onFloorClick={handleSelectFloor} onWallClick={handleWallClick}
                                        onWallPatch={handlePatchWall} onEditArea={handleEditArea} showSensors={showSensors}
                                        occupancy={augmentedOccupancy} wallsByFloor={augmentedWallsByFloor} sensors={augmentedSensors}
                                        linesMode={linesMode} selectedLineId={selectedLineId} onSelectLine={setSelectedLineId}
                                        onPatchCountingLine={handlePatchCountingLine}
                                    />
                                )}
                            </Suspense>
                        </Canvas>
                    )}
                    <Loader />
                    <ConfirmationModal
                        isOpen={!!showConfirmDeleteWall} title="Delete Wall"
                        message="Are you sure you want to delete this wall? This action cannot be undone."
                        confirmText="Delete Wall" cancelText="Keep Wall" danger
                        onConfirm={async () => {
                            if (showConfirmDeleteWall) {
                                await handleDeleteWall(showConfirmDeleteWall.floorId, showConfirmDeleteWall.id);
                                setShowConfirmDeleteWall(null); setRightPanelMode(null); setSelectedWall(null);
                            }
                        }}
                        onCancel={() => setShowConfirmDeleteWall(null)}
                    />


                    {wallDrawing.isDrawing && (
                        <div style={{
                            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(240,192,64,0.15)', border: '1px solid rgba(240,192,64,0.4)',
                            borderRadius: 20, padding: '5px 18px', fontSize: 11, color: '#f0c040',
                            zIndex: 30, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none'
                        }}>
                            <Icon icon="Edit" size="xs" />
                            <span>Wall Drawing Mode</span>
                            <span style={{ opacity: 0.5, fontSize: 9 }}>Click points · Double-click to finish · ESC to cancel</span>
                        </div>
                    )}
                    {sensorPlacement.isPlacing && (
                        <div style={{
                            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(72,202,228,0.15)', border: '1px solid rgba(72,202,228,0.4)',
                            borderRadius: 20, padding: '5px 18px', fontSize: 11, color: '#48cae4',
                            zIndex: 30, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none'
                        }}>
                            <Icon icon="LocationOn" size="xs" />
                            <span>Sensor Placement Mode</span>
                            <span style={{ opacity: 0.5, fontSize: 9 }}>Click on floor to place · ESC to cancel</span>
                        </div>
                    )}


                    {placingLine && (
                        <div style={{
                            position: 'absolute', bottom: 280, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(10,16,28,0.92)', border: '1px solid rgba(244,162,97,0.4)',
                            borderRadius: 20, padding: '6px 18px', fontSize: 11, color: '#f4a261',
                            zIndex: 30, whiteSpace: 'nowrap', pointerEvents: 'none',
                            display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <Icon icon="AdsClick" size="xs" />
                            {placingLine.step === 1 ? 'Click START point' : 'Click END point'}
                            <span style={{ marginLeft: 10, opacity: 0.5, fontSize: 9 }}>ESC to cancel</span>
                        </div>
                    )}


                    <UnifiedRightPanel
                        mode={rightPanelMode} hidden={wallDrawing.isDrawing} selectedFloor={selectedFloor}
                        sensors={augmentedSensors} sensorPlacement={sensorPlacement}
                        onSaveAllPlacements={handleSaveSensorPlacements} onRemoveSensor={handleRemoveSensorPlacement}
                        onUploadPlan={handleUploadAreaPlan} onRemovePlan={handleRemoveAreaPlan}
                        addingChildOf={addingChildOf} onCreateArea={handleCreateArea}
                        onCreatedArea={(newNode) => {
                            setRightPanelMode(null); setAddingChildOf(null);
                            if (newNode.area_type === 'Floor') handleSelectFloor(newNode.id);
                        }}
                        editingArea={editingArea} onPatchArea={handlePatchArea} onDeleteArea={handleDeleteArea}
                        onAreaDeleted={handleAreaDeleted} editingWall={editingWall}
                        onSaveWall={async (w) => {
                            await handlePatchWall(selectedFloorId!, w);
                            setRightPanelMode(null); setSelectedWall(null);
                        }}
                        onDeleteWall={async (id) => setShowConfirmDeleteWall({ id, floorId: selectedFloorId! })}
                        onClose={() => {
                            setRightPanelMode(null); setAddingChildOf(null); setEditingArea(null);
                            setEditingWall(null); setSelectedWall(null); setLinesMode(false);
                            setSelectedLineId(null); setPlacingLine(null);
                        }}
                        linesMode={linesMode} selectedLineId={selectedLineId} onSelectLine={setSelectedLineId}
                        onStartPlacingLine={(sensorId, lineId) => setPlacingLine({ sensorId, lineId, step: 1 })}
                        onClearLine={handleClearCountingLine}
                        floorSensors={useMemo(() =>
                            selectedFloorId ? augmentedSensors.filter(s => s.position?.position_area_id === selectedFloorId) : [],
                            [augmentedSensors, selectedFloorId])}
                    />


                    {wallDrawing.isDrawing && (
                        <WallDrawerPanel
                            drawing={wallDrawing} subAreas={selectedFloor?.children ?? []}
                            onSaveAll={async () => {
                                if (wallDrawing.drawnWalls.length === 0) return;
                                await handleSaveWalls(selectedFloorId!, wallDrawing.drawnWalls);
                                wallDrawing.cancelDrawing();
                            }}
                        />
                    )}
                </div>
            </div>


            <Suspense fallback={null}>
                <FloorOccupancyChart
                    areaId={selectedAreaId ?? 0}
                    areaName={selectedAreaId ? (findAreaById(augmentedAreaTree!, selectedAreaId)?.name ?? 'Area') : ''}
                    visible={!!selectedAreaId && !wallDrawing.isDrawing && !sensorPlacement.isPlacing}
                    isMock={isMock} onClose={() => setSelectedAreaId(null)}
                />
            </Suspense>
        </div>
    );
};


export default ThreeDPage;


.page {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: calc(100vh - 156px);
    overflow: hidden;
    font-family: inherit;
}


.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1px solid var(--header-border, rgba(0,0,0,0.1));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 10;
    flex-shrink: 0;
    box-sizing: border-box;
}


.title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
}


.drawerBtn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--bs-border-color, rgba(0, 0, 0, 0.15));
    background: rgba(var(--bs-primary-rgb, 108, 99, 255), 0.05);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
    color: inherit;


    &:hover {
        background: rgba(var(--bs-primary-rgb, 108, 99, 255), 0.1);
        border-color: var(--accent-color, #6c63ff);
        transform: scale(1.05);
    }


    &.active {
        background: var(--accent-color, #6c63ff);
        color: #fff;
        border-color: var(--accent-color, #6c63ff);
        box-shadow: 0 0 12px rgba(108, 99, 255, 0.3);
    }
}


.titleIcon {
    font-size: 18px;
    line-height: 1;
}


.controls {
    display: flex;
    align-items: center;
    gap: 10px;
}


.viewSwitcherPill {
    display: flex;
    background: var(--input-bg);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
    border: 1px solid var(--input-border);
}


.viewBtn {
    border: none;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    padding: 4px 10px;
    border-radius: 6px;
    color: var(--text-primary);
    opacity: 0.6;


    &:hover:not(.disabled) {
        opacity: 0.85;
    }


    &.active {
        background: var(--btn-active-bg, rgba(255, 255, 255, 0.95));
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        font-weight: 700;
        opacity: 1;
    }


    &.disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
}


.modeToggleBtn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    font-weight: 600;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}


.toolPill {
    display: flex;
    background: var(--input-bg);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
    border: 1px solid var(--input-border);
}


.toolBtn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: transparent;
    opacity: 0.6;
    color: var(--text-primary);


    &:hover:not(.disabled) {
        opacity: 0.85;
    }


    &.active {
        background: var(--btn-active-bg, rgba(255, 255, 255, 0.95));
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        opacity: 1;
    }


    &.drawActive {
        background: #f0c040;
        box-shadow: 0 1px 4px rgba(240, 192, 64, 0.4);
        opacity: 1;
        color: #000;
    }


    &.disabled {
        opacity: 0.25;
        cursor: not-allowed;
    }
}


.divider {
    width: 1px;
    height: 20px;
    background: var(--header-border, rgba(255, 255, 255, 0.1));
    margin: 0 5px;
}


.layout {
    display: flex;
    flex: 1;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    position: relative;
}


.canvasWrapper {
    flex: 1;
    min-width: 0;
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    transition: background 0.6s cubic-bezier(0.4, 0, 0.2, 1);


    &.lightMode {
        background: radial-gradient(circle at 50% 50%, #fafbfc 0%, #e9edf3 100%);
    }


    &.darkMode {
        background: radial-gradient(circle at 50% 50%, #343a46 0%, #1c2128 100%);
    }
}


.placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 14px;
    text-align: center;
    padding: 20px;
}


.restrictedView {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    gap: 20px;
    background: var(--loading-bg, rgba(0,0,0,0.02));
    padding: 40px;
    text-align: center;


    .icon {
        font-size: 64px;
        opacity: 0.6;
    }


    h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--text-primary);
    }


    p {
        margin: 0;
        font-size: 15px;
    }


    .actionBtn {
        margin-top: 10px;
        padding: 10px 24px;
        border-radius: 30px;
        border: none;
        background: #6c63ff;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
        transition: transform 0.2s;


        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(108, 99, 255, 0.4);
        }
    }
}





AddAreaPanel.module.scss
.panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 320px;
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    padding: 20px;
    z-index: 1000;
    color: var(--text-primary);
    box-shadow: var(--panel-shadow);
}


.panelHeaderless {
    color: var(--text-primary);
}


.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}


.title {
    margin: 0;
    font-size: 18px;
}


.closeButton {
    background: none;
    border: none;
    color: #ff6b6b;
    cursor: pointer;
    font-size: 20px;
}


.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}


.section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}


.label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
}


.typeSelector {
    display: flex;
    background: var(--input-bg);
    padding: 3px;
    border-radius: 8px;
    border: 1px solid var(--input-border);
}


.typeButton {
    flex: 1;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;


    &.active {
        background: rgba(72, 202, 228, 0.2);
        color: var(--accent-color);
    }
}


.row {
    display: flex;
    flex-direction: column;
    gap: 4px;
}


.rowHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
}


.rowLabel {
    color: var(--text-secondary);
    font-size: 11px;
}


.rowHelp {
    font-size: 9px;
    color: var(--text-muted);
    font-style: italic;
}


.input {
    background: var(--input-bg);
    color: var(--text-primary);
    border: 1px solid var(--input-border);
    border-radius: 5px;
    padding: 4px 8px;
    font-size: 11px;
    width: 100%;


    &:focus {
        outline: none;
        border-color: #48cae4;
    }
}


.inputSmall {
    @extend .input;
    width: 60px;
}


.inputMedium {
    @extend .input;
    width: 80px;
}


.autoButton {
    background: none;
    border: none;
    color: var(--accent-color);
    font-size: 9px;
    cursor: pointer;
}


.flexRow {
    display: flex;
    gap: 8px;
}


.error {
    padding: 8px 14px;
    background: rgba(230, 57, 70, 0.1);
    color: #e63946;
    font-size: 10px;
    border-top: 1px solid rgba(230, 57, 70, 0.2);
    margin-top: 14px;
}


.footer {
    padding-top: 20px;
    border-top: 1px solid var(--header-border);
    margin-top: 20px;
    display: flex;
    gap: 8px;
}


.buttonBase {
    padding: 7px 0;
    font-size: 11px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;


    &:disabled {
        cursor: default;
    }
}


.cancelButton {
    @extend .buttonBase;
    flex: 1;
    font-weight: 600;
    background: var(--badge-bg);
    color: var(--text-secondary);
    border: 1px solid var(--input-border);
}


.createButton {
    @extend .buttonBase;
    flex: 2;
    font-weight: 700;
    background: rgba(72, 202, 228, 0.15);
    color: var(--accent-color);
    border: 1px solid rgba(72, 202, 228, 0.5);


    &:disabled {
        background: rgba(72, 202, 228, 0.06);
        color: rgba(72, 202, 228, 0.5);
    }
}


.uploaderPanel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 320px;
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    padding: 20px;
    z-index: 1000;
    color: var(--text-primary);
    box-shadow: var(--panel-shadow);


    &.headerless {
        position: static;
        width: 100%;
        background: transparent;
        border: none;
        padding: 0;
        box-shadow: none;
    }
}


.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;


    h3 {
        margin: 0;
        font-size: 18px;
    }
}


.closeBtn {
    background: none;
    border: none;
    color: #ff6b6b;
    cursor: pointer;
    font-size: 20px;
}


.content {
    display: flex;
    flex-direction: column;
    gap: 14px;
}


.currentPlanSection {
    display: flex;
    flex-direction: column;
    gap: 8px;
}


.currentPlanImg {
    width: 100%;
    height: 90px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--header-border);
}


.fileInfoRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
}


.fileName {
    font-size: 10px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
}


.removeBtn {
    background: transparent;
    border: 1px solid var(--error-border);
    color: #e63946;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 10px;
    cursor: pointer;
    transition: opacity 0.2s;


    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
}


.uploadSection {
    display: flex;
    flex-direction: column;
    gap: 8px;
}


.sectionLabel {
    font-size: 9px;
    font-weight: 700;
    color: var(--accent-blue);
    letter-spacing: 0.05em;
}


.dropzone {
    border: 1px dashed var(--input-border);
    border-radius: 8px;
    padding: 20px 10px;
    background: var(--input-bg);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all 0.2s ease;


    &.isDragging {
        border-color: var(--accent-blue);
        background: var(--dropzone-dragging-bg);
    }
}


.dropIcon {
    font-size: 24px;
    opacity: 0.5;
    margin-bottom: 4px;
}


.dropText {
    font-size: 11px;
    color: var(--text-secondary);
}


.dropSubtext {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 2px;
}


.selectedFileContainer {
    display: flex;
    flex-direction: column;
    gap: 10px;
}


.selectedFileInfo {
    font-size: 10px;
    display: flex;
    justify-content: space-between;
}


.selectedFileSize {
    color: var(--text-muted);
}


.previewImg {
    width: 100%;
    height: 70px;
    object-fit: cover;
    border-radius: 6px;
}


.buttonRow {
    display: flex;
    gap: 6px;
}


.uploadBtn {
    flex: 2;
    background: var(--upload-btn-bg);
    color: var(--accent-blue);
    border: 1px solid var(--upload-btn-border);
    border-radius: 7px;
    padding: 7px 0;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;


    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}


.cancelUploadBtn {
    flex: 1;
    background: none;
    border: 1px solid var(--input-border);
    color: var(--text-secondary);
    font-size: 10px;
    cursor: pointer;
    border-radius: 7px;
}


.errorMessage {
    color: #e63946;
    font-size: 10px;
    text-align: center;
    margin-top: 4px;
}


.successMessage {
    color: #52b788;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    margin-top: 4px;
}


.sidebar {
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;


    /* Scrollbar */
     ::-webkit-scrollbar { width: 3px; }
     ::-webkit-scrollbar-track { background: transparent; }
     ::-webkit-scrollbar-thumb {
        background: var(--scroll-thumb);
        border-radius: 2px;
    }
}


.header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 14px 10px;
    border-bottom: 1px solid var(--header-border);
    background: var(--header-bg);
    flex-shrink: 0;
    box-sizing: border-box;
}


.explorerIconWrapper {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}


.headerTitle {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}


.body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 5px 0 16px;
    box-sizing: border-box;
    min-width: 0;
}


.emptyState {
    padding: 32px 16px;
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.8;
}


.row {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
    min-width: 0;
    height: 34px;
    gap: 0;
    cursor: pointer;
    user-select: none;
    position: relative;
    transition: background 0.13s;


    &:hover {
        background: var(--row-hover) !important;


        .actions {
            opacity: 1;
        }
    }


    &.selected {
        background: var(--row-active);
    }
}


.indentLine {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--indent-line);
    pointer-events: none;
}


.chevronWrapper {
    width: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 3px;
}


.iconWrapper {
    width: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 5px;
}


.name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0.01em;
}


.badge {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--badge-bg);
    color: var(--badge-text);
    flex-shrink: 0;
    margin-left: 4px;
    letter-spacing: 0.05em;
    white-space: nowrap;
}


.occWrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 5px;
}


.occCount {
    font-size: 9px;
    font-weight: 600;
    min-width: 26px;
    text-align: right;
    white-space: nowrap;
    letter-spacing: 0.02em;
}


.occBar {
    width: 36px;
    height: 3px;
    border-radius: 2px;
    background: var(--bar-track);
    flex-shrink: 0;
    overflow: hidden;
}


.occBarFill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s cubic-bezier(.4, 0, .2, 1);
}


.actions {
    display: flex;
    gap: 1px;
    flex-shrink: 0;
    width: 40px;
    justify-content: flex-end;
    margin-left: 2px;
    opacity: 0;
    transition: opacity 0.15s;
}


.btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--btn-color);
    cursor: pointer;
    flex-shrink: 0;


    &:hover {
        background: var(--btn-hover-bg) !important;
        color: var(--btn-hover-color) !important;
    }
}


.btnAdd {
    @extend .btn;


    &:hover {
        background: var(--btn-add-hover-bg) !important;
        color: #6366f1 !important;
    }
}


.panelContent {
    color: var(--text-primary);
}


.readOnlySection {
    padding: 14px 12px;
}


.warningBox {
    background: var(--warning-bg);
    border: 1px solid var(--warning-border);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
}


.warningTitle {
    color: var(--accent-orange);
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 4px;
}


.warningText {
    color: var(--text-secondary);
    font-size: 10px;
    line-height: 1.6;
}


.readOnlyLabel {
    font-size: 10px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
}


.readOnlyRow {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid var(--header-border);
    font-size: 11px;
}


.readOnlyKey {
    color: var(--text-muted);
}


.readOnlyValue {
    color: var(--text-primary);
}


.errorBox {
    background: var(--error-bg);
    border: 1px solid var(--error-border);
    color: var(--error-text);
    padding: 8px;
    border-radius: 6px;
    font-size: 11px;
    margin-bottom: 16px;
}


.section {
    margin-bottom: 12px;
}


.label {
    display: block;
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 5px;
    font-weight: 500;
}


.hint {
    float: right;
    color: var(--accent-blue);
}


.subHint {
    font-size: 9px;
    color: var(--text-muted);
    margin-top: 3px;
}


.input {
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 6px;
    color: var(--text-primary);
    padding: 6px 10px;
    font-size: 12px;
    width: 100%;
    outline: none;
    transition: all 0.2s;


    &:focus {
        border-color: rgba(72, 202, 228, 0.5);
        background: var(--input-focus-bg);
    }
}


.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}


.header {
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--text-muted);
    text-transform: uppercase;
    margin: 20px 0 10px;
    border-bottom: 1px solid var(--header-border);
    padding-bottom: 4px;
}


.autoBtn {
    float: right;
    background: var(--badge-bg);
    border: 1px solid var(--input-border);
    color: var(--text-secondary);
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    cursor: pointer;


    &:hover {
        background: rgba(72, 202, 228, 0.2);
        color: var(--auto-btn-hover-text);
    }
}


.actions {
    margin-top: 24px;
}


.saveBtn {
    background: rgba(72, 202, 228, 0.15);
    color: var(--accent-blue);
    border: 1px solid rgba(72, 202, 228, 0.4);
    border-radius: 8px;
    padding: 8px 0;
    width: 100%;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;


    &:hover:not(:disabled) {
        background: rgba(72, 202, 228, 0.25);
    }


    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}


.deleteBtn {
    background: transparent;
    color: var(--delete-btn-text);
    border: 1px solid rgba(230, 57, 70, 0.2);
    border-radius: 8px;
    padding: 7px 0;
    width: 100%;
    font-size: 11px;
    cursor: pointer;
    margin-top: 10px;


    &:hover:not(:disabled) {
        background: rgba(230, 57, 70, 0.05);
        color: #e63946;
    }
}


.deleteConfirm {
    margin-top: 12px;
    background: var(--error-bg);
    border: 1px solid var(--error-border);
    padding: 10px;
    border-radius: 8px;
}


.deleteWarn {
    font-size: 10px;
    color: var(--text-secondary);
    margin-bottom: 10px;
    line-height: 1.4;
}


.deleteRow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}


.confirmBtn {
    background: #e63946;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 0;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
}


.cancelBtn {
    background: var(--badge-bg);
    color: var(--text-primary);
    border: none;
    border-radius: 6px;
    padding: 6px 0;
    font-size: 11px;
    cursor: pointer;
}


.container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 260px;
    opacity: 1;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--panel-bg-gradient);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--panel-border-subtle);
    box-shadow: var(--panel-top-shadow);
    z-index: 20;
    overflow: hidden;
    color: var(--text-primary);


    &.collapsed {
        height: 36px;
    }


    &.hidden {
        height: 0;
        opacity: 0;
        pointer-events: none;
    }
}


.header {
    height: 36px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid var(--header-border-subtle);
}


.titleGroup {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;


    .icon {
        font-size: 14px;
    }


    .title {
        font-size: 13px;
        font-weight: 600;
        color: inherit;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}


.liveIndicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #52b788;
    animation: pulse-green 2s infinite;
}


.demoBadge {
    background: var(--demo-badge-bg);
    border: 1px solid var(--demo-badge-border);
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 9px;
    color: #f0c040;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
    flex-shrink: 0;
}


.tabs {
    display: flex;
    gap: 20px;
    flex: 1;
    justify-content: center;
}


.tabButton {
    background: none;
    border: none;
    padding: 8px 0;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;
    color: var(--text-muted);
    border-bottom: 2px solid transparent;


    &.active {
        color: var(--text-primary);
        border-bottom-color: var(--accent-blue);
    }
}


.controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    justify-content: flex-end;
}


.legend {
    display: flex;
    gap: 12px;


    .legendItem {
        display: flex;
        align-items: center;
        gap: 5px;


        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }


        .label {
            font-size: 10px;
            opacity: 0.6;
        }
    }
}


.updateTime {
    font-size: 10px;
    opacity: 0.3;
    min-width: 90px;
    text-align: right;
}


.actionButton {
    background: var(--btn-secondary-bg);
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: all 0.2s;


    &:hover {
        opacity: 1;
        background: var(--btn-secondary-hover-bg);
    }
}


.chartArea {
    padding: 10px 20px;
    transition: opacity 0.2s ease;


    &.collapsed {
        opacity: 0;
        pointer-events: none;
    }
}


.emptyState {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 185px;
    gap: 8px;
    opacity: 0.5;


    .icon {
        font-size: 28px;
    }


    .title {
        font-size: 13px;
        font-weight: 500;
    }


    .subtitle {
        font-size: 11px;
    }
}


.loadingArea {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 185px;


    .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--spinner-track);
        border-top-color: var(--accent-blue);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
}


@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse-green { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }


.container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px 24px;
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--text-primary);
  position: relative;
}


.loading {
  padding: 32px;
  font-size: 13px;
  color: var(--text-muted);
  font-family: system-ui, sans-serif;
}


.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;


  .titleGroup {
    display: flex;
    align-items: center;
    gap: 8px;


    .title {
      font-size: 15px;
      font-weight: 700;
    }


    .badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
      background: var(--badge-bg);
      color: var(--badge-text);
    }
  }


  .legend {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 10px;
    color: var(--text-dim);


    .legendItem {
      display: flex;
      align-items: center;
      gap: 4px;


      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
    }
  }
}


.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
  gap: 16px;
}


// BuildingCard
.buildingCard {
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: border-color 0.2s, box-shadow 0.2s;
  animation: iso-rise-anim 0.35s ease both;
  position: relative;


  .cardHeader {
    padding: 11px 13px 9px;
    border-bottom: var(--divider-border);


    .topLine {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;


      .info {
        min-width: 0;
        flex: 1;


        .nameLine {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 3px;
          flex-wrap: wrap;


          .name {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-primary);
          }


          .floorCount {
            font-size: 8px;
            font-weight: 600;
            padding: 1px 5px;
            border-radius: 4px;
            background: var(--tag-bg);
            color: var(--tag-text);
          }


          .megaTag {
            font-size: 8px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
            background: rgba(129, 140, 248, 0.12);
            color: #818cf8;
            border: 0.5px solid rgba(129, 140, 248, 0.3);
          }


          .alertTag {
            font-size: 8px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
            border: 0.5px solid rgba(239, 68, 68, 0.28);
            animation: iso-pulse-anim 1.8s ease-in-out infinite;
          }
        }


        .metaLine {
          font-size: 10px;
          color: var(--text-dim);
          font-weight: 500;


          .megaNote {
            margin-left: 6px;
            color: var(--accent-text);
          }
        }
      }


      .statsBox {
        text-align: right;
        flex-shrink: 0;
        margin-left: 12px;


        .pct {
          font-size: 19px;
          font-weight: 800;
          line-height: 1;
        }


        .abs {
          font-size: 10px;
          color: var(--text-dim);
          margin-top: 1px;
        }
      }
    }


    .miniProgress {
      height: 2px;
      border-radius: 1px;
      background: var(--progress-bg);
      overflow: hidden;
      margin-top: 8px;


      .fill {
        height: 100%;
        border-radius: 1px;
        transition: width 0.8s cubic-bezier(.4, 0, .2, 1);
      }
    }
  }


  .cardBody {
    display: flex;
    min-width: 0;
    overflow: hidden;


    .stackContainer {
      flex-shrink: 0;
      border-right: var(--divider-border);
      display: flex;
      max-height: 360px;
      overflow-y: auto;
      scrollbar-width: thin;


      &.mega {
        padding: 10px 6px 10px 10px;
        align-items: flex-start;
        width: 96px;
      }


      &.normal {
        padding: 12px 8px 12px 12px;
        align-items: flex-end;
        width: auto;
      }
    }
  }


  .cardFooter {
    padding: 7px 13px;
    border-top: var(--divider-border);
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;


    .viewBtn {
      font-size: 10px;
      font-weight: 600;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px 0;
      transition: color 0.15s;
      color: var(--text-dim);


      &:hover {
        color: var(--text-primary);
      }
    }
  }
}


// AnalyticsPanel
.analyticsPanel {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
  min-width: 0;
  border-left: var(--divider-border);
  padding: 10px 11px;
  overflow-y: auto;
  max-height: 360px;
  scrollbar-width: thin;


  .section {
    background: var(--panel-bg);
    border-radius: 7px;
    padding: 8px 9px;
    border: var(--divider-border);


    .sectionHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 7px;


      .sectionLabel {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-dim);
      }


      .subNote {
        font-size: 8px;
        color: var(--text-dim-extra);
      }
    }


    .sectionBody {
      display: flex;
      align-items: center;
      gap: 9px;


      .statsList {
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
        min-width: 0;


        .statItem {
          display: flex;
          justify-content: space-between;
          gap: 6px;


          .label {
            font-size: 8.5px;
            color: var(--text-dim);
          }


          .val {
            font-size: 8.5px;
            font-weight: 700;
          }
        }
      }
    }


    .legend {
      display: flex;
      gap: 4px;
      align-items: center;
      margin-bottom: 6px;


      .legendItem {
        display: flex;
        align-items: center;
        gap: 2px;


        .dot {
          width: 5px;
          height: 5px;
          border-radius: 1px;
          opacity: 0.75;
        }


        .label {
          font-size: 7px;
          color: var(--text-dim-extra);
        }
      }
    }


    .footnote {
      font-size: 7px;
      color: var(--text-dim-extra);
      margin-top: 5px;
    }
  }
}


// FloorDetail
.floorDetail {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--overlay-bg);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: iso-rise-anim 0.18s ease;


  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;


    .info {
      .name {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .sub {
        font-size: 9px;
        color: var(--text-dim);
        margin-top: 2px;
      }
    }


    .closeBtn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-dim);
      line-height: 1;
      padding: 2px 6px;
    }
  }


  .progressBar {
    height: 3px;
    border-radius: 2px;
    background: var(--progress-bg);
    overflow: hidden;


    .fill {
      height: 100%;
      transition: width 0.6s ease;
    }
  }


  .areasGrid {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-content: flex-start;


    .emptyState {
      font-size: 10px;
      color: var(--text-dim-extra);
      padding: 8px 0;
    }


    .areaItem {
      width: 52px;
      height: 52px;
      border-radius: 6px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 3px 4px;


      .fillBar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        transition: height 0.6s ease;
      }


      .info {
        position: relative;
        z-index: 1;


        .pct {
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }


        .name {
          font-size: 7px;
          color: var(--text-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 44px;
          margin-top: 1px;
          line-height: 1.2;
        }


        .abs {
          font-size: 6.5px;
          color: var(--text-dim-extra);
          margin-top: 1px;
        }
      }
    }
  }
}


// Tooltip
.tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: var(--tooltip-bg);
  border: var(--tooltip-border);
  border-radius: 10px;
  padding: 10px 13px;
  min-width: 160px;
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.18);
  animation: iso-rise-anim 0.12s ease;


  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;


    .name {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-primary);
      max-width: 118px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }


    .status {
      font-size: 8px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      margin-left: 6px;
    }
  }


  .divider {
    height: 0.5px;
    background: var(--divider-border-color);
    margin-bottom: 6px;
  }


  .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 10.5px;
    margin-top: 3px;


    .label {
      color: var(--text-dim);
    }


    .val {
      font-weight: 600;
    }
  }


  .progressBar {
    margin-top: 8px;
    height: 3px;
    border-radius: 2px;
    background: var(--progress-bg);
    overflow: hidden;


    .fill {
      height: 100%;
    }
  }
}


// FloorBarChart
.floorBarChart {
  width: 100%;
  scrollbar-width: thin;


  .barRow {
    display: flex;
    align-items: center;
    gap: 4px;


    .label {
      flex-shrink: 0;
      text-align: right;
      font-size: 7.5px;
      font-weight: 700;
      color: var(--text-dim);
    }


    .track {
      flex: 1;
      min-width: 0;
      border-radius: 3px;
      overflow: hidden;
      background: var(--progress-bg);


      .fill {
        height: 100%;
        opacity: 0.8;
        border-radius: 3px;
        transition: width 0.6s cubic-bezier(.4, 0, .2, 1);
      }
    }


    .pctLabel {
      flex-shrink: 0;
      font-size: 7.5px;
      font-weight: 700;
      text-align: right;
    }
  }
}


// HeatmapChart
.heatmapContainer {
  overflow-x: auto;
  width: 100%;


  .heatmapSvg {
    display: block;
    overflow: visible;
  }
}


// MiniFloorStack
.miniFloorStack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 76px;


  .floorItem {
    display: flex;
    align-items: center;
    gap: 3px;
    cursor: pointer;
    border-radius: 3px;
    padding: 1px 3px;
    transition: background 0.12s;


    .levelLabel {
      font-size: 7px;
      font-weight: 700;
      width: 18px;
      flex-shrink: 0;
      text-align: right;
      color: var(--text-dim);
    }


    .track {
      flex: 1;
      height: 7px;
      border-radius: 2px;
      overflow: hidden;
      background: var(--progress-bg);


      .fill {
        height: 100%;
        opacity: 0.82;
        border-radius: 2px;
        transition: width 0.5s cubic-bezier(.4, 0, .2, 1);
      }
    }


    .pctLabel {
      font-size: 6.5px;
      font-weight: 700;
      width: 18px;
      flex-shrink: 0;
      text-align: right;
    }
  }
}


@keyframes iso-rise-anim {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


@keyframes iso-pulse-anim {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}


.panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    background: var(--panel-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-left: var(--panel-border);
    z-index: 25;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}


.hidden {
    transform: translateX(300px);
    opacity: 0;
    transition: none;
    pointer-events: none;
}


.visible {
    transform: translateX(0);
    opacity: 1;
}


.header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 14px 10px;
    border-bottom: 1px solid var(--header-border);
    background: var(--header-bg);
    flex-shrink: 0;
    box-sizing: border-box;
    position: relative;
}


.iconWrapper {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}


.titleWrapper {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
}


.title {
    font-weight: 700;
    font-size: 13px;
    color: var(--text-primary);
    letter-spacing: 0.01em;
}


.subtitle {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}


.closeButton {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    margin-left: 4px;


    &:hover {
        color: var(--text-primary);
    }
}


.body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 14px;
}


.sensorGroup {
    padding: 8px 0;
}


.emptyState {
    padding: 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 11px;
}


.sensorRow {
    margin-bottom: 8px;
}


.sensorHeader {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-bottom: 1px solid var(--header-border);
    font-size: 10px;
}


.statusDot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}


.sensorName {
    flex: 1;
    color: var(--text-secondary);
}


.lineCount {
    color: var(--text-muted);
    font-size: 9px;
}


.lineItem {
    margin: 3px 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    background: var(--input-bg);
    border: 1px solid var(--input-border);


    &.selected {
        background: rgba(72, 202, 228, 0.10);
        border: 1px solid rgba(72, 202, 228, 0.25);
    }
}


.lineMain {
    display: flex;
    align-items: center;
    gap: 5px;
}


.lineDot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
}


.lineName {
    flex: 1;
    font-size: 10px;
}


.statusBadge {
    font-size: 8px;
    padding: 1px 5px;
    border-radius: 3px;
}


.statusBadgeSet {
    @extend .statusBadge;
    background: rgba(82, 183, 136, 0.12);
    color: #52b788;
    border: 1px solid rgba(82, 183, 136, 0.25);
}


.statusBadgeUnset {
    @extend .statusBadge;
    background: rgba(244, 162, 97, 0.12);
    color: #f4a261;
    border: 1px solid rgba(244, 162, 97, 0.25);
}


.lineActions {
    margin-top: 6px;
    display: flex;
    gap: 6px;
}


.actionButton {
    flex: 1;
    border-radius: 5px;
    font-size: 9px;
    padding: 4px 0;
    cursor: pointer;
}


.buttonPlace {
    @extend .actionButton;
    background: rgba(72, 202, 228, 0.08);
    border: 1px solid rgba(72, 202, 228, 0.25);
    color: #48cae4;
}


.buttonUnset {
    @extend .actionButton;
    background: rgba(230, 57, 70, 0.08);
    border: 1px solid rgba(230, 57, 70, 0.25);
    color: #e63946;
}


.lineCoords {
    font-size: 8px;
    color: var(--text-muted);
    margin-top: 2px;
}


.directionGroup {
    margin-top: 5px;
    font-size: 9px;
}


.directionFollowing {
    color: #52b788;
}


.directionOpposite {
    color: #e63946;
}


.placeButtonFull {
    margin-top: 5px;
    width: 100%;
    background: rgba(244, 162, 97, 0.08);
    border: 1px solid rgba(244, 162, 97, 0.25);
    border-radius: 5px;
    color: #f4a261;
    font-size: 9px;
    padding: 3px 0;
    cursor: pointer;
}


.panelEmptyState {
    padding: 16px;
    color: var(--text-muted);
    font-size: 11px;
    text-align: center;
}


.panel {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 220px;
    background: var(--panel-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    overflow: hidden;
    z-index: 26;
    box-shadow: var(--panel-shadow);
    color: var(--text-primary);
    font-size: 12px;
    display: flex;
    flex-direction: column;


    &.embedded {
        position: static;
        width: 100%;
        background: transparent;
        backdrop-filter: none;
        border: none;
        box-shadow: none;
        padding: 0;
    }
}


.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--header-border);
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
}


.headerTitle {
    .editIcon {
        color: var(--accent-orange);
    }


    .wallId {
        color: var(--text-muted);
        font-weight: 400;
        font-size: 11px;
    }
}


.closeBtn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    line-height: 1;
}


.body {
    overflow-y: auto;
    max-height: 450px;
    display: flex;
    flex-direction: column;
    gap: 0;
}


.section {
    padding: 8px 14px;
    border-bottom: 1px solid var(--header-border);


    &.properties {
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 9px;
    }


    &.noBorder {
        border-bottom: none;
    }
}


.label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
    margin-bottom: 6px;


    &.mini {
        font-size: 8px;
        margin-bottom: 2px;
    }
}


.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    background: var(--badge-bg);
    border: 1px solid var(--input-border);
    color: var(--text-secondary);
    text-transform: capitalize;
}


.row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;


    .rowLabel {
        color: var(--text-secondary);
    }
}


.input {
    background: var(--input-bg);
    color: var(--text-primary);
    border: 1px solid var(--input-border);
    border-radius: 5px;
    padding: 3px 6px;
    font-size: 11px;
    width: 90px;
    outline: none;


    &:focus {
        border-color: var(--accent-blue);
    }
}


.colorPickerRow {
    display: flex;
    gap: 6px;
    align-items: center;


    .colorInput {
        background: none;
        border: none;
        padding: 0;
        width: 26px;
        height: 26px;
        cursor: pointer;
    }


    .colorText {
        font-family: monospace;
        font-size: 10px;
        color: var(--text-secondary);
    }
}


.sliderRow {
    display: flex;
    gap: 5px;
    align-items: center;


    .slider {
        width: 60px;
        accent-color: var(--accent-orange);
    }


    .sliderValue {
        font-family: monospace;
        font-size: 10px;
        width: 28px;
        text-align: right;
        color: var(--text-secondary);
    }
}


.bezierPointContainer {
    display: flex;
    gap: 8px;
}


.bezierPoint {
    display: flex;
    flex-direction: column;
    gap: 2px;
}


.readonly {
    font-family: monospace;
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--badge-bg);
    border-radius: 4px;
    padding: 2px 5px;
}


.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
}


.errorDisplay {
    padding: 6px 14px;
    color: #e63946;
    font-size: 10px;
    background: var(--error-bg);
    border-top: 1px solid var(--error-border);
}


.footer {
    border-top: 1px solid var(--header-border);
    padding: 8px 12px;
    display: flex;
    gap: 6px;
    flex-shrink: 0;


    &.embedded {
        padding: 12px 0 0 0;
    }
}


.cancelBtn {
    flex: 1;
    padding: 5px 0;
    font-size: 11px;
    font-weight: 600;
    background: var(--badge-bg);
    color: var(--text-secondary);
    border: 1px solid var(--input-border);
    border-radius: 6px;
    cursor: pointer;
    transition: opacity 0.2s;


    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
}


.deleteBtn {
    padding: 5px 8px;
    font-size: 11px;
    background: var(--error-bg);
    color: #e63946;
    border: 1px solid var(--error-border);
    border-radius: 6px;
    cursor: pointer;
    transition: opacity 0.2s;


    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
}


.saveBtn {
    flex: 2;
    padding: 5px 0;
    font-size: 11px;
    font-weight: 700;
    background: var(--save-btn-bg);
    color: var(--accent-blue);
    border: 1px solid var(--save-btn-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;


    &:disabled {
        background: var(--save-btn-disabled-bg);
        color: var(--save-btn-disabled-text);
        cursor: default;
    }
}


.panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    background: var(--panel-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-left: 1px solid var(--panel-border);
    overflow: hidden;
    z-index: 25;
    font-family: inherit;
    color: var(--text-primary);
    font-size: 12px;
    display: flex;
    flex-direction: column;
}


.header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 14px 10px;
    border-bottom: 1px solid var(--header-border);
    background: var(--header-bg);
    flex-shrink: 0;
    box-sizing: border-box;
}


.iconWrapper {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    flex-shrink: 0;
    background: rgba(240, 192, 64, 0.15);
    border: 1px solid rgba(240, 192, 64, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;


    svg {
        color: #f0c040;
    }
}


.title {
    font-weight: 700;
    font-size: 13px;
    flex: 1;
    color: var(--text-primary);
    letter-spacing: 0.01em;
}


.closeButton {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    line-height: 1;
}


.body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
}


.successIndicator {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(82, 183, 136, 0.3);
    background: rgba(82, 183, 136, 0.1);
}


.successTitle {
    color: #52b788;
    font-size: 10px;
    margin-bottom: 8px;
    font-weight: 700;
}


.successHelp {
    color: var(--text-muted);
    font-size: 10px;
    margin-top: 2px;
}


.section {
    padding: 8px 14px;
    border-bottom: 1px solid var(--header-border);
}


.sectionTitle {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
    margin-bottom: 8px;
}


.modeToggle {
    display: flex;
    gap: 6px;
}


.modeButton {
    flex: 1;
    padding: 5px 0;
    font-size: 11px;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: var(--input-bg);
    color: var(--text-secondary);
    border: 1px solid var(--input-border);


    &.active {
        background: rgba(240, 192, 64, 0.18);
        color: #f0c040;
        border: 1px solid #f0c040;
    }
}


.settingsSection {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}


.settingsList {
    display: flex;
    flex-direction: column;
    gap: 8px;
}


.settingRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
}


.settingLabel {
    color: var(--text-secondary);
}


.settingLabelHighlight {
    color: rgba(240, 192, 64, 0.85);
    font-weight: 700;
}


.input {
    background: var(--input-bg);
    color: var(--text-primary);
    border: 1px solid var(--input-border);
    border-radius: 5px;
    padding: 3px 6px;
    font-size: 11px;
    width: 110px;
    outline: none;


    &:focus {
        border-color: var(--accent-orange);
    }
}


.inputSmall {
    background: var(--input-bg);
    color: var(--text-primary);
    border: 1px solid var(--input-border);
    border-radius: 5px;
    padding: 3px 6px;
    font-size: 11px;
    outline: none;
    width: 80px;


    &:focus {
        border-color: var(--accent-orange);
    }
}


.inputHighlight {
    background: rgba(240,192,64,0.1);
    color: #f0c040;
    border: 1px solid rgba(240,192,64,0.3);
    border-radius: 5px;
    padding: 3px 6px;
    font-size: 11px;
    outline: none;
    width: 110px;


    &:focus {
        border-color: #f0c040;
    }
}


.colorPickerGroup {
    display: flex;
    gap: 6px;
    align-items: center;
}


.colorPicker {
    background: none;
    border: none;
    padding: 0;
    width: 24px;
    height: 24px;
    cursor: pointer;
}


.opacitySlider {
    width: 64px;
    accent-color: #f0c040;
}


.anchorSection {
    padding: 8px 14px;
    border-bottom: 1px solid var(--header-border);
}


.anchorHelp {
    color: var(--text-muted);
    font-style: italic;
    font-size: 11px;
}


.anchorHighlight {
    color: #f0c040;
    font-style: italic;
    font-size: 11px;
}


.anchorRow {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    background: var(--input-bg);
    border-radius: 5px;
    font-size: 11px;
    border: 1px solid var(--input-border);
}


.anchorLabel {
    color: var(--text-secondary);
}


.anchorValue {
    font-family: monospace;
    color: #f0c040;
    font-weight: 600;
}


.previewRow {
    display: flex;
    justify-content: space-between;
    padding: 3px 8px;
    font-size: 11px;
    font-style: italic;
}


.previewLabel {
    color: var(--text-muted);
}


.previewValue {
    font-family: monospace;
    color: var(--text-muted);
}


.footer {
    border-top: 1px solid var(--header-border);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
}


.buttonRow {
    display: flex;
    gap: 6px;
}


.footerButton {
    flex: 1;
    padding: 6px 0;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    transition: all 0.2s;
    cursor: pointer;


    &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
    }
}


.undoButton {
    flex: 1;
    padding: 6px 0;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    transition: all 0.2s;
    cursor: pointer;
    background: var(--badge-bg);
    color: var(--text-primary);
    border: 1px solid var(--input-border);


    &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
    }
}


.clearButton {
    flex: 1;
    padding: 6px 0;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    transition: all 0.2s;
    cursor: pointer;
    background: rgba(230, 57, 70, 0.12);
    color: #e63946;
    border: 1px solid rgba(230, 57, 70, 0.3);


    &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
    }
}


.closeButtonAction {
    padding: 5px 0;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    transition: all 0.2s ease;
    cursor: pointer;
    background: rgba(82, 183, 136, 0.15);
    color: #52b788;
    border: 1px solid #52b788;


    &:disabled {
        background: transparent;
        color: rgba(255, 255, 255, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: not-allowed;
    }
}


.saveButton {
    padding: 6px 0;
    font-size: 11px;
    font-weight: 700;
    border-radius: 7px;
    cursor: pointer;
    background: rgba(72, 202, 228, 0.15);
    color: #48cae4;
    border: 1px solid #48cae4;


    &:disabled {
        background: transparent;
        color: var(--text-muted);
        border: 1px solid var(--input-border);
        cursor: not-allowed;
    }
}


import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchAreaTree, fetchSensors, fetchOccupancy,
    fetchWallsForFloor, saveWalls, patchWall, deleteWall, resetWalls,
    placeSensor, patchCountingLine, createArea,
    uploadAreaPlan, removeAreaPlan,
    patchArea, deleteArea, patchWallPartial, removeSensorPlacement,
    clearCountingLine,
} from '../services/threeD/api';
import { AreaNode, AreaWall, SensorNode, OccupancySnapshot, MountType } from '../utils/threeD/types';


export interface ThreeDData {
    // Data
    areaTree: AreaNode | null;
    sensors: SensorNode[];
    occupancy: OccupancySnapshot;
    wallsByFloor: Record<number, AreaWall[]>;


    // Loading states
    loadingTree: boolean;
    loadingSensors: boolean;
    loadingOccupancy: boolean;
    loadingWalls: boolean;


    // Error
    error: string | null;


    // Actions
    loadWallsForFloor: (floorId: number) => Promise<void>;
    refreshOccupancy: () => Promise<void>;
    refreshSensors: () => Promise<void>;
    handleSaveWalls: (floorId: number, walls: AreaWall[]) => Promise<void>;
    handlePatchWall: (floorId: number, wall: AreaWall) => Promise<void>;
    handlePatchWallPartial: (floorId: number, wallId: number, patch: Partial<AreaWall>) => Promise<void>;
    handleDeleteWall: (floorId: number, wallId: number) => Promise<void>;
    handleResetWalls: (floorId: number) => Promise<void>;
    handlePatchArea: (areaId: number, patch: Record<string, unknown>) => Promise<AreaNode>;
    handleDeleteArea: (areaId: number) => Promise<void>;
    handlePlaceSensor: (
        sensorId: number,
        placement: {
            position_area: number;
            x_val: number;
            y_val: number;
            z_val: number;
            rotation_y: number;
            mount_type: MountType;
        }
    ) => Promise<void>;
    handleRemoveSensorPlacement: (sensorId: number) => Promise<void>;
    handlePatchCountingLine: (sensorId: number, lineId: number, patch: any) => Promise<void>;
    handleClearCountingLine: (sensorId: number, lineId: number) => Promise<void>;
    handleCreateArea: (payload: any) => Promise<AreaNode>;
    handleUploadAreaPlan: (areaId: number, file: File) => Promise<AreaNode>;
    handleRemoveAreaPlan: (areaId: number) => Promise<AreaNode>;
    updateOccupancy: (updates: any[]) => void;   // for live socket updates
}


export function useThreeDData(): ThreeDData {
    const [areaTree, setAreaTree] = useState<AreaNode | null>(null);
    const [sensors, setSensors] = useState<SensorNode[]>([]);
    const [occupancy, setOccupancy] = useState<OccupancySnapshot>({});
    const [wallsByFloor, setWallsByFloor] = useState<Record<number, AreaWall[]>>({});


    const [loadingTree, setLoadingTree] = useState(true);
    const [loadingSensors, setLoadingSensors] = useState(true);
    const [loadingOccupancy, setLoadingOccupancy] = useState(true);
    const [loadingWalls, setLoadingWalls] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // Track which floors have already had walls fetched (avoid duplicate requests)
    const loadedFloors = useRef<Set<number>>(new Set());


    // ── Initial load on mount (tree + sensors + occupancy all in parallel) ────
    useEffect(() => {
        const loadAllData = async () => {
            try {
                const [tree, sensorList, occ] = await Promise.all([
                    fetchAreaTree(),
                    fetchSensors(),
                    fetchOccupancy(),
                ]);


                setAreaTree(tree);
                setSensors(sensorList);
                setOccupancy(occ);


                // Eagerly load walls for all floors AND their children found in the tree
                const wallAreaIds: number[] = [];
                const collectWallAreaIds = (node: AreaNode, insideFloor: boolean = false) => {
                    const isFloor = node.area_type === 'Floor';
                    if (isFloor || insideFloor) {
                        wallAreaIds.push(node.id);
                    }
                    node.children?.forEach(child => collectWallAreaIds(child, isFloor || insideFloor));
                };
                collectWallAreaIds(tree);


                if (wallAreaIds.length > 0) {
                    setLoadingWalls(true);
                    const wallResults = await Promise.all(
                        wallAreaIds.map(async (id) => {
                            try {
                                const walls = await fetchWallsForFloor(id);
                                return { id, walls };
                            } catch (e) {
                                console.error(`Failed to fetch walls for area/floor ${id}`, e);
                                return { id, walls: [] };
                            }
                        })
                    );


                    const wallsMap: Record<number, AreaWall[]> = {};
                    wallResults.forEach(res => {
                        wallsMap[res.id] = res.walls;
                        loadedFloors.current.add(res.id);
                    });
                    setWallsByFloor(prev => ({ ...prev, ...wallsMap }));
                    setLoadingWalls(false);
                }


            } catch (err: any) {
                setError(err.message);
                console.error("Initial data load failed", err);
            } finally {
                setLoadingTree(false);
                setLoadingSensors(false);
                setLoadingOccupancy(false);
                setLoadingWalls(false);
            }
        };


        loadAllData();
    }, []);


    // ── Load walls for a specific area/floor recursively ───
    const loadWallsForFloor = useCallback(async (areaId: number) => {
        // Find the node in the tree to recurse its children
        const findNode = (node: AreaNode, id: number): AreaNode | null => {
            if (node.id === id) return node;
            if (!node.children) return null;
            for (const child of node.children) {
                const found = findNode(child, id);
                if (found) return found;
            }
            return null;
        };


        if (!areaTree) return;
        const targetNode = findNode(areaTree, areaId);
        if (!targetNode) return;


        const idsToFetch: number[] = [];
        const collect = (node: AreaNode) => {
            if (!loadedFloors.current.has(node.id)) {
                idsToFetch.push(node.id);
            }
            node.children?.forEach(collect);
        };
        collect(targetNode);


        if (idsToFetch.length === 0) return;


        setLoadingWalls(true);
        try {
            const results = await Promise.all(
                idsToFetch.map(async (id) => {
                    const walls = await fetchWallsForFloor(id);
                    return { id, walls };
                })
            );


            const newWalls: Record<number, AreaWall[]> = {};
            results.forEach(res => {
                newWalls[res.id] = res.walls;
                loadedFloors.current.add(res.id);
            });


            setWallsByFloor(prev => ({ ...prev, ...newWalls }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingWalls(false);
        }
    }, [areaTree]);


    // ── Refresh helpers ───────────────────────────────────────────────────────
    const refreshOccupancy = useCallback(async () => {
        const data = await fetchOccupancy();
        setOccupancy(data);
    }, []);


    const refreshSensors = useCallback(async () => {
        const data = await fetchSensors();
        setSensors(data);
    }, []);


    const refetchAreaTree = useCallback(async () => {
        try {
            const fresh = await fetchAreaTree();
            setAreaTree(fresh);
        } catch (e) {
            console.warn('Area tree refetch failed', e);
        }
    }, []);


    // ── Save walls (bulk create) ──────────────────────────────────────────────
    const handleSaveWalls = useCallback(async (
        floorId: number,
        walls: AreaWall[]
    ) => {
        console.log('[API] POST /walls/bulk/ →', walls);
        // Strip temporary negative IDs before sending to the API
        const payload = walls.map(({ id, ...rest }) => rest);
        try {
            const created = await saveWalls(floorId, payload);
            // Merge newly created walls (with real server IDs) into local state
            setWallsByFloor(prev => ({
                ...prev,
                [floorId]: [...(prev[floorId] ?? []), ...created],
            }));
            console.log('[API] Walls saved, received IDs:', created.map(w => w.id));
        } catch (err: any) {
            console.error('[API] Save walls failed:', err.message);
            throw err;
        }
    }, []);


    // ── Patch a single wall ───────────────────────────────────────────────────
    const handlePatchWall = useCallback(async (
        floorId: number,
        wall: AreaWall
    ) => {
        console.log('[API] PUT /walls/', wall.id, '→', wall);
        try {
            const updated = await patchWall(floorId, wall.id as number, wall);
            setWallsByFloor(prev => ({
                ...prev,
                [floorId]: (prev[floorId] ?? []).map(w =>
                    w.id === wall.id ? updated : w
                ),
            }));
        } catch (err: any) {
            console.error('[API] Patch wall failed:', err.message);
            throw err;
        }
    }, []);


    // ── Patch a wall partially ───────────────────────────────────────────────
    const handlePatchWallPartial = useCallback(async (
        floorId: number,
        wallId: number,
        patch: Partial<AreaWall>
    ) => {
        console.log('[API] PATCH /walls/', wallId, '→', patch);
        try {
            const updated = await patchWallPartial(floorId, wallId, patch);
            setWallsByFloor(prev => ({
                ...prev,
                [floorId]: (prev[floorId] ?? []).map(w =>
                    w.id === wallId ? updated : w
                ),
            }));
        } catch (err: any) {
            console.error('[API] Patch wall partial failed:', err.message);
            throw err;
        }
    }, []);


    // ── Delete a single wall ──────────────────────────────────────────────────
    const handleDeleteWall = useCallback(async (
        floorId: number,
        wallId: number
    ) => {
        console.log('[API] DELETE /walls/', wallId);
        try {
            await deleteWall(floorId, wallId);
            setWallsByFloor(prev => ({
                ...prev,
                [floorId]: (prev[floorId] ?? []).filter(w => w.id !== wallId),
            }));
        } catch (err: any) {
            console.error('[API] Delete wall failed:', err.message);
            throw err;
        }
    }, []);


    // ── Reset all walls for a floor ───────────────────────────────────────────
    const handleResetWalls = useCallback(async (
        floorId: number
    ) => {
        console.log('[API] DELETE /walls/reset/ floorId=', floorId);
        try {
            await resetWalls(floorId);
            setWallsByFloor(prev => ({
                ...prev,
                [floorId]: [],
            }));
        } catch (err: any) {
            console.error('[API] Reset walls failed:', err.message);
            throw err;
        }
    }, []);


    // ── Place / update a sensor ───────────────────────────────────────────────
    const handlePlaceSensor = useCallback(async (
        sensorId: number,
        placement: {
            position_area: number;
            x_val: number;
            y_val: number;
            z_val: number;
            rotation_y: number;
            mount_type: MountType;
        }
    ) => {
        console.log('[API] PATCH /sensors/', sensorId, '→', placement);
        try {
            await placeSensor(sensorId, placement);
            // Reflect the new position in local sensor state immediately
            setSensors(prev => prev.map(s => {
                if (s.id !== sensorId) return s;
                return {
                    ...s,
                    position: {
                        position_area_id: placement.position_area,
                        x_val: placement.x_val,
                        y_val: placement.y_val,
                        z_val: placement.z_val,
                        rotation_y: placement.rotation_y,
                        mount_type: placement.mount_type,
                    },
                };
            }));
        } catch (err: any) {
            console.error('[API] Place sensor failed:', err.message);
            throw err;
        }
    }, []);


    // ── Remove sensor placement ───────────────────────────────────────────────
    const handleRemoveSensorPlacement = useCallback(async (sensorId: number) => {
        try {
            const sensor = sensors.find(s => s.id === sensorId);
            const lineIds = sensor?.counting_lines.map(l => l.id) ?? [];


            await removeSensorPlacement(sensorId, lineIds);
            await refreshSensors();
        } catch (err: any) {
            console.error('[API] Remove sensor placement failed:', err.message);
            throw err;
        }
    }, [sensors, refreshSensors]);


    // ── Patch a counting line ─────────────────────────────────────────────────
    const handlePatchCountingLine = useCallback(async (
        sensorId: number,
        lineId: number,
        patch: any
    ) => {
        console.log('[API] PATCH /sensor_counting_lines/', lineId, '→', patch);
        try {
            await patchCountingLine(sensorId, lineId, patch);
            // Reflect the change in local sensor state immediately
            setSensors(prev => prev.map(s => {
                if (s.id !== sensorId) return s;
                return {
                    ...s,
                    counting_lines: s.counting_lines.map(cl =>
                        cl.id === lineId ? { ...cl, ...patch } : cl
                    ),
                };
            }));
        } catch (err: any) {
            console.error('[API] Patch counting line failed:', err.message);
            throw err;
        }
    }, []);


    const handleClearCountingLine = useCallback(async (
        sensorId: number,
        lineId: number
    ) => {
        try {
            await clearCountingLine(sensorId, lineId);
            setSensors(prev => prev.map(s => {
                if (s.id !== sensorId) return s;
                return {
                    ...s,
                    counting_lines: s.counting_lines.map(cl =>
                        cl.id === lineId
                            ? {
                                ...cl,
                                line_r_x1: null,
                                line_r_y1: null,
                                line_r_x2: null,
                                line_r_y2: null,
                                line_r_height: null,
                            }
                            : cl
                    ),
                };
            }));
        } catch (err: any) {
            console.error('[API] Clear counting line failed:', err.message);
            throw err;
        }
    }, []);


    // ── Create a new area ─────────────────────────────────────────────────────
    const handleCreateArea = useCallback(async (payload: any) => {
        const newNode = await createArea(payload);
        if (payload.parent_id) {
            setAreaTree(prev => prev ? insertNodeIntoTree(prev, payload.parent_id, newNode) : prev);
        }
        refetchAreaTree();
        return newNode;
    }, [refetchAreaTree]);


    const handleUploadAreaPlan = useCallback(async (areaId: number, file: File) => {
        const updatedNode = await uploadAreaPlan(areaId, file);
        setAreaTree(prev => prev ? updateNodeInTree(prev, areaId, { area_plan: updatedNode.area_plan }) : prev);
        return updatedNode;
    }, []);


    const handleRemoveAreaPlan = useCallback(async (areaId: number) => {
        const updatedNode = await removeAreaPlan(areaId);
        setAreaTree(prev => prev ? updateNodeInTree(prev, areaId, { area_plan: null }) : prev);
        return updatedNode;
    }, []);


    const handlePatchArea = useCallback(async (
        areaId: number,
        patch: Record<string, unknown>
    ) => {
        console.log('[API] PATCH /areas/', areaId, '→', patch);
        const updated = await patchArea(areaId, patch);
        setAreaTree(prev => prev ? updateNodeInTree(prev, areaId, updated) : prev);
        refetchAreaTree();
        return updated;
    }, [refetchAreaTree]);


    const handleDeleteArea = useCallback(async (areaId: number) => {
        console.log('[API] DELETE /areas/', areaId);
        await deleteArea(areaId);
        setAreaTree(prev => prev ? removeNodeFromTree(prev, areaId) : prev);
        refetchAreaTree();
    }, [refetchAreaTree]);


    // ── Live occupancy update (from websocket or manual call) ─────────────────
    const updateOccupancy = useCallback((updates: any[]) => {
        setOccupancy(prev => {
            const next = { ...prev };
            updates.forEach((u: any) => {
                const utilization = u.capacity > 0
                    ? (u.current_occupancy / u.capacity) * 100
                    : 0;
                next[u.area_id] = {
                    ...prev[u.area_id],
                    people_total_occupancy: u.current_occupancy,
                    utilization_percent: utilization,
                };
            });
            return next;
        });
    }, []);


    return {
        areaTree,
        sensors,
        occupancy,
        wallsByFloor,
        loadingTree,
        loadingSensors,
        loadingOccupancy,
        loadingWalls,
        error,
        loadWallsForFloor,
        refreshOccupancy,
        refreshSensors,
        handleSaveWalls,
        handlePatchWall,
        handleDeleteWall,
        handleResetWalls,
        handlePlaceSensor,
        handleRemoveSensorPlacement,
        handlePatchCountingLine,
        handleClearCountingLine,
        handleCreateArea,
        handleUploadAreaPlan,
        handleRemoveAreaPlan,
        handlePatchArea,
        handleDeleteArea,
        handlePatchWallPartial,
        updateOccupancy,
    };
}


// ── Helpers ──────────────────────────────────────────────────────────────


function insertNodeIntoTree(root: AreaNode, parentId: number, newNode: AreaNode): AreaNode {
    if (root.id === parentId) {
        return {
            ...root,
            children: [...(root.children ?? []), newNode],
        };
    }
    return {
        ...root,
        children: (root.children ?? []).map(child => insertNodeIntoTree(child, parentId, newNode)),
    };
}


function updateNodeInTree(
    root: AreaNode,
    targetId: number,
    patch: Partial<AreaNode>
): AreaNode {
    if (root.id === targetId) return { ...root, ...patch };
    return {
        ...root,
        children: (root.children ?? []).map(child =>
            updateNodeInTree(child, targetId, patch)
        ),
    };
}


function removeNodeFromTree(root: AreaNode, targetId: number): AreaNode | null {
    if (root.id === targetId) return null;
    return {
        ...root,
        children: (root.children ?? [])
            .map(child => removeNodeFromTree(child, targetId))
            .filter((c): c is AreaNode => c !== null),
    };
}



Here is the folder structure for the 3D implementation in the project, organized by category:

📂 Core Page
src/pages/ThreeD/
ThreeDPage.tsx: The main landing container and orchestrator.
ThreeDPage.module.scss: Layout styling.
📂 Components (src/components/threeD/)
scene/: Core 3D environment and meshes.
BuildingScene.tsx: Manages building render logic and LOD.
GlassTower.tsx: Renders the exterior glass facade.
SubAreaSlab.tsx: Detailed room-level floor slabs.
walls/: Wall rendering and drawing UI.
WallSegment.tsx: High-level math for straight, arc, and bezier walls.
WallDrawerPanel.tsx: The control UI for drawing new walls.
WallEditPanel.tsx: UI for editing existing wall properties.
sensors/: Hardware placement and visualization.
SensorPlacementPanel.tsx: UI for dragging/placing sensors.
CountingLine3D.tsx & SensorBeam3D.tsx: Visual feedback for sensor coverage.
panels/: Navigation and global UI.
BuildingSidebar.tsx: The left-side navigation tree.
UnifiedRightPanel.tsx: The context-sensitive right sidebar.
views/: Specific 2D/3D camera viewpoints.
SpatialMapView.tsx
IsometricBuildingView.tsx
people/: Occupancy visualization models.
PersonModel.tsx & TransientPerson.tsx
📂 Logic & Hooks (src/hooks/)
useWallDrawing.ts: State machine for the wall drawing tool.
useSensorPlacement.ts: Logic for placing and moving sensors.
useThreeDData.ts: Master hook for fetching/syncing 3D geometry from the API.
📂 Utilities & Data (src/utils/threeD/)
types.ts: TypeScript interfaces for Walls, Sensors, and Areas.
geometryUtils.ts: Math for coordinate normalization.
dummyData.ts & megaDemoData.ts: Mock data for the Demo Mode.
theme.ts: Shared 3D color palettes and styling tokens.
📂 Styles (src/styles/threeD/)
Contains all SCSS modules corresponding to the components above.
📂 Services (src/services/threeD/)
api.ts: API service for saving/patching wall and sensor data.