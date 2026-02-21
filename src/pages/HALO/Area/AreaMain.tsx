import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '@reactour/tour';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../components/bootstrap/Modal';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import { useAreas, useSensors, useUsers } from '../../../api/sensors.api';
import { Area } from '../../../types/sensor';


import AreaCard from './components/AreaCard';
import AddSensorModal from './modals/AddSensorModal';
import CreateAreaModal from './modals/CreateAreaModal';
import EditAreaModal from './modals/EditAreaModal';
import { useAreaActions } from './hooks/useAreaActions';

const AreaMain = () => {
    const navigate = useNavigate();
    const { setCurrentStep } = useTour();
    const location = useLocation();

    // ── Data ─────────────────────────────────────────────────────────────────
    // ── Data ─────────────────────────────────────────────────────────────────
    const { data: areas, isLoading } = useAreas();
    const { data: allSensors, isLoading: sensorsLoading } = useSensors();
    const { data: users } = useUsers();

    const [searchTerm, setSearchTerm] = useState('');

    // ── Actions hook ─────────────────────────────────────────────────────────
    const {
        isAreaModalOpen,
        setIsAreaModalOpen,
        isSuccessModalOpen,
        setIsSuccessModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        editingArea,
        isSensorModalOpen,
        setIsSensorModalOpen,
        handleCreateArea,
        handleOpenEditModal,
        handleDeleteArea,
        handleAddSensor,
        createAreaMutation,
        updateSensorMutation
    } = useAreaActions();

    // ── Tour trigger ─────────────────────────────────────────────────────────
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get('startTour') === 'true') {
            setIsAreaModalOpen(true);
        }
    }, [location.search]);

    // ── Derived data ──────────────────────────────────────────────────────────
    const mainAreas = useMemo(
        () => areas?.filter(area => !area.parent_id || area.parent_id === null) || [],
        [areas],
    );

    const availableSensors = useMemo(
        () => allSensors?.filter(sensor => !sensor.area && !sensor.area_name) || [],
        [allSensors],
    );

    const filteredMainAreas = useMemo(
        () => mainAreas.filter(area => area.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [mainAreas, searchTerm],
    );

    const handleCardClick = (areaId: number) => navigate(`/halo/sensors/areas/${areaId}/subzones`);

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
                        color='info'
                        icon='Add'
                        className='btn-neumorphic'
                        onClick={() => setIsAreaModalOpen(true)}
                        data-tour='create-area-btn'
                    >
                        Create New Area
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
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
                                        <Button className='w-100' onClick={() => setSearchTerm('')}>
                                            Clear Search
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Header */}
                <div className='d-flex align-items-center justify-content-between mb-3'>
                    <div className='d-flex align-items-center'>
                        <Icon icon='LocationCity' className='me-2 fs-4' />
                        <span className='h5 mb-0 fw-bold'>All Areas</span>
                    </div>
                    <Badge color='info' isLight className='fs-6'>
                        {filteredMainAreas.length} of {mainAreas.length}
                    </Badge>
                </div>

                {/* Grid */}
                <div className='row g-4'>
                    {filteredMainAreas?.map(area => (
                        <div key={area.id} className='col-md-6 col-lg-4 col-xl-3'>
                            <AreaCard
                                area={area}
                                users={users}
                                onClick={handleCardClick}
                                onEdit={handleOpenEditModal}
                                onDelete={(e, a) => handleDeleteArea(a, e)}
                            />
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
            </Page>

            {/* Modals */}
            <CreateAreaModal
                isOpen={isAreaModalOpen}
                setIsOpen={setIsAreaModalOpen}
                users={users}
                isPending={createAreaMutation.isPending}
                onSubmit={handleCreateArea}
            />

            <AddSensorModal
                isOpen={isSensorModalOpen}
                setIsOpen={setIsSensorModalOpen}
                simpleMode
                mainAreas={mainAreas}
                availableSensors={availableSensors}
                isPending={updateSensorMutation.isPending}
                onSubmit={handleAddSensor}
            />

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
                            setCurrentStep(2);
                            navigate('/halo/sensors/list?startTour=true');
                        }}
                    >
                        Go to Sensor Registration <Icon icon='ArrowForward' className='ms-2' />
                    </Button>
                    <Button color='light' isLink onClick={() => setIsSuccessModalOpen(false)}>
                        I'll do it later
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper>
    );
};

export default AreaMain;