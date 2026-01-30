import React, { useState } from 'react';
import { Action, User } from '../../../../types/sensor';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Select from '../../../../components/bootstrap/forms/Select';
import Textarea from '../../../../components/bootstrap/forms/Textarea';
import { useUsers, useUserGroups } from '../../../../api/sensors.api';
import ReactSelectWithState from '../../../../components/CustomComponent/Select/ReactSelect';

interface ActionFormProps {
    action?: Partial<Action>;
    onSave: (data: Partial<Action>) => void;
    onCancel: () => void;
}

const ActionForm: React.FC<ActionFormProps> = ({ action, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Action>>(action || {
        name: '',
        type: 'email',
        recipients: [],
        message_type: 'custom',
        message_template: '',
        is_active: true
    });

    const { data: users } = useUsers();
    const { data: userGroups } = useUserGroups();

    const userOptions = users?.map((u: User) => ({ value: u.id, label: u.username })) || [];
    const groupOptions = userGroups?.map((g: any) => ({ value: g.id, label: g.name })) || [];

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
                        onChange={(e: any) => setFormData({ ...formData, type: e.target.value as any })}
                        list={[
                            { value: 'email', text: 'Email' },
                            { value: 'sms', text: 'SMS' },
                            { value: 'device_notification', text: 'Device Command' },
                            { value: 'webhook', text: 'Webhook' },
                        ]}
                        ariaLabel="Action Type"
                    />
                </FormGroup>
            </div>

            {/* Webhook Specific */}
            {formData.type === 'webhook' && (
                <>
                    <div className="col-md-6">
                        <FormGroup label="HTTP Method">
                            <Select
                                value={formData.http_method || 'POST'}
                                onChange={(e: any) => setFormData({ ...formData, http_method: e.target.value })}
                                list={[
                                    { value: 'POST', text: 'POST' },
                                    { value: 'GET', text: 'GET' },
                                    { value: 'PUT', text: 'PUT' },
                                ]}
                                ariaLabel="HTTP Method"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup label="Webhook URL">
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
                    <div className="col-md-6">
                        <FormGroup label="Device Type">
                            <Select
                                value={formData.device_type || 'HALO'}
                                onChange={(e: any) => setFormData({ ...formData, device_type: e.target.value })}
                                list={[
                                    { value: 'HALO', text: 'HALO Standard' },
                                    { value: 'HALO_SMART', text: 'HALO Smart' },
                                    { value: 'HALO_IOT', text: 'HALO IoT' },
                                ]}
                                ariaLabel="Device Type"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup label="Target Device List (Comma Separation)">
                            <Input
                                value={formData.device_list || ''}
                                onChange={(e: any) => setFormData({ ...formData, device_list: e.target.value })}
                                placeholder="device_001, device_002"
                            />
                        </FormGroup>
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
                                value={userOptions.filter(o => formData.recipients?.includes(o.value))}
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
                                value={groupOptions.filter(o => formData.user_groups?.includes(o.value))}
                                setValue={(vals: any[]) => setFormData({ ...formData, user_groups: vals.map(v => v.value) })}
                                placeholder="Select Groups..."
                            />
                        </FormGroup>
                    </div>
                </>
            )}

            <div className="col-md-6">
                <FormGroup label="Message Type">
                    <Select
                        value={formData.message_type || 'custom'}
                        onChange={(e: any) => setFormData({ ...formData, message_type: e.target.value })}
                        list={[
                            { value: 'custom', text: 'Custom' },
                            { value: 'jsondata', text: 'JSON Data' },
                        ]}
                        ariaLabel="Message Type"
                    />
                </FormGroup>
            </div>

            {formData.message_type === 'custom' && (
                <div className="col-12">
                    <FormGroup label="Message Template">
                        <Textarea
                            value={formData.message_template}
                            onChange={(e: any) => setFormData({ ...formData, message_template: e.target.value })}
                            placeholder="ALERT: {sensor_name} in {area_name} reached {value}"
                            rows={4}
                        />
                        <small className="text-muted">
                            Placeholders: {'{sensor_name}'}, {'{area_name}'}, {'{value}'}, {'{threshold}'}
                        </small>
                    </FormGroup>
                </div>
            )}
            <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                <Button color="light" onClick={onCancel}>Cancel</Button>
                <Button color="primary" onClick={() => onSave(formData)} isDisable={!formData.name || !formData.message_template}>
                    Save Action
                </Button>
            </div>
        </div>
    );
};

export default ActionForm;
