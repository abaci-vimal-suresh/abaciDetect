/**
 * Building Scene - 3D Visualization Component
 * 
 * ✨ MAJOR REFACTORS (Issues #1, #2, #3, #4, #6):
 * - Removed duplicate useWalls calls from FloorWallManager (Issue #2)
 * - Added validation to handleFloorClick (Issue #4)
 * - Enhanced wall preview during drawing (Issue #6)
 * - Unified preview state support (Issue #3)
 * - Better error feedback and user instructions
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Sensor, Area, Wall } from '../../../../types/sensor';
import { FloorModel, SensorMarker } from './FloorComponents';
import { WallSegment } from './WallSegment';
import { flattenAreas } from '../utils/dataTransform';
import {
    transformSensorTo3D,
    transformWallTo3D,
    transform3DToSensor,
    transform3DToNormalized,
    calculateSensorStatus,
    DEFAULT_FLOOR_CALIBRATION,
    FloorCalibration
} from '../utils/coordinateTransform';
import {
    PreviewState,
    isWallDrawingPreview,
    isSensorPositionPreview,
    isSensorWallsPreview,
    isAreaWallsPreview,
    extractWalls
} from '../utils/previewState';
import { validateWallClick, validateWallSegment } from '../utils/wallValidation';
import {
    DEFAULT_WALL_HEIGHT,
    DEFAULT_WALL_COLOR,
    DEFAULT_WALL_OPACITY,
    FIRST_POINT_MARKER_COLOR,
    FIRST_POINT_MARKER_SIZE
} from '../../../../constants/wallDefaults';
import useToasterNotification from '../../../../hooks/useToasterNotification';

interface BuildingSceneProps {
    areas: Area[];
    sensors: Sensor[];
    visibleAreaIds?: (number | string)[];
    floorSpacing?: number;
    floorOpacity?: number;
    showBoundaries?: boolean;
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
    previewState?: PreviewState; // ✨ CHANGED: Was previewData, now unified PreviewState
    blinkingWallIds?: (number | string)[];
    wallDrawMode?: boolean;
    onWallCreated?: (wall: Partial<Wall>) => void;
    wallsByArea?: Record<number, Wall[]>; // ✨ NEW: Walls passed from parent instead of fetching
}

/**
 * ✨ REFACTORED: Component to render walls for a specific area
 * 
 * BEFORE: Fetched walls internally with useWalls hook
 * AFTER: Receives walls as prop from parent (eliminates duplicate fetching)
 */
const FloorWallManager = ({
    areaId,
    walls, // ✨ NEW: Walls passed as prop
    calibration,
    floorY,
    selectedWallId,
    onWallClick,
    onWallDrag,
    onWallEndpointsUpdate,
    onWallEndpointDragStart,
    onWallEndpointDragEnd,
    previewState, // ✨ NEW: Unified preview state
    blinkingWallIds = [],
    focusedWallId // ✨ NEW: For real-time editing feedback
}: {
    areaId: number | string;
    walls: Wall[]; // ✨ NEW: Receives walls instead of fetching
    calibration: FloorCalibration;
    floorY: number;
    selectedWallId?: string | number | null;
    onWallClick?: (wall: Wall) => void;
    onWallDrag?: (wall: Wall, delta: { x: number, y: number, z: number }) => void;
    onWallEndpointsUpdate?: (wall: Wall, points: { r_x1?: number, r_y1?: number, r_x2?: number, r_y2?: number }) => void;
    onWallEndpointDragStart?: () => void;
    onWallEndpointDragEnd?: () => void;
    previewState?: PreviewState; // ✨ NEW
    blinkingWallIds?: (number | string)[];
    focusedWallId?: string | number | null; // ✨ NEW
}) => {
    const [hoveredWallId, setHoveredWallId] = useState<string | number | null>(null);

    // ✨ MODIFIED: Use preview walls if available
    const displayWalls = useMemo(() => {
        // Check if preview state affects this area's walls
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
                    isFocused={focusedWallId === wall.id} // ✨ NEW
                    onClick={onWallClick}
                    onHover={(hovered) => setHoveredWallId(hovered ? wall.id : null)}
                    onDrag={(delta) => onWallDrag?.(wall, delta)}
                    onUpdateEndpoints={(points) => onWallEndpointsUpdate?.(wall, points)}
                    onEndpointDragStart={onWallEndpointDragStart}
                    onEndpointDragEnd={onWallEndpointDragEnd}
                />
            ))}
        </>
    );
};

