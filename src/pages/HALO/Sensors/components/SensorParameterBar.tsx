import React, { useRef, useState, useEffect } from 'react';
import Icon from '../../../../components/icon/Icon';

export const PARAMETER_STYLE_MAP: Record<string, { icon: string; color: string; label: string }> = {
    temp_c: { label: 'Temperature', icon: 'DeviceThermostat', color: '#EF4444' },
    humidity: { label: 'Humidity', icon: 'WaterDrop', color: '#3B82F6' },
    co2: { label: 'CO2', icon: 'Co2', color: '#10B981' },
    tvoc: { label: 'TVOC', icon: 'Science', color: '#F59E0B' },
    aqi: { label: 'AQI', icon: 'Air', color: '#8B5CF6' },
    pm25: { label: 'PM2.5', icon: 'Grain', color: '#EC4899' },
    noise: { label: 'Noise', icon: 'VolumeUp', color: '#6366F1' },
    light: { label: 'Light', icon: 'LightMode', color: '#EAB308' },
    motion: { label: 'Motion', icon: 'Visibility', color: '#F97316' },
    smoke: { label: 'Smoke', icon: 'SmokingRooms', color: '#94A3B8' },
    gas: { label: 'Gas', icon: 'GasMeter', color: '#FACC15' },
    health_index: { label: 'Health Index', icon: 'Favorite', color: '#10B981' },
    gunshot: { label: 'Gunshot', icon: 'CrisisAlert', color: '#EF4444' },
    aggression: { label: 'Aggression', icon: 'Warning', color: '#F59E0B' },
    gunshot_aggression: { label: 'Gunshot/Aggression', icon: 'Security', color: '#EF4444' }
};

interface SensorParameterBarProps {
    availableParameters: string[];
    selectedParameters: string[];
    onToggleParameter: (param: string) => void;
}

const SensorParameterBar: React.FC<SensorParameterBarProps> = ({
    availableParameters,
    selectedParameters,
    onToggleParameter,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Check scroll capability
    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [availableParameters]); // Re-check when items change

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            // Timeout to re-check after scroll animation
            setTimeout(checkScroll, 300);
        }
    };

    const ArrowButton = ({ direction, onClick, show }: { direction: 'left' | 'right', onClick: () => void, show: boolean }) => {
        return (
            <button
                onClick={onClick}
                style={{
                    position: 'absolute',
                    [direction]: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: show ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: show ? 'pointer' : 'default',
                    opacity: show ? 1 : 0,
                    pointerEvents: show ? 'auto' : 'none',
                    boxShadow: show ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                    transition: 'all 0.3s ease',
                }}
                className="hover-glow"
            >
                <Icon icon={direction === 'left' ? 'chevron_left' : 'chevron_right'} size="sm" />
            </button>
        );
    };

    return (
        <div className="sensor-parameter-bar-wrapper" style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1002,
            width: '98%', // Nearly full width
            maxWidth: '100%',
            pointerEvents: 'none', // Allow clicks pass through transparent areas if any
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Main Container */}
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '4px 32px', // Space for arrows
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                pointerEvents: 'auto',
                height: '42px' // Compact fixed height
            }}>

                <ArrowButton direction="left" onClick={() => scroll('left')} show={showLeftArrow} />

                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        scrollBehavior: 'smooth',
                        width: '100%',
                        whiteSpace: 'nowrap',
                        padding: '0 4px'
                    }}
                    className="hide-scrollbar"
                >
                    {availableParameters.map((paramKey) => {
                        const style = PARAMETER_STYLE_MAP[paramKey] || {
                            label: paramKey.toUpperCase().replace('_', ' '),
                            icon: 'SettingsInputAntenna',
                            color: '#94A3B8'
                        };
                        const isSelected = selectedParameters.includes(paramKey);

                        return (
                            <div
                                key={paramKey}
                                onClick={() => onToggleParameter(paramKey)}
                                className={`param-chip ${isSelected ? 'selected' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '3px 10px', // More compact padding
                                    borderRadius: '8px', // Slightly less rounded for tech feel
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    background: isSelected ? `${style.color}25` : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isSelected ? style.color : 'rgba(255, 255, 255, 0.08)'}`,
                                    color: isSelected ? style.color : 'rgba(255, 255, 255, 0.5)',
                                    flexShrink: 0,
                                    height: '28px' // Fixed height for uniformity
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        cursor: 'pointer',
                                        accentColor: style.color,
                                        margin: 0
                                    }}
                                />
                                {style.icon && <Icon icon={style.icon} size="sm" />}
                                {style.label}
                            </div>
                        );
                    })}
                </div>

                <ArrowButton direction="right" onClick={() => scroll('right')} show={showRightArrow} />
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hover-glow:hover {
                    background: rgba(30, 41, 59, 1) !important;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
                    border-color: #3B82F6 !important;
                    color: #60A5FA !important;
                }
            `}</style>
        </div>
    );
};

export default React.memo(SensorParameterBar);
