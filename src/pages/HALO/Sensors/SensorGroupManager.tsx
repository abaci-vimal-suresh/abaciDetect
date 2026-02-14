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
import { useSensorGroups, useCreateSensorGroup, useUpdateSensorGroup, useDeleteSensorGroup, useSensors } from '../../../api/sensors.api';
import Checks from '../../../components/bootstrap/forms/Checks';
import { SensorGroup } from '../../../types/sensor';
import ManageSensorGroupMembersModal from './modals/ManageSensorGroupMembersModal';

const SensorGroupManager = () => {
    const { data: groups, isLoading } = useSensorGroups();
    const { data: allSensors } = useSensors({});
    const createGroupMutation = useCreateSensorGroup();
    const updateGroupMutation = useUpdateSensorGroup();
    const deleteGroupMutation = useDeleteSensorGroup();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<SensorGroup | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);
    const [error, setError] = useState('');

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) {
            setError('Group name is required');
            return;
        }

        createGroupMutation.mutate(
            {
                name: newGroupName,
                description: newGroupDesc,
                sensor_ids: selectedSensorIds
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                    setSelectedSensorIds([]);
                    setError('');
                }
            }
        );
    };


    const handleDeleteClick = (group: SensorGroup) => {
        setSelectedGroup(group);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedGroup) return;

        deleteGroupMutation.mutate(selectedGroup.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedGroup(null);
            }
        });
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
                                        {group.status && (
                                            <Badge
                                                color={group.status === 'Normal' ? 'success' : group.status === 'Warning' ? 'warning' : 'danger'}
                                                isLight
                                            >
                                                {group.status}
                                            </Badge>
                                        )}
                                    </CardActions>
                                </CardHeader>
                                <CardBody>
                                    <div className='row g-2'>
                                        <div className='col-12'>
                                            <div className='border rounded p-2 text-center'>
                                                <div className='h4 mb-0 text-primary'>{group.sensor_count || 0}</div>
                                                <div className='small text-muted'>Sensors</div>
                                            </div>
                                        </div>

                                    </div>
                                    <div className='d-flex gap-3'>
                                        <Button
                                            color='info'
                                            isLight
                                            icon='Edit'
                                            className='btn-neumorphic flex-fill text-info'
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                setSelectedGroup(group);
                                                setIsManageModalOpen(true);
                                            }}
                                        >
                                            Edit Group
                                        </Button>
                                        <Button
                                            color='danger'
                                            isLight
                                            icon='Delete'
                                            className='btn-neumorphic flex-fill text-danger'
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                handleDeleteClick(group);
                                            }}
                                        >
                                            Delete Group
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

                    <FormGroup label='Select Sensors' className='mb-0'>
                        <div className='border rounded p-3 ' style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            <div className='d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom'>
                                <div className='small fw-bold text-muted'>
                                    {selectedSensorIds.length} sensors selected
                                </div>
                                <Button
                                    size='sm'
                                    color='link'
                                    className='p-0'
                                    onClick={() => {
                                        if (selectedSensorIds.length === allSensors?.length) {
                                            setSelectedSensorIds([]);
                                        } else {
                                            setSelectedSensorIds(allSensors?.map(s => String(s.id)) || []);
                                        }
                                    }}
                                >
                                    {selectedSensorIds.length === allSensors?.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            {allSensors?.map(sensor => (
                                <div key={sensor.id} className='mb-2'>
                                    <Checks
                                        id={`sensor-${sensor.id}`}
                                        label={`${sensor.name} (${sensor.mac_address || sensor.macAddress})`}
                                        value={sensor.id}
                                        checked={selectedSensorIds.includes(String(sensor.id))}
                                        onChange={(e: any) => {
                                            const { checked, value } = e.target;
                                            const valStr = String(value);
                                            if (checked) {
                                                setSelectedSensorIds(prev =>
                                                    prev.includes(valStr) ? prev : [...prev, valStr]
                                                );
                                            } else {
                                                setSelectedSensorIds(prev =>
                                                    prev.filter(id => String(id) !== valStr)
                                                );
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                            {(!allSensors || allSensors.length === 0) && (
                                <div className='text-center text-muted small py-3'>
                                    No sensors available to add
                                </div>
                            )}
                        </div>
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


            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen}>
                <ModalHeader setIsOpen={setIsDeleteModalOpen}>
                    <ModalTitle id='delete-group-modal'>Delete Sensor Group</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='alert alert-danger d-flex align-items-center'>
                        <Icon icon='Warning' className='me-2' size='2x' />
                        <div>
                            <strong>Warning:</strong> This action cannot be undone.
                        </div>
                    </div>
                    <p>
                        Are you sure you want to delete the sensor group <strong>"{selectedGroup?.name}"</strong>?
                    </p>
                    {selectedGroup && selectedGroup.sensor_count > 0 && (
                        <p className='text-muted small'>
                            Note: This group contains {selectedGroup.sensor_count} sensor{selectedGroup.sensor_count !== 1 ? 's' : ''}.
                            The sensors will not be deleted, only the group.
                        </p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedGroup(null);
                    }}>
                        Cancel
                    </Button>
                    <Button
                        color='danger'
                        onClick={handleDeleteConfirm}
                        isDisable={deleteGroupMutation.isPending}
                    >
                        {deleteGroupMutation.isPending && <Spinner isSmall inButton />}
                        Delete Group
                    </Button>
                </ModalFooter>
            </Modal>
            {/* Manage Members Modal */}
            <ManageSensorGroupMembersModal
                isOpen={isManageModalOpen}
                setIsOpen={setIsManageModalOpen}
                groupId={selectedGroup?.id ? Number(selectedGroup.id) : null}
            />
        </PageWrapper>
    );
};

export default SensorGroupManager;
