import React, { useState } from 'react';
import useDarkMode from '../../../hooks/useDarkMode';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Badge from '../../../components/bootstrap/Badge';
import Icon from '../../../components/icon/Icon';
import MaterialTable from '@material-table/core';
import Button from '../../../components/bootstrap/Button';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/useTablestyles';
import { useActions, useCreateAction, useUpdateAction, useDeleteAction } from '../../../api/sensors.api';
import ActionForm from './components/ActionForm';
import ActionViewModal from './components/ActionViewModal';
import { Action } from '../../../types/sensor';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';
import Swal from 'sweetalert2';

const AlertActionPage = () => {
    const { theme, headerStyle, rowStyle } = useTablestyle();
    const { themeStatus } = useDarkMode();

    const { data: actions } = useActions();
    const createActionMutation = useCreateAction();
    const updateActionMutation = useUpdateAction();
    const deleteActionMutation = useDeleteAction();

    const [isManagementFormOpen, setIsManagementFormOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<Partial<Action> | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingAction, setViewingAction] = useState<Action | null>(null);

    const handleSaveAction = async (data: Partial<Action>) => {
        const payload: any = { ...data };

        delete payload.tableData;
        delete payload.created_at;
        delete payload.updated_at;
        delete payload.created_by_username;
        delete payload.created_by;
        delete payload.recipients;
        delete payload.user_groups;

        if (data.recipients && Array.isArray(data.recipients)) {
            payload.recipient_ids = data.recipients.map((r: any) =>
                typeof r === 'object' ? r.id : r
            );
        }

        if (data.user_groups && Array.isArray(data.user_groups)) {
            payload.user_group_ids = data.user_groups.map((g: any) =>
                typeof g === 'object' ? g.id : g
            );
        }

        if (data.type === 'device_notification') {
            if (typeof data.device_list === 'string') {
                payload.device_list = data.device_list.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        if (data.id) {
            await updateActionMutation.mutateAsync({ id: data.id, data: payload });
        } else {
            await createActionMutation.mutateAsync(payload);
        }
        setIsManagementFormOpen(false);
        setEditingAction(null);
    };

    const handleDeleteAction = (action: Action, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        const swalTheme = {
            background: themeStatus === 'dark' ? '#1a1a1a' : '#fff',
            color: themeStatus === 'dark' ? '#fff' : '#000',
        };

        Swal.fire({
            title: 'Delete Action?',
            text: `Are you sure you want to delete "${action.name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2 btn-neumorphic'
            },
            ...swalTheme,
        }).then((result) => {
            if (result.isConfirmed) {
                deleteActionMutation.mutate(action.id);
            }
        });
    };

    return (
        <PageWrapper>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon="NotificationsActive" className="me-2 fs-2" />
                    <span className="fw-bold fs-3">Actions</span>
                </SubHeaderLeft>
            </SubHeader>
            <Page container="fluid">
                <div className="row">
                    <div className="col-12">
                        <ThemeProvider theme={theme}>
                            <MaterialTable
                                title="Available  Actions"
                                columns={[
                                    {
                                        title: 'Action Info',
                                        render: (row: any) => (
                                            <div>
                                                <div className="fw-bold">{row.name}</div>

                                            </div>
                                        )
                                    },
                                    {
                                        title: 'Notification Details',
                                        field: 'type',
                                        render: (row: any) => {
                                            const typeMap: any = {
                                                'email': 'Email', 'sms': 'SMS', 'webhook': 'Webhook',
                                                'n8n_workflow': 'n8n', 'device_notification': 'Device',
                                                'push_notification': 'Push', 'slack': 'Slack', 'teams': 'Teams'
                                            };
                                            return (
                                                <div className="d-flex flex-column align-items-start gap-1">
                                                    <Badge color="info" isLight className="text-uppercase" style={{ fontSize: '0.75rem' }}>
                                                        {typeMap[row.type] || row.type.toUpperCase()}
                                                    </Badge>
                                                    {row.type === 'webhook' && row.http_method && (
                                                        <small className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
                                                            {row.http_method}: {row.webhook_url ? (row.webhook_url.length > 25 ? row.webhook_url.substring(0, 25) + '...' : row.webhook_url) : 'No URL'}
                                                        </small>
                                                    )}
                                                    {row.type === 'n8n_workflow' && (
                                                        <small className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
                                                            ID: {row.n8n_workflow_id || 'unnamed'}
                                                        </small>
                                                    )}
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Recipients',
                                        render: (row: any) => {
                                            const userCount = row.recipients?.length || 0;
                                            const groupCount = row.user_groups?.length || 0;
                                            if (userCount === 0 && groupCount === 0) return <small className="text-muted italic">None</small>;
                                            return (
                                                <div className="d-flex flex-column gap-1" style={{ fontSize: '0.75rem' }}>
                                                    {userCount > 0 && (
                                                        <div className="small">
                                                            <span className="text-muted small text-uppercase fw-bold me-1" style={{ fontSize: '0.7rem' }}>Users:</span>
                                                            <span className="fw-bold">{userCount}</span>
                                                        </div>
                                                    )}
                                                    {groupCount > 0 && (
                                                        <div className="small">
                                                            <span className="text-muted small text-uppercase fw-bold me-1" style={{ fontSize: '0.7rem' }}>Groups:</span>
                                                            <span className="fw-bold">{groupCount}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
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
                                        render: (rowData: Action) => (
                                            <div className='d-flex gap-2 justify-content-start align-items-center'>
                                                <Button
                                                    color='primary' isLight icon='Visibility'
                                                    onClick={() => { setViewingAction(rowData); setIsViewModalOpen(true); }}
                                                    title='View Details'
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '8px', padding: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: themeStatus === 'dark' ? 'rgba(77, 105, 250, 0.15)' : 'rgba(77, 105, 250, 0.12)',
                                                        border: themeStatus === 'dark' ? 'none' : '1px solid rgba(77, 105, 250, 0.3)',
                                                        color: themeStatus === 'dark' ? '#4d69fa' : '#3650d4',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e: any) => { e.currentTarget.style.background = themeStatus === 'dark' ? 'rgba(77, 105, 250, 0.25)' : 'rgba(77, 105, 250, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                    onMouseLeave={(e: any) => { e.currentTarget.style.background = themeStatus === 'dark' ? 'rgba(77, 105, 250, 0.15)' : 'rgba(77, 105, 250, 0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                />
                                                <Button
                                                    color='info' isLight icon='Edit'
                                                    onClick={() => { setEditingAction(rowData); setIsManagementFormOpen(true); }}
                                                    title='Edit'
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '8px', padding: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: themeStatus === 'dark' ? 'rgba(13, 202, 240, 0.15)' : 'rgba(13, 202, 240, 0.12)',
                                                        border: themeStatus === 'dark' ? 'none' : '1px solid rgba(13, 202, 240, 0.3)',
                                                        color: themeStatus === 'dark' ? '#0dcaf0' : '#0aa2c0',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                                />
                                                <Button
                                                    color='danger' isLight icon='Delete'
                                                    onClick={(e: any) => handleDeleteAction(rowData, e)}
                                                    title='Delete'
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '8px', padding: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: themeStatus === 'dark' ? 'rgba(239, 79, 79, 0.15)' : 'rgba(239, 79, 79, 0.12)',
                                                        border: themeStatus === 'dark' ? 'none' : '1px solid rgba(239, 79, 79, 0.3)',
                                                        color: themeStatus === 'dark' ? '#ef4f4f' : '#cf3b3b',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                                />
                                            </div>
                                        )
                                    }
                                ]}
                                data={actions || []}
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
                                            <Button className='btn-neumorphic d-flex align-items-center' color='primary' isLight icon='Add'>
                                                New Action
                                            </Button>
                                        ),
                                        tooltip: 'New Action',
                                        isFreeAction: true,
                                        onClick: () => { setEditingAction(null); setIsManagementFormOpen(true); }
                                    }
                                ]}
                            />
                        </ThemeProvider>

                        {/* ── Form Modal ── */}
                        <Modal isOpen={isManagementFormOpen} setIsOpen={setIsManagementFormOpen} size='lg' isCentered isScrollable>
                            <ModalHeader setIsOpen={setIsManagementFormOpen}>
                                <ModalTitle id='action-form-modal'>
                                    {editingAction ? 'Edit Action' : 'New Notification Action'}
                                </ModalTitle>
                            </ModalHeader>
                            <ModalBody>
                                <ActionForm
                                    action={editingAction || undefined}
                                    onSave={handleSaveAction}
                                    onCancel={() => setIsManagementFormOpen(false)}
                                />
                            </ModalBody>
                        </Modal>

                        {/* ── View Modal ── */}
                        <ActionViewModal
                            action={viewingAction}
                            isOpen={isViewModalOpen}
                            setIsOpen={setIsViewModalOpen}
                        />


                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default AlertActionPage;