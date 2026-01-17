import React, { useEffect } from 'react';
import useToasterNotification from '../../hooks/shared/useToasterNotification';
import { generateMockAlerts } from '../../mocks/alertData';

const AlertSimulator = () => {
    const { showNotification } = useToasterNotification();

    useEffect(() => {
        // Initial delay
        const initialTimer = setTimeout(() => {
            triggerRandomAlert();
        }, 5000);

        // Frequent interval suitable for a demo
        const interval = setInterval(() => {
            triggerRandomAlert();
        }, 30000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, []);

    const triggerRandomAlert = () => {
        // Generate a single fresh alert
        const [alert] = generateMockAlerts(1);

        let icon = '🔔';
        if (alert.type === 'Vape') icon = '💨';
        if (alert.type === 'Noise') icon = '🔊';
        if (alert.type === 'Tamper') icon = '🔧';
        if (alert.type === 'Gunshot') icon = '🔫';

        const title = (
            <div className='d-flex align-items-center'>
                <span className='me-2 fs-5'>{icon}</span>
                <span>{alert.type} Alert</span>
            </div>
        );

        const message = (
            <div>
                <div className='fw-bold'>{alert.location}</div>
                <div className='small'>{alert.message}</div>
                <div className='small text-muted mt-1'>{new Date().toLocaleTimeString()}</div>
            </div>
        );

        let type: 'default' | 'success' | 'danger' | 'info' | 'warning' = 'info';
        if (alert.severity === 'Critical') type = 'danger';
        if (alert.severity === 'High') type = 'warning';
        if (alert.severity === 'Low') type = 'success';

        showNotification(title, message, type);
    };

    return null; // This component doesn't render anything visible directly
};

export default AlertSimulator;

