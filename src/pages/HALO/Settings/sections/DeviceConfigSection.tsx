import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import { useDeviceConfig, useUpdateDeviceConfig } from '../../../../api/device.setting.api';
import Input from '../../../../components/bootstrap/forms/Input';

interface DeviceConfigSectionProps {
    deviceId: string;
}

const DeviceConfigSection: React.FC<DeviceConfigSectionProps> = ({ deviceId }) => {
    const { data: config, isLoading } = useDeviceConfig(deviceId);
    const updateMutation = useUpdateDeviceConfig();

    const [formData, setFormData] = useState({
        device_name: '',
        building_wing: '',
        building_floor: '',
        building_room: '',
        description: '',
        ip_address: '',
        network_type: 'DHCP' as 'DHCP' | 'STATIC',
    });

    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (config) {
            setFormData({
                device_name: config.device_name || '',
                building_wing: config.building_wing || '',
                building_floor: config.building_floor || '',
                building_room: config.building_room || '',
                description: config.description || '',
                ip_address: config.ip_address || '',
                network_type: config.network_type || 'DHCP',
            });
        }
    }, [config]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(
            { id: config?.id, ...formData },
            {
                onSuccess: () => {
                    setSuccessMessage('Device configuration updated successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
            }
        );
    };

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
                    <CardTitle>Device Configuration</CardTitle>
                </CardHeader>
                <CardBody className='overflow-auto'>
                    {successMessage && (
                        <Alert color='success' icon='CheckCircle' className='mb-4'>
                            {successMessage}
                        </Alert>
                    )}

                    {updateMutation.isError && (
                        <Alert color='danger' icon='Error' className='mb-4'>
                            Failed to update device configuration. Please try again.
                        </Alert>
                    )}

                    <div className='row g-4'>
                        {/* Basic Information */}
                        <div className='col-12'>
                            <h5 className='mb-3'>Basic Information</h5>
                        </div>

                        <div className='col-md-6'>
                            <FormGroup
                                label='Device Name'
                            //  isRequired
                            >
                                <Input
                                    type='text'
                                    value={formData.device_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({ ...formData, device_name: e.target.value })
                                    }
                                    required
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-6'>
                            <FormGroup label='MAC Address'>
                                <Input
                                    type='text'
                                    value={config?.mac_address || ''}
                                    disabled
                                    className='font-monospace'
                                />
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Description'>
                                <textarea
                                    className='form-control'
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder='Add a description for this device...'
                                />
                            </FormGroup>
                        </div>

                        {/* Location Information */}
                        <div className='col-12 mt-4'>
                            <h5 className='mb-3'>Location Information</h5>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Building Wing'>
                                <Input
                                    type='text'
                                    value={formData.building_wing}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({ ...formData, building_wing: e.target.value })
                                    }
                                    placeholder='e.g., North Wing'
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Building Floor'>
                                <Input
                                    type='text'
                                    value={formData.building_floor}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({ ...formData, building_floor: e.target.value })
                                    }
                                    placeholder='e.g., 3rd Floor'
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Room Number'>
                                <Input
                                    type='text'
                                    value={formData.building_room}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({ ...formData, building_room: e.target.value })
                                    }
                                    placeholder='e.g., Room 301'
                                />
                            </FormGroup>
                        </div>

                        {/* Network Settings */}
                        <div className='col-12 mt-4'>
                            <h5 className='mb-3'>Network Settings</h5>
                        </div>

                        <div className='col-md-6'>
                            <FormGroup label='Network Type'>
                                <select
                                    className='form-select'
                                    value={formData.network_type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            network_type: e.target.value as 'DHCP' | 'STATIC',
                                        })
                                    }
                                >
                                    <option value='DHCP'>DHCP (Automatic)</option>
                                    <option value='STATIC'>Static IP</option>
                                </select>
                            </FormGroup>
                        </div>

                        <div className='col-md-6'>
                            <FormGroup label='IP Address'>
                                <Input
                                    type='text'
                                    value={formData.ip_address}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({ ...formData, ip_address: e.target.value })
                                    }
                                    disabled={formData.network_type === 'DHCP'}
                                    className='font-monospace'
                                    placeholder='192.168.1.100'
                                />
                                {formData.network_type === 'DHCP' && (
                                    <small className='text-muted'>
                                        IP address is automatically assigned via DHCP
                                    </small>
                                )}
                            </FormGroup>
                        </div>

                        {/* Firmware Information */}
                        <div className='col-12 mt-4'>
                            <h5 className='mb-3'>System Information</h5>
                        </div>

                        <div className='col-md-6'>
                            <FormGroup label='Firmware Version'>
                                <Input
                                    type='text'
                                    value={config?.firmware_version || 'Unknown'}
                                    disabled
                                    className='font-monospace'
                                />
                            </FormGroup>
                        </div>
                    </div>
                </CardBody>
                <CardFooter>
                    <div className='d-flex justify-content-end gap-2'>
                        <Button
                            // color='light'
                            onClick={() => config && setFormData({
                                device_name: config.device_name || '',
                                building_wing: config.building_wing || '',
                                building_floor: config.building_floor || '',
                                building_room: config.building_room || '',
                                description: config.description || '',
                                ip_address: config.ip_address || '',
                                network_type: config.network_type || 'DHCP',
                            })}
                        >
                            Reset
                        </Button>
                        <Button
                            color='primary'
                            type='submit'
                            isDisable={updateMutation.isPending}
                        >
                            {updateMutation.isPending && <Spinner isSmall inButton />}
                            Save Changes
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </form>
    );
};

export default DeviceConfigSection;