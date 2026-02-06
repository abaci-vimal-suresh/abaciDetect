import React, { useState, useMemo } from 'react';
import { Sensor, Area } from '../../../../types/sensor';
import { FloorModel, SensorMarker, BoundaryBox } from './FloorComponents';
import { flattenAreas } from '../utils/dataTransform';
import {
    transformSensorTo3D,
    transformBoundaryTo3D,
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
    calibration?: FloorCalibration;
}

/**
 * BuildingScene - Main 3D scene orchestrator
 * Renders all floors, sensors, and boundaries based on data
 */
export function BuildingScene({
    areas,
    sensors,
    visibleFloors = [0, 1, 2],
    floorSpacing = 200,
    floorOpacity = 1,
    showBoundaries = true,
    onSensorClick,
    calibration = DEFAULT_FLOOR_CALIBRATION
}: BuildingSceneProps) {
    const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
    const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
    const [actualCalibration, setActualCalibration] = useState<FloorCalibration>(calibration);
    const [isCalibrated, setIsCalibrated] = useState(false);

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

    // Group sensors by area ID (Floor ID)
    const sensorsByArea = useMemo(() => {
        const grouped: Record<number, Sensor[]> = {};
        sensors.forEach(sensor => {
            const areaId = sensor.area_id ?? (typeof sensor.area === 'number' ? sensor.area : 0);
            if (!grouped[areaId]) grouped[areaId] = [];
            grouped[areaId].push(sensor);
        });
        return grouped;
    }, [sensors]);

    const handleSensorClick = (sensor: Sensor) => {
        setSelectedSensor(sensor.id);
        onSensorClick?.(sensor);
    };

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
                            modelUrl={floor.area_plan || floor.floor_plan_url}
                        />

                        {/* Render sensors for this floor only if floor is visible */}
                        {isVisible && floorSensors.map((sensor) => {
                            // Use actualCalibration instead of hardcoded prop
                            const position3D = transformSensorTo3D(sensor, actualCalibration, floorLevel, floorSpacing);
                            const boundary = transformBoundaryTo3D(sensor, actualCalibration, floorLevel, floorSpacing);
                            const hasBoundary = !!boundary;
                            const status = calculateSensorStatus(sensor);
                            const isHovered = hoveredSensor === sensor.id;
                            const isSelected = selectedSensor === sensor.id;

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
                                        scale={isSelected ? 5.0 : isHovered ? 4.5 : 4.0}
                                        onClick={() => handleSensorClick(sensor)}
                                        onHover={(hovered) => setHoveredSensor(hovered ? sensor.id : null)}
                                        sensorName={sensor.name}
                                        hasBoundary={hasBoundary}
                                    />

                                    {/* Boundary box */}
                                    {showBoundaries && boundary && boundaryPos && (
                                        <BoundaryBox
                                            position={boundaryPos}
                                            size={boundary.size}
                                            color={status === 'critical' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#10B981'}
                                            opacity={isSelected ? 0.4 : isHovered ? 0.3 : 0.15}
                                            visible={true}
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
