import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import useDarkMode from '../../../../hooks/useDarkMode';
import { Sensor, Area } from '../../../../types/sensor';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import './FloorPlan3D.scss';
import { RoomVisibilitySettings } from './RoomSettingsPanel';
import './Room3DBox.scss';

// MODULAR IMPORTS
import { use3DScene } from '../hooks/use3DScene';
import { useCoordinateProjection } from '../hooks/useCoordinateProjection';
import { use3DInteractions } from '../hooks/use3DInteractions';
import MultiFloorBuilding from './3d/MultiFloorBuilding';
import SceneGizmo3D from './3d/SceneGizmo3D';
import Boundary3DVolume from './3d/Boundary3DVolume';
import InteractionHints from './3d/InteractionHints';

export type VisionMode = 'none' | 'invert' | 'sepia' | 'negative' | 'dog' | 'batman';

interface FloorPlanCanvasProps {
    areaId: number;
    sensors: Sensor[];
    areas?: Area[];
    floorPlanUrl?: string;
    roomBoundaries?: number[][];
    onSensorClick?: (sensor: Sensor) => void;
    onSensorDrop?: (sensorId: string, x: number, y: number, areaId?: number | null) => void;
    onSensorRemove?: (sensorId: string) => void;
    onImageUpload?: (file: File) => void;
    onBoundaryUpdate?: (sensorId: string, boundary: { x_min: number; x_max: number; y_min: number; y_max: number }) => void;
    editMode?: boolean;
    roomSettings?: RoomVisibilitySettings;
    onSettingsChange?: (settings: RoomVisibilitySettings) => void;
    style?: React.CSSProperties;
}

interface SensorMarker {
    sensor: Sensor;
    x: number;
    y: number;
    status: 'safe' | 'warning' | 'critical';
}

