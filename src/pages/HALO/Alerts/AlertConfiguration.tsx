import React, { useState, useEffect } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle, CardFooter, CardLabel, CardSubTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Badge from '../../../components/bootstrap/Badge';
import Checks from '../../../components/bootstrap/forms/Checks';
import Label from '../../../components/bootstrap/forms/Label';
import { AlertConfiguration } from '../../../types/sensor';
import { useUsers, useUserGroups } from '../../../api/sensors.api';

const AlertConfigurationPage = () => {
    const configs: AlertConfiguration[] = [];
    const isConfigsLoading = false;
    const saveConfig = (data: any) => { };
    const isSaving = false;

    const { data: users } = useUsers();

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [localConfig, setLocalConfig] = useState<AlertConfiguration | null>(null);

    useEffect(() => {
        if (configs && configs.length > 0 && selectedId === null) {
            setSelectedId(configs[0].id);
            setLocalConfig(configs[0]);
        }
    }, [configs, selectedId]);

    useEffect(() => {
        if (selectedId && configs) {
            const found = configs.find(c => c.id === selectedId);
            if (found) {
                setLocalConfig(JSON.parse(JSON.stringify(found)));
            }
        }
    }, [selectedId, configs]);

    const handleSave = () => {
        if (localConfig) {
            saveConfig(localConfig);
        }
    };

    const handleActionToggle = (action: keyof AlertConfiguration['actions']) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            actions: {
                ...localConfig.actions,
                [action]: !localConfig.actions[action]
            }
        });
    };

    const handleRecipientToggle = (id: number, type: 'user' | 'group') => {
        if (!localConfig) return;
        const exists = localConfig.recipients.find(r => r.id === id && r.type === type);
        let newRecipients;
        if (exists) {
            newRecipients = localConfig.recipients.filter(r => !(r.id === id && r.type === type));
        } else {
            const name = type === 'user'
                ? users?.find(u => u.id === id)?.username
                : `Group ${id}`;

            newRecipients = [...localConfig.recipients, { id, type, name }];
        }
        setLocalConfig({ ...localConfig, recipients: newRecipients });
    };

    return (
        <PageWrapper title="Alert Configuration">
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo' },
                            { title: 'Alerts', to: '/halo/alerts' },
                            { title: 'Configuration', to: '/halo/alerts/config' },
                        ]}
                    />
                </SubHeaderLeft>
            </SubHeader>

            <Page container='fluid'>
                <div className="row h-100">
                    <div className="col-lg-4 col-xl-3">
                        <Card stretch>
                            <CardHeader>
                                <CardLabel icon="Tune" iconColor="primary">
                                    <CardTitle>Parameters</CardTitle>
                                    <CardSubTitle>Select to configure</CardSubTitle>
                                </CardLabel>
                            </CardHeader>
                            <CardBody className="p-0">
                                {isConfigsLoading ? (
                                    <div className="p-4 text-center text-muted">Loading...</div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {configs?.map(config => (
                                            <div
                                                key={config.id}
                                                className={`list-group-item list-group-item-action cursor-pointer ${selectedId === config.id ? 'active-selection' : ''}`}
                                                onClick={() => setSelectedId(config.id)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedId === config.id ? 'var(--bs-primary-bg-subtle)' : 'transparent',
                                                    borderLeft: selectedId === config.id ? '4px solid var(--bs-primary)' : '4px solid transparent'
                                                }}
                                            >
                                                <div className="d-flex w-100 justify-content-between align-items-center">
                                                    <h6 className="mb-1 fw-bold">{config.parameter_label}</h6>
                                                    {config.enabled ? (
                                                        <Badge color="success" isLight>Active</Badge>
                                                    ) : (
                                                        <Badge color="secondary" isLight>Disabled</Badge>
                                                    )}
                                                </div>
                                                <p className="mb-1 small text-muted">
                                                    Threshold: {config.threshold_min ?? '-'} to {config.threshold_max ?? '-'}
                                                </p>
                                                <div className="d-flex gap-1 mt-2">
                                                    {config.actions.email && <Icon icon="Email" size="sm" className="text-primary" />}
                                                    {config.actions.sms && <Icon icon="Sms" size="sm" className="text-info" />}
                                                    {config.actions.push_notification && <Icon icon="Notifications" size="sm" className="text-warning" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Right Panel: Configuration Editor */}
                    <div className="col-lg-8 col-xl-9">
                        {localConfig ? (
                            <Card stretch>
                                <CardHeader>
                                    <CardLabel icon="Settings" iconColor="info">
                                        <CardTitle>{localConfig.parameter_label} Settings</CardTitle>
                                    </CardLabel>
                                    <div className="d-flex align-items-center">
                                        <Label className="me-2 mb-0 cursor-pointer" htmlFor="enableSwitch">
                                            {localConfig.enabled ? 'Enabled' : 'Disabled'}
                                        </Label>
                                        <Checks
                                            type="switch"
                                            id="enableSwitch"
                                            checked={localConfig.enabled}
                                            onChange={() => setLocalConfig({ ...localConfig, enabled: !localConfig.enabled })}
                                        />
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {/* Thresholds Section */}
                                    <div className="mb-4">
                                        <h5 className="mb-3 text-primary">Thresholds</h5>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <FormGroup id="minVal" label="Minimum Value">
                                                    <Input
                                                        type="number"
                                                        value={localConfig.threshold_min ?? ''}
                                                        onChange={(e: any) => setLocalConfig({
                                                            ...localConfig,
                                                            threshold_min: e.target.value === '' ? null : Number(e.target.value)
                                                        })}
                                                        placeholder="No limit"
                                                    />
                                                </FormGroup>
                                            </div>
                                            <div className="col-md-6">
                                                <FormGroup id="maxVal" label="Maximum Value">
                                                    <Input
                                                        type="number"
                                                        value={localConfig.threshold_max ?? ''}
                                                        onChange={(e: any) => setLocalConfig({
                                                            ...localConfig,
                                                            threshold_max: e.target.value === '' ? null : Number(e.target.value)
                                                        })}
                                                        placeholder="No limit"
                                                    />
                                                </FormGroup>
                                            </div>
                                        </div>
                                        <div className="form-text mt-2">
                                            Alerts will be triggered if the sensor value goes below the minimum or above the maximum.
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    {/* Actions Section */}
                                    <div className="mb-4">
                                        <h5 className="mb-3 text-primary">Notification Channels</h5>
                                        <div className="row g-3">
                                            <div className="col-md-3 col-6">
                                                <Button
                                                    color={localConfig.actions.email ? 'primary' : 'light'}
                                                    icon="Email"
                                                    className="w-100 py-3 d-flex flex-column align-items-center gap-2"
                                                    onClick={() => handleActionToggle('email')}
                                                >
                                                    Email
                                                </Button>
                                            </div>
                                            <div className="col-md-3 col-6">
                                                <Button
                                                    color={localConfig.actions.sms ? 'info' : 'light'}
                                                    icon="Sms"
                                                    className="w-100 py-3 d-flex flex-column align-items-center gap-2"
                                                    onClick={() => handleActionToggle('sms')}
                                                >
                                                    SMS
                                                </Button>
                                            </div>
                                            <div className="col-md-3 col-6">
                                                <Button
                                                    color={localConfig.actions.push_notification ? 'warning' : 'light'}
                                                    icon="Notifications"
                                                    className="w-100 py-3 d-flex flex-column align-items-center gap-2"
                                                    onClick={() => handleActionToggle('push_notification')}
                                                >
                                                    Push
                                                </Button>
                                            </div>
                                            <div className="col-md-3 col-6">
                                                <Button
                                                    color={localConfig.actions.in_app ? 'danger' : 'light'}
                                                    icon="Apps"
                                                    className="w-100 py-3 d-flex flex-column align-items-center gap-2"
                                                    onClick={() => handleActionToggle('in_app')}
                                                >
                                                    In-App
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    {/* Recipients Section */}
                                    <div className="mb-4">
                                        <h5 className="mb-3 text-primary">Recipients</h5>
                                        <div className="row">
                                            <div className="col-12">
                                                <Label>Select Users</Label>
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    {users?.map(user => {
                                                        const isSelected = localConfig.recipients.some(r => r.id === user.id && r.type === 'user');
                                                        return (
                                                            <div
                                                                key={user.id}
                                                                onClick={() => handleRecipientToggle(user.id, 'user')}
                                                                className={`border rounded px-3 py-2 cursor-pointer user-select-none ${isSelected ? 'bg-primary text-white border-primary' : 'bg-light border-light'}`}
                                                                style={{ transition: 'all 0.2s' }}
                                                            >
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Icon icon="Person" size="sm" />
                                                                    <span>{user.username}</span>
                                                                    {isSelected && <Icon icon="Check" size="sm" />}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                                <CardFooter>
                                    <div className="d-flex justify-content-end gap-2">
                                        <Button
                                            color="primary"
                                            icon="Save"
                                            onClick={handleSave}
                                            isDisable={isSaving}
                                        >
                                            {isSaving ? 'Saving...' : 'Save Configuration'}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ) : (
                            <Card stretch>
                                <CardBody className="d-flex flex-column justify-content-center align-items-center text-muted p-5">
                                    <Icon icon="TouchApp" size="4x" className="mb-3 opacity-50" />
                                    <h4>Select a parameter to configure</h4>
                                    <p>Choose a sensor parameter from the left to view and edit its alert settings.</p>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default AlertConfigurationPage;