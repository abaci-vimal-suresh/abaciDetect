import { useState } from 'react';
import Swal from 'sweetalert2';
import useDarkMode from '../../../../hooks/useDarkMode';
import { useDeleteUserGroup } from '../../../../api/sensors.api';

export function useUserGroupActions() {
    const { darkModeStatus } = useDarkMode();
    const deleteGroupMutation = useDeleteUserGroup();

    // ─── Modal States ────────────────────────────────────────────────────────
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editGroupId, setEditGroupId] = useState<number | null>(null);
    const [manageGroupId, setManageGroupId] = useState<number | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewGroup, setViewGroup] = useState<any | null>(null);

    const swalTheme = {
        background: darkModeStatus ? '#1a1a1a' : '#fff',
        color: darkModeStatus ? '#fff' : '#000',
    };

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleDeleteGroup = (groupId: number, groupName: string, onSuccess?: () => void) => {
        Swal.fire({
            title: 'Delete User Group?',
            text: `Are you sure you want to delete user group "${groupName}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2'
            },
            ...swalTheme
        }).then((result) => {
            if (result.isConfirmed) {
                deleteGroupMutation.mutate(groupId, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'User group has been deleted.',
                            icon: 'success',
                            ...swalTheme
                        });
                        onSuccess?.();
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to delete user group.',
                            icon: 'error',
                            ...swalTheme
                        });
                    }
                });
            }
        });
    };

    const openViewModal = (group: any) => {
        setViewGroup(group);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setViewGroup(null);
    };

    return {
        // Modal States
        isCreateOpen, setIsCreateOpen,
        editGroupId, setEditGroupId,
        manageGroupId, setManageGroupId,
        isViewModalOpen, setIsViewModalOpen,
        viewGroup, setViewGroup,

        // Actions
        handleDeleteGroup,
        openViewModal,
        closeViewModal,
        deleteGroupMutation,

        // Utils
        darkModeStatus,
        swalTheme
    };
}
