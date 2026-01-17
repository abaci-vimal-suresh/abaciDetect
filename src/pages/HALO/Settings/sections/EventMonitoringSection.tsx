import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import Icon from '../../../../components/icon/Icon';
import { useEventMonitoring, useUpdateEventMonitoring } from '../../../../api/device.setting.api';

interface EventMonitoringSectionProps {
    deviceId: string;
}

const EventMonitoringSection: React.FC<EventMonitoringSectionProps> = ({ deviceId }) => {
    const { data: config, isLoading } = useEventMonitoring(deviceId);
    const updateMutation = useUpdateEventMonitoring();

    const [formData, setFormData] = useState({
        health_index_enabled: true,
        aqi_enabled: true,
        pm1_enabled: true,
        pm25_enabled: true,
        pm10_enabled: true,
        co2_enabled: true,
        humidity_enabled: true,
        motion_enabled: true,
        gunshot_enabled: false,
        aggression_enabled: true,
        temperature_enabled: true,
        noise_enabled: true,
        light_enabled: true,
    });

    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(
            { device_id: parseInt(deviceId), ...formData },
            {
                onSuccess: () => {
                    setSuccessMessage('Event monitoring settings updated successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
            }
        );
    };

    const handleToggle = (field: keyof typeof formData) => {
        setFormData({ ...formData, [field]: !formData[field] });
    };

    const monitoringOptions = [
        { key: 'health_index_enabled', label: 'Health Index Monitoring', icon: 'Favorite', color: 'danger' },
        { key: 'aqi_enabled', label: 'Air Quality Index (AQI)', icon: 'Air', color: 'primary' },
        { key: 'pm1_enabled', label: 'PM1.0 Particulate Matter', icon: 'Grain', color: 'warning' },
        { key: 'pm25_enabled', label: 'PM2.5 Particulate Matter', icon: 'Grain', color: 'warning' },
        { key: 'pm10_enabled', label: 'PM10 Particulate Matter', icon: 'Grain', color: 'warning' },
        { key: 'co2_enabled', label: 'CO2 Monitoring', icon: 'Cloud', color: 'info' },
        { key: 'temperature_enabled', label: 'Temperature Monitoring', icon: 'Thermostat', color: 'success' },
        { key: 'humidity_enabled', label: 'Humidity Monitoring', icon: 'Opacity', color: 'info' },
        { key: 'motion_enabled', label: 'Motion Detection', icon: 'DirectionsRun', color: 'primary' },
        { key: 'noise_enabled', label: 'Noise Level Monitoring', icon: 'VolumeUp', color: 'secondary' },
        { key: 'light_enabled', label: 'Light Level Monitoring', icon: 'WbSunny', color: 'warning' },
        { key: 'aggression_enabled', label: 'Aggression Detection', icon: 'RecordVoiceOver', color: 'danger' },
        { key: 'gunshot_enabled', label: 'Gunshot Detection', icon: 'ReportProblem', color: 'danger' },
    ];

    if (isLoading) {
        return (
            <Card>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' />
                </CardBody>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit} className='h-100 d-flex flex-column'>
            <Card stretch className='flex-grow-1 overflow-hidden'>
                <CardHeader>
                    <CardTitle>Event Monitoring Settings</CardTitle>
                </CardHeader>
                <CardBody className='overflow-auto'>
                    {successMessage && (
                        <Alert color='success' icon='CheckCircle' className='mb-4'>
                            {successMessage}
                        </Alert>
                    )}

                    {updateMutation.isError && (
                        <Alert color='danger' icon='Error' className='mb-4'>
                            Failed to update event monitoring settings. Please try again.
                        </Alert>
                    )}

                    <Alert color='info' icon='Info' className='mb-4'>
                        Enable or disable specific sensors and event monitoring. Disabled sensors will not trigger alerts.
                    </Alert>

                    <div className='row g-3'>
                        {monitoringOptions.map((option) => (
                            <div key={option.key} className='col-md-6'>
                                <Card className='shadow-sm'>
                                    <CardBody className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center'>
                                            <Icon
                                                icon={option.icon}
                                                className={`me-3 text-${option.color}`}
                                                size='2x'
                                            />
                                            <div>
                                                <div className='fw-bold'>{option.label}</div>
                                                <small className='text-muted'>
                                                    {formData[option.key as keyof typeof formData] ? 'Active' : 'Inactive'}
                                                </small>
                                            </div>
                                        </div>
                                        <div className='form-check form-switch'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                role='switch'
                                                checked={formData[option.key as keyof typeof formData]}
                                                onChange={() => handleToggle(option.key as keyof typeof formData)}
                                                style={{ width: '3rem', height: '1.5rem', cursor: 'pointer' }}
                                            />
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        ))}
                    </div>
                </CardBody>
                <CardFooter>
                    <div className='d-flex justify-content-end gap-2'>
                        <Button onClick={() => config && setFormData(config)}>
                            Reset
                        </Button>
                        <Button color='primary' type='submit' isDisable={updateMutation.isPending}>
                            {updateMutation.isPending && <Spinner isSmall inButton />}
                            Save Settings
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </form>
    );
};

export default EventMonitoringSection;