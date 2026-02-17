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

    const methodColorMap: any = {
        GET: 'success',
        POST: 'info',
        PUT: 'warning',
        PATCH: 'secondary',
        DELETE: 'danger',
    };

    const accentColor = typeColorMap[action.type] || '#0d6efd';

    // ── small helpers ─────────────────────────────────────────────────────────

    const Field: React.FC<{ label: string; children: React.ReactNode; full?: boolean }> = ({ label, children, full }) => (
        <div className={full ? 'col-12' : 'col-md-6'}>
            <p className="mb-1" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>
                {label}
            </p>
            <div style={{ fontSize: '0.875rem' }}>{children}</div>
        </div>
    );

    const UrlBox: React.FC<{ url: string }> = ({ url }) => (
        <div className="d-flex align-items-center gap-2 rounded px-3 py-2"
            style={{ background: '#f8f9fa', border: '1px solid #e9ecef', fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all' }}>
            <Icon icon="Link" size="sm" className="text-muted flex-shrink-0" />
            <span>{url}</span>
        </div>
    );

    const EmptyState: React.FC<{ text: string }> = ({ text }) => (
        <span className="text-muted fst-italic" style={{ fontSize: '0.82rem' }}>{text}</span>
    );

    const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <p className="mb-2 fw-bold text-uppercase text-muted"
            style={{ letterSpacing: '0.08em', fontSize: '0.68rem' }}>
            {children}
        </p>
    );

    const SectionBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="p-3 rounded-2" style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}>
            {children}
        </div>
    );

    // ── recipients ────────────────────────────────────────────────────────────

    const renderRecipients = () => {
        const users = action.recipients || [];
        const groups = action.user_groups || [];

        if (!users.length && !groups.length) return <EmptyState text="No recipients assigned" />;

        return (
            <div className="d-flex flex-column gap-3">
                {users.length > 0 && (
                    <div>
                        <p className="mb-2" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>
                            Users ({users.length})
                        </p>
                        <div className="d-flex flex-wrap gap-1">
                            {users.map((u: any) => (
                                <span key={u.id} className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1"
                                    style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.78rem', fontWeight: 500 }}>
                                    <Icon icon="Person" size="sm" />
                                    {u.username}
                                    {u.email && <span style={{ opacity: 0.65 }}>· {u.email}</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {groups.length > 0 && (
                    <div>
                        <p className="mb-2" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>
                            Groups ({groups.length})
                        </p>
                        <div className="d-flex flex-wrap gap-1">
                            {groups.map((g: any) => (
                                <span key={g.id} className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1"
                                    style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.78rem', fontWeight: 500 }}>
                                    <Icon icon="Group" size="sm" />
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── devices ───────────────────────────────────────────────────────────────

    const renderDevices = () => {
        const list = action.device_list;
        if (!list || !Array.isArray(list) || !list.length) return <EmptyState text="No devices assigned" />;

        return (
            <div className="d-flex flex-wrap gap-1">
                {list.map((d: any, i: number) => (
                    <span key={i} className="d-inline-flex align-items-center gap-1 rounded px-2 py-1"
                        style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.78rem', fontWeight: 500 }}>
                        <Icon icon="Sensors" size="sm" />
                        {typeof d === 'object' ? d.name : d}
                        {typeof d === 'object' && (
                            <span className="ms-1" style={{ fontSize: '0.7rem', color: d.is_online ? '#16a34a' : '#dc2626' }}>
                                ● {d.is_online ? 'Online' : 'Offline'}
                            </span>
                        )}
                    </span>
                ))}
            </div>
        );
    };

    // ── main ──────────────────────────────────────────────────────────────────

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" isCentered isScrollable>

            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id="action-view-modal">
                    <div className="d-flex align-items-center gap-3">
                        {/* Icon bubble */}
                        <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 40, height: 40, background: accentColor + '1a', color: accentColor }}>
                            <Icon icon={typeIconMap[action.type] || 'Notifications'} />
                        </div>
                        <div>
                            <div className="fw-bold fs-6 lh-1 mb-1">{action.name}</div>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 600 }}>
                                    {typeMap[action.type] || action.type}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>·</span>
                                <Badge color={action.is_active ? 'success' : 'warning'} isLight style={{ fontSize: '0.68rem' }}>
                                    {action.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {action.alert_on_failure && (
                                    <Badge color="danger" isLight style={{ fontSize: '0.68rem' }}>
                                        <Icon icon="Warning" size="sm" className="me-1" />
                                        Alert on Failure
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </ModalTitle>
            </ModalHeader>

            <ModalBody className="p-0">
                {/* Accent top bar */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}33)` }} />

                <div className="p-4 d-flex flex-column gap-4">

                    {/* ── General ── */}
                    <div>
                        <SectionLabel>General</SectionLabel>
                        <SectionBox>
                            <div className="row g-3">
                                <Field label="Created By">
                                    <span className="fw-semibold">{(action as any).created_by_username || '—'}</span>
                                </Field>
                                <Field label="Created At">
                                    <span>{new Date(action.created_at || '').toLocaleString()}</span>
                                </Field>
                                <Field label="Message Format">
                                    <Badge color="secondary" isLight>
                                        {action.message_type === 'json_data' ? 'JSON Data' : 'Plain Text / Custom'}
                                    </Badge>
                                </Field>
                                <Field label="Alert on Failure">
                                    <Badge color={action.alert_on_failure ? 'danger' : 'secondary'} isLight>
                                        {action.alert_on_failure ? 'Yes' : 'No'}
                                    </Badge>
                                </Field>
                            </div>
                        </SectionBox>
                    </div>

                    {/* ── Webhook ── */}
                    {action.type === 'webhook' && (
                        <div>
                            <SectionLabel>Webhook Configuration</SectionLabel>
                            <SectionBox>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge color={methodColorMap[action.http_method || 'POST'] || 'secondary'}>
                                            {action.http_method || 'POST'}
                                        </Badge>
                                        <div className="flex-grow-1">
                                            <UrlBox url={action.webhook_url || 'No URL configured'} />
                                        </div>
                                    </div>
                                    {(action as any).webhook_auth_type && (action as any).webhook_auth_type !== 'none' && (
                                        <div className="d-flex align-items-center gap-2 mt-1">
                                            <Icon icon="Lock" size="sm" className="text-muted" />
                                            <span className="small text-muted">Auth:</span>
                                            <Badge color="secondary" isLight>{(action as any).webhook_auth_type}</Badge>
                                        </div>
                                    )}
                                </div>
                            </SectionBox>
                        </div>
                    )}

                    {/* ── N8N ── */}
                    {action.type === 'n8n_workflow' && (
                        <div>
                            <SectionLabel>n8n Workflow Configuration</SectionLabel>
                            <SectionBox>
                                <div className="d-flex flex-column gap-3">
                                    <div className="row g-3">
                                        <Field label="Workflow ID">
                                            <span className="fw-semibold" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                {(action as any).n8n_workflow_id || <EmptyState text="Not set" />}
                                            </span>
                                        </Field>
                                        <Field label="Timeout">
                                            <span className="fw-semibold">{(action as any).n8n_timeout || 30}s</span>
                                        </Field>
                                    </div>
                                    <div>
                                        <p className="mb-1" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>
                                            Workflow URL
                                        </p>
                                        <UrlBox url={(action as any).n8n_workflow_url || 'No URL configured'} />
                                    </div>
                                </div>
                            </SectionBox>
                        </div>
                    )}

                    {/* ── Device ── */}
                    {action.type === 'device_notification' && (
                        <div>
                            <SectionLabel>Device Configuration</SectionLabel>
                            <SectionBox>
                                <div className="d-flex flex-column gap-3">
                                    <div className="row g-3">
                                        <Field label="Device Type">
                                            <Badge color="primary">{action.device_type || 'HALO'}</Badge>
                                        </Field>
                                        <Field label="Sound File">
                                            <div className="d-flex align-items-center gap-1">
                                                <Icon icon="MusicNote" size="sm" className="text-muted" />
                                                <span>{(action as any).device_sound || <EmptyState text="No Sound" />}</span>
                                            </div>
                                        </Field>
                                        <Field label="Duration">
                                            <span className="fw-semibold">{action.action_duration_minutes || 1} min</span>
                                        </Field>
                                    </div>

                                    {/* LED strip */}
                                    <div className="d-flex align-items-center gap-3 rounded px-3 py-2"
                                        style={{ background: '#fff', border: '1px solid #e9ecef', fontSize: '0.8rem' }}>
                                        <div className="d-flex align-items-center gap-1">
                                            <Icon icon="Lightbulb" size="sm" className="text-warning" />
                                            <span className="text-muted">Color</span>
                                            <span className="fw-semibold ms-1">{(action as any).device_led_color ?? '—'}</span>
                                        </div>
                                        <span className="text-muted">·</span>
                                        <div className="d-flex align-items-center gap-1">
                                            <Icon icon="Tune" size="sm" className="text-info" />
                                            <span className="text-muted">Pattern</span>
                                            <span className="fw-semibold ms-1">{(action as any).device_led_pattern ?? '—'}</span>
                                        </div>
                                        <span className="text-muted">·</span>
                                        <div className="d-flex align-items-center gap-1">
                                            <Icon icon="PriorityHigh" size="sm" className="text-danger" />
                                            <span className="text-muted">Priority</span>
                                            <span className="fw-semibold ms-1">{(action as any).device_led_priority ?? '—'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-2" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>
                                            Target Devices
                                        </p>
                                        {renderDevices()}
                                    </div>
                                </div>
                            </SectionBox>
                        </div>
                    )}

                    {/* ── Recipients ── */}
                    {(action.type === 'email' || action.type === 'sms') && (
                        <div>
                            <SectionLabel>Recipients</SectionLabel>
                            <SectionBox>{renderRecipients()}</SectionBox>
                        </div>
                    )}

                    {/* ── Message / Request Body ── */}
                    {action.type !== 'device_notification' && action.message_template && (
                        <div>
                            <SectionLabel>
                                {action.type === 'email' || action.type === 'sms' ? 'Message' : 'Request Body'}
                            </SectionLabel>

                            {action.type === 'email' || action.type === 'sms' ? (
                                <div className="rounded-2"
                                    style={{ border: '1px solid #dee2e6', background: '#ffffff' }}>
                                    <pre className="mb-0 py-2 small"
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            paddingLeft: '1rem',
                                            paddingRight: '1rem',
                                            minHeight: 60,
                                            background: 'transparent'
                                        }}>
                                        {action.message_template}
                                    </pre>
                                </div>
                            ) : (
                                <div className="position-relative rounded-2"
                                    style={{ border: '1px solid #dee2e6', background: '#ffffff' }}>
                                    <span className="position-absolute"
                                        style={{ top: 8, left: 10, fontFamily: 'monospace', fontSize: '1rem', pointerEvents: 'none', zIndex: 1 }}>
                                        {'{'}
                                    </span>
                                    <pre className="mb-0 py-2 small"
                                        style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingLeft: '2rem', paddingRight: '1rem', minHeight: 60, background: 'transparent' }}>
                                        {action.message_template}
                                    </pre>
                                    <span className="position-absolute"
                                        style={{ bottom: 8, left: 10, fontFamily: 'monospace', fontSize: '1rem', pointerEvents: 'none', zIndex: 1 }}>
                                        {'}'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </ModalBody>
        </Modal>
    );
};

export default ActionViewModal;
