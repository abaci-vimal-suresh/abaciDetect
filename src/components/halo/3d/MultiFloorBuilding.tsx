import React from 'react';
import Sensor3DMarker from './Sensor3DMarker';
import { Area, Sensor } from '../../../types/sensor';
import { RoomVisibilitySettings } from '../RoomSettingsPanel';
import Room3DBox from '../Room3DBox';

interface MultiFloorBuildingProps {
    areas: Area[];
    visibleSensors: any[];
    roomSettings: RoomVisibilitySettings;
    canvasDimensions: { width: number; height: number };
    floorPlanUrl?: string;
    editMode: boolean;
    hoveredSensor: string | null;
    selectedSensor: string | null;
    onSensorMouseDown: (e: React.MouseEvent, id: string) => void;
    onSensorClick: (sensor: Sensor) => void;
    onUpdateRoom: (sensorId: string, name: string, color: string, showWalls: boolean, wallOpacity?: number) => void;
    getStatusColor: (status: string) => string;
    darkModeStatus: boolean;
    focusedFloorLevel?: number | null;
    rotation: { x: number; y: number };
}


const MultiFloorBuilding: React.FC<MultiFloorBuildingProps> = ({
    areas,
    visibleSensors,
    roomSettings,
    canvasDimensions,
    floorPlanUrl,
    editMode,
    hoveredSensor,
    selectedSensor,
    onSensorMouseDown,
    onSensorClick,
    onUpdateRoom,
    getStatusColor,
    darkModeStatus,
    focusedFloorLevel,
    rotation
}) => {
    // Get visible floors (deduplicated)
    const buildingFloors = Array.from(new Set(areas
        .filter(a => a.floor_level !== undefined && a.floor_level !== null)
        .map(a => a.floor_level)
    )).sort((a, b) => (a || 0) - (b || 0));

    // Fallback to [0] if no floors defined
    const floorsToRender = buildingFloors.length > 0 ? buildingFloors : [0];

    return (
        <div className="floors-container-3d" style={{
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d'
        }}>
            {floorsToRender.map((floorLevel, idx) => {
                const floorL = floorLevel || 0;

                // Visibility logic
                const isVisible = roomSettings.visibleFloors.length > 0
                    ? roomSettings.visibleFloors.includes(floorL)
                    : (focusedFloorLevel !== undefined && focusedFloorLevel !== null
                        ? floorL === focusedFloorLevel
                        : true);

                if (!isVisible) {
                    return null;
                }

                // Elevation logic
                const zOffset = (idx * roomSettings.floorSpacing) - (roomSettings.floorSpacing * floorsToRender.length / 2);
                const posOffset = roomSettings.floorOffsets?.[floorL] || { x: 0, y: 0 };
                const scale = roomSettings.floorScales?.[floorL] || 1;

                // Image logic
                const floorArea = areas.find(a =>
                    a.floor_level !== null &&
                    a.floor_level !== undefined &&
                    Number(a.floor_level) === floorL &&
                    !a.is_room
                );
                const currentFloorPlan = floorArea?.floor_plan_url || (idx === 0 ? floorPlanUrl : null);

                // Apply appropriate filter based on mode (Fixed default for dark mode clarity)
                const appliedFilter = (currentFloorPlan && darkModeStatus)
                    ? 'grayscale(1) invert(1) brightness(0.85) contrast(1.6) sepia(0.35) hue-rotate(190deg) saturate(1.4)'
                    : 'none';

                return (
                    <div
                        key={`floor-level-${floorL}`}
                        className="floor-layer-3d"
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: canvasDimensions.width,
                            height: canvasDimensions.height,
                            transform: `translate(-50%, -50%) translateZ(${zOffset}px) translate(${posOffset.x}px, ${posOffset.y}px) scale(${scale})`,
                            transformStyle: 'preserve-3d',
                            pointerEvents: 'none',
                            zIndex: (idx + 1) * 100,
                        }}
                    >
                        {/* Floor label */}
                        {roomSettings.showFloorLabels && (
                            <div className="floor-label-3d" style={{
                                position: 'absolute',
                                left: -60,
                                top: '50%',
                                transform: 'translateY(-50%) rotateY(30deg)',
                                color: '#3B82F6',
                                fontWeight: 'bold',
                                textShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
                            }}>
                                LVL {floorL}
                            </div>
                        )}

                        {/* Base Floor Plane */}
                        {roomSettings.showFloor && (
                            <div className="floor-base-plane" style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backgroundColor: darkModeStatus ? 'rgba(7, 15, 35, 0.6)' : 'rgba(59, 130, 246, 0.05)',
                                border: darkModeStatus ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(59, 130, 246, 0.2)',
                                opacity: roomSettings.floorOpacity,
                                backgroundImage: currentFloorPlan ? `url(${currentFloorPlan})` : 'none',
                                backgroundSize: 'cover',
                                filter: appliedFilter,
                                transition: 'filter 0.5s ease-in-out',
                                transform: 'translateZ(-0.1px)',
                                backfaceVisibility: 'visible',
                                boxShadow: currentFloorPlan && darkModeStatus
                                    ? 'inset 0 0 40px rgba(59, 130, 246, 0.2)'
                                    : 'none'
                            }} />
                        )}

                        {/* Render Rooms (Sensors with boundaries) */}
                        {visibleSensors
                            .filter(m => m.sensor.boundary && (m.sensor.floor_level === floorL || (floorL === 0 && m.sensor.floor_level === undefined)))
                            .map(marker => (
                                <Room3DBox
                                    key={`room-${marker.sensor.id}`}
                                    sensor={marker.sensor}
                                    floorW={canvasDimensions.width}
                                    floorH={canvasDimensions.height}
                                    wallHeight={roomSettings.wallHeight}
                                    floorPlanUrl={currentFloorPlan || undefined}
                                    statusColor={getStatusColor(marker.status)}
                                    status={marker.status}
                                    wallOpacity={roomSettings.wallOpacity}
                                    floorOpacity={roomSettings.floorOpacity}
                                    ceilingOpacity={roomSettings.ceilingOpacity}
                                    onUpdateRoom={onUpdateRoom}
                                    pulseSpeed={roomSettings.pulseSpeed}
                                    showWalls={roomSettings.showWalls}
                                    sectionCutEnabled={roomSettings.sectionCutEnabled}
                                    sectionCutPlane={roomSettings.sectionCutPlane}
                                    sectionCutPosition={roomSettings.sectionCutPosition}
                                    rotation={rotation}
                                    floorSpacing={roomSettings.floorSpacing}
                                />
                            ))}

                        {/* Render Sensor Markers (Pins) */}
                        {visibleSensors
                            .filter(m => m.sensor.floor_level === floorL || (floorL === 0 && m.sensor.floor_level === undefined))
                            .map(marker => (
                                <Sensor3DMarker
                                    key={`marker-${marker.sensor.id}`}
                                    sensor={marker.sensor}
                                    x={marker.x}
                                    y={marker.y}
                                    status={marker.status}
                                    statusColor={getStatusColor(marker.status)}
                                    isHovered={hoveredSensor === marker.sensor.id}
                                    isSelected={selectedSensor === marker.sensor.id}
                                    editMode={editMode}
                                    wallHeight={roomSettings.wallHeight}
                                    onMouseDown={(e) => onSensorMouseDown(e, marker.sensor.id)}
                                    rotation={rotation}
                                    floorSpacing={roomSettings.floorSpacing}
                                    onClick={(e) => {
                                        if (!editMode) {
                                            e.stopPropagation();
                                            onSensorClick(marker.sensor);
                                        }
                                    }}
                                />
                            ))}
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(MultiFloorBuilding);
