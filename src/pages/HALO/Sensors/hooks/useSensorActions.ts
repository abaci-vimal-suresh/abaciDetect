import { useState } from 'react';
import { useTriggerSensor, useDeleteSensor, useUpdateSensor } from '../../../../api/sensors.api';
import Swal from 'sweetalert2';
import useDarkMode from '../../../../hooks/useDarkMode';

interface SensorRecord {
    id: number | string;
    name: string;
    ip_address?: string;
}

export function useSensorActions(onSuccess?: () => void) {
    const { darkModeStatus } = useDarkMode();

    const triggerSensorMutation = useTriggerSensor();
    const deleteSensorMutation = useDeleteSensor();
    const updateSensorMutation = useUpdateSensor();

    const swalTheme = {
        background: darkModeStatus ? '#1a1a1a' : '#fff',
        color: darkModeStatus ? '#fff' : '#000',
    };

    // ── Registration Modal State ──────────────────────────────────────────────
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

    // ── Personnel Modal State ─────────────────────────────────────────────────
    const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
    const [isSavingPersonnel, setIsSavingPersonnel] = useState(false);

    // ── Device Info Modal State ───────────────────────────────────────────────
    const [isDeviceInfoModalOpen, setIsDeviceInfoModalOpen] = useState(false);

    // ── Trigger State ────────────────────────────────────────────────────────
    const [triggeringId, setTriggeringId] = useState<number | string | null>(null);

    // ── Handlers ─────────────────────────────────────────────────────────────

    // Trigger Sensor
    const handleTriggerSensor = (sensor: SensorRecord) => {
        if (!sensor.ip_address) {
            Swal.fire({
                title: 'Trigger Failed',
                text: 'Cannot trigger sensor: IP address not configured',
                icon: 'error',
                ...swalTheme
            });
            return;
        }

        setTriggeringId(sensor.id);
        triggerSensorMutation.mutate(
            {
                sensorId: sensor.id,
                event: 'Alert',
                ip: sensor.ip_address
            },
            {
                onSettled: () => {
                    setTriggeringId(null);
                }
            }
        );
    };

    // Delete Sensor
    const handleDeleteSensor = (sensor: SensorRecord, e?: React.MouseEvent) => {
        e?.stopPropagation();

        Swal.fire({
            title: 'Delete Sensor?',
            text: `Are you sure you want to delete "${sensor.name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2'
            },
            ...swalTheme,
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSensorMutation.mutate(sensor.id, {
                    onSuccess: () => {
                        if (onSuccess) onSuccess();
                    }
                });
            }
        });
    };

    // Personnel
    const handleSavePersonnel = async (sensorId: string | number, personnelData: {
        personnel_in_charge?: string;
        personnel_contact?: string;
        personnel_email?: string;
    }) => {
        setIsSavingPersonnel(true);
        try {
            await updateSensorMutation.mutateAsync({
                sensorId,
                data: personnelData,
            });
            setIsPersonnelModalOpen(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to save personnel:', err);
        } finally {
            setIsSavingPersonnel(false);
        }
    };

    return {
        // Mutations
        triggerSensorMutation,
        deleteSensorMutation,
        updateSensorMutation,

        // Registration Modal
        isRegistrationModalOpen,
        setIsRegistrationModalOpen,

        // Delete Handler (Direct Swal)
        handleDeleteSensor,

        // Personnel Modal
        isPersonnelModalOpen,
        setIsPersonnelModalOpen,
        isSavingPersonnel,
        handleSavePersonnel,

        // Device Info Modal
        isDeviceInfoModalOpen,
        setIsDeviceInfoModalOpen,

        // Triggering
        triggeringId,
        handleTriggerSensor
    };
}

