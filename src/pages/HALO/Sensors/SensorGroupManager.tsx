import React, { useState } from 'react';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb, { BreadcrumbItem } from '../../../components/bootstrap/Breadcrumb';
import Button from '../../../components/bootstrap/Button';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../components/bootstrap/Modal';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import { useSensorGroups, useCreateSensorGroup } from '../../../api/sensors.api';
import { SensorGroup } from '../../../types/sensor';

const SensorGroupManager = () => {
    const { data: groups, isLoading } = useSensorGroups();
    const createGroupMutation = useCreateSensorGroup();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [error, setError] = useState('');

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) {
            setError('Group name is required');
            return;
        }

        createGroupMutation.mutate(
            { name: newGroupName, description: newGroupDesc },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                    setError('');
                }
            }
        );
    };

    if (isLoading) {
        return (
            <PageWrapper title='Sensor Groups'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title='Sensor Groups Manager'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb>
                        <BreadcrumbItem to='/halo/dashboard'>Dashboard</BreadcrumbItem>
                        <BreadcrumbItem to='/halo/sensors/list'>Sensors</BreadcrumbItem>
                        <BreadcrumbItem to="/halo/sensors/groups" active>Groups</BreadcrumbItem>
                    </Breadcrumb>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        color='primary'
                        icon='Add'
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Create Group
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
                <div className='row g-4'>
                    {groups?.map((group: SensorGroup) => (
                        <div key={group.id} className='col-md-6 col-xl-4'>
                            <Card stretch>
                                <CardHeader>
                                    <div className='d-flex align-items-center'>
                                        <div className='flex-shrink-0'>
                                            <div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
                                                <div className='bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center text-primary'>
                                                    <Icon icon='Class' size='2x' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex-grow-1'>
                                            <CardTitle className='mb-1'>{group.name}</CardTitle>
                                            <div className='text-muted small'>{group.description}</div>
                                        </div>
                                    </div>
                                    <CardActions>
                                        <Badge
                                            color={group.status === 'Normal' ? 'success' : group.status === 'Warning' ? 'warning' : 'danger'}
                                            isLight
                                        >
                                            {group.status}
                                        </Badge>
                                    </CardActions>
                                </CardHeader>
                                <CardBody>
                                    <div className='row g-2'>
                                        <div className='col-6'>
                                            <div className='border rounded p-2 text-center'>
                                                <div className='h4 mb-0 text-primary'>{group.sensorCount || 0}</div>
                                                <div className='small text-muted'>Sensors</div>
                                            </div>
                                        </div>
                                        <div className='col-6'>
                                            <div className='border rounded p-2 text-center'>
                                                <div className='h4 mb-0 text-danger'>{group.activeAlerts || 0}</div>
                                                <div className='small text-muted'>Active Alerts</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-3 d-grid'>
                                        <Button color='light' icon='ArrowForward'>
                                            View Details
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    ))}

                    {groups?.length === 0 && (
                        <div className='col-12'>
                            <Card>
                                <CardBody className='text-center py-5'>
                                    <Icon icon='Class' className='display-1 text-muted mb-3' />
                                    <h4>No Sensor Groups Found</h4>
                                    <p className='text-muted'>
                                        Create a new group to categorize your sensors logically (e.g., "Ammonia Sensors", "Kitchen Staff").
                                    </p>
                                    <Button
                                        color='primary'
                                        icon='Add'
                                        onClick={() => setIsCreateModalOpen(true)}
                                    >
                                        Create First Group
                                    </Button>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </div>
            </Page>

            {/* Create Group Modal */}
            <Modal isOpen={isCreateModalOpen} setIsOpen={setIsCreateModalOpen}>
                <ModalHeader setIsOpen={setIsCreateModalOpen}>
                    <ModalTitle id='create-group-modal'>Create Sensor Group</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <FormGroup label='Group Name' className='mb-3'>
                        <Input
                            value={newGroupName}
                            onChange={(e: any) => {
                                setNewGroupName(e.target.value);
                                setError('');
                            }}
                            placeholder='e.g. Ammonia Detectors'
                            invalidFeedback={error}
                            isValid={false}
                            isTouched={!!error}
                        />
                    </FormGroup>
                    <FormGroup label='Description' className='mb-3'>
                        <Input
                            component='textarea'
                            value={newGroupDesc}
                            onChange={(e: any) => setNewGroupDesc(e.target.value)}
                            placeholder='Describe the purpose of this group...'
                        // rows={3}
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleCreateGroup}
                        isDisable={createGroupMutation.isPending}
                    >
                        {createGroupMutation.isPending && <Spinner isSmall inButton />}
                        Create Group
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper>
    );
};

export default SensorGroupManager;
