import * as React from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import Icon from '../../../../components/icon/Icon';
import { useSensor, useAreas, useSensorGroups } from '../../../../api/sensors.api';
import Input from '../../../../components/bootstrap/forms/Input';
import ReactSelectWithState from '../../../../components/CustomComponent/Select/ReactSelect';
import { MultiSelectDropdown } from '../../../../components/CustomComponent/Select/MultiSelectDropdown';
import ThemeContext from '../../../../contexts/themeContext';

import { useDeviceConfigActions, formatMAC } from './hooks/useDeviceConfigActions';
import AuthCard from './components/AuthCard';

interface DeviceConfigSectionProps {
    deviceId: string;
}

const DeviceConfigSection: React.FC<DeviceConfigSectionProps> = ({ deviceId }) => {
    const { data: sensor, isLoading } = useSensor(deviceId);
    const { data: areas } = useAreas();
    const { data: sensorGroups } = useSensorGroups();

    const { darkModeStatus } = React.useContext(ThemeContext);
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

                        {/* Status toggle + Auth card */}
                        <div className='col-12'>
                            <div className='row g-4'>
                                {/* Device Status Toggle */}
                                <div className='col-md-6'>
                                    <div
                                        style={{
                                            borderRadius: '12px',
                                            border: darkModeStatus
                                                ? '1px solid rgba(255,255,255,0.08)'
                                                : '1px solid rgba(0,0,0,0.08)',
                                            background: darkModeStatus
                                                ? 'rgba(255,255,255,0.03)'
                                                : 'rgba(0,0,0,0.02)',
                                            padding: '20px 24px',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px',
                                        }}
                                    >
                                        {/* Header */}
                                        <div className='d-flex align-items-center gap-2'>
                                            <Icon icon='PowerSettingsNew' size='lg'
                                                style={{ color: actions.formData.is_active ? '#22c55e' : '#ef4444' }}
                                            />
                                            <span className='fw-semibold' style={{ fontSize: '0.95rem' }}>
                                                Device Status
                                            </span>
                                            {/* Live badge */}
                                            <span
                                                style={{
                                                    marginLeft: 'auto',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.05em',
                                                    padding: '3px 10px',
                                                    borderRadius: '20px',
                                                    background: actions.formData.is_active
                                                        ? darkModeStatus ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)'
                                                        : darkModeStatus ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.12)',
                                                    color: actions.formData.is_active
                                                        ? darkModeStatus ? '#4ade80' : '#16a34a'
                                                        : darkModeStatus ? '#f87171' : '#dc2626',
                                                    border: actions.formData.is_active
                                                        ? '1px solid rgba(34,197,94,0.3)'
                                                        : '1px solid rgba(239,68,68,0.3)',
                                                }}
                                            >
                                                {actions.formData.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className='text-muted mb-0' style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                                            {actions.formData.is_active
                                                ? 'This device is currently active.'
                                                : 'This device is inactive. It is hidden from monitoring views.'}
                                        </p>

                                        {/* Toggle row */}
                                        <div
                                            className='d-flex align-items-center justify-content-between'
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: darkModeStatus
                                                    ? 'rgba(255,255,255,0.05)'
                                                    : 'rgba(0,0,0,0.04)',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                {actions.formData.is_active ? 'Deactivate device' : 'Activate device'}
                                            </span>
                                            {/* Native checkbox styled as toggle */}
                                            <label
                                                style={{
                                                    position: 'relative',
                                                    display: 'inline-block',
                                                    width: '52px',
                                                    height: '28px',
                                                    cursor: 'pointer',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <input
                                                    type='checkbox'
                                                    checked={actions.formData.is_active}
                                                    onChange={(e) => actions.patch({ is_active: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                                />
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        borderRadius: '28px',
                                                        background: actions.formData.is_active ? '#22c55e' : (darkModeStatus ? '#374151' : '#d1d5db'),
                                                        transition: 'background 0.25s ease',
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        top: '3px',
                                                        left: actions.formData.is_active ? '26px' : '3px',
                                                        width: '22px',
                                                        height: '22px',
                                                        borderRadius: '50%',
                                                        background: '#fff',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                                                        transition: 'left 0.25s ease',
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
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