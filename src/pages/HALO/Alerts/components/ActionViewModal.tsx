import React from 'react';
import { Action } from '../../../../types/sensor';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../../components/bootstrap/Modal';
import Badge from '../../../../components/bootstrap/Badge';
import Icon from '../../../../components/icon/Icon';

interface ActionViewModalProps {
    action: Action | null;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const ActionViewModal: React.FC<ActionViewModalProps> = ({ action, isOpen, setIsOpen }) => {
    if (!action) return null;

    const typeMap: any = {
        'email': 'Email Notification',
        'sms': 'SMS Notification',
        'webhook': 'Webhook/HTTP',
        'n8n_workflow': 'n8n Workflow',
        'device_notification': 'Device Command',
        'push_notification': 'Push Notification',
        'slack': 'Slack',
        'teams': 'Microsoft Teams'
    };

    const messageTypeMap: any = {
        'json_data': 'JSON Data',
        'jsondata': 'JSON Data',
        'custom_template': 'Custom Template',
        'custom': 'Custom Message'
    };

    const renderRecipients = () => {
        const userCount = action.recipients?.length || 0;
        const groupCount = action.user_groups?.length || 0;

        if (userCount === 0 && groupCount === 0) {
            return <span className="text-muted">None</span>;
        }

        return (
            <div>
                {userCount > 0 && (
                    <div className="mb-2">
                        <strong className="d-block mb-1"><Icon icon="Person" size="sm" className="me-1" />Users ({userCount})</strong>
                        <ul className="list-unstyled ms-3">
                            {action.recipients?.map((user: any) => (
                                <li key={user.id} className="mb-1">
                                    <Badge color="info" isLight className="me-2">{user.username}</Badge>
                                    <small className="text-muted">{user.email}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {groupCount > 0 && (
                    <div>
                        <strong className="d-block mb-1"><Icon icon="Groups" size="sm" className="me-1" />Groups ({groupCount})</strong>
                        <ul className="list-unstyled ms-3">
                            {action.user_groups?.map((group: any) => (
                                <li key={group.id} className="mb-1">
                                    <Badge color="success" isLight className="me-2">{group.name}</Badge>
                                    <small className="text-muted">{group.description}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderDeviceList = () => {
        if (!action.device_list || !Array.isArray(action.device_list) || action.device_list.length === 0) {
            return <span className="text-muted">None</span>;
        }

        return (
            <ul className="list-unstyled">
                {action.device_list.map((device: any, index: number) => (
                    <li key={index} className="mb-2">
                        {typeof device === 'object' ? (
                            <div className="d-flex align-items-center">
                                <Icon icon="Sensors" size="sm" className="me-2" />
                                <div>
                                    <strong>{device.name}</strong>
                                    <div className="small text-muted">
                                        Type: {device.sensor_type} | Status: {device.is_online ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Badge color="secondary" isLight>{device}</Badge>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" isCentered isScrollable>
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id="action-view-modal">
                    <Icon icon="Visibility" className="me-2" />
                    Action Details
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                <div className="row g-4">
                    {/* Basic Information */}
                    <div className="col-12">
                        <div className="card border-0">
                            <div className="card-body">
                                <h5 className="card-title mb-3">
                                    <Icon icon="Info" className="me-2" />
                                    Basic Information
                                </h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <strong className="d-block text-muted small">Action Name</strong>
                                        <span className="fs-6">{action.name}</span>
                                    </div>
                                    <div className="col-md-6">
                                        <strong className="d-block text-muted small">Type</strong>
                                        <Badge color="info">{typeMap[action.type] || action.type.toUpperCase()}</Badge>
                                    </div>
                                    <div className="col-md-6">
                                        <strong className="d-block text-muted small">Status</strong>
                                        <Badge color={action.is_active ? 'success' : 'warning'}>
                                            {action.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="col-md-6">
                                        <strong className="d-block text-muted small">Alert on Failure</strong>
                                        <Badge color={action.alert_on_failure ? 'danger' : 'secondary'}>
                                            {action.alert_on_failure ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                    <div className="col-md-6">
                                        <strong className="d-block text-muted small">Created By</strong>
                                        <span>{(action as any).created_by_username || 'N/A'}</span>
                                    </div>
                                    <div className="col-md-6">
                                        <strong className="d-block text-muted small">Created At</strong>
                                        <span>{new Date(action.created_at || '').toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Webhook Specific */}
                    {action.type === 'webhook' && (
                        <div className="col-12">
                            <div className="card border-0 ">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">
                                        <Icon icon="Webhook" className="me-2" />
                                        Webhook Configuration
                                    </h5>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <strong className="d-block text-muted small">HTTP Method</strong>
                                            <Badge color="warning">{action.http_method || 'N/A'}</Badge>
                                        </div>
                                        <div className="col-md-8">
                                            <strong className="d-block text-muted small">Webhook URL</strong>
                                            <code className="small">{action.webhook_url || 'N/A'}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* N8N Workflow Specific */}
                    {action.type === 'n8n_workflow' && (
                        <div className="col-12">
                            <div className="card border-0 ">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">
                                        <Icon icon="AccountTree" className="me-2" />
                                        N8N Workflow Configuration
                                    </h5>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <strong className="d-block text-muted small">Workflow ID</strong>
                                            <span>{(action as any).n8n_workflow_id || 'N/A'}</span>
                                        </div>
                                        <div className="col-12">
                                            <strong className="d-block text-muted small">Workflow URL</strong>
                                            <code className="small">{(action as any).n8n_workflow_url || 'N/A'}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Device Notification Specific */}
                    {action.type === 'device_notification' && (
                        <div className="col-12">
                            <div className="card border-0 ">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">
                                        <Icon icon="Devices" className="me-2" />
                                        Device Configuration
                                    </h5>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <strong className="d-block text-muted small">Device Type</strong>
                                            <Badge color="primary">{action.device_type || 'HALO'}</Badge>
                                        </div>
                                        <div className="col-md-4">
                                            <strong className="d-block text-muted small">Sound File</strong>
                                            <span>{(action as any).device_sound || 'No Sound'}</span>
                                        </div>
                                        <div className="col-md-4">
                                            <strong className="d-block text-muted small">Duration (Minutes)</strong>
                                            <span>{action.action_duration_minutes || 1}</span>
                                        </div>
                                        <div className="col-md-4">
                                            <strong className="d-block text-muted small">LED Color</strong>
                                            <span>{(action as any).device_led_color || 'N/A'}</span>
                                        </div>
                                        <div className="col-md-4">
                                            <strong className="d-block text-muted small">LED Pattern</strong>
                                            <span>{(action as any).device_led_pattern || 'N/A'}</span>
                                        </div>
                                        <div className="col-md-4">
                                            <strong className="d-block text-muted small">LED Priority</strong>
                                            <span>{(action as any).device_led_priority || 'N/A'}</span>
                                        </div>
                                        <div className="col-12">
                                            <strong className="d-block text-muted small mb-2">Target Devices</strong>
                                            {renderDeviceList()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recipients (Email/SMS) */}
                    {(action.type === 'email' || action.type === 'sms') && (
                        <div className="col-12">
                            <div className="card border-0 ">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">
                                        <Icon icon="People" className="me-2" />
                                        Recipients
                                    </h5>
                                    {renderRecipients()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message Configuration */}
                    {action.type !== 'device_notification' && action.message_template && (
                        <div className="col-12">
                            <div className="card border-0 ">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">
                                        <Icon icon="Message" className="me-2" />
                                        Message
                                    </h5>
                                    <div className="p-3 bg-light rounded">
                                        <pre className="mb-0 small">{action.message_template}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
};

export default ActionViewModal;
