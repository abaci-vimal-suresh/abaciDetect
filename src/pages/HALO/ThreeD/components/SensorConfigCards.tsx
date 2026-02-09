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
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                borderBottom: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                zIndex: 110,
                scrollBehavior: 'smooth'
            }}
        >
            {configs.map((config) => {
                const color = getHexColor(config.led_color);
                return (
                    <div
                        key={config.id}
                        className="flex-shrink-0 rounded p-2 d-flex flex-column align-items-center transition-all"
                        style={{
                            background: darkModeStatus ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: `2px solid ${color}80`, // 50% opacity border
                            boxShadow: `0 0 15px ${color}40`, // Integrated glow
                            minWidth: '120px',
                            cursor: 'default'
                        }}
                    >
                        <div className="d-flex align-items-center gap-1 mb-1">
                            <span className="fw-bold x-small text-truncate" style={{ fontSize: '0.75rem', maxWidth: '100px' }}>
                                {config.event_id}
                            </span>
                            {config.enabled && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
                        </div>

                        <div className="d-flex flex-column align-items-center gap-0">
                            <div className="d-flex align-items-baseline gap-1">
                                <span className="x-small text-muted" style={{ fontSize: '0.6rem' }}>THR:</span>
                                <span className="fw-bold text-info" style={{ fontSize: '0.8rem' }}>{config.threshold}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1 opacity-50" style={{ fontSize: '0.6rem' }}>
                                <span>{config.min_value}</span>
                                <Icon icon="HorizontalRule" />
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
