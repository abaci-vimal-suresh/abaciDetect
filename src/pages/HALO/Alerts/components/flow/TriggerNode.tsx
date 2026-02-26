import React, { memo } from 'react';
import BaseNode from './BaseNode';
import Badge from '../../../../../components/bootstrap/Badge';

const TriggerNode = ({ data, selected, id }: any) => {
    return (
        <BaseNode
            id={id}
            title='Alert Trigger'
            icon='NotificationsActive'
            color='secondary'
            selected={selected}
            inputs={false}
            status={data.status}
        />
    );
};

export default memo(TriggerNode);
