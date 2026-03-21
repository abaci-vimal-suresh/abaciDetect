import React, { useState, useMemo } from 'react';
import { Action, User, SoundFile, SensorType, Sensor } from '../../../types/sensor';
import Button from '../../../components/bootstrap/Button';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Select from '../../../components/bootstrap/forms/Select';
import Textarea from '../../../components/bootstrap/forms/Textarea';
import Icon from '../../../components/icon/Icon';
import { useUsers, useUserGroups, useSoundFiles, useSensors } from '../../../api/sensors.api';
import ReactSelectWithState from '../../../components/CustomComponent/Select/ReactSelect';
import Checks from '../../../components/bootstrap/forms/Checks';
import {
    LED_COLOR_OPTIONS,
    LED_PATTERN_OPTIONS,
    LED_PRIORITY_OPTIONS
} from '../../../constants/halo.constants';

interface AlertFlowActionFormProps {
    action?: Partial<Action>;
    onSave: (data: Partial<Action>) => void;
    onCancel: () => void;
}

const AlertFlowActionForm: React.FC<AlertFlowActionFormProps> = ({ action, onSave, onCancel }) => {
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
            action_duration_minutes: 1,
            retry_count: 0,
            retry_interval: 60
        };

        const initial = { ...action };

        if (initial.recipients && Array.isArray(initial.recipients)) {
            initial.recipients = initial.recipients.map((r: any) => typeof r === 'object' ? r.id : r);
        }

        if (initial.user_groups && Array.isArray(initial.user_groups)) {
            initial.user_groups = initial.user_groups.map((g: any) => typeof g === 'object' ? g.id : g);
        }

        return initial;
    });

    const { data: users } = useUsers();
    const { data: userGroups } = useUserGroups();
    const { data: soundFiles } = useSoundFiles();

    const userOptions = users?.map((u: User) => ({ value: u.id, label: u.username })) || [];
    const groupOptions = userGroups?.map((g: any) => ({ value: g.id, label: g.name })) || [];
    const soundOptions = soundFiles?.map((s: SoundFile) => ({ value: s.name, text: s.name })) || [];

    const { data: deviceTypeSensors = [] } = useSensors({
        sensor_type: formData.type === 'device_notification' && formData.device_type
            ? String(formData.device_type)
            : undefined,
    });

    const deviceSensorOptions =
        (deviceTypeSensors as Sensor[]).map(sensor => ({
            value: sensor.name,
            label: sensor.sensor_type ? `${sensor.name} (${sensor.sensor_type})` : sensor.name,
        })) || [];

    const normalizedDeviceList: string[] = useMemo(() => {
        if (Array.isArray(formData.device_list)) {
            return formData.device_list.map(String);
        }
        if (typeof formData.device_list === 'string') {
            return formData.device_list
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }
        return [];
    }, [formData.device_list]);

    const isValid = useMemo(() => {
        if (!formData.name?.trim()) return false;

        switch (formData.type) {
            case 'email':
            case 'sms':
                const hasRecipients = (formData.recipients && formData.recipients.length > 0) ||
                    (formData.user_groups && formData.user_groups.length > 0);
                const hasMessage = !!formData.message_template?.trim();
                if (formData.type === 'sms' && !hasMessage) return false;
                return hasRecipients;

            case 'device_notification':
                const hasDeviceList = Array.isArray(formData.device_list) && formData.device_list.length > 0;
                return hasDeviceList && !!formData.device_type;

            case 'webhook':
                if (!formData.webhook_url?.trim() || !formData.http_method) return false;
                return true;

            case 'n8n_workflow':
                return !!formData.n8n_workflow_url?.trim();

            default:
                return true;
        }
    }, [formData]);

    return (
        <div className="row g-4">
            {/* ── Basic Info ── */}
            <div className="col-12">
                <FormGroup label="Action Name">
                    <Input
                        value={formData.name || ''}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Send Critical Email"
                    />
                </FormGroup>
            </div>

            <div className="col-12">
                <div className="d-flex align-items-center justify-content-between p-2 border rounded bg-light">
                    <span className="small fw-bold text-muted text-uppercase">Status</span>
                    <Checks
                        id="is_active_flow_action"
                        type="switch"
                        label={formData.is_active ? 'Active' : 'Inactive'}
                        checked={formData.is_active}
                        onChange={(e: any) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                </div>
            </div>

            <div className="col-12">
                <FormGroup label="Action Type">
                    <Select
                        ariaLabel="Action Type"
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
                    />
                </FormGroup>
            </div>

            {/* Recipients Section for Email/SMS */}
            {(formData.type === 'email' || formData.type === 'sms') && (
                <>
                    <div className="col-12">
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
                    <div className="col-12">
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

            {/* Webhook Specific */}
            {formData.type === 'webhook' && (
                <>
                    <div className="col-4">
                        <FormGroup label="Method">
                            <Select
                                ariaLabel="HTTP Method"
                                value={formData.http_method || 'POST'}
                                onChange={(e: any) => setFormData({ ...formData, http_method: e.target.value })}
                                list={[
                                    { value: 'GET', text: 'GET' },
                                    { value: 'POST', text: 'POST' },
                                    { value: 'PUT', text: 'PUT' },
                                    { value: 'PATCH', text: 'PATCH' },
                                    { value: 'DELETE', text: 'DELETE' },
                                ]}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-8">
                        <FormGroup label="URL">
                            <Input
                                value={formData.webhook_url || ''}
                                onChange={(e: any) => setFormData({ ...formData, webhook_url: e.target.value })}
                                placeholder="https://api.example.com/webhook"
                                type="url"
                            />
                        </FormGroup>
                    </div>
                </>
            )}

            {/* Device Notification Specific */}
            {formData.type === 'device_notification' && (
                <>
                    <div className="col-12">
                        <FormGroup label="Device Type">
                            <Select
                                ariaLabel="Device Type"
                                value={formData.device_type || ''}
                                onChange={(e: any) => setFormData({
                                    ...formData,
                                    device_type: e.target.value as SensorType,
                                    device_list: [],
                                })}
                                list={[
                                    { value: '', text: 'Select Device Type' },
                                    { value: 'HALO_3C', text: 'HALO 3C' },
                                    { value: 'HALO_IOT', text: 'HALO IOT' },
                                    { value: 'HALO_SMART', text: 'HALO Smart' },
                                    { value: 'HALO_CUSTOM', text: 'HALO Custom' },
                                ]}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup label="Target Devices">
                            <ReactSelectWithState
                                isMulti
                                options={deviceSensorOptions}
                                value={deviceSensorOptions.filter(o => normalizedDeviceList.includes(o.value))}
                                setValue={(vals: any[]) =>
                                    setFormData({
                                        ...formData,
                                        device_list: vals.map(v => v.value),
                                    })
                                }
                                placeholder={formData.device_type ? 'Select devices...' : 'Select device type first'}
                                isDisabled={!formData.device_type}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup label="Sound File">
                            <Select
                                ariaLabel="Sound File"
                                value={formData.device_sound || ''}
                                onChange={(e: any) => setFormData({ ...formData, device_sound: e.target.value })}
                                list={[
                                    { value: '', text: 'No Sound' },
                                    ...soundOptions
                                ]}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-6">
                        <FormGroup label="LED Color">
                            <Select
                                ariaLabel="LED Color"
                                value={String(formData.device_led_color || 16777215)}
                                onChange={(e: any) => setFormData({ ...formData, device_led_color: parseInt(e.target.value) || 16777215 })}
                                list={LED_COLOR_OPTIONS.map(opt => ({ value: opt.value.toString(), text: opt.label }))}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-6">
                        <FormGroup label="LED Pattern">
                            <Select
                                ariaLabel="LED Pattern"
                                value={String(formData.device_led_pattern || 200004)}
                                onChange={(e: any) => setFormData({ ...formData, device_led_pattern: parseInt(e.target.value) || 200004 })}
                                list={LED_PATTERN_OPTIONS.map(opt => ({ value: opt.value.toString(), text: opt.label }))}
                            />
                        </FormGroup>
                    </div>
                </>
            )}

            {/* N8N Workflow Specific */}
            {formData.type === 'n8n_workflow' && (
                <div className="col-12">
                    <FormGroup label="Workflow Webhook URL">
                        <Input
                            value={formData.n8n_workflow_url || ''}
                            onChange={(e: any) => setFormData({ ...formData, n8n_workflow_url: e.target.value })}
                            placeholder="https://your-n8n-instance.com/webhook/..."
                            type="url"
                        />
                    </FormGroup>
                </div>
            )}

            {/* Message Template Table */}
            {formData.type !== 'device_notification' && (
                <div className="col-12">
                    <FormGroup label={formData.type === 'email' || formData.type === 'sms' ? 'Message' : 'Request Body'}>
                        <Textarea
                            value={formData.message_template || ''}
                            onChange={(e: any) => setFormData({ ...formData, message_template: e.target.value })}
                            rows={8}
                        />
                    </FormGroup>
                </div>
            )}

            {/* ── Footer ── */}
            <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Button color="light" onClick={onCancel}>Cancel</Button>
                <Button color="primary" onClick={() => onSave(formData)} isDisable={!isValid}>
                    Save Changes
                </Button>
            </div>
        </div>
    );
};

export default AlertFlowActionForm;