export function BuildingScene({
    areas,
    sensors,
    visibleAreaIds = [],
    floorSpacing = 4.0,
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
    previewState, // ✨ CHANGED: Unified preview state
    blinkingWallIds = [],
    wallDrawMode = false,
    onWallCreated,
    wallsByArea = {} // ✨ NEW: Walls passed from parent
}: BuildingSceneProps) {
    const { controls } = useThree() as any;
    const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
    const [actualCalibration, setActualCalibration] = useState<FloorCalibration>(calibration || DEFAULT_FLOOR_CALIBRATION);
    const [isCalibrated, setIsCalibrated] = useState(!!calibration && calibration.width > 0);
    const { showNotification } = useToasterNotification();

    // ============================================
    // ✨ WALL DRAWING STATE (Enhanced with validation)
    // ============================================

    const [firstPoint, setFirstPoint] = useState<{
        x: number;
        y: number;
        z: number;
        floorY: number;
        areaId: number;
    } | null>(null);

    const [previewEndPoint, setPreviewEndPoint] = useState<{ x: number, y: number, z: number } | null>(null);

    // Reset wall drawing state when mode is disabled
    useEffect(() => {
        if (!wallDrawMode) {
            setFirstPoint(null);
            setPreviewEndPoint(null);
        }
    }, [wallDrawMode]);

    // Sync calibration prop
    useEffect(() => {
        console.log('BuildingScene: Calibration prop changed:', calibration);
        if (calibration && (calibration.width > 0)) {
            setActualCalibration(calibration);
            setIsCalibrated(true);
            console.log('BuildingScene: Calibration sync successful');
        }
    }, [calibration]);

    // Auto-focus camera on selected sensor
    useEffect(() => {
        if (selectedSensorId && controls && typeof controls.setLookAt === 'function') {
            const sensor = sensors.find(s => s.id === selectedSensorId);
            if (sensor) {
                const floorLevel = sensor.floor_level ?? 0;
                const pos = transformSensorTo3D(sensor, actualCalibration, floorLevel, floorSpacing);

                const tx = pos.x - (actualCalibration.centerX || 0);
                const ty = pos.y;
                const tz = pos.z - (actualCalibration.centerZ || 0);

                controls.setLookAt(
                    tx + 15, ty + 10, tz + 15,
                    tx, ty, tz,
                    true
                );
            }
        }
    }, [selectedSensorId, controls, sensors, actualCalibration, floorSpacing]);

    const handleFloorLoad = (measuredCal: FloorCalibration) => {
        if (!isCalibrated) {
            console.log('Auto-calibrating building with:', measuredCal);
            setActualCalibration(measuredCal);
            setIsCalibrated(true);
            onLoad?.(measuredCal);
        }
    };

    // ============================================
    // ✨ ENHANCED: Floor Click Handler (Issue #4 - Validation)
    // ============================================

    const handleFloorClick = (event: any) => {
        console.log('BuildingScene: Floor Click event:', {
            wallDrawMode,
            isCalibrated,
            point3D: event.point,
            userData: event.object?.userData,
            firstPointSet: !!firstPoint
        });

        const canDraw = wallDrawMode && (isCalibrated || (actualCalibration && actualCalibration.width > 0));

        if (!canDraw) {
            console.log('BuildingScene: Click ignored - mode disabled or no calibration');
            return;
        }

        event.stopPropagation();

        const point3D = event.point;
        const clickedMesh = event.object;
        const areaId = clickedMesh.userData?.areaId;

        // ✨ NEW: Validate click (Issue #4)
        const validation = validateWallClick(point3D, areaId, actualCalibration);

        if (!validation.valid) {
            showNotification(
                'Invalid Click',
                validation.reason || 'Click must be on a floor surface',
                validation.severity === 'warning' ? 'warning' : 'danger'
            );
            console.warn('BuildingScene: Invalid click:', validation.reason);
            return;
        }

        // Show warning if present (but allow click to proceed)
        if (validation.severity === 'warning') {
            showNotification('Warning', validation.reason || '', 'warning');
        }

        console.log('BuildingScene: Raycast hit areaId:', areaId);

        if (areaId === undefined) {
            console.warn('BuildingScene: Clicked floor has no areaId in userData');
            return;
        }

        // ============================================
        // FIRST CLICK: Set first point
        // ============================================

        if (!firstPoint) {
            console.log('BuildingScene: Setting first point at', point3D);
            setFirstPoint({
                x: point3D.x,
                y: point3D.y,
                z: point3D.z,
                floorY: point3D.y,
                areaId: areaId
            });

            showNotification(
                'First Point Set',
                'Click on the map to set the second point (ESC to cancel)',
                'info'
            );
        }

        // ============================================
        // SECOND CLICK: Create wall
        // ============================================

        else {
            console.log('BuildingScene: Processing second click at', point3D, 'for firstPoint at', firstPoint);

            // ✨ NEW: Validate wall segment (Issue #4)
            const segmentValidation = validateWallSegment(
                new THREE.Vector3(firstPoint.x, firstPoint.y, firstPoint.z),
                new THREE.Vector3(point3D.x, point3D.y, point3D.z),
                firstPoint.floorY
            );

            if (!segmentValidation.valid) {
                showNotification(
                    'Invalid Wall',
                    segmentValidation.reason || 'Cannot create wall between these points',
                    'danger'
                );
                console.warn('BuildingScene: Invalid wall segment:', segmentValidation.reason);

                // Reset and allow user to try again
                setFirstPoint(null);
                setPreviewEndPoint(null);
                return;
            }

            // Show warning if present (but allow wall creation)
            if (segmentValidation.severity === 'warning') {
                showNotification('Warning', segmentValidation.reason || '', 'warning');
            }

            // Create the wall
            const normalized1 = transform3DToNormalized(
                { x: firstPoint.x, y: firstPoint.y, z: firstPoint.z },
                actualCalibration,
                firstPoint.floorY
            );
            const normalized2 = transform3DToNormalized(
                { x: point3D.x, y: point3D.y, z: point3D.z },
                actualCalibration,
                point3D.y
            );

            console.log('BuildingScene: Normalized coordinates calculated:', { normalized1, normalized2 });

            const newWall: Partial<Wall> = {
                r_x1: normalized1.x,
                r_y1: normalized1.y,
                r_x2: normalized2.x,
                r_y2: normalized2.y,
                r_height: DEFAULT_WALL_HEIGHT,
                r_z_offset: 0,
                color: DEFAULT_WALL_COLOR,
                opacity: DEFAULT_WALL_OPACITY,
                thickness: 0.15,
                area_ids: [areaId]
            };

            console.log('BuildingScene: Calling onWallCreated with:', newWall);

            showNotification(
                'Wall Created',
                'Wall added successfully. Remember to save your changes.',
                'success'
            );

            onWallCreated?.(newWall);
            setFirstPoint(null);
            setPreviewEndPoint(null);
        }
    };

    // ============================================
    // ✨ ENHANCED: Pointer Move Handler (Preview)
    // ============================================

    const handleFloorPointerMove = (event: any) => {
        const canDraw = wallDrawMode && firstPoint && (isCalibrated || (actualCalibration && actualCalibration.width > 0));

        if (!canDraw) {
            if (previewEndPoint) setPreviewEndPoint(null);
            return;
        }

        event.stopPropagation();
        const point3D = event.point;

        // Only show preview if on same floor
        if (Math.abs(point3D.y - firstPoint.floorY) < 0.5) {
            setPreviewEndPoint({ x: point3D.x, y: point3D.y, z: point3D.z });
        } else {
            if (previewEndPoint) setPreviewEndPoint(null);
        }
    };

    // ============================================
    // FLATTEN AREAS & GROUP DATA
    // ============================================

    const floors = useMemo(() => {
        const flatAreas = flattenAreas(areas);
        return flatAreas
            .filter(area => (area.area_type === 'floor' || area.area_type === 'room') &&
                (area.floor_level !== undefined || area.offset_z !== undefined))
            .sort((a, b) => (a.floor_level ?? a.offset_z ?? 0) - (b.floor_level ?? b.offset_z ?? 0));
    }, [areas]);

    // ✨ MODIFIED: Merge preview data into sensors
    const displaySensors = useMemo(() => {
        if (isSensorPositionPreview(previewState)) {
            return sensors.map(s => {
                if (String(s.id) === String(previewState.data.sensorId)) {
                    return {
                        ...s,
                        x_val: previewState.data.x_val,
                        y_val: previewState.data.y_val,
                        z_val: previewState.data.z_val
                    };
                }
                return s;
            });
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

    const handleSensorClick = (sensor: Sensor) => {
        if (setSelectedSensorId) {
            setSelectedSensorId(sensor.id);
        }
        onSensorClick?.(sensor);
    };

    // ============================================
    // ✨ NEW: Calculate preview wall for drawing mode
    // ============================================

    const previewWall = useMemo(() => {
        if (!firstPoint || !previewEndPoint || !isCalibrated) return null;

        const normalized1 = transform3DToNormalized(
            { x: firstPoint.x, y: firstPoint.y, z: firstPoint.z },
            actualCalibration,
            firstPoint.floorY
        );
        const normalized2 = transform3DToNormalized(
            { x: previewEndPoint.x, y: previewEndPoint.y, z: previewEndPoint.z },
            actualCalibration,
            previewEndPoint.y
        );

        return {
            id: 'preview',
            r_x1: normalized1.x,
            r_y1: normalized1.y,
            r_x2: normalized2.x,
            r_y2: normalized2.y,
            r_height: DEFAULT_WALL_HEIGHT,
            color: DEFAULT_WALL_COLOR,
            opacity: DEFAULT_WALL_OPACITY,
            thickness: 0.15
        } as Wall;
    }, [firstPoint, previewEndPoint, actualCalibration, isCalibrated]);

    // ============================================
    // RENDER
    // ============================================

    return (
        <group>
            {/* Ambient lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, 10, -5]} intensity={0.5} />

            {/* Render floors */}
            {floors.map((floor, index) => {
                const floorLevel = floor.floor_level ?? floor.offset_z ?? index;
                const isVisible = visibleAreaIds.length === 0 || visibleAreaIds.includes(Number(floor.id));
                const yPosition = floor.offset_z !== undefined ? floor.offset_z * 4.0 : floorLevel * floorSpacing;
                const modelUrl = floor.area_plan || floor.floor_plan_url;
                const floorSensors = sensorsByArea[floor.id] || [];

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
                                onLoad={floorLevel === 0 ? handleFloorLoad : undefined}
                                centerModel={true}
                                modelUrl={modelUrl}
                                onClick={wallDrawMode ? handleFloorClick : undefined}
                                onPointerMove={wallDrawMode ? handleFloorPointerMove : undefined}
                            />
                        )}

                        {/* ✨ MODIFIED: Walls from centralized data */}
                        {isVisible && (
                            <FloorWallManager
                                areaId={floor.id}
                                walls={wallsByArea[floor.id] || []} // ✨ NEW: Passed from parent
                                calibration={actualCalibration}
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
                            />
                        )}

                        {/* Legacy: Walls embedded in floor object */}
                        {isVisible && floor.walls && floor.walls.map((wall) => (
                            <WallSegment
                                key={`wall-embedded-${wall.id}`}
                                wall={wall}
                                calibration={actualCalibration}
                                floorY={yPosition}
                                isSelected={String(selectedWallId) === String(wall.id)}
                                onClick={onWallClick}
                                onDrag={(delta) => onWallDrag?.(wall, delta)}
                                onUpdateEndpoints={(points) => onWallEndpointsUpdate?.(wall, points)}
                            />
                        ))}

                        {/* Render sensors */}
                        {isVisible && floorSensors.map((sensor) => {
                            const position3D = transformSensorTo3D(sensor, actualCalibration, floorLevel, floorSpacing);
                            const status = calculateSensorStatus(sensor);
                            const isHovered = hoveredSensor === sensor.id;
                            const isSelected = selectedSensorId === sensor.id;

                            const sensorPos: [number, number, number] = [
                                position3D.x - (actualCalibration.centerX || 0),
                                position3D.y,
                                position3D.z - (actualCalibration.centerZ || 0)
                            ];

                            // ✨ MODIFIED: Get sensor walls from preview if available
                            const sensorWalls = (isSensorWallsPreview(previewState) &&
                                String(previewState.data.sensorId) === String(sensor.id))
                                ? previewState.data.walls
                                : (sensor.walls || []);

                            return (
                                <React.Fragment key={`sensor-${sensor.id}`}>
                                    <SensorMarker
                                        position={sensorPos}
                                        status={status}
                                        scale={isSelected ? 0.8 : isHovered ? 0.7 : 0.6}
                                        onClick={() => handleSensorClick(sensor)}
                                        onHover={(hovered) => setHoveredSensor(hovered ? sensor.id : null)}
                                        sensorName={sensor.name}
                                        isSelected={isSelected}
                                        onDrag={(newPos) => {
                                            const newCoords = transform3DToSensor(
                                                {
                                                    x: newPos[0] + (actualCalibration.centerX || 0),
                                                    y: newPos[1],
                                                    z: newPos[2] + (actualCalibration.centerZ || 0)
                                                },
                                                actualCalibration,
                                                floorLevel,
                                                floorSpacing
                                            );
                                            onSensorDrag?.(sensor, newCoords);
                                        }}
                                    />

                                    {/* Sensor walls */}
                                    {isVisible && isSelected && sensorWalls.map((wall) => (
                                        <WallSegment
                                            key={`sensor-wall-${wall.id}`}
                                            wall={wall}
                                            calibration={actualCalibration}
                                            floorY={yPosition}
                                            isSelected={String(selectedWallId) === String(wall.id)}
                                            isBlinking={blinkingWallIds.includes(wall.id)}
                                            onClick={onWallClick}
                                            onDrag={(delta) => onWallDrag?.(wall, delta)}
                                        />
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </group>
                );
            })}

            {/* Grid helper */}
            <gridHelper visible={false} args={[100, 100, '#ede1e1ff', '#1b1616ff']} position={[0, -0.1, 0]} />

            {/* ============================================ */}
            {/* ✨ ENHANCED: Wall Drawing Visual Feedback    */}
            {/* ============================================ */}

            {wallDrawMode && firstPoint && (
                <group>
                    {/* First point marker */}
                    <mesh
                        visible={false}
                        position={[firstPoint.x, firstPoint.y, firstPoint.z]}>
                        <sphereGeometry args={[FIRST_POINT_MARKER_SIZE, 16, 16]} />
                        <meshBasicMaterial color={FIRST_POINT_MARKER_COLOR} />
                    </mesh>

                    {/* ✨ ENHANCED: Full wall preview instead of just a line */}
                    {previewWall && (
                        <WallSegment
                            wall={previewWall}
                            calibration={actualCalibration}
                            floorY={firstPoint.floorY}
                            isPreview={true} // ✨ NEW: Visual distinction
                        />
                    )}
                </group>
            )}
        </group>
    );
}