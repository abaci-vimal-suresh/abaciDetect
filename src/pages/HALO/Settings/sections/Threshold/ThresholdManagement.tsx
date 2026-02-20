import React, { useState, useEffect, useContext } from 'react';
import classNames from 'classnames';
import {
    useSensor,
    useSensorConfigurations,
    useRemoteSensorConfig,
    useUpdateSensorConfiguration,
    useUsers,
    useUserGroups,
    useSoundFiles,
    useSensors,
} from '../../../../../api/sensors.api';
import { SensorConfig, SENSOR_CONFIG_CHOICES } from '../../../../../types/sensor';
import styles from '../../../../../styles/pages/HALO/Settings/ThresholdManagement.module.scss';
import ThemeContext from '../../../../../contexts/themeContext';
import {
    BULK_SUB_TYPES,
    MOCK_SENSOR_DATA,
    ThresholdManagementSectionProps,
} from '../../../../../constants/threshold.constants';
import { getMetricStatusFromConfig, getStatusColor, getStatusLabel } from '../../../../../helpers/thresholdUtils';

import { useThresholdForm } from './hooks/useThresholdForm';
import { useThresholdActions } from './hooks/useThresholdActions';
import { ConfirmModalState } from './modals/ConfirmModal';
import ConfirmModal from './modals/ConfirmModal';
import ConfigModal from './modals/ConfigModal';
import ThresholdTable from './components/ThresholdTable';

