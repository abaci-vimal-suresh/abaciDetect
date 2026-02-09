import React, { useState, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Sensor, Area } from '../../../../types/sensor';
import { FloorModel, SensorMarker, BoundaryBox } from './FloorComponents';
import { flattenAreas } from '../utils/dataTransform';
import {
    transformSensorTo3D,
    transformBoundaryTo3D,
    transform3DToSensor,
    calculateSensorStatus,
    DEFAULT_FLOOR_CALIBRATION,
    FloorCalibration
} from '../utils/coordinateTransform';

interface BuildingSceneProps {
    areas: Area[];
    sensors: Sensor[];
    visibleFloors?: number[];
    floorSpacing?: number;
    floorOpacity?: number;
    showBoundaries?: boolean;
    onSensorClick?: (sensor: Sensor) => void;
    onSensorDrag?: (sensor: Sensor, newCoords: { x_val: number, y_val: number, z_val: number }) => void;
    calibration?: FloorCalibration;
    selectedSensorId?: string | null;
    setSelectedSensorId?: (id: string | null) => void;
    previewData?: any;
}


export function BuildingScene({
    areas,
    sensors,
    visibleFloors = [0, 1, 2],
    floorSpacing = 200,
    floorOpacity = 1,
    showBoundaries = true,
    onSensorClick,
    onSensorDrag,
    calibration = DEFAULT_FLOOR_CALIBRATION,
    selectedSensorId,
    setSelectedSensorId,
    previewData
}: BuildingSceneProps) {
    const { controls } = useThree() as any;
    const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
    const [actualCalibration, setActualCalibration] = useState<FloorCalibration>(calibration);
    const [isCalibrated, setIsCalibrated] = useState(false);

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
                    tx + 150, ty + 100, tz + 150, // eye position
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
            {floors.map((floor) => {
                const floorLevel = floor.floor_level ?? floor.offset_z ?? 0;
                const isVisible = visibleFloors.includes(floorLevel);
                // GLB Override: If the backend sends a .jpg, we use the local .glb instead
                // as the 3D scene requires geometry.
                const rawUrl = floor.area_plan || floor.floor_plan_url || '/floor_tiles.glb';
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
                const isImage = imageExtensions.some(ext => rawUrl.toLowerCase().endsWith(ext));
                const modelUrl = isImage ? '/floor_tiles.glb' : rawUrl;
                const floorSensors = sensorsByArea[floor.id] || [];

                return (
                    <group key={`floor-group-${floor.id}`}>
                        <FloorModel
                            key={`floor-${floor.id}`}
                            floorLevel={floorLevel}
                            floorSpacing={floorSpacing}
                            visible={isVisible}
                            opacity={floorOpacity}
                            onLoad={floorLevel === 0 ? handleFloorLoad : undefined}
                            centerModel={true} // Auto-center building on grid
                            modelUrl={modelUrl}
                        />

                        {/* Render sensors for this floor only if floor is visible */}
                        {isVisible && floorSensors.map((sensor) => {
                            // Use actualCalibration instead of hardcoded prop
                            const position3D = transformSensorTo3D(sensor, actualCalibration, floorLevel, floorSpacing);
                            const boundary = transformBoundaryTo3D(sensor, actualCalibration, floorLevel, floorSpacing);
                            const hasBoundary = !!boundary;
                            const status = calculateSensorStatus(sensor);
                            const isHovered = hoveredSensor === sensor.id;
                            const isSelected = selectedSensorId === sensor.id;

                            // If calibration is centered, adjust sensor position too
                            const sensorPos: [number, number, number] = [
                                position3D.x - (actualCalibration.centerX || 0),
                                position3D.y,
                                position3D.z - (actualCalibration.centerZ || 0)
                            ];

                            // Calculate boundary position if it exists
                            let boundaryPos: [number, number, number] | null = null;
                            if (boundary) {
                                boundaryPos = [
                                    boundary.position[0] - (actualCalibration.centerX || 0),
                                    boundary.position[1],
                                    boundary.position[2] - (actualCalibration.centerZ || 0)
                                ];
                            }

                            return (
                                <React.Fragment key={`sensor-${sensor.id}`}>
                                    {/* Sensor marker */}
                                    <SensorMarker
                                        position={sensorPos}
                                        status={status}
                                        scale={isSelected ? 8.0 : isHovered ? 7.0 : 6.0}
                                        onClick={() => handleSensorClick(sensor)}
                                        onHover={(hovered) => setHoveredSensor(hovered ? sensor.id : null)}
                                        sensorName={sensor.name}
                                        hasBoundary={hasBoundary}
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

                                    {/* Boundary box */}
                                    {showBoundaries && boundary && (
                                        <BoundaryBox
                                            position={boundaryPos || boundary.position}
                                            size={boundary.size}
                                            color={status === 'safe' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444'}
                                            visible={showBoundaries}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </group>
                );
            })}


            {/* Grid helper for reference */}
            <gridHelper args={[30, 30, '#444444', '#222222']} position={[0, -0.1, 0]} />
        </group>
    );
}
