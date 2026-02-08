import React, { useState } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Badge from '../../../components/bootstrap/Badge';
import Icon from '../../../components/icon/Icon';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/useTablestyles';
import {
    useActions, useCreateAction, useUpdateAction, useDeleteAction
} from '../../../api/sensors.api';
import ActionForm from './components/ActionForm';
import { Action } from '../../../types/sensor';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';

const AlertActionPage = () => {
    const { theme, headerStyle, rowStyle } = useTablestyle();

    const { data: actions } = useActions();
    const createActionMutation = useCreateAction();
    const updateActionMutation = useUpdateAction();
    const deleteActionMutation = useDeleteAction();

    const [isManagementFormOpen, setIsManagementFormOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<Partial<Action> | null>(null);

    const handleSaveAction = async (data: Partial<Action>) => {
        // Clean and prepare payload for backend
        const payload: any = { ...data };

        // 1. Remove frontend-only or read-only fields that might cause 400 errors
        delete payload.tableData;
        delete payload.created_at;
        delete payload.updated_at;
        delete payload.created_by_username;
        delete payload.created_by;

        // 2. Map recipients to ID fields if they are objects
        if (payload.recipients) {
            payload.recipient_ids = payload.recipients.map((r: any) =>
                typeof r === 'object' ? r.id : r
            );
        }

        // 3. Map user groups to ID fields if they are objects
        if (payload.user_groups) {
            payload.user_group_ids = payload.user_groups.map((g: any) =>
                typeof g === 'object' ? g.id : g
            );
        }

        // 4. Ensure device_list is handled (backend expects string or ID list depending on context)
        // If it's empty, send empty array or string based on type
        if (!payload.device_list) payload.device_list = [];

        if (data.id) {
            await updateActionMutation.mutateAsync({ id: data.id, data: payload });
        } else {
            await createActionMutation.mutateAsync(payload);
        }
        setIsManagementFormOpen(false);
        setEditingAction(null);
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
                                title="Available Notification Actions"
                                columns={[
                                    { title: 'Action Name', field: 'name' },
                                    {
                                        title: 'Notification Type',
                                        field: 'type',
                                        render: (row: any) => {
                                            const typeMap: any = {
                                                'email': 'Email Notification',
                                                'sms': 'SMS Notification',
                                                'webhook': 'Webhook/HTTP',
                                                'n8n_workflow': 'n8n Workflow',
                                                'device_notification': 'Device Command',
                                                'push_notification': 'Push Notification',
                                                'slack': 'Slack',
                                                'teams': 'Microsoft Teams'
                                            };
                                            return (
                                                <div className="d-flex flex-column align-items-start">
                                                    <Badge color="info" className="mb-1">{typeMap[row.type] || row.type.toUpperCase()}</Badge>
                                                    {row.type === 'webhook' && row.http_method && (
                                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {row.http_method}: {row.webhook_url ? (row.webhook_url.length > 20 ? row.webhook_url.substring(0, 20) + '...' : row.webhook_url) : 'No URL'}
                                                        </small>
                                                    )}
                                                    {row.type === 'n8n_workflow' && (
                                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            <Icon icon="AccountTree" size="sm" className="me-1" />
                                                            ID: {row.n8n_workflow_id || 'unnamed'}
                                                        </small>
                                                    )}
                                                    {(row.type === 'device_notification' || row.type === 'push_notification') && row.device_type && (
                                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            <Icon icon="Devices" size="sm" className="me-1" />
                                                            {row.device_type}
                                                        </small>
                                                    )}
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Recipients & Groups',
                                        render: (row: any) => {
                                            const userCount = row.recipients?.length || 0;
                                            const groupCount = row.user_groups?.length || 0;

                                            if (userCount === 0 && groupCount === 0) return <small className="text-muted">None</small>;

                                            let userText = '';
                                            if (userCount > 0) {
                                                if (typeof row.recipients[0] === 'object') {
                                                    const firstUser = row.recipients[0].username || row.recipients[0].first_name || 'User';
                                                    userText = `${userCount} User${userCount > 1 ? 's' : ''} (${firstUser}${userCount > 1 ? '...' : ''})`;
                                                } else {
                                                    userText = `${userCount} User${userCount > 1 ? 's' : ''}`;
                                                }
                                            }

                                            let groupText = groupCount > 0 ? `${groupCount} Group${groupCount > 1 ? 's' : ''}` : '';

                                            return (
                                                <div className="d-flex flex-column">
                                                    {userText && <small><Icon icon="Person" size="sm" className="me-1" />{userText}</small>}
                                                    {groupText && <small><Icon icon="Group" size="sm" className="me-1" />{groupText}</small>}
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Message Format',
                                        field: 'message_type',
                                        render: (row: any) => {
                                            const formatMap: any = {
                                                'json_data': 'JSON Data',
                                                'jsondata': 'JSON Data',
                                                'custom_template': 'Custom Template',
                                                'custom': 'Custom Message'
                                            };
                                            return <small className="fw-bold">{formatMap[row.message_type] || row.message_type || 'Custom'}</small>;
                                        }
                                    },
                                    {
                                        title: 'Status',
                                        field: 'is_active',
                                        render: (row: any) => (
                                            <Badge color={row.is_active ? 'success' : 'warning'}>
                                                {row.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
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
                                        icon: () => <Icon icon="Edit" />,
                                        tooltip: 'Edit',
                                        onClick: (event, rowData: any) => {
                                            setEditingAction(rowData);
                                            setIsManagementFormOpen(true);
                                        }
                                    },
                                    {
                                        icon: () => <Icon icon="Delete" />,
                                        tooltip: 'Delete',
                                        onClick: (event, rowData: any) => {
                                            if (window.confirm(`Are you sure you want to delete this action?`)) {
                                                deleteActionMutation.mutate(rowData.id);
                                            }
                                        }
                                    },
                                    {
                                        icon: () => <Icon icon="Add" />,
                                        tooltip: 'Add Action',
                                        isFreeAction: true,
                                        onClick: (event) => {
                                            setEditingAction(null);
                                            setIsManagementFormOpen(true);
                                        }
                                    }
                                ]}
                            />
                        </ThemeProvider>

                        <Modal
                            isOpen={isManagementFormOpen}
                            setIsOpen={setIsManagementFormOpen}
                            size='lg'
                            isCentered
                            isScrollable
                        >
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
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default AlertActionPage;
