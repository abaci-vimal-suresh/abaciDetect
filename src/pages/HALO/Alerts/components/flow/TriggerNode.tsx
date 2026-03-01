import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import Icon from '../../../../../components/icon/Icon';

const TriggerNode = ({ data, selected }: any) => {
    const label = data.label || 'Trigger';
    const icon = data.icon || 'NotificationsActive';

    return (
        <div className={`trigger-node-pill ${selected ? 'selected' : ''}`}>
            <div className="trigger-node-icon">
                <Icon icon={icon} size="sm" />
            </div>
            <span className="trigger-node-label">{label}</span>

            <Handle type="source" position={Position.Right} className="trigger-node-handle" />
        </div>
    );
};

export default memo(TriggerNode);