const ThresholdManagement: React.FC<ThresholdManagementSectionProps> = ({ deviceId }) => {
    const { darkModeStatus } = useContext(ThemeContext);

    const { data: apiConfigs, isLoading } = useSensorConfigurations(deviceId);
    const { data: apiSensor } = useSensor(deviceId);
    const { data: remoteConfig } = useRemoteSensorConfig(apiSensor?.sensor_type as string);
    const updateMutation = useUpdateSensorConfiguration();
    const { data: soundFiles } = useSoundFiles();
    const { data: _users } = useUsers();
    const { data: _userGroups } = useUserGroups();

    const configs: SensorConfig[] = apiConfigs || [];
    const latestSensor = apiSensor || MOCK_SENSOR_DATA;
    const eventSources = remoteConfig?.event_sources || {};
    const sensorConfigChoices =
        remoteConfig?.data?.sensors.map((s: any) => ({ value: s.sensor_key, label: s.sensor_name })) ||
        SENSOR_CONFIG_CHOICES;
    const wavefiles =
        soundFiles?.map((f: any) => ({ value: f.file_name || f.name, label: f.name })) || [];

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkDeviceType, setBulkDeviceType] = useState<string>('Halo');
    const [bulkSubType, setBulkSubType] = useState<string>('HALO_3C');
    const [selectedBulkSensorIds, setSelectedBulkSensorIds] = useState<string[]>([deviceId]);
    const [selectedBulkConfigIds, setSelectedBulkConfigIds] = useState<string[]>([]);
    const [selectedSourceSensorId, setSelectedSourceSensorId] = useState<string>(deviceId);

    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        color: 'primary',
    });

    // ── Bulk API ─────────────────────────────────────────────────────────────
    const { data: bulkSensors } = useSensors({ sensor_type: bulkSubType });
    const { data: sourceConfigs, isLoading: isFetchingSourceConfigs } =
        useSensorConfigurations(selectedSourceSensorId);

    // ── Form hook ────────────────────────────────────────────────────────────
    const filteredChoices = sensorConfigChoices.filter(
        (choice: any) => !configs?.some((c: any) => c.sensor_name === choice.value),
    );

    const form = useThresholdForm({ configs, selectedConfigId });

    // Auto-select first config on load
    useEffect(() => {
        if (configs && configs.length > 0 && !selectedConfigId && !form.isCreatingNew) {
            setSelectedConfigId(configs[0].id!);
        }
    }, [configs, selectedConfigId, form.isCreatingNew]);

    // ── Actions hook ─────────────────────────────────────────────────────────
    const actions = useThresholdActions({
        deviceId,
        configs,
        formData: form.formData,
        isCreatingNew: form.isCreatingNew,
        hasUnsavedChanges: form.hasUnsavedChanges,
        selectedConfigId,
        isBulkMode,
        selectedBulkSensorIds,
        selectedBulkConfigIds,
        eventSources,
        setSaveStatus: form.setSaveStatus,
        setHasUnsavedChanges: form.setHasUnsavedChanges,
        setIsCreatingNew: form.setIsCreatingNew,
        setIsConfigModalOpen,
        setIsBulkMode,
        setSelectedConfigId,
        setSelectedBulkSensorIds,
        setSelectedBulkConfigIds,
        setConfirmModal,
        initNewForm: form.initNewForm,
        filteredChoices,
        apiSensorIp: apiSensor?.ip_address,
        apiSensorName: apiSensor?.name,
        getSensorLabel: (key: string) =>
            SENSOR_CONFIG_CHOICES.find((c) => c.value === key)?.label || key,
        selectedConfig: form.selectedConfig,
    });

    // ── Helpers ──────────────────────────────────────────────────────────────
    const displaySensorName = (name: string) =>
        SENSOR_CONFIG_CHOICES.find((c) => c.value === name)?.label ||
        sensorConfigChoices.find((c: any) => c.value === name)?.label ||
        name;

    const getSoundLabel = (fileName: string) =>
        soundFiles?.find((f: any) => f.file_name === fileName || f.name === fileName)?.name || fileName;

    // ── Live telemetry ───────────────────────────────────────────────────────
    const getLiveValue = () => {
        if (!latestSensor || !form.formData.sensor_name) return null;
        const sensors =
            latestSensor.sensor_data?.sensors ||
            (latestSensor as any).sensors ||
            (latestSensor as any);
        return sensors[form.formData.sensor_name] ?? 0;
    };

    const liveValue = getLiveValue();
    const liveStatus =
        liveValue !== null
            ? getMetricStatusFromConfig(form.formData.sensor_name!, liveValue, [form.formData as SensorConfig])
            : 'safe';
    const liveColor = getStatusColor(liveStatus);
    const liveLabel = getStatusLabel(liveStatus);

    const getLivePointerPosition = () => {
        if (liveValue === null) return 0;
        const min = form.formData.min_value || 0;
        const max = form.formData.max_value || 100;
        return Math.min(Math.max(((liveValue - min) / (max - min)) * 100, 0), 100);
    };

    const getThresholdPosition = () => {
        const min = form.formData.min_value || 0;
        const max = form.formData.max_value || 100;
        const threshold = form.formData.threshold || 0;
        return ((threshold - min) / (max - min)) * 100;
    };

    return (
        <div className={classNames(styles.singlePanelContainer, { [styles.darkMode]: darkModeStatus })}>
            <div className={styles.mainPanel}>
                <ThresholdTable
                    configs={configs}
                    isLoading={isLoading}
                    apiSensorName={apiSensor?.name}
                    deviceId={deviceId}
                    displaySensorName={displaySensorName}
                    getSoundLabel={getSoundLabel}
                    onEdit={(configId) => {
                        setSelectedConfigId(configId);
                        setIsConfigModalOpen(true);
                    }}
                    onDelete={(configId) => {
                        setSelectedConfigId(configId);
                        actions.handleDelete();
                    }}
                    onToggleEnabled={(rowData) => {
                        updateMutation.mutate({
                            sensorId: deviceId,
                            configId: rowData.id!,
                            config: { ...rowData, enabled: !rowData.enabled },
                        });
                    }}
                    onTestSensor={actions.handleTestSensor}
                    onSync={actions.handleSync}
                    onCreateNew={actions.handleCreateNew}
                    isSyncPending={actions.syncMutation.isPending}
                    isTriggerPending={actions.triggerMutation.isPending}
                    hasIpAddress={!!apiSensor?.ip_address}
                />
            </div>

            <ConfigModal
                isOpen={isConfigModalOpen}
                setIsOpen={setIsConfigModalOpen}
                isBulkMode={isBulkMode}
                setIsBulkMode={setIsBulkMode}
                isCreatingNew={form.isCreatingNew}
                formData={form.formData}
                handleFormChange={form.handleFormChange}
                saveStatus={form.saveStatus}
                hasUnsavedChanges={form.hasUnsavedChanges}
                handleSave={actions.handleSave}
                handleDelete={actions.handleDelete}
                getThresholdPosition={getThresholdPosition}
                getLivePointerPosition={getLivePointerPosition}
                liveValue={liveValue}
                liveColor={liveColor}
                liveLabel={liveLabel}
                sensorConfigChoices={sensorConfigChoices}
                wavefiles={wavefiles}
                displaySensorName={displaySensorName}
                bulkDeviceType={bulkDeviceType}
                setBulkDeviceType={(v) => {
                    setBulkDeviceType(v);
                    setBulkSubType(BULK_SUB_TYPES[v][0]?.value || '');
                    setSelectedBulkSensorIds([]);
                }}
                bulkSubType={bulkSubType}
                setBulkSubType={(v) => {
                    setBulkSubType(v);
                    setSelectedBulkSensorIds([]);
                }}
                selectedSourceSensorId={selectedSourceSensorId}
                setSelectedSourceSensorId={(v) => {
                    setSelectedSourceSensorId(v);
                    setSelectedBulkConfigIds([]);
                }}
                selectedBulkSensorIds={selectedBulkSensorIds}
                selectedBulkConfigIds={selectedBulkConfigIds}
                setSelectedBulkConfigIds={setSelectedBulkConfigIds}
                bulkSensors={bulkSensors as any}
                sourceConfigs={sourceConfigs}
                isFetchingSourceConfigs={isFetchingSourceConfigs}
                configs={configs}
                targetSensorName={apiSensor?.name}
            />

            <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
        </div>
    );
};

export default ThresholdManagement;
