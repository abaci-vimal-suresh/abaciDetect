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
    useAlertFilters, useCreateAlertFilter, useUpdateAlertFilter, useDeleteAlertFilter
} from '../../../api/sensors.api';
import AlertFilterForm from './components/AlertFilterForm';
import { AlertFilter } from '../../../types/sensor';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../components/bootstrap/Modal';

const AlertFilterPage = () => {
    const { theme, headerStyle, rowStyle } = useTablestyle();

    const { data: alertFilters } = useAlertFilters();
    const createFilterMutation = useCreateAlertFilter();
    const updateFilterMutation = useUpdateAlertFilter();
    const deleteFilterMutation = useDeleteAlertFilter();

    const [isManagementFormOpen, setIsManagementFormOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState<Partial<AlertFilter> | null>(null);

    const handleSaveFilter = async (data: Partial<AlertFilter>) => {
        if (data.id) {
            await updateFilterMutation.mutateAsync({ id: data.id, data });
        } else {
            await createFilterMutation.mutateAsync(data);
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
                                <div className="alert alert-info d-flex align-items-center mb-4">
                                    <Icon icon="Info" className="me-2" />
                                    <div>
                                        Alert filters allow you to define 'Smart Rules': <strong>IF [conditions] THEN [actions]</strong>.
                                    </div>
                                </div>

                                <ThemeProvider theme={theme}>
                                    <MaterialTable
                                        title="Your Smart Rules"
                                        columns={[
                                            { title: 'Rule Name', field: 'name' },
                                            { title: 'Description', field: 'description' },
                                            {
                                                title: 'Scope',
                                                render: (row: any) => (
                                                    <small>
                                                        {row.area_ids?.length || 0} Areas, {row.sensor_group_ids?.length || 0} Groups
                                                    </small>
                                                )
                                            },
                                            {
                                                title: 'Triggers',
                                                render: (row: any) => (
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {row.action_for_threshold && <Badge color="warning" isLight>Warning</Badge>}
                                                        {row.action_for_max && <Badge color="danger" isLight>Critical</Badge>}
                                                        {row.action_for_min && <Badge color="info" isLight>Min</Badge>}
                                                    </div>
                                                )
                                            },
                                            {
                                                title: 'Actions',
                                                render: (row: any) => (
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {(row.action_ids as any[])?.map((a: any) => (
                                                            <Badge key={typeof a === 'object' ? a.id : a} color="primary" isLight>
                                                                {typeof a === 'object' ? a.name : `Action ${a}`}
                                                            </Badge>
                                                        ))}
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
                                                icon: 'Edit',
                                                tooltip: 'Edit',
                                                onClick: (event, rowData: any) => {
                                                    setEditingFilter(rowData);
                                                    setIsManagementFormOpen(true);
                                                }
                                            },
                                            {
                                                icon: 'Delete',
                                                tooltip: 'Delete',
                                                onClick: (event, rowData: any) => {
                                                    if (window.confirm(`Are you sure you want to delete this filter?`)) {
                                                        deleteFilterMutation.mutate(rowData.id);
                                                    }
                                                }
                                            },
                                            {
                                                icon: 'Add',
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
