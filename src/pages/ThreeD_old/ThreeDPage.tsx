import { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera, Environment, Html, Loader } from '@react-three/drei';
import { BuildingScene } from './components/scene/BuildingScene';
import UnifiedRightPanel from './components/panels/UnifiedRightPanel';
import BuildingSidebar from './components/panels/BuildingSidebar';

import SensorConfigCards from './components/sensors/SensorConfigCards';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import Badge from '../../components/bootstrap/Badge';
import useDarkMode from '../../hooks/useDarkMode';
import AggregateMetricCards from './components/dashboards/AggregateMetricCards';
import AggregationFilterPanel from './components/panels/AggregationFilterPanel';
import './ThreeDPage.scss';

import { useAreas, useSensors, useCreateWall } from '../../api/sensors.api';
import { addSensorAlert, selectAllAlerts } from '../../store/sensorEventsSlice';
import { MockAlertPanel } from './components/debug/MockAlertPanel';
import { Sensor, Area, Wall } from '../../types/sensor';
import { USE_MOCK_DATA } from '../../config';
import { MOCK_WALLS } from '../../api/mockData';
import { flattenAreas } from './utils/dataTransform';
import useToasterNotification from '../../hooks/useToasterNotification';
import { DEFAULT_WALL_HEIGHT } from '../../constants/wallDefaults';

import {
    PreviewState,
    createSensorPositionPreview,
    createAreaWallsPreview,
    createSensorWallsPreview,
    extractWalls,
    isAreaWallsPreview
} from './utils/previewState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useQuery } from '@tanstack/react-query';
import { authAxios as axiosInstance } from '../../axiosInstance';

