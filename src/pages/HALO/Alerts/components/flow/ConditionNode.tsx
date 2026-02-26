import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../../components/bootstrap/Card';
import Icon from '../../../../../components/icon/Icon';
import Badge from '../../../../../components/bootstrap/Badge';

const ConditionNode = ({ data, selected }: any) => {
    return (
        <div className={`flow-node-wrapper ${selected ? 'node-selected' : ''}`}>
            <Handle
                type='target'
                position={Position.Left}
                className='node-handle left'
                style={{ background: 'var(--bs-warning)' }}
            />

            <Card
                stretch
                className={`mb-0 node-card shadow-sm ${selected ? 'border-primary' : ''}`}
                style={{ width: 220, borderLeft: '4px solid var(--bs-warning)' }}
            >
                <CardHeader className='py-2 px-3 border-0 bg-l10-warning'>
                    <CardTitle className='d-flex align-items-center mb-0' style={{ fontSize: '0.9rem' }}>
                        <Icon icon='AltRoute' className='text-warning me-2' size='lg' />
                        <span className='fw-bold'>Threshold Split</span>
                    </CardTitle>
                </CardHeader>
                <CardBody className='py-3 px-3 d-flex flex-column gap-3'>
                    <div className='d-flex justify-content-between align-items-center' style={{ position: 'relative' }}>
                        <span className='small fw-bold text-danger'>Over Max</span>
                        <Handle
                            type='source'
                            position={Position.Right}
                            id='max'
                            className='node-handle right'
                            style={{ background: 'var(--bs-danger)', top: '50%' }}
                        />
                    </div>
                    <div className='d-flex justify-content-between align-items-center' style={{ position: 'relative' }}>
                        <span className='small fw-bold text-primary'>Under Min</span>
                        <Handle
                            type='source'
                            position={Position.Right}
                            id='min'
                            className='node-handle right'
                            style={{ background: 'var(--bs-primary)', top: '50%' }}
                        />
                    </div>
                    <div className='d-flex justify-content-between align-items-center' style={{ position: 'relative' }}>
                        <span className='small fw-bold text-warning'>Threshold</span>
                        <Handle
                            type='source'
                            position={Position.Right}
                            id='threshold'
                            className='node-handle right'
                            style={{ background: 'var(--bs-warning)', top: '50%' }}
                        />
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default memo(ConditionNode);
