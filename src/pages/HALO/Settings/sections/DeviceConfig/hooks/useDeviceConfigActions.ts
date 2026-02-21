import { useState, useEffect } from 'react';
import { useUpdateSensor } from '../../../../../../api/sensors.api';

// ─── MAC Address Helpers ───────────────────────────────────────────────────

export const formatMAC = (mac: string) => {
    if (!mac) return '';
    const clean = mac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    const parts = clean.match(/.{1,2}/g) || [];
    return parts.slice(0, 6).join(':');
};

export const unformatMAC = (mac: string) =>
    mac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeviceFormData {
    name: string;
    description: string;
    area: number | undefined;
    sensor_group_ids: number[];
    username: string;
    password: string;
    is_active: boolean;
    is_online: boolean;
    ip_address: string;
    mac_address: string;
}

const buildFormData = (sensor: any): DeviceFormData => ({
    name: sensor.name || '',
    description: sensor.description || '',
    area: typeof sensor.area === 'object' ? sensor.area?.id : sensor.area,
    sensor_group_ids:
        sensor.sensor_group_ids ||
        sensor.sensor_groups?.map((g: any) => g.id) ||
        [],
    username: sensor.username || '',
    password: sensor.password || '',
    is_active: sensor.is_active ?? true,
    is_online: sensor.is_online ?? true,
    ip_address: sensor.ip_address || '',
    mac_address: formatMAC(sensor.mac_address || ''),
});

interface UseDeviceConfigActionsProps {
    deviceId: string;
    sensor: any;
}

export function useDeviceConfigActions({ deviceId, sensor }: UseDeviceConfigActionsProps) {
    const updateMutation = useUpdateSensor();

    const [formData, setFormData] = useState<DeviceFormData>({
        name: '',
        description: '',
        area: undefined,
        sensor_group_ids: [],
        username: '',
        password: '',
        is_active: true,
        is_online: true,
        ip_address: '',
        mac_address: '',
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Sync sensor → form
    useEffect(() => {
        if (sensor) setFormData(buildFormData(sensor));
    }, [sensor]);

    const patch = (updates: Partial<DeviceFormData>) =>
        setFormData(prev => ({ ...prev, ...updates }));

    const handleReset = () => {
        if (sensor) setFormData(buildFormData(sensor));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(
            {
                sensorId: deviceId,
                data: {
                    ...formData,
                    mac_address: unformatMAC(formData.mac_address),
                    area: formData.area || null,
                },
            },
            {
                onSuccess: () => {
                    setSuccessMessage('Sensor configuration updated successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
            },
        );
    };

    return {
        formData,
        setFormData,
        patch,
        successMessage,
        setSuccessMessage,
        showPassword,
        setShowPassword,
        handleReset,
        handleSubmit,
        updateMutation,
    };
}
