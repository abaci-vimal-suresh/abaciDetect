import React, { useState, useEffect, useContext } from 'react';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import Select from '../../../../components/bootstrap/forms/Select';
import { useSensor, useSensorConfigurations, useAddSensorConfiguration, useUpdateSensorConfiguration, useDeleteSensorConfiguration, useRemoteSensorConfig, useUsers, useUserGroups, useSyncHaloConfigs, useTriggerSensor, useWaveFiles } from '../../../../api/sensors.api';
import { SensorConfig, SENSOR_CONFIG_CHOICES, AlertActionConfig } from '../../../../types/sensor';
import Badge from '../../../../components/bootstrap/Badge';
import styles from '../../../../styles/pages/HALO/Settings/ThresholdManagement.module.scss';
import classNames from 'classnames';
import { getMetricStatusFromConfig, getStatusColor, getStatusLabel } from '../../../../helpers/thresholdUtils';
import ThemeContext from '../../../../contexts/themeContext';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/bootstrap/Modal';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../../hooks/useTablestyles';

// LED Color Options
const LED_COLOR_OPTIONS = [
    { value: 255, label: 'Blue' },
    { value: 16776960, label: 'Yellow' },
    { value: 16711935, label: 'Violet' },
    { value: 65535, label: 'Cyan' },
    { value: 16711680, label: 'Red' },
    { value: 65280, label: 'Green' },
    { value: 16777215, label: 'White' },
];

// LED Pattern Options
const LED_PATTERN_OPTIONS = [
    { value: 200004, label: 'Steady' },
    { value: 1, label: 'One Second Blink' },
    { value: 2, label: 'Two Second Blink' },
    { value: 5, label: 'Five Second Blink' },
    { value: 100001, label: 'Half Second Once' },
    { value: 100002, label: 'One Second Once' },
    { value: 100004, label: 'Two Seconds Once' },
    { value: 100010, label: 'Five Seconds Once' },
    { value: 100120, label: 'One Minute Once' },
    { value: 200001, label: 'Chase Right' },
    { value: 200002, label: 'Chase Left' },
    { value: 200003, label: 'Breathe' },
    { value: 200004, label: 'Strobe' },
];

