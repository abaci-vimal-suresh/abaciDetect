import React, { useState } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
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

const AlertActionPage = () => {
    const { theme, headerStyle, rowStyle } = useTablestyle();

    const { data: actions } = useActions();
    const createActionMutation = useCreateAction();
    const updateActionMutation = useUpdateAction();
    const deleteActionMutation = useDeleteAction();

    const [isManagementFormOpen, setIsManagementFormOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<Partial<Action> | null>(null);

    const handleSaveAction = async (data: Partial<Action>) => {
        if (data.id) {
            await updateActionMutation.mutateAsync({ id: data.id, data });
        } else {
            await createActionMutation.mutateAsync(data);
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
                        {isManagementFormOpen ? (
                            <Card shadow="none" borderSize={1}>
                                <CardHeader>
                                    <CardTitle>
                                        {editingAction ? 'Edit Action' : 'New Notification Action'}
                                    </CardTitle>
                                    <CardActions>
                                        <Button color="light" icon="Close" onClick={() => setIsManagementFormOpen(false)} />
                                    </CardActions>
                                </CardHeader>
                                <CardBody>
                                    <ActionForm
                                        action={editingAction || undefined}
                                        onSave={handleSaveAction}
                                        onCancel={() => setIsManagementFormOpen(false)}
                                    />
                                </CardBody>
                            </Card>
                        ) : (
                            <>
                                <div className="alert alert-info d-flex align-items-center mb-4">
                                    <Icon icon="Info" className="me-2" />
                                    <div>
                                        Actions define <strong>HOW</strong> alert notifications are delivered (Email, SMS, etc.) and <strong>TO WHOM</strong>.
                                    </div>
                                </div>

                                <ThemeProvider theme={theme}>
                                    <MaterialTable
                                        title="Available Notification Actions"
                                        columns={[
                                            { title: 'Action Name', field: 'name' },
                                            { title: 'Type', field: 'type', render: (row: any) => <Badge color="info">{row.type.toUpperCase()}</Badge> },
                                            {
                                                title: 'Recipients',
                                                render: (row: any) => {
                                                    if (row.type !== 'sms' && row.type !== 'email') return <small className="text-muted">-</small>;
                                                    return (
                                                        <small>
                                                            {row.recipients?.length || 0} Users, {row.user_groups?.length || 0} Groups
                                                        </small>
                                                    );
                                                }
                                            },
                                            {
                                                title: 'Details',
                                                render: (row: any) => (
                                                    <small className="text-muted">
                                                        {row.type === 'webhook' ? row.http_method :
                                                            (row.type === 'device_notification' || row.type === 'push_notification') ? row.device_type : '-'}
                                                    </small>
                                                )
                                            },
                                            { title: 'Priority', field: 'message_type' },
                                            {
                                                title: 'Status',
                                                field: 'is_active',
                                                render: (row: any) => <Badge color={row.is_active ? 'success' : 'light'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
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
                                                icon: 'Edit',
                                                tooltip: 'Edit',
                                                onClick: (event, rowData: any) => {
                                                    setEditingAction(rowData);
                                                    setIsManagementFormOpen(true);
                                                }
                                            },
                                            {
                                                icon: 'Delete',
                                                tooltip: 'Delete',
                                                onClick: (event, rowData: any) => {
                                                    if (window.confirm(`Are you sure you want to delete this action?`)) {
                                                        deleteActionMutation.mutate(rowData.id);
                                                    }
                                                }
                                            },
                                            {
                                                icon: 'Add',
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
                            </>
                        )}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default AlertActionPage;
