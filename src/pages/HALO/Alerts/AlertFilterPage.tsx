import * as React from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Badge from '../../../components/bootstrap/Badge';
import Icon from '../../../components/icon/Icon';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/useTablestyles';
import useDarkMode from '../../../hooks/useDarkMode';
import { format } from 'date-fns';
import Label from '../../../components/bootstrap/forms/Label';
import {
    useAlertFilters,
    useCreateAlertFilter,
    useUpdateAlertFilter,
    useDeleteAlertFilter,
} from '../../../api/sensors.api';
import AlertFilterForm from './components/AlertFilterForm';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';
import { AlertFilter, ALERT_TYPE_CHOICES, ALERT_SOURCE_CHOICES, Action } from '../../../types/sensor';
import Button from '../../../components/bootstrap/Button';

const AlertFilterPage = () => {
    const [isManagementFormOpen, setIsManagementFormOpen] = React.useState(false);
    const [editingFilter, setEditingFilter] = React.useState<Partial<AlertFilter> | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [selectedDetailFilter, setSelectedDetailFilter] = React.useState<AlertFilter | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [filterToDelete, setFilterToDelete] = React.useState<AlertFilter | null>(null);

    const { theme, headerStyle, rowStyle } = useTablestyle();
    const { themeStatus } = useDarkMode();

    const { data: alertFilters } = useAlertFilters();
    const createFilterMutation = useCreateAlertFilter();
    const updateFilterMutation = useUpdateAlertFilter();
    const deleteFilterMutation = useDeleteAlertFilter();

    const handleSaveFilter = async (data: Partial<AlertFilter>) => {
        const payload: any = { ...data };

        delete payload.area_list;
        delete payload.sensor_groups;
        delete payload.actions;
        delete payload.tableData;
        delete payload.created_at;
        delete payload.updated_at;

        if (data.area_list && (!payload.area_ids || payload.area_ids.length === 0)) {
            payload.area_ids = data.area_list.map(a => a.id);
        }
        if (data.sensor_groups && (!payload.sensor_group_ids || payload.sensor_group_ids.length === 0)) {
            payload.sensor_group_ids = data.sensor_groups.map(g => g.id);
        }
        if (data.actions && (!payload.action_ids || payload.action_ids.length === 0)) {
            payload.action_ids = data.actions.map(a => a.id);
        }

        if (payload.id) {
            await updateFilterMutation.mutateAsync({ id: payload.id, data: payload });
        } else {
            await createFilterMutation.mutateAsync(payload);
        }
        setIsManagementFormOpen(false);
        setEditingFilter(null);
    };

    const handleOpenCreate = () => {
        setEditingFilter(null);
        setIsManagementFormOpen(true);
    };

    const handleOpenEdit = (rowData: any) => {
        setEditingFilter(rowData);
        setIsManagementFormOpen(true);
    };

    const handleClose = () => {
        setIsManagementFormOpen(false);
        setEditingFilter(null);
    };

    return (
        <PageWrapper>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon="FilterAlt" className="me-2 fs-2" />
                    <span className="fw-bold fs-3">Alert Filters</span>
                </SubHeaderLeft>
            </SubHeader>

            <Page container="fluid">
                <div className="row">
                    <div className="col-12">

                        <ThemeProvider theme={theme}>
                            <MaterialTable
                                title="Your Smart Rules"
                                columns={[
                                    {
                                        title: 'Rule Info',
                                        render: (row: AlertFilter) => (
                                            <div>
                                                <div className="fw-bold">{row.name}</div>
                                                <div className="small text-muted text-truncate" style={{ maxWidth: '250px' }}>
                                                    {row.description}
                                                </div>
                                            </div>
                                        )
                                    },
                                    {
                                        title: 'Alert Types',
                                        render: (row: AlertFilter) => {
                                            const max = 2;
                                            const types = row.alert_types || [];
                                            const visible = types.slice(0, max);
                                            const extra = types.length - visible.length;
                                            return (
                                                <div className="d-flex flex-wrap align-items-center gap-1" style={{ maxWidth: 220 }}>
                                                    {visible.map((t: string) => (
                                                        <Badge key={t} color="info" isLight className="text-truncate" style={{ fontSize: '0.75rem' }}>
                                                            {ALERT_TYPE_CHOICES.find(c => c.value === t)?.label || t}
                                                        </Badge>
                                                    ))}
                                                    {extra > 0 && (
                                                        <small className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
                                                            +{extra}
                                                        </small>
                                                    )}
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Scope',
                                        render: (row: AlertFilter) => (
                                            <div>
                                                <div className="small">
                                                    <span className="text-muted small text-uppercase fw-bold me-1" style={{ fontSize: '0.7rem' }}>Areas:</span>
                                                    <span className="fw-bold" style={{ fontSize: '0.75rem' }}>{row.area_list?.map(a => a.name).join(', ') || 'Global'}</span>
                                                </div>
                                                {row.sensor_groups && row.sensor_groups.length > 0 && (
                                                    <div className="small mt-1">
                                                        <span className="text-muted small text-uppercase fw-bold me-1" style={{ fontSize: '0.7rem' }}>Groups:</span>
                                                        <span className="fw-bold" style={{ fontSize: '0.75rem' }}>{row.sensor_groups.map(g => g.name).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    },
                                    {
                                        title: 'Status',
                                        field: 'is_active',
                                        render: (row: any) => (
                                            <Badge color={row.is_active ? 'success' : 'warning'} isLight style={{ fontSize: '0.75rem' }}>
                                                {row.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </Badge>
                                        )
                                    },
                                    {
                                        title: 'Actions',
                                        field: 'actions',
                                        sorting: false,
                                        filtering: false,
                                        render: (rowData: AlertFilter) => (
                                            <div className='d-flex gap-2 justify-content-start align-items-center'>
                                                <Button
                                                    color='primary'
                                                    isLight
                                                    icon='Visibility'
                                                    onClick={() => {
                                                        setSelectedDetailFilter(rowData);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                    title='View Details'
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        padding: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: themeStatus === 'dark' ? 'rgba(77, 105, 250, 0.15)' : 'rgba(77, 105, 250, 0.12)',
                                                        border: themeStatus === 'dark' ? 'none' : '1px solid rgba(77, 105, 250, 0.3)',
                                                        color: themeStatus === 'dark' ? '#4d69fa' : '#3650d4',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e: any) => {
                                                        e.currentTarget.style.background = themeStatus === 'dark' ? 'rgba(77, 105, 250, 0.25)' : 'rgba(77, 105, 250, 0.2)';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e: any) => {
                                                        e.currentTarget.style.background = themeStatus === 'dark' ? 'rgba(77, 105, 250, 0.15)' : 'rgba(77, 105, 250, 0.12)';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                />
                                                <Button
                                                    color='info'
                                                    isLight
                                                    icon='Edit'
                                                    onClick={() => handleOpenEdit(rowData)}
                                                    title='Edit'
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        padding: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: themeStatus === 'dark' ? 'rgba(13, 202, 240, 0.15)' : 'rgba(13, 202, 240, 0.12)',
                                                        border: themeStatus === 'dark' ? 'none' : '1px solid rgba(13, 202, 240, 0.3)',
                                                        color: themeStatus === 'dark' ? '#0dcaf0' : '#0aa2c0',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e: any) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e: any) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                />
                                                <Button
                                                    color='danger'
                                                    isLight
                                                    icon='Delete'
                                                    onClick={() => {
                                                        setFilterToDelete(rowData);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    title='Delete'
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        padding: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: themeStatus === 'dark' ? 'rgba(239, 79, 79, 0.15)' : 'rgba(239, 79, 79, 0.12)',
                                                        border: themeStatus === 'dark' ? 'none' : '1px solid rgba(239, 79, 79, 0.3)',
                                                        color: themeStatus === 'dark' ? '#ef4f4f' : '#cf3b3b',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e: any) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e: any) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                />
                                            </div>
                                        )
                                    }
                                ]}
                                data={alertFilters || []}
                                options={{
                                    headerStyle: headerStyle(),
                                    rowStyle: rowStyle(),
                                    actionsColumnIndex: -1,
                                    search: true,
                                    pageSize: 10
                                }}
                                actions={[
                                    {
                                        icon: () => (
                                            <Button
                                                className='btn-neumorphic align-items-center'
                                                color='primary'
                                                isLight
                                                icon='Add'
                                                style={{ padding: '8px 16px', borderRadius: '10px' }}
                                            >
                                                Add Filters
                                            </Button>
                                        ),
                                        tooltip: 'Add Filters',
                                        isFreeAction: true,
                                        onClick: handleOpenCreate
                                    }
                                ]}
                            />
                        </ThemeProvider>

                        <Modal
                            isOpen={isManagementFormOpen}
                            setIsOpen={setIsManagementFormOpen}
                            size="lg"
                            isCentered
                            isScrollable
                        >
                            <ModalHeader setIsOpen={setIsManagementFormOpen}>
                                <ModalTitle id="alert-filter-form-modal">
                                    {editingFilter ? 'Edit Filter' : 'New Smart Rule'}
                                </ModalTitle>
                            </ModalHeader>
                            <ModalBody>
                                <AlertFilterForm
                                    filter={editingFilter || undefined}
                                    onSave={handleSaveFilter}
                                    onCancel={handleClose}
                                />
                            </ModalBody>
                        </Modal>

                        {/* ── Rule Detail Modal ── */}
                        <Modal isOpen={isDetailModalOpen} setIsOpen={setIsDetailModalOpen} size='lg' isCentered>
                            <ModalHeader setIsOpen={setIsDetailModalOpen}>
                                Rule Details: {selectedDetailFilter?.name}
                            </ModalHeader>
                            <ModalBody>
                                {selectedDetailFilter && (
                                    <div className='row g-3'>
                                        <div className='col-12 text-center mb-4'>
                                            <div
                                                className='neumorphic-icon-container mx-auto mb-3'
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    background: themeStatus === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#e0e5ec',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: themeStatus === 'dark'
                                                        ? '0 0 20px rgba(0,0,0,0.5)'
                                                        : '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff'
                                                }}
                                            >
                                                <Icon
                                                    icon='FilterAlt'
                                                    size='3x'
                                                    className='text-primary'
                                                />
                                            </div>
                                            <div className='h4 fw-bold mb-1'>
                                                {selectedDetailFilter.name}
                                            </div>
                                            <div className='text-muted small'>
                                                ID: {selectedDetailFilter.id} • Active: {selectedDetailFilter.is_active ? 'YES' : 'NO'}
                                            </div>
                                        </div>

                                        <div className='col-12'>
                                            <div className='border-top pt-3 mb-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                                                <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Rule Description</Label>
                                                <div className='p-3 rounded' style={{ background: themeStatus === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f8f9fa', borderLeft: '4px solid #7a3a6f' }}>
                                                    {selectedDetailFilter.description || <span className='text-muted fst-italic'>No description provided</span>}
                                                </div>
                                            </div>

                                            <div className='border-top pt-3 mb-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                                                <div className='row g-3'>
                                                    <div className='col-md-6'>
                                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Target Areas</Label>
                                                        <div className='fw-bold p-2'>
                                                            {selectedDetailFilter.area_list?.map(a => a.name).join(', ') || 'Global'}
                                                        </div>
                                                    </div>
                                                    <div className='col-md-6'>
                                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Target Alert Types</Label>
                                                        <div className='d-flex flex-wrap gap-1 p-2'>
                                                            {selectedDetailFilter.alert_types?.map(t => (
                                                                <Badge key={t} color="info" isLight>
                                                                    {ALERT_TYPE_CHOICES.find(c => c.value === t)?.label || t}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='border-top pt-3 mb-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                                                <div className='row g-3'>
                                                    <div className='col-md-6'>
                                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Trigger Thresholds</Label>
                                                        <div className='d-flex flex-wrap gap-1 p-2'>
                                                            {selectedDetailFilter.action_for_threshold && <Badge color="warning" isLight>Warning</Badge>}
                                                            {selectedDetailFilter.action_for_max && <Badge color="danger" isLight>Critical</Badge>}
                                                            {selectedDetailFilter.action_for_min && <Badge color="primary" isLight>Min</Badge>}
                                                        </div>
                                                    </div>
                                                    <div className='col-md-6'>
                                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Execution Actions</Label>
                                                        <div className='d-flex flex-wrap gap-1 p-2'>
                                                            {selectedDetailFilter.actions?.map(a => (
                                                                <Badge key={a.id} color="primary" isLight>{a.name}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='border-top pt-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                                                <div className='row g-3'>
                                                    <div className='col-md-6'>
                                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Created At</Label>
                                                        <div className='text-muted small p-2'>
                                                            <Icon icon='CalendarToday' className='me-1' />
                                                            {selectedDetailFilter.created_at ? format(new Date(selectedDetailFilter.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div className='col-md-6'>
                                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Last Updated</Label>
                                                        <div className='text-muted small p-2'>
                                                            <Icon icon='EditCalendar' className='me-1' />
                                                            {selectedDetailFilter.updated_at ? format(new Date(selectedDetailFilter.updated_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter className='justify-content-center border-0 pb-4'>
                                <Button
                                    className='btn-neumorphic px-5 py-2'
                                    onClick={() => setIsDetailModalOpen(false)}
                                >
                                    Close Details
                                </Button>
                            </ModalFooter>
                        </Modal>

                        {/* ── Delete Confirmation Modal ── */}
                        <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} size='sm' isCentered>
                            <ModalHeader setIsOpen={setIsDeleteModalOpen} className='border-0 pb-0'>
                                <ModalTitle id='delete-confirm-title' className='text-danger'>
                                    Confirm Deletion
                                </ModalTitle>
                            </ModalHeader>
                            <ModalBody className='text-center py-4'>
                                <div
                                    className='mx-auto mb-3 d-flex align-items-center justify-content-center'
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(239, 79, 79, 0.1)',
                                        borderRadius: '50%',
                                        color: '#ef4f4f'
                                    }}
                                >
                                    <Icon icon='DeleteSweep' size='2x' />
                                </div>
                                <div className='fw-bold fs-5 mb-2'>Delete this rule?</div>
                                <div className='text-muted small px-3'>
                                    Are you sure you want to delete <span className='fw-bold text-dark'>{filterToDelete?.name}</span>? This action cannot be undone.
                                </div>
                            </ModalBody>
                            <ModalFooter className='justify-content-center border-0 pt-0 pb-4 gap-2'>
                                <Button
                                    color='light'
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setFilterToDelete(null);
                                    }}
                                    className='px-4'
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color='danger'
                                    onClick={() => {
                                        if (filterToDelete) {
                                            deleteFilterMutation.mutate(filterToDelete.id);
                                            setIsDeleteModalOpen(false);
                                            setFilterToDelete(null);
                                        }
                                    }}
                                    className='px-4 shadow-sm'
                                >
                                    Delete Rule
                                </Button>
                            </ModalFooter>
                        </Modal>

                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default AlertFilterPage;