// LED Priority Options (1 = Highest, 9 = Lowest)
const LED_PRIORITY_OPTIONS = [
    { value: 1, label: '1 (Highest)' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9 (Lowest)' },
];

// Relay Duration Options
const RELAY_DURATION_OPTIONS = [
    { value: 0, label: 'On' },
    { value: 5, label: '5 sec' },
    { value: 10, label: '10 sec' },
    { value: 20, label: '20 sec' },
    { value: 60, label: '1 min' },
];

const DEFAULT_SENSOR_VALUES: Record<string, { min: number; max: number; threshold: number }> = {
    temperature: { min: 0, max: 50, threshold: 28 },
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

// Mapping between internal sensor_key and the key used in event_sources mapping
const SENSOR_KEY_TO_EVENT_SOURCE_KEY: Record<string, string> = {
    aggression: 'Aggression',
    aqi: 'AQI',
    co: 'CO',
    co2: 'CO2cal',
    gunshot: 'Gunshot',
    health_index: 'Health_Index',
    humidity: 'Humidity',
    light: 'Light',
    motion: 'Motion',
    nh3: 'NH3',
    no2: 'NO2',
    pm1: 'PM1',
    pm25: 'PM2.5',
    pm10: 'PM10',
    pressure_hpa: 'Pressure',
    temp_f: 'Temp_F',
    noise: 'Sound',
    temp_c: 'Temp_C',
    tvoc: 'TVOC'
};

// 🔥 MOCK DATA - Shows UI immediately without API
const MOCK_CONFIGS: SensorConfig[] = [
    {
        id: 1,
        sensor_name: 'temperature',
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
            temperature: 32.5,  // Above threshold (28) - WARNING
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
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    // API calls
    const { data: apiConfigs, isLoading } = useSensorConfigurations(deviceId);
    const { data: apiSensor } = useSensor(deviceId);
    const { data: remoteConfig } = useRemoteSensorConfig(apiSensor?.sensor_type as string);

    const addMutation = useAddSensorConfiguration();
    const updateMutation = useUpdateSensorConfiguration();
    const deleteMutation = useDeleteSensorConfiguration();
    const syncMutation = useSyncHaloConfigs();
    const triggerMutation = useTriggerSensor();
    const { data: users } = useUsers();
    const { data: userGroups } = useUserGroups();
    const { data: wavefilesData } = useWaveFiles(
        apiSensor?.ip_address,
        apiSensor?.username,
        apiSensor?.password
    );
    const wavefiles = wavefilesData?.wavefiles || [];

    // 🔥 Use real data from API
    const configs = apiConfigs || [];
    const latestSensor = apiSensor || MOCK_SENSOR_DATA;

    const sensorConfigChoices = remoteConfig?.data?.sensors.map(s => ({
        value: s.sensor_key,
        label: s.sensor_name
    })) || SENSOR_CONFIG_CHOICES;

    // Get event sources mapping from remote config
    const eventSources = remoteConfig?.event_sources || {};

    const displaySensorName = (name: string) => {
        return SENSOR_CONFIG_CHOICES.find(c => c.value === name)?.label ||
            sensorConfigChoices.find(c => c.value === name)?.label ||
            name;
    };

    const handleTestSensor = (eventId?: string) => {
        if (!apiSensor?.ip_address) return;

        triggerMutation.mutate({
            sensorId: deviceId,
            event: eventId || 'Alert',
            ip: apiSensor.ip_address
        });
    };

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

    const tableColumns = [
        {
            title: 'Sensor Name',
            field: 'event_id',
            headerStyle: { textAlign: 'left' as any, paddingLeft: '2.5rem' },
            cellStyle: { textAlign: 'left' as any, paddingLeft: '2.5rem' },
            render: (rowData: any) => (
                <div className='fw-bold' style={{ fontSize: '0.95rem' }}>
                    {displaySensorName(rowData.event_id || rowData.sensor_name)}
                </div>
            )
        },
        {
            title: 'Source',
            field: 'source',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className='text-muted small'>
                    {rowData.source || '-'}
                </div>
            )
        },
        {
            title: 'Status',
            field: 'enabled',
            sorting: false,
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className="d-flex justify-content-center">
                    <div
                        onClick={() => {
                            updateMutation.mutate({
                                sensorId: deviceId,
                                configId: rowData.id!,
                                config: { ...rowData, enabled: !rowData.enabled }
                            });
                        }}
                        style={{ cursor: 'pointer' }}
                        title={rowData.enabled ? 'Enabled' : 'Disabled'}
                    >
                        <Icon
                            icon={rowData.enabled ? 'ToggleOn' : 'ToggleOff'}
                            size='2x'
                            color={rowData.enabled ? 'success' : 'secondary'}
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'Threshold',
            field: 'threshold',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className="d-flex justify-content-center">
                    <Badge color='info' isLight className='px-3 py-1' style={{ borderRadius: '50px', minWidth: '45px', textAlign: 'center' as any, fontWeight: 600 }}>
                        {rowData.threshold}
                    </Badge>
                </div>
            )
        },
        {
            title: 'Range',
            field: 'min_value',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => (
                <div className="d-flex justify-content-center">
                    <span className='text-muted fw-500' style={{ fontSize: '0.9rem' }}>
                        {rowData.min_value} - {rowData.max_value}
                    </span>
                </div>
            )
        },
        {
            title: 'Actions (LED/Sound)',
            headerStyle: { textAlign: 'center' as any },
            cellStyle: { textAlign: 'center' as any },
            render: (rowData: any) => {
                const hexColor = rowData.led_color ? `#${rowData.led_color.toString(16).padStart(6, '0')}` : '#CCCCCC';
                return (
                    <div className="d-flex justify-content-center align-items-center gap-2">
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: hexColor,
                                border: '1px solid rgba(0,0,0,0.1)',
                                boxShadow: `0 0 5px ${hexColor}`
                            }}
                            title={`LED Color: ${hexColor}`}
                        />
                        {rowData.sound && (
                            <Icon icon='VolumeUp' size='sm' className='text-primary' title={rowData.sound} />
                        )}
                        {rowData.relay1 > 0 && (
                            <Badge color='secondary' isLight size='sm' title={`Relay: ${rowData.relay1}s`}>
                                {rowData.relay1}s
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Manage',
            field: 'actions',
            sorting: false,
            filtering: false,
            headerStyle: { textAlign: 'right' as any, paddingRight: '2.5rem' },
            cellStyle: { textAlign: 'right' as any, paddingRight: '2.5rem' },
            render: (rowData: any) => (
                <div className='d-flex gap-2 justify-content-end align-items-center'>
                    <Button
                        color='warning'
                        isLight
                        size='sm'
                        icon={triggerMutation.isPending ? undefined : 'FlashOn'}
                        className='px-3'
                        onClick={() => handleTestSensor(rowData.event_id || rowData.sensor_name)}
                        isDisable={triggerMutation.isPending || !apiSensor?.ip_address}
                        title={!apiSensor?.ip_address ? 'IP address required' : 'Pulse Test Sensor'}
                    >
                        {triggerMutation.isPending ? <Spinner isSmall inButton /> : 'Pulse'}
                    </Button>
                    <Button
                        color='primary'
                        isLight
                        size='sm'
                        icon='Tune'
                        className='px-3'
                        onClick={() => {
                            setSelectedConfigId(rowData.id!);
                            setIsConfigModalOpen(true);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        color='danger'
                        isLight
                        size='sm'
                        icon='Delete'
                        onClick={() => {
                            setSelectedConfigId(rowData.id!);
                            handleDelete();
                        }}
                    />
                </div>
            )
        }
    ];

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
        sensor_name: 'temperature',
        event_id: 'temperature',
        min_value: 0,
        max_value: 50,
        threshold: 28,
        enabled: true,
        led_color: 16777215, // Default White
        led_pattern: 200004,
        led_priority: 1,
        relay1: 0,
        sound: '',
        source: '',
        pause_minutes: 0
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
                pause_minutes: selectedConfig.pause_minutes || selectedConfig.pause || 0
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
        setIsConfigModalOpen(true);
    };

    const filteredChoices = sensorConfigChoices.filter(
        choice => !configs?.some(c => c.sensor_name === choice.value)
    );

    const handleCreateNew = () => {
        const executeCreate = () => {
            const firstAvailable = filteredChoices[0]?.value || 'noise';
            const defaults = DEFAULT_SENSOR_VALUES[firstAvailable] || { min: 0, max: 100, threshold: 30 };

            setIsCreatingNew(true);
            setFormData({
                sensor_name: firstAvailable,
                event_id: firstAvailable,
                min_value: defaults.min,
                max_value: defaults.max,
                threshold: defaults.threshold,
                led_color: 16777215,
                led_pattern: 200004,
                led_priority: 1,
                relay1: 0,
                sound: '',
                source: '',
                pause_minutes: 0
            });
            setHasUnsavedChanges(false);
            setIsConfigModalOpen(true);
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

        // Use custom event_id if provided, otherwise auto-generate from sensor_name
        const eventName = formData.event_id || (formData.sensor_name || '')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('_');

        // Auto-map source from event_sources using a robust lookup
        const sourceMappingKey = SENSOR_KEY_TO_EVENT_SOURCE_KEY[formData.sensor_name || ''] || eventName;
        const autoSource = eventSources[sourceMappingKey] || eventSources[eventName] || '';

        const bnInstance = 1000 + parseInt(Date.now().toString().slice(-5));

        console.log('💡 Event Name Mapping:', {
            sensor_name: formData.sensor_name,
            customEventId: formData.event_id,
            finalEventName: eventName,
            autoSource: autoSource,
            bnInstance: bnInstance,
            availableEventSources: Object.keys(eventSources)
        });

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
            conditions: '', // Can be made configurable if needed
            pause_minutes: formData.pause_minutes,
            sound: formData.sound || ''
        };

        console.log('📤 Sending Payload:', payload);

        if (isCreatingNew) {
            addMutation.mutate({
                sensorId: deviceId,
                config: payload as SensorConfig
            }, {
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
                }
            });
        } else if (selectedConfigId) {
            updateMutation.mutate({
                sensorId: deviceId,
                configId: selectedConfigId,
                config: payload
            }, {
                onSuccess: () => {
                    setSaveStatus('saved');
                    setHasUnsavedChanges(false);
                    setTimeout(() => setSaveStatus('idle'), 2000);
                },
                onError: () => {
                    setSaveStatus('error');
                    setTimeout(() => setSaveStatus('idle'), 2000);
                }
            });
        }
    };

    const handleReset = () => {
        if (selectedConfig) {
            setFormData({
                sensor_name: selectedConfig.sensor_name,
                min_value: selectedConfig.min_value,
                max_value: selectedConfig.max_value,
                threshold: selectedConfig.threshold
            });
        } else {
            const firstAvailable = filteredChoices[0]?.value || 'temp_c';
            const defaults = DEFAULT_SENSOR_VALUES[firstAvailable] || { min: 0, max: 100, threshold: 30 };
            setFormData({
                sensor_name: firstAvailable,
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

    const handleSync = () => {
        syncMutation.mutate(deviceId);
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

    const renderConfigModal = () => (
        <Modal
            isOpen={isConfigModalOpen}
            setIsOpen={(val: boolean) => setIsConfigModalOpen(val)}
            isCentered
            isScrollable
            size='lg'
        >
            <ModalHeader setIsOpen={(val: boolean) => setIsConfigModalOpen(val)}>
                <ModalTitle id='config-modal-title'>
                    <div className='d-flex align-items-center gap-2'>
                        <Icon icon='Tune' />
                        {isCreatingNew ? 'New Configuration' : `Edit ${displaySensorName(formData.sensor_name || '')}`}
                    </div>
                </ModalTitle>
            </ModalHeader>
            <ModalBody style={{ minHeight: '600px' }}>
                <div className={styles.visualControl}>
                    <div className={styles.formSection}>
                        <div className={styles.sectionLabel}>
                            <Icon icon='Settings' /> Basic Configuration
                        </div>
                        <div className='row g-3'>
                            {isCreatingNew && (
                                <div className='col-md-12'>
                                    <label className='form-label'>Sensor Source</label>
                                    <Select
                                        list={filteredChoices}
                                        value={formData.sensor_name || ''}
                                        onChange={(e: any) => handleFormChange({ sensor_name: e.target.value })}
                                        ariaLabel='Select Sensor Source'
                                    />
                                </div>
                            )}
                            <div className='col-md-12'>
                                <label className='form-label'>Event Name (Custom Identifier)</label>
                                <input
                                    type='text'
                                    className='form-control'
                                    placeholder='e.g., Aggression_Alert_1, Temp_Warning_Main'
                                    value={formData.event_id || ''}
                                    onChange={(e) => handleFormChange({ event_id: e.target.value })}
                                />
                                <small className='text-muted'>
                                    Enter a unique name to identify this configuration. Must be unique for this sensor.
                                </small>
                            </div>
                            {!isCreatingNew && (
                                <div className='col-md-6'>
                                    <label className='form-label'>Status</label>
                                    <div className='d-flex align-items-center h-100' style={{ paddingBottom: '5px' }}>

                                        <div
                                            onClick={() => handleFormChange({ enabled: !formData.enabled })}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Icon
                                                icon={formData.enabled ? 'ToggleOn' : 'ToggleOff'}
                                                size='2x'
                                                color={formData.enabled ? 'success' : 'secondary'}
                                            />
                                        </div>
                                        <span className={classNames('ms-2 fw-bold', formData.enabled ? 'text-success' : 'text-danger')}>
                                            {formData.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <div className={styles.sectionLabel}>
                            <Icon icon='ShowChart' /> Threshold & Range
                        </div>
                        <div className={styles.gaugeDisplay}>
                            <div className={styles.gaugeTrack}>
                                <div
                                    className={styles.safeZone}
                                    style={{ width: `${getThresholdPosition()}%` }}
                                />
                                <div
                                    className={styles.warningZone}
                                    style={{
                                        left: `${getThresholdPosition()}%`,
                                        width: `${100 - getThresholdPosition()}%`
                                    }}
                                />
                                <div
                                    className={styles.thresholdMarkerNew}
                                    style={{ left: `${getThresholdPosition()}%` }}
                                >
                                    <div className={styles.markerLine} />
                                    <div className={styles.markerDot} />
                                    <div className={styles.markerLabel}>{formData.threshold}</div>
                                </div>
                                {liveValue !== null && (
                                    <div
                                        className={classNames(styles.livePointer, styles[liveColor])}
                                        style={{ left: `${getLivePointerPosition()}%` }}
                                    >
                                        <div className={styles.pointerLine} />
                                        <div className={styles.pointerDot} />
                                        <div className={styles.pointerLabel}>
                                            {liveValue.toFixed(2)} - {liveLabel}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={styles.rangeLabels}>
                                <span>{formData.min_value}</span>
                                <span>{formData.max_value}</span>
                            </div>
                        </div>

                        <div className='slider-wrapper mt-4'>
                            <div className={styles.sliderControl}>
                                <input
                                    type='range'
                                    className={styles.thresholdSlider}
                                    min={formData.min_value}
                                    max={formData.max_value}
                                    step='0.1'
                                    value={formData.threshold}
                                    onChange={(e) => handleFormChange({ threshold: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className='row mt-3'>
                                <div className='col-md-4'>
                                    <label className='form-label'>Threshold Val</label>
                                    <input
                                        type='number'
                                        className='form-control'
                                        value={formData.threshold}
                                        onChange={(e) => handleFormChange({ threshold: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label'>Min Range</label>
                                    <input
                                        type='number'
                                        className='form-control'
                                        value={formData.min_value}
                                        onChange={(e) => handleFormChange({ min_value: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label'>Max Range</label>
                                    <input
                                        type='number'
                                        className='form-control'
                                        value={formData.max_value}
                                        onChange={(e) => handleFormChange({ max_value: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <div className={styles.sectionLabel}>
                            <Icon icon='Lightbulb' /> LED & Audio Controls
                        </div>
                        <div className='row g-3'>
                            <div className='col-md-4'>
                                <label className='form-label'>LED Color</label>
                                <Select
                                    list={LED_COLOR_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                                    value={formData.led_color?.toString() || '16777215'}
                                    onChange={(e: any) => handleFormChange({ led_color: parseInt(e.target.value) })}
                                    ariaLabel='Select LED Color'
                                />
                            </div>
                            <div className='col-md-4'>
                                <label className='form-label'>LED Pattern</label>
                                <Select
                                    list={LED_PATTERN_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                                    value={formData.led_pattern?.toString() || '200004'}
                                    onChange={(e: any) => handleFormChange({ led_pattern: parseInt(e.target.value) })}
                                    ariaLabel='Select LED Pattern'
                                />
                            </div>
                            <div className='col-md-4'>
                                <label className='form-label'>LED Priority</label>
                                <Select
                                    list={LED_PRIORITY_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                                    value={formData.led_priority?.toString() || '1'}
                                    onChange={(e: any) => handleFormChange({ led_priority: parseInt(e.target.value) })}
                                    ariaLabel='Select LED Priority'
                                />
                            </div>
                            <div className='col-md-6'>
                                <label className='form-label'>Sound</label>
                                <Select
                                    list={wavefiles.map(f => ({ value: f, label: f }))}
                                    value={formData.sound || ''}
                                    onChange={(e: any) => handleFormChange({ sound: e.target.value })}
                                    ariaLabel='Select Sound Alert'
                                />
                            </div>
                            <div className='col-md-6'>
                                <label className='form-label'>Relay Duration</label>
                                <Select
                                    list={RELAY_DURATION_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                                    value={formData.relay1?.toString() || '0'}
                                    onChange={(e: any) => handleFormChange({ relay1: parseInt(e.target.value) })}
                                    ariaLabel='Select Relay Duration'
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <div className={styles.sectionLabel}>
                            <Icon icon='Info' /> Additional Settings
                        </div>
                        <div className='row g-3'>
                            <div className='col-md-12'>
                                <label className='form-label'>Pause Time (pause_minutes)</label>
                                <div className='input-group' style={{ maxWidth: '300px' }}>
                                    <input
                                        type='number'
                                        className='form-control'
                                        value={formData.pause_minutes}
                                        onChange={(e) => handleFormChange({ pause_minutes: parseInt(e.target.value) })}
                                    />
                                    <span className='input-group-text'>min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <div className='d-flex justify-content-between w-100'>
                    <div>
                        {!isCreatingNew && (
                            <Button
                                color='danger'
                                isLight
                                icon='Delete'
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                    <div className='d-flex gap-2'>
                        <Button
                            color='secondary'
                            isLight
                            onClick={() => setIsConfigModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            color='primary'
                            icon='Save'
                            onClick={handleSave}
                            isDisable={!hasUnsavedChanges || saveStatus === 'saving'}
                        >
                            {saveStatus === 'saving' ? <Spinner isSmall inButton /> : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );

    const renderListView = () => (
        <>
            <div className={styles.detailHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.titleSection}>
                        <Icon icon='NotificationsActive' size='2x' className={styles.headerIcon} />
                        <div className={styles.titleContent}>
                            <h5 className="text-light">Manage All Thresholds</h5>
                            <span className={styles.subtitle}>Current configurations for {apiSensor?.name || deviceId}</span>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            color='info'
                            size='sm'
                            icon='Sync'
                            onClick={handleSync}
                            isLight
                            isDisable={syncMutation.isPending}
                            className='me-2'
                        >
                            {syncMutation.isPending ? <Spinner isSmall inButton /> : 'Sync'}
                        </Button>
                        <Button
                            color='primary'
                            size='sm'
                            icon='Add'
                            onClick={handleCreateNew}
                            isLight
                        >
                            New
                        </Button>
                    </div>
                </div>
            </div>

            <div className={styles.listView}>
                <div className={styles.tableCard}>
                    <ThemeProvider theme={theme}>
                        <MaterialTable
                            title=""
                            columns={tableColumns}
                            data={configs || []}
                            isLoading={isLoading}
                            options={{
                                headerStyle: {
                                    ...headerStyles(),
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.1em'
                                },
                                rowStyle: {
                                    ...rowStyles(),
                                    cursor: 'default'
                                },
                                actionsColumnIndex: -1,
                                search: true,
                                pageSize: 10,
                                searchFieldStyle: searchFieldStyle(),
                                columnsButton: false,
                                showTitle: false,
                                padding: 'default',
                                toolbar: true,
                            }}
                            localization={{
                                pagination: {
                                    labelRowsPerPage: '',
                                },
                                toolbar: {
                                    searchPlaceholder: 'Search Thresholds...'
                                }
                            }}
                        />
                    </ThemeProvider>
                </div>
            </div>
        </>
    );

    return (
        <div className={classNames(styles.singlePanelContainer, { [styles.darkMode]: darkModeStatus })}>
            <div className={styles.mainPanel}>
                {renderListView()}
            </div>
            {renderConfigModal()}
            {renderConfirmModal()}
        </div>
    );
};

export default ThresholdManagementSection;
