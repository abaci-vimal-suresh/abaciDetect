import React, { memo } from 'react';
import BaseNode from './BaseNode';
import Badge from '../../../../components/bootstrap/Badge';

const TimeGateNode = ({ data, selected, id }: any) => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const activeDays = data.weekdays || [];

    return (
        <BaseNode
            id={id}
            title='Time Gate'
            icon='Schedule'
            color='info'
            selected={selected}
            status={data.status}
        >
            <div className='d-flex flex-column gap-2'>
                <div className='d-flex gap-1 justify-content-center'>
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            className={`rounded-circle text-center d-flex align-items-center justify-content-center ${activeDays.includes(idx) ? 'bg-info text-white' : 'bg-light text-muted'}`}
                            style={{ width: 22, height: 22, fontSize: '0.65rem', fontWeight: 'bold' }}
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <div className='d-flex justify-content-center align-items-center gap-2 mt-1'>
                    <Badge color='light' isLight className='text-muted small'>
                        {data.start_time || '00:00'}
                    </Badge>
                    <span className='text-muted'>→</span>
                    <Badge color='light' isLight className='text-muted small'>
                        {data.end_time || '23:59'}
                    </Badge>
                </div>
            </div>
        </BaseNode>
    );
};

export default memo(TimeGateNode);
