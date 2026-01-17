import React from 'react';
import Card, { CardBody } from '../../../../components/bootstrap/Card';

interface SectionProps {
    deviceId: string;
}

const SafetySecuritySection: React.FC<SectionProps> = ({ deviceId }) => {
    return (
        <Card>
            <CardBody>
                <h4>Safety & Security</h4>
                <p>Safety settings for device {deviceId} will appear here.</p>
            </CardBody>
        </Card>
    );
};

export default SafetySecuritySection;
