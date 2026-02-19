import React, { useRef } from 'react';
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
    const scrollRef = useRef<HTMLDivElement>(null);

    const getHexColor = (ledColor: number | null | undefined) => {
        if (!ledColor) return '#0dcaf0';
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

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    return (
        <>
            <style>{`
                .dock-scroll::-webkit-scrollbar { display: none; }
                .dock-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                .dock-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .dock-card:hover {
                    transform: translateY(-6px) scale(1.06);
                    box-shadow: 0 12px 28px rgba(0,0,0,0.25);
                }
                .dock-arrow {
                    cursor: pointer;
                    transition: opacity 0.2s, background 0.2s;
                    opacity: 0.55;
                }
                .dock-arrow:hover { opacity: 1; }
            `}</style>

            {/* Outer wrapper: full width, centered dock positioned at top */}
            <div
                className="position-absolute top-0 start-0 end-0 d-flex justify-content-center"
                style={{ zIndex: 1000, pointerEvents: 'none' }}
            >
                {/* Dock container: 60% width, pill-shaped */}
                <div
                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                    style={{
                        width: '60%',
                        marginTop: '12px',
                        background: darkModeStatus
                            ? 'rgba(10, 18, 35, 0.88)'
                            : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: darkModeStatus
                            ? '1px solid rgba(255,255,255,0.08)'
                            : '1px solid rgba(0,0,0,0.08)',
                        boxShadow: darkModeStatus
                            ? '0 8px 32px rgba(0,0,0,0.5)'
                            : '0 8px 32px rgba(0,0,0,0.12)',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Left arrow */}
                    <button
                        className="dock-arrow btn btn-sm d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 p-0"
                        onClick={() => scroll('left')}
                        style={{
                            width: 28,
                            height: 28,
                            background: darkModeStatus ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            border: 'none',
                            color: darkModeStatus ? '#fff' : '#333',
                        }}
                    >
                        <Icon icon="ChevronLeft" size="sm" />
                    </button>

                    {/* Scrollable cards area */}
                    <div
                        ref={scrollRef}
                        className="dock-scroll d-flex gap-2 overflow-auto flex-grow-1"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {configs.map((config) => {
                            const color = getHexColor(config.led_color);
                            return (
                                <div
                                    key={config.id}
                                    className="dock-card flex-shrink-0 rounded-3 d-flex flex-column align-items-center justify-content-center px-3 py-2"
                                    style={{
                                        minWidth: '110px',
                                        height: '88px',
                                        background: darkModeStatus
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'rgba(0,0,0,0.04)',
                                        border: darkModeStatus
                                            ? '1px solid rgba(255,255,255,0.07)'
                                            : '1px solid rgba(0,0,0,0.06)',
                                        cursor: 'default',
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2 mb-1 opacity-75">
                                        {config.enabled && (
                                            <div
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    background: color,
                                                    boxShadow: `0 0 6px ${color}`,
                                                }}
                                            />
                                        )}
                                        <span
                                            className="fw-bold text-truncate"
                                            style={{
                                                fontSize: '0.65rem',
                                                letterSpacing: '0.05em',
                                                maxWidth: '90px',
                                                color: darkModeStatus ? '#e2e8f0' : '#1e293b',
                                            }}
                                        >
                                            {config.event_id}
                                        </span>
                                    </div>

                                    <div className="d-flex flex-column align-items-center gap-0 w-100 mt-1">
                                        <div className="d-flex align-items-baseline gap-1">
                                            <span className="text-muted" style={{ fontSize: '0.6rem' }}>THR:</span>
                                            <span className="fw-bold text-info" style={{ fontSize: '0.8rem' }}>
                                                {config.threshold}
                                            </span>
                                        </div>
                                        <div
                                            className="d-flex align-items-center gap-1 mt-n1"
                                            style={{ fontSize: '0.6rem', opacity: 0.5 }}
                                        >
                                            <span>{config.min_value}</span>
                                            <Icon icon="HorizontalRule" size="sm" />
                                            <span>{config.max_value}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right arrow */}
                    <button
                        className="dock-arrow btn btn-sm d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 p-0"
                        onClick={() => scroll('right')}
                        style={{
                            width: 28,
                            height: 28,
                            background: darkModeStatus ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            border: 'none',
                            color: darkModeStatus ? '#fff' : '#333',
                        }}
                    >
                        <Icon icon="ChevronRight" size="sm" />
                    </button>
                </div>
            </div>
        </>
    );
};

export default SensorConfigCards;