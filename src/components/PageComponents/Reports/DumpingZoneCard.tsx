import React from 'react';
import classNames from 'classnames';
import Card, { CardBody } from '../../bootstrap/Card';
import useDarkMode from '../../../hooks/useDarkMode';
import Icon from '../../icon/Icon';
import Badge from '../../bootstrap/Badge';

const DumpingZoneCard = ({ zone_data }) => {
    const { darkModeStatus } = useDarkMode();

    // Generate a color based on zone number for consistent styling
    const getZoneColor = (zoneNo) => {
        const colors = ['primary', 'success', 'warning', 'danger', 'info', 'secondary', 'dark'];
        const index = zoneNo % colors.length;
        return colors[index];
    };

    const zoneColor = getZoneColor(zone_data?.zone_no);

    return (
        <div className='col d-flex justify-content-center'>
            <Card borderSize={1} style={{ width: 250 }}>
                <CardBody>
                    <div className='d-flex flex-column align-items-center position-relative'>
                        {/* Icon */}
                        <div className='ratio ratio-1x1 mb-3' style={{ width: 80 }}>
                            <div
                                className={classNames(
                                    'rounded-2',
                                    'd-flex align-items-center justify-content-center',
                                    `bg-${zoneColor}-subtle`,
                                )}>
                                <Icon 
                                    icon='Map' 
                                    size='lg' 
                                    // className='text-primary'
                                    className={`text-${zoneColor}`}
                                />
                            </div>
                        </div>

                        {/* Zone No */}
                        <div className='fw-bold fs-6 text-center mb-1'>
                            Zone {zone_data?.zone_no}
                        </div>

                        {/* Zone Name */}
                        <div className='text-muted text-center mb-2' style={{ fontSize: '1rem' }}>
                            {zone_data?.zone_name}
                        </div>

                        {/* Total Gallons */}
                        <Badge 
                            isLight 
                            className='px-3 py-2 mt-2 mb-2'
                        >
                            <Icon icon='WaterDrop' size='lg' className='me-1' />
                            {zone_data?.total_gallons?.toLocaleString()} gallons
                        </Badge>

                        {/* Additional info */}
                        <small className='text-muted text-center'>
                            Total collected
                        </small>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default DumpingZoneCard; 