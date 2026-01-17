import React from 'react';
import Card, { CardBody } from '../../../../components/bootstrap/Card';

interface SectionProps {
    deviceId: string;
}

const DeviceConfigSection: React.FC<SectionProps> = ({ deviceId }) => {
    return (
        <Card>
            <CardBody>
                <h4>Device Configuration</h4>
                <p>Settings for device {deviceId} will appear here.</p>
            </CardBody>
        </Card>
    );
};

export default DeviceConfigSection;
