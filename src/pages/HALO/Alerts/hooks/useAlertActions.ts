import { useState } from 'react';
import { useUpdateAlert, useDeleteAlert, useCreateAlert } from '../../../../api/sensors.api';
import { AlertStatus } from '../../../../types/sensor';
import Swal from 'sweetalert2';
import useDarkMode from '../../../../hooks/useDarkMode';

interface AlertRecord {
    id: string;
    originalId: number;
}

export function useAlertActions() {
    const { darkModeStatus } = useDarkMode();

    const updateAlertMutation = useUpdateAlert();
    const deleteAlertMutation = useDeleteAlert();
    const createAlertMutation = useCreateAlert();

    const swalTheme = {
        background: darkModeStatus ? '#1a1a1a' : '#fff',
        color: darkModeStatus ? '#fff' : '#000',
    };

    // ── Status Modal State ────────────────────────────────────────────────────
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
    const [targetStatus, setTargetStatus] = useState<AlertStatus | null>(null);
    const [statusRemarks, setStatusRemarks] = useState('');
    const [nextTriggerTime, setNextTriggerTime] = useState('');
    const [isRecheckEnabled, setIsRecheckEnabled] = useState(false);

    // ── Create Modal State ────────────────────────────────────────────────────
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAlertForm, setNewAlertForm] = useState<{ description: string; area: number | undefined }>({
        description: '',
        area: undefined,
    });

    // ── Handlers ─────────────────────────────────────────────────────────────
    const openStatusModal = (alert: AlertRecord, status: AlertStatus) => {
        setSelectedAlert(alert);
        setTargetStatus(status);
        setStatusRemarks('');
        setNextTriggerTime('');
        setIsRecheckEnabled(false);
        setIsStatusModalOpen(true);
    };

    const handleStatusUpdate = async () => {
        if (!selectedAlert || !targetStatus) return;

        const payload: any = { status: targetStatus, remarks: statusRemarks };

        if (targetStatus === 'acknowledged') payload.user_acknowledged = 1;
        if (targetStatus === 'suspended') {
            payload.next_trigger_time = nextTriggerTime || null;
            payload.recheck_next_trigger = isRecheckEnabled;
        }

        await updateAlertMutation.mutateAsync({ alertId: selectedAlert.originalId, data: payload });

        setIsStatusModalOpen(false);
        setSelectedAlert(null);
        setTargetStatus(null);
    };

    const handleDeleteAlert = (alert: AlertRecord, e?: React.MouseEvent) => {
        e?.stopPropagation();

        Swal.fire({
            title: 'Delete Alert?',
            text: `Are you sure you want to delete this alert? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2'
            },
            ...swalTheme,
        }).then(async (result) => {
            if (result.isConfirmed) {
                await deleteAlertMutation.mutateAsync(alert.originalId);
            }
        });
    };

    const handleCreateAlert = async () => {
        if (!newAlertForm.description || !newAlertForm.area) return;
        await createAlertMutation.mutateAsync(newAlertForm as any);
        setIsCreateModalOpen(false);
        setNewAlertForm({ description: '', area: undefined });
    };

    return {
        // mutations
        updateAlertMutation,
        deleteAlertMutation,
        createAlertMutation,
        // status modal
        isStatusModalOpen, setIsStatusModalOpen,
        selectedAlert,
        targetStatus,
        statusRemarks, setStatusRemarks,
        nextTriggerTime, setNextTriggerTime,
        isRecheckEnabled, setIsRecheckEnabled,
        openStatusModal,
        handleStatusUpdate,
        // delete handler
        handleDeleteAlert,
        // create modal
        isCreateModalOpen, setIsCreateModalOpen,
        newAlertForm, setNewAlertForm,
        handleCreateAlert,
    };
}
