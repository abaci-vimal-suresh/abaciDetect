import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Sensor, Area, Wall } from '../../../../types/sensor';
import { FloorModel, SensorMarker } from '../floors/FloorComponents';
import { SensorAlertEmit } from './emits/SensorAlertEmit';
import { WallSegment } from '../walls/WallSegment';
import { flattenAreas } from '../../utils/dataTransform';
import {
    transformSensorTo3D,
    transform3DToSensor,
    calculateSensorStatus,
    DEFAULT_FLOOR_CALIBRATION,
    FloorCalibration
} from '../../utils/coordinateTransform';
import {
    PreviewState,
    isSensorPositionPreview,
    isSensorWallsPreview,
    isAreaWallsPreview,
} from '../../utils/previewState';
import {
    DEFAULT_WALL_HEIGHT,
    DEFAULT_WALL_COLOR,
    DEFAULT_WALL_OPACITY,
} from '../../../../constants/wallDefaults';
import useToasterNotification from '../../../../hooks/useToasterNotification';

interface BuildingSceneProps {
    areas: Area[];
    sensors: Sensor[];
    visibleAreaIds?: (number | string)[];
    floorSpacing?: number;
    floorOpacity?: number;
    showBoundaries?: boolean;
    zoomTrigger?: number;
    onSensorClick?: (sensor: Sensor) => void;
    onSensorDrag?: (sensor: Sensor, newCoords: { x_val: number, y_val: number, z_val: number }) => void;
    onWallClick?: (wall: Wall) => void;
    onWallDrag?: (wall: Wall, delta: { x: number, y: number, z: number }) => void;
    onWallEndpointsUpdate?: (wall: Wall, points: { r_x1?: number, r_y1?: number, r_x2?: number, r_y2?: number }) => void;
    onWallEndpointDragStart?: () => void;
    onWallEndpointDragEnd?: () => void;
    calibration?: FloorCalibration;
    onLoad?: (calibration: FloorCalibration) => void;
    selectedSensorId?: string | number | null;
    setSelectedSensorId?: (id: string | number | null) => void;
    selectedWallId?: string | number | null;
    previewState?: PreviewState;
    blinkingWallIds?: (number | string)[];
    wallDrawMode?: boolean;
    onWallCreated?: (wall: Partial<Wall>) => void;
    onWallsBatchCreated?: (walls: Partial<Wall>[]) => void;
    wallsByArea?: Record<number, Wall[]>;
    wallDrawSettings?: {
        drawingMode: 'straight' | 'arc';
        height: number;
        thickness: number;
        color: string;
        opacity: number;
    };
    onPointChainUpdate?: (count: number) => void;
    onArcBufferUpdate?: (count: number) => void;
    onCommittedCountUpdate?: (count: number) => void;
    undoTrigger?: number;
    clearTrigger?: number;
    finishTrigger?: number;
    closeShapeTrigger?: number;
    alerts?: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// FloorWallManager
// ─────────────────────────────────────────────────────────────────────────────
const FloorWallManager = ({
    areaId, walls, calibration, floorY, selectedWallId,
    onWallClick, onWallDrag, onWallEndpointsUpdate,
    onWallEndpointDragStart, onWallEndpointDragEnd,
    previewState, blinkingWallIds = [], focusedWallId,
    floorWidth, floorDepth
}: {
    areaId: number | string;
    walls: Wall[];
    calibration: FloorCalibration;
    floorY: number;
    selectedWallId?: string | number | null;
    onWallClick?: (wall: Wall) => void;
    onWallDrag?: (wall: Wall, delta: { x: number, y: number, z: number }) => void;
    onWallEndpointsUpdate?: (wall: Wall, points: { r_x1?: number, r_y1?: number, r_x2?: number, r_y2?: number }) => void;
    onWallEndpointDragStart?: () => void;
    onWallEndpointDragEnd?: () => void;
    previewState?: PreviewState;
    blinkingWallIds?: (number | string)[];
    focusedWallId?: string | number | null;
    floorWidth?: number;
    floorDepth?: number;
}) => {
    const [hoveredWallId, setHoveredWallId] = useState<string | number | null>(null);
    const displayWalls = useMemo(() => {
        if (isAreaWallsPreview(previewState) && previewState.data.areaId === areaId) {
            return previewState.data.walls;
        }
        return walls || [];
    }, [walls, previewState, areaId]);
    if (displayWalls.length === 0) return null;
    return (
        <>
            {displayWalls.map((wall: Wall) => (
                <WallSegment
                    key={`area-wall-${wall.id}`}
                    wall={wall}
                    calibration={calibration}
                    floorY={floorY}
                    isSelected={String(selectedWallId) === String(wall.id)}
                    isHovered={hoveredWallId === wall.id}
                    isBlinking={blinkingWallIds.includes(wall.id)}
                    isFocused={focusedWallId === wall.id}
                    onClick={onWallClick}
                    onHover={(hovered) => setHoveredWallId(hovered ? wall.id : null)}
                    onDrag={(delta) => onWallDrag?.(wall, delta)}
                    onUpdateEndpoints={(points) => onWallEndpointsUpdate?.(wall, points)}
                    onEndpointDragStart={onWallEndpointDragStart}
                    onEndpointDragEnd={onWallEndpointDragEnd}
                    floorWidth={floorWidth}
                    floorDepth={floorDepth}
                />
            ))}
        </>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// BuildingScene
// ─────────────────────────────────────────────────────────────────────────────
export function BuildingScene({
    areas,
    sensors,
    visibleAreaIds = [],
    floorSpacing = 2.4,
    floorOpacity = 1,
    showBoundaries = true,
    onSensorClick,
    onSensorDrag,
    onWallClick,
    onWallDrag,
    onWallEndpointsUpdate,
    onWallEndpointDragStart,
    onWallEndpointDragEnd,
    calibration = DEFAULT_FLOOR_CALIBRATION,
    onLoad,
    selectedSensorId,
    setSelectedSensorId,
    selectedWallId,
    previewState,
    blinkingWallIds = [],
    wallDrawMode = false,
    onWallCreated,
    onWallsBatchCreated,
    zoomTrigger = 0,
    wallsByArea = {},
    wallDrawSettings = {
        drawingMode: 'straight' as 'straight' | 'arc',
        height: 2.4,
        thickness: 0.15,
        color: '#8f8f8f',
        opacity: 0.8,
    },
    onPointChainUpdate,
    onArcBufferUpdate,
    onCommittedCountUpdate,
    undoTrigger = 0,
    clearTrigger = 0,
    finishTrigger = 0,
    alerts = [],
}: BuildingSceneProps) {
    const { controls } = useThree() as any;
    const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
    const { showNotification } = useToasterNotification();
    const [committedSessionWalls, setCommittedSessionWalls] = useState<Wall[]>([]);

    // ── Alert triggering state ───────────────────────────────────────────────
    const [activeEmits, setActiveEmits] = useState<any[]>([]);
    const lastAlertCountRef = useRef(alerts.length);

    const handleEmitComplete = (id: string | number) => {
        setActiveEmits(prev => prev.filter(e => e.id !== id));
    };


    // ── Per-floor calibration ────────────────────────────────────────────────
    const calibrationByAreaRef = useRef<Map<number, FloorCalibration>>(new Map());
    const [calibrationByArea, setCalibrationByArea] = useState<Map<number, FloorCalibration>>(new Map());
    const activeDrawingAreaId = useRef<number | undefined>(undefined);

    const getCalibrationForArea = (areaId: number): FloorCalibration => {
        return calibrationByAreaRef.current.get(areaId) || calibration || DEFAULT_FLOOR_CALIBRATION;
    };

    const [actualCalibration, setActualCalibration] = useState<FloorCalibration>(
        calibration || DEFAULT_FLOOR_CALIBRATION
    );
    const [isCalibrated, setIsCalibrated] = useState(!!calibration && calibration.width > 0);

    // ── Refs (always fresh in event handlers) ───────────────────────────────
    const actualCalibrationRef = useRef<FloorCalibration>(actualCalibration);
    const isCalibratedRef = useRef(isCalibrated);
    const wallDrawModeRef = useRef(wallDrawMode);
    const wallDrawSettingsRef = useRef(wallDrawSettings);
    const committedSessionWallsRef = useRef<Wall[]>([]);
    const floorsRef = useRef<Area[]>([]);
    const visibleAreaIdsRef = useRef(visibleAreaIds);

    useEffect(() => { actualCalibrationRef.current = actualCalibration; }, [actualCalibration]);
    useEffect(() => { isCalibratedRef.current = isCalibrated; }, [isCalibrated]);
    useEffect(() => { wallDrawModeRef.current = wallDrawMode; }, [wallDrawMode]);
    useEffect(() => { wallDrawSettingsRef.current = wallDrawSettings; }, [wallDrawSettings]);
    useEffect(() => { visibleAreaIdsRef.current = visibleAreaIds; }, [visibleAreaIds]);

    const setCommittedSessionWallsSynced = (updater: (prev: Wall[]) => Wall[]) => {
        setCommittedSessionWalls(prev => {
            const next = updater(prev);
            committedSessionWallsRef.current = next;
            return next;
        });
    };

    // ── Point chain & arc buffer types ──────────────────────────────────────
    type ChainPoint = {
        x: number; y: number; z: number;
        floorY: number; areaId: number;
        worldOffsetX: number; worldOffsetZ: number;
    };

    const [pointChain, setPointChain] = useState<ChainPoint[]>([]);
    const pointChainRef = useRef<ChainPoint[]>([]);
    const [arcClickBuffer, setArcClickBuffer] = useState<ChainPoint[]>([]);
    const arcClickBufferRef = useRef<ChainPoint[]>([]);
    const [previewEndPoint, setPreviewEndPoint] = useState<{ x: number; y: number; z: number } | null>(null);

    // ── finishDrawing ────────────────────────────────────────────────────────
    const finishDrawing = (keepWalls = false) => {
        if (!keepWalls) {
            setCommittedSessionWallsSynced(() => []);
            onCommittedCountUpdate?.(0);
        }
        setPointChain([]);
        pointChainRef.current = [];
        setPreviewEndPoint(null);
        setArcClickBuffer([]);
        arcClickBufferRef.current = [];
        onPointChainUpdate?.(0);
        onArcBufferUpdate?.(0);
    };

    useEffect(() => { if (!wallDrawMode) finishDrawing(false); }, [wallDrawMode]);

    // ── Keyboard ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!wallDrawModeRef.current) return;
            if (e.key === 'Enter') {
                const walls = committedSessionWallsRef.current;
                if (walls.length > 0) {
                    const payload = walls.map(w => { const { id, ...r } = w as any; return r as Partial<Wall>; });
                    onWallsBatchCreated?.(payload);
                    showNotification('Chain Saved', `${payload.length} wall segment(s) saved.`, 'success');
                    finishDrawing(false);
                } else {
                    showNotification('Not enough points', 'Add at least 2 points.', 'warning');
                    finishDrawing(false);
                }
            } else if (e.key === 'Escape') {
                showNotification('Drawing Cancelled', 'Wall sequence cleared.', 'warning');
                finishDrawing(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (undoTrigger > 0) {
            // Remove last committed wall AND last chain point
            setCommittedSessionWallsSynced(prev => {
                const next = prev.slice(0, -1);
                onCommittedCountUpdate?.(next.length);
                return next;
            });
            const newChain = pointChainRef.current.slice(0, -1);
            pointChainRef.current = newChain;
            setPointChain([...newChain]);
            onPointChainUpdate?.(newChain.length);
        }
    }, [undoTrigger]);

    useEffect(() => { if (clearTrigger > 0) finishDrawing(false); }, [clearTrigger]);

    useEffect(() => {
        if (finishTrigger > 0) {
            const walls = committedSessionWallsRef.current;
            if (walls.length > 0) {
                const payload = walls.map(w => { const { id, ...r } = w as any; return r as Partial<Wall>; });
                onWallsBatchCreated?.(payload);
                finishDrawing(false);
            }
        }
    }, [finishTrigger]);

    // ── Calibration sync ─────────────────────────────────────────────────────
    useEffect(() => {
        if (calibration && calibration.width > 0) {
            setActualCalibration(calibration);
            actualCalibrationRef.current = calibration;
            setIsCalibrated(true);
            isCalibratedRef.current = true;
        }
    }, [calibration]);

    // ── floors / buildingGroups ──────────────────────────────────────────────
    const floors = useMemo(() => {
        const flatAreas = flattenAreas(areas);
        const result = flatAreas
            .filter(a => a.area_type === 'floor' || a.area_type === 'room')
            .sort((a, b) => (a.floor_level ?? a.offset_z ?? 0) - (b.floor_level ?? b.offset_z ?? 0));
        floorsRef.current = result;
        return result;
    }, [areas]);

    const buildingGroups = useMemo(() => {
        const flatAreas = flattenAreas(areas);
        const buildings = flatAreas.filter(a =>
            a.area_type === 'building' && (a.parent_id === null || a.parent_id === undefined)
        );
        if (buildings.length === 0) {
            return [{ building: null as Area | null, floors, worldOffsetX: 0, worldOffsetZ: 0 }];
        }
        const BUILDING_SPACING = 65;
        return buildings.map((building, idx) => ({
            building,
            floors: floors.filter(f =>
                (building.subareas || []).includes(f.id) || f.parent_id === building.id
            ),
            worldOffsetX: idx * BUILDING_SPACING,
            worldOffsetZ: 0,
        }));
    }, [areas, floors]);

    // ── Alert monitoring logic ──────────────────────────────────────────────
    useEffect(() => {
        if (alerts.length > lastAlertCountRef.current) {
            const newAlert = alerts[0];
            lastAlertCountRef.current = alerts.length;

            if (newAlert) {
                console.log('BuildingScene: New Alert for Visual Trigger!', {
                    source: newAlert.event_source,
                    intensity: newAlert.intensity,
                    sensor: newAlert.sensor_name
                });

                // Find matching sensor to get position
                const sensor = sensors.find(s =>
                    (newAlert.sensor_id && String(s.id) === String(newAlert.sensor_id)) ||
                    (newAlert.sensor_name && s.name.toLowerCase() === newAlert.sensor_name.toLowerCase())
                );

                if (sensor) {
                    const sensorAreaId = typeof sensor.area === 'object' && sensor.area !== null
                        ? sensor.area.id : (sensor.area || sensor.area_id);
                    const floorLevel = sensor.floor_level ?? 0;
                    const floorCal = calibrationByAreaRef.current.get(Number(sensorAreaId)) || calibration || DEFAULT_FLOOR_CALIBRATION;
                    const pos = transformSensorTo3D(sensor, floorCal, floorLevel, floorSpacing);

                    // Multi-building offset logic
                    const group = buildingGroups.find(g => g.floors.some(f => f.id === Number(sensorAreaId)));
                    const tx = pos.x - (floorCal.centerX || 0) + (group?.worldOffsetX ?? 0);
                    const ty = pos.y;
                    const tz = pos.z - (floorCal.centerZ || 0) + (group?.worldOffsetZ ?? 0);

                    const newEmit = {
                        id: newAlert.id || Date.now(),
                        eventSource: newAlert.event_source || 'Unknown',
                        position: [tx, ty, tz],
                        intensity: newAlert.intensity || 1.0,
                        spawnedAt: Date.now()
                    };

                    setActiveEmits(prev => {
                        const next = [...prev, newEmit];
                        if (next.length > 10) return next.slice(next.length - 10);
                        return next;
                    });
                }
            }
        } else {
            lastAlertCountRef.current = alerts.length;
        }
    }, [alerts, sensors, buildingGroups, floorSpacing, calibration]);

    // ── Camera: Selected Sensor Zoom ────────────────────────────────────────
    useEffect(() => {
        if (!selectedSensorId || !controls || typeof controls.setLookAt !== 'function') return;
        const sensor = sensors.find(s => String(s.id) === String(selectedSensorId));
        if (!sensor) return;
        const sensorAreaId = typeof sensor.area === 'object' && sensor.area !== null
            ? sensor.area.id : (sensor.area || sensor.area_id);
        const floorLevel = sensor.floor_level ?? 0;
        const floorCal = getCalibrationForArea(Number(sensorAreaId));
        const pos = transformSensorTo3D(sensor, floorCal, floorLevel, floorSpacing);
        const group = buildingGroups.find(g => g.floors.some(f => f.id === Number(sensorAreaId)));
        const tx = pos.x - (floorCal.centerX || 0) + (group?.worldOffsetX ?? 0);
        const tz = pos.z - (floorCal.centerZ || 0) + (group?.worldOffsetZ ?? 0);
        controls.setLookAt(tx + 15, pos.y + 10, tz + 15, tx, pos.y, tz, true);
    }, [selectedSensorId, zoomTrigger, controls, sensors, buildingGroups, floorSpacing]);

    // ── Camera: Wall Drawing Top-View Transition ───────────────────────────
    useEffect(() => {
        if (wallDrawMode && controls && typeof controls.setLookAt === 'function') {
            // Determine floor to center on
            const targetAreaId = activeDrawingAreaId.current ?? visibleAreaIds[0];
            if (!targetAreaId) return;

            const area = floors.find(f => String(f.id) === String(targetAreaId));
            if (!area) return;

            const floorLevel = area.floor_level ?? area.offset_z ?? 0;
            const floorY = floorLevel * floorSpacing;

            // Center of building group (assuming FloorModel centers itself at 0,0 locally)
            const group = buildingGroups.find(g => g.floors.some(f => String(f.id) === String(targetAreaId)));
            const tx = group?.worldOffsetX ?? 0;
            const tz = group?.worldOffsetZ ?? 0;

            // Transition to Top-Down View
            controls.setLookAt(
                tx, floorY + 60, tz + 0.0001, // Eye: Directly above
                tx, floorY, tz,               // Target: Floor center
                true                          // Animate
            );

            // Lock Rotation for a stable 2D-like drawing experience
            // polarAngle = Math.PI is looking down (negative Y)
            controls.minPolarAngle = Math.PI;
            controls.maxPolarAngle = Math.PI;
            controls.minAzimuthAngle = 0;
            controls.maxAzimuthAngle = 0;

            // Disable Left-Click Rotation (CameraControls.ROTATE = 1, NONE = 0)
            const prevLeft = controls.mouseButtons.left;
            controls.mouseButtons.left = 0;

            return () => {
                // Restore Freedom
                controls.minPolarAngle = 0;
                controls.maxPolarAngle = Math.PI;
                controls.minAzimuthAngle = -Infinity;
                controls.maxAzimuthAngle = Infinity;
                controls.mouseButtons.left = prevLeft || 1;
            };
        }
    }, [wallDrawMode, controls, visibleAreaIds, floors, buildingGroups, floorSpacing]);

    // ── Floor load ───────────────────────────────────────────────────────────
    const handleFloorLoad = (measuredCal: FloorCalibration, areaId?: number) => {
        if (!measuredCal || measuredCal.width <= 0) return;
        if (areaId !== undefined) {
            calibrationByAreaRef.current.set(areaId, measuredCal);
            setCalibrationByArea(new Map(calibrationByAreaRef.current));
        }
        // Always update actualCalibration so drawing works immediately
        setActualCalibration(measuredCal);
        actualCalibrationRef.current = measuredCal;
        setIsCalibrated(true);
        isCalibratedRef.current = true;
        onLoad?.(measuredCal);
    };

    const setActiveDrawingFloor = (areaId: number) => {
        activeDrawingAreaId.current = areaId;
        const cal = calibrationByAreaRef.current.get(areaId);
        if (cal) {
            setActualCalibration(cal);
            actualCalibrationRef.current = cal;
        }
    };

    // ── processClick — the core logic, called directly (no setTimeout) ───────
    // FIX: The old 300ms setTimeout caused the SAME click to fire 3 times in
    // Three.js (pointerdown fires onClick multiple times on some events), so
    // timeSinceLast was < 300ms on the 2nd/3rd invocation, triggering the
    // "double-click finish" path and immediately clearing the chain.
    // Solution: remove setTimeout entirely. Use onDoubleClick for finishing.
    const processClick = (
        localX: number, localY: number, localZ: number,
        resolvedAreaId: number, worldOffsetX: number, worldOffsetZ: number,
    ) => {
        setActiveDrawingFloor(resolvedAreaId);
        // Use per-area calibration so width/depth/minX/minZ are accurate
        // for THIS floor's image aspect ratio — not the global default
        const activeCal = calibrationByAreaRef.current.get(resolvedAreaId)
            || actualCalibrationRef.current;
        const floorW = activeCal.width || 30;
        const floorD = activeCal.depth || 30;
        // Use actual minX/minZ from calibration instead of assuming -floorW/2
        // This is the fix — image floors have non-square aspect ratios so
        // minX !== -floorW/2 and minZ !== -floorD/2
        const minX = activeCal.minX ?? -(floorW / 2);
        const minZ = activeCal.minZ ?? -(floorD / 2);

        // SAFETY: If we are still using the default fallback (30x30, min=-15),
        // and it's NOT an image floor calibrated to that, we might be in an inconsistent state.
        if (!activeCal.isReady) {
            console.warn(`[BuildingScene] Calibration not ready for area ${resolvedAreaId}, skipping click.`);
            return;
        }

        const drawSettings = wallDrawSettingsRef.current;

        const toNorm = (lx: number, lz: number) => {
            const nx = Math.max(0, Math.min(1, (lx + floorW / 2) / floorW));
            const ny = Math.max(0, Math.min(1, (lz + floorD / 2) / floorD));
            console.log(`[BuildingScene:toNorm] local(${lx}, ${lz}) -> norm(${nx.toFixed(4)}, ${ny.toFixed(4)}) | floorSize(${floorW}, ${floorD})`);
            return { nx, ny };
        };

        const newPoint: ChainPoint = {
            x: localX, y: localY, z: localZ,
            floorY: localY,
            areaId: resolvedAreaId,
            worldOffsetX, worldOffsetZ,
        };

        const currentChain = pointChainRef.current;

        // ── ARC MODE ──────────────────────────────────────────────────────────
        if (drawSettings.drawingMode === 'arc') {
            const updatedBuffer = [...arcClickBufferRef.current, newPoint];
            arcClickBufferRef.current = updatedBuffer;
            setArcClickBuffer([...updatedBuffer]);
            onArcBufferUpdate?.(updatedBuffer.length);

            if (updatedBuffer.length === 1) {
                if (pointChainRef.current.length === 0) {
                    pointChainRef.current = [newPoint];
                    setPointChain([newPoint]);
                    onPointChainUpdate?.(1);
                }
                return;
            }
            if (updatedBuffer.length === 2) return;

            if (updatedBuffer.length === 3) {
                const [p1, p2, p3] = updatedBuffer;
                const n1 = toNorm(p1.x, p1.z);
                const n2 = toNorm(p2.x, p2.z);
                const n3 = toNorm(p3.x, p3.z);
                // Convert normalized 0-1 back to local meter coords using actual minX/minZ
                const toM = (n: { nx: number; ny: number }) => ({
                    x: minX + n.nx * floorW,
                    z: minZ + n.ny * floorD,
                });
                const m1 = toM(n1), m2 = toM(n2), m3 = toM(n3);
                const D = 2 * (m1.x * (m2.z - m3.z) + m2.x * (m3.z - m1.z) + m3.x * (m1.z - m2.z));

                if (Math.abs(D) > 1e-10) {
                    const ux = ((m1.x * m1.x + m1.z * m1.z) * (m2.z - m3.z) +
                        (m2.x * m2.x + m2.z * m2.z) * (m3.z - m1.z) +
                        (m3.x * m3.x + m3.z * m3.z) * (m1.z - m2.z)) / D;
                    const uz = ((m1.x * m1.x + m1.z * m1.z) * (m3.x - m2.x) +
                        (m2.x * m2.x + m2.z * m2.z) * (m1.x - m3.x) +
                        (m3.x * m3.x + m3.z * m3.z) * (m2.x - m1.x)) / D;
                    const radius = Math.sqrt((m1.x - ux) ** 2 + (m1.z - uz) ** 2);
                    const arcWall: Partial<Wall> = {
                        r_x1: n1.nx, r_y1: n1.ny, r_x2: n2.nx, r_y2: n2.ny,
                        r_height: drawSettings.height, r_z_offset: 0,
                        color: drawSettings.color, opacity: drawSettings.opacity,
                        thickness: drawSettings.thickness, wall_shape: 'arc',
                        arc_center_x: (ux + floorW / 2) / floorW,
                        arc_center_z: (uz + floorD / 2) / floorD,
                        arc_radius: radius / floorW,
                        arc_start_angle: Math.atan2(m1.z - uz, m1.x - ux),
                        arc_end_angle: Math.atan2(m2.z - uz, m2.x - ux),
                        arc_segments: 48, area_ids: [p1.areaId],
                    } as any;
                    setCommittedSessionWallsSynced(prev => {
                        const next = [...prev, { ...arcWall, id: `session-arc-${Date.now()}` } as Wall];
                        onCommittedCountUpdate?.(next.length);
                        return next;
                    });
                    const updatedChain = [...pointChainRef.current, p2];
                    pointChainRef.current = updatedChain;
                    setPointChain([...updatedChain]);
                    onPointChainUpdate?.(updatedChain.length);
                }
                arcClickBufferRef.current = [];
                setArcClickBuffer([]);
                onArcBufferUpdate?.(0);
            }
            return;
        }

        // ── SNAP TO CLOSE ─────────────────────────────────────────────────────
        if (currentChain.length >= 3) {
            const firstP = currentChain[0];
            const dist = Math.sqrt((newPoint.x - firstP.x) ** 2 + (newPoint.z - firstP.z) ** 2);
            if (dist < 1.5) {
                const lastPoint = currentChain[currentChain.length - 1];
                const closingWall: Partial<Wall> = {
                    r_x1: toNorm(lastPoint.x, lastPoint.z).nx,
                    r_y1: toNorm(lastPoint.x, lastPoint.z).ny,
                    r_x2: toNorm(firstP.x, firstP.z).nx,
                    r_y2: toNorm(firstP.x, firstP.z).ny,
                    r_height: drawSettings.height, r_z_offset: 0,
                    color: drawSettings.color, opacity: drawSettings.opacity,
                    thickness: drawSettings.thickness, area_ids: [currentChain[0].areaId],
                };
                const allWalls = [
                    ...committedSessionWallsRef.current.map(w => { const { id, ...r } = w as any; return r as Partial<Wall>; }),
                    closingWall,
                ];
                onWallsBatchCreated?.(allWalls);
                showNotification('Shape Closed', `${allWalls.length} wall segment(s) saved.`, 'success');
                finishDrawing(false);
                return;
            }
        }

        // ── FIRST POINT ───────────────────────────────────────────────────────
        if (currentChain.length === 0) {
            showNotification('Chain Started',
                'Click to add points. Click near start to close. Double-click or Enter to finish.', 'info');
            pointChainRef.current = [newPoint];
            setPointChain([newPoint]);
            onPointChainUpdate?.(1);
            return;
        }

        // ── SUBSEQUENT STRAIGHT POINTS ────────────────────────────────────────
        const lastPoint = currentChain[currentChain.length - 1];
        if (Math.sqrt((newPoint.x - lastPoint.x) ** 2 + (newPoint.z - lastPoint.z) ** 2) < 0.05) return;

        const n1 = toNorm(lastPoint.x, lastPoint.z);
        const n2 = toNorm(newPoint.x, newPoint.z);
        if (Math.sqrt((n2.nx - n1.nx) ** 2 + (n2.ny - n1.ny) ** 2) < 0.001) return;

        setCommittedSessionWallsSynced(prev => {
            const next = [...prev, {
                r_x1: n1.nx, r_y1: n1.ny, r_x2: n2.nx, r_y2: n2.ny,
                r_height: drawSettings.height, r_z_offset: 0,
                color: drawSettings.color, opacity: drawSettings.opacity,
                thickness: drawSettings.thickness, area_ids: [currentChain[0].areaId],
                id: `session-${Date.now()}-${Math.random()}`,
            } as Wall];
            onCommittedCountUpdate?.(next.length);
            return next;
        });

        const updatedChain = [...currentChain, newPoint];
        pointChainRef.current = updatedChain;
        setPointChain([...updatedChain]);
        onPointChainUpdate?.(updatedChain.length);
    };

    // ── handleFloorClick — onClick (single click, no timer) ──────────────────
    const handleFloorClick = (event: any, worldOffsetX: number, worldOffsetZ: number) => {
        if (!wallDrawModeRef.current) return;
        event.stopPropagation();

        // Resolve areaId from object userData
        let areaId: number | undefined = undefined;
        let cur: any = event.object;
        while (cur) {
            if (cur.userData?.areaId !== undefined) { areaId = cur.userData.areaId; break; }
            cur = cur.parent;
        }
        if (areaId === undefined) {
            const first = floorsRef.current.find(f =>
                visibleAreaIdsRef.current.length === 0 || visibleAreaIdsRef.current.includes(Number(f.id))
            );
            if (!first) return;
            areaId = Number(first.id);
        }

        // Subtract worldOffset to get local floor coordinates.
        // The floor model is centered at (0,0) in its building group local space.
        const localX = event.point.x - worldOffsetX;
        const localZ = event.point.z - worldOffsetZ;

        console.log(`[BuildingScene:handleFloorClick] rawWorld(${event.point.x.toFixed(2)}, ${event.point.z.toFixed(2)}) | worldOffset(${worldOffsetX}, ${worldOffsetZ}) -> local(${localX.toFixed(2)}, ${localZ.toFixed(2)}) | areaId(${areaId})`);

        processClick(localX, event.point.y, localZ, Number(areaId), worldOffsetX, worldOffsetZ);
    };

    // ── handleFloorDoubleClick — finish chain ────────────────────────────────
    const handleFloorDoubleClick = (event: any) => {
        if (!wallDrawModeRef.current) return;
        event.stopPropagation();
        const walls = committedSessionWallsRef.current;
        if (walls.length > 0) {
            const payload = walls.map(w => { const { id, ...r } = w as any; return r as Partial<Wall>; });
            onWallsBatchCreated?.(payload);
            showNotification('Chain Finished', `${payload.length} wall segment(s) saved.`, 'success');
        }
        finishDrawing(false);
    };

    // ── handleFloorPointerMove ───────────────────────────────────────────────
    const handleFloorPointerMove = (event: any, worldOffsetX: number, worldOffsetZ: number) => {
        if (!wallDrawModeRef.current) return;
        event.stopPropagation();

        // Apply the same centerX/centerZ adjustment as handleFloorClick
        // so the preview wall tip follows the cursor accurately
        setPreviewEndPoint({
            x: (event.point.x - worldOffsetX),
            y: event.point.y,
            z: (event.point.z - worldOffsetZ),
        });
    };

    // ── displaySensors ───────────────────────────────────────────────────────
    const displaySensors = useMemo(() => {
        if (isSensorPositionPreview(previewState)) {
            return sensors.map(s =>
                String(s.id) === String(previewState.data.sensorId)
                    ? { ...s, x_val: previewState.data.x_val, y_val: previewState.data.y_val, z_val: previewState.data.z_val }
                    : s
            );
        }
        return sensors;
    }, [sensors, previewState]);

    const sensorsByArea = useMemo(() => {
        const grouped: Record<number, Sensor[]> = {};
        displaySensors.forEach(sensor => {
            const areaId = sensor.area_id ?? (typeof sensor.area === 'number' ? sensor.area : 0);
            if (!grouped[areaId]) grouped[areaId] = [];
            grouped[areaId].push(sensor);
        });
        return grouped;
    }, [displaySensors]);

    // ── previewWall ──────────────────────────────────────────────────────────
    const previewWall = useMemo((): Wall | null => {
        if (pointChain.length === 0 || !previewEndPoint) return null;
        const lastPoint = pointChain[pointChain.length - 1];
        const cal = getCalibrationForArea(lastPoint.areaId);
        const floorW = cal.width || 30;
        const floorD = cal.depth || 30;
        // Use actual minX/minZ from calibration — same as processClick toNorm
        const minX = cal.minX ?? -(floorW / 2);
        const minZ = cal.minZ ?? -(floorD / 2);
        const n1 = {
            nx: Math.max(0, Math.min(1, (lastPoint.x + floorW / 2) / floorW)),
            ny: Math.max(0, Math.min(1, (lastPoint.z + floorD / 2) / floorD)),
        };
        const n2 = {
            nx: Math.max(0, Math.min(1, (previewEndPoint.x + floorW / 2) / floorW)),
            ny: Math.max(0, Math.min(1, (previewEndPoint.z + floorD / 2) / floorD)),
        };
        
        // Log preview calculation to debug "inward" issue
        console.log(`[BuildingScene:preview] localZ(${previewEndPoint.z.toFixed(2)}) + offset(${(floorD / 2).toFixed(2)}) / ${floorD.toFixed(2)} -> ny(${n2.ny.toFixed(4)})`);
        if (Math.sqrt((n2.nx - n1.nx) ** 2 + (n2.ny - n1.ny) ** 2) < 0.001) return null;
        return {
            id: 'preview',
            r_x1: n1.nx, r_y1: n1.ny, r_x2: n2.nx, r_y2: n2.ny,
            r_height: wallDrawSettings.height,
            color: wallDrawSettings.color,
            opacity: wallDrawSettings.opacity,
            thickness: wallDrawSettings.thickness,
        } as Wall;
    }, [pointChain, previewEndPoint, calibrationByArea, wallDrawSettings]);

    // ── RENDER ───────────────────────────────────────────────────────────────
    return (
        <group>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, 10, -5]} intensity={0.5} />

            {buildingGroups.map(({ building, floors: bFloors, worldOffsetX, worldOffsetZ }) => (
                <group
                    key={`building-group-${building?.id ?? 'default'}`}
                    position={[worldOffsetX, 0, worldOffsetZ]}
                >
                    {bFloors.map((floor, index) => {
                        const floorLevel = floor.floor_level ?? floor.offset_z ?? index;
                        const isVisible = visibleAreaIds.length === 0 || visibleAreaIds.includes(Number(floor.id));
                        const yPosition = floor.offset_z !== undefined
                            ? floor.offset_z * floorSpacing
                            : floorLevel * floorSpacing;
                        const modelUrl = floor.area_plan || (floor as any).floor_plan_url;
                        const floorSensors = sensorsByArea[floor.id] || [];
                        const floorCal = getCalibrationForArea(floor.id);

                        return (
                            <group key={`floor-group-${floor.id}`}>
                                {modelUrl && (
                                    <FloorModel
                                        key={`floor-${floor.id}`}
                                        floorLevel={floorLevel}
                                        areaId={floor.id}
                                        yPosition={yPosition}
                                        floorSpacing={floorSpacing}
                                        visible={isVisible}
                                        opacity={floorOpacity}
                                        onLoad={(cal) => handleFloorLoad(cal, floor.id)}
                                        centerModel={true}
                                        modelUrl={modelUrl}
                                        onClick={wallDrawMode ? (e) => {
                                            setActiveDrawingFloor(floor.id);
                                            handleFloorClick(e, worldOffsetX, worldOffsetZ);
                                        } : undefined}
                                        onDoubleClick={wallDrawMode ? (e) => {
                                            handleFloorDoubleClick(e);
                                        } : undefined}
                                        onPointerMove={wallDrawMode ? (e) => {
                                            setActiveDrawingFloor(floor.id);
                                            handleFloorPointerMove(e, worldOffsetX, worldOffsetZ);
                                        } : undefined}
                                    />
                                )}

                                {isVisible && (
                                    <FloorWallManager
                                        areaId={floor.id}
                                        walls={wallsByArea[floor.id] || []}
                                        calibration={floorCal}
                                        floorY={yPosition}
                                        selectedWallId={selectedWallId}
                                        onWallClick={onWallClick}
                                        onWallDrag={onWallDrag}
                                        onWallEndpointsUpdate={onWallEndpointsUpdate}
                                        onWallEndpointDragStart={onWallEndpointDragStart}
                                        onWallEndpointDragEnd={onWallEndpointDragEnd}
                                        previewState={previewState}
                                        blinkingWallIds={blinkingWallIds}
                                        focusedWallId={selectedWallId}
                                        floorWidth={floorCal.width}
                                        floorDepth={floorCal.depth}
                                    />
                                )}

                                {isVisible && (floor as any).walls?.map((wall: Wall) => (
                                    <WallSegment
                                        key={`wall-embedded-${wall.id}`}
                                        wall={wall} calibration={floorCal} floorY={yPosition}
                                        isSelected={String(selectedWallId) === String(wall.id)}
                                        onClick={onWallClick}
                                        onDrag={delta => onWallDrag?.(wall, delta)}
                                        onUpdateEndpoints={points => onWallEndpointsUpdate?.(wall, points)}
                                    />
                                ))}

                                {isVisible && floorSensors.map(sensor => {
                                    const position3D = transformSensorTo3D(sensor, floorCal, floorLevel, floorSpacing);
                                    const status = calculateSensorStatus(sensor);
                                    const isSelected = selectedSensorId === sensor.id;
                                    const sensorPos: [number, number, number] = [
                                        position3D.x - (floorCal.centerX || 0),
                                        position3D.y,
                                        position3D.z - (floorCal.centerZ || 0),
                                    ];
                                    const sensorWalls = isSensorWallsPreview(previewState) &&
                                        String(previewState.data.sensorId) === String(sensor.id)
                                        ? previewState.data.walls : sensor.walls || [];

                                    return (
                                        <React.Fragment key={`sensor-${sensor.id}`}>
                                            <SensorMarker
                                                position={sensorPos} status={status}
                                                scale={isSelected ? 0.8 : hoveredSensor === sensor.id ? 0.7 : 0.6}
                                                onClick={() => { setSelectedSensorId?.(sensor.id); onSensorClick?.(sensor); }}
                                                onHover={h => setHoveredSensor(h ? sensor.id : null)}
                                                sensorName={sensor.name} isSelected={isSelected}
                                                onDrag={newPos => {
                                                    onSensorDrag?.(sensor, transform3DToSensor(
                                                        { x: newPos[0] + (floorCal.centerX || 0), y: newPos[1], z: newPos[2] + (floorCal.centerZ || 0) },
                                                        floorCal, floorLevel, floorSpacing
                                                    ));
                                                }}
                                            />
                                            {isVisible && isSelected && sensorWalls.map(wall => (
                                                <WallSegment
                                                    key={`sensor-wall-${wall.id}`}
                                                    wall={wall} calibration={floorCal} floorY={yPosition}
                                                    isSelected={String(selectedWallId) === String(wall.id)}
                                                    isBlinking={blinkingWallIds.includes(wall.id)}
                                                    onClick={onWallClick}
                                                    onDrag={delta => onWallDrag?.(wall, delta)}
                                                />
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </group>
                        );
                    })}
                </group>
            ))}

            <gridHelper visible={false} args={[100, 100, '#ede1e1ff', '#1b1616ff']} position={[0, -0.1, 0]} />

            {/* ── Wall Drawing Overlay ─────────────────────────────────────── */}
            {wallDrawMode && (
                <group>
                    {/* Point markers — world = local + offset */}
                    {pointChain.map((p, idx) => (
                        <mesh
                            key={`marker-${idx}`}
                            position={[p.x + p.worldOffsetX, p.y + 0.25, p.z + p.worldOffsetZ]}
                            renderOrder={15}
                        >
                            <sphereGeometry args={[idx === 0 ? 0.35 : 0.25, 16, 16]} />
                            <meshStandardMaterial
                                color={idx === 0 ? '#ff4757' : '#1e90ff'}
                                emissive={idx === 0 ? '#ff4757' : '#1e90ff'}
                                emissiveIntensity={2.5} depthTest={false} transparent opacity={0.95}
                            />
                        </mesh>
                    ))}

                    {/* Close-shape ring */}
                    {pointChain.length >= 3 && (() => {
                        const fp = pointChain[0];
                        return (
                            <mesh position={[fp.x + fp.worldOffsetX, fp.y + 0.15, fp.z + fp.worldOffsetZ]} renderOrder={14}>
                                <ringGeometry args={[0.5, 0.8, 32]} />
                                <meshBasicMaterial color="#f0c040" transparent opacity={0.8} side={THREE.DoubleSide} depthTest={false} />
                            </mesh>
                        );
                    })()}

                    {/* Cursor dot */}
                    {previewEndPoint && (() => {
                        const lastP = pointChain.length > 0 ? pointChain[pointChain.length - 1] : null;
                        return (
                            <mesh
                                position={[
                                    previewEndPoint.x + (lastP?.worldOffsetX ?? 0),
                                    previewEndPoint.y + 0.2,
                                    previewEndPoint.z + (lastP?.worldOffsetZ ?? 0),
                                ]}
                                renderOrder={16}
                            >
                                <sphereGeometry args={[0.15, 12, 12]} />
                                <meshBasicMaterial color="#ffffff" transparent opacity={0.7} depthTest={false} />
                            </mesh>
                        );
                    })()}

                    {/* Committed + preview walls per building group */}
                    {buildingGroups.map(({ building, worldOffsetX, worldOffsetZ }) => (
                        <group key={`draw-walls-${building?.id ?? 'default'}`} position={[worldOffsetX, 0, worldOffsetZ]}>
                            {committedSessionWalls
                                .filter(wall => {
                                    const aid = (wall.area_ids || [])[0];
                                    const bg = buildingGroups.find(g => g.floors.some(f => f.id === aid));
                                    return (bg?.worldOffsetX ?? 0) === worldOffsetX && (bg?.worldOffsetZ ?? 0) === worldOffsetZ;
                                })
                                .map((wall, idx) => {
                                    const aid = (wall.area_ids || [])[0];
                                    const floorForWall = floors.find(f => f.id === aid);
                                    const fl = floorForWall?.floor_level ?? floorForWall?.offset_z ?? 0;
                                    const yPos = floorForWall?.offset_z !== undefined
                                        ? floorForWall.offset_z * floorSpacing : fl * floorSpacing;
                                    const cal = aid ? getCalibrationForArea(aid) : actualCalibration;
                                    return (
                                        <WallSegment
                                            key={`committed-${idx}`}
                                            wall={wall} calibration={cal}
                                            floorY={yPos} isPreview={true}
                                            floorWidth={cal.width} floorDepth={cal.depth}
                                        />
                                    );
                                })}

                            {previewWall && pointChain.length > 0 && (() => {
                                const lastP = pointChain[pointChain.length - 1];
                                const bg = buildingGroups.find(g => g.floors.some(f => f.id === lastP.areaId));
                                if ((bg?.worldOffsetX ?? 0) !== worldOffsetX) return null;
                                const cal = getCalibrationForArea(lastP.areaId) || actualCalibration;
                                return (
                                    <WallSegment
                                        wall={previewWall} calibration={cal}
                                        floorY={lastP.floorY} isPreview={true}
                                        floorWidth={cal.width} floorDepth={cal.depth}
                                    />
                                );
                            })()}
                        </group>
                    ))}
                </group>
            )}

            {/* ── Alert Emits ─────────────────────────────────────────────── */}
            {activeEmits.map((emit) => (
                <SensorAlertEmit
                    key={emit.id}
                    id={emit.id}
                    position={emit.position}
                    eventSource={emit.eventSource}
                    intensity={emit.intensity}
                    onComplete={handleEmitComplete}
                />
            ))}
        </group>
    );
}