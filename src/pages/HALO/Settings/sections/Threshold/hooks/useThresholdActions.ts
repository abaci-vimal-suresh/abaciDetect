import {
    useAddSensorConfiguration,
    useUpdateSensorConfiguration,
    useDeleteSensorConfiguration,
    useBulkAddSensorConfiguration,
    useSyncHaloConfigs,
    useTriggerSensor,
} from '../../../../../../api/sensors.api';
import useToasterNotification from '../../../../../../hooks/useToasterNotification';
import { SensorConfig } from '../../../../../../types/sensor';
import { SENSOR_KEY_TO_EVENT_SOURCE_KEY, SaveStatus } from '../../../../../../constants/threshold.constants';

interface UseThresholdActionsProps {
    deviceId: string;
    configs: SensorConfig[];
    formData: Partial<SensorConfig>;
    isCreatingNew: boolean;
    hasUnsavedChanges: boolean;
    selectedConfigId: number | null;
    isBulkMode: boolean;
    selectedBulkSensorIds: string[];
    selectedBulkConfigIds: string[];
    eventSources: Record<string, string>;
    setSaveStatus: (s: SaveStatus) => void;
    setHasUnsavedChanges: (v: boolean) => void;
    setIsCreatingNew: (v: boolean) => void;
    setIsConfigModalOpen: (v: boolean) => void;
    setIsBulkMode: (v: boolean) => void;
    setSelectedConfigId: (id: number | null) => void;
    setSelectedBulkSensorIds: (ids: string[]) => void;
    setSelectedBulkConfigIds: (ids: string[]) => void;
    setConfirmModal: (v: any) => void;
    initNewForm: (filteredChoices: { value: string }[]) => void;
    filteredChoices: { value: string }[];
    apiSensorIp?: string;
    apiSensorName?: string;
    getSensorLabel: (key: string) => string;
    selectedConfig?: SensorConfig;
}

export function useThresholdActions({
    deviceId,
    configs,
    formData,
    isCreatingNew,
    hasUnsavedChanges,
    selectedConfigId,
    isBulkMode,
    selectedBulkSensorIds,
    selectedBulkConfigIds,
    eventSources,
    setSaveStatus,
    setHasUnsavedChanges,
    setIsCreatingNew,
    setIsConfigModalOpen,
    setIsBulkMode,
    setSelectedConfigId,
    setSelectedBulkSensorIds,
    setSelectedBulkConfigIds,
    setConfirmModal,
    initNewForm,
    filteredChoices,
    apiSensorIp,
    apiSensorName: _apiSensorName,
    getSensorLabel,
    selectedConfig,
}: UseThresholdActionsProps) {
    const addMutation = useAddSensorConfiguration();
    const updateMutation = useUpdateSensorConfiguration();
    const deleteMutation = useDeleteSensorConfiguration();
    const syncMutation = useSyncHaloConfigs();
    const triggerMutation = useTriggerSensor();
    const bulkMutation = useBulkAddSensorConfiguration();
    const { showErrorNotification } = useToasterNotification();

    const handleTestSensor = (eventId?: string) => {
        if (!apiSensorIp) return;
        triggerMutation.mutate({
            sensorId: deviceId,
            event: eventId || 'Alert',
            ip: apiSensorIp,
        });
    };

    const handleSync = () => syncMutation.mutate(deviceId);

    const handleCreateNew = () => {
        const execute = () => {
            initNewForm(filteredChoices);
            setIsConfigModalOpen(true);
        };

        if (hasUnsavedChanges) {
            setConfirmModal({
                isOpen: true,
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Do you want to discard them and create a new configuration?',
                color: 'warning',
                onConfirm: () => {
                    execute();
                    setHasUnsavedChanges(false);
                },
            });
            return;
        }
        execute();
    };

    const handleSelectConfig = (configId: number) => {
        if (hasUnsavedChanges) {
            setConfirmModal({
                isOpen: true,
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Do you want to discard them and switch to another sensor?',
                color: 'warning',
                onConfirm: () => {
                    setSelectedConfigId(configId);
                    setIsCreatingNew(false);
                    setHasUnsavedChanges(false);
                },
            });
            return;
        }
        setSelectedConfigId(configId);
        setIsCreatingNew(false);
        setIsConfigModalOpen(true);
    };

    const handleDelete = () => {
        if (!selectedConfigId) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Configuration',
            message: `Are you sure you want to delete the configuration for ${getSensorLabel(selectedConfig?.sensor_name || '')}? This action cannot be undone.`,
            color: 'danger',
            onConfirm: () => {
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
            },
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
        addMutation,
        updateMutation,
        deleteMutation,
        syncMutation,
        triggerMutation,
        bulkMutation,
        handleTestSensor,
        handleSync,
        handleCreateNew,
        handleSelectConfig,
        handleDelete,
        handleSave,
    };
}