const ThreeDPage = () => {
    const { areaId: urlAreaId } = useParams<{ areaId: string }>();
    const { darkModeStatus } = useDarkMode();
    const { showNotification } = useToasterNotification();
    const dispatch = useDispatch();


    // UI State
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [floorOpacity, setFloorOpacity] = useState(1);
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarTab, setSidebarTab] = useState<'sensors' | 'filters'>('sensors');
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [showSensorList, setShowSensorList] = useState(false);
    const [activeMetricGroup, setActiveMetricGroup] = useState<any>(null);
    const [showMockPanel, setShowMockPanel] = useState(false);

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

    // Wall drawing settings (single source of truth for the panel)
    const [wallDrawSettings, setWallDrawSettings] = useState({
        drawingMode: 'straight' as 'straight' | 'arc',
        height: 2.4,
        thickness: 0.15,
        color: '#8f8f8f',
        opacity: 0.8,
    });
    // Live count mirrors from BuildingScene
    const [drawPointCount, setDrawPointCount] = useState(0);
    const [drawArcBufferCount, setDrawArcBufferCount] = useState(0);
    const [drawCommittedCount, setDrawCommittedCount] = useState(0);
    // Trigger counters for undo / clear / finish actions
    const [wallDrawUndoTrigger, setWallDrawUndoTrigger] = useState(0);
    const [wallDrawClearTrigger, setWallDrawClearTrigger] = useState(0);
    const [wallDrawFinishTrigger, setWallDrawFinishTrigger] = useState(0);
    const [wallDrawCloseShapeTrigger, setWallDrawCloseShapeTrigger] = useState(0);

    const [previewState, setPreviewState] = useState<PreviewState>(null);

    const [wallCreationTrigger, setWallCreationTrigger] = useState(0);
    const [pendingWalls, setPendingWalls] = useState<Partial<Wall>[] | null>(null);
    const [zoomTrigger, setZoomTrigger] = useState(0);
    const cameraRef = useRef<any>(null);

    const [calibration, setCalibration] = useState<any>(null);
    const alerts = useSelector(selectAllAlerts);
    const lastAlertCountRef = useRef(alerts.length);

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
            } else if (showSensorList) {
                setShowSensorList(false);
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



        const enrichedSensors = rawSensors.map(s => {
            const sensorAreaId = typeof s.area === 'object' && s.area !== null
                ? s.area.id
                : (s.area || s.area_id);

            const area = rawAreas.find(a => a.id === Number(sensorAreaId));
            const derivedFloor = area?.floor_level ?? area?.offset_z ?? 0;

            return {
                ...s,
                floor_level: s.floor_level !== undefined ? s.floor_level : derivedFloor
            };
        });

        return {
            filteredAreas: rawAreas,
            filteredSensors: enrichedSensors
        };
    }, [areasData, sensorsData]);

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
    useEffect(() => {
        if (alerts.length > lastAlertCountRef.current) {
            const newAlert = alerts[0];
            lastAlertCountRef.current = alerts.length;

            console.log('ThreeDPage: New Alert Detected!', {
                title: newAlert?.title,
                sensor_id: newAlert?.sensor_id,
                sensor_name: newAlert?.sensor_name,
                body: newAlert?.body,
            });

            if (newAlert) {
                const sensor = sensors.find(s =>
                    (newAlert.sensor_id && String(s.id) === String(newAlert.sensor_id)) ||
                    (newAlert.sensor_name && s.name.toLowerCase() === newAlert.sensor_name.toLowerCase()) ||
                    (newAlert.body && newAlert.body.toLowerCase().includes(`sensor: ${s.name.toLowerCase()}`))
                );

                if (sensor) {
                    const sensorAreaId = typeof sensor.area === 'object' && sensor.area !== null
                        ? sensor.area.id
                        : (sensor.area || sensor.area_id);

                    console.log('ThreeDPage: Match found! Auto-selecting:', sensor.name);

                    if (sensorAreaId && !selectedAreaIds.includes(Number(sensorAreaId))) {
                        setSelectedAreaIds(prev => [...prev, Number(sensorAreaId)]);
                    }

                    setSelectedSensorId(sensor.id);
                    setZoomTrigger(prev => prev + 1);
                    setShowSettingsOverlay(true);
                    setEditingAreaForWalls(null);
                    setActiveMetricGroup(null);

                    setPreviewState(createSensorPositionPreview(
                        sensor.id,
                        sensor.x_val || 0,
                        sensor.y_val || 0,
                        sensor.z_val || 0
                    ));
                } else {
                    console.warn('ThreeDPage: No sensor match found for alert', {
                        extracted_id: newAlert.sensor_id,
                        extracted_name: newAlert.sensor_name,
                        available_sensors: sensors.map(s => s.name)
                    });
                }
            }
        } else {
            lastAlertCountRef.current = alerts.length;
        }
    }, [alerts, sensors, selectedAreaIds]);


    const handleWallCreated = (newWall: Partial<Wall>) => {
        console.log('ThreeDPage: onWallCreated received:', newWall);

        if (editingAreaForWalls) {
            console.log('ThreeDPage: Buffering wall for AreaSettingsOverlay');
            setPendingWalls([newWall]);
            setWallCreationTrigger(prev => prev + 1);
            setTimeout(() => {
                setPendingWalls(null);
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
                    {/* NEW TOPBAR IMPLEMENTATION */}
                    <div className='topbar'>
                        <div className='title'>
                            <button
                                className={`drawerBtn ${showSidebar ? 'active' : ''}`}
                                onClick={() => setShowSidebar(s => !s)}
                                title={showSidebar ? "Hide Explorer" : "Show Explorer"}
                            >
                                <Icon icon="ViewSidebar" />
                            </button>
                            <span className='ms-2'>3D Building Visualization</span>
                            {isLoading && <span className='ms-2 spinner-border spinner-border-sm text-primary' role='status' />}
                        </div>

                        <div className='controls'>
                            {/* Live Badge */}
                            <Badge color='success' isLight className='me-2'>
                                {sensors.length} Sensors Live
                            </Badge>

                            <div className='divider' />

                            {/* Right Panel Toggles */}
                            <div className='toolPill'>
                                <button
                                    className={`toolBtn ${showSensorList ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowSensorList(s => !s);
                                        if (!showSensorList) {
                                            setShowSettingsOverlay(false);
                                            setEditingAreaForWalls(null);
                                            setActiveMetricGroup(null);
                                            setShowMockPanel(false);
                                        }
                                    }}
                                    title="Sensor List"
                                >
                                    <Icon icon="FormatListBulleted" />
                                </button>

                                <button
                                    className={`toolBtn ${showSettingsOverlay && selectedSensor ? 'active' : ''}`}
                                    onClick={() => {
                                        if (showSettingsOverlay && selectedSensor) {
                                            setShowSettingsOverlay(false);
                                        } else if (selectedSensorId) {
                                            setShowSettingsOverlay(true);
                                            setShowSensorList(false);
                                            setEditingAreaForWalls(null);
                                            setActiveMetricGroup(null);
                                            setShowMockPanel(false);
                                        }
                                    }}
                                    title="Sensor Settings"
                                    disabled={!selectedSensorId}
                                >
                                    <Icon icon="Videocam" />
                                </button>

                                <button
                                    className={`toolBtn ${editingAreaForWalls ? 'active' : ''}`}
                                    onClick={() => {
                                        if (editingAreaForWalls) {
                                            setEditingAreaForWalls(null);
                                        } else {
                                            // Fallback to first floor if none selected
                                            const firstFloor = areas.find(a => a.area_type === 'floor');
                                            if (firstFloor) setEditingAreaForWalls(firstFloor);
                                            setShowSettingsOverlay(false);
                                            setShowSensorList(false);
                                            setActiveMetricGroup(null);
                                            setShowMockPanel(false);
                                        }
                                    }}
                                    title="Area Settings"
                                >
                                    <Icon icon="Map" />
                                </button>

                                <button
                                    className={`toolBtn ${activeMetricGroup ? 'active' : ''}`}
                                    onClick={() => {
                                        if (activeMetricGroup) {
                                            setActiveMetricGroup(null);
                                        } else {
                                            setShowSettingsOverlay(false);
                                            setShowSensorList(false);
                                            setEditingAreaForWalls(null);
                                            // Logic to show aggregate metrics if needed
                                        }
                                    }}
                                    title="Analytics"
                                >
                                    <Icon icon="Timeline" />
                                </button>

                                <button
                                    className={`toolBtn ${showMockPanel ? 'active' : ''}`}
                                    onClick={() => setShowMockPanel(s => !s)}
                                    title="Alert Simulator"
                                    style={{ opacity: 0.6 }}
                                >
                                    <Icon icon="BugReport" />
                                </button>
                            </div>
                        </div>
                    </div>


                    <div
                        className='flex-grow-1 position-relative d-flex overflow-hidden'
                    >

                        {showSidebar && (
                            <div
                                className='position-absolute start-0 top-0 h-100'
                                style={{
                                    width: '240px',
                                    zIndex: 1100,
                                    pointerEvents: 'none'
                                }}
                            >
                                <BuildingSidebar
                                    areas={areas}
                                    allAreas={areasData || []}
                                    selectedAreaIds={selectedAreaIds}
                                    onAreaSelectionChange={setSelectedAreaIds}
                                    onEditAreaWalls={(area) => {
                                        setSelectedSensorId(null);
                                        setShowSettingsOverlay(false);
                                        setEditingAreaForWalls(area);
                                        setActiveMetricGroup(null);
                                    }}
                                    onShowAllAreas={() => {
                                        setSelectedSensorId(null);
                                        setShowSettingsOverlay(false);
                                        setEditingAreaForWalls(null);
                                        setActiveMetricGroup(null);
                                        const allAreaData = areasData || [];
                                        const floorIds = allAreaData.flatMap((a: any) => {
                                            const floors = (a.subareas || []).map((sub: any) => {
                                                if (typeof sub === 'object') return sub.id;
                                                return sub;
                                            });
                                            return floors;
                                        });
                                        const directFloors = allAreaData
                                            .filter((a: any) => a.area_type === 'floor' || a.area_type === 'room')
                                            .map((a: any) => a.id);
                                        setSelectedAreaIds(Array.from(new Set([...floorIds, ...directFloors])));
                                    }}
                                    onBuildingClick={(building) => {
                                        // Auto-select all floors of this building
                                        const buildingFloors = (areasData || []).filter((a: any) =>
                                            (building.subareas || []).includes(a.id) ||
                                            a.parent_id === building.id
                                        );
                                        if (buildingFloors.length > 0) {
                                            setSelectedAreaIds(buildingFloors.map((f: any) => f.id));
                                        }
                                    }}
                                    setShowSettingsOverlay={setShowSettingsOverlay}
                                    setEditingAreaForWalls={setEditingAreaForWalls}
                                    setActiveMetricGroup={setActiveMetricGroup}
                                    setSelectedSensorId={setSelectedSensorId}
                                    darkModeStatus={darkModeStatus}
                                    isLoading={isLoading}
                                    showSidebar={showSidebar}
                                    setShowSidebar={setShowSidebar}
                                />
                            </div>
                        )}


                        <Canvas shadows gl={{ antialias: false }}>
                            <Suspense fallback={<Html center><div className='text-white d-flex align-items-center gap-2'><div className='spinner-border spinner-border-sm' /> Initializing 3D Scene...</div></Html>}>
                                <PerspectiveCamera makeDefault position={[50, 40, 50]} fov={40} />
                                <CameraControls
                                    ref={cameraRef}
                                    makeDefault
                                    enabled={!isWallEndpointDragging}
                                    minDistance={1}
                                    maxDistance={500}
                                />
                                <Environment preset="city" />

                                <BuildingScene
                                    areas={areas}
                                    sensors={sensors}
                                    alerts={alerts}
                                    visibleAreaIds={selectedAreaIds}
                                    floorSpacing={DEFAULT_WALL_HEIGHT}
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
                                        setShowSettingsOverlay(true);
                                        setEditingAreaForWalls(null);
                                        setActiveMetricGroup(null);
                                    }}
                                    onSensorDrag={handleSensorDrag}
                                    previewState={previewState}
                                    blinkingWallIds={blinkingWallIds}
                                    wallDrawMode={wallDrawMode}
                                    onWallCreated={handleWallCreated}
                                    onWallsBatchCreated={(walls) => {
                                        if (editingAreaForWalls) {
                                            console.log('ThreeDPage: Buffering batch walls for AreaSettingsOverlay', walls.length);
                                            setPendingWalls(walls);
                                            setWallCreationTrigger(prev => prev + 1);
                                            setTimeout(() => setPendingWalls(null), 500);
                                        } else {
                                            walls.forEach(wall => {
                                                console.log('Wall payload to API:', wall);
                                                createWallMutation.mutate(wall);
                                            });
                                        }
                                        setWallDrawMode(false);
                                    }}
                                    wallDrawSettings={wallDrawSettings}
                                    onPointChainUpdate={setDrawPointCount}
                                    onArcBufferUpdate={setDrawArcBufferCount}
                                    onCommittedCountUpdate={setDrawCommittedCount}
                                    undoTrigger={wallDrawUndoTrigger}
                                    clearTrigger={wallDrawClearTrigger}
                                    finishTrigger={wallDrawFinishTrigger}
                                    selectedWallId={selectedWallId}
                                    zoomTrigger={zoomTrigger}
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
                        {wallDrawMode && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                                zIndex: 1300,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <div style={{
                                    background: 'rgba(240,192,64,0.15)',
                                    border: '1px solid rgba(240,192,64,0.5)',
                                    borderRadius: '20px',
                                    padding: '4px 14px',
                                    fontSize: '11px',
                                    color: '#f0c040',
                                    backdropFilter: 'blur(8px)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {wallDrawSettings.drawingMode === 'arc'
                                        ? drawArcBufferCount === 0
                                            ? 'Click arc start point'
                                            : drawArcBufferCount === 1
                                                ? 'Click arc end point'
                                                : 'Click point ON the curve'
                                        : drawPointCount === 0
                                            ? 'Click to place first point'
                                            : `${drawCommittedCount} wall${drawCommittedCount !== 1
                                                ? 's' : ''} — click near start to close`
                                    }
                                </div>
                            </div>
                        )}




                        {selectedSensor ? (
                            <SensorConfigCards sensorId={selectedSensor.id} sensor={selectedSensor} />
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



                        <UnifiedRightPanel
                            selectedSensor={showSettingsOverlay ? selectedSensor : null}
                            editingAreaForWalls={editingAreaForWalls}
                            activeMetricGroup={activeMetricGroup}
                            showSensorList={showSensorList}
                            sensorsByFloor={sensorsByFloor}
                            onSensorSelect={(s) => {
                                const sensorAreaId = typeof s.area === 'object' && s.area !== null
                                    ? s.area.id
                                    : (s.area || s.area_id);

                                if (sensorAreaId && !selectedAreaIds.includes(Number(sensorAreaId))) {
                                    setSelectedAreaIds(prev => [...prev, Number(sensorAreaId)]);
                                }
                                setSelectedSensorId(s.id);
                                setShowSettingsOverlay(true);
                                setShowSensorList(false);
                                setEditingAreaForWalls(null);
                                setActiveMetricGroup(null);

                                setPreviewState(createSensorPositionPreview(
                                    s.id,
                                    s.x_val || 0,
                                    s.y_val || 0,
                                    s.z_val || 0
                                ));
                            }}
                            onClose={() => {
                                setShowSettingsOverlay(false);
                                setEditingAreaForWalls(null);
                                setActiveMetricGroup(null);
                                setShowSensorList(false);
                                setPreviewState(null);
                                setWallDrawMode(false);
                                setBlinkingWallIds([]);
                            }}
                            previewState={previewState}
                            onPreviewChange={(changes) => {
                                if (showSettingsOverlay && selectedSensor) {
                                    handleSensorPreviewChange(selectedSensor.id, changes);
                                } else if (editingAreaForWalls) {
                                    handleAreaPreviewChange(editingAreaForWalls.id, changes);
                                }
                            }}
                            onBlinkingWallsChange={setBlinkingWallIds}
                            darkModeStatus={darkModeStatus}
                            externalWallToLink={externalWallToLink}
                            onExternalWallLinkHandled={() => setExternalWallToLink(null)}
                            wallDrawMode={wallDrawMode}
                            onToggleDrawing={setWallDrawMode}
                            pendingWalls={pendingWalls}
                            wallCreationTrigger={wallCreationTrigger}
                            selectedWallId={selectedWallId}
                            wallDrawSettings={wallDrawSettings}
                            onDrawSettingsChange={(partial) => setWallDrawSettings(prev => ({ ...prev, ...partial }))}
                            drawPointCount={drawPointCount}
                            drawArcBufferCount={drawArcBufferCount}
                            drawCommittedCount={drawCommittedCount}
                            onDrawFinish={() => setWallDrawFinishTrigger(prev => prev + 1)}
                            onDrawUndo={() => setWallDrawUndoTrigger(prev => prev + 1)}
                            onDrawClear={() => setWallDrawClearTrigger(prev => prev + 1)}
                        />
                        {/* Alert Simulator Panel */}
                        {showMockPanel && !wallDrawMode && (
                            <MockAlertPanel
                                sensors={sensorsData || []}
                                onFire={(alert) => dispatch(addSensorAlert(alert))}
                            />
                        )}
                    </div>
                </div>
            </Page>
        </PageWrapper >
    );
};

export default ThreeDPage;