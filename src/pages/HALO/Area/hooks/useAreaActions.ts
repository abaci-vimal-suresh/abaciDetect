import { useState } from 'react';
import {
    useCreateArea,
    useCreateSubArea,
    useUpdateArea,
    useDeleteArea,
    useUpdateSensor
} from '../../../../api/sensors.api';
import Swal from 'sweetalert2';
import { Area } from '../../../../types/sensor';
import useDarkMode from '../../../../hooks/useDarkMode';

export function useAreaActions() {
    const { darkModeStatus } = useDarkMode();

    // ── Mutations ────────────────────────────────────────────────────────────
    const createAreaMutation = useCreateArea();
    const createSubAreaMutation = useCreateSubArea();
    const updateAreaMutation = useUpdateArea();
    const deleteAreaMutation = useDeleteArea();
    const updateSensorMutation = useUpdateSensor();

    const swalTheme = {
        background: darkModeStatus ? '#1a1a1a' : '#fff',
        color: darkModeStatus ? '#fff' : '#000',
    };

    // ── UI State ─────────────────────────────────────────────────────────────
    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
    const [isSubAreaModalOpen, setIsSubAreaModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);

    // ── Handlers ─────────────────────────────────────────────────────────────

    // Create Top-level Area
    const handleCreateArea = (formData: FormData) => {
        createAreaMutation.mutate(formData, {
            onSuccess: () => {
                setIsAreaModalOpen(false);
                if (localStorage.getItem('showGuidedTour') === 'active') {
                    setIsSuccessModalOpen(true);
                }
            },
        });
    };

    // Create Sub-Area
    const handleCreateSubArea = (formData: FormData, activeId: string | undefined) => {
        if (activeId) {
            formData.append('parent_id', activeId);
        }
        createSubAreaMutation.mutate(formData, {
            onSuccess: () => {
                setIsSubAreaModalOpen(false);
            },
        });
    };

    // Edit Area
    const handleOpenEditModal = (e: React.MouseEvent | null, area: Area) => {
        e?.stopPropagation();
        setEditingArea(area);
        setIsEditModalOpen(true);
    };

    // Delete Area
    const handleDeleteArea = (area: Area, e?: React.MouseEvent) => {
        e?.stopPropagation();

        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete "${area.name}". This action cannot be undone and may affect sensors assigned to this area.`,
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
                deleteAreaMutation.mutate(area.id);
            }
        });
    };

    // Add/Update Sensor Assignment
    const handleAddSensor = ({
        sensorId,
        targetAreaId,
        x, y, z
    }: {
        sensorId: string;
        targetAreaId: string;
        x: number;
        y: number;
        z: number
    }) => {
        updateSensorMutation.mutate(
            { sensorId, data: { area: Number(targetAreaId), x_val: x, y_val: y, z_val: z } },
            { onSuccess: () => setIsSensorModalOpen(false) },
        );
    };

    // Unassign Sensor
    const handleUnassignSensor = (e: React.MouseEvent, sensor: any) => {
        e.stopPropagation();

        Swal.fire({
            title: 'Unassign Sensor?',
            text: `Remove "${sensor.name}" from this area?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, unassign',
            cancelButtonText: 'Cancel',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2'
            },
            ...swalTheme,
        }).then(r => {
            if (r.isConfirmed) {
                updateSensorMutation.mutate({ sensorId: sensor.id, data: { area: null } });
            }
        });
    };

    return {
        // States
        isAreaModalOpen,
        setIsAreaModalOpen,
        isSubAreaModalOpen,
        setIsSubAreaModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isSensorModalOpen,
        setIsSensorModalOpen,
        isSuccessModalOpen,
        setIsSuccessModalOpen,
        editingArea,
        setEditingArea,

        // Handlers
        handleCreateArea,
        handleCreateSubArea,
        handleOpenEditModal,
        handleDeleteArea,
        handleAddSensor,
        handleUnassignSensor,

        // Mutations (for loading states if needed)
        createAreaMutation,
        createSubAreaMutation,
        updateAreaMutation,
        deleteAreaMutation,
        updateSensorMutation
    };
}
