import React from 'react';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import { Action } from '../../../../hooks/useFlowHealth';

export const ACTION_TYPE_ICONS: Record<string, string> = {
    email: 'Email',
    sms: 'Sms',
    device_notification: 'Lightbulb',
    webhook: 'Webhook',
    n8n_workflow: 'AccountTree'
};

export const ACTION_TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'light' | 'dark'> = {
    email: 'primary',
    sms: 'success',
    device_notification: 'warning',
    webhook: 'info',
    n8n_workflow: 'secondary'
};

interface ActionColumnProps {
    actions: Action[];
    activeActionIds: number[];
    onActionClick: (action: Action) => void;
}

const ActionColumn: React.FC<ActionColumnProps> = ({
    actions,
    activeActionIds,
    onActionClick
}) => {
    // Deduplicate actions by ID
    const uniqueActions = Array.from(new Map(actions.map(a => [a.id, a])).values());

    return (
        <div className="d-flex flex-column gap-3 py-2">
            {uniqueActions.map((action) => {
                const isActive = activeActionIds.includes(action.id);
                const isMuted = activeActionIds.length > 0 && !isActive;

                return (
                    <div
                        key={action.id}
                        className={`card pipeline-action-card transition-all mb-0 ${isActive ? 'active' : ''} ${isMuted ? 'opacity-50' : ''} ${!action.is_active ? 'opacity-50' : ''}`}
                        onClick={() => onActionClick(action)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <h6 className="card-title mb-0 d-flex align-items-center text-truncate">
                                    <Icon
                                        icon={ACTION_TYPE_ICONS[action.type] || 'Bolt'}
                                        className={`text-${ACTION_TYPE_COLORS[action.type] || 'primary'} me-2`}
                                        size="sm"
                                    />
                                    {action.name}
                                </h6>
                                <div
                                    className={`rounded-circle ${action.is_active ? 'bg-success' : 'bg-secondary'}`}
                                    style={{ width: '6px', height: '6px' }}
                                />
                            </div>

                            <div className="border-top border-light my-2 opacity-50"></div>

                            <div className="d-flex align-items-center justify-content-between">
                                <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>
                                    {action.type.replace('_', ' ')}
                                </div>
                                <div className="d-flex gap-2">
                                    {action.recipients && action.recipients.length > 0 && (
                                        <span className="small text-muted" title={`${action.recipients.length} recipients`}>
                                            <Icon icon="Person" size="sm" className="me-1" />
                                            {action.recipients.length}
                                        </span>
                                    )}
                                    {action.user_groups && action.user_groups.length > 0 && (
                                        <span className="small text-muted" title={`${action.user_groups.length} groups`}>
                                            <Icon icon="Groups" size="sm" className="me-1" />
                                            {action.user_groups.length}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-top border-light d-flex align-items-center justify-content-between">
                                <span className="small text-muted" style={{ fontSize: '10px' }}>
                                    {action.retry_count ? (
                                        <>
                                            <Icon icon="Refresh" size="sm" className="me-1" />
                                            {action.retry_count}x / {action.retry_interval}s
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="Check" size="sm" className="me-1 text-success" />
                                            Instant
                                        </>
                                    )}
                                </span>
                                {action.alert_on_failure && (
                                    <Icon icon="NotificationImportant" size="sm" className="text-warning" />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActionColumn;
