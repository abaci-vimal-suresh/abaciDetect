import * as React from 'react';

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
    useAlertFilters, useCreateAlertFilter, useUpdateAlertFilter, useDeleteAlertFilter
} from '../../../api/sensors.api';
import AlertFilterForm from './components/AlertFilterForm';
import { AlertFilter, ALERT_TYPE_CHOICES, ALERT_SOURCE_CHOICES, Action, Area } from '../../../types/sensor';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../components/bootstrap/Modal';

const AlertFilterPage = () => {
    const [isManagementFormOpen, setIsManagementFormOpen] = React.useState(false);
    const [editingFilter, setEditingFilter] = React.useState<Partial<AlertFilter> | null>(null);

    const { theme, headerStyle, rowStyle } = useTablestyle();

    const { data: alertFilters } = useAlertFilters();
    const createFilterMutation = useCreateAlertFilter();
    const updateFilterMutation = useUpdateAlertFilter();
    const deleteFilterMutation = useDeleteAlertFilter();

    const handleSaveFilter = async (data: Partial<AlertFilter>) => {
        // Clean and prepare payload for backend
        const payload: any = { ...data };

        // 1. Remove read-only/frontend-only fields
        delete payload.area_list;
        delete payload.sensor_groups;
        delete payload.actions;
        delete payload.tableData;
        delete payload.created_at;
        delete payload.updated_at;

        // 2. Map to ID fields if not already present or if we want to be sure
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
                        {isManagementFormOpen ? (
                            <Card shadow="none" borderSize={1}>
                                <CardHeader>
                                    <CardTitle>
                                        {editingFilter ? 'Edit Filter' : 'New Smart Rule'}
                                    </CardTitle>
                                    <CardActions>
                                        <Button color="light" icon="Close" onClick={() => setIsManagementFormOpen(false)} />
                                    </CardActions>
                                </CardHeader>
                                <CardBody>
                                    <AlertFilterForm
                                        filter={editingFilter || undefined}
                                        onSave={handleSaveFilter}
                                        onCancel={() => setIsManagementFormOpen(false)}
                                    />
                                </CardBody>
                            </Card>
                        ) : (
                            <>
                                <ThemeProvider theme={theme}>
                                    <MaterialTable
                                        title="Your Smart Rules"
                                        columns={[
                                            { title: 'Rule Name', field: 'name' },
                                            { title: 'Description', field: 'description' },
                                            {
                                                title: 'Scope',
                                                render: (row: AlertFilter) => (
                                                    <div className="d-flex flex-column gap-1">
                                                        <small className="text-muted d-block">
                                                            <strong>Areas:</strong> {row.area_list?.map(a => a.name).join(', ') || 'Global'}
                                                        </small>
                                                        {row.sensor_groups && row.sensor_groups.length > 0 && (
                                                            <small className="text-muted d-block">
                                                                <strong>Groups:</strong> {row.sensor_groups.map(g => g.name).join(', ')}
                                                            </small>
                                                        )}
                                                    </div>
                                                )
                                            },
                                            {
                                                title: 'Alert Types',
                                                render: (row: AlertFilter) => (
                                                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                                                        {row.alert_types?.map((t: string) => (
                                                            <Badge key={t} color="info" isLight className="text-truncate">
                                                                {ALERT_TYPE_CHOICES.find(c => c.value === t)?.label || t}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )
                                            },
                                            {
                                                title: 'Sources',
                                                render: (row: AlertFilter) => (
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {row.source_types?.map((s: string) => (
                                                            <Badge key={s} color="secondary" isLight>
                                                                {ALERT_SOURCE_CHOICES.find(c => c.value === s)?.label || s}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )
                                            },
                                            {
                                                title: 'Triggers',
                                                render: (row: AlertFilter) => (
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {row.action_for_threshold && <Badge color="warning" isLight>Warning</Badge>}
                                                        {row.action_for_max && <Badge color="danger" isLight>Critical</Badge>}
                                                        {row.action_for_min && <Badge color="primary" isLight>Min</Badge>}
                                                    </div>
                                                )
                                            },
                                            {
                                                title: 'Alert Actions',
                                                render: (row: AlertFilter) => (
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {row.actions?.map((a: Action) => (
                                                            <Badge key={a.id} color="primary" isLight>
                                                                {a.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )
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
                                                icon: () => <Icon icon="Edit" size='2x' color="primary" />,
                                                tooltip: 'Edit',
                                                onClick: (event, rowData: any) => {
                                                    setEditingFilter(rowData);
                                                    setIsManagementFormOpen(true);
                                                }
                                            },
                                            {
                                                icon: () => <Icon icon="Delete" size='2x' color="danger" />,
                                                tooltip: 'Delete',
                                                onClick: (event, rowData: any) => {
                                                    if (window.confirm(`Are you sure you want to delete this filter?`)) {
                                                        deleteFilterMutation.mutate(rowData.id);
                                                    }
                                                }
                                            },
                                            {
                                                icon: () => <Icon icon="Add" size='2x' color="primary" />,
                                                tooltip: 'Add Rule',
                                                isFreeAction: true,
                                                onClick: (event) => {
                                                    setEditingFilter(null);
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

export default AlertFilterPage;
