import React, { memo, ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../../components/bootstrap/Card';
import Icon from '../../../../../components/icon/Icon';
import Badge from '../../../../../components/bootstrap/Badge';

interface BaseNodeProps {
    id: string;
    title: string;
    icon: string;
    color: string;
    children?: ReactNode;
    selected?: boolean;
    inputs?: boolean;
    outputs?: boolean;
    status?: 'idle' | 'running' | 'success' | 'error';
}

const BaseNode = ({
    title,
    icon,
    color,
    children,
    selected,
    inputs = true,
    outputs = true,
    status = 'idle'
}: BaseNodeProps) => {
    const getStatusColor = () => {
        switch (status) {
            case 'running': return 'info';
            case 'success': return 'success';
            case 'error': return 'danger';
            default: return color;
        }
    };

    return (
        <div className={`flow-node-wrapper ${selected ? 'node-selected' : ''}`}>
            {inputs && (
                <Handle
                    type='target'
                    position={Position.Left}
                    className='node-handle left'
                    style={{ background: `var(--bs-${color})` }}
                />
            )}

            <Card
                stretch
                className={`mb-0 node-card shadow-sm ${selected ? 'border-primary' : ''}`}
                style={{
                    width: 260,
                    borderLeft: `4px solid var(--bs-${getStatusColor()})`,
                    transition: 'all 0.2s ease-in-out'
                }}
            >
                <CardHeader className='py-2 px-3 border-0'>
                    <CardTitle className='d-flex align-items-center mb-0' style={{ fontSize: '0.9rem' }}>
                        <div className={`bg-l10-${color} rounded-circle p-2 me-2 d-flex align-items-center justify-content-center`}>
                            <Icon icon={icon} className={`text-${color}`} size='lg' />
                        </div>
                        <span className='fw-bold text-truncate'>{title}</span>
                        {status === 'running' && (
                            <div className='spinner-border spinner-border-sm text-info ms-auto' role='status' />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardBody className='py-2 px-3' style={{ fontSize: '0.8rem' }}>
                    {children}
                </CardBody>
            </Card>

            {outputs && (
                <Handle
                    type='source'
                    position={Position.Right}
                    className='node-handle right'
                    style={{ background: `var(--bs-${color})` }}
                />
            )}

            <style>{`
				.flow-node-wrapper {
					position: relative;
				}
				.node-handle {
					width: 12px !important;
					height: 12px !important;
					border: 2px solid white !important;
					z-index: 10;
				}
				.node-handle.left {
					left: -6px !important;
				}
				.node-handle.right {
					right: -6px !important;
				}
				.node-selected {
					filter: drop-shadow(0 0 8px rgba(var(--bs-primary-rgb), 0.4));
				}
				.node-card {
					background: var(--bs-body-bg);
				}
			`}</style>
        </div>
    );
};

export default memo(BaseNode);
