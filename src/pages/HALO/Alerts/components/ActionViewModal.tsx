import React from 'react';
import { Action } from '../../../../types/sensor';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../../components/bootstrap/Modal';
import Badge from '../../../../components/bootstrap/Badge';
import Icon from '../../../../components/icon/Icon';
import useDarkMode from '../../../../hooks/useDarkMode';
import Button from '../../../../components/bootstrap/Button';
import Label from '../../../../components/bootstrap/forms/Label';

interface ActionViewModalProps {
    action: Action | null;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const ActionViewModal: React.FC<ActionViewModalProps> = ({ action, isOpen, setIsOpen }) => {
    const { themeStatus } = useDarkMode();

    if (!action) return null;

    const typeMap: any = {
        email: 'Email Notification',
        sms: 'SMS Notification',
        webhook: 'Webhook / HTTP',
        n8n_workflow: 'n8n Workflow',
        device_notification: 'Device Command',
        push_notification: 'Push Notification',
        slack: 'Slack',
        teams: 'Microsoft Teams',
    };

    const typeIconMap: any = {
        email: 'Email',
        sms: 'Sms',
        webhook: 'Webhook',
        n8n_workflow: 'AccountTree',
        device_notification: 'Devices',
        push_notification: 'NotificationsActive',
        slack: 'Chat',
        teams: 'Groups',
    };

    const typeColorMap: any = {
        email: '#0dcaf0',
        sms: '#20c997',
        webhook: '#fd7e14',
        n8n_workflow: '#6f42c1',
        device_notification: '#dc3545',
        push_notification: '#6c757d',
    };

    const accentColor = typeColorMap[action.type] || '#0d6efd';

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" isCentered isScrollable>
            <ModalHeader setIsOpen={setIsOpen}>
                Action Details: {action.name}
            </ModalHeader>
            <ModalBody>
                <div className='row g-3'>
                    <div className='col-12 text-center mb-4'>
                        <div
                            className='neumorphic-icon-container mx-auto mb-3'
                            style={{
                                width: '80px',
                                height: '80px',
                                background: themeStatus === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#e0e5ec',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: themeStatus === 'dark'
                                    ? '0 0 20px rgba(0,0,0,0.5)'
                                    : '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff'
                            }}
                        >
                            <Icon
                                icon={typeIconMap[action.type] || 'Notifications'}
                                size='3x'
                                style={{ color: accentColor }}
                            />
                        </div>
                        <div className='h4 fw-bold mb-1'>
                            {action.name}
                        </div>
                        <div className='text-muted small'>
                            ID: {action.id} • Type: {typeMap[action.type] || action.type}
                        </div>
                    </div>

                    <div className='col-12'>
                        {/* Status & General */}
                        <div className='border-top pt-3 mb-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                            <div className='row g-3'>
                                <div className='col-md-6'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Status</Label>
                                    <div className='p-2'>
                                        <Badge color={action.is_active ? 'success' : 'warning'} isLight>
                                            {action.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Created By</Label>
                                    <div className='fw-bold p-2 text-primary'>
                                        {(action as any).created_by_username || '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Config Specifics */}
                        <div className='border-top pt-3 mb-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                            {action.type === 'webhook' && (
                                <div className='row g-3'>
                                    <div className='col-12'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Webhook URL</Label>
                                        <div className='p-3 rounded' style={{ background: themeStatus === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f8f9fa', borderLeft: `4px solid ${accentColor}`, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                            <Badge color="info" className="me-2">{action.http_method || 'POST'}</Badge>
                                            {action.webhook_url}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {action.type === 'n8n_workflow' && (
                                <div className='row g-3'>
                                    <div className='col-md-6'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Workflow ID</Label>
                                        <div className='fw-bold p-2'>{action.n8n_workflow_id || '—'}</div>
                                    </div>
                                    <div className='col-12'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Workflow URL</Label>
                                        <div className='p-2 rounded italic small' style={{ background: themeStatus === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f8f9fa', borderLeft: `4px solid ${accentColor}` }}>
                                            {action.n8n_workflow_url || '—'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {action.type === 'device_notification' && (
                                <div className='row g-3'>
                                    <div className='col-md-6'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Device Type</Label>
                                        <div className='p-2'>
                                            <Badge color="primary" isLight>{action.device_type || 'HALO'}</Badge>
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Sound File</Label>
                                        <div className='p-2 fw-semibold'>
                                            <Icon icon="MusicNote" size="sm" className="me-1 text-info" />
                                            {action.device_sound || 'None'}
                                        </div>
                                    </div>
                                    <div className='col-12'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>LED Configuration</Label>
                                        <div className='d-flex gap-3 p-2'>
                                            <div><span className='text-muted small'>Color:</span> <span className='fw-bold'>{action.device_led_color ?? '—'}</span></div>
                                            <div><span className='text-muted small'>Pattern:</span> <span className='fw-bold'>{action.device_led_pattern ?? '—'}</span></div>
                                            <div><span className='text-muted small'>Priority:</span> <span className='fw-bold'>{action.device_led_priority ?? '—'}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recipients */}
                        {(action.type === 'email' || action.type === 'sms' || action.type === 'push_notification') && (
                            <div className='border-top pt-3 mb-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                                <div className='row g-3'>
                                    <div className='col-md-6'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Recipients</Label>
                                        <div className='d-flex flex-wrap gap-1 p-2'>
                                            {action.recipients?.length ? action.recipients.map((u: any) => (
                                                <Badge key={u.id} color="info" isLight>
                                                    <Icon icon="Person" size="sm" className="me-1" />
                                                    {u.username || u.email}
                                                </Badge>
                                            )) : <span className='text-muted small'>None</span>}
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>User Groups</Label>
                                        <div className='d-flex flex-wrap gap-1 p-2'>
                                            {action.user_groups?.length ? action.user_groups.map((g: any) => (
                                                <Badge key={g.id} color="success" isLight>
                                                    <Icon icon="Group" size="sm" className="me-1" />
                                                    {g.name}
                                                </Badge>
                                            )) : <span className='text-muted small'>None</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Message Template */}
                        {action.message_template && (
                            <div className='border-top pt-3 mb-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                                <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Message Template</Label>
                                <div className='p-3 rounded' style={{ background: themeStatus === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#f8f9fa', borderLeft: '4px solid #6c757d' }}>
                                    <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                        {action.message_template}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <div className='border-top pt-3' style={{ borderColor: themeStatus === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}>
                            <div className='row g-3'>
                                <div className='col-md-6'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Created At</Label>
                                    <div className='text-muted small p-2'>
                                        <Icon icon='CalendarToday' className='me-1' />
                                        {action.created_at ? new Date(action.created_at).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1' style={{ opacity: 0.8 }}>Last Updated</Label>
                                    <div className='text-muted small p-2'>
                                        <Icon icon='EditCalendar' className='me-1' />
                                        {action.updated_at ? new Date(action.updated_at).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className='justify-content-center border-0 pb-4'>
                <Button
                    className='btn-neumorphic px-5 py-2'
                    onClick={() => setIsOpen(false)}
                >
                    Close Details
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ActionViewModal;
