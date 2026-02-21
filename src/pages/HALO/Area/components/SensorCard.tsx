import React from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Badge from '../../../../components/bootstrap/Badge';

interface SensorCardProps {
    sensor: any;
    onUnassign: (e: React.MouseEvent, sensor: any) => void;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor, onUnassign }) => {
    return (
        <Card stretch>
            <CardHeader>
                <CardTitle>{sensor.name}</CardTitle>
                <CardActions>
                    <Button
                        color='danger'
                        isLight
                        icon='LinkOff'
                        size='sm'
                        onClick={(e: any) => onUnassign(e, sensor)}
                        className='me-2'
                    />
                    <Badge color={sensor.is_active ? 'success' : 'danger'} isLight>
                        {sensor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </CardActions>
            </CardHeader>
            <CardBody>
                <div className='mb-2'>
                    <div className='small text-muted'>Type</div>
                    <div className='fw-bold'>{sensor.sensor_type || 'N/A'}</div>
                </div>
                <div className='mb-2'>
                    <div className='small text-muted'>MAC Address</div>
                    <div className='font-monospace small'>{sensor.mac_address || 'N/A'}</div>
                </div>
                {sensor.ip_address && (
                    <div className='mb-2'>
                        <div className='small text-muted'>IP Address</div>
                        <div className='font-monospace small'>{sensor.ip_address}</div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default SensorCard;