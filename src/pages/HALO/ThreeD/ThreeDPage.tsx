import { Suspense, useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera, Environment, Html, Loader } from '@react-three/drei';
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
import MetricIntegratedDashboard from './components/MetricIntegratedDashboard';
import './ThreeDPage.scss';

import { useAreas, useSensors, useCreateWall } from '../../../api/sensors.api';
import { USE_MOCK_DATA } from '../../../config';
import { MOCK_WALLS } from '../../../api/mockData';
import { flattenAreas } from './utils/dataTransform';
import { Wall } from '../../../types/sensor';
import useToasterNotification from '../../../hooks/useToasterNotification';

import {
    PreviewState,
    createSensorPositionPreview,
    createAreaWallsPreview,
    createSensorWallsPreview,
    extractWalls,
    isAreaWallsPreview
} from '../utils/previewState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useQuery } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../../../axiosInstance';

const ThreeDPage = () => {
    const { areaId: urlAreaId } = useParams<{ areaId: string }>();
    const { darkModeStatus } = useDarkMode();
    const { showNotification } = useToasterNotification();


    // UI State
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [floorOpacity, setFloorOpacity] = useState(1);
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarTab, setSidebarTab] = useState<'sensors' | 'filters'>('sensors');
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [activeMetricGroup, setActiveMetricGroup] = useState<any>(null);

    // Selection State
    const [selectedSensorId, setSelectedSensorId] = useState<number | string | null>(null);
    const [selectedAreaIds, setSelectedAreaIds] = useState<(number | string)[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<(number | string)[]>([]);
    const [selectedWallId, setSelectedWallId] = useState<number | string | null>(null);

    // Wall Management State
    const [editingAreaForWalls, setEditingAreaForWalls] = useState<any>(null);
    const [wallDrawMode, setWallDrawMode] = useState(false);
    const [blinkingWallIds, setBlinkingWallIds] = useState<(number | string)[]>([]);
    const [isWallEndpointDragging, setIsWallEndpointDragging] = useState(false);
    const [externalWallToLink, setExternalWallToLink] = useState<Wall | null>(null);

    const [previewState, setPreviewState] = useState<PreviewState>(null);

    const [wallCreationTrigger, setWallCreationTrigger] = useState(0);
    const [pendingWall, setPendingWall] = useState<Partial<Wall> | null>(null);

    const [calibration, setCalibration] = useState<any>(null);

    const { data: areasData, isLoading: areasLoading } = useAreas();
    const { data: sensorsData, isLoading: sensorsLoading } = useSensors();
    const createWallMutation = useCreateWall();

    const { data: wallsData, isLoading: wallsLoading } = useQuery({
        queryKey: ['walls-centralized', selectedAreaIds],
        queryFn: async () => {
            if (selectedAreaIds.length === 0) return {};

            if (USE_MOCK_DATA) {
                const wallsByArea: Record<number, Wall[]> = {};
                selectedAreaIds.forEach(id => {
                    wallsByArea[Number(id)] = MOCK_WALLS.filter(w => w.area_ids?.includes(Number(id)));
                });
                return wallsByArea;
            }

            const wallPromises = selectedAreaIds.map(async (areaId) => {
                try {
                    const { data } = await axiosInstance.get<{ results: Wall[] }>(
                        `/administration/walls/byarea/`,
                        { params: { area_id: areaId } }
                    );
                    return { areaId: Number(areaId), walls: data.results || [] };
                } catch (error) {
                    console.error(`Failed to fetch walls for area ${areaId}:`, error);
                    return { areaId: Number(areaId), walls: [] };
                }
            });

            const results = await Promise.all(wallPromises);

            const wallsByArea: Record<number, Wall[]> = {};
            results.forEach(({ areaId, walls }) => {
                wallsByArea[areaId] = walls;
            });

            console.log('Centralized wall fetch complete:', wallsByArea);
            return wallsByArea;
        },
        enabled: selectedAreaIds.length > 0,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });


    useKeyboardShortcuts({
        onSave: () => {
            if (showSettingsOverlay || editingAreaForWalls) {
                console.log('Keyboard: Save triggered');
                const saveButton = document.querySelector('[data-save-button="true"]') as HTMLButtonElement;
                if (saveButton) {
                    saveButton.click();
                }
            }
        },
        onCancel: () => {
            console.log('Keyboard: Cancel/Escape triggered');
            if (wallDrawMode) {
                setWallDrawMode(false);
                showNotification('Info', 'Wall drawing cancelled', 'info');
            } else if (showSettingsOverlay) {
                setShowSettingsOverlay(false);
            } else if (editingAreaForWalls) {
                setEditingAreaForWalls(null);
            } else if (activeMetricGroup) {
                setActiveMetricGroup(null);
            }
        },
        onEscape: () => {
            console.log('Keyboard: Escape triggered');
            if (wallDrawMode) {
                setWallDrawMode(false);
            } else if (showSettingsOverlay) {
                setShowSettingsOverlay(false);
            } else if (editingAreaForWalls) {
                setEditingAreaForWalls(null);
            } else if (activeMetricGroup) {
                setActiveMetricGroup(null);
            }
        },
        onToggleDrawMode: () => {
            if (editingAreaForWalls) {
                console.log('Keyboard: Toggle drawing mode');
                setWallDrawMode(!wallDrawMode);
            }
        }
    }, {
        enabled: true,
        preventInInputs: true,
        debug: false
    });


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

        const buildingTree = flattenAreas([targetBuilding], rawAreas);
        const buildingIds = new Set(buildingTree.map(a => a.id));

        const sensorsInBuilding = rawSensors.filter(s => {
            const sensorAreaId = typeof s.area === 'object' && s.area !== null
                ? s.area.id
                : (s.area || s.area_id);

            const isRelated = buildingIds.has(Number(sensorAreaId));
            const isPlaced = (s.x_val !== 0 && s.y_val !== 0) && s.x_val !== null && s.y_val !== null;

            return isRelated && isPlaced;
        });

        const enrichedSensors = sensorsInBuilding.map(s => {
            const sensorAreaId = typeof s.area === 'object' && s.area !== null
                ? s.area.id
                : (s.area || s.area_id);

            const area = buildingTree.find(a => a.id === Number(sensorAreaId));
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


    const selectedSensor = useMemo(() => {
        if (!selectedSensorId) return null;
        return sensors.find(s => s.id === selectedSensorId) || null;
    }, [sensors, selectedSensorId]);

    const availableFloors = useMemo(() => {
        const floorLevels = areas
            .filter(a => (a.area_type === 'floor' || a.area_type === 'room') &&
                (a.floor_level !== undefined || a.offset_z !== undefined))
            .map(a => a.floor_level ?? a.offset_z ?? 0);

        const uniqueLevels = Array.from(new Set(floorLevels));
        return uniqueLevels.sort((a, b) => a - b);
    }, [areas]);

    const sensorsByFloor = useMemo(() => {
        const grouped: Record<number, any[]> = {};
        sensors.forEach(s => {
            const floor = s.floor_level ?? 0;
            if (!grouped[floor]) grouped[floor] = [];
            grouped[floor].push(s);
        });
        return grouped;
    }, [sensors]);


    useEffect(() => {
        if (areas.length > 0 && selectedAreaIds.length === 0) {
            const floorIds = areas.filter(a => a.area_type === 'floor' || a.area_type === 'room').map(a => a.id);
            setSelectedAreaIds(floorIds);
        }
    }, [areas, selectedAreaIds.length]);




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


    const handleWallCreated = (newWall: Partial<Wall>) => {
        console.log('ThreeDPage: onWallCreated received:', newWall);

        if (editingAreaForWalls) {
            console.log('ThreeDPage: Buffering wall for AreaSettingsOverlay');
            setPendingWall(newWall);
            setWallCreationTrigger(prev => prev + 1);
            setTimeout(() => {
                setPendingWall(null);
            }, 500);
        } else {
            console.log('ThreeDPage: Creating wall via mutation');
            createWallMutation.mutate(newWall);
        }
        setWallDrawMode(false);
    };


    const handleSensorPreviewChange = (sensorId: string | number, changes: any) => {
        if (changes === null) {
            setPreviewState(null);
        } else if (changes.walls) {
            setPreviewState(createSensorWallsPreview(sensorId, changes.walls));
        } else {
            // Sensor position preview
            setPreviewState(createSensorPositionPreview(
                sensorId,
                changes.x_val ?? 0,
                changes.y_val ?? 0,
                changes.z_val ?? 0
            ));
        }
    };

    const handleAreaPreviewChange = (areaId: number, changes: any) => {
        if (changes === null || !changes.walls) {
            // Clear preview
            setPreviewState(null);
        } else {
            // Area walls preview
            setPreviewState(createAreaWallsPreview(areaId, changes.walls));
        }
    };

    const handleWallPointsUpdate = (wall: Wall, points: { r_x1?: number, r_y1?: number, r_x2?: number, r_y2?: number }) => {
        console.log(' update_debug: ThreeDPage received update', { wallId: wall.id, points });
        const areaId = wall.area_ids && wall.area_ids.length > 0 ? wall.area_ids[0] : null;
        if (!areaId) return;

        // 1. Get current walls for this area from either preview or centralized state
        let currentWalls: Wall[] = [];
        if (isAreaWallsPreview(previewState) && previewState.data.areaId === areaId) {
            currentWalls = [...previewState.data.walls];
        } else {
            const areaWalls = wallsData?.[areaId] || [];
            currentWalls = [...areaWalls];
        }

        // 2. Find and update the wall
        const wallIndex = currentWalls.findIndex(w => w.id === wall.id);
        if (wallIndex !== -1) {
            currentWalls[wallIndex] = {
                ...currentWalls[wallIndex],
                ...points
            };

            // 3. Update preview state
            setPreviewState(createAreaWallsPreview(areaId, currentWalls));
        }
    };


    const handleSensorDrag = (sensor: any, newCoords: { x_val: number, y_val: number, z_val: number }) => {
        const updatedPreview = createSensorPositionPreview(
            sensor.id,
            newCoords.x_val,
            newCoords.y_val,
            newCoords.z_val
        );
        setPreviewState(updatedPreview);
        setSelectedSensorId(sensor.id);
    };

    const isLoading = areasLoading || sensorsLoading;


    return (
        <PageWrapper title='3D Sensor Visualization'>
            <Page container='fluid' className='p-0 h-100'>
                <div className='threed-page-container d-flex flex-column'>
                    <Card className='mb-0 rounded-0 border-0 border-bottom'>
                        <CardHeader className='bg-transparent border-0'>
                            <div className='d-flex justify-content-between align-items-center'>
                                <CardTitle className='mb-0'>
                                    <Icon icon='ViewInAr' className='me-2' />
                                    3D Building Visualization
                                    {isLoading && <span className='ms-2 spinner-border spinner-border-sm text-primary' role='status' />}
                                </CardTitle>

                                <div className='d-flex gap-2 align-items-center'>


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
                        className='flex-grow-1 position-relative d-flex overflow-hidden'
                    >

                        {showSidebar && (
                            <div
                                className='position-absolute start-0 top-0 h-100'
                                style={{
                                    width: '190px',
                                    zIndex: 1100,
                                    pointerEvents: 'auto',
                                    animation: 'slide-in-left 0.4s ease-out'
                                }}
                            >
                                <style>{`
                                    @keyframes slide-in-left {
                                        from { transform: translateX(-100%); opacity: 0; }
                                        to { transform: translateX(0); opacity: 1; }
                                    }
                                    .sidebar-glass-card {
                                        backdrop-filter: blur(20px);
                                        background: ${darkModeStatus ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)'};
                                        border-right: 1px solid ${darkModeStatus ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)'};
                                        box-shadow: 5px 0 20px rgba(0,0,0,0.2);
                                    }
                                `}</style>

                                <div className="sidebar-glass-card h-100 d-flex flex-column">
                                    <div className='p-0 border-bottom d-flex'>
                                        <div
                                            className={`flex-grow-1 p-2 text-center cursor-pointer transition-all ${sidebarTab === 'sensors' ? 'border-bottom border-info border-3 fw-bold text-info' : 'text-muted'}`}
                                            onClick={() => setSidebarTab('sensors')}
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            <Icon icon='Sensors' className='me-1' /> Sensors
                                        </div>
                                        <div
                                            className={`flex-grow-1 p-2 text-center cursor-pointer transition-all ${sidebarTab === 'filters' ? 'border-bottom border-info border-3 fw-bold text-info' : 'text-muted'}`}
                                            onClick={() => setSidebarTab('filters')}
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            <Icon icon='FilterAlt' className='me-1' /> Filters
                                        </div>
                                    </div>

                                    <div className='flex-grow-1 overflow-auto p-2 scrollbar-hidden'>
                                        {sidebarTab === 'sensors' ? (
                                            <>
                                                {Object.keys(sensorsByFloor).sort((a, b) => Number(b) - Number(a)).map(floor => (
                                                    <div key={floor} className='mb-3'>

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
                                                                    setEditingAreaForWalls(null);
                                                                    setActiveMetricGroup(null);

                                                                    // MODIFIED: Use unified preview state
                                                                    setPreviewState(createSensorPositionPreview(
                                                                        s.id,
                                                                        s.x_val || 0,
                                                                        s.y_val || 0,
                                                                        s.z_val || 0
                                                                    ));
                                                                }}
                                                                style={{ fontSize: '0.75rem' }}
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
                                                    setActiveMetricGroup(null);
                                                    const floorIds = areas.filter(a => a.area_type === 'floor' || a.area_type === 'room').map(a => a.id);
                                                    setSelectedAreaIds(floorIds);
                                                }}
                                                onEditAreaWalls={(area) => {
                                                    setSelectedSensorId(null);
                                                    setShowSettingsOverlay(false);
                                                    setEditingAreaForWalls(area);
                                                    setSelectedSensorId(null);
                                                    setActiveMetricGroup(null);
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}


                        <Canvas shadows gl={{ antialias: false }}>
                            <Suspense fallback={<Html center><div className='text-white d-flex align-items-center gap-2'><div className='spinner-border spinner-border-sm' /> Initializing 3D Scene...</div></Html>}>
                                <PerspectiveCamera makeDefault position={[50, 40, 50]} fov={40} />
                                <CameraControls
                                    makeDefault
                                    enabled={!isWallEndpointDragging}
                                    minDistance={1}
                                    maxDistance={500}
                                />
                                <Environment preset="city" />

                                <BuildingScene
                                    areas={areas}
                                    sensors={sensors}
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
                                        setEditingAreaForWalls(null);
                                        setActiveMetricGroup(null);
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
                                        setActiveMetricGroup(null);
                                    }}
                                    onSensorDrag={handleSensorDrag}
                                    previewState={previewState}
                                    blinkingWallIds={blinkingWallIds}
                                    wallDrawMode={wallDrawMode}
                                    onWallCreated={handleWallCreated}
                                    selectedWallId={selectedWallId}
                                    onWallClick={(wall) => {
                                        if (showSettingsOverlay && selectedSensor) {
                                            // Redirect to sensor settings if they are open
                                            setExternalWallToLink(wall);
                                            return;
                                        }

                                        setSelectedWallId(wall.id);
                                        if (wallsData) {
                                            for (const [areaId, walls] of Object.entries(wallsData)) {
                                                if (walls.some(w => String(w.id) === String(wall.id))) {
                                                    const area = filteredAreas.find(a => String(a.id) === String(areaId));
                                                    if (area) {
                                                        setSelectedSensorId(null);
                                                        setEditingAreaForWalls(area);
                                                        setActiveMetricGroup(null);
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    }}
                                    onWallDrag={(wall, delta) => {
                                    }}
                                    onWallEndpointsUpdate={handleWallPointsUpdate}
                                    onWallEndpointDragStart={() => setIsWallEndpointDragging(true)}
                                    onWallEndpointDragEnd={() => setIsWallEndpointDragging(false)}
                                    onLoad={(cal) => setCalibration(cal)}
                                    wallsByArea={wallsData || {}}
                                />
                            </Suspense>
                        </Canvas>
                        <Loader />



                        {selectedSensor ? (
                            <SensorConfigCards sensorId={selectedSensor.id} />
                        ) : (
                            <AggregateMetricCards
                                areaIds={selectedAreaIds}
                                sensorGroupIds={selectedGroupIds}
                                activeMetricGroup={activeMetricGroup}
                                setActiveMetricGroup={(group: any) => {
                                    setActiveMetricGroup(group);
                                    if (group) {
                                        setSelectedSensorId(null);
                                        setShowSettingsOverlay(false);
                                        setEditingAreaForWalls(null);
                                    }
                                }}
                            />
                        )}



                        <div
                            className='position-absolute end-0 top-0 h-100 p-0'
                            style={{
                                width: '190px',
                                zIndex: 1100,
                                pointerEvents: 'none'
                            }}
                        >
                            {showSettingsOverlay && selectedSensor && (
                                <SensorSettingsOverlay
                                    sensor={selectedSensor}
                                    originalSensor={selectedSensor}
                                    onClose={() => {
                                        setShowSettingsOverlay(false);
                                        setPreviewState(null);
                                    }}
                                    onPreviewChange={(changes) => {
                                        handleSensorPreviewChange(selectedSensor.id, changes);
                                    }}
                                    onBlinkingWallsChange={setBlinkingWallIds}
                                    previewState={previewState}
                                    externalWallToLink={externalWallToLink}
                                    onExternalWallLinkHandled={() => setExternalWallToLink(null)}
                                />
                            )}

                            {!showSettingsOverlay && selectedSensor && (
                                <SensorDataOverlay
                                    sensor={selectedSensor}
                                    onClose={() => {
                                        setSelectedSensorId(null);
                                        setPreviewState(null);
                                    }}
                                    onSettingsClick={() => setShowSettingsOverlay(true)}
                                />
                            )}

                            {editingAreaForWalls && (
                                <AreaSettingsOverlay
                                    area={editingAreaForWalls}
                                    isDrawing={wallDrawMode}
                                    onToggleDrawing={setWallDrawMode}
                                    newlyCreatedWall={pendingWall}
                                    wallCreationTrigger={wallCreationTrigger}
                                    onClose={() => {
                                        setEditingAreaForWalls(null);
                                        setPreviewState(null);
                                        setWallDrawMode(false);
                                    }}
                                    onPreviewChange={(changes) => {
                                        handleAreaPreviewChange(editingAreaForWalls.id, changes);
                                    }}
                                    onBlinkingWallsChange={setBlinkingWallIds}
                                    externalSelectedWallId={selectedWallId}
                                    previewState={previewState}
                                />
                            )}

                            {activeMetricGroup && (
                                <MetricIntegratedDashboard
                                    group={activeMetricGroup}
                                    onClose={() => setActiveMetricGroup(null)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </Page>
        </PageWrapper >
    );
};

export default ThreeDPage;