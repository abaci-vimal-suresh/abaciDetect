import React, { useState, useMemo } from 'react';
import { Action, User, SoundFile } from '../../../../types/sensor';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Select from '../../../../components/bootstrap/forms/Select';
import Textarea from '../../../../components/bootstrap/forms/Textarea';
import Icon from '../../../../components/icon/Icon';
import { useUsers, useUserGroups, useSoundFiles, useAddSoundFile } from '../../../../api/sensors.api';
import ReactSelectWithState from '../../../../components/CustomComponent/Select/ReactSelect';
import Checks from '../../../../components/bootstrap/forms/Checks';
import {
    LED_COLOR_OPTIONS,
    LED_PATTERN_OPTIONS,
    LED_PRIORITY_OPTIONS
} from '../../../../constants/halo.constants';

interface ActionFormProps {
    action?: Partial<Action>;
    onSave: (data: Partial<Action>) => void;
    onCancel: () => void;
}

const ActionForm: React.FC<ActionFormProps> = ({ action, onSave, onCancel }) => {
    const [formData, setFormData] = React.useState<Partial<Action>>(() => {
        if (!action) return {
            name: '',
            type: 'email',
            recipients: [],
            message_type: 'custom',
            message_template: '',
            is_active: true,
            alert_on_failure: false,
            device_led_color: 0,
            device_led_pattern: 0,
            device_led_priority: 1,
            action_duration_minutes: 1
        };

        const initial = { ...action };

        // Convert rich recipient objects to IDs for select components
        if (initial.recipients && Array.isArray(initial.recipients)) {
            initial.recipients = initial.recipients.map((r: any) => typeof r === 'object' ? r.id : r);
        }

        // Convert rich user group objects to IDs for select components
        if (initial.user_groups && Array.isArray(initial.user_groups)) {
            initial.user_groups = initial.user_groups.map((g: any) => typeof g === 'object' ? g.id : g);
        }

        return initial;
    });

    const { data: users } = useUsers();
    const { data: userGroups } = useUserGroups();
    const { data: soundFiles } = useSoundFiles();
    const addSoundMutation = useAddSoundFile();

    const userOptions = users?.map((u: User) => ({ value: u.id, label: u.username })) || [];
    const groupOptions = userGroups?.map((g: any) => ({ value: g.id, label: g.name })) || [];
    const soundOptions = soundFiles?.map((s: SoundFile) => ({ value: s.name, text: s.name })) || [];

    const isValid = useMemo(() => {
        if (!formData.name?.trim()) return false;

        switch (formData.type) {
            case 'email':
            case 'sms':
                const hasRecipients = (formData.recipients && formData.recipients.length > 0) ||
                    (formData.user_groups && formData.user_groups.length > 0);
                const hasMessage = !!formData.message_template?.trim();
                // For SMS message is mandatory, for Email usually subject/body but here we have one template field
                if (formData.type === 'sms' && !hasMessage) return false;
                return hasRecipients;

            case 'device_notification':
                const hasDeviceList = Array.isArray(formData.device_list) && formData.device_list.length > 0;
                return hasDeviceList && !!formData.device_type;

            case 'webhook':
                if (!formData.webhook_url?.trim() || !formData.http_method) return false;
                if (formData.webhook_auth_type === 'bearer' && !formData.webhook_auth_token?.trim()) return false;
                if (formData.webhook_auth_type === 'basic' && (!formData.webhook_auth_username?.trim() || !formData.webhook_auth_password?.trim())) return false;
                if (formData.webhook_auth_type === 'api_key' && (!formData.webhook_auth_username?.trim() || !formData.webhook_auth_token?.trim())) return false;
                return true;

            case 'n8n_workflow':
                return !!formData.n8n_workflow_url?.trim();

            default:
                return true;
        }
    }, [formData]);

    return (
        <div className="row g-3">
            <div className="col-md-6">
                <FormGroup label="Action Name">
                    <Input
                        value={formData.name}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Send Critical Email"
                    />
                </FormGroup>
            </div>
            <div className="col-md-6">
                <FormGroup label="Type">
                    <Select
                        value={formData.type}
                        onChange={(e: any) => {
                            const nextType = e.target.value as any;
                            setFormData(prev => ({
                                ...prev,
                                type: nextType,
                                message_type: nextType === 'email' || nextType === 'sms'
                                    ? 'custom'
                                    : prev.message_type || 'custom'
                            }));
                        }}
                        list={[
                            { value: 'email', text: 'Email' },
                            { value: 'sms', text: 'SMS' },
                            { value: 'device_notification', text: 'Device Command (HALO)' },
                            { value: 'webhook', text: 'Webhook' },
                            { value: 'n8n_workflow', text: 'N8N Workflow' },
                        ]}
                        ariaLabel="Action Type"
                    />
                </FormGroup>
            </div>

            {/* Webhook Specific */}
            {formData.type === 'webhook' && (
                <>
                    <div className="col-md-4">
                        <FormGroup label="HTTP Method">
                            <Select
                                value={formData.http_method || 'POST'}
                                onChange={(e: any) => setFormData({ ...formData, http_method: e.target.value })}
                                list={[
                                    { value: 'GET', text: 'GET' },
                                    { value: 'POST', text: 'POST' },
                                    { value: 'PUT', text: 'PUT' },
                                    { value: 'PATCH', text: 'PATCH' },
                                    { value: 'DELETE', text: 'DELETE' },
                                ]}
                                ariaLabel="HTTP Method"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-8">
                        <FormGroup label="Webhook URL">
                            <Input
                                value={formData.webhook_url || ''}
                                onChange={(e: any) => setFormData({ ...formData, webhook_url: e.target.value })}
                                placeholder="https://api.example.com/webhook"
                                type="url"
                            />
                        </FormGroup>
                    </div>

                    {/* Webhook Auth */}
                    <div className="col-md-4">
                        <FormGroup label="Auth Type">
                            <Select
                                value={formData.webhook_auth_type || 'none'}
                                onChange={(e: any) => setFormData({ ...formData, webhook_auth_type: e.target.value })}
                                list={[
                                    { value: 'none', text: 'None' },
                                    { value: 'bearer', text: 'Bearer Token' },
                                    { value: 'basic', text: 'Basic Auth' },
                                    { value: 'api_key', text: 'API Key' },
                                ]}
                                ariaLabel="Auth Type"
                            />
                        </FormGroup>
                    </div>

                    {formData.webhook_auth_type === 'bearer' && (
                        <div className="col-md-8">
                            <FormGroup label="Token">
                                <Input
                                    value={formData.webhook_auth_token || ''}
                                    onChange={(e: any) => setFormData({ ...formData, webhook_auth_token: e.target.value })}
                                    placeholder="Enter bearer token"
                                    type="password"
                                />
                            </FormGroup>
                        </div>
                    )}

                    {formData.webhook_auth_type === 'basic' && (
                        <>
                            <div className="col-md-4">
                                <FormGroup label="Username">
                                    <Input
                                        value={formData.webhook_auth_username || ''}
                                        onChange={(e: any) => setFormData({ ...formData, webhook_auth_username: e.target.value })}
                                        placeholder="Username"
                                    />
                                </FormGroup>
                            </div>
                            <div className="col-md-4">
                                <FormGroup label="Password">
                                    <Input
                                        value={formData.webhook_auth_password || ''}
                                        onChange={(e: any) => setFormData({ ...formData, webhook_auth_password: e.target.value })}
                                        placeholder="Password"
                                        type="password"
                                    />
                                </FormGroup>
                            </div>
                        </>
                    )}

                    {formData.webhook_auth_type === 'api_key' && (
                        <>
                            <div className="col-md-4">
                                <FormGroup label="Header/Key Name">
                                    <Input
                                        value={formData.webhook_auth_username || ''}
                                        onChange={(e: any) => setFormData({ ...formData, webhook_auth_username: e.target.value })}
                                        placeholder="X-API-Key"
                                    />
                                </FormGroup>
                            </div>
                            <div className="col-md-4">
                                <FormGroup label="API Key Value">
                                    <Input
                                        value={formData.webhook_auth_token || ''}
                                        onChange={(e: any) => setFormData({ ...formData, webhook_auth_token: e.target.value })}
                                        placeholder="Value"
                                        type="password"
                                    />
                                </FormGroup>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Device Notification Specific */}
            {formData.type === 'device_notification' && (
                <>
                    <div className="col-md-6">
                        <FormGroup label="Device Type">
                            <Select
                                value={formData.device_type || 'HALO'}
                                onChange={(e: any) => setFormData({ ...formData, device_type: e.target.value as any })}
                                list={[
                                    { value: 'HALO', text: 'HALO' },
                                ]}
                                ariaLabel="Device Type"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-6">
                        <FormGroup label="Sound File">
                            <Select
                                value={formData.device_sound || ''}
                                onChange={(e: any) => setFormData({ ...formData, device_sound: e.target.value })}
                                list={[
                                    { value: '', text: 'No Sound' },
                                    ...soundOptions
                                ]}
                                ariaLabel="Sound Selection"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-4">
                        <FormGroup label="LED Color">
                            <Select
                                value={String(formData.device_led_color || 16777215)}
                                onChange={(e: any) => setFormData({ ...formData, device_led_color: parseInt(e.target.value) || 16777215 })}
                                list={LED_COLOR_OPTIONS.map(opt => ({ value: opt.value.toString(), text: opt.label }))}
                                ariaLabel="LED Color"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-4">
                        <FormGroup label="LED Pattern">
                            <Select
                                value={String(formData.device_led_pattern || 200004)}
                                onChange={(e: any) => setFormData({ ...formData, device_led_pattern: parseInt(e.target.value) || 200004 })}
                                list={LED_PATTERN_OPTIONS.map(opt => ({ value: opt.value.toString(), text: opt.label }))}
                                ariaLabel="LED Pattern"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-4">
                        <FormGroup label="Priority">
                            <Select
                                value={String(formData.device_led_priority || 1)}
                                onChange={(e: any) => setFormData({ ...formData, device_led_priority: parseInt(e.target.value) || 1 })}
                                list={LED_PRIORITY_OPTIONS.map(opt => ({ value: opt.value.toString(), text: opt.label }))}
                                ariaLabel="Priority"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-6">
                        <FormGroup label="Action Duration (Minutes)">
                            <Input
                                type="number"
                                min={1}
                                value={formData.action_duration_minutes || 1}
                                onChange={(e: any) => setFormData({ ...formData, action_duration_minutes: parseInt(e.target.value) || 1 })}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-12">
                        <FormGroup label="Target Device List (Comma Separation)">
                            <Input
                                value={Array.isArray(formData.device_list) ? formData.device_list.join(', ') : formData.device_list || ''}
                                onChange={(e: any) => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, device_list: val.split(',').map((s: string) => s.trim()).filter(Boolean) });
                                }}
                                placeholder="device_001, device_002"
                            />
                        </FormGroup>
                    </div>

                </>
            )}

            {/* N8N Workflow Specific */}
            {formData.type === 'n8n_workflow' && (
                <>
                    <div className="col-12">
                        <FormGroup label="Workflow Webhook URL" id="n8n-workflow-url">
                            <Input
                                value={formData.n8n_workflow_url || ''}
                                onChange={(e: any) => setFormData({ ...formData, n8n_workflow_url: e.target.value })}
                                placeholder="https://your-n8n-instance.com/webhook/alert-handler"
                                type="url"
                            />
                            <small className="text-muted">
                                Enter the webhook URL from your n8n workflow's "Webhook" trigger node
                            </small>
                        </FormGroup>
                    </div>

                    <div className="col-md-6">
                        <FormGroup label="Workflow ID (Optional)" id="n8n-workflow-id">
                            <Input
                                value={formData.n8n_workflow_id || ''}
                                onChange={(e: any) => setFormData({ ...formData, n8n_workflow_id: e.target.value })}
                                placeholder="e.g., critical_alert_workflow"
                            />
                            <small className="text-muted">
                                Identifier for tracking and logging purposes
                            </small>
                        </FormGroup>
                    </div>

                    <div className="col-md-6">
                        <FormGroup label="Timeout (seconds)" id="n8n-timeout">
                            <Input
                                type="number"
                                value={formData.n8n_timeout || 30}
                                onChange={(e: any) => setFormData({ ...formData, n8n_timeout: parseInt(e.target.value) || 30 })}
                                min={5}
                                max={120}
                            />
                            <small className="text-muted">
                                Maximum wait time for workflow response (5-120 seconds)
                            </small>
                        </FormGroup>
                    </div>

                    <div className="col-12">
                        <div className="alert alert-info d-flex align-items-start">
                            <Icon icon="Info" className="me-2 mt-1" />
                            <div>
                                <strong>Authentication (Optional):</strong>
                                <p className="mb-0 small">
                                    Configure authentication in the "Advanced Settings" section below if your n8n workflow requires it.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Authentication Section */}
                    <div className="col-12 mt-3">
                        <div className="card border-0 bg-l25-primary">
                            <div className="card-header bg-transparent">
                                <h6 className="mb-0">
                                    <Icon icon="Security" className="me-2" />
                                    Advanced Settings - Authentication
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <FormGroup label="API Key" id="n8n-api-key">
                                            <Input
                                                type="password"
                                                value={formData.n8n_api_key || ''}
                                                onChange={(e: any) => setFormData({ ...formData, n8n_api_key: e.target.value })}
                                                placeholder="Enter API key (if required)"
                                            />
                                            <small className="text-muted">
                                                Leave empty if webhook is public
                                            </small>
                                        </FormGroup>
                                    </div>

                                    <div className="col-md-6">
                                        <FormGroup label="Auth Header Name" id="n8n-auth-header">
                                            <Input
                                                value={formData.n8n_auth_header || 'X-API-Key'}
                                                onChange={(e: any) => setFormData({ ...formData, n8n_auth_header: e.target.value })}
                                                placeholder="X-API-Key"
                                            />
                                            <small className="text-muted">
                                                HTTP header for API key (default: X-API-Key)
                                            </small>
                                        </FormGroup>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payload Preview */}
                    <div className="col-12 mt-3">
                        <div className="card border-0 bg-l25-secondary">
                            <div className="card-header bg-transparent">
                                <h6 className="mb-0">
                                    <Icon icon="Code" className="me-2" />
                                    Webhook Payload Structure
                                </h6>
                            </div>
                            <div className="card-body">
                                <small className="text-muted">
                                    Your n8n workflow will receive a JSON payload containing:
                                </small>
                                <ul className="small mt-2 mb-0">
                                    <li><code>alert</code> - Alert details (type, severity, status, description)</li>
                                    <li><code>sensor</code> - Sensor information (name, location, status)</li>
                                    <li><code>area</code> - Area context (name, type, parent hierarchy)</li>
                                    <li><code>filter</code> - Filter that triggered the alert (thresholds, conditions)</li>
                                    <li><code>sensor_readings</code> - Latest sensor readings (temperature, CO2, etc.)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {(formData.type === 'email' || formData.type === 'sms') && (
                <>
                    <div className="col-md-6">
                        <FormGroup label="Recipients (Users)">
                            <ReactSelectWithState
                                isMulti
                                options={userOptions}
                                value={userOptions.filter(o => (formData.recipients as number[])?.includes(o.value))}
                                setValue={(vals: any[]) => setFormData({ ...formData, recipients: vals.map(v => v.value) })}
                                placeholder="Select Users..."
                            />
                        </FormGroup>
                    </div>
                    <div className="col-md-6">
                        <FormGroup label="Recipients (Groups)">
                            <ReactSelectWithState
                                isMulti
                                options={groupOptions}
                                value={groupOptions.filter(o => (formData.user_groups as number[])?.includes(o.value))}
                                setValue={(vals: any[]) => setFormData({ ...formData, user_groups: vals.map(v => v.value) })}
                                placeholder="Select Groups..."
                            />
                        </FormGroup>
                    </div>
                </>
            )}

            {formData.type !== 'device_notification' && formData.type !== 'email' && formData.type !== 'sms' && (
                <div className="col-md-6">
                    <FormGroup label="Message Format">
                        <Select
                            value={formData.message_type || 'custom'}
                            onChange={(e: any) => setFormData({ ...formData, message_type: e.target.value })}
                            list={[
                                { value: 'custom', text: 'Plain Text / Custom' },
                                { value: 'json_data', text: 'JSON Data' },
                            ]}
                            ariaLabel="Message Type"
                        />
                    </FormGroup>
                </div>
            )}

            <div className="col-md-3">
                <FormGroup label="Status">
                    <Checks
                        id="is_active"
                        type="switch"
                        label={formData.is_active ? 'Active' : 'Inactive'}
                        checked={formData.is_active}
                        onChange={(e: any) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                </FormGroup>
            </div>

            <div className="col-md-3">
                <FormGroup label="Alert on Failure">
                    <Checks
                        id="alert_on_failure"
                        type="switch"
                        label={formData.alert_on_failure ? 'Yes' : 'No'}
                        checked={formData.alert_on_failure}
                        onChange={(e: any) => setFormData({ ...formData, alert_on_failure: e.target.checked })}
                    />
                </FormGroup>
            </div>

            {formData.type !== 'device_notification' && (formData.message_type === 'custom' || formData.message_type === 'custom_template') && (
                <div className="col-12">
                    <FormGroup label={formData.type === 'email' || formData.type === 'sms' ? 'Message' : 'Request Body'}>
                        <div style={{ position: 'relative' }}>
                            <Textarea
                                value={formData.message_template}
                                onChange={(e: any) => setFormData({ ...formData, message_template: e.target.value })}
                                rows={12}
                                style={{ paddingLeft: '2.7rem', background: 'transparent', position: 'relative', zIndex: 1, height: '100%' }}
                            />
                            {formData.type !== 'email' && formData.type !== 'sms' && (
                                <>
                                    <span style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        color: '#adb5bd',
                                        fontSize: '0.9rem',
                                        pointerEvents: 'none',
                                        zIndex: 0,
                                        fontFamily: 'monospace'
                                    }}>
                                        {'{'}
                                    </span>
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '10px',
                                        color: '#adb5bd',
                                        fontSize: '0.9rem',
                                        pointerEvents: 'none',
                                        zIndex: 0,
                                        fontFamily: 'monospace'
                                    }}>
                                        {'}'}
                                    </span>
                                </>
                            )}
                        </div>
                    </FormGroup>
                </div>
            )}
            <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                <Button color="light" onClick={onCancel}>Cancel</Button>
                <Button
                    color="primary"
                    onClick={() => onSave(formData)}
                    isDisable={!isValid}
                >
                    Save Action
                </Button>
            </div>
        </div>
    );
};

export default ActionForm;
