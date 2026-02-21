import * as React from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../../components/bootstrap/Card';
import Button from '../../../../../components/bootstrap/Button';
import FormGroup from '../../../../../components/bootstrap/forms/FormGroup';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Alert from '../../../../../components/bootstrap/Alert';
import { useSensor, useAreas, useSensorGroups } from '../../../../../api/sensors.api';
import Input from '../../../../../components/bootstrap/forms/Input';
import ReactSelectWithState from '../../../../../components/CustomComponent/Select/ReactSelect';
import { MultiSelectDropdown } from '../../../../../components/CustomComponent/Select/MultiSelectDropdown';

import { useDeviceConfigActions, formatMAC } from './hooks/useDeviceConfigActions';
import AuthCard from './components/AuthCard';

interface DeviceConfigSectionProps {
    deviceId: string;
}

const DeviceConfigSection: React.FC<DeviceConfigSectionProps> = ({ deviceId }) => {
    const { data: sensor, isLoading } = useSensor(deviceId);
    const { data: areas } = useAreas();
    const { data: sensorGroups } = useSensorGroups();

    const actions = useDeviceConfigActions({ deviceId, sensor });

    // ── Derived select values ────────────────────────────────────────────────

    const areaOptions = areas?.map(a => ({ value: a.id, label: a.name })) || [];
    const areaValue = areas?.find(a => a.id === actions.formData.area)
        ? { value: actions.formData.area, label: areas.find(a => a.id === actions.formData.area)?.name }
        : null;

    const groupOptions = React.useMemo(
        () => sensorGroups?.map(g => ({ value: String(g.id), label: g.name })) ?? [],
        [sensorGroups],
    );
    const groupValue = actions.formData.sensor_group_ids.map(String);
    const handleGroupChange = (selected: string[]) =>
        actions.patch({ sensor_group_ids: selected.map(Number) });

    // ── Loading state ────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <Card stretch>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' />
                </CardBody>
            </Card>
        );
    }

    return (
        <form onSubmit={actions.handleSubmit} className='h-100 d-flex flex-column'>
            <Card stretch className='flex-grow-1 overflow-hidden'>
                <CardHeader>
                    <CardTitle>Device Configuration</CardTitle>
                </CardHeader>

                <CardBody className='overflow-auto'>
                    {actions.successMessage && (
                        <Alert color='success' icon='CheckCircle' className='mb-4'>
                            {actions.successMessage}
                        </Alert>
                    )}
                    {actions.updateMutation.isError && (
                        <Alert color='danger' icon='Error' className='mb-4'>
                            Failed to update device configuration. Please try again.
                        </Alert>
                    )}

                    <div className='row g-4'>
                        {/* Name & MAC */}
                        <div className='col-md-6'>
                            <FormGroup label='Device Name'>
                                <Input
                                    value={actions.formData.name}
                                    onChange={(e: any) => actions.patch({ name: e.target.value })}
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='MAC Address'>
                                <Input
                                    value={actions.formData.mac_address}
                                    onChange={(e: any) =>
                                        actions.patch({ mac_address: formatMAC(e.target.value) })
                                    }
                                    placeholder='AA:BB:CC:DD:EE:FF'
                                />
                            </FormGroup>
                        </div>

                        {/* IP & Area */}
                        <div className='col-md-6'>
                            <FormGroup label='IP Address'>
                                <Input
                                    value={actions.formData.ip_address}
                                    onChange={(e: any) => actions.patch({ ip_address: e.target.value })}
                                />
                                <small className='text-muted'>Current network address</small>
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Area / Location'>
                                <ReactSelectWithState
                                    options={areaOptions}
                                    value={areaValue}
                                    setValue={(opt: any) => actions.patch({ area: opt?.value })}
                                    placeholder='Select Area'
                                    isClearable
                                />
                            </FormGroup>
                        </div>

                        {/* Sensor Groups */}
                        <div className='col-12'>
                            <FormGroup label='Sensor Groups'>
                                <MultiSelectDropdown
                                    options={groupOptions}
                                    value={groupValue}
                                    onChange={handleGroupChange}
                                    placeholder='Select Groups'
                                    searchPlaceholder='Search groups…'
                                    clearable
                                    selectAll
                                />
                            </FormGroup>
                        </div>

                        {/* Description */}
                        <div className='col-12'>
                            <FormGroup label='Description'>
                                <Input
                                    value={actions.formData.description}
                                    onChange={(e: any) => actions.patch({ description: e.target.value })}
                                />
                            </FormGroup>
                        </div>

                        {/* Auth card */}
                        <div className='col-md-6'>
                            <AuthCard
                                username={actions.formData.username}
                                password={actions.formData.password}
                                showPassword={actions.showPassword}
                                onUsernameChange={val => actions.patch({ username: val })}
                                onPasswordChange={val => actions.patch({ password: val })}
                                onTogglePassword={() => actions.setShowPassword(p => !p)}
                            />
                        </div>
                    </div>
                </CardBody>

                <CardFooter>
                    <div className='d-flex justify-content-end gap-2'>
                        <Button onClick={actions.handleReset}>Reset</Button>
                        <Button
                            color='primary'
                            type='submit'
                            isDisable={actions.updateMutation.isPending}
                        >
                            {actions.updateMutation.isPending && <Spinner isSmall inButton />}
                            Save Changes
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </form>
    );
};

export default DeviceConfigSection;