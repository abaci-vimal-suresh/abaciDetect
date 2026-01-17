import React from 'react';
import Card, { CardBody } from '../../../../components/bootstrap/Card';

interface SectionProps {
    deviceId: string;
}

const EventMonitoringSection: React.FC<SectionProps> = ({ deviceId }) => {
    return (
        <Card>
            <CardBody>
                <h4>Event Monitoring</h4>
                <p>Event monitoring settings for device {deviceId} will appear here.</p>
            </CardBody>
        </Card>
    );
};

export default EventMonitoringSection;
