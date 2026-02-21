import React from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import { Area, User } from '../../../../types/sensor';

interface AreaCardProps {
    area: Area;
    users?: User[];
    onClick: (areaId: number) => void;
    onEdit: (e: React.MouseEvent, area: Area) => void;
    onDelete: (e: React.MouseEvent, area: Area) => void;
}

const AreaCard: React.FC<AreaCardProps> = ({ area, users, onClick, onEdit, onDelete }) => {
    return (
        <Card
            stretch
            className='cursor-pointer transition-shadow'
            style={{ cursor: 'pointer' }}
            onClick={() => onClick(area.id)}
        >
            <CardHeader>
                <CardTitle>{area.name}</CardTitle>
                <CardActions>
                    <Button
                        color='info'
                        isLight
                        icon='Edit'
                        size='sm'
                        onClick={(e: any) => onEdit(e, area)}
                        className='me-1'
                        title='Edit Area'
                    />
                    <Button
                        color='danger'
                        isLight
                        icon='Delete'
                        size='sm'
                        onClick={(e: any) => onDelete(e, area)}
                        className='me-1'
                        title='Delete Area'
                    />
                    <Badge color='success' isLight>
                        Active
                    </Badge>
                </CardActions>
            </CardHeader>
            <CardBody>
                <div className='d-flex justify-content-between align-items-center mb-3'>
                    <div className='text-muted'>
                        <Icon icon='Sensors' size='sm' className='me-1' />
                        Total Sensors
                    </div>
                    <div className='fw-bold fs-4'>{area.sensor_count || 0}</div>
                </div>

                <div className='border-top border-light pt-3 mt-3'>
                    <div className='text-muted small mb-2'>
                        <Icon icon='AssignmentInd' size='sm' className='me-1' />
                        Persons in Charge
                    </div>
                    <div className='d-flex flex-wrap gap-1'>
                        {((area.person_in_charge && area.person_in_charge.length > 0) || (area.person_in_charge_ids && area.person_in_charge_ids.length > 0)) ? (
                            <>
                                {area.person_in_charge && area.person_in_charge.length > 0 ? (
                                    area.person_in_charge.map(person => (
                                        <Badge key={person.id} color='primary' isLight className='rounded-pill'>
                                            {person.first_name} {person.last_name}
                                        </Badge>
                                    ))
                                ) : (
                                    area.person_in_charge_ids?.map(userId => {
                                        const user = users?.find(u => u.id === userId);
                                        return user ? (
                                            <Badge key={userId} color='primary' isLight className='rounded-pill'>
                                                {user.first_name} {user.last_name}
                                            </Badge>
                                        ) : null;
                                    })
                                )}
                            </>
                        ) : (
                            <span className='text-muted small italic'>Unassigned</span>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default AreaCard;