import React from 'react';
import { useSensorConfigurations } from '../../../../api/sensors.api';
import useDarkMode from '../../../../hooks/useDarkMode';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';

interface SensorConfigCardsProps {
    sensorId: string | number;
}

const SensorConfigCards: React.FC<SensorConfigCardsProps> = ({ sensorId }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: configs, isLoading } = useSensorConfigurations(sensorId);

    const getHexColor = (ledColor: number | null | undefined) => {
        if (!ledColor) return '#0dcaf0'; // Default info color
        return `#${ledColor.toString(16).padStart(6, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="position-absolute top-0 start-50 translate-middle-x mt-3">
                <Spinner color="info" isSmall />
            </div>
        );
    }

    if (!configs || configs.length === 0) return null;

    return (
        <div
            className="position-absolute top-0 start-0 end-0 d-flex gap-3 overflow-auto px-4 py-3 scrollbar-hidden"
            style={{
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                zIndex: 1000,
                scrollBehavior: 'smooth'
            }}
        >
            {configs.map((config) => {
                const color = getHexColor(config.led_color);
                return (
                    <div
                        key={config.id}
                        className="flex-shrink-0 rounded-3 d-flex flex-column align-items-center justify-content-center px-3 py-2 transition-all"
                        style={{
                            minWidth: '110px',
                            height: '95px',
                            background: darkModeStatus ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                            border: darkModeStatus ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.02)'
                        }}
                    >
                        <div className="d-flex align-items-center gap-2 mb-1 opacity-75">
                            {config.enabled && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
                            <span className="fw-bold text-truncate" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', maxWidth: '90px' }}>
                                {config.event_id}
                            </span>
                        </div>

                        <div className="d-flex flex-column align-items-center gap-0 w-100 mt-1">
                            <div className="d-flex align-items-baseline gap-1">
                                <span className="text-muted" style={{ fontSize: '0.6rem' }}>THR:</span>
                                <span className="fw-bold text-info" style={{ fontSize: '0.8rem' }}>{config.threshold}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1 mt-n1" style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                                <span>{config.min_value}</span>
                                <Icon icon="HorizontalRule" size="sm" />
                                <span>{config.max_value}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SensorConfigCards;
