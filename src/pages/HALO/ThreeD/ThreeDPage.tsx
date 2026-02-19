/**
 * 3D Page - Main Orchestrator Component
 * 
 * ✨ MAJOR REFACTORS (Issues #1, #2, #3, #9):
 * - Unified preview state (Issue #3)
 * - Centralized wall fetching (Issue #2)
 * - Fixed race condition in wall creation (Issue #1)
 * - Added keyboard shortcuts (Issue #9)
 * - Better state management and data flow
 */

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
import './ThreeDPage.scss';

import { useAreas, useSensors, useCreateWall } from '../../../api/sensors.api';
import { flattenAreas } from './utils/dataTransform';
import { Wall } from '../../../types/sensor';
import useToasterNotification from '../../../hooks/useToasterNotification';

// ✨ NEW IMPORTS
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

    // ============================================
    // ✨ STATE MANAGEMENT (Refactored)
    // ============================================

    // UI State
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [floorOpacity, setFloorOpacity] = useState(1);
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarTab, setSidebarTab] = useState<'sensors' | 'filters'>('sensors');
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

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

    // ✨ NEW: Unified Preview State (Fixes Issue #3)
    const [previewState, setPreviewState] = useState<PreviewState>(null);

    // ✨ NEW: Wall creation counter (Fixes Issue #1 - Race condition)
    const [wallCreationTrigger, setWallCreationTrigger] = useState(0);
    const [pendingWall, setPendingWall] = useState<Partial<Wall> | null>(null);

    // 3D Calibration
    const [calibration, setCalibration] = useState<any>(null);

    // ============================================
    // ✨ DATA FETCHING (Centralized)
    // ============================================

    // Fetch areas and sensors
    const { data: areasData, isLoading: areasLoading } = useAreas();
    const { data: sensorsData, isLoading: sensorsLoading } = useSensors();

    // Mutations
    const createWallMutation = useCreateWall();

    // ✨ NEW: Centralized wall fetching (Fixes Issue #2)
    // Fetch walls for all selected areas at once
    const { data: wallsData, isLoading: wallsLoading } = useQuery({
        queryKey: ['walls-centralized', selectedAreaIds],
        queryFn: async () => {
            if (selectedAreaIds.length === 0) return {};

            // Fetch walls for all selected areas in parallel
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

            // Convert to Record<areaId, Wall[]>
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

    // ============================================
    // ✨ KEYBOARD SHORTCUTS (Fixes Issue #9)
    // ============================================

    useKeyboardShortcuts({
        onSave: () => {
            if (showSettingsOverlay || editingAreaForWalls) {
                console.log('Keyboard: Save triggered');
                // The save button in overlays will handle this
                // We just need to trigger a click event on the save button
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
            }
        },
        onEscape: () => {
            console.log('Keyboard: Escape triggered');
            // Same as cancel
            if (wallDrawMode) {
                setWallDrawMode(false);
            } else if (showSettingsOverlay) {
                setShowSettingsOverlay(false);
            } else if (editingAreaForWalls) {
                setEditingAreaForWalls(null);
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

    // ============================================
    // ESC KEY HANDLER (Wall Drawing Cancellation)
    // ============================================

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

    // ============================================
    // DATA FILTERING (Building-specific)
    // ============================================

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

    // ============================================
    // DERIVED STATE
    // ============================================

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

    // ============================================
    // ✨ INITIALIZATION (Area Selection)
    // ============================================

    useEffect(() => {
        if (areas.length > 0 && selectedAreaIds.length === 0 && !urlAreaId) {
            const floorIds = areas.filter(a => a.area_type === 'floor' || a.area_type === 'room').map(a => a.id);
            setSelectedAreaIds(floorIds);
        }
    }, [areas, urlAreaId, selectedAreaIds.length]);

    useEffect(() => {
        if (urlAreaId) {
            setSelectedAreaIds([Number(urlAreaId)]);
        }
    }, [urlAreaId]);

    // ============================================
    // ✨ AREA ISOLATION (When Sensor Selected)
    // ============================================

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

    // ============================================
    // ✨ WALL CREATION HANDLER (Fixes Issue #1)
    // ============================================

    const handleWallCreated = (newWall: Partial<Wall>) => {
        console.log('ThreeDPage: onWallCreated received:', newWall);

        if (editingAreaForWalls) {
            console.log('ThreeDPage: Buffering wall for AreaSettingsOverlay');
            // ✨ FIX: Use counter to force re-render instead of setTimeout
            setPendingWall(newWall);
            setWallCreationTrigger(prev => prev + 1);

            // Clear after a brief moment (longer than before to ensure propagation)
            setTimeout(() => {
                setPendingWall(null);
            }, 500);
        } else {
            console.log('ThreeDPage: Creating wall via mutation');
            createWallMutation.mutate(newWall);
        }
        setWallDrawMode(false);
    };

    // ============================================
    // ✨ PREVIEW STATE HANDLERS (Unified)
    // ============================================

    const handleSensorPreviewChange = (sensorId: string | number, changes: any) => {
        if (changes === null) {
            // Clear preview
            setPreviewState(null);
        } else if (changes.walls) {
            // Sensor walls preview
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
        console.log('🐞 update_debug: ThreeDPage received update', { wallId: wall.id, points });
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

    // ============================================
    // SENSOR DRAG HANDLER
    // ============================================

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

    // ============================================
    // RENDER
    // ============================================

    return (
        <PageWrapper title='3D Sensor Visualization'>
            <Page container='fluid' className='p-0 h-100'>
                <div className='threed-page-container d-flex flex-column'>
                    {/* ============================================ */}
                    {/* HEADER CONTROLS                              */}
                    {/* ============================================ */}

                    <Card className='mb-0 rounded-0 border-0 border-bottom'>
                        <CardHeader className='bg-transparent border-0'>
                            <div className='d-flex justify-content-between align-items-center'>
                                <CardTitle className='mb-0'>
                                    <Icon icon='ViewInAr' className='me-2' />
                                    3D Building Visualization
                                    {isLoading && <span className='ms-2 spinner-border spinner-border-sm text-primary' role='status' />}
                                </CardTitle>

                                <div className='d-flex gap-2 align-items-center'>
                                    <div className='d-flex align-items-center gap-2'>
                                        <Button
                                            color='info'
                                            isLight={!showBoundaries}
                                            icon='Visibility'
                                            onClick={() => setShowBoundaries(!showBoundaries)}>
                                            {showBoundaries ? 'Hide Boundaries' : 'Show Boundaries'}
                                        </Button>
                                    </div>

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

                    {/* ============================================ */}
                    {/* 3D CANVAS                                    */}
                    {/* ============================================ */}

                    <div
                        className='flex-grow-1 position-relative d-flex overflow-hidden'
                    >
                        {/* ============================================ */}
                        {/* SENSORS SIDEBAR                              */}
                        {/* ============================================ */}

                        {showSidebar && (
                            <div
                                className='position-absolute start-0 p-0 shadow overflow-hidden d-flex flex-column'
                                style={{
                                    left: '0',
                                    background: darkModeStatus ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(12px)',
                                    width: '320px',
                                    height: 'calc(100% - 70px)',
                                    border: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    zIndex: 100
                                }}
                            >
                                <div className='p-0 border-bottom d-flex'>
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
                                                                // ✨ MODIFIED: Use unified preview state
                                                                setPreviewState(createSensorPositionPreview(
                                                                    s.id,
                                                                    s.x_val || 0,
                                                                    s.y_val || 0,
                                                                    s.z_val || 0
                                                                ));
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

                        {/* ============================================ */}
                        {/* 3D SCENE                                     */}
                        {/* ============================================ */}

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
                                    }}
                                    onSensorDrag={handleSensorDrag}
                                    previewState={previewState}
                                    blinkingWallIds={blinkingWallIds}
                                    wallDrawMode={wallDrawMode}
                                    onWallCreated={handleWallCreated}
                                    selectedWallId={selectedWallId}
                                    onWallClick={(wall) => {
                                        setSelectedWallId(wall.id);
                                        // Find which area this wall belongs to
                                        if (wallsData) {
                                            for (const [areaId, walls] of Object.entries(wallsData)) {
                                                if (walls.some(w => String(w.id) === String(wall.id))) {
                                                    const area = filteredAreas.find(a => String(a.id) === String(areaId));
                                                    if (area) {
                                                        setEditingAreaForWalls(area);
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
                            />
                        )}



                        {showSettingsOverlay && selectedSensor && (
                            <SensorSettingsOverlay
                                sensor={selectedSensor}
                                originalSensor={selectedSensor}
                                onClose={() => {
                                    setShowSettingsOverlay(false);
                                    setPreviewState(null); // ✨ Clear preview
                                }}
                                onPreviewChange={(changes) => {
                                    handleSensorPreviewChange(selectedSensor.id, changes);
                                }}
                                onBlinkingWallsChange={setBlinkingWallIds}
                                previewState={previewState} // ✨ NEW: Sync from 3D drag
                            />
                        )}

                        {!showSettingsOverlay && selectedSensor && (
                            <SensorDataOverlay
                                sensor={selectedSensor}
                                onClose={() => {
                                    setSelectedSensorId(null);
                                    setPreviewState(null); // ✨ Clear preview
                                }}
                                onSettingsClick={() => setShowSettingsOverlay(true)}
                            />
                        )}

                        {editingAreaForWalls && (
                            <AreaSettingsOverlay
                                area={editingAreaForWalls}
                                isDrawing={wallDrawMode}
                                onToggleDrawing={setWallDrawMode}
                                newlyCreatedWall={pendingWall} // ✨ FIX: Use controlled state
                                wallCreationTrigger={wallCreationTrigger} // ✨ FIX: Counter to force updates
                                onClose={() => {
                                    setEditingAreaForWalls(null);
                                    setPreviewState(null); // ✨ Clear preview
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
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default ThreeDPage;