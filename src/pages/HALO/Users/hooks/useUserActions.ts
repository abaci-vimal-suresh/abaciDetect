import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import useDarkMode from '../../../../hooks/useDarkMode';
import { useDeleteUser } from '../../../../api/sensors.api';

export function useUserActions() {
    const { darkModeStatus } = useDarkMode();
    const location = useLocation();
    const navigate = useNavigate();
    const deleteUserMutation = useDeleteUser();

    // ─── Modal States ────────────────────────────────────────────────────────
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<number | null>(null);
    const [viewUserId, setViewUserId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const swalTheme = {
        background: darkModeStatus ? '#1a1a1a' : '#fff',
        color: darkModeStatus ? '#fff' : '#000',
    };

    // ─── Direct Hook Effects ─────────────────────────────────────────────────
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get('startTour') === 'true' && localStorage.getItem('showGuidedTour') === 'active') {
            setIsCreateOpen(true);
        }
    }, [location.search]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleDeleteUser = (userId: number, username: string, onSuccess?: () => void) => {
        Swal.fire({
            title: 'Delete User?',
            text: `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
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
                deleteUserMutation.mutate(userId, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'User has been deleted.',
                            icon: 'success',
                            ...swalTheme
                        });
                        onSuccess?.();
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to delete user.',
                            icon: 'error',
                            ...swalTheme
                        });
                    }
                });
            }
        });
    };

    return {
        // Modal States
        isCreateOpen, setIsCreateOpen,
        editUserId, setEditUserId,
        viewUserId, setViewUserId,
        isDeleteModalOpen, setIsDeleteModalOpen,
        isSuccessModalOpen, setIsSuccessModalOpen,

        // Actions
        handleDeleteUser,
        deleteUserMutation,

        // Utils
        darkModeStatus,
        swalTheme
    };
}
