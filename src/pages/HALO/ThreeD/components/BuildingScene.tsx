import React, { useState, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useWalls } from '../../../../api/sensors.api';
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
    calibration?: FloorCalibration;
    onLoad?: (calibration: FloorCalibration) => void;
    selectedSensorId?: string | number | null;
    setSelectedSensorId?: (id: string | number | null) => void;
    selectedWallId?: string | number | null;
    previewData?: any;
    blinkingWallIds?: (number | string)[];
    // Wall drawing mode
    wallDrawMode?: boolean;
    onWallCreated?: (wall: Partial<Wall>) => void;
}

/**
 * Component to handle fetching and rendering walls for a specific area
 */
const FloorWallManager = ({
    areaId,
    calibration,
    floorY,
    selectedWallId,
    onWallClick,
    onWallDrag,
    previewData,
    blinkingWallIds = []
}: {
    areaId: number | string,
    calibration: FloorCalibration,
    floorY: number,
    selectedWallId?: string | number | null,
    onWallClick?: (wall: Wall) => void,
    onWallDrag?: (wall: Wall, delta: { x: number, y: number, z: number }) => void,
    previewData?: any,
    blinkingWallIds?: (number | string)[]
}) => {
    const { data: walls, isLoading } = useWalls(areaId);
    const [hoveredWallId, setHoveredWallId] = useState<string | number | null>(null);

    const displayWalls = useMemo(() => {
        // If previewData exists and is for this area's walls
        if (previewData && previewData.walls) {
            return previewData.walls;
        }
        return walls || [];
    }, [walls, previewData]);

    if ((isLoading && !previewData) || displayWalls.length === 0) return null;

    return (
        <>
            {displayWalls.map((wall: any) => (
                <WallSegment
                    key={`area-wall-${wall.id}`}
                    wall={wall}
                    calibration={calibration}
                    floorY={floorY}
                    isSelected={String(selectedWallId) === String(wall.id)}
                    isHovered={hoveredWallId === wall.id}
                    isBlinking={blinkingWallIds.includes(wall.id)}
                    onClick={onWallClick}
                    onHover={(hovered) => setHoveredWallId(hovered ? wall.id : null)}
                    onDrag={(delta) => onWallDrag?.(wall, delta)}
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
    calibration = DEFAULT_FLOOR_CALIBRATION,
    onLoad,
    selectedSensorId,
    setSelectedSensorId,
    selectedWallId,
    previewData,
    blinkingWallIds = [],
    wallDrawMode = false,
    onWallCreated
}: BuildingSceneProps) {
    const { controls } = useThree() as any;
    const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
    const [hoveredWallId, setHoveredWallId] = useState<string | number | null>(null);
    const [actualCalibration, setActualCalibration] = useState<FloorCalibration>(calibration || DEFAULT_FLOOR_CALIBRATION);
    const [isCalibrated, setIsCalibrated] = useState(!!calibration && calibration.width > 0);

    // Wall drawing state
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

                // Adjust for building centering
                const tx = pos.x - (actualCalibration.centerX || 0);
                const ty = pos.y;
                const tz = pos.z - (actualCalibration.centerZ || 0);

                // Smoothly move camera to focus on sensor
                // We offset the camera slightly so it's not looking straight down
                controls.setLookAt(
                    tx + 15, ty + 10, tz + 15, // eye position (scaled down from 150)
                    tx, ty, tz,                 // target position
                    true                        // enable transition
                );
            }
        }
    }, [selectedSensorId, controls, sensors, actualCalibration, floorSpacing]);

    // Update actual calibration when floor loads
    const handleFloorLoad = (measuredCal: FloorCalibration) => {
        if (!isCalibrated) {
            console.log('Auto-calibrating building with:', measuredCal);
            setActualCalibration(measuredCal);
            setIsCalibrated(true);
            onLoad?.(measuredCal);
        }
    };

    // Handle floor click for wall drawing
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
            console.log('BuildingScene: Click ignored - mode disabled or no calibration', {
                wallDrawMode,
                isCalibrated,
                calWidth: actualCalibration?.width
            });
            return;
        }
        event.stopPropagation();

        const point3D = event.point;
        const clickedMesh = event.object;
        const areaId = clickedMesh.userData?.areaId;

        console.log('BuildingScene: Raycast hit areaId:', areaId);

        if (areaId === undefined) {
            console.warn('BuildingScene: Clicked floor has no areaId in userData');
            return;
        }

        if (!firstPoint) {
            console.log('BuildingScene: Setting first point at', point3D);
            setFirstPoint({ x: point3D.x, y: point3D.y, z: point3D.z, floorY: point3D.y, areaId: areaId });
        } else {
            console.log('BuildingScene: Processing second click at', point3D, 'for firstPoint at', firstPoint);
            if (Math.abs(point3D.y - firstPoint.floorY) < 0.5) {
                const normalized1 = transform3DToNormalized({ x: firstPoint.x, y: firstPoint.y, z: firstPoint.z }, actualCalibration, firstPoint.floorY);
                const normalized2 = transform3DToNormalized({ x: point3D.x, y: point3D.y, z: point3D.z }, actualCalibration, point3D.y);

                console.log('BuildingScene: Normalized coordinates calculated:', { normalized1, normalized2 });

                const newWall: Partial<Wall> = {
                    r_x1: normalized1.x, r_y1: normalized1.y, r_x2: normalized2.x, r_y2: normalized2.y,
                    r_height: 2.4, r_z_offset: 0, color: '#ffffff', opacity: 0.7, thickness: 0.15, area_ids: [areaId]
                };

                console.log('BuildingScene: Calling onWallCreated with:', newWall);
                onWallCreated?.(newWall);
                setFirstPoint(null);
                setPreviewEndPoint(null);
            } else {
                console.warn('BuildingScene: Click error - points must be on the same floor level (Y diff too large)', {
                    y1: firstPoint.floorY,
                    y2: point3D.y
                });
                setFirstPoint(null);
                setPreviewEndPoint(null);
            }
        }
    };

    const handleFloorPointerMove = (event: any) => {
        const canDraw = wallDrawMode && firstPoint && (isCalibrated || (actualCalibration && actualCalibration.width > 0));

        if (!canDraw) {
            if (previewEndPoint) setPreviewEndPoint(null);
            return;
        }
        event.stopPropagation();
        const point3D = event.point;
        if (Math.abs(point3D.y - firstPoint.floorY) < 0.5) {
            setPreviewEndPoint({ x: point3D.x, y: point3D.y, z: point3D.z });
        } else {
            if (previewEndPoint) setPreviewEndPoint(null);
        }
    };

    // Step 1: Flatten the hierarchy to find all floors
    const floors = useMemo(() => {
        const flatAreas = flattenAreas(areas);
        return flatAreas
            .filter(area => (area.area_type === 'floor' || area.area_type === 'room') &&
                (area.floor_level !== undefined || area.offset_z !== undefined))
            .sort((a, b) => (a.floor_level ?? a.offset_z ?? 0) - (b.floor_level ?? b.offset_z ?? 0));
    }, [areas]);

    // Merge preview data into sensors for real-time visualization
    const displaySensors = useMemo(() => {
        if (!previewData || !previewData.id) return sensors;

        return sensors.map(s => {
            if (String(s.id) === String(previewData.id)) {
                return { ...s, ...previewData };
            }
            return s;
        });
    }, [sensors, previewData]);

    // Group sensors by area ID (Floor ID)
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

    // Grouping for sidebar list (inside scene)
    const sensorsByFloor = useMemo(() => {
        const grouped: Record<number, Sensor[]> = {};
        displaySensors.forEach(s => {
            const floor = s.floor_level ?? 0;
            if (!grouped[floor]) grouped[floor] = [];
            grouped[floor].push(s);
        });
        return grouped;
    }, [displaySensors]);

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

                // Use backend offset_z if available, otherwise fallback to floorSpacing
                // Scale offset_z by a factor (e.g. 4.0) to make it real-world meters if needed
                const yPosition = floor.offset_z !== undefined ? floor.offset_z * 4.0 : floorLevel * floorSpacing;

                const modelUrl = floor.area_plan || floor.floor_plan_url || '/floor_tiles.glb';
                const floorSensors = sensorsByArea[floor.id] || [];

                return (
                    <group key={`floor-group-${floor.id}`}>
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

                        {/* Rendering Walls for this Area/Floor from dedicated endpoint */}
                        {isVisible && (
                            <FloorWallManager
                                areaId={floor.id}
                                calibration={actualCalibration}
                                floorY={yPosition}
                                selectedWallId={selectedWallId}
                                onWallClick={onWallClick}
                                onWallDrag={onWallDrag}
                                previewData={previewData}
                                blinkingWallIds={blinkingWallIds}
                            />
                        )}

                        {/* Rendering Walls embedded in the floor object (legacy/backup) */}
                        {isVisible && floor.walls && floor.walls.map((wall) => (
                            <WallSegment
                                key={`wall-embedded-${wall.id}`}
                                wall={wall}
                                calibration={actualCalibration}
                                floorY={yPosition}
                                isSelected={String(selectedWallId) === String(wall.id)}
                                isHovered={hoveredWallId === wall.id}
                                onClick={onWallClick}
                                onHover={(hovered) => setHoveredWallId(hovered ? wall.id : null)}
                                onDrag={(delta) => onWallDrag?.(wall, delta)}
                            />
                        ))}

                        {/* Render sensors for this floor only if floor is visible */}
                        {isVisible && floorSensors.map((sensor) => {
                            // Use actualCalibration instead of hardcoded prop
                            const position3D = transformSensorTo3D(sensor, actualCalibration, floorLevel, floorSpacing);
                            const status = calculateSensorStatus(sensor);
                            const isHovered = hoveredSensor === sensor.id;
                            const isSelected = selectedSensorId === sensor.id;

                            // If calibration is centered, adjust sensor position too
                            const sensorPos: [number, number, number] = [
                                position3D.x - (actualCalibration.centerX || 0),
                                position3D.y,
                                position3D.z - (actualCalibration.centerZ || 0)
                            ];

                            return (
                                <React.Fragment key={`sensor-${sensor.id}`}>
                                    {/* Sensor marker */}
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
                                                { x: newPos[0] + (actualCalibration.centerX || 0), y: newPos[1], z: newPos[2] + (actualCalibration.centerZ || 0) },
                                                actualCalibration,
                                                floorLevel,
                                                floorSpacing
                                            );
                                            onSensorDrag?.(sensor, newCoords);
                                        }}
                                    />

                                    {/* Walls attached directly to the sensor (Room boundaries) */}
                                    {isVisible && isSelected && sensor.walls && sensor.walls.map((wall) => (
                                        <WallSegment
                                            key={`sensor-wall-${wall.id}`}
                                            wall={wall}
                                            calibration={actualCalibration}
                                            floorY={yPosition}
                                            isSelected={String(selectedWallId) === String(wall.id)}
                                            isHovered={hoveredWallId === wall.id}
                                            isBlinking={blinkingWallIds.includes(wall.id)}
                                            onClick={onWallClick}
                                            onHover={(hovered) => setHoveredWallId(hovered ? wall.id : null)}
                                            onDrag={(delta) => onWallDrag?.(wall, delta)}
                                        />
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </group>
                );
            })}


            {/* Grid helper for reference - 100m grid with 1m squares */}
            <gridHelper args={[100, 100, '#444444', '#222222']} position={[0, -0.1, 0]} />

            {/* Wall drawing visual feedback */}
            {wallDrawMode && firstPoint && (
                <group>
                    {/* First point marker */}
                    <mesh position={[firstPoint.x, firstPoint.y, firstPoint.z]}>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshBasicMaterial color="yellow" />
                    </mesh>

                    {/* Preview line */}
                    {previewEndPoint && (
                        <line>
                            <bufferGeometry>
                                <bufferAttribute
                                    attach="attributes-position"
                                    count={2}
                                    array={new Float32Array([
                                        firstPoint.x, firstPoint.y, firstPoint.z,
                                        previewEndPoint.x, previewEndPoint.y, previewEndPoint.z
                                    ])}
                                    itemSize={3}
                                />
                            </bufferGeometry>
                            <lineBasicMaterial color="yellow" />
                        </line>
                    )}
                </group>
            )}
        </group>
    );
}
