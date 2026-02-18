import React, { useContext, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';

import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle
} from '../../../components/bootstrap/Modal';
import Spinner from '../../../components/bootstrap/Spinner';

import ThemeContext from '../../../contexts/themeContext';
import useTablestyle from '../../../hooks/useTablestyles';
import useColumnHiding from '../../../hooks/useColumnHiding';
import { updateHiddenColumnsInLocalStorage } from '../../../helpers/functions';

import { useUserGroups, useDeleteUserGroup } from '../../../api/sensors.api';
import UserGroupCreateModal from './modals/UserGroupCreateModal';
import UserGroupEditModal from './modals/UserGroupEditModal';
import ManageGroupMembersModal from './modals/ManageGroupMembersModal';

const UserGroupsPage = () => {
    const { data: groups, isLoading } = useUserGroups();
    const deleteGroupMutation = useDeleteUserGroup();
    const { darkModeStatus } = useContext(ThemeContext);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editGroupId, setEditGroupId] = useState<number | null>(null);
    const [manageGroupId, setManageGroupId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewGroup, setViewGroup] = useState<any | null>(null);

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
                            fontWeight: 600
                        }}
                    >
                        <Icon icon="Groups" size="lg" />
                    </div>
                    <div>
                        <div className="fw-bold">{rowData.name}</div>
                        {rowData.description && (
                            <div className="small text-muted">{rowData.description}</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: 'Members',
            field: 'member_count',
            render: (rowData: any) => (
                <span
                    className="px-3 py-1 rounded-pill"
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: darkModeStatus
                            ? 'rgba(70,188,170,0.2)'
                            : 'rgba(70,188,170,0.15)',
                        color: '#2d8478'
                    }}
                >
                    {rowData.member_count} {rowData.member_count === 1 ? 'member' : 'members'}
                </span>
            )
        },
        {
            title: 'Created',
            field: 'created_at',
            render: (rowData: any) => (
                <div className="small">
                    {new Date(rowData.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
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
                        onClick={() => {
                            setViewGroup(rowData);
                            setIsViewModalOpen(true);
                        }}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
                    />
                    <Button
                        color="primary"
                        isLight
                        icon="Edit"
                        title="Edit"
                        onClick={() => setEditGroupId(rowData.id)}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
                    />
                    <Button
                        color="danger"
                        isLight
                        icon="Delete"
                        title="Delete"
                        onClick={() => {
                            setGroupToDelete(rowData);
                            setIsDeleteModalOpen(true);
                        }}
                        style={{ width: 36, height: 36, borderRadius: 8 }}
                    />
                </div>
            )
        }
    ];

    const columns = useColumnHiding({
        oldValue: staticColumns,
        hiddenColumnArray: JSON.parse(localStorage.getItem('userGroupsColumns') || '[]'),
        buttonArray: actionButtons
    });

    return (
        <PageWrapper title="User Groups">
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon="Groups" className="me-2 fs-4" />
                    <span className="h4 fw-bold mb-0">User Groups</span>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button color="primary" icon="Add" onClick={() => setIsCreateOpen(true)}>
                        Create Group
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
                                data={groups || []}
                                isLoading={isLoading}
                                onChangeColumnHidden={(column, hidden) =>
                                    updateHiddenColumnsInLocalStorage(
                                        column,
                                        hidden,
                                        'userGroupsColumns'
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

            {/* Modals */}
            <UserGroupCreateModal isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
            <UserGroupEditModal
                isOpen={!!editGroupId}
                setIsOpen={() => setEditGroupId(null)}
                groupId={editGroupId}
            />
            <ManageGroupMembersModal
                isOpen={!!manageGroupId}
                setIsOpen={() => setManageGroupId(null)}
                groupId={manageGroupId}
            />

            <Modal isOpen={isViewModalOpen} setIsOpen={setIsViewModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsViewModalOpen}>
                    <ModalTitle id='viewUserGroupModal'>User Group Details</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <h5 className='mb-1'>{viewGroup?.name}</h5>
                    {viewGroup?.description && (
                        <p className='text-muted mb-3'>{viewGroup.description}</p>
                    )}
                    <div className='d-flex flex-wrap gap-3 mb-3'>
                        <div className='small text-muted'>
                            <strong>Members:</strong>{' '}
                            {viewGroup?.member_count ?? 0}
                        </div>
                        {viewGroup?.created_at && (
                            <div className='small text-muted'>
                                <strong>Created:</strong>{' '}
                                {new Date(viewGroup.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                        )}
                    </div>
                    {viewGroup?.members && viewGroup.members.length > 0 && (
                        <div
                            className='border rounded'
                            style={{ maxHeight: 260, overflowY: 'auto' }}
                        >
                            {viewGroup.members.map((member: any) => (
                                <div
                                    key={member.id}
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
                                                fontSize: 14,
                                                fontWeight: 600
                                            }}
                                        >
                                            {(member.first_name || member.username || '?')
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div>
                                            <div className='fw-semibold small'>
                                                {member.first_name} {member.last_name}
                                            </div>
                                            <div className='text-muted small'>
                                                @{member.username} · {member.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='d-flex flex-column align-items-end gap-1'>
                                        <span
                                            className='px-2 py-1 rounded-pill small'
                                            style={{
                                                fontWeight: 500,
                                                background: darkModeStatus
                                                    ? 'rgba(122,58,111,0.25)'
                                                    : 'rgba(122,58,111,0.15)',
                                                color: '#7a3a6f'
                                            }}
                                        >
                                            {member.role}
                                        </span>
                                        <span
                                            className='px-2 py-0 rounded-pill small'
                                            style={{
                                                background: member.is_active
                                                    ? 'rgba(70,188,170,0.15)'
                                                    : 'rgba(243,84,33,0.15)',
                                                color: member.is_active ? '#2d8478' : '#f35421'
                                            }}
                                        >
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {(!viewGroup?.members || viewGroup.members.length === 0) && (
                        <div className='text-muted small'>
                            No members in this group yet.
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color='light'
                        onClick={() => {
                            setIsViewModalOpen(false);
                            setViewGroup(null);
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        color='primary'
                        onClick={() => {
                            if (viewGroup) {
                                setIsViewModalOpen(false);
                                setManageGroupId(viewGroup.id);
                            }
                        }}
                    >
                        Manage Members
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsDeleteModalOpen}>
                    <ModalTitle id='deleteGroupModal'>Delete User Group</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='alert alert-danger d-flex align-items-center mb-3'>
                        <Icon icon='Warning' className='me-2' size='2x' />
                        <div>
                            <strong>Warning:</strong> This action cannot be undone.
                        </div>
                    </div>
                    <p>
                        Are you sure you want to delete the user group <strong>"{groupToDelete?.name}"</strong>?
                    </p>
                    <p className='text-muted small'>
                        This will permanently remove the group and all its settings from the system.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='danger'
                        onClick={() => {
                            if (groupToDelete) {
                                deleteGroupMutation.mutateAsync(groupToDelete.id).then(() => {
                                    setIsDeleteModalOpen(false);
                                    setGroupToDelete(null);
                                });
                            }
                        }}
                        isDisable={deleteGroupMutation.isPending}
                    >
                        {deleteGroupMutation.isPending && <Spinner isSmall inButton isGrow />}
                        Delete Group
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper>
    );
};

export default UserGroupsPage;
