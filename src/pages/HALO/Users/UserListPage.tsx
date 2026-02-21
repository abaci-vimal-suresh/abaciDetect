import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTour } from '@reactour/tour';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';

import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Modal, { ModalHeader, ModalBody, ModalTitle, ModalFooter } from '../../../components/bootstrap/Modal';

import ThemeContext from '../../../contexts/themeContext';
import useTablestyle from '../../../hooks/useTablestyles';
import useColumnHiding from '../../../hooks/useColumnHiding';
import { updateHiddenColumnsInLocalStorage } from '../../../helpers/functions';

import { useUsers } from '../../../api/sensors.api';
import UserCreateModal from './modals/UserCreateModal';
import UserEditModal from './modals/UserEditModal';
import UserViewModal from './modals/UserViewModal';
import { useUserActions } from './hooks/useUserActions';

const UserList = () => {
    const { data: users, isLoading } = useUsers();
    const { fullScreenStatus } = useContext(ThemeContext);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();
    const { setCurrentStep } = useTour();
    const navigate = useNavigate();

    const actions = useUserActions();

    const staticColumns = [
        {
            title: 'User',
            field: 'username',
            render: (rowData: any) => (
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                            width: 38,
                            height: 38,
                            background: actions.darkModeStatus
                                ? 'rgba(77,105,250,0.2)'
                                : 'rgba(77,105,250,0.15)',
                            color: '#4d69fa',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                    >
                        {rowData.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <div className="fw-bold">
                            {rowData.first_name} {rowData.last_name}
                        </div>
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>@{rowData.username}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'Email',
            field: 'email',
            render: (rowData: any) => (
                <div className="small text-muted" style={{ fontSize: '0.75rem' }}>{rowData.email}</div>
            )
        },
        {
            title: 'Role',
            field: 'role',
            render: (rowData: any) => (
                <span
                    className="px-3 py-1 rounded-pill"
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background:
                            rowData.role?.toLowerCase() === 'admin'
                                ? actions.darkModeStatus
                                    ? 'rgba(122,58,111,0.2)'
                                    : 'rgba(122,58,111,0.15)'
                                : actions.darkModeStatus
                                    ? 'rgba(70,188,170,0.2)'
                                    : 'rgba(70,188,170,0.15)',
                        color:
                            rowData.role?.toLowerCase() === 'admin'
                                ? '#7a3a6f'
                                : '#2d8478'
                    }}
                >
                    {rowData.role}
                </span>
            )
        },
        {
            title: 'Status',
            field: 'is_active',
            render: (rowData: any) => (
                <div
                    className="d-flex align-items-center gap-2 px-2 py-1"
                    style={{
                        background: rowData.is_active
                            ? 'rgba(70,188,170,0.12)'
                            : 'rgba(243,84,33,0.12)',
                        borderRadius: 6,
                        width: 100,
                        justifyContent: 'center'
                    }}
                >
                    <div
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: rowData.is_active ? '#46bcaa' : '#f35421'
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        {rowData.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )
        }
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
                        icon="Edit"
                        title="Edit User"
                        onClick={() => actions.setEditUserId(rowData.id)}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: actions.darkModeStatus ? 'rgba(13, 202, 240, 0.15)' : 'rgba(13, 202, 240, 0.12)',
                            border: actions.darkModeStatus ? 'none' : '1px solid rgba(13, 202, 240, 0.3)',
                            color: actions.darkModeStatus ? '#0dcaf0' : '#0aa2c0',
                            transition: 'all 0.2s ease'
                        }}
                    />
                    <Button
                        color="danger"
                        isLight
                        icon="Delete"
                        title="Delete User"
                        onClick={() => actions.handleDeleteUser(rowData.id, rowData.username)}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: actions.darkModeStatus ? 'rgba(243, 84, 33, 0.15)' : 'rgba(243, 84, 33, 0.12)',
                            border: actions.darkModeStatus ? 'none' : '1px solid rgba(243, 84, 33, 0.3)',
                            color: actions.darkModeStatus ? '#f35421' : '#d94111',
                            transition: 'all 0.2s ease'
                        }}
                    />
                </div>
            )
        }
    ];

    const columns = useColumnHiding({
        oldValue: staticColumns,
        hiddenColumnArray: JSON.parse(localStorage.getItem('userListColumns') || '[]'),
        buttonArray: actionButtons
    });

    return (
        <PageWrapper title="User Management">
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon="Group" className="me-2 fs-4" />
                    <span className="h4 fw-bold mb-0">Users</span>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        className='btn-neumorphic d-flex align-items-center'
                        color="primary"
                        isLight
                        icon="Add"
                        onClick={() => actions.setIsCreateOpen(true)}
                        data-tour="create-user-btn"
                        style={{ padding: '8px 16px', borderRadius: '10px' }}
                    >
                        Create User
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container="fluid">
                <Card stretch className="border-0">
                    <CardBody className="p-0">
                        <ThemeProvider theme={theme}>
                            <MaterialTable
                                title=" "
                                columns={columns}
                                data={users || []}
                                isLoading={isLoading}
                                onChangeColumnHidden={(column, hidden) =>
                                    updateHiddenColumnsInLocalStorage(
                                        column,
                                        hidden,
                                        'userListColumns'
                                    )
                                }
                                options={{
                                    headerStyle: headerStyles(),
                                    rowStyle: rowStyles(),
                                    search: true,
                                    pageSize: 10,
                                    columnsButton: true,
                                    actionsColumnIndex: -1,
                                    searchFieldStyle: searchFieldStyle()
                                }}
                            />
                        </ThemeProvider>
                    </CardBody>
                </Card>
            </Page>

            <UserEditModal
                isOpen={!!actions.editUserId}
                setIsOpen={() => actions.setEditUserId(null)}
                userId={actions.editUserId}
            />

            <UserViewModal
                userId={actions.viewUserId}
                isOpen={!!actions.viewUserId}
                setIsOpen={() => actions.setViewUserId(null)}
            />

            <UserCreateModal
                isOpen={actions.isCreateOpen}
                setIsOpen={actions.setIsCreateOpen}
                onSuccess={() => {
                    if (localStorage.getItem('showGuidedTour') === 'active') {
                        actions.setIsSuccessModalOpen(true);
                    }
                }}
            />
            <Modal isOpen={actions.isSuccessModalOpen} setIsOpen={actions.setIsSuccessModalOpen} isCentered size='lg'>
                <ModalHeader setIsOpen={actions.setIsSuccessModalOpen}>
                    <ModalTitle id='user-success-title'>👤 User Created Successfully!</ModalTitle>
                </ModalHeader>
                <ModalBody className='text-center py-4'>
                    <div className='display-4 text-success mb-3'>
                        <Icon icon='CheckCircle' />
                    </div>
                    <h4>Great job!</h4>
                    <p className='text-muted'>
                        You've created your first team member. Now, let's define the physical
                        <strong> Areas</strong> where your sensors will be located.
                    </p>
                </ModalBody>
                <ModalFooter className='justify-content-center border-0 pb-4'>
                    <Button
                        color='primary'
                        className='w-100 mb-2 py-2'
                        onClick={() => {
                            actions.setIsSuccessModalOpen(false);
                            setCurrentStep(1);
                            navigate('/halo/sensors/areas?startTour=true');
                        }}
                    >
                        Next: Create an Area
                    </Button>
                    <Button
                        color='light'
                        className='w-100'
                        onClick={() => actions.setIsSuccessModalOpen(false)}
                    >
                        I'll do it later
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper>
    );
};


export default UserList;
