import { useState, useEffect } from 'react';
import { SensorConfig } from '../../../../../../types/sensor';
import {
    DEFAULT_SENSOR_VALUES,
    DEFAULT_FORM_DATA,
    SaveStatus,
} from '../../../../../../constants/threshold.constants';

interface UseThresholdFormProps {
    configs: SensorConfig[];
    selectedConfigId: number | null;
}

export function useThresholdForm({ configs, selectedConfigId }: UseThresholdFormProps) {
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [formData, setFormData] = useState<Partial<SensorConfig>>(DEFAULT_FORM_DATA);

    const selectedConfig = configs?.find(c => c.id === selectedConfigId);

    // Load config into form whenever selection changes
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

    const handleReset = (filteredChoices: { value: string }[]) => {
        if (selectedConfig) {
            setFormData({
                sensor_name: selectedConfig.sensor_name,
                min_value: selectedConfig.min_value,
                max_value: selectedConfig.max_value,
                threshold: selectedConfig.threshold,
            });
        } else {
            const firstAvailable = filteredChoices[0]?.value || '';
            const defaults = DEFAULT_SENSOR_VALUES[firstAvailable] || { min: 0, max: 100, threshold: 30 };
            setFormData({
                sensor_name: '',
                min_value: defaults.min,
                max_value: defaults.max,
                threshold: defaults.threshold,
            });
        }
        setHasUnsavedChanges(false);
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

    return {
        formData,
        isCreatingNew,
        setIsCreatingNew,
        saveStatus,
        setSaveStatus,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        selectedConfig,
        handleFormChange,
        handleReset,
        initNewForm,
    };
}
