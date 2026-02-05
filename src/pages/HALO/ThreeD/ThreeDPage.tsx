import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html, Loader } from '@react-three/drei';
import { BuildingScene } from './components/BuildingScene';
import { DUMMY_AREAS, DUMMY_SENSORS } from './dummyData';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import useDarkMode from '../../../hooks/useDarkMode';
import './ThreeDPage.scss';

const ThreeDPage = () => {
    const { darkModeStatus } = useDarkMode();
    const [visibleFloors, setVisibleFloors] = useState<number[]>([0, 1, 2]);
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [floorOpacity, setFloorOpacity] = useState(1);
    const [selectedSensor, setSelectedSensor] = useState<any>(null);

    const toggleFloor = (floorLevel: number) => {
        setVisibleFloors(prev =>
            prev.includes(floorLevel)
                ? prev.filter(f => f !== floorLevel)
                : [...prev, floorLevel]
        );
    };

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
                                </CardTitle>

                                <div className='d-flex gap-2 align-items-center'>
                                    {/* Floor toggles */}
                                    <div className='btn-group btn-group-sm'>
                                        {[0, 1, 2].map(floor => (
                                            <Button
                                                key={floor}
                                                color={visibleFloors.includes(floor) ? 'primary' : 'light'}
                                                onClick={() => toggleFloor(floor)}
                                                size='sm'
                                            >
                                                Floor {floor}
                                            </Button>
                                        ))}
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

                                    <Badge color='success' isLight>
                                        {DUMMY_SENSORS.length} Sensors
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
                        <Canvas>
                            <Suspense fallback={<Html center><div className='text-white'>Loading 3D Scene...</div></Html>}>
                                {/* Camera */}
                                <PerspectiveCamera makeDefault position={[15, 10, 15]} fov={50} />

                                {/* Controls */}
                                <OrbitControls
                                    enableDamping
                                    dampingFactor={0.05}
                                    minDistance={5}
                                    maxDistance={1500}
                                    maxPolarAngle={Math.PI / 2}
                                />

                                {/* Environment */}
                                <Environment preset="city" />

                                {/* Main Scene */}
                                <BuildingScene
                                    areas={DUMMY_AREAS}
                                    sensors={DUMMY_SENSORS}
                                    visibleFloors={visibleFloors}
                                    floorSpacing={200}
                                    floorOpacity={floorOpacity}
                                    showBoundaries={showBoundaries}
                                    onSensorClick={(sensor) => {
                                        setSelectedSensor(sensor);
                                        console.log('Sensor clicked:', sensor);
                                    }}
                                />
                            </Suspense>
                        </Canvas>
                        <Loader />

                        {/* Sensor Details Overlay */}
                        {selectedSensor && (
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

