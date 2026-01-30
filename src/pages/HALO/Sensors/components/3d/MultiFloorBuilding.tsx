import React from 'react';
import Sensor3DMarker from './Sensor3DMarker';
import { Area, Sensor } from '../../../../../types/sensor';
import { RoomVisibilitySettings } from '../RoomSettingsPanel';
import Room3DBox from '../Room3DBox';

interface MultiFloorBuildingProps {
    areas: Area[];
    visibleSensors: any[];
    roomSettings: RoomVisibilitySettings;
    canvasDimensions: { width: number; height: number };
    floorPlanUrl?: string;
    editMode: boolean;
    hoveredSensor: string | number | null;
    selectedSensor: string | number | null;
    onSensorMouseDown: (e: React.MouseEvent, id: string | number) => void;
    onSensorClick: (sensor: Sensor) => void;
    onUpdateRoom: (sensorId: string | number, name: string, color: string, showWalls: boolean, wallOpacity?: number) => void;
    getStatusColor: (status: string) => string;
    darkModeStatus: boolean;
    focusedFloorLevel?: number | null;
    rotation: { x: number; y: number };
    selectedParameters: string[];
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
    rotation,
    selectedParameters,
}) => {
    // 1. Identify the "Main Area" (Building) - parent_id is null and type is building
    const mainArea = areas.find(a => a.parent_id === null && a.area_type === 'building');

    // 2. Identify "Floors" - parent_id points to mainArea OR type is floor
    const floorAreas = areas.filter(a =>
        (mainArea && a.parent_id === mainArea.id) ||
        (a.area_type === 'floor')
    ).sort((a, b) => (a.floor_level ?? 0) - (b.floor_level ?? 0));

    // 3. Fallback: If no explicit floor areas found, use the old floor_level logic
    const buildingFloors = Array.from(new Set(areas
        .filter(a => a.floor_level !== undefined && a.floor_level !== null)
        .map(a => a.floor_level)
    )).sort((a, b) => (a || 0) - (b || 0));

    // Define what we are rendering as "layers"
    const layersToRender = floorAreas.length > 0
        ? floorAreas.map((f, idx) => ({
            id: f.id,
            level: f.floor_level ?? idx,
            name: f.name,
            plan: f.area_plan || f.floor_plan_url || f.floor_plan_image
        }))
        : buildingFloors.map((level, idx) => ({
            id: `level-${level}`,
            level: level ?? 0,
            name: `Level ${level}`,
            plan: idx === 0 ? floorPlanUrl : null
        }));

    return (
        <div className="floors-container-3d" style={{
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d'
        }}>
            {layersToRender.map((layer, idx) => {
                const floorL = layer.level;

                // Visibility logic: Visible if in visibleFloors array OR if visibleFloors is empty (show all)
                const isVisible = roomSettings.visibleFloors.length === 0 || roomSettings.visibleFloors.includes(floorL);

                if (!isVisible) {
                    return null;
                }

                // Elevation logic
                const zOffset = (idx * roomSettings.floorSpacing) - (roomSettings.floorSpacing * layersToRender.length / 2);
                const posOffset = roomSettings.floorOffsets?.[floorL] || { x: 0, y: 0 };
                const scale = roomSettings.floorScales?.[floorL] || 1;

                // Image logic
                const currentFloorPlan = layer.plan;

                // Optimized Night Vision: High contrast, bluish-black "detective mode" style
                let appliedFilter = roomSettings.visionMode === 'night' || (darkModeStatus && roomSettings.visionMode === 'none')
                    ? 'brightness(0.4) contrast(3) grayscale(1) sepia(1) hue-rotate(200deg) saturate(6) brightness(0.8)'
                    : 'none';

                return (
                    <div
                        key={`floor-layer-${layer.id}`}
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
                                color: darkModeStatus ? '#3B82F6' : '#64748B',
                                fontWeight: 'bold',
                                textShadow: darkModeStatus ? '0 0 10px rgba(59, 130, 246, 0.8)' : 'none'
                            }}>
                                {layer.name}
                            </div>
                        )}

                        {/* Base Floor Plane */}
                        {roomSettings.showFloor && (
                            <div className="floor-base-plane" style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backgroundColor: darkModeStatus ? 'rgba(7, 15, 35, 0.6)' : 'rgba(241, 245, 249, 0.4)',
                                border: darkModeStatus ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(148, 163, 184, 0.3)',
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
                            .filter(m => {
                                // Filter sensors belonging to this floor layer
                                const sensorAreaId = m.sensor.area_id || m.sensor.area;
                                if (typeof layer.id === 'number') {
                                    return sensorAreaId === layer.id;
                                }
                                // Fallback to floor level logic
                                return (m.sensor.floor_level === floorL || (floorL === 0 && (m.sensor.floor_level === undefined || m.sensor.floor_level === null)));
                            })
                            .map(marker => {
                                let sensorWithBoundary = marker.sensor;
                                const poly = (marker.sensor as any).polygon_coords;
                                let boundary = sensorWithBoundary.boundary;

                                // 1) Build boundary from flat fields if present
                                if (!boundary &&
                                    sensorWithBoundary.x_min !== undefined &&
                                    sensorWithBoundary.x_max !== undefined &&
                                    sensorWithBoundary.y_min !== undefined &&
                                    sensorWithBoundary.y_max !== undefined) {
                                    boundary = {
                                        x_min: sensorWithBoundary.x_min!,
                                        x_max: sensorWithBoundary.x_max!,
                                        y_min: sensorWithBoundary.y_min!,
                                        y_max: sensorWithBoundary.y_max!
                                    };
                                    sensorWithBoundary = { ...sensorWithBoundary, boundary };
                                }

                                // 2) Fallback: Calculate boundary from polygon if available
                                if (!boundary && poly && poly.length > 0) {
                                    const xs = poly.map((p: number[]) => p[0]);
                                    const ys = poly.map((p: number[]) => p[1]);
                                    boundary = {
                                        x_min: Math.min(...xs),
                                        x_max: Math.max(...xs),
                                        y_min: Math.min(...ys),
                                        y_max: Math.max(...ys)
                                    };
                                    sensorWithBoundary = { ...sensorWithBoundary, boundary };
                                }

                                if (!boundary) return null;

                                return (
                                    <Room3DBox
                                        key={`room-sensor-${marker.sensor.id}`}
                                        sensor={sensorWithBoundary}
                                        polygon_coords={poly}
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
                                        showWalls={roomSettings.showWalls}
                                        sectionCutEnabled={roomSettings.sectionCutEnabled}
                                        sectionCutPlane={roomSettings.sectionCutPlane}
                                        sectionCutPosition={roomSettings.sectionCutPosition}
                                        rotation={rotation}
                                        floorSpacing={roomSettings.floorSpacing}
                                        visionMode={roomSettings.visionMode}
                                        selectedParameters={selectedParameters}
                                        displayVal={marker.displayVal}
                                        displayType={marker.displayType}
                                    />
                                );
                            })}

                        {/* Render Rooms (Areas with boundaries - Architectural Rooms) */}
                        {areas
                            .filter(a => {
                                const hasGeometry = a.boundary || a.polygon_coords;
                                if (!hasGeometry) return false;

                                if (typeof layer.id === 'number') {
                                    // If we are rendering a specific floor area layer, only show rooms belonging to it
                                    return a.parent_id === layer.id;
                                }
                                // Fallback to floor level logic
                                return (a.floor_level == floorL || (floorL === 0 && a.floor_level == null));
                            })
                            .map(area => {
                                // Important: If a room already has a sensor rendering a box, 
                                // we might want to skip it to avoid double rendering.
                                // But for now, let's render it as a ghost/base room.

                                // Calculate boundary from polygon if missing
                                let boundary = area.boundary;
                                if (!boundary && area.polygon_coords) {
                                    const xs = area.polygon_coords.map(p => p[0]);
                                    const ys = area.polygon_coords.map(p => p[1]);
                                    boundary = {
                                        x_min: Math.min(...xs),
                                        x_max: Math.max(...xs),
                                        y_min: Math.min(...ys),
                                        y_max: Math.max(...ys)
                                    };
                                }

                                if (!boundary) return null;

                                return (
                                    <Room3DBox
                                        key={`room-area-${area.id}`}
                                        sensor={{
                                            id: `area-${area.id}`,
                                            name: area.name,
                                            boundary: boundary,
                                            sensor_type: 'Room',
                                            is_online: true,
                                            is_active: true,
                                            status: 'safe'
                                        } as any}
                                        polygon_coords={area.polygon_coords}
                                        floorW={canvasDimensions.width}
                                        floorH={canvasDimensions.height}
                                        wallHeight={roomSettings.wallHeight}
                                        floorPlanUrl={currentFloorPlan || undefined}
                                        statusColor={darkModeStatus ? "#3B82F6" : "#94A3B8"} // Default blue for dark, slate for architectural rooms in light
                                        status="safe"
                                        wallOpacity={roomSettings.wallOpacity * 0.5} // Slightly more transparent
                                        floorOpacity={roomSettings.floorOpacity}
                                        ceilingOpacity={roomSettings.ceilingOpacity}
                                        onUpdateRoom={onUpdateRoom}
                                        showWalls={roomSettings.showWalls}
                                        sectionCutEnabled={roomSettings.sectionCutEnabled}
                                        sectionCutPlane={roomSettings.sectionCutPlane}
                                        sectionCutPosition={roomSettings.sectionCutPosition}
                                        rotation={rotation}
                                        floorSpacing={roomSettings.floorSpacing}
                                        visionMode={roomSettings.visionMode}
                                        selectedParameters={[]}
                                        hideSettings={true}
                                    />
                                );
                            })}

                        {/* Render Sensor Markers (Pins) */}
                        {visibleSensors
                            .filter(m => {
                                const sensorAreaId = m.sensor.area_id || m.sensor.area;
                                if (typeof layer.id === 'number') {
                                    return sensorAreaId === layer.id;
                                }
                                return m.sensor.floor_level == floorL || (floorL === 0 && m.sensor.floor_level == null);
                            })
                            .map(marker => (
                                <Sensor3DMarker
                                    key={`marker-${marker.sensor.id}`}
                                    sensor={marker.sensor}
                                    x={marker.x}
                                    y={marker.y}
                                    status={marker.status}
                                    statusColor={getStatusColor(marker.status)}
                                    isHovered={hoveredSensor !== null && String(hoveredSensor) === String(marker.sensor.id)}
                                    isSelected={selectedSensor !== null && String(selectedSensor) === String(marker.sensor.id)}
                                    editMode={editMode}
                                    wallHeight={roomSettings.wallHeight}
                                    onMouseDown={(e) => onSensorMouseDown(e, marker.sensor.id)}
                                    rotation={rotation}
                                    floorSpacing={roomSettings.floorSpacing}
                                    selectedParameters={selectedParameters}
                                    displayVal={marker.displayVal}
                                    displayType={marker.displayType}
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
