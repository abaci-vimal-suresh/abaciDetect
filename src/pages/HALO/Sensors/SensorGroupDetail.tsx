import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb, { BreadcrumbItem } from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../components/bootstrap/Modal';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import { useAreas, useAddSensorToSubArea, useSensors, useCreateSubArea } from '../../../api/sensors.api';
import { useQueryClient } from '@tanstack/react-query';
import { Area, SensorPlacementPayload } from '../../../types/sensor';
import FloorPlanCanvas from '../../../components/halo/FloorPlanCanvas';
import SensorPalette from '../../../components/halo/SensorPalette';
import RoomSettingsPanel, { RoomVisibilitySettings } from '../../../components/halo/RoomSettingsPanel';
import { mockRoomBoundaries, mockSensors, mockAreas, saveMockData } from '../../../mockData/sensors';

import { DEFAULT_ROOM_SETTINGS, syncWallHeight } from '../../../utils/halo/roomSettings.utils';
import { buildAreaBreadcrumbPath } from '../../../utils/halo/navigation.utils';
import { filterSensors, getSensorsByArea, getAvailableSensors } from '../../../utils/halo/sensorData.utils';

const SensorGroupDetail = () => {
    const { areaId, subzoneId } = useParams<{ areaId: string; subzoneId: string }>();
    const navigate = useNavigate();
    const { data: areas, isLoading: areasLoading } = useAreas();
    const { data: allSensors, isLoading: sensorsLoading } = useSensors();
    const addSensorMutation = useAddSensorToSubArea();
    const createSubAreaMutation = useCreateSubArea();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubAreaModalOpen, setIsSubAreaModalOpen] = useState(false);
    const [selectedSensorId, setSelectedSensorId] = useState('');
    const [subAreaName, setSubAreaName] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'floorplan'>('floorplan');
    const [isEditMode, setIsEditMode] = useState(false);

    const [uploadedFloorPlan, setUploadedFloorPlan] = useState<string | null>(null);
    const [roomSettings, setRoomSettings] = useState<RoomVisibilitySettings>(DEFAULT_ROOM_SETTINGS);

    // Enforce 60% ratio safety on load (Handles stale localStorage or initial mismatch)
    React.useEffect(() => {
        setRoomSettings(prev => {
            const correctHeight = syncWallHeight(prev.floorSpacing);
            if (prev.wallHeight !== correctHeight) {
                console.log('🔄 [3D] Synchronizing wall height ratio on load:', { spacing: prev.floorSpacing, height: correctHeight });
                return { ...prev, wallHeight: correctHeight };
            }
            return prev;
        });
    }, []);

    // Find target subarea directly from the flat list (since the API returns it at top level too)
    const currentSubArea = useMemo(() => {
        return areas?.find(sub => sub.id === Number(subzoneId));
    }, [areas, subzoneId]);

    // Find the main area for context
    const currentArea = useMemo(() => {
        return areas?.find(area => area.id === Number(areaId));
    }, [areas, areaId]);

    // Auto-sync visible floors based on navigation context
    React.useEffect(() => {
        const target = currentSubArea || currentArea;
        if (target && target.floor_level !== undefined && target.floor_level !== null) {
            setRoomSettings(prev => ({
                ...prev,
                visibleFloors: [Number(target.floor_level)]
            }));
        } else {
            // If at building root, show all discovered floors (empty = all)
            setRoomSettings(prev => ({
                ...prev,
                visibleFloors: []
            }));
        }
    }, [subzoneId, areaId, currentSubArea, currentArea]);

    // Load uploaded floor plan from persisted data when switching sub-areas
    React.useEffect(() => {
        if (subzoneId) {
            const area = mockAreas.find(a => a.id === Number(subzoneId));
            if (area?.floor_plan_url) {
                setUploadedFloorPlan(area.floor_plan_url);
            } else {
                setUploadedFloorPlan(null);
            }
        }
    }, [subzoneId]);

    // Mock update handler (In real app, use mutation)
    const handleSensorUpdate = (sensorId: string, x: number, y: number, areaId?: number | null) => {
        const sensorIndex = mockSensors.findIndex(s => s.id === sensorId);
        if (sensorIndex > -1) {
            // Update the mock data in memory immediately so UI reflects change
            mockSensors[sensorIndex].x_coordinate = x;
            mockSensors[sensorIndex].y_coordinate = y;

            // NEW: Update area_id assignment AND floor_level
            if (areaId !== undefined) {
                mockSensors[sensorIndex].area_id = areaId || undefined;
                const targetArea = areas?.find(a => Number(a.id) === Number(areaId));
                // IMPORTANT: Update area object and floor_level to match the area
                if (targetArea) {
                    mockSensors[sensorIndex].area = { ...targetArea };
                    mockSensors[sensorIndex].area_name = targetArea.name;
                    if (targetArea.floor_level !== undefined) {
                        mockSensors[sensorIndex].floor_level = targetArea.floor_level;
                    }
                }

                if (areaId) {
                    console.log(`✅ [MOCK] Sensor ${sensorId} auto-assigned to area ${areaId} (Floor: ${mockSensors[sensorIndex].floor_level})`);
                } else {
                    console.log(`⚠️ [MOCK] Sensor ${sensorId} unassigned from area`);
                }
            }

            // TELEMETRY: Console log the payload as requested by user
            const payload: SensorPlacementPayload & { boundary?: any } = {
                sensorId,
                areaId: areaId || Number(subzoneId),
                x_coordinate: x,
                y_coordinate: y,
                image_url: uploadedFloorPlan || currentSubArea?.floor_plan_url,
                boundary: mockSensors[sensorIndex].boundary // Include boundary in payload
            };
            console.log('📡 [TELEMETRY] Sensor placement payload:', payload);

            // ✅ PERSIST to localStorage and refresh queries
            saveMockData('sensors', mockSensors);
            queryClient.invalidateQueries({ queryKey: ['sensors'] });
        }
    };

    const handleBoundaryUpdate = (sensorId: string, boundary: { x_min: number; x_max: number; y_min: number; y_max: number; z_min: number; z_max: number }) => {
        const sensorIndex = mockSensors.findIndex(s => s.id === sensorId);
        if (sensorIndex > -1) {
            mockSensors[sensorIndex].boundary = boundary;
            console.log(`📐 [MOCK] Updated boundary for ${sensorId}`, boundary);

            // ✅ PERSIST to localStorage and refresh queries
            saveMockData('sensors', mockSensors);
            queryClient.invalidateQueries({ queryKey: ['sensors'] });
        }
    };

    const handleSensorRemove = (sensorId: string) => {
        const sensorIndex = mockSensors.findIndex(s => s.id === sensorId);
        if (sensorIndex > -1) {
            // TELEMETRY: Console log the removal payload
            console.log('🗑️ [TELEMETRY] Sensor removed from floor plan:', {
                sensorId,
                previousCoordinates: {
                    x: mockSensors[sensorIndex].x_coordinate,
                    y: mockSensors[sensorIndex].y_coordinate
                }
            });

            // Reset coordinates and area
            (mockSensors[sensorIndex] as any).x_coordinate = undefined;
            (mockSensors[sensorIndex] as any).y_coordinate = undefined;
            (mockSensors[sensorIndex] as any).area = null;
        }
    };



    const handleImageUpload = (file: File) => {
        // Create a local blob URL for the uploaded image
        const url = URL.createObjectURL(file);
        setUploadedFloorPlan(url);

        // ✅ PERSIST to mock data structure
        if (subzoneId) {
            // ✅ Update the area object with floor_plan_url
            const areaIndex = mockAreas.findIndex(a => a.id === Number(subzoneId));
            if (areaIndex !== -1) {
                mockAreas[areaIndex].floor_plan_url = url;
            }

            // ✅ PERSIST to localStorage
            saveMockData('areas', mockAreas);
        }
        console.log('🖼️ [MOCK] Floor plan uploaded and persisted:', file.name);
    };


    // Get nested sub-areas (sub-areas of this sub-area)
    const nestedSubAreas = currentSubArea?.subareas || [];

    // Build breadcrumb path from main area to current subarea
    const breadcrumbPath = useMemo(() => {
        return buildAreaBreadcrumbPath(currentSubArea, areas, areaId || '');
    }, [currentSubArea, areas, areaId]);

    // Get sensors that belong to this area
    const areaSensors = useMemo(() => {
        return getSensorsByArea(allSensors || [], areaId, currentArea?.name);
    }, [allSensors, areaId, currentArea]);

    // Filter sensors that belong to this subarea
    const sensors = useMemo(() => {
        return allSensors?.filter(sensor => {
            const targetId = Number(subzoneId);
            if (Number(sensor.area?.id) === targetId || Number(sensor.area_id) === targetId) return true;
            if (!sensor.area && !sensor.area_id && sensor.area_name === currentSubArea?.name) return true;
            return false;
        }) || [];
    }, [allSensors, subzoneId, currentSubArea]);

    // Get available sensors (sensors with no area assigned)
    const availableSensors = useMemo(() => {
        return getAvailableSensors(allSensors || []);
    }, [allSensors]);

    // Filter nested sub areas based on search term
    const filteredNestedSubAreas = useMemo(() => {
        return nestedSubAreas.filter(subArea =>
            subArea.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [nestedSubAreas, searchTerm]);

    // Filter sensors based on search term and status
    const filteredSensors = useMemo(() => {
        return filterSensors(sensors, searchTerm, filterStatus);
    }, [sensors, searchTerm, filterStatus]);

    const handleAddSensor = () => {
        if (!selectedSensorId || !subzoneId) return;
        addSensorMutation.mutate(
            { sensorId: selectedSensorId, subAreaId: subzoneId },
            {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setSelectedSensorId('');
                },
            }
        );
    };

    const handleCreateSubArea = () => {
        if (!subAreaName.trim()) {
            setError('Sub area name is required');
            return;
        }

        createSubAreaMutation.mutate(
            { name: subAreaName, areaId: subzoneId || '' },
            {
                onSuccess: () => {
                    setIsSubAreaModalOpen(false);
                    setSubAreaName('');
                    setError('');
                },
            }
        );
    };

    const handleNestedCardClick = (nestedSubAreaId: number) => {
        navigate(`/halo/sensors/areas/${areaId}/subzones/${nestedSubAreaId}`);
    };

    if (areasLoading || sensorsLoading) {
        return (
            <PageWrapper title='Sub Area Details'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title='Sub Area Details'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'Areas', to: '/halo/sensors/areas' },
                            { title: currentArea?.name || 'Area', to: `/halo/sensors/areas/${areaId}/subzones` },
                            ...breadcrumbPath
                        ]}
                    />
                </SubHeaderLeft>
                <SubHeaderRight>
                    <div className='btn-group me-3'>
                        <Button
                            color={viewMode === 'grid' ? 'primary' : 'secondary'}
                            icon='GridView'
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' ? 'active' : ''}
                            title='Grid View'
                        >
                            Grid
                        </Button>
                        <Button
                            color={viewMode === 'floorplan' ? 'primary' : 'secondary'}
                            icon='3d_rotation'
                            onClick={() => setViewMode('floorplan')}
                            className={viewMode === 'floorplan' ? 'active' : ''}
                            title='3D View'
                        >
                            3D View
                        </Button>
                    </div>
                    <Button
                        color='info'
                        icon='Add'
                        className='me-2'
                        onClick={() => setIsSubAreaModalOpen(true)}
                    >
                        Create Sub Area
                    </Button>
                    <Button color='primary' icon='Add' onClick={() => setIsModalOpen(true)}>
                        Add Sensor
                    </Button>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>

                {viewMode === 'floorplan' ? (

                    <div style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
                        <div className='row g-3 h-100 align-items-stretch'>
                            {/* LEFT SIDEBAR: SENSOR PALETTE (Only in Edit Mode) */}
                            {isEditMode && (
                                <div className='col-md-3 h-100'>
                                    <SensorPalette
                                        sensors={allSensors?.filter(s => {
                                            const targetAreaId = subzoneId ? Number(subzoneId) : Number(areaId);
                                            return (!s.area_id && !s.area_name) ||
                                                (s.area_id === targetAreaId && (s.x_coordinate === undefined || s.x_coordinate === null)) ||
                                                s.status === 'Inactive';
                                        }) || []}
                                        currentAreaId={subzoneId ? Number(subzoneId) : Number(areaId)}
                                        onDragStart={(e, sensor) => {
                                            e.dataTransfer.setData('application/json', JSON.stringify({ sensorId: sensor.id }));
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                    />
                                </div>
                            )}

                            {/* CENTER: 3D VIEW (Adjusts width) */}
                            <div className={`${isEditMode ? 'col-md-9' : 'col-md-9'} h-100 d-flex flex-column`}>
                                <div className='d-flex justify-content-between align-items-center mb-3'>
                                    <h5 className='mb-0 text-white'>
                                        {isEditMode ? 'Edit 3D Sensor Layout' : '3D Sensor Visualization'}
                                    </h5>
                                    <div>
                                        <Button
                                            color={isEditMode ? 'success' : 'primary'}
                                            icon={isEditMode ? 'Save' : 'Edit'}
                                            onClick={() => setIsEditMode(!isEditMode)}
                                            className='me-2'
                                        >
                                            {isEditMode ? 'Save Layout' : 'Edit Layout'}
                                        </Button>
                                        {isEditMode && (
                                            <Button
                                                color='light'
                                                icon='Close'
                                                onClick={() => {
                                                    setIsEditMode(false);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-fill">
                                    <FloorPlanCanvas
                                        areaId={subzoneId ? Number(subzoneId) : Number(areaId)}
                                        sensors={(allSensors || []).filter(s => {
                                            const targetAreaId = subzoneId ? Number(subzoneId) : Number(areaId);
                                            return !s.area_id ||
                                                Number(s.area_id) === targetAreaId ||
                                                (Number(s.area?.parent_id) === targetAreaId);
                                        })}
                                        areas={areas || []}
                                        roomSettings={roomSettings}
                                        onSettingsChange={setRoomSettings}
                                        floorPlanUrl={uploadedFloorPlan || currentSubArea?.floor_plan_url || currentArea?.floor_plan_url}
                                        roomBoundaries={mockRoomBoundaries[subzoneId ? Number(subzoneId) : Number(areaId)]}
                                        onSensorClick={(sensor) => !isEditMode && navigate(`/halo/sensors/detail/${sensor.id}`)}
                                        onSensorDrop={(sensorId, x, y, areaId) => {
                                            handleSensorUpdate(sensorId, x, y, areaId);
                                        }}
                                        onSensorRemove={handleSensorRemove}
                                        onImageUpload={handleImageUpload}
                                        onBoundaryUpdate={handleBoundaryUpdate}
                                        editMode={isEditMode}
                                        style={{ height: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* RIGHT SIDEBAR: SETTINGS */}
                            {!isEditMode && (
                                <div className='col-md-3 h-100'>
                                    <RoomSettingsPanel
                                        settings={roomSettings}
                                        onSettingsChange={setRoomSettings}
                                        currentArea={currentSubArea}
                                        areas={areas || []}
                                        sensors={allSensors || []}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Filter Section */}
                        <div className='row mb-4'>
                            <div className='col-12'>
                                <Card>
                                    <CardBody>
                                        <div className='row g-3 align-items-end'>
                                            <div className='col-md-6'>
                                                <FormGroup label='Search'>
                                                    <div className='input-group'>
                                                        <span className='input-group-text'>
                                                            <Icon icon='Search' />
                                                        </span>
                                                        <Input
                                                            type='text'
                                                            placeholder='Search by name, MAC address, or type...'
                                                            value={searchTerm}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                </FormGroup>
                                            </div>
                                            <div className='col-md-3'>
                                                <FormGroup label='Status Filter'>
                                                    <select
                                                        className='form-select'
                                                        value={filterStatus}
                                                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                                    >
                                                        <option value='all'>All Status</option>
                                                        <option value='active'>Active Only</option>
                                                        <option value='inactive'>Inactive Only</option>
                                                    </select>
                                                </FormGroup>
                                            </div>
                                            <div className='col-md-3'>
                                                <Button
                                                    className='w-100'
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setFilterStatus('all');
                                                    }}
                                                >
                                                    Clear Filters
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {/* Nested Sub Areas Section */}
                        {nestedSubAreas.length > 0 && (
                            <div className='mb-4'>
                                <div className='d-flex align-items-center justify-content-between mb-3'>
                                    <div className='d-flex align-items-center'>
                                        <Icon icon='AccountTree' className='me-2 fs-4' />
                                        <span className='h5 mb-0 fw-bold'>Sub Areas of {currentSubArea?.name}</span>
                                    </div>
                                    <Badge color='info' isLight className='fs-6'>
                                        {filteredNestedSubAreas.length} of {nestedSubAreas.length}
                                    </Badge>
                                </div>
                                <div className='row g-4 mb-4'>
                                    {filteredNestedSubAreas.map(nestedSubArea => (
                                        <div key={nestedSubArea.id} className='col-md-6 col-xl-4'>
                                            <Card
                                                stretch
                                                className='cursor-pointer transition-shadow'
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleNestedCardClick(nestedSubArea.id)}
                                            >
                                                <CardHeader>
                                                    <CardTitle>{nestedSubArea.name}</CardTitle>
                                                    <CardActions>
                                                        <Badge color='success' isLight>
                                                            Active
                                                        </Badge>
                                                    </CardActions>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className='d-flex justify-content-between align-items-center mb-2'>
                                                        <div className='text-muted'>
                                                            <Icon icon='Sensors' size='sm' className='me-1' />
                                                            Sensors
                                                        </div>
                                                        <div className='fw-bold fs-5'>{nestedSubArea.sensor_count || 0}</div>
                                                    </div>
                                                    {nestedSubArea.subareas && nestedSubArea.subareas.length > 0 && (
                                                        <div className='d-flex justify-content-between align-items-center'>
                                                            <div className='text-muted'>
                                                                <Icon icon='AccountTree' size='sm' className='me-1' />
                                                                Sub Areas
                                                            </div>
                                                            <div className='fw-bold fs-5'>{nestedSubArea.subareas.length}</div>
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </div>
                                    ))}
                                    {filteredNestedSubAreas.length === 0 && searchTerm && (
                                        <div className='col-12'>
                                            <Card>
                                                <CardBody className='text-center py-4'>
                                                    <Icon icon='SearchOff' className='fs-1 text-muted mb-2' />
                                                    <p className='text-muted mb-0'>No sub areas match your search</p>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sensors Section */}
                        <div>
                            <div className='d-flex align-items-center justify-content-between mb-3'>
                                <div className='d-flex align-items-center'>
                                    <Icon icon='Sensors' className='me-2 fs-4' />
                                    <span className='h5 mb-0 fw-bold'>Sensors in {currentSubArea?.name}</span>
                                </div>
                                <Badge color='success' isLight className='fs-6'>
                                    {filteredSensors.length} of {sensors.length}
                                </Badge>
                            </div>

                            <div className='row g-4'>
                                {filteredSensors.map(sensor => (
                                    <div key={sensor.id} className='col-md-6 col-xl-4'>
                                        <Card stretch>
                                            <CardHeader>
                                                <CardTitle>{sensor.name}</CardTitle>
                                                <CardActions>
                                                    <Badge color={sensor.is_active ? 'success' : 'danger'} isLight>
                                                        {sensor.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </CardActions>
                                            </CardHeader>
                                            <CardBody>
                                                <div className='mb-2'>
                                                    <div className='small text-muted'>Type</div>
                                                    <div className='fw-bold'>{sensor.sensor_type || 'N/A'}</div>
                                                </div>
                                                <div className='mb-2'>
                                                    <div className='small text-muted'>MAC Address</div>
                                                    <div className='font-monospace small'>{sensor.mac_address || 'N/A'}</div>
                                                </div>
                                                {sensor.ip_address && (
                                                    <div className='mb-2'>
                                                        <div className='small text-muted'>IP Address</div>
                                                        <div className='font-monospace small'>{sensor.ip_address}</div>
                                                    </div>
                                                )}
                                                {sensor.location && (
                                                    <div className='mb-2'>
                                                        <div className='small text-muted'>Location</div>
                                                        <div>{sensor.location}</div>
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </div>
                                ))}

                                {nestedSubAreas.length === 0 && sensors.length === 0 && (
                                    <div className='col-12'>
                                        <Card>
                                            <CardBody className='text-center py-5'>
                                                <Icon icon='Inventory' className='display-1 text-muted mb-3' />
                                                <h4>No sub areas or sensors yet</h4>
                                                <p className='text-muted'>
                                                    Create sub areas to further organize this location or add sensors directly.
                                                </p>
                                                <div className='d-flex gap-2 justify-content-center mt-3'>
                                                    <Button
                                                        color='info'
                                                        icon='Add'
                                                        onClick={() => setIsSubAreaModalOpen(true)}
                                                    >
                                                        Create Sub Area
                                                    </Button>
                                                    <Button
                                                        color='primary'
                                                        icon='Sensors'
                                                        onClick={() => setIsModalOpen(true)}
                                                    >
                                                        Add Sensor
                                                    </Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                )}

                                {filteredSensors.length === 0 && sensors.length > 0 && (
                                    <div className='col-12'>
                                        <Card>
                                            <CardBody className='text-center py-4'>
                                                <Icon icon='SearchOff' className='fs-1 text-muted mb-2' />
                                                <p className='text-muted mb-0'>No sensors match your filters</p>
                                            </CardBody>
                                        </Card>
                                    </div>
                                )}

                                {sensors.length === 0 && nestedSubAreas.length > 0 && (
                                    <div className='col-12'>
                                        <Card>
                                            <CardBody className='text-center py-4'>
                                                <Icon icon='Sensors' className='fs-1 text-muted mb-2' />
                                                <p className='text-muted mb-0'>
                                                    No sensors directly assigned to this sub area.
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </Page>
            {/* Add Sensor Modal */}
            <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
                <ModalHeader setIsOpen={setIsModalOpen}>
                    <ModalTitle id='add-sensor-to-subzone-title'>Add Sensor to {currentSubArea?.name}</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='mb-3'>
                        <label className='form-label'>Select Available Sensor</label>
                        <select
                            className='form-select'
                            value={selectedSensorId}
                            onChange={(e) => setSelectedSensorId(e.target.value)}
                        >
                            <option value=''>Choose a sensor...</option>
                            {availableSensors.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} - {s.mac_address} ({s.sensor_type})
                                </option>
                            ))}
                        </select>
                        {availableSensors.length === 0 && (
                            <div className='text-muted small mt-2'>
                                No unassigned sensors available. All sensors are already assigned to sub areas.
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleAddSensor}
                        isDisable={!selectedSensorId || addSensorMutation.isPending}
                    >
                        {addSensorMutation.isPending && <Spinner isSmall inButton />}
                        Add to Sub Area
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Create Sub Area Modal */}
            <Modal isOpen={isSubAreaModalOpen} setIsOpen={setIsSubAreaModalOpen}>
                <ModalHeader setIsOpen={setIsSubAreaModalOpen}>
                    <ModalTitle id='create-nested-subarea-title'>
                        Create Sub Area in {currentSubArea?.name}
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <FormGroup label='Sub Area Name'>
                        <input
                            type='text'
                            className={`form-control ${error ? 'is-invalid' : ''}`}
                            placeholder='e.g. Room 101, Workstation Area, etc.'
                            value={subAreaName}
                            onChange={(e) => {
                                setSubAreaName(e.target.value);
                                setError('');
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleCreateSubArea();
                            }}
                        />
                        {error && <div className='invalid-feedback'>{error}</div>}
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color='light'
                        onClick={() => {
                            setIsSubAreaModalOpen(false);
                            setSubAreaName('');
                            setError('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleCreateSubArea}
                        isDisable={createSubAreaMutation.isPending}
                    >
                        {createSubAreaMutation.isPending && <Spinner isSmall inButton />}
                        Create Sub Area
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper>
    );
};

export default SensorGroupDetail;