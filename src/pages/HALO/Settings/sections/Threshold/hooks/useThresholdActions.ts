import { useState, useEffect } from 'react';
import {
    useAddSensorConfiguration,
    useUpdateSensorConfiguration,
    useDeleteSensorConfiguration,
    useBulkAddSensorConfiguration,
    useSyncHaloConfigs,
    useTriggerSensor,
} from '../../../../../../api/sensors.api';
import useToasterNotification from '../../../../../../hooks/useToasterNotification';
import { SensorConfig, SENSOR_CONFIG_CHOICES } from '../../../../../../types/sensor';
import {
    SENSOR_KEY_TO_EVENT_SOURCE_KEY,
    SaveStatus,
    DEFAULT_FORM_DATA,
    DEFAULT_SENSOR_VALUES,
} from '../../../../../../constants/threshold.constants';
import Swal from 'sweetalert2';
import useDarkMode from '../../../../../../hooks/useDarkMode';

interface UseThresholdActionsProps {
    deviceId: string;
    configs: SensorConfig[];
    eventSources: Record<string, string>;
    apiSensorIp?: string;
}

export function useThresholdActions({
    deviceId,
    configs,
    eventSources,
    apiSensorIp,
}: UseThresholdActionsProps) {
    const { darkModeStatus } = useDarkMode();

    const addMutation = useAddSensorConfiguration();
    const updateMutation = useUpdateSensorConfiguration();
    const deleteMutation = useDeleteSensorConfiguration();
    const syncMutation = useSyncHaloConfigs();
    const triggerMutation = useTriggerSensor();
    const bulkMutation = useBulkAddSensorConfiguration();
    const { showErrorNotification } = useToasterNotification();

    const swalTheme = {
        background: darkModeStatus ? '#1a1a1a' : '#fff',
        color: darkModeStatus ? '#fff' : '#000',
    };

    // ── Local States ─────────────────────────────────────────────────────────
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [formData, setFormData] = useState<Partial<SensorConfig>>(DEFAULT_FORM_DATA);
    const [selectedBulkSensorIds, setSelectedBulkSensorIds] = useState<string[]>([deviceId]);
    const [selectedBulkConfigIds, setSelectedBulkConfigIds] = useState<string[]>([]);

    const selectedConfig = configs?.find(c => c.id === selectedConfigId);

    // ── Effects ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (selectedConfig) {
            setFormData({
                sensor_name: selectedConfig.sensor_name || '',
                event_id: selectedConfig.event_id || '',
                min_value: selectedConfig.min_value,
                max_value: selectedConfig.max_value,
                threshold: selectedConfig.threshold,
                enabled: selectedConfig.enabled,
                led_color: selectedConfig.led_color || selectedConfig.ledclr || 16777215,
                led_pattern: selectedConfig.led_pattern || selectedConfig.ledpat || 200004,
                led_priority: selectedConfig.led_priority || selectedConfig.ledprority || 1,
                relay1: selectedConfig.relay1 || selectedConfig.relay || 0,
                sound: selectedConfig.sound || '',
                source: selectedConfig.source || '',
                pause_minutes: selectedConfig.pause_minutes || selectedConfig.pause || 0,
            });
            setIsCreatingNew(false);
            setHasUnsavedChanges(false);
        }
    }, [selectedConfig]);

    // ── Form Handlers ────────────────────────────────────────────────────────
    const handleFormChange = (updates: Partial<SensorConfig>) => {
        if (isCreatingNew && updates.sensor_name) {
            const defaults = DEFAULT_SENSOR_VALUES[updates.sensor_name] || { min: 0, max: 100, threshold: 30 };
            setFormData(prev => ({
                ...prev,
                ...updates,
                min_value: defaults.min,
                max_value: defaults.max,
                threshold: defaults.threshold,
            }));
        } else {
            setFormData(prev => ({ ...prev, ...updates }));
        }
        setHasUnsavedChanges(true);
        setSaveStatus('idle');
    };

    const initNewForm = (filteredChoices: { value: string }[]) => {
        const firstAvailable = filteredChoices[0]?.value || 'noise';
        const defaults = DEFAULT_SENSOR_VALUES[firstAvailable] || { min: 0, max: 100, threshold: 30 };
        setIsCreatingNew(true);
        setFormData({
            sensor_name: '',
            event_id: '',
            min_value: defaults.min,
            max_value: defaults.max,
            threshold: defaults.threshold,
            led_color: 16777215,
            led_pattern: 200004,
            led_priority: 1,
            relay1: 0,
            sound: '',
            source: '',
            pause_minutes: 0,
        });
        setHasUnsavedChanges(false);
    };

    // ── Action Handlers ──────────────────────────────────────────────────────
    const handleTestSensor = (eventId?: string) => {
        if (!apiSensorIp) return;
        triggerMutation.mutate({
            sensorId: deviceId,
            event: eventId || 'Alert',
            ip: apiSensorIp,
        });
    };

    const handleSync = () => syncMutation.mutate(deviceId);

    const handleCreateNew = (filteredChoices: { value: string }[]) => {
        const execute = () => {
            initNewForm(filteredChoices);
            setIsConfigModalOpen(true);
        };

        if (hasUnsavedChanges) {
            Swal.fire({
                title: 'Unsaved Changes',
                text: 'You have unsaved changes. Do you want to discard them and create a new configuration?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Discard & Create',
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'btn btn-warning mx-2',
                    cancelButton: 'btn btn-secondary mx-2'
                },
                ...swalTheme
            }).then((result) => {
                if (result.isConfirmed) {
                    execute();
                    setHasUnsavedChanges(false);
                }
            });
            return;
        }
        execute();
    };

    const handleSelectConfig = (configId: number) => {
        if (hasUnsavedChanges) {
            Swal.fire({
                title: 'Unsaved Changes',
                text: 'You have unsaved changes. Do you want to discard them and switch to another configuration?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Discard & Switch',
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'btn btn-warning mx-2',
                    cancelButton: 'btn btn-secondary mx-2'
                },
                ...swalTheme
            }).then((result) => {
                if (result.isConfirmed) {
                    setSelectedConfigId(configId);
                    setIsCreatingNew(false);
                    setHasUnsavedChanges(false);
                    setIsConfigModalOpen(true);
                }
            });
            return;
        }
        setSelectedConfigId(configId);
        setIsCreatingNew(false);
        setIsConfigModalOpen(true);
    };

    const getSensorLabel = (key: string) =>
        SENSOR_CONFIG_CHOICES.find((c) => c.value === key)?.label || key;

    const handleDelete = () => {
        if (!selectedConfigId) return;

        Swal.fire({
            title: 'Delete Configuration?',
            text: `Are you sure you want to delete the configuration for ${getSensorLabel(selectedConfig?.sensor_name || '')}? This action cannot be undone.`,
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
                const fallback = () => {
                    const remaining = configs?.filter(c => c.id !== selectedConfigId) || [];
                    setIsCreatingNew(false);
                    if (remaining.length > 0) {
                        setSelectedConfigId(remaining[0].id!);
                    } else {
                        setSelectedConfigId(null);
                    }
                };

                deleteMutation.mutate(
                    { sensorId: deviceId, configId: selectedConfigId },
                    { onSuccess: fallback, onError: fallback },
                );
            }
        });
    };

    const handleSave = async () => {
        if (isBulkMode) {
            if (selectedBulkSensorIds.length === 0 || selectedBulkConfigIds.length === 0) {
                showErrorNotification('Please select at least one target sensor and one configuration template.');
                return;
            }

            try {
                await bulkMutation.mutateAsync({
                    sensor_id: selectedBulkSensorIds,
                    config_ids: selectedBulkConfigIds.map(id => parseInt(id)),
                });
                setSaveStatus('saved');
                setTimeout(() => {
                    setSaveStatus('idle');
                    setIsConfigModalOpen(false);
                    setIsBulkMode(false);
                    setSelectedBulkSensorIds([deviceId]);
                    setSelectedBulkConfigIds([]);
                }, 1500);
            } catch (error) {
                console.error('Bulk copy failed:', error);
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
            return;
        }

        setSaveStatus('saving');

        const eventName = formData.event_id || (formData.sensor_name || '')
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join('_');

        const sourceMappingKey = SENSOR_KEY_TO_EVENT_SOURCE_KEY[formData.sensor_name || ''] || eventName;
        const autoSource = eventSources[sourceMappingKey] || eventSources[eventName] || '';
        const bnInstance = 1000 + parseInt(Date.now().toString().slice(-5));

        const payload = {
            halo_sensor: parseInt(deviceId),
            event_id: eventName,
            bn_instance: bnInstance,
            enabled: formData.enabled ?? true,
            threshold: formData.threshold,
            min_value: formData.min_value,
            max_value: formData.max_value,
            led_color: formData.led_color,
            led_pattern: formData.led_pattern,
            led_priority: formData.led_priority,
            relay1: formData.relay1,
            source: autoSource,
            conditions: '',
            pause_minutes: formData.pause_minutes,
            sound: formData.sound || '',
        };

        if (isCreatingNew) {
            addMutation.mutate(
                { sensorId: deviceId, config: payload as SensorConfig },
                {
                    onSuccess: (newConfig) => {
                        setSaveStatus('saved');
                        setHasUnsavedChanges(false);
                        setIsCreatingNew(false);
                        setSelectedConfigId(newConfig.id!);
                        setTimeout(() => {
                            setSaveStatus('idle');
                            setIsConfigModalOpen(false);
                        }, 1000);
                    },
                    onError: () => {
                        setSaveStatus('error');
                        setTimeout(() => setSaveStatus('idle'), 2000);
                    },
                },
            );
        } else if (selectedConfigId) {
            updateMutation.mutate(
                { sensorId: deviceId, configId: selectedConfigId, config: payload },
                {
                    onSuccess: () => {
                        setSaveStatus('saved');
                        setHasUnsavedChanges(false);
                        setTimeout(() => setSaveStatus('idle'), 2000);
                    },
                    onError: () => {
                        setSaveStatus('error');
                        setTimeout(() => setSaveStatus('idle'), 2000);
                    },
                },
            );
        }
    };

    return {
        // Shared State
        isConfigModalOpen, setIsConfigModalOpen,
        isBulkMode, setIsBulkMode,
        selectedConfigId, setSelectedConfigId,
        isCreatingNew, setIsCreatingNew,
        saveStatus, setSaveStatus,
        hasUnsavedChanges, setHasUnsavedChanges,
        formData, setFormData,
        selectedBulkSensorIds, setSelectedBulkSensorIds,
        selectedBulkConfigIds, setSelectedBulkConfigIds,
        selectedConfig,

        // Handlers
        handleFormChange,
        handleTestSensor,
        handleSync,
        handleCreateNew,
        handleSelectConfig,
        handleDelete,
        handleSave,

        // Mutations
        syncMutation,
        triggerMutation,
    };
}


