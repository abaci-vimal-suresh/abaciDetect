import React, { useState } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import {
    useAlertRules,
    useCreateAlertRule,
    useUpdateAlertRule,
    useDeleteAlertRule,
    useNotificationChannels,
    useCreateNotificationChannel,
    AlertRule,
} from '../../../../api/device.setting.api';
import Input from '../../../../components/bootstrap/forms/Input';

interface AlertNotificationSectionProps {
    deviceId: string;
}

const AlertNotificationSection: React.FC<AlertNotificationSectionProps> = ({ deviceId }) => {
    const { data: rules, isLoading: rulesLoading } = useAlertRules(deviceId);
    const { data: channels, isLoading: channelsLoading } = useNotificationChannels(deviceId);
    const createRuleMutation = useCreateAlertRule();
    const updateRuleMutation = useUpdateAlertRule();
    const deleteRuleMutation = useDeleteAlertRule();
    const createChannelMutation = useCreateNotificationChannel();

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

    const [ruleForm, setRuleForm] = useState({
        event_type: '',
        condition: 'GREATER_THAN' as 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'BETWEEN',
        threshold_value: 0,
        threshold_value_max: 0,
        duration_seconds: 0,
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        enabled: true,
    });

    const [channelForm, setChannelForm] = useState({
        channel_type: 'EMAIL' as 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK',
        destination: '',
        enabled: true,
        events: [] as string[],
    });

    const eventTypes = [
        'Motion', 'AQI', 'PM1', 'PM2.5', 'PM10', 'CO2', 'Temperature',
        'Humidity', 'Noise', 'Light', 'Gunshot', 'Aggression', 'Health_Index'
    ];

    const handleCreateRule = () => {
        createRuleMutation.mutate(
            { device_id: parseInt(deviceId), ...ruleForm },
            {
                onSuccess: () => {
                    setIsRuleModalOpen(false);
                    setRuleForm({
                        event_type: '',
                        condition: 'GREATER_THAN',
                        threshold_value: 0,
                        threshold_value_max: 0,
                        duration_seconds: 0,
                        priority: 'MEDIUM',
                        enabled: true,
                    });
                },
            }
        );
    };

    const handleToggleRule = (rule: AlertRule) => {
        updateRuleMutation.mutate({ ...rule, enabled: !rule.enabled });
    };

    const handleDeleteRule = (ruleId: number) => {
        if (confirm('Are you sure you want to delete this alert rule?')) {
            deleteRuleMutation.mutate(ruleId);
        }
    };

    const handleCreateChannel = () => {
        createChannelMutation.mutate(
            { device_id: parseInt(deviceId), ...channelForm },
            {
                onSuccess: () => {
                    setIsChannelModalOpen(false);
                    setChannelForm({
                        channel_type: 'EMAIL',
                        destination: '',
                        enabled: true,
                        events: [],
                    });
                },
            }
        );
    };

    if (rulesLoading || channelsLoading) {
        return (
            <Card>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' />
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <div className='h-100 overflow-auto p-1'>
                <div className='row g-4'>
                    {/* Alert Rules Section */}
                    <div className='col-12'>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <Icon icon='Notifications' className='me-2' />
                                    Alert Rules
                                </CardTitle>
                                <CardActions>
                                    <Button
                                        color='primary'
                                        icon='Add'
                                        onClick={() => setIsRuleModalOpen(true)}
                                    >
                                        Add Rule
                                    </Button>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                {rules && rules.length > 0 ? (
                                    <div className='table-responsive'>
                                        <table className='table table-hover'>
                                            <thead>
                                                <tr>
                                                    <th>Event</th>
                                                    <th>Condition</th>
                                                    <th>Threshold</th>
                                                    <th>Priority</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rules.map((rule) => (
                                                    <tr key={rule.id}>
                                                        <td>{rule.event_type}</td>
                                                        <td>{rule.condition.replace('_', ' ')}</td>
                                                        <td>
                                                            {rule.threshold_value}
                                                            {rule.condition === 'BETWEEN' &&
                                                                ` - ${rule.threshold_value_max}`}
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                color={
                                                                    rule.priority === 'CRITICAL'
                                                                        ? 'danger'
                                                                        : rule.priority === 'HIGH'
                                                                            ? 'warning'
                                                                            : rule.priority === 'MEDIUM'
                                                                                ? 'info'
                                                                                : 'secondary'
                                                                }
                                                            >
                                                                {rule.priority}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Badge color={rule.enabled ? 'success' : 'secondary'}>
                                                                {rule.enabled ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                color='info'
                                                                size='sm'
                                                                isLight
                                                                icon={rule.enabled ? 'ToggleOn' : 'ToggleOff'}
                                                                onClick={() => handleToggleRule(rule)}
                                                                className='me-2'
                                                            />
                                                            <Button
                                                                color='danger'
                                                                size='sm'
                                                                isLight
                                                                icon='Delete'
                                                                onClick={() => rule.id && handleDeleteRule(rule.id)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <Alert color='info' icon='Info'>
                                        No alert rules configured. Click "Add Rule" to create your first alert rule.
                                    </Alert>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Notification Channels Section */}
                    <div className='col-12'>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <Icon icon='Send' className='me-2' />
                                    Notification Channels
                                </CardTitle>
                                <CardActions>
                                    <Button
                                        color='primary'
                                        icon='Add'
                                        onClick={() => setIsChannelModalOpen(true)}
                                    >
                                        Add Channel
                                    </Button>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                {channels && channels.length > 0 ? (
                                    <div className='row g-3'>
                                        {channels.map((channel) => (
                                            <div key={channel.id} className='col-md-6'>
                                                <Card className='shadow-sm'>
                                                    <CardBody>
                                                        <div className='d-flex align-items-start justify-content-between mb-2'>
                                                            <div className='d-flex align-items-center'>
                                                                <Icon
                                                                    icon={
                                                                        channel.channel_type === 'EMAIL'
                                                                            ? 'Email'
                                                                            : channel.channel_type === 'SMS'
                                                                                ? 'Message'
                                                                                : channel.channel_type === 'PUSH'
                                                                                    ? 'Notifications'
                                                                                    : 'Link'
                                                                    }
                                                                    className='me-2'
                                                                    color='primary'
                                                                />
                                                                <strong>{channel.channel_type}</strong>
                                                            </div>
                                                            <Badge color={channel.enabled ? 'success' : 'secondary'}>
                                                                {channel.enabled ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                        <div className='small text-muted mb-2'>{channel.destination}</div>
                                                        <div className='small'>
                                                            <strong>Events:</strong> {channel.events.join(', ')}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Alert color='info' icon='Info'>
                                        No notification channels configured. Add a channel to receive alerts.
                                    </Alert>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Add Alert Rule Modal */}
            <Modal isOpen={isRuleModalOpen} setIsOpen={setIsRuleModalOpen} size='lg' isCentered>
                <ModalHeader setIsOpen={setIsRuleModalOpen}>
                    <ModalTitle id='rule-modal-title'>Create Alert Rule</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-md-6'>
                            <FormGroup label='Event Type'>
                                <select
                                    className='form-select'
                                    value={ruleForm.event_type}
                                    onChange={(e) => setRuleForm({ ...ruleForm, event_type: e.target.value })}
                                >
                                    <option value=''>Select event...</option>
                                    {eventTypes.map((event) => (
                                        <option key={event} value={event}>
                                            {event}
                                        </option>
                                    ))}
                                </select>
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Condition'>
                                <select
                                    className='form-select'
                                    value={ruleForm.condition}
                                    onChange={(e) =>
                                        setRuleForm({
                                            ...ruleForm,
                                            condition: e.target.value as any,
                                        })
                                    }
                                >
                                    <option value='GREATER_THAN'>Greater Than</option>
                                    <option value='LESS_THAN'>Less Than</option>
                                    <option value='EQUALS'>Equals</option>
                                    <option value='BETWEEN'>Between</option>
                                </select>
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Threshold Value'>
                                <Input
                                    type='number'
                                    value={ruleForm.threshold_value}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setRuleForm({ ...ruleForm, threshold_value: parseFloat(e.target.value) })
                                    }
                                    step={0.1}
                                />
                            </FormGroup>
                        </div>
                        {ruleForm.condition === 'BETWEEN' && (
                            <div className='col-md-6'>
                                <FormGroup label='Max Value'>
                                    <Input
                                        type='number'
                                        value={ruleForm.threshold_value_max}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setRuleForm({
                                                ...ruleForm,
                                                threshold_value_max: parseFloat(e.target.value),
                                            })
                                        }
                                        step={0.1}
                                    />
                                </FormGroup>
                            </div>
                        )}
                        <div className='col-md-6'>
                            <FormGroup label='Duration (seconds)'>
                                <Input
                                    type='number'
                                    value={ruleForm.duration_seconds}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setRuleForm({ ...ruleForm, duration_seconds: parseInt(e.target.value) })
                                    }
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Priority'>
                                <select
                                    className='form-select'
                                    value={ruleForm.priority}
                                    onChange={(e) =>
                                        setRuleForm({ ...ruleForm, priority: e.target.value as any })
                                    }
                                >
                                    <option value='LOW'>Low</option>
                                    <option value='MEDIUM'>Medium</option>
                                    <option value='HIGH'>High</option>
                                    <option value='CRITICAL'>Critical</option>
                                </select>
                            </FormGroup>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsRuleModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleCreateRule}
                        isDisable={createRuleMutation.isPending}
                    >
                        {createRuleMutation.isPending && <Spinner isSmall inButton />}
                        Create Rule
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Add Notification Channel Modal */}
            <Modal isOpen={isChannelModalOpen} setIsOpen={setIsChannelModalOpen} size='lg' isCentered>
                <ModalHeader setIsOpen={setIsChannelModalOpen}>
                    <ModalTitle id='channel-modal-title'>Add Notification Channel</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
                            <FormGroup label='Channel Type'>
                                <select
                                    className='form-select'
                                    value={channelForm.channel_type}
                                    onChange={(e) =>
                                        setChannelForm({ ...channelForm, channel_type: e.target.value as any })
                                    }
                                >
                                    <option value='EMAIL'>Email</option>
                                    <option value='SMS'>SMS</option>
                                    <option value='PUSH'>Push Notification</option>
                                    <option value='WEBHOOK'>Webhook</option>
                                </select>
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup
                                label={
                                    channelForm.channel_type === 'EMAIL'
                                        ? 'Email Address'
                                        : channelForm.channel_type === 'SMS'
                                            ? 'Phone Number'
                                            : channelForm.channel_type === 'WEBHOOK'
                                                ? 'Webhook URL'
                                                : 'Device Token'
                                }
                            >
                                <Input
                                    type='text'
                                    value={channelForm.destination}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setChannelForm({ ...channelForm, destination: e.target.value })
                                    }
                                    placeholder={
                                        channelForm.channel_type === 'EMAIL'
                                            ? 'user@example.com'
                                            : channelForm.channel_type === 'SMS'
                                                ? '+1234567890'
                                                : 'https://...'
                                    }
                                />
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Subscribe to Events'>
                                <div className='row g-2'>
                                    {eventTypes.map((event) => (
                                        <div key={event} className='col-md-4'>
                                            <div className='form-check'>
                                                <input
                                                    className='form-check-input'
                                                    type='checkbox'
                                                    id={`event-${event}`}
                                                    checked={channelForm.events.includes(event)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setChannelForm({
                                                                ...channelForm,
                                                                events: [...channelForm.events, event],
                                                            });
                                                        } else {
                                                            setChannelForm({
                                                                ...channelForm,
                                                                events: channelForm.events.filter((ev) => ev !== event),
                                                            });
                                                        }
                                                    }}
                                                />
                                                <label className='form-check-label' htmlFor={`event-${event}`}>
                                                    {event}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FormGroup>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsChannelModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleCreateChannel}
                        isDisable={createChannelMutation.isPending}
                    >
                        {createChannelMutation.isPending && <Spinner isSmall inButton />}
                        Add Channel
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default AlertNotificationSection;