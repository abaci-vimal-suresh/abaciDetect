import * as React from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../../components/bootstrap/Card';
import Button from '../../../../../components/bootstrap/Button';
import FormGroup from '../../../../../components/bootstrap/forms/FormGroup';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Alert from '../../../../../components/bootstrap/Alert';
import { useSensor, useUpdateSensor, useAreas, useSensorGroups } from '../../../../../api/sensors.api';
import Input from '../../../../../components/bootstrap/forms/Input';
import ReactSelectWithState from '../../../../../components/CustomComponent/Select/ReactSelect';
import InputGroup, { InputGroupText } from '../../../../../components/bootstrap/forms/InputGroup';
import Icon from '../../../../../components/icon/Icon';
import { MultiSelectDropdown } from '../../../../../components/CustomComponent/Select/MultiSelectDropdown';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatMAC = (mac: string) => {
    if (!mac) return '';
    const clean = mac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    const parts = clean.match(/.{1,2}/g) || [];
    return parts.slice(0, 6).join(':');
};

const unformatMAC = (mac: string) =>
    mac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeviceFormData {
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

interface DeviceConfigSectionProps {
    deviceId: string;
}

// ─── Helper: build form data from raw sensor ─────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

interface AuthCardProps {
    username: string;
    password: string;
    showPassword: boolean;
    onUsernameChange: (val: string) => void;
    onPasswordChange: (val: string) => void;
    onTogglePassword: () => void;
}

const AuthCard: React.FC<AuthCardProps> = ({
    username,
    password,
    showPassword,
    onUsernameChange,
    onPasswordChange,
    onTogglePassword,
}) => (
    <Card className=''>
        <CardHeader className=''>
            <CardTitle className=' m-0 fs-6 fw-bold'>Authentication</CardTitle>
        </CardHeader>
        <CardBody className='p-3'>
            <div className='row g-3'>
                <div className='col-12'>
                    <FormGroup label='Username'>
                        <Input
                            value={username}
                            onChange={(e: any) => onUsernameChange(e.target.value)}
                            placeholder='Sensor username'
                        />
                    </FormGroup>
                </div>
                <div className='col-12'>
                    <FormGroup label='Password'>
                        <InputGroup>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e: any) => onPasswordChange(e.target.value)}
                                placeholder='Sensor password'
                            />
                            <InputGroupText>
                                <span
                                    style={{ cursor: 'pointer' }}
                                    onClick={onTogglePassword}
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
);

// ─── Main Component ───────────────────────────────────────────────────────────

const DeviceConfigSection: React.FC<DeviceConfigSectionProps> = ({ deviceId }) => {
    const { data: sensor, isLoading } = useSensor(deviceId);
    const updateMutation = useUpdateSensor();
    const { data: areas } = useAreas();
    const { data: sensorGroups } = useSensorGroups();

    const [formData, setFormData] = React.useState<DeviceFormData>({
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

    const [successMessage, setSuccessMessage] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    // Sync sensor → form
    React.useEffect(() => {
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

    // ── Derived select values ────────────────────────────────────────────────

    const areaOptions = areas?.map(a => ({ value: a.id, label: a.name })) || [];
    const areaValue = areas?.find(a => a.id === formData.area)
        ? { value: formData.area, label: areas.find(a => a.id === formData.area)?.name }
        : null;

    // MultiSelectDropdown works with value: string — convert to/from number[] at the boundary
    const groupOptions = React.useMemo(
        () => sensorGroups?.map(g => ({ value: String(g.id), label: g.name })) ?? [],
        [sensorGroups],
    );
    const groupValue = formData.sensor_group_ids.map(String);
    const handleGroupChange = (selected: string[]) =>
        patch({ sensor_group_ids: selected.map(Number) });

    // ── Loading state ────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <Card>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' />
                </CardBody>
            </Card>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

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
                        {/* Row 1 — Name & MAC */}
                        <div className='col-md-6'>
                            <FormGroup label='Device Name'>
                                <Input
                                    value={formData.name}
                                    onChange={(e: any) => patch({ name: e.target.value })}
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='MAC Address'>
                                <Input
                                    value={formData.mac_address}
                                    onChange={(e: any) =>
                                        patch({ mac_address: formatMAC(e.target.value) })
                                    }
                                    placeholder='AA:BB:CC:DD:EE:FF'
                                />
                            </FormGroup>
                        </div>

                        {/* Row 2 — IP & Area */}
                        <div className='col-md-6'>
                            <FormGroup label='IP Address'>
                                <Input
                                    value={formData.ip_address}
                                    onChange={(e: any) => patch({ ip_address: e.target.value })}
                                />
                                <small className='text-muted'>Current network address</small>
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Area / Location'>
                                <ReactSelectWithState
                                    options={areaOptions}
                                    value={areaValue}
                                    setValue={(opt: any) => patch({ area: opt?.value })}
                                    placeholder='Select Area'
                                    isClearable
                                />
                            </FormGroup>
                        </div>

                        {/* Row 3 — Sensor Groups via MultiSelectDropdown */}
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

                        {/* Row 4 — Description */}
                        <div className='col-12'>
                            <FormGroup label='Description'>
                                <Input
                                    value={formData.description}
                                    onChange={(e: any) => patch({ description: e.target.value })}
                                />
                            </FormGroup>
                        </div>

                        {/* Row 5 — Auth card */}
                        <div className='col-md-6'>
                            <AuthCard
                                username={formData.username}
                                password={formData.password}
                                showPassword={showPassword}
                                onUsernameChange={val => patch({ username: val })}
                                onPasswordChange={val => patch({ password: val })}
                                onTogglePassword={() => setShowPassword(p => !p)}
                            />
                        </div>
                    </div>
                </CardBody>

                <CardFooter>
                    <div className='d-flex justify-content-end gap-2'>
                        <Button onClick={handleReset}>Reset</Button>
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