import React, { memo } from 'react';
import BaseNode from './BaseNode';
import Badge from '../../../../../components/bootstrap/Badge';
import { ALERT_TYPE_CHOICES } from '../../../../../types/sensor';

const FilterNode = ({ data, selected, id }: any) => {
    const alertTypes = data.alert_types || [];

    return (
        <BaseNode
            id={id}
            title={data.name || 'Filter Rule'}
            icon='FilterAlt'
            color='primary'
            selected={selected}
            status={data.status}
        >
            <div className='d-flex flex-column gap-2'>
                <div className='d-flex flex-wrap gap-1'>
                    {alertTypes.slice(0, 3).map((t: string) => (
                        <Badge key={t} color='info' isLight style={{ fontSize: '0.65rem' }}>
                            {ALERT_TYPE_CHOICES.find(c => c.value === t)?.label || t}
                        </Badge>
                    ))}
                    {alertTypes.length > 3 && <span className='small text-muted'>+{alertTypes.length - 3} more</span>}
                </div>
                <div className='d-flex justify-content-between align-items-center border-top pt-1 mt-1'>
                    <span className='small text-muted'>Areas:</span>
                    <span className='small fw-bold'>{data.area_list?.length || 0} selected</span>
                </div>
            </div>
        </BaseNode>
    );
};

export default memo(FilterNode);
