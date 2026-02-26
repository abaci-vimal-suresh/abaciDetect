import React, { memo } from 'react';
import BaseNode from './BaseNode';
import Icon from '../../../../../components/icon/Icon';
import Badge from '../../../../../components/bootstrap/Badge';

const ActionNode = ({ data, selected, id }: any) => {
    const typeMap: any = {
        'email': { icon: 'Email', color: 'primary', label: 'Email' },
        'sms': { icon: 'Sms', color: 'success', label: 'SMS' },
        'webhook': { icon: 'Code', color: 'warning', label: 'Webhook' },
        'n8n_workflow': { icon: 'SettingsEthernet', color: 'info', label: 'n8n' },
        'device_notification': { icon: 'Dvr', color: 'danger', label: 'Device' },
        'push_notification': { icon: 'PhonelinkRing', color: 'secondary', label: 'Push' },
    };

    const config = typeMap[data.type] || { icon: 'Notifications', color: 'primary', label: data.type || 'Action' };

    return (
        <BaseNode
            id={id}
            title={data.name || 'Action Node'}
            icon={config.icon}
            color={config.color}
            selected={selected}
            outputs={false}
            status={data.status}
        >
            <div className='d-flex flex-column gap-1'>
                <div className='d-flex justify-content-between align-items-center'>
                    <Badge color={config.color} isLight className='text-uppercase'>{config.label}</Badge>
                    {data.is_active === false && <Badge color='warning' isLight>Inactive</Badge>}
                </div>
                <div className='small text-muted mt-1 text-truncate'>
                    {data.type === 'email' ? `To: ${data.recipients?.length || 0} recipients` :
                        data.type === 'webhook' ? data.webhook_url :
                            data.description || 'No description'}
                </div>
            </div>
        </BaseNode>
    );
};

export default memo(ActionNode);
