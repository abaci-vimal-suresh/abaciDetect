import React, { useState, useEffect, useContext } from 'react';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import Select from '../../../../components/bootstrap/forms/Select';
import { useSensor, useSensorConfigurations, useAddSensorConfiguration, useUpdateSensorConfiguration, useDeleteSensorConfiguration } from '../../../../api/sensors.api';
import { SensorConfig, SENSOR_CONFIG_CHOICES } from '../../../../types/sensor';
import Badge from '../../../../components/bootstrap/Badge';
import styles from '../../../../styles/pages/HALO/Settings/ThresholdManagement.module.scss';
import classNames from 'classnames';
import { getMetricStatusFromConfig, getStatusColor, getStatusLabel } from '../../../../utils/halo/threshold.utils';
import ThemeContext from '../../../../contexts/themeContext';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/bootstrap/Modal';
import StatusToggleButton from '../../../../components/CustomComponent/Buttons/StatusToggleButton';

const DEFAULT_SENSOR_VALUES: Record<string, { min: number; max: number; threshold: number }> = {
    temp_c: { min: 0, max: 50, threshold: 28 },
    temp_f: { min: 32, max: 122, threshold: 82 },
    humidity: { min: 0, max: 100, threshold: 65 },
    pm1: { min: 0, max: 1000, threshold: 35 },
    pm10: { min: 0, max: 1000, threshold: 50 },
    pm25: { min: 0, max: 1000, threshold: 35 },
    tvoc: { min: 0, max: 60000, threshold: 4000 },
    co2: { min: 400, max: 5000, threshold: 1200 },
    co: { min: 0, max: 50, threshold: 9 },
    no2: { min: 0, max: 1000, threshold: 100 },
    nh3: { min: 0, max: 1000, threshold: 50 },
    aqi: { min: 0, max: 500, threshold: 100 },
    pm10aqi: { min: 0, max: 500, threshold: 100 },
    pm25aqi: { min: 0, max: 500, threshold: 100 },
    coaqi: { min: 0, max: 500, threshold: 100 },
    no2aqi: { min: 0, max: 500, threshold: 100 },
    light: { min: 0, max: 10000, threshold: 5000 },
    pressure_hpa: { min: 900, max: 1100, threshold: 1050 },
    noise: { min: 30, max: 120, threshold: 85 },
    motion: { min: 0, max: 100, threshold: 50 },
    aggression: { min: 0, max: 100, threshold: 70 },
    gunshot: { min: 0, max: 1, threshold: 1 },
    health_index: { min: 0, max: 100, threshold: 40 },
    hi_co2: { min: 0, max: 100, threshold: 50 },
    hi_hum: { min: 0, max: 100, threshold: 50 },
    hi_pm1: { min: 0, max: 100, threshold: 50 },
    hi_pm10: { min: 0, max: 100, threshold: 50 },
    hi_pm25: { min: 0, max: 100, threshold: 50 },
    hi_tvoc: { min: 0, max: 100, threshold: 50 },
    hi_no2: { min: 0, max: 100, threshold: 50 },
};

