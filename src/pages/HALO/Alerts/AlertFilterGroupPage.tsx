import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Badge from '../../../components/bootstrap/Badge';
import Icon from '../../../components/icon/Icon';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/useTablestyles';
import useDarkMode from '../../../hooks/useDarkMode';
import Swal from 'sweetalert2';
import {
    useAlertFilterGroups,
    useCreateAlertFilterGroup,
    useUpdateAlertFilterGroup,
    useDeleteAlertFilterGroup,
} from '../../../api/sensors.api';
import AlertFilterGroupForm from './components/AlertFilterGroupForm';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';
import { AlertFilterGroup } from '../../../types/sensor';
import Button from '../../../components/bootstrap/Button';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';

const AlertFilterGroupPage = () => {
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingGroup, setEditingGroup] = React.useState<Partial<AlertFilterGroup> | null>(null);

    const { theme, headerStyle, rowStyle } = useTablestyle();
    const { darkModeStatus } = useDarkMode();

    const { data: groups, isLoading } = useAlertFilterGroups();
    const createMutation = useCreateAlertFilterGroup();
    const updateMutation = useUpdateAlertFilterGroup();
    const deleteMutation = useDeleteAlertFilterGroup();

    const handleSaveGroup = async (data: Partial<AlertFilterGroup>) => {
        const payload: any = { ...data };

        // Cleanup response objects if they exist
        delete payload.alert_filters;
        delete payload.tableData;
        delete payload.created_at;
        delete payload.updated_at;
        delete payload.created_by_username;
        delete payload.updated_by_username;

        try {
            if (payload.id) {
                await updateMutation.mutateAsync({ id: payload.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            setIsFormOpen(false);
            setEditingGroup(null);
        } catch (error) {
            console.error('Error saving group:', error);
        }
    };

    const handleDeleteGroup = (rowData: AlertFilterGroup) => {
        Swal.fire({
            title: 'Delete Filter Group?',
            text: `Are you sure you want to delete "${rowData.name}"? This will not delete the rules inside it.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2',
            },
            background: darkModeStatus ? '#1a1a1a' : '#fff',
            color: darkModeStatus ? '#fff' : '#000',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(rowData.id);
            }
        });
    };

    const columns: any[] = [
        {
            title: 'Group Name',
            field: 'name',
            render: (rowData: AlertFilterGroup) => (
                <div className='d-flex align-items-center gap-2'>
                    <div className='p-2 bg-light-primary rounded-circle d-flex align-items-center justify-content-center' style={{ width: 36, height: 36 }}>
                        <Icon icon='Folder' color='primary' size='lg' />
                    </div>
                    <div>
                        <div className='fw-bold'>{rowData.name}</div>
                        <small className='text-muted'>{rowData.description || 'No description'}</small>
                    </div>
                </div>
            )
        },
        {
            title: 'Member Rules',
            field: 'alert_filters',
            render: (rowData: AlertFilterGroup) => {
                const count = rowData.alert_filters?.length || 0;
                return (
                    <div className='d-flex flex-wrap gap-1'>
                        {count > 0 ? (
                            rowData.alert_filters?.slice(0, 3).map(f => (
                                <Badge key={f.id} color='info' isLight>
                                    {f.name}
                                </Badge>
                            ))
                        ) : (
                            <span className='text-muted italic small'>Empty group</span>
                        )}
                        {count > 3 && (
                            <Badge color='secondary' isLight>
                                +{count - 3} more
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Created By',
            field: 'created_by_username',
            render: (rowData: AlertFilterGroup) => (
                <div className='d-flex flex-column'>
                    <span>{rowData.created_by_username || 'System'}</span>
                    <small className='text-muted italic' style={{ fontSize: '0.75rem' }}>
                        {rowData.created_at ? new Date(rowData.created_at).toLocaleDateString() : '-'}
                    </small>
                </div>
            )
        },
        {
            title: 'Actions',
            field: 'actions',
            sorting: false,
            filtering: false,
            width: '280px',
            render: (rowData: AlertFilterGroup) => (
                <div className='d-flex gap-2 align-items-center'>
                    <Button
                        color='info'
                        isLight
                        icon='Edit'
                        size='sm'
                        onClick={() => {
                            setEditingGroup(rowData);
                            setIsFormOpen(true);
                        }}
                    />
                    <Button
                        color='primary'
                        isLight
                        icon='AccountTree'
                        size='sm'
                        onClick={() => navigate(`/halo/alerts/flow?groupId=${rowData.id}`)}
                    />
                    <Button
                        color='danger'
                        isLight
                        icon='Delete'
                        size='sm'
                        onClick={() => handleDeleteGroup(rowData)}
                    />
                </div>
            )
        }
    ];

    return (

        <PageWrapper title='Alert Filter Groups'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo/dashboard' },
                            { title: 'Alerts', to: '/halo/alerts/history' },
                            { title: 'Filter Groups', to: '/halo/alerts/groups' },
                        ]}
                    />
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        color='primary'
                        isLight
                        icon='Add'
                        onClick={() => {
                            setEditingGroup(null);
                            setIsFormOpen(true);
                        }}
                    >
                        Create Group
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
                <div className='row'>
                    <div className='col-12'>
                        <ThemeProvider theme={theme}>
                            <MaterialTable
                                title=''
                                columns={columns}
                                data={groups || []}
                                isLoading={isLoading}
                                options={{
                                    headerStyle: headerStyle(),
                                    rowStyle: rowStyle(),
                                    pageSize: 10,
                                    actionsColumnIndex: -1,
                                    search: true,
                                    filtering: false,
                                }}
                                actions={[]}
                            />
                        </ThemeProvider>
                    </div>
                </div>
            </Page>

            <Modal isOpen={isFormOpen} setIsOpen={setIsFormOpen} size='lg' isScrollable isStaticBackdrop>
                <ModalHeader setIsOpen={setIsFormOpen}>
                    <ModalTitle id='group-form-modal'>
                        {editingGroup ? 'Edit Filter Group' : 'Create New Filter Group'}
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <AlertFilterGroupForm
                        group={editingGroup}
                        onSave={handleSaveGroup}
                        onCancel={() => {
                            setIsFormOpen(false);
                            setEditingGroup(null);
                        }}
                    />
                </ModalBody>
            </Modal>
        </PageWrapper>
    );
};

export default AlertFilterGroupPage;
