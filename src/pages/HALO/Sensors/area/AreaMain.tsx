import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '@reactour/tour';
import Page from '../../../../layout/Page/Page';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Spinner from '../../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import { useAreas, useCreateArea, useAddSensorToSubArea, useSensors, useUsers, useDeleteArea, useUpdateArea } from '../../../../api/sensors.api';
import { Area, User } from '../../../../types/sensor';
import TreeCard from '../components/TreeCard';
import Swal from 'sweetalert2';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Label from '../../../../components/bootstrap/forms/Label';
import EditAreaModal from '../modals/EditAreaModal';

const AreaMain = () => {

    const navigate = useNavigate();
    const { setCurrentStep } = useTour();

    const { data: areas, isLoading } = useAreas();
    const { data: allSensors, isLoading: sensorsLoading } = useSensors();
    const { data: users } = useUsers();
    const createAreaMutation = useCreateArea();
    const addSensorMutation = useAddSensorToSubArea();
    const deleteAreaMutation = useDeleteArea();

    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
    const [selectedAreaId, setSelectedAreaId] = useState<string>('');
    const [selectedSensorId, setSelectedSensorId] = useState('');
    const [areaName, setAreaName] = useState('');
    const [areaType, setAreaType] = useState('building');
    const [areaPlan, setAreaPlan] = useState<File | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [offsetZ, setOffsetZ] = useState(0);
    const [scaleFactor, setScaleFactor] = useState(1.0);
    const [personInChargeIds, setPersonInChargeIds] = useState<number[]>([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get('startTour') === 'true') {
            setIsAreaModalOpen(true);
        }
    }, [location.search]);

    // Get main areas (areas with no parent)
    const mainAreas = useMemo(() => {
        return areas?.filter(area => !area.parent_id || area.parent_id === null) || [];
    }, [areas]);

    // Get available sensors (sensors with no area assigned)
    const availableSensors = useMemo(() => {
        return allSensors?.filter(sensor => !sensor.area && !sensor.area_name) || [];
    }, [allSensors]);

    // Filter main areas based on search term
    const filteredMainAreas = useMemo(() => {
        return mainAreas.filter(area =>
            area.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [mainAreas, searchTerm]);

    const handleCreateArea = () => {
        if (!areaName.trim()) {
            setError('Area name is required');
            return;
        }

        // Create FormData for file upload support
        const formData = new FormData();
        formData.append('name', areaName);
        formData.append('area_type', areaType);
        formData.append('offset_x', offsetX.toString());
        formData.append('offset_y', offsetY.toString());
        formData.append('offset_z', offsetZ.toString());
        formData.append('scale_factor', scaleFactor.toString());

        if (areaPlan) {
            formData.append('area_plan', areaPlan);
        }

        personInChargeIds.forEach(id => {
            formData.append('person_in_charge_ids', id.toString());
        });

        createAreaMutation.mutate(formData, {
            onSuccess: () => {
                setIsAreaModalOpen(false);
                setAreaName('');
                setAreaType('building');
                setAreaPlan(null);
                setOffsetX(0);
                setOffsetY(0);
                setOffsetZ(0);
                setScaleFactor(1.0);
                setPersonInChargeIds([]);
                setError('');

                // Trigger success modal if tour is active
                if (localStorage.getItem('showGuidedTour') === 'active') {
                    setIsSuccessModalOpen(true);
                }
            },
        });
    };

    const handleAddSensor = () => {
        if (!selectedSensorId || !selectedAreaId) return;
        addSensorMutation.mutate(
            { sensorId: selectedSensorId, subAreaId: selectedAreaId },
            {
                onSuccess: () => {
                    setIsSensorModalOpen(false);
                    setSelectedSensorId('');
                    setSelectedAreaId('');
                },
            }
        );
    };

    const handleCardClick = (areaId: number) => {
        navigate(`/halo/sensors/areas/${areaId}/subzones`);
    };

    const handleEditClick = (e: React.MouseEvent, area: Area) => {
        e.stopPropagation();
        setEditingArea(area);
        setIsEditModalOpen(true);
    };

    const handleDeleteArea = (e: React.MouseEvent, area: Area) => {
        e.stopPropagation();

        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete "${area.name}". This action cannot be undone and may affect sensors assigned to this area.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: document.documentElement.className.includes('dark') ? '#1a1a1a' : '#fff',
            color: document.documentElement.className.includes('dark') ? '#fff' : '#000',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAreaMutation.mutate(area.id);
            }
        });
    };

    if (isLoading || sensorsLoading) {
        return (
            <PageWrapper title='Sensor Areas'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title='Sensor Areas'>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='LocationCity' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>Sensor Coverage Areas</span>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        color={viewMode === 'grid' ? 'primary' : 'secondary'}
                        icon='GridView'
                        isLight={viewMode !== 'grid'}
                        className='me-2'
                        onClick={() => setViewMode('grid')}
                        title='Grid View'
                    >
                        Grid
                    </Button>
                    <Button
                        color={viewMode === 'tree' ? 'primary' : 'light'}
                        icon='AccountTree'
                        isLight={viewMode !== 'tree'}
                        className='me-2'
                        onClick={() => setViewMode('tree')}
                        title='Tree View'
                    >
                        Tree
                    </Button>
                    <Button
                        color='info'
                        icon='Add'
                        className='me-2'
                        onClick={() => setIsAreaModalOpen(true)}
                        data-tour='create-area-btn'
                    >
                        Create New Area
                    </Button>
                    <Button
                        color='primary'
                        icon='Sensors'
                        onClick={() => setIsSensorModalOpen(true)}
                    >
                        Add Sensor to Area
                    </Button>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>
                {viewMode === 'tree' ? (
                    /* Tree View */
                    <TreeCard
                        data={areas || []}
                        sensors={allSensors || []}
                        users={users || []}
                        onEditNode={(area) => {
                            setEditingArea(area);
                            setIsEditModalOpen(true);
                        }}
                        onDeleteNode={(area) => {
                            Swal.fire({
                                title: 'Are you sure?',
                                text: `You are about to delete "${area.name}".`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33',
                                cancelButtonColor: '#3085d6',
                                confirmButtonText: 'Yes, delete it!',
                                background: document.documentElement.className.includes('dark') ? '#1a1a1a' : '#fff',
                                color: document.documentElement.className.includes('dark') ? '#fff' : '#000',
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    deleteAreaMutation.mutate(area.id);
                                }
                            });
                        }}
                    />
                ) : (
                    /* Grid View */
                    <>
                        {/* Filter Section */}
                        <div className='row mb-4'>
                            <div className='col-12'>
                                <Card>
                                    <CardBody>
                                        <div className='row g-3 align-items-end'>
                                            <div className='col-md-9'>
                                                <FormGroup label='Search Areas'>
                                                    <div className='input-group'>
                                                        <span className='input-group-text'>
                                                            <Icon icon='Search' />
                                                        </span>
                                                        <Input
                                                            type='text'
                                                            placeholder='Search by area name...'
                                                            value={searchTerm}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                </FormGroup>
                                            </div>
                                            <div className='col-md-3'>
                                                <Button
                                                    // color='light'
                                                    className='w-100'
                                                    onClick={() => setSearchTerm('')}
                                                >
                                                    Clear Search
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {/* Main Areas Section */}
                        <div className='d-flex align-items-center justify-content-between mb-3'>
                            <div className='d-flex align-items-center'>
                                <Icon icon='LocationCity' className='me-2 fs-4' />
                                <span className='h5 mb-0 fw-bold'>All Areas</span>
                            </div>
                            <Badge color='info' isLight className='fs-6'>
                                {filteredMainAreas.length} of {mainAreas.length}
                            </Badge>
                        </div>

                        <div className='row g-4'>
                            {filteredMainAreas?.map(area => (
                                <div key={area.id} className='col-md-6 col-lg-4 col-xl-3'>
                                    <Card
                                        stretch
                                        className='cursor-pointer transition-shadow'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleCardClick(area.id)}
                                    >
                                        <CardHeader>
                                            <CardTitle>{area.name}</CardTitle>
                                            <CardActions>
                                                <Button
                                                    color='info'
                                                    isLight
                                                    icon='Edit'
                                                    size='sm'
                                                    onClick={(e: any) => handleEditClick(e, area)}
                                                    className='me-1'
                                                    title='Edit Area'
                                                />
                                                <Button
                                                    color='danger'
                                                    isLight
                                                    icon='Delete'
                                                    size='sm'
                                                    onClick={(e: any) => handleDeleteArea(e, area)}
                                                    className='me-1'
                                                    title='Delete Area'
                                                />
                                                <Badge color='success' isLight>
                                                    Active
                                                </Badge>
                                            </CardActions>
                                        </CardHeader>
                                        <CardBody>
                                            <div className='d-flex justify-content-between align-items-center mb-3'>
                                                <div className='text-muted'>
                                                    <Icon icon='Sensors' size='sm' className='me-1' />
                                                    Total Sensors
                                                </div>
                                                <div className='fw-bold fs-4'>{area.sensor_count || 0}</div>
                                            </div>

                                            <div className='border-top border-light pt-3 mt-3'>
                                                <div className='text-muted small mb-2'>
                                                    <Icon icon='AssignmentInd' size='sm' className='me-1' />
                                                    Persons in Charge
                                                </div>
                                                <div className='d-flex flex-wrap gap-1'>
                                                    {((area.person_in_charge && area.person_in_charge.length > 0) || (area.person_in_charge_ids && area.person_in_charge_ids.length > 0)) ? (
                                                        <>
                                                            {/* Prefer full objects if available */}
                                                            {area.person_in_charge && area.person_in_charge.length > 0 ? (
                                                                area.person_in_charge.map(person => (
                                                                    <Badge key={person.id} color='primary' isLight className='rounded-pill'>
                                                                        {person.first_name} {person.last_name}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                /* Fallback to ID-based lookup if only IDs are present */
                                                                area.person_in_charge_ids?.map(userId => {
                                                                    const user = users?.find(u => u.id === userId);
                                                                    return user ? (
                                                                        <Badge key={userId} color='primary' isLight className='rounded-pill'>
                                                                            {user.first_name} {user.last_name}
                                                                        </Badge>
                                                                    ) : null;
                                                                })
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className='text-muted small italic'>Unassigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            ))}

                            {filteredMainAreas?.length === 0 && searchTerm && (
                                <div className='col-12'>
                                    <Card>
                                        <CardBody className='text-center py-4'>
                                            <Icon icon='SearchOff' className='fs-1 text-muted mb-2' />
                                            <p className='text-muted mb-0'>No areas match your search</p>
                                        </CardBody>
                                    </Card>
                                </div>
                            )}

                            {mainAreas?.length === 0 && (
                                <div className='col-12'>
                                    <Card>
                                        <CardBody className='text-center py-5'>
                                            <Icon icon='LocationCity' className='display-1 text-muted mb-3' />
                                            <h4>No areas found</h4>
                                            <p className='text-muted'>Click "Create New Area" to add your first area.</p>
                                            <Button
                                                color='primary'
                                                icon='Add'
                                                className='mt-3'
                                                onClick={() => setIsAreaModalOpen(true)}
                                            >
                                                Create New Area
                                            </Button>
                                        </CardBody>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Page>

            {/* Create Area Modal */}
            <Modal isOpen={isAreaModalOpen} setIsOpen={setIsAreaModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsAreaModalOpen}>
                    <ModalTitle id='create-area-title'>Create New Area</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
                            <FormGroup label='Area Name'>
                                <input
                                    type='text'
                                    className={`form-control ${error ? 'is-invalid' : ''}`}
                                    placeholder='e.g. Building A, Ground Floor, etc.'
                                    value={areaName}
                                    onChange={(e) => {
                                        setAreaName(e.target.value);
                                        setError('');
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleCreateArea();
                                    }}
                                    data-tour='area-name-input'
                                />
                                {error && <div className='invalid-feedback'>{error}</div>}
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Area Type'>
                                <select
                                    className='form-select'
                                    value={areaType}
                                    onChange={(e) => setAreaType(e.target.value)}
                                    data-tour='area-type-select'
                                >
                                    <option value='building'>Building</option>
                                    <option value='floor'>Floor</option>
                                    <option value='room'>Room</option>
                                    <option value='zone'>Zone</option>
                                    <option value='others'>Others</option>
                                </select>
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Floor Plan Image (Optional)'>
                                <Input
                                    type='file'
                                    accept='image/*'
                                    onChange={(e: any) => setAreaPlan(e.target.files[0])}
                                />
                                {areaPlan && (
                                    <div className='mt-2 small text-success'>
                                        <Icon icon='CheckCircle' size='sm' className='me-1' />
                                        {areaPlan.name}
                                    </div>
                                )}
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Offset X'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={offsetX}
                                    onChange={(e: any) => setOffsetX(parseFloat(e.target.value) || 0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Offset Y'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={offsetY}
                                    onChange={(e: any) => setOffsetY(parseFloat(e.target.value) || 0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Offset Z'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={offsetZ}
                                    onChange={(e: any) => setOffsetZ(parseFloat(e.target.value) || 0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Scale Factor'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    min={0.1}
                                    value={scaleFactor}
                                    onChange={(e: any) => setScaleFactor(parseFloat(e.target.value) || 1.0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <Label>Assign Persons In Charge</Label>
                            <p className='text-muted small mb-2'>Assign one or more users to manage this area.</p>
                            <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users?.map((user: User) => (
                                    <div key={user.id} className='mb-2'>
                                        <Checks
                                            id={`user-${user.id}`}
                                            label={`${user.first_name} ${user.last_name} (@${user.username})`}
                                            checked={personInChargeIds.includes(user.id)}
                                            onChange={() => {
                                                setPersonInChargeIds(prev =>
                                                    prev.includes(user.id)
                                                        ? prev.filter(id => id !== user.id)
                                                        : [...prev, user.id]
                                                );
                                            }}
                                        />
                                    </div>
                                ))}
                                {(!users || users.length === 0) && (
                                    <div className='text-muted small'>No users found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color='light'
                        onClick={() => {
                            setIsAreaModalOpen(false);
                            setAreaName('');
                            setError('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleCreateArea}
                        isDisable={createAreaMutation.isPending}
                    >
                        {createAreaMutation.isPending && <Spinner isSmall inButton />}
                        Create Area
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Add Sensor Modal */}
            <Modal isOpen={isSensorModalOpen} setIsOpen={setIsSensorModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsSensorModalOpen}>
                    <ModalTitle id='add-sensor-to-area-title'>Add Sensor to Area</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='mb-3'>
                        <label className='form-label'>Select Area</label>
                        <select
                            className='form-select mb-3'
                            value={selectedAreaId}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                        >
                            <option value=''>Choose an area...</option>
                            {mainAreas.map(area => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='mb-3'>
                        <label className='form-label'>Select Available Sensor</label>
                        <select
                            className='form-select'
                            value={selectedSensorId}
                            onChange={(e) => setSelectedSensorId(e.target.value)}
                            disabled={!selectedAreaId}
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
                                No unassigned sensors available. All sensors are already assigned.
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => {
                        setIsSensorModalOpen(false);
                        setSelectedSensorId('');
                        setSelectedAreaId('');
                    }}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleAddSensor}
                        isDisable={!selectedSensorId || !selectedAreaId || addSensorMutation.isPending}
                    >
                        {addSensorMutation.isPending && <Spinner isSmall inButton />}
                        Add Sensor
                    </Button>
                </ModalFooter>
            </Modal>
            <EditAreaModal
                isOpen={isEditModalOpen}
                setIsOpen={setIsEditModalOpen}
                area={editingArea}
            />

            {/* Area Creation Success Modal (Tour only) */}
            <Modal isOpen={isSuccessModalOpen} setIsOpen={setIsSuccessModalOpen} isCentered size='lg'>
                <ModalHeader setIsOpen={setIsSuccessModalOpen}>
                    <ModalTitle id='area-success-title'>✨ Area Created Success!</ModalTitle>
                </ModalHeader>
                <ModalBody className='text-center py-4'>
                    <div className='display-4 text-success mb-3'>
                        <Icon icon='CheckCircle' />
                    </div>
                    <h4>Great job!</h4>
                    <p className='text-muted'>
                        Your first coverage area is now set up. The next step is to register and assign sensors to this area.
                    </p>
                </ModalBody>
                <ModalFooter className='flex-column'>
                    <Button
                        color='primary'
                        className='w-100 mb-2 py-2'
                        onClick={() => {
                            setIsSuccessModalOpen(false);
                            setCurrentStep(2); // Move to Sensor registration (Step 3)
                            navigate('/halo/sensors/list?startTour=true');
                        }}
                    >
                        Go to Sensor Registration <Icon icon='ArrowForward' className='ms-2' />
                    </Button>
                    <Button
                        color='light'
                        isLink
                        onClick={() => setIsSuccessModalOpen(false)}
                    >
                        I'll do it later
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper >
    );
};

export default AreaMain;