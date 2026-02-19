import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import { useSensor, useUpdateSensor, useAreas, useSensorGroups } from '../../../../api/sensors.api';
import Input from '../../../../components/bootstrap/forms/Input';
import Checks from '../../../../components/bootstrap/forms/Checks';
import ReactSelectWithState from '../../../../components/CustomComponent/Select/ReactSelect';
import InputGroup, { InputGroupText } from '../../../../components/bootstrap/forms/InputGroup';
import Icon from '../../../../components/icon/Icon';

interface DeviceConfigSectionProps {
    deviceId: string;
}

const DeviceConfigSection: React.FC<DeviceConfigSectionProps> = ({ deviceId }) => {
    const { data: sensor, isLoading } = useSensor(deviceId);
    const updateMutation = useUpdateSensor();
    const { data: areas } = useAreas();
    const { data: sensorGroups } = useSensorGroups();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        area: undefined as number | undefined,
        sensor_group_ids: [] as number[],
        username: '',
        password: '',
        is_active: true,
        is_online: true,
        ip_address: '',
        mac_address: '',
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (sensor) {
            setFormData({
                name: sensor.name || '',
                description: sensor.description || '',
                area: typeof sensor.area === 'object' ? sensor.area?.id : sensor.area,
                sensor_group_ids: sensor.sensor_group_ids || (sensor as any).sensor_groups?.map((g: any) => g.id) || [],
                username: (sensor as any).username || '',
                password: (sensor as any).password || '',
                is_active: sensor.is_active ?? true,
                is_online: sensor.is_online ?? true,
                ip_address: sensor.ip_address || '',
                mac_address: sensor.mac_address || '',
            });
        }
    }, [sensor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(
            {
                sensorId: deviceId,
                data: {
                    ...formData,
                    area: formData.area || null
                }
            },
            {
                onSuccess: () => {
                    setSuccessMessage('Sensor configuration updated successfully');
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
                        <div className='col-md-6'>
                            <FormGroup label='Device Name'>
                                <Input
                                    value={formData.name}
                                    onChange={(e: any) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='MAC Address'>
                                <Input
                                    value={formData.mac_address}
                                    onChange={(e: any) =>
                                        setFormData({ ...formData, mac_address: e.target.value })
                                    }
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-6'>
                            <FormGroup label='IP Address'>
                                <Input
                                    value={formData.ip_address}
                                    onChange={(e: any) =>
                                        setFormData({ ...formData, ip_address: e.target.value })
                                    }
                                />
                                <small className='text-muted'>Current network address</small>
                            </FormGroup>
                        </div>

                        <div className='col-md-6'>
                            <FormGroup label='Area / Location'>
                                <ReactSelectWithState
                                    options={areas?.map((a) => ({ value: a.id, label: a.name })) || []}
                                    value={areas?.find(a => a.id === formData.area) ? { value: formData.area, label: areas.find(a => a.id === formData.area)?.name } : null}
                                    setValue={(opt: any) => setFormData({ ...formData, area: opt?.value })}
                                    placeholder="Select Area"
                                    isClearable
                                />
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Sensor Groups'>
                                <ReactSelectWithState
                                    isMulti
                                    options={sensorGroups?.map((g) => ({ value: g.id, label: g.name })) || []}
                                    value={sensorGroups?.filter(g => formData.sensor_group_ids.includes(g.id)).map(g => ({ value: g.id, label: g.name })) || []}
                                    setValue={(opts: any[]) => setFormData({ ...formData, sensor_group_ids: opts ? opts.map(o => o.value) : [] })}
                                    placeholder="Select Groups"
                                />
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Description'>
                                <Input
                                    value={formData.description}
                                    onChange={(e: any) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-6'>
                            <Card className='border shadow-none mb-0'>
                                <CardHeader className='p-2 bg-primary'><CardTitle className='text-light m-0 fs-6 fw-bold'>Authentication</CardTitle></CardHeader>
                                <CardBody className='p-3'>
                                    <div className='row g-3'>
                                        <div className='col-12'>
                                            <FormGroup label='Username'>
                                                <Input
                                                    value={formData.username}
                                                    onChange={(e: any) => setFormData({ ...formData, username: e.target.value })}
                                                    placeholder="Sensor username"
                                                />
                                            </FormGroup>
                                        </div>
                                        <div className='col-12'>
                                            <FormGroup label='Password'>
                                                <InputGroup>
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={formData.password}
                                                        onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder="Sensor password"
                                                    />
                                                    <InputGroupText>
                                                        <span
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            title={showPassword ? 'Hide Password' : 'Show Password'}
                                                        >
                                                            <Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} />
                                                        </span>
                                                    </InputGroupText>
                                                </InputGroup>
                                            </FormGroup>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>


                        <div className='col-md-6'>
                            <FormGroup label='Firmware Version'>
                                <Input value={sensor?.firmware_version || 'v2.1.0'} readOnly disabled />
                                <small className='text-muted'>Internal device software (Read-only)</small>
                            </FormGroup>
                        </div>
                    </div>
                </CardBody>
                <CardFooter>
                    <div className='d-flex justify-content-end gap-2'>
                        <Button
                            // color='light'
                            onClick={() => sensor && setFormData({
                                name: sensor.name || '',
                                description: sensor.description || '',
                                area: typeof sensor.area === 'object' ? sensor.area?.id : sensor.area,
                                sensor_group_ids: sensor.sensor_group_ids || (sensor as any).sensor_groups?.map((g: any) => g.id) || [],
                                username: (sensor as any).username || '',
                                password: (sensor as any).password || '',
                                is_active: sensor.is_active ?? true,
                                is_online: sensor.is_online ?? true,
                                ip_address: sensor.ip_address || '',
                                mac_address: sensor.mac_address || '',
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