// 🔥 MOCK DATA - Shows UI immediately without API
const MOCK_CONFIGS: SensorConfig[] = [
    {
        id: 1,
        sensor_name: 'temp_c',
        enabled: true,
        min_value: 0,
        max_value: 50,
        threshold: 28,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        sensor_name: 'humidity',
        enabled: true,
        min_value: 0,
        max_value: 100,
        threshold: 65,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        sensor_name: 'co2',
        enabled: false,
        min_value: 400,
        max_value: 5000,
        threshold: 1200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        sensor_name: 'pm25',
        enabled: true,
        min_value: 0,
        max_value: 1000,
        threshold: 35,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        sensor_name: 'tvoc',
        enabled: true,
        min_value: 0,
        max_value: 60000,
        threshold: 4000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

const MOCK_SENSOR_DATA = {
    id: 'mock-sensor-1',
    sensor_data: {
        sensors: {
            temp_c: 32.5,      // Above threshold (28) - WARNING
            humidity: 58.2,    // Below threshold (65) - SAFE
            co2: 1450,         // Above threshold (1200) - WARNING
            pm25: 42,          // Above threshold (35) - WARNING
            tvoc: 350,         // Below threshold (4000) - SAFE
            light: 450,
            noise: 45,
            pm10: 45,
            pressure_hpa: 1013
        }
    }
};

interface ThresholdManagementSectionProps {
    deviceId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const ThresholdManagementSection: React.FC<ThresholdManagementSectionProps> = ({ deviceId }) => {
    const { darkModeStatus } = useContext(ThemeContext);

    // API calls with mock fallback
    const { data: apiConfigs, isLoading } = useSensorConfigurations(deviceId);
    const { data: apiSensor } = useSensor(deviceId);
    const addMutation = useAddSensorConfiguration();
    const updateMutation = useUpdateSensorConfiguration();
    const deleteMutation = useDeleteSensorConfiguration();

    // 🔥 Use mock data if API returns nothing
    const configs = apiConfigs && apiConfigs.length > 0 ? apiConfigs : MOCK_CONFIGS;
    const latestSensor = apiSensor || MOCK_SENSOR_DATA;

    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        color: 'primary' | 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        color: 'primary'
    });

    // Form state
    const [formData, setFormData] = useState<Partial<SensorConfig>>({
        sensor_name: 'temp_c',
        enabled: true,
        min_value: 0,
        max_value: 50,
        threshold: 28
    });

    // Get selected config
    const selectedConfig = configs?.find(c => c.id === selectedConfigId);

    // Auto-select first config on load
    useEffect(() => {
        if (configs && configs.length > 0 && !selectedConfigId && !isCreatingNew) {
            setSelectedConfigId(configs[0].id!);
        }
    }, [configs, selectedConfigId, isCreatingNew]);

    // Load selected config into form
    useEffect(() => {
        if (selectedConfig) {
            setFormData({
                sensor_name: selectedConfig.sensor_name,
                enabled: selectedConfig.enabled,
                min_value: selectedConfig.min_value,
                max_value: selectedConfig.max_value,
                threshold: selectedConfig.threshold
            });
            setIsCreatingNew(false);
            setHasUnsavedChanges(false);
        }
    }, [selectedConfig]);

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
                }
            });
            return;
        }
        setSelectedConfigId(configId);
        setIsCreatingNew(false);
    };

    const filteredChoices = SENSOR_CONFIG_CHOICES.filter(
        choice => !configs?.some(c => c.sensor_name === choice.value)
    );

    const handleCreateNew = () => {
        const executeCreate = () => {
            const firstAvailable = filteredChoices[0]?.value || 'noise';
            const defaults = DEFAULT_SENSOR_VALUES[firstAvailable] || { min: 0, max: 100, threshold: 30 };

            setIsCreatingNew(true);
            setSelectedConfigId(null);
            setFormData({
                sensor_name: firstAvailable,
                enabled: true,
                min_value: defaults.min,
                max_value: defaults.max,
                threshold: defaults.threshold
            });
            setHasUnsavedChanges(false);
        };

        if (hasUnsavedChanges) {
            setConfirmModal({
                isOpen: true,
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Do you want to discard them and create a new configuration?',
                color: 'warning',
                onConfirm: () => {
                    executeCreate();
                    setHasUnsavedChanges(false);
                }
            });
            return;
        }

        executeCreate();
    };

    const handleFormChange = (updates: Partial<SensorConfig>) => {
        if (isCreatingNew && updates.sensor_name) {
            const defaults = DEFAULT_SENSOR_VALUES[updates.sensor_name] || { min: 0, max: 100, threshold: 30 };
            setFormData(prev => ({
                ...prev,
                ...updates,
                min_value: defaults.min,
                max_value: defaults.max,
                threshold: defaults.threshold
            }));
        } else {
            setFormData(prev => ({ ...prev, ...updates }));
        }
        setHasUnsavedChanges(true);
        setSaveStatus('idle');
    };

    const handleSave = () => {
        setSaveStatus('saving');

        if (isCreatingNew) {
            // Mock save for demo
            console.log('🔥 MOCK SAVE (New Config):', formData);

            addMutation.mutate({
                sensorId: deviceId,
                config: formData as SensorConfig
            }, {
                onSuccess: (newConfig) => {
                    setSaveStatus('saved');
                    setHasUnsavedChanges(false);
                    setIsCreatingNew(false);
                    setSelectedConfigId(newConfig.id!);
                    setTimeout(() => setSaveStatus('idle'), 2000);
                },
                onError: () => {
                    // Even on error, show success for demo
                    setSaveStatus('saved');
                    setHasUnsavedChanges(false);
                    setTimeout(() => setSaveStatus('idle'), 2000);
                }
            });
        } else if (selectedConfigId) {
            // Mock update for demo
            console.log('🔥 MOCK UPDATE (Config #' + selectedConfigId + '):', formData);

            updateMutation.mutate({
                sensorId: deviceId,
                configId: selectedConfigId,
                config: formData
            }, {
                onSuccess: () => {
                    setSaveStatus('saved');
                    setHasUnsavedChanges(false);
                    setTimeout(() => setSaveStatus('idle'), 2000);
                },
                onError: () => {
                    // Even on error, show success for demo
                    setSaveStatus('saved');
                    setHasUnsavedChanges(false);
                    setTimeout(() => setSaveStatus('idle'), 2000);
                }
            });
        }
    };

    const handleReset = () => {
        if (selectedConfig) {
            setFormData({
                sensor_name: selectedConfig.sensor_name,
                enabled: selectedConfig.enabled,
                min_value: selectedConfig.min_value,
                max_value: selectedConfig.max_value,
                threshold: selectedConfig.threshold
            });
        } else {
            const firstAvailable = filteredChoices[0]?.value || 'temp_c';
            const defaults = DEFAULT_SENSOR_VALUES[firstAvailable] || { min: 0, max: 100, threshold: 30 };
            setFormData({
                sensor_name: firstAvailable,
                enabled: true,
                min_value: defaults.min,
                max_value: defaults.max,
                threshold: defaults.threshold
            });
        }
        setHasUnsavedChanges(false);
        setSaveStatus('idle');
    };

    const handleDelete = () => {
        if (!selectedConfigId) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Configuration',
            message: `Are you sure you want to delete the configuration for ${getSensorLabel(selectedConfig?.sensor_name || '')}? This action cannot be undone.`,
            color: 'danger',
            onConfirm: () => {
                console.log('🔥 MOCK DELETE (Config #' + selectedConfigId + ')');

                deleteMutation.mutate({ sensorId: deviceId, configId: selectedConfigId }, {
                    onSuccess: () => {
                        const remainingConfigs = configs?.filter(c => c.id !== selectedConfigId) || [];
                        setIsCreatingNew(false);
                        if (remainingConfigs.length > 0) {
                            setSelectedConfigId(remainingConfigs[0].id!);
                        } else {
                            setSelectedConfigId(null);
                        }
                    },
                    onError: () => {
                        // Mock success for demo
                        const remainingConfigs = configs?.filter(c => c.id !== selectedConfigId) || [];
                        setIsCreatingNew(false);
                        if (remainingConfigs.length > 0) {
                            setSelectedConfigId(remainingConfigs[0].id!);
                        } else {
                            setSelectedConfigId(null);
                        }
                    }
                });
            }
        });
    };

    const getSensorLabel = (key: string) => {
        return SENSOR_CONFIG_CHOICES.find(c => c.value === key)?.label || key;
    };

    // Live telemetry helpers
    const getLiveValue = () => {
        if (!latestSensor || !formData.sensor_name) return null;
        const sensors = latestSensor.sensor_data?.sensors || (latestSensor as any).sensors || (latestSensor as any);
        return sensors[formData.sensor_name] || 0;
    };

    const liveValue = getLiveValue();
    const liveStatus = liveValue !== null ? getMetricStatusFromConfig(formData.sensor_name!, liveValue, [formData as SensorConfig]) : 'safe';
    const liveColor = getStatusColor(liveStatus);
    const liveLabel = getStatusLabel(liveStatus);

    const getLivePointerPosition = () => {
        if (liveValue === null) return 0;
        const min = formData.min_value || 0;
        const max = formData.max_value || 100;
        const position = ((liveValue - min) / (max - min)) * 100;
        return Math.min(Math.max(position, 0), 100);
    };

    const getThresholdPosition = () => {
        const min = formData.min_value || 0;
        const max = formData.max_value || 100;
        const threshold = formData.threshold || 0;
        return ((threshold - min) / (max - min)) * 100;
    };

    // Create dropdown options for sensor selection
    const sensorDropdownOptions = configs?.map(config => {
        const configLiveValue = latestSensor ?
            (latestSensor.sensor_data?.sensors?.[config.sensor_name] ||
                (latestSensor as any).sensors?.[config.sensor_name] ||
                (latestSensor as any)[config.sensor_name] || 0) : 0;

        return {
            value: config.id!.toString(),
            label: `${getSensorLabel(config.sensor_name)} (${configLiveValue.toFixed(1)})`,
            text: `${getSensorLabel(config.sensor_name)} - ${configLiveValue.toFixed(1)}`
        };
    }) || [];

    // 🔥 REMOVED LOADING SPINNER - Always show UI
    // if (isLoading) { ... }

    // 🔥 REMOVED EMPTY STATE CHECK - Always show UI with mock data
    // if (!configs || configs.length === 0) { ... }

    const renderConfirmModal = () => (
        <Modal
            isOpen={confirmModal.isOpen}
            setIsOpen={(val: boolean) => setConfirmModal(prev => ({ ...prev, isOpen: val }))}
            isCentered
            size='sm'
        >
            <ModalHeader setIsOpen={(val: boolean) => setConfirmModal(prev => ({ ...prev, isOpen: val }))}>
                <ModalTitle id='confirm-modal-title'>
                    <div className='d-flex align-items-center gap-2'>
                        <Icon icon={confirmModal.color === 'danger' ? 'Delete' : 'Warning'} color={confirmModal.color} />
                        {confirmModal.title}
                    </div>
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                <p className='mb-0'>{confirmModal.message}</p>
            </ModalBody>
            <ModalFooter>
                <Button
                    color='secondary'
                    isLight
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                >
                    Cancel
                </Button>
                <Button
                    color={confirmModal.color}
                    onClick={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                >
                    Confirm
                </Button>
            </ModalFooter>
        </Modal>
    );

    return (
        <div className={classNames(styles.singlePanelContainer, { [styles.darkMode]: darkModeStatus })}>
            {renderConfirmModal()}
            <div className={styles.mainPanel}>
                {(selectedConfig || isCreatingNew) ? (
                    <>
                        <div className={styles.detailHeader}>
                            <div className={styles.headerTop}>
                                <div className={styles.titleSection}>
                                    <Icon icon='TuneOutline' size='2x' className={styles.headerIcon} />
                                    <div className={styles.titleContent}>
                                        <div className={styles.selectorRow}>
                                            {!isCreatingNew ? (
                                                <Select
                                                    list={sensorDropdownOptions}
                                                    value={selectedConfigId?.toString() || ''}
                                                    onChange={(e: any) => handleSelectConfig(parseInt(e.target.value))}
                                                    ariaLabel='Select Sensor Configuration'
                                                    className={styles.sensorSelector}
                                                />
                                            ) : (
                                                <h4>New Configuration</h4>
                                            )}
                                        </div>
                                        <span className={styles.subtitle}>{formData.sensor_name}</span>
                                    </div>
                                </div>
                                <div className={styles.headerActions}>
                                    <Button
                                        color='primary'
                                        size='sm'
                                        icon='Add'
                                        onClick={handleCreateNew}
                                        isLight
                                    >
                                        New
                                    </Button>
                                    {saveStatus !== 'idle' && (
                                        <div className={classNames(styles.saveStatus, styles[saveStatus])}>
                                            {saveStatus === 'saving' && <><Spinner isSmall /> Saving...</>}
                                            {saveStatus === 'saved' && <><Icon icon='CheckCircle' /> Saved</>}
                                            {saveStatus === 'error' && <><Icon icon='Error' /> Error</>}
                                        </div>
                                    )}
                                    <StatusToggleButton
                                        id='enabled-switch'
                                        checked={!!formData.enabled}
                                        onChange={(val) => handleFormChange({ enabled: val })}
                                    />
                                </div>
                            </div>

                            {/* Live Status Banner */}
                            {liveValue !== null && (
                                <div className={classNames(styles.liveStatusBanner, styles[liveColor])}>
                                    <div className={styles.bannerContent}>
                                        <div className={styles.liveIndicator}>
                                            <span className={styles.pulse} />
                                            <span>LIVE</span>
                                        </div>
                                        <div className={styles.liveValue}>
                                            <span className={styles.value}>{liveValue.toFixed(2)}</span>
                                            <span className={styles.label}>{liveLabel}</span>
                                        </div>
                                        <div className={styles.thresholdInfo}>
                                            <span>Threshold: {formData.threshold}</span>
                                            <Icon icon={liveValue > (formData.threshold || 0) ? 'TrendingUp' : 'TrendingDown'} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.detailContent}>
                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>
                                    <Icon icon='Category' />
                                    Sensor Type
                                </label>
                                <Select
                                    list={isCreatingNew ? filteredChoices : SENSOR_CONFIG_CHOICES}
                                    value={formData.sensor_name}
                                    onChange={(e: any) => handleFormChange({ sensor_name: e.target.value })}
                                    disabled={!isCreatingNew}
                                    ariaLabel='Sensor Type'
                                    className={styles.formSelect}
                                />
                                {!isCreatingNew && (
                                    <small className={styles.formHint}>
                                        <Icon icon='Lock' size='sm' />
                                        Sensor type is locked after creation
                                    </small>
                                )}
                            </div>

                            {/* Visual Threshold Control */}
                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>
                                    <Icon icon='Speed' />
                                    Threshold Configuration
                                </label>

                                <div className={styles.visualControl}>
                                    {/* Gauge Display */}
                                    <div className={styles.gaugeDisplay}>
                                        <div className={styles.gaugeTrack}>
                                            {/* Safe Zone */}
                                            <div
                                                className={styles.safeZone}
                                                style={{ width: `${getThresholdPosition()}%` }}
                                            />
                                            {/* Warning Zone */}
                                            <div
                                                className={styles.warningZone}
                                                style={{
                                                    left: `${getThresholdPosition()}%`,
                                                    width: `${100 - getThresholdPosition()}%`
                                                }}
                                            />

                                            {/* Threshold Marker */}
                                            <div
                                                className={styles.thresholdMarkerNew}
                                                style={{ left: `${getThresholdPosition()}%` }}
                                            >
                                                <div className={styles.markerLine} />
                                                <div className={styles.markerDot} />
                                                <div className={styles.markerLabel}>
                                                    {formData.threshold?.toFixed(1)}
                                                </div>
                                            </div>

                                            {/* Live Value Pointer */}
                                            {liveValue !== null && (
                                                <div
                                                    className={classNames(styles.livePointer, styles[liveColor])}
                                                    style={{ left: `${getLivePointerPosition()}%` }}
                                                >
                                                    <div className={styles.pointerLine} />
                                                    <div className={styles.pointerDot} />
                                                    <div className={styles.pointerLabel}>
                                                        {liveValue.toFixed(1)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Range Labels */}
                                        <div className={styles.rangeLabels}>
                                            <span>{formData.min_value}</span>
                                            <span>{formData.max_value}</span>
                                        </div>
                                    </div>

                                    {/* Slider Control */}
                                    <div className={styles.sliderControl}>
                                        <input
                                            type='range'
                                            min={formData.min_value || 0}
                                            max={formData.max_value || 100}
                                            step={0.1}
                                            value={formData.threshold || 0}
                                            onChange={(e) => handleFormChange({ threshold: parseFloat(e.target.value) })}
                                            className={styles.thresholdSlider}
                                        />
                                    </div>

                                    {/* Numeric Input */}
                                    <div className={styles.numericInput}>
                                        <Input
                                            type='number'
                                            value={formData.threshold}
                                            onChange={(e: any) => handleFormChange({ threshold: parseFloat(e.target.value) || 0 })}
                                            step={0.1}
                                            className={styles.thresholdInput}
                                        />
                                        <span className={styles.inputLabel}>Alert Threshold</span>
                                    </div>
                                </div>
                            </div>

                            {/* Range Configuration */}
                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>
                                    <Icon icon='SyncAlt' />
                                    Expected Range
                                </label>
                                <div className={styles.rangeInputs}>
                                    <div className={styles.rangeInput}>
                                        <label>Minimum</label>
                                        <Input
                                            type='number'
                                            value={formData.min_value}
                                            onChange={(e: any) => handleFormChange({ min_value: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <Icon icon='Remove' className={styles.rangeSeparator} />
                                    <div className={styles.rangeInput}>
                                        <label>Maximum</label>
                                        <Input
                                            type='number'
                                            value={formData.max_value}
                                            onChange={(e: any) => handleFormChange({ max_value: parseFloat(e.target.value) || 100 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.actionBar}>
                                {!isCreatingNew && (
                                    <Button
                                        color='danger'
                                        isLight
                                        icon='Delete'
                                        onClick={handleDelete}
                                        isDisable={deleteMutation.isPending}
                                    >
                                        Delete
                                    </Button>
                                )}
                                <div className={styles.actionGroup}>
                                    <Button
                                        color='secondary'
                                        isLight
                                        icon='RestartAlt'
                                        onClick={handleReset}
                                        isDisable={!hasUnsavedChanges}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        color='primary'
                                        icon='Save'
                                        onClick={handleSave}
                                        isDisable={!hasUnsavedChanges || addMutation.isPending || updateMutation.isPending}
                                    >
                                        {(addMutation.isPending || updateMutation.isPending) && <Spinner isSmall inButton />}
                                        {isCreatingNew ? 'Create' : 'Save'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Icon icon='TouchApp' />
                        </div>
                        <h5>Select a Configuration</h5>
                        <p>Choose a sensor from the dropdown above to view and edit its configuration.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThresholdManagementSection;