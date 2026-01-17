import React from 'react';
import Icon from '../../../../../components/icon/Icon';

interface CentralLoadGaugeProps {
    load: number;
    speed: number;
    maxLoad?: number;
    maxSpeed?: number;
    status?: 'ready' | 'running' | 'warning' | 'error';
    statusText?: string;
    darkMode?: boolean;
}

const CentralLoadGauge: React.FC<CentralLoadGaugeProps> = ({
    load,
    speed,
    maxLoad = 200,
    maxSpeed = 1000,
    status = 'running',
    statusText,
    darkMode = false
}) => {
    const loadPercentage = Math.min((load / maxLoad) * 100, 100);
    const circumference = 2 * Math.PI * 120; // radius = 120
    const strokeDashoffset = circumference - (loadPercentage / 100) * circumference;

    const statusColors = {
        ready: darkMode ? '#46bcaa' : '#46bcaa',
        running: darkMode ? '#4d69fa' : '#4d69fa',
        warning: darkMode ? '#ffcf52' : '#ffcf52',
        error: darkMode ? '#f35421' : '#f35421'
    };

    const statusIcons = {
        ready: 'CheckCircle',
        running: 'PlayCircle',
        warning: 'Warning',
        error: 'Error'
    };

    return (
        <div className="d-flex align-items-center justify-content-center" style={{
            width: '100%',
            height: '100%',
            minHeight: '400px',
            position: 'relative'
        }}>
            {/* SVG Circle Progress */}
            <svg width="280" height="280" style={{ position: 'absolute' }}>
                {/* Background Circle */}
                <circle
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke={darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
                    strokeWidth="12"
                />
                {/* Progress Circle */}
                <circle
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke={statusColors[status]}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 140 140)"
                    style={{
                        transition: 'stroke-dashoffset 0.5s ease',
                        filter: `drop-shadow(0 0 8px ${statusColors[status]}40)`
                    }}
                />
            </svg>

            {/* Center Content */}
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ zIndex: 1 }}>
                {/* Engine Icon */}
                <div style={{
                    fontSize: '48px',
                    color: statusColors[status],
                    marginBottom: '16px',
                    filter: `drop-shadow(0 0 12px ${statusColors[status]}60)`
                }}>
                    <Icon icon='Engineering' size='3x' />
                </div>

                {/* Load Value */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        marginBottom: '4px',
                        textAlign: 'center'
                    }}>
                        Load:
                    </div>
                    <div style={{
                        fontSize: '40px',
                        fontWeight: 700,
                        color: darkMode ? '#fff' : '#323232',
                        lineHeight: 1,
                        textAlign: 'center'
                    }}>
                        {load}
                        <span style={{
                            fontSize: '16px',
                            fontWeight: 500,
                            marginLeft: '6px',
                            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                        }}>
                            kW
                        </span>
                    </div>
                </div>

                {/* Speed Value */}
                <div style={{ marginTop: '300px' }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        marginBottom: '4px',
                        textAlign: 'center'
                    }}>
                        Speed:
                    </div>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: darkMode ? '#fff' : '#323232',
                        lineHeight: 1,
                        textAlign: 'center'
                    }}>
                        {speed}
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            marginLeft: '6px',
                            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                        }}>
                            RPM
                        </span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                }}>
                    <Icon icon={statusIcons[status]} size='sm' style={{ color: statusColors[status] }} />
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        textTransform: 'capitalize'
                    }}>
                        {statusText || status}
                    </span>
                </div>
            </div>

            {/* Preheat Indicator (bottom right) */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '16px',
                background: darkMode ? 'rgba(255, 207, 82, 0.15)' : 'rgba(255, 207, 82, 0.12)',
                border: darkMode ? 'none' : '1px solid rgba(255, 207, 82, 0.3)',
            }}>
                <Icon icon='LocalFireDepartment' size='sm' style={{ color: '#ffcf52' }} />
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: darkMode ? '#ffcf52' : '#d4a521'
                }}>
                    Preheat pump
                </span>
            </div>
        </div>
    );
};

export default CentralLoadGauge;