const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
    areaId,
    sensors,
    areas = [],
    floorPlanUrl,
    onSensorClick,
    onSensorDrop,
    onBoundaryUpdate,
    editMode = false,
    roomSettings: externalRoomSettings,
    onSettingsChange,
    style
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { darkModeStatus } = useDarkMode();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600, dpr: 1 });
    const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
    const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
    const [showBoundaryHint, setShowBoundaryHint] = useState(false);
    const [visionMode, setVisionMode] = useState<VisionMode>('none');

    const [roomConfigs, setRoomConfigs] = useState<{
        [sensorId: string]: { name: string; color: string; showWalls?: boolean; wallOpacity?: number }
    }>({});

    const [localRoomSettings, setLocalRoomSettings] = useState<RoomVisibilitySettings>({
        wallOpacity: 0.1,
        floorOpacity: 0.2,
        ceilingOpacity: 0.5,
        showWalls: true,
        showFloor: true,
        showCeiling: true,
        showLabels: true,
        pulseSpeed: 2,
        wallHeight: 240,
        visibleFloors: [],
        floorSpacing: 400,
        floorOffset: 50,
        floorOffsets: {},
        showFloorLabels: true,
        cameraPreset: 'free',
        sectionCutEnabled: false,
        sectionCutPlane: 'x',
        sectionCutPosition: 1,
        floorScales: {}
    });

    const roomSettings = externalRoomSettings || localRoomSettings;

    // --- HOOKS ---
    const {
        rotation, setRotation, zoom, setZoom, pan, setPan, setDragStart3D, setIsDragging3D,
        handleZoom, handleWheel, handlePanStart, showView, resetView, resetPan, isDragging3D
    } = use3DScene(containerRef, editMode);

    const { projectTo3DFloor } = useCoordinateProjection(containerRef, pan, zoom, rotation.y, canvasDimensions);

    const getSensorStatus = useCallback((sensor: Sensor): 'safe' | 'warning' | 'critical' => {
        const val = sensor.sensor_data?.val || 0;
        const threshold = sensor.sensor_data?.threshold || 100;
        if (val >= threshold) return 'critical';
        if (val >= threshold * 0.8) return 'warning';
        return 'safe';
    }, []);

    const sensorMarkers: SensorMarker[] = useMemo(() => {
        return sensors
            .filter(s => s.x_coordinate !== undefined && s.y_coordinate !== undefined)
            .map(sensor => ({
                sensor,
                x: sensor.x_coordinate!,
                y: sensor.y_coordinate!,
                status: getSensorStatus(sensor)
            }));
    }, [sensors, getSensorStatus]);

    const selectedSensorBoundary = useMemo(() => {
        if (!selectedSensor) return null;
        const sensor = sensors.find(s => s.id === selectedSensor);
        return sensor?.boundary || null;
    }, [selectedSensor, sensors]);

    const {
        handleSensorMouseDown3D,
        handleFloorMouseDown3D,
        localDraggedSensorPos,
        isDrawingBoundary3D,
        isResizingBoundary3D,
        isDragging3DSensor,
        sensorBoundary
    } = use3DInteractions({
        editMode,
        zoom,
        rotationY: rotation.y,
        canvasDimensions,
        sensorMarkers,
        selectedSensor,
        selectedSensorBoundary,
        setSelectedSensor,
        projectTo3DFloor,
        onSensorDrop,
        onBoundaryUpdate: (id, boundary) => {
            onBoundaryUpdate?.(id, boundary);
            setShowBoundaryHint(false);
        }
    });

    // --- AUTOMATIC CAMERA LOCK ---
    useEffect(() => {
        if (editMode) {
            showView('front');
            setZoom(1);
            setPan({ x: 0, y: 0 });
        }
    }, [editMode, showView, setZoom, setPan]);

    // Recalculate markers with local drag positions
    const markersWithDrag = useMemo(() => {
        return sensorMarkers.map(m => {
            if (localDraggedSensorPos && localDraggedSensorPos.id === m.sensor.id) {
                return { ...m, x: localDraggedSensorPos.x, y: localDraggedSensorPos.y };
            }
            return m;
        });
    }, [sensorMarkers, localDraggedSensorPos]);

    const visibleSensors = useMemo(() => {
        return markersWithDrag.filter(marker => {
            if (areaId) {
                const isDirect = Number(marker.sensor.area_id) === Number(areaId);
                let rollsUp = false;
                let checkArea = marker.sensor.area || areas?.find(a => Number(a.id) === Number(marker.sensor.area_id));
                let depth = 0;
                while (checkArea && depth < 5) {
                    if (Number(checkArea.id) === Number(areaId) || Number(checkArea.parent_id) === Number(areaId)) {
                        rollsUp = true;
                        break;
                    }
                    checkArea = areas?.find(a => Number(a.id) === Number(checkArea?.parent_id));
                    depth++;
                }
                if (!isDirect && !rollsUp) return false;
            }
            if (roomSettings.visibleFloors.length > 0 && marker.sensor.floor_level !== undefined) {
                return roomSettings.visibleFloors.includes(Number(marker.sensor.floor_level));
            }
            return true;
        });
    }, [markersWithDrag, areas, areaId, roomSettings.visibleFloors]);

    // Find the building context (Root Parent)
    const activeBuildingAreas = useMemo(() => {
        if (!areaId || areas.length === 0) return areas;
        let rootId = areaId;
        let checkArea = areas.find(a => Number(a.id) === Number(areaId));
        let depth = 0;
        while (checkArea && checkArea.parent_id !== null && depth < 5) {
            rootId = Number(checkArea.parent_id);
            checkArea = areas.find(a => Number(a.id) === Number(rootId));
            depth++;
        }
        return areas.filter(a => {
            if (Number(a.id) === Number(rootId)) return true;
            let pId = a.parent_id;
            let d2 = 0;
            while (pId !== null && d2 < 5) {
                if (Number(pId) === Number(rootId)) return true;
                pId = areas.find(curr => Number(curr.id) === Number(pId))?.parent_id || null;
                d2++;
            }
            return false;
        });
    }, [areaId, areas]);

    const focusedFloorLevel = useMemo(() => {
        if (!areaId || areas.length === 0) return null;
        const currentArea = areas.find(a => Number(a.id) === Number(areaId));
        return (currentArea && currentArea.floor_level !== undefined && currentArea.floor_level !== null)
            ? Number(currentArea.floor_level)
            : null;
    }, [areaId, areas]);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
        if (!floorPlanUrl) return;
        const img = new Image();
        img.onload = () => { setImage(img); setImageLoaded(true); };
        img.src = floorPlanUrl;
    }, [floorPlanUrl]);

    useEffect(() => {
        if (!containerRef.current || !image || !imageLoaded) return;
        const handleResize = () => {
            if (!containerRef.current || !image) return;
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight || 600;
            const imgAspect = image.width / image.height;
            const containerAspect = containerWidth / containerHeight;
            let canvasWidth, canvasHeight;
            if (imgAspect > containerAspect) {
                canvasWidth = containerWidth;
                canvasHeight = containerWidth / imgAspect;
            } else {
                canvasHeight = containerHeight;
                canvasWidth = containerHeight * imgAspect;
            }
            setCanvasDimensions({ width: canvasWidth, height: canvasHeight, dpr: window.devicePixelRatio || 1 });
        };
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);
        handleResize();
        return () => resizeObserver.disconnect();
    }, [image, imageLoaded]);

    const getStatusColor = useCallback((status: string): string => {
        switch (status) {
            case 'critical': return '#EF4444';
            case 'warning': return '#F59E0B';
            default: return '#10B981';
        }
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        if (!editMode) return;
        e.preventDefault();
        try {
            const jsonData = e.dataTransfer.getData('application/json');
            const sensorId = jsonData ? JSON.parse(jsonData).sensorId : e.dataTransfer.getData('sensorId');
            const pos = projectTo3DFloor(e.clientX, e.clientY);
            if (sensorId && pos) {
                onSensorDrop?.(sensorId, pos.x, pos.y, areaId);
                setSelectedSensor(sensorId);
            }
        } catch (err) { console.error('Drop failed', err); }
    };

    const handleUpdateRoom = (sensorId: string, name: string, color: string, showWalls: boolean, wallOpacity?: number) => {
        setRoomConfigs(prev => ({ ...prev, [sensorId]: { name, color, showWalls, wallOpacity } }));
    };

    const toggleFullScreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err: any) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    const handleDragStart3D = (e: React.MouseEvent) => {
        const isInteract = handlePanStart(e);
        if (!isInteract && !isDrawingBoundary3D && !isDragging3DSensor) {
            setIsDragging3D(true);
        }
        setDragStart3D({ x: e.clientX, y: e.clientY });
    };

    return (
        <Card className="floor-plan-card h-100 shadow-3d border-0 overflow-hidden" stretch style={{ background: darkModeStatus ? '#0F172A' : '#F8FAFC', ...style }}>
            <CardHeader className="bg-transparent border-bottom border-light py-3">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <CardTitle className="mb-0 fs-5 fw-bold d-flex align-items-center">
                        <Icon icon="3d_rotation" className="me-2 text-primary" />
                        Interactive 3D Sensor Environment
                        {editMode && <Badge color="warning" isLight className="ms-2 px-2 py-1">EDIT MODE</Badge>}

                        {/* Vision Mode Menu */}
                        <div className="vision-menu ms-4 d-none d-md-flex align-items-center bg-dark bg-opacity-10 rounded-pill p-1 border border-light border-opacity-10">
                            {[
                                { id: 'none', label: 'Normal', icon: 'visibility' },
                                { id: 'invert', label: 'Invert', icon: 'invert_colors' },
                                { id: 'sepia', label: 'Sepia', icon: 'auto_fix_high' },
                                { id: 'negative', label: 'Negative', icon: 'difference' },
                                { id: 'dog', label: 'Dog View', icon: 'pets' },
                                { id: 'batman', label: 'Batman', icon: 'theater_comedy' }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setVisionMode(mode.id as VisionMode)}
                                    className={`btn btn-sm rounded-pill px-3 py-1 border-0 d-flex align-items-center transition-all ${visionMode === mode.id
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-muted hover-bg-light'
                                        }`}
                                    style={{ fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                    <Icon icon={mode.icon} size="sm" className="me-1" />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </CardTitle>
                    <div className="d-flex gap-2">
                        <Button size="sm" color="info" isLight={!editMode} onClick={() => setShowBoundaryHint(!showBoundaryHint)}>
                            <Icon icon="Help" />
                        </Button>
                        <Button size="sm" isLight onClick={toggleFullScreen} title="Toggle Fullscreen">
                            <Icon icon="Fullscreen" />
                        </Button>
                        {!editMode && (
                            <Button size="sm" color="secondary" isLight onClick={resetView}>
                                <Icon icon="Home" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardBody className="p-0 position-relative" style={{ height: '100%', minHeight: '600px', perspective: '1200px' }}>
                <div
                    ref={containerRef}
                    className="canvas-container-3d h-100"
                    onMouseDown={(e) => {
                        if (editMode && selectedSensor) {
                            handleFloorMouseDown3D(e);
                            if (e.isPropagationStopped()) return;
                        }
                        handleDragStart3D(e);
                    }}
                    onWheel={handleWheel}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    style={{
                        cursor: editMode ? 'crosshair' : 'grab',
                        background: darkModeStatus
                            ? 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)'
                            : 'radial-gradient(circle at center, #F1F5F9 0%, #E2E8F0 100%)',
                    }}
                >
                    <div className="scene-pivot-3d" style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transformStyle: 'preserve-3d',
                        transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${zoom}, ${zoom}, ${zoom})`,
                        width: canvasDimensions.width,
                        height: canvasDimensions.height,
                        transition: isDrawingBoundary3D ? 'none' : 'transform 0.1s ease-out'
                    }}>
                        {/* Floor Grid (Background) */}
                        <div style={{
                            position: 'absolute',
                            width: '2000px',
                            height: '2000px',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%) translateZ(-100px)',
                            backgroundSize: '40px 40px',
                            backgroundImage: `linear-gradient(to right, ${darkModeStatus ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px), 
                                            linear-gradient(to bottom, ${darkModeStatus ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`,
                            pointerEvents: 'none'
                        }} />

                        <MultiFloorBuilding
                            areas={activeBuildingAreas}
                            visibleSensors={visibleSensors}
                            roomSettings={roomSettings}
                            canvasDimensions={canvasDimensions}
                            floorPlanUrl={floorPlanUrl}
                            editMode={editMode}
                            hoveredSensor={hoveredSensor}
                            selectedSensor={selectedSensor}
                            onSensorMouseDown={handleSensorMouseDown3D}
                            onSensorClick={(s) => onSensorClick?.(s)}
                            onUpdateRoom={handleUpdateRoom}
                            getStatusColor={getStatusColor}
                            darkModeStatus={darkModeStatus}
                            focusedFloorLevel={focusedFloorLevel}
                            rotation={rotation}
                            visionMode={visionMode}
                        />

                        {/* 3. Selective Boundary Box (Drawing OR Selection Highlight) */}
                        {editMode && selectedSensor && (
                            <Boundary3DVolume
                                x={sensorBoundary ? sensorBoundary.x : (selectedSensorBoundary ? selectedSensorBoundary.x_min * canvasDimensions.width : ((sensors.find(s => s.id === selectedSensor)?.x_coordinate || 0.5) - 0.025) * canvasDimensions.width)}
                                y={sensorBoundary ? sensorBoundary.y : (selectedSensorBoundary ? selectedSensorBoundary.y_min * canvasDimensions.height : ((sensors.find(s => s.id === selectedSensor)?.y_coordinate || 0.5) - 0.025) * canvasDimensions.height)}
                                width={sensorBoundary ? sensorBoundary.width : (selectedSensorBoundary ? ((selectedSensorBoundary.x_max - selectedSensorBoundary.x_min) * canvasDimensions.width) : 0.05 * canvasDimensions.width)}
                                height={sensorBoundary ? sensorBoundary.height : (selectedSensorBoundary ? ((selectedSensorBoundary.y_max - selectedSensorBoundary.y_min) * canvasDimensions.height) : 0.05 * canvasDimensions.height)}
                                wallHeight={roomSettings.wallHeight}
                                color={isDrawingBoundary3D || isResizingBoundary3D ? '#3B82F6' : getStatusColor(sensors.find(s => s.id === selectedSensor)?.status || 'safe')}
                                sensorX={sensors.find(s => s.id === selectedSensor)?.x_coordinate}
                                sensorY={sensors.find(s => s.id === selectedSensor)?.y_coordinate}
                                canvasWidth={canvasDimensions.width}
                                canvasHeight={canvasDimensions.height}
                            />
                        )}
                    </div>

                    {!editMode && <SceneGizmo3D
                        rotation={rotation}
                        zoom={zoom}
                        onRotationChange={(r) => setRotation(r)}
                        onZoomChange={(z) => setZoom(z)}
                    />}
                    <InteractionHints
                        zoom={zoom}
                        editMode={editMode}
                        selectedSensor={selectedSensor}
                        showBoundaryHint={showBoundaryHint}
                        onZoomIn={() => handleZoom(0.1)}
                        onZoomOut={() => handleZoom(-0.1)}
                        onResetView={resetView}
                        onResetPan={resetPan}
                        onShowView={showView}
                        onToggleFullScreen={toggleFullScreen}
                        darkModeStatus={darkModeStatus}
                    />
                </div>
            </CardBody>
        </Card>
    );
};

export default FloorPlanCanvas;
