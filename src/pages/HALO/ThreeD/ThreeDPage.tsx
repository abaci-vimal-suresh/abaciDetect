import { Suspense, useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera, Environment, Html, Loader } from '@react-three/drei';
import { EffectComposer, DepthOfField, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BuildingScene } from './components/BuildingScene';
import SensorSettingsOverlay from './components/SensorSettingsOverlay';
import AreaSettingsOverlay from './components/AreaSettingsOverlay';
import SensorDataOverlay from './components/SensorDataOverlay';
import SensorConfigCards from './components/SensorConfigCards';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import useDarkMode from '../../../hooks/useDarkMode';
import AggregateMetricCards from './components/AggregateMetricCards';
import AggregationFilterPanel from './components/AggregationFilterPanel';
import './ThreeDPage.scss';

import { useAreas, useSensors, useCreateWall } from '../../../api/sensors.api';
import { flattenAreas } from './utils/dataTransform';
import { transform3DToWall } from './utils/coordinateTransform';
import useToasterNotification from '../../../hooks/useToasterNotification';

const ThreeDPage = () => {
    const { areaId: urlAreaId } = useParams<{ areaId: string }>();
    const { darkModeStatus } = useDarkMode();
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [floorOpacity, setFloorOpacity] = useState(1);
    const [selectedSensorId, setSelectedSensorId] = useState<number | string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarTab, setSidebarTab] = useState<'sensors' | 'filters'>('sensors');
    const [selectedAreaIds, setSelectedAreaIds] = useState<(number | string)[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<(number | string)[]>([]);
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [editingAreaForWalls, setEditingAreaForWalls] = useState<any>(null);
    const [previewSensor, setPreviewSensor] = useState<any>(null);
    const [previewAreaWalls, setPreviewAreaWalls] = useState<any>(null);
    const [blinkingWallIds, setBlinkingWallIds] = useState<(number | string)[]>([]);
    const [selectedWallId, setSelectedWallId] = useState<number | string | null>(null);
    const [calibration, setCalibration] = useState<any>(null);
    const [wallDrawMode, setWallDrawMode] = useState(false);
    const [newlyCreatedWall, setNewlyCreatedWall] = useState<Partial<Wall> | null>(null);

    // Mutations
    const createWallMutation = useCreateWall();
    const { showNotification } = useToasterNotification();

    // ESC key listener to cancel wall drawing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && wallDrawMode) {
                setWallDrawMode(false);
                showNotification('Info', 'Wall drawing cancelled', 'info');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [wallDrawMode, showNotification]);

    // Live API Data
    const { data: areasData, isLoading: areasLoading } = useAreas();
    const { data: sensorsData, isLoading: sensorsLoading } = useSensors();

    // Filter data based on building selection (areaId from URL)
    const { filteredAreas, filteredSensors } = useMemo(() => {
        const rawAreas = areasData || [];
        const rawSensors = sensorsData || [];

        if (!urlAreaId) {
            return { filteredAreas: rawAreas, filteredSensors: rawSensors };
        }

        const targetId = Number(urlAreaId);
        const targetBuilding = rawAreas.find(a => a.id === targetId);

        if (!targetBuilding) {
            return { filteredAreas: [], filteredSensors: [] };
        }

        // Get the building and all its recursive subareas
        const buildingTree = flattenAreas([targetBuilding], rawAreas);
        const buildingIds = new Set(buildingTree.map(a => a.id));

        // Filter sensors that belong to this building or its subareas
        // AND exclude unplaced sensors (0,0)

        const sensorsInBuilding = rawSensors.filter(s => {
            const sensorAreaId = typeof s.area === 'object' && s.area !== null
                ? s.area.id
                : (s.area || s.area_id);

            const isRelated = buildingIds.has(Number(sensorAreaId));
            const isPlaced = (s.x_val !== 0 && s.y_val !== 0) && s.x_val !== null && s.y_val !== null;

            return isRelated && isPlaced;
        });

        // Enrich sensors with floor_level information from areas
        const enrichedSensors = sensorsInBuilding.map(s => {
            const sensorAreaId = typeof s.area === 'object' && s.area !== null
                ? s.area.id
                : (s.area || s.area_id);

            const area = buildingTree.find(a => a.id === Number(sensorAreaId));

            // Derive floor level: Area's floor_level > Area's offset_z > default 0
            const derivedFloor = area?.floor_level ?? area?.offset_z ?? 0;

            return {
                ...s,
                floor_level: s.floor_level !== undefined ? s.floor_level : derivedFloor
            };
        });

        return {
            filteredAreas: buildingTree,
            filteredSensors: enrichedSensors
        };
    }, [areasData, sensorsData, urlAreaId]);

    const areas = filteredAreas;
    const sensors = filteredSensors;

    // Derive selected sensor from ID to ensure we always have the freshest data from the query
    const selectedSensor = useMemo(() => {
        if (!selectedSensorId) return null;
        // Search in sensors list (which contains enriched data)
        return sensors.find(s => s.id === selectedSensorId) || null;
    }, [sensors, selectedSensorId]);

    const handleWallDrag = (wall: any, delta: { x: number, y: number, z: number }) => {
        if (!calibration) return;

        // If we are currently editing a sensor's walls
        if (previewSensor && previewSensor.walls) {
            const updatedWalls = previewSensor.walls.map((w: any) => {
                if (String(w.id) === String(wall.id)) {
                    const newCoords = transform3DToWall(w, delta, calibration);
                    return { ...w, ...newCoords };
                }
                return w;
            });
            setPreviewSensor({ ...previewSensor, walls: updatedWalls });
        }
    };

    // Extract unique floors for UI toggles
    const availableFloors = useMemo(() => {
        const floorLevels = areas
            .filter(a => (a.area_type === 'floor' || a.area_type === 'room') && (a.floor_level !== undefined || a.offset_z !== undefined))
            .map(a => a.floor_level ?? a.offset_z ?? 0);

        // Fix Set iteration lint error
        const uniqueLevels = Array.from(new Set(floorLevels));
        return uniqueLevels.sort((a, b) => a - b);
    }, [areas]);

    // Update selected areas when data loads (show everything by default)
    useEffect(() => {
        if (areas.length > 0 && selectedAreaIds.length === 0 && !urlAreaId) {
            const floorIds = areas.filter(a => a.area_type === 'floor' || a.area_type === 'room').map(a => a.id);
            setSelectedAreaIds(floorIds);
        }
    }, [areas, urlAreaId, selectedAreaIds.length]);

    // Initialize selectedAreaIds from URL
    useEffect(() => {
        if (urlAreaId) {
            setSelectedAreaIds([Number(urlAreaId)]);
        }
    }, [urlAreaId]);

    // Area Isolation: only show selected area/room when sensor is selected
    useEffect(() => {
        if (selectedSensor) {
            const sensorAreaId = typeof selectedSensor.area === 'object' && selectedSensor.area !== null
                ? selectedSensor.area.id
                : (selectedSensor.area || selectedSensor.area_id);
            if (sensorAreaId) {
                setSelectedAreaIds([Number(sensorAreaId)]);
            }
        }
    }, [selectedSensor]);


    const isLoading = areasLoading || sensorsLoading;

    // Group sensors by floor for sidebar
    const sensorsByFloor = useMemo(() => {
        const grouped: Record<number, any[]> = {};
        sensors.forEach(s => {
            const floor = s.floor_level ?? 0;
            if (!grouped[floor]) grouped[floor] = [];
            grouped[floor].push(s);
        });
        return grouped;
    }, [sensors]);

    return (
        <PageWrapper title='3D Sensor Visualization'>
            <Page container='fluid' className='p-0 h-100'>
                <div className='d-flex flex-column h-100' style={{ height: '100vh' }}>
                    {/* Header Controls */}
                    <Card className='mb-0 rounded-0 border-0 border-bottom'>
                        <CardHeader className='bg-transparent'>
                            <div className='d-flex justify-content-between align-items-center'>
                                <CardTitle className='mb-0'>
                                    <Icon icon='ViewInAr' className='me-2' />
                                    3D Building Visualization
                                    {isLoading && <span className='ms-2 spinner-border spinner-border-sm text-primary' role='status' />}
                                </CardTitle>

                                <div className='d-flex gap-2 align-items-center'>
                                    {/* Floor toggles */}
                                    <div className='btn-group btn-group-sm'>
                                        {/* Unified calibration and visibility moved to sidebar Filter panel */}
                                    </div>

                                    <div className='d-flex align-items-center gap-2'>
                                        <Button
                                            color='info'
                                            isLight={!showBoundaries}
                                            icon='Visibility'
                                            onClick={() => setShowBoundaries(!showBoundaries)}>
                                            {showBoundaries ? 'Hide Boundaries' : 'Show Boundaries'}
                                        </Button>
                                    </div>

                                    {/* Opacity slider */}
                                    {/* <div className='d-flex align-items-center gap-2'>
                                        <Icon icon='Opacity' />
                                        <input
                                            type='range'
                                            min='0.1'
                                            max='1'
                                            step='0.1'
                                            value={floorOpacity}
                                            onChange={(e) => setFloorOpacity(parseFloat(e.target.value))}
                                            style={{ width: '100px' }}
                                        />
                                    </div> */}

                                    {/* Sidebar Toggle */}
                                    <Button
                                        color={showSidebar ? 'primary' : 'light'}
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        size='sm'
                                        icon='FormatListBulleted'
                                    >
                                        Sensors
                                    </Button>

                                    <Badge color='success' isLight>
                                        {sensors.length} Sensors
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div
                        className='flex-grow-1 position-relative'
                        style={{
                            background: darkModeStatus
                                ? 'linear-gradient(180deg, #1e1b4b 0%, #0F172A 100%)'
                                : 'linear-gradient(180deg, #d8d6d9ff 0%, #ffffff 100%)'
                        }}
                    >
                        {/* Fixed Sensor Sidebar Overlay */}
                        {showSidebar && (
                            <div
                                className='position-absolute start-0 p-0  shadow overflow-hidden d-flex flex-column'
                                style={{
                                    top: '122px',
                                    left: '0',
                                    background: darkModeStatus ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(12px)',
                                    width: '320px',
                                    height: 'calc(100% - 70px)',
                                    border: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    zIndex: 100
                                }}
                            >
                                <div className='p-0 border-bottom d-flex' >
                                    <div
                                        className={`flex-grow-1 p-3 text-center cursor-pointer transition-all ${sidebarTab === 'sensors' ? 'border-bottom border-info border-3 fw-bold text-info' : 'text-muted'}`}
                                        onClick={() => setSidebarTab('sensors')}
                                    >
                                        <Icon icon='Sensors' className='me-2' /> Sensors
                                    </div>
                                    <div
                                        className={`flex-grow-1 p-3 text-center cursor-pointer transition-all ${sidebarTab === 'filters' ? 'border-bottom border-info border-3 fw-bold text-info' : 'text-muted'}`}
                                        onClick={() => setSidebarTab('filters')}
                                    >
                                        <Icon icon='FilterAlt' className='me-2' /> Filters
                                    </div>
                                </div>
                                <div className='flex-grow-1 overflow-auto p-2 scrollbar-hidden'>
                                    {sidebarTab === 'sensors' ? (
                                        <>
                                            {/* ... sensors list ... */}
                                            {Object.keys(sensorsByFloor).sort((a, b) => Number(b) - Number(a)).map(floor => (
                                                <div key={floor} className='mb-3'>
                                                    <div className='small fw-bold mb-1 px-2 text-info text-uppercase' style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                                        Floor {floor}
                                                    </div>
                                                    {sensorsByFloor[Number(floor)].map(s => (
                                                        <div
                                                            key={s.id}
                                                            className={`p-2 rounded mb-1 cursor-pointer transition-all ${selectedSensor?.id === s.id ? 'bg-info bg-opacity-25 border border-info border-opacity-50 text-info shadow-sm' : (darkModeStatus ? 'hover-bg-dark text-white text-opacity-75' : 'hover-bg-light text-dark text-opacity-75')}`}
                                                            onClick={() => {
                                                                const sensorAreaId = typeof s.area === 'object' && s.area !== null
                                                                    ? s.area.id
                                                                    : (s.area || s.area_id);

                                                                if (sensorAreaId && !selectedAreaIds.includes(Number(sensorAreaId))) {
                                                                    setSelectedAreaIds(prev => [...prev, Number(sensorAreaId)]);
                                                                }
                                                                setSelectedSensorId(s.id);
                                                                setShowSettingsOverlay(false);
                                                                setPreviewSensor(s);
                                                            }}
                                                            style={{ fontSize: '0.85rem' }}
                                                        >
                                                            <div className='d-flex align-items-center justify-content-between mb-1'>
                                                                <div className='text-truncate fw-bold'>{s.name}</div>
                                                                <Badge
                                                                    color={s.status === 'safe' || s.status === 'Normal' ? 'success' : s.status === 'warning' || s.status === 'Warning' ? 'warning' : 'danger'}
                                                                    isLight
                                                                    style={{ fontSize: '0.7rem' }}
                                                                >
                                                                    {s.status}
                                                                </Badge>
                                                            </div>
                                                            <div className='d-flex gap-2' style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                                                <span className='font-monospace'>{s.mac_address || 'NO-MAC'}</span>
                                                                <span className='ms-auto'>{s.ip_address || 'NO-IP'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                            {sensors.length === 0 && !isLoading && (
                                                <div className='text-center py-4 text-muted small'>
                                                    No placed sensors in this area
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <AggregationFilterPanel
                                            areas={areas}
                                            selectedAreaIds={selectedAreaIds}
                                            onAreaSelectionChange={setSelectedAreaIds}
                                            selectedGroupIds={selectedGroupIds}
                                            onGroupSelectionChange={setSelectedGroupIds}
                                            onShowAllAreas={() => {
                                                setSelectedSensorId(null);
                                                setShowSettingsOverlay(false);
                                                setEditingAreaForWalls(null);
                                                const floorIds = areas.filter(a => a.area_type === 'floor' || a.area_type === 'room').map(a => a.id);
                                                setSelectedAreaIds(floorIds);
                                            }}
                                            onEditAreaWalls={(area) => {
                                                setSelectedSensorId(null);
                                                setShowSettingsOverlay(false);
                                                setEditingAreaForWalls(area);
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        <Canvas shadows gl={{ antialias: false }}>
                            <Suspense fallback={<Html center><div className='text-white d-flex align-items-center gap-2'><div className='spinner-border spinner-border-sm' /> Initializing 3D Scene...</div></Html>}>
                                {/* Camera - Zoomed in for meter scale */}
                                <PerspectiveCamera makeDefault position={[50, 40, 50]} fov={40} />

                                {/* Controls */}
                                <CameraControls
                                    makeDefault
                                    minDistance={1}
                                    maxDistance={500}
                                />

                                {/* Environment */}
                                <Environment preset="city" />

                                {/* Main Scene */}
                                <BuildingScene
                                    areas={areas}
                                    sensors={useMemo(() => {
                                        return sensors.map(s => {
                                            if (previewSensor && previewSensor.id === s.id) {
                                                return previewSensor;
                                            }
                                            return s;
                                        });
                                    }, [sensors, previewSensor])}
                                    visibleAreaIds={selectedAreaIds}
                                    floorSpacing={4}
                                    floorOpacity={floorOpacity}
                                    showBoundaries={showBoundaries}
                                    selectedSensorId={selectedSensorId}
                                    setSelectedSensorId={(id) => {
                                        const sensor = sensors.find(s => s.id === id);
                                        if (sensor) {
                                            const sensorAreaId = typeof sensor.area === 'object' && sensor.area !== null
                                                ? sensor.area.id
                                                : (sensor.area || sensor.area_id);

                                            if (sensorAreaId && !selectedAreaIds.includes(Number(sensorAreaId))) {
                                                setSelectedAreaIds(prev => [...prev, Number(sensorAreaId)]);
                                            }
                                        }
                                        setSelectedSensorId(id);
                                        setShowSettingsOverlay(true);
                                    }}
                                    onSensorClick={(sensor) => {
                                        const sensorAreaId = typeof sensor.area === 'object' && sensor.area !== null
                                            ? sensor.area.id
                                            : (sensor.area || sensor.area_id);

                                        if (sensorAreaId && !selectedAreaIds.includes(Number(sensorAreaId))) {
                                            setSelectedAreaIds(prev => [...prev, Number(sensorAreaId)]);
                                        }
                                        setSelectedSensorId(sensor.id);
                                        setShowSettingsOverlay(false);
                                        setEditingAreaForWalls(null);
                                        console.log('Sensor clicked:', sensor);
                                    }}
                                    onSensorDrag={(sensor, newCoords) => {
                                        const updatedSensor = { ...sensor, ...newCoords };
                                        setPreviewSensor(updatedSensor);
                                        setSelectedSensorId(sensor.id);
                                    }}
                                    previewData={previewAreaWalls || previewSensor}
                                    blinkingWallIds={blinkingWallIds}
                                    wallDrawMode={wallDrawMode}
                                    onWallCreated={(newWall) => {
                                        console.log('ThreeDPage: onWallCreated received:', newWall);
                                        if (editingAreaForWalls) {
                                            console.log('ThreeDPage: Buffering wall for AreaSettingsOverlay');
                                            // Pass to overlay instead of immediate mutation
                                            setNewlyCreatedWall(newWall);
                                            // Small delay to ensure prop propagates before we reset it
                                            setTimeout(() => setNewlyCreatedWall(null), 100);
                                        } else {
                                            console.log('ThreeDPage: Creating wall via mutation');
                                            createWallMutation.mutate(newWall);
                                        }
                                        setWallDrawMode(false);
                                    }}
                                    selectedWallId={selectedWallId}
                                    onWallClick={(wall) => {
                                        setSelectedWallId(wall.id);
                                        console.log('Wall clicked:', wall);
                                    }}
                                    onWallDrag={handleWallDrag}
                                    onLoad={(cal) => setCalibration(cal)}
                                />
                            </Suspense>
                        </Canvas>
                        <Loader />

                        {/* Top Event Config Cards */}
                        {selectedSensor ? (
                            <SensorConfigCards sensorId={selectedSensor.id} />
                        ) : (
                            <AggregateMetricCards
                                areaIds={selectedAreaIds}
                                sensorGroupIds={selectedGroupIds}
                            />
                        )}



                        {/* Sensor Settings Overlay (Right Side) */}
                        {showSettingsOverlay && selectedSensor && (
                            <SensorSettingsOverlay
                                sensor={
                                    previewSensor?.id === selectedSensor.id
                                        ? { ...selectedSensor, ...previewSensor }
                                        : selectedSensor
                                }
                                originalSensor={selectedSensor}
                                onClose={() => {
                                    setShowSettingsOverlay(false);
                                }}
                                onPreviewChange={(newValues) => {
                                    if (newValues === null) {
                                        setPreviewSensor(null);
                                    } else {
                                        setPreviewSensor({ ...selectedSensor, ...newValues });
                                    }
                                }}
                                onBlinkingWallsChange={setBlinkingWallIds}
                            />
                        )}

                        {/* Sensor Live Data Overlay */}
                        {!showSettingsOverlay && selectedSensor && (
                            <SensorDataOverlay
                                sensor={selectedSensor}
                                onClose={() => setSelectedSensorId(null)}
                                onSettingsClick={() => setShowSettingsOverlay(true)}
                            />
                        )}

                        {/* Area Walls Overlay */}
                        {editingAreaForWalls && (
                            <AreaSettingsOverlay
                                area={editingAreaForWalls}
                                isDrawing={wallDrawMode}
                                onToggleDrawing={setWallDrawMode}
                                newlyCreatedWall={newlyCreatedWall}
                                onClose={() => {
                                    setEditingAreaForWalls(null);
                                    setPreviewAreaWalls(null);
                                    setWallDrawMode(false);
                                }}
                                onPreviewChange={(values) => {
                                    setPreviewAreaWalls(values);
                                }}
                            />
                        )}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default ThreeDPage;

