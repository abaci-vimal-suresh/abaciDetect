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
import { useAreas, useAddSensorToSubArea, useSensors, useCreateSubArea, useUpdateSensor } from '../../../api/sensors.api';
import { useQueryClient } from '@tanstack/react-query';
import { Area, SensorPlacementPayload } from '../../../types/sensor';
import Swal from 'sweetalert2';
import { buildAreaBreadcrumbPath } from '../utils/navigation.utils';
import { filterSensors, getSensorsByArea, getAvailableSensors } from '../utils/sensorData.utils';

const SensorGroupDetail = () => {
    const { areaId, subzoneId } = useParams<{ areaId: string; subzoneId: string }>();
    const navigate = useNavigate();
    const { data: areas, isLoading: areasLoading } = useAreas();
    const { data: allSensors, isLoading: sensorsLoading } = useSensors();
    const addSensorMutation = useAddSensorToSubArea();
    const createSubAreaMutation = useCreateSubArea();
    const updateSensorMutation = useUpdateSensor();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubAreaModalOpen, setIsSubAreaModalOpen] = useState(false);
    const [selectedSensorId, setSelectedSensorId] = useState('');
    const [subAreaName, setSubAreaName] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Find target subarea directly from the flat list (since the API returns it at top level too)
    const currentSubArea = useMemo(() => {
        return areas?.find(sub => sub.id === Number(subzoneId));
    }, [areas, subzoneId]);

    // Find the main area for context
    const currentArea = useMemo(() => {
        return areas?.find(area => area.id === Number(areaId));
    }, [areas, areaId]);

    // Get nested sub-areas (sub-areas of this sub-area)
    // Since subareas is now an array of IDs, we need to map them to actual area objects
    const nestedSubAreas = useMemo(() => {
        const subareaIds = currentSubArea?.subareas || [];
        if (!areas || subareaIds.length === 0) return [];

        // Map IDs to actual area objects from the flat areas list
        return subareaIds
            .map((id: number) => areas.find(area => area.id === id))
            .filter((area): area is Area => area !== undefined);
    }, [currentSubArea, areas]);

    // Build breadcrumb path from main area to current subarea
    const breadcrumbPath = useMemo(() => {
        return buildAreaBreadcrumbPath(currentSubArea, areas, areaId || '');
    }, [currentSubArea, areas, areaId]);

    // Get sensors that belong to this area
    const areaSensors = useMemo(() => {
        return getSensorsByArea(allSensors || [], areaId, currentArea?.name, areas);
    }, [allSensors, areaId, currentArea, areas]);

    // Get sensors for this area
    const sensors = useMemo(() => {
        const targetId = subzoneId || areaId;
        const rawSensors = getSensorsByArea(allSensors || [], targetId, currentSubArea?.name, areas);

        return rawSensors.map(s => ({
            ...s,
            // Support both old and new fields for compatibility with FloorPlanCanvas
            x_coordinate: s.x_coordinate ?? s.x_val,
            y_coordinate: s.y_coordinate ?? s.y_val,
        }));
    }, [allSensors, subzoneId, areaId, currentSubArea, areas]);

    // Get available sensors (sensors with no area assigned)
    const availableSensors = useMemo(() => {
        return getAvailableSensors(allSensors || []);
    }, [allSensors]);

    // Filter nested sub areas based on search term
    const filteredNestedSubAreas = useMemo(() => {
        if (!nestedSubAreas) return [];
        return nestedSubAreas.filter(subArea =>
            (subArea.name || '').toLowerCase().includes(searchTerm.toLowerCase())
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

    const handleUnassignSensor = (e: React.MouseEvent, sensor: any) => {
        e.stopPropagation();

        Swal.fire({
            title: 'Unassign Sensor?',
            text: `Are you sure you want to remove "${sensor.name}" from this sub-area?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, unassign',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'swal-neumorphic-popup',
                confirmButton: 'btn btn-neumorphic text-danger mx-2',
                cancelButton: 'btn btn-neumorphic mx-2'
            },
            buttonsStyling: false,
            background: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#1a1a1a' : '#e0e5ec',
            color: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#fff' : '#4d4d4d',
        }).then((result) => {
            if (result.isConfirmed) {
                updateSensorMutation.mutate({
                    sensorId: sensor.id,
                    data: { area: null }
                });
            }
        });
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
                    <div className='d-flex gap-3'>
                        <Button
                            isNeumorphic
                            className='text-info'
                            icon='Add'
                            onClick={() => setIsSubAreaModalOpen(true)}
                        >
                            Create Sub Area
                        </Button>
                        <Button
                            isNeumorphic
                            className='text-primary'
                            icon='Add'
                            onClick={() => setIsModalOpen(true)}
                        >
                            Add Sensor
                        </Button>
                    </div>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>
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
                                            <Button
                                                color='danger'
                                                isLight
                                                icon='LinkOff'
                                                size='sm'
                                                onClick={(e: any) => handleUnassignSensor(e, sensor)}
                                                className='me-2'
                                                title='Remove from Area'
                                            />
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
        </PageWrapper >
    );
};

export default SensorGroupDetail;
