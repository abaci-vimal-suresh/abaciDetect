import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import Icon from '../../../../../components/icon/Icon';

const ActionNode = ({ data, selected, id }: any) => {
    const ACTION_TYPE_CONFIG: Record<string, { color: string, icon: string, label: string }> = {
        email: { color: '#0d6efd', icon: 'Email', label: 'EMAIL' },
        sms: { color: '#198754', icon: 'Sms', label: 'SMS' },
        push_notification: { color: '#6f42c1', icon: 'Notifications', label: 'PUSH' },
        device_notification: { color: '#fd7e14', icon: 'Lightbulb', label: 'DEVICE' },
        webhook: { color: '#6610f2', icon: 'Webhook', label: 'WEBHOOK' },
        n8n_workflow: { color: '#20c997', icon: 'AccountTree', label: 'N8N' },
    };

    const config = ACTION_TYPE_CONFIG[data.type] || { color: '#6c757d', icon: 'Bolt', label: data.type?.toUpperCase() || 'ACTION' };

    return (
        <div className="action-node-card" style={{
            borderLeft: `4px solid ${config.color}`,
            opacity: data.is_active === false ? 0.5 : 1,
            position: 'relative'
        }}>
            <div className="action-node-header">
                <div className="action-node-icon" style={{ backgroundColor: `${config.color}15` }}>
                    <Icon icon={config.icon} style={{ color: config.color }} />
                </div>
                <span className="action-node-name text-truncate" title={data.name}>
                    {data.name || 'Action Node'}
                </span>
            </div>

            <div className="action-node-type-badge" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                {config.label}
            </div>

            <div className="action-node-body">
                {data.type === 'email' ? `To: ${data.recipients?.length || 0} recipients` :
                    data.type === 'webhook' ? data.webhook_url :
                        data.description || 'No description'}
            </div>

            <Handle type="target" position={Position.Left} />
        </div>
    );
};

export default memo(ActionNode);
