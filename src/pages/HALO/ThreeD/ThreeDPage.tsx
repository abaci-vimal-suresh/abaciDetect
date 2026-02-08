import { Suspense, useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera, Environment, Html, Loader } from '@react-three/drei';
import { BuildingScene } from './components/BuildingScene';
import SensorSettingsOverlay from './components/SensorSettingsOverlay';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import useDarkMode from '../../../hooks/useDarkMode';
import './ThreeDPage.scss';

import { useAreas, useSensors } from '../../../api/sensors.api';
import { flattenAreas } from './utils/dataTransform';

const ThreeDPage = () => {
    const { areaId: urlAreaId } = useParams<{ areaId: string }>();
    const { darkModeStatus } = useDarkMode();
    const [visibleFloors, setVisibleFloors] = useState<number[]>([0, 1, 2]);
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [floorOpacity, setFloorOpacity] = useState(1);
    const [selectedSensor, setSelectedSensor] = useState<any>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [previewSensor, setPreviewSensor] = useState<any>(null);

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
        const buildingTree = flattenAreas([targetBuilding]);
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

        return {
            filteredAreas: buildingTree,
            filteredSensors: sensorsInBuilding
        };
    }, [areasData, sensorsData, urlAreaId]);

    const areas = filteredAreas;
    const sensors = filteredSensors;

    // Extract unique floors for UI toggles
    const availableFloors = useMemo(() => {
        const floorLevels = areas
            .filter(a => (a.area_type === 'floor' || a.area_type === 'room') && (a.floor_level !== undefined || a.offset_z !== undefined))
            .map(a => a.floor_level ?? a.offset_z ?? 0);

        // Fix Set iteration lint error
        const uniqueLevels = Array.from(new Set(floorLevels));
        return uniqueLevels.sort((a, b) => a - b);
    }, [areas]);

    // Update visible floors when data loads
    useEffect(() => {
        if (availableFloors.length > 0) {
            setVisibleFloors(availableFloors);
        }
    }, [availableFloors]);

    const toggleFloor = (floorLevel: number) => {
        setVisibleFloors(prev =>
            prev.includes(floorLevel)
                ? prev.filter(f => f !== floorLevel)
                : [...prev, floorLevel]
        );
    };

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
                                        {availableFloors.map(floor => (
                                            <Button
                                                key={floor}
                                                color={visibleFloors.includes(floor) ? 'primary' : 'light'}
                                                onClick={() => toggleFloor(floor)}
                                                size='sm'
                                            >
                                                Floor {floor}
                                            </Button>
                                        ))}
                                        {availableFloors.length === 0 && !isLoading && (
                                            <span className='text-muted small px-2'>No floors found</span>
                                        )}
                                    </div>

                                    {/* Boundaries toggle */}
                                    <Button
                                        color={showBoundaries ? 'info' : 'light'}
                                        onClick={() => setShowBoundaries(!showBoundaries)}
                                        size='sm'
                                        icon='BorderAll'
                                    >
                                        Boundaries
                                    </Button>

                                    {/* Opacity slider */}
                                    <div className='d-flex align-items-center gap-2'>
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
                                    </div>

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

                    {/* 3D Canvas */}
                    <div
                        className='flex-grow-1 position-relative'
                        style={{
                            background: darkModeStatus
                                ? 'linear-gradient(180deg, #1e1b4b 0%, #0F172A 100%)'
                                : 'linear-gradient(180deg, #9371b3ff 0%, #ffffff 100%)'
                        }}
                    >
                        {/* Fixed Sensor Sidebar Overlay */}
                        {showSidebar && (
                            <div
                                className='position-absolute top-0 start-0 m-3 p-0 rounded shadow overflow-hidden d-flex flex-column'
                                style={{
                                    background: darkModeStatus ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(12px)',
                                    width: '320px',
                                    maxHeight: 'calc(100% - 30px)',
                                    border: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    zIndex: 100
                                }}
                            >
                                <div className='p-3 border-bottom' style={{ background: darkModeStatus ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}>
                                    <h6 className={`mb-0 d-flex align-items-center justify-content-between ${darkModeStatus ? 'text-white' : 'text-dark'}`}>
                                        <span><Icon icon='List' className='me-2 text-info' />Building Sensors</span>
                                        <Badge color='info' isLight>{sensors.length}</Badge>
                                    </h6>
                                </div>
                                <div className='flex-grow-1 overflow-auto p-2 scrollbar-hidden'>
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
                                                        const floorLevel = s.floor_level ?? 0;
                                                        if (!visibleFloors.includes(floorLevel)) {
                                                            setVisibleFloors(prev => [...prev, floorLevel]);
                                                        }
                                                        setSelectedSensor(s);
                                                        setShowSettingsOverlay(true);
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
                                </div>
                            </div>
                        )}

                        <Canvas>
                            <Suspense fallback={<Html center><div className='text-white d-flex align-items-center gap-2'><div className='spinner-border spinner-border-sm' /> Initializing 3D Scene...</div></Html>}>
                                {/* Camera */}
                                <PerspectiveCamera makeDefault position={[300, 200, 300]} fov={50} />

                                {/* Controls */}
                                <CameraControls
                                    makeDefault
                                    minDistance={5}
                                    maxDistance={5000}
                                />

                                {/* Environment */}
                                <Environment preset="city" />

                                {/* Main Scene */}
                                <BuildingScene
                                    areas={areas}
                                    sensors={sensors}
                                    visibleFloors={visibleFloors}
                                    floorSpacing={200}
                                    floorOpacity={floorOpacity}
                                    showBoundaries={showBoundaries}
                                    selectedSensorId={selectedSensor?.id}
                                    setSelectedSensorId={(id) => {
                                        const sensor = sensors.find(s => s.id === id);
                                        if (sensor) {
                                            const floorLevel = sensor.floor_level ?? 0;
                                            if (!visibleFloors.includes(floorLevel)) {
                                                setVisibleFloors(prev => [...prev, floorLevel]);
                                            }
                                        }
                                        setSelectedSensor(sensor);
                                        setShowSettingsOverlay(true);
                                    }}
                                    onSensorClick={(sensor) => {
                                        const floorLevel = sensor.floor_level ?? 0;
                                        if (!visibleFloors.includes(floorLevel)) {
                                            setVisibleFloors(prev => [...prev, floorLevel]);
                                        }
                                        setSelectedSensor(sensor);
                                        setShowSettingsOverlay(true);
                                        console.log('Sensor clicked:', sensor);
                                    }}
                                />
                            </Suspense>
                        </Canvas>
                        <Loader />

                        {/* Sensor Settings Overlay (Right Side) */}
                        {showSettingsOverlay && selectedSensor && (
                            <SensorSettingsOverlay
                                sensor={selectedSensor}
                                onClose={() => setShowSettingsOverlay(false)}
                            />
                        )}

                        {/* Sensor Details Overlay */}
                        {!showSettingsOverlay && selectedSensor && (
                            <div
                                className='position-absolute top-0 end-0 m-3 p-3 rounded shadow'
                                style={{
                                    background: darkModeStatus ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    maxWidth: '300px'
                                }}
                            >
                                <div className='d-flex justify-content-between align-items-start mb-2'>
                                    <h6 className='mb-0'>{selectedSensor.name}</h6>
                                    <Button
                                        color='link'
                                        size='sm'
                                        icon='Close'
                                        onClick={() => setSelectedSensor(null)}
                                    />
                                </div>
                                <div className='small'>
                                    <div>Floor: {selectedSensor.floor_level}</div>
                                    <div>Status: <Badge color={selectedSensor.status === 'safe' ? 'success' : selectedSensor.status === 'warning' ? 'warning' : 'danger'}>{selectedSensor.status}</Badge></div>
                                    <div>Position: ({selectedSensor.x_val?.toFixed(2)}, {selectedSensor.y_val?.toFixed(2)})</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default ThreeDPage;

