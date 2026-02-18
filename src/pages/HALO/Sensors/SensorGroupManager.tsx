import React, { useContext, useState, useMemo } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb, { BreadcrumbItem } from '../../../components/bootstrap/Breadcrumb';
import Button from '../../../components/bootstrap/Button';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Icon from '../../../components/icon/Icon';
import Spinner from '../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../components/bootstrap/Modal';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import { useSensorGroups, useCreateSensorGroup, useDeleteSensorGroup, useSensors } from '../../../api/sensors.api';
import { SensorGroup } from '../../../types/sensor';
import ManageSensorGroupMembersModal from './modals/ManageSensorGroupMembersModal';
import ThemeContext from '../../../contexts/themeContext';
import useTablestyle from '../../../hooks/useTablestyles';
import useColumnHiding from '../../../hooks/useColumnHiding';
import MultiSelectDropdown, {
    Option as MultiSelectOption,
} from '../../../components/CustomComponent/Select/MultiSelectDropdown';
import { updateHiddenColumnsInLocalStorage } from '../../../helpers/functions';

const SensorGroupManager = () => {
    const { data: groups, isLoading } = useSensorGroups();
    const { data: allSensors } = useSensors({});
    const createGroupMutation = useCreateSensorGroup();
    const deleteGroupMutation = useDeleteSensorGroup();
    const { darkModeStatus } = useContext(ThemeContext);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<SensorGroup | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);
    const [error, setError] = useState('');

    const groupList: SensorGroup[] = Array.isArray(groups) ? groups : [];

    const sensorOptions: MultiSelectOption[] = useMemo(
        () =>
            (allSensors || []).map(sensor => ({
                value: String(sensor.id),
                label: `${sensor.name} (${sensor.mac_address || sensor.macAddress}) - ${sensor.sensor_type}`,
            })),
        [allSensors],
    );

    const staticColumns = [
        {
            title: 'Group Name',
            field: 'name',
            render: (rowData: any) => (
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                            width: 38,
                            height: 38,
                            background: darkModeStatus
                                ? 'rgba(77,105,250,0.2)'
                                : 'rgba(77,105,250,0.15)',
                            fontWeight: 600,
                        }}
                    >
                        <Icon icon="Class" size="lg" />
                    </div>
                    <div>
                        <div className="fw-bold">{rowData.name}</div>
                        {rowData.description && (
                            <div className="small text-muted">{rowData.description}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Sensors',
            field: 'sensor_count',
            render: (rowData: any) => (
                <span
                    className="px-3 py-1 rounded-pill"
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: darkModeStatus
                            ? 'rgba(70,188,170,0.2)'
                            : 'rgba(70,188,170,0.15)',
                        color: '#2d8478',
                    }}
                >
                    {rowData.sensor_count || 0}{' '}
                    {(rowData.sensor_count || 0) === 1 ? 'sensor' : 'sensors'}
                </span>
            ),
        },
        {
            title: 'Status',
            field: 'status',
            render: (rowData: any) => {
                const status = rowData.status || 'Normal';
                const isWarning = String(status).toLowerCase() === 'warning';
                const isCritical = String(status).toLowerCase() === 'critical';

                const background = isCritical
                    ? darkModeStatus ? 'rgba(243,84,33,0.2)' : 'rgba(243,84,33,0.15)'
                    : isWarning
                        ? darkModeStatus ? 'rgba(255,207,82,0.2)' : 'rgba(255,207,82,0.15)'
                        : darkModeStatus ? 'rgba(70,188,170,0.2)' : 'rgba(70,188,170,0.15)';

                const color = isCritical ? '#f35421' : isWarning ? '#ffcf52' : '#2d8478';

                return (
                    <span
                        className="px-3 py-1 rounded-pill"
                        style={{ fontSize: '0.75rem', fontWeight: 500, background, color }}
                    >
                        {status}
                    </span>
                );
            },
        },
        {
            title: 'Created',
            field: 'created_at',
            render: (rowData: any) => (
                <div className="small">
                    {rowData.created_at
                        ? new Date(rowData.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                          })
                        : '-'}
                </div>
            ),
        },
    ];

    const actionButtons = [
        {
            title: 'Actions',
            field: 'actions',
            sorting: false,
            filtering: false,
            render: (rowData: any) => (
                <div className="d-flex gap-2">
                    <Button
                        color="info"
                        isLight
                        icon="Visibility"
                        title="View"
                        onClick={() => {
                            setSelectedGroup(rowData);
                            setIsViewModalOpen(true);
                        }}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
                    />
                    <Button
                        color="primary"
                        isLight
                        icon="Edit"
                        title="Edit"
                        onClick={() => {
                            setSelectedGroup(rowData);
                            setIsManageModalOpen(true);
                        }}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
                    />
                    <Button
                        color="danger"
                        isLight
                        icon="Delete"
                        title="Delete"
                        onClick={() => {
                            setSelectedGroup(rowData);
                            setIsDeleteModalOpen(true);
                        }}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
                    />
                </div>
            ),
        },
    ];

    const columns = useColumnHiding({
        oldValue: staticColumns,
        hiddenColumnArray: JSON.parse(localStorage.getItem('sensorGroupsColumns') || '[]'),
        buttonArray: actionButtons,
    });

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) {
            setError('Group name is required');
            return;
        }
        createGroupMutation.mutate(
            { name: newGroupName, description: newGroupDesc, sensor_ids: selectedSensorIds },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setNewGroupName('');
                    setNewGroupDesc('');
                    setSelectedSensorIds([]);
                    setError('');
                },
            },
        );
    };

    const handleDeleteConfirm = () => {
        if (!selectedGroup) return;
        deleteGroupMutation.mutate(selectedGroup.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedGroup(null);
            },
        });
    };

    return (
        <PageWrapper title='Sensor Groups Manager'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb>
                        <BreadcrumbItem to='/halo/dashboard'>Dashboard</BreadcrumbItem>
                        <BreadcrumbItem to='/halo/sensors/list'>Sensors</BreadcrumbItem>
                        <BreadcrumbItem to='/halo/sensors/groups' active>Groups</BreadcrumbItem>
                    </Breadcrumb>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button color='primary' icon='Add' onClick={() => setIsCreateModalOpen(true)}>
                        Create Group
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
                <Card stretch className='border-0'>
                    <CardBody className='p-0'>
                        <ThemeProvider theme={theme}>
                            <MaterialTable
                                title=' '
                                columns={columns}
                                data={groupList}
                                isLoading={isLoading}
                                onChangeColumnHidden={(column, hidden) =>
                                    updateHiddenColumnsInLocalStorage(
                                        column,
                                        hidden,
                                        'sensorGroupsColumns',
                                    )
                                }
                                options={{
                                    headerStyle: headerStyles(),
                                    rowStyle: rowStyles(),
                                    search: true,
                                    pageSize: 10,
                                    columnsButton: true,
                                    actionsColumnIndex: -1,
                                    searchFieldStyle: searchFieldStyle(),
                                }}
                            />
                        </ThemeProvider>
                    </CardBody>
                </Card>
            </Page>

            {/* ── Create Modal ── */}
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
                        />
                    </FormGroup>
                    <FormGroup label='Select Sensors' className='mb-0'>
                        {sensorOptions.length > 0 ? (
                            <MultiSelectDropdown
                                options={sensorOptions}
                                value={selectedSensorIds}
                                onChange={setSelectedSensorIds}
                                placeholder='Select sensors for this group'
                                searchPlaceholder='Search sensors...'
                                selectAll
                                clearable
                            />
                        ) : (
                            <div className='text-center text-muted small py-3 border rounded'>
                                No sensors available to add
                            </div>
                        )}
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

            {/* ── View Modal — matches UserGroupsPage style ── */}
            <Modal isOpen={isViewModalOpen} setIsOpen={setIsViewModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsViewModalOpen}>
                    <ModalTitle id='viewSensorGroupModal'>Sensor Group Details</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <h5 className='mb-1'>{selectedGroup?.name}</h5>
                    {selectedGroup?.description && (
                        <p className='text-muted mb-3'>{selectedGroup.description}</p>
                    )}
                    <div className='d-flex flex-wrap gap-3 mb-3'>
                        <div className='small text-muted'>
                            <strong>Sensors:</strong> {selectedGroup?.sensor_count ?? 0}
                        </div>
                        <div className='small text-muted'>
                            <strong>Status:</strong> {selectedGroup?.status || 'Normal'}
                        </div>
                        {selectedGroup?.created_at && (
                            <div className='small text-muted'>
                                <strong>Created:</strong>{' '}
                                {new Date(selectedGroup.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </div>
                        )}
                    </div>

                    {selectedGroup?.sensor_list && selectedGroup.sensor_list.length > 0 ? (
                        <div
                            className='border rounded'
                            style={{ maxHeight: 260, overflowY: 'auto' }}
                        >
                            {selectedGroup.sensor_list.map((sensor: any) => (
                                <div
                                    key={sensor.id}
                                    className='d-flex align-items-center justify-content-between px-3 py-2 border-bottom'
                                >
                                    <div className='d-flex align-items-center gap-2'>
                                        <div
                                            className='rounded-circle d-flex align-items-center justify-content-center'
                                            style={{
                                                width: 32,
                                                height: 32,
                                                background: darkModeStatus
                                                    ? 'rgba(77,105,250,0.25)'
                                                    : 'rgba(77,105,250,0.15)',
                                            }}
                                        >
                                            <Icon icon='Sensors' size='sm' />
                                        </div>
                                        <div>
                                            <div className='fw-semibold small'>{sensor.name}</div>
                                            <div className='text-muted small'>
                                                {sensor.mac_address || sensor.macAddress || '—'}
                                                {sensor.sensor_type ? ` · ${sensor.sensor_type}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='d-flex flex-column align-items-end gap-1'>
                                        {sensor.sensor_type && (
                                            <span
                                                className='px-2 py-1 rounded-pill small'
                                                style={{
                                                    fontWeight: 500,
                                                    background: darkModeStatus
                                                        ? 'rgba(77,105,250,0.2)'
                                                        : 'rgba(77,105,250,0.12)',
                                                    color: '#4d69fa',
                                                }}
                                            >
                                                {sensor.sensor_type}
                                            </span>
                                        )}
                                        <span
                                            className='px-2 py-0 rounded-pill small'
                                            style={{
                                                background: sensor.is_active
                                                    ? 'rgba(70,188,170,0.15)'
                                                    : 'rgba(243,84,33,0.15)',
                                                color: sensor.is_active ? '#2d8478' : '#f35421',
                                            }}
                                        >
                                            {sensor.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='text-muted small'>No sensors in this group yet.</div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color='light'
                        onClick={() => {
                            setIsViewModalOpen(false);
                            setSelectedGroup(null);
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        color='primary'
                        onClick={() => {
                            if (selectedGroup) {
                                setIsViewModalOpen(false);
                                setIsManageModalOpen(true);
                            }
                        }}
                    >
                        Manage Sensors
                    </Button>
                </ModalFooter>
            </Modal>

            {/* ── Delete Modal ── */}
            <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsDeleteModalOpen}>
                    <ModalTitle id='delete-group-modal'>Delete Sensor Group</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='alert alert-danger d-flex align-items-center mb-3'>
                        <Icon icon='Warning' className='me-2' size='2x' />
                        <div>
                            <strong>Warning:</strong> This action cannot be undone.
                        </div>
                    </div>
                    <p>
                        Are you sure you want to delete the sensor group{' '}
                        <strong>"{selectedGroup?.name}"</strong>?
                    </p>
                    {selectedGroup && (selectedGroup.sensor_count ?? 0) > 0 && (
                        <p className='text-muted small'>
                            Note: This group contains {selectedGroup.sensor_count} sensor
                            {selectedGroup.sensor_count !== 1 ? 's' : ''}. The sensors will not be
                            deleted, only the group.
                        </p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color='light'
                        onClick={() => {
                            setIsDeleteModalOpen(false);
                            setSelectedGroup(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color='danger'
                        onClick={handleDeleteConfirm}
                        isDisable={deleteGroupMutation.isPending}
                    >
                        {deleteGroupMutation.isPending && <Spinner isSmall inButton isGrow />}
                        Delete Group
                    </Button>
                </ModalFooter>
            </Modal>

            {/* ── Manage Members Modal ── */}
            <ManageSensorGroupMembersModal
                isOpen={isManageModalOpen}
                setIsOpen={setIsManageModalOpen}
                groupId={selectedGroup?.id ? Number(selectedGroup.id) : null}
            />
        </PageWrapper>
    );
};

export default SensorGroupManager;