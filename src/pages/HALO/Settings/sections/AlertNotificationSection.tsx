import React from 'react';
import Card, { CardBody } from '../../../../components/bootstrap/Card';

interface SectionProps {
    deviceId: string;
}

const AlertNotificationSection: React.FC<SectionProps> = ({ deviceId }) => {
    return (
        <Card>
            <CardBody>
                <h4>Alerts & Notifications</h4>
                <p>Alert settings for device {deviceId} will appear here.</p>
            </CardBody>
        </Card>
    );
};

export default AlertNotificationSection;
