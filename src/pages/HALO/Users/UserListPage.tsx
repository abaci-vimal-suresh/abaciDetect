import React, { useContext, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';

import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Spinner from '../../../components/bootstrap/Spinner';

import ThemeContext from '../../../contexts/themeContext';
import useTablestyle from '../../../hooks/useTablestyles';
import useColumnHiding from '../../../hooks/useColumnHiding';
import { updateHiddenColumnsInLocalStorage } from '../../../helpers/functions';

import { useUsers } from '../../../api/sensors.api';
import UserCreateModal from './modals/UserCreateModal';
import UserEditModal from './modals/UserEditModal';

const UserList = () => {
    const { data: users, isLoading } = useUsers();
    const { darkModeStatus, fullScreenStatus } = useContext(ThemeContext);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<number | null>(null);

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
                            background: darkModeStatus
                                ? 'rgba(77,105,250,0.2)'
                                : 'rgba(77,105,250,0.15)',
                            fontWeight: 600
                        }}
                    >
                        {rowData.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <div className="fw-bold">
                            {rowData.first_name} {rowData.last_name}
                        </div>
                        <div className="small text-muted">@{rowData.username}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'Email',
            field: 'email'
        },
        {
            title: 'Role',
            field: 'role',
            render: (rowData: any) => (
                <span
                    className="px-3 py-1 rounded-pill"
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background:
                            rowData.role?.toLowerCase() === 'admin'
                                ? darkModeStatus
                                    ? 'rgba(122,58,111,0.2)'
                                    : 'rgba(122,58,111,0.15)'
                                : darkModeStatus
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
                            ? 'rgba(70,188,170,0.15)'
                            : 'rgba(243,84,33,0.15)',
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
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {rowData.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )
        }
    ];

    /* ---------------- Actions ---------------- */
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
                        onClick={() => console.log('view', rowData.id)}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
                    />
                    <Button
                        color="primary"
                        isLight
                        icon="Edit"
                        title="Edit"
                        onClick={() => setEditUserId(rowData.id)}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
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
                    <Button color="primary" icon="Add" onClick={() => setIsCreateOpen(true)}>
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

            <UserCreateModal isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
            <UserEditModal
                isOpen={!!editUserId}
                setIsOpen={() => setEditUserId(null)}
                userId={editUserId}
            />
        </PageWrapper>
    );
};

export default UserList;
