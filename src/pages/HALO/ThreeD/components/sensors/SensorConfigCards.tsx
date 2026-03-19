import React, { useRef } from 'react';
import { useSensorConfigurations, useLatestSensorLog } from '../../../../../api/sensors.api';
import useDarkMode from '../../../../../hooks/useDarkMode';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import { Sensor, SensorLog } from '../../../../../types/sensor';

interface SensorConfigCardsProps {
    sensorId: string | number;
    sensor?: Sensor | null;
}

// ── Live value lookup 
const getLiveValue = (eventId: string, log: SensorLog): { value: number | null | undefined; unit: string } | null => {
    const key = eventId.toLowerCase();

    const MAP: Record<string, { get: (l: SensorLog) => number | null | undefined; unit: string }> = {
        // Derived
        aqi: { get: l => l.readings_derived.aqi, unit: 'idx' },
        health_index: { get: l => l.readings_derived.health_index, unit: '/5' },
        noise_db: { get: l => l.readings_derived.noise_db, unit: 'dB' },
        motion: { get: l => l.readings_derived.motion, unit: '%' },
        movement: { get: l => l.readings_derived.movement, unit: '' },
        gunshot: { get: l => l.readings_derived.gunshot, unit: '' },
        aggression: { get: l => l.readings_derived.aggression, unit: '' },
        // Air
        co2_eq: { get: l => l.readings_air.co2_eq, unit: 'ppm' },
        co2cal: { get: l => l.readings_air.co2_cal, unit: 'ppm' },
        co2: { get: l => l.readings_air.co2_eq, unit: 'ppm' },
        tvoc: { get: l => l.readings_air.tvoc, unit: 'ppb' },
        co: { get: l => l.readings_air.co, unit: 'ppm' },
        nh3: { get: l => l.readings_air.nh3, unit: 'ppm' },
        no2: { get: l => l.readings_air.no2, unit: 'ppb' },
        pm25: { get: l => l.readings_air.pm25, unit: 'µg/m³' },
        pm10: { get: l => l.readings_air.pm10, unit: 'µg/m³' },
        pm1: { get: l => l.readings_air.pm1, unit: 'µg/m³' },
        // Environmental
        temperature_c: { get: l => l.readings_environmental.temperature_c, unit: '°C' },
        temperature: { get: l => l.readings_environmental.temperature_c, unit: '°C' },
        humidity: { get: l => l.readings_environmental.humidity_percent, unit: '%' },
        humidity_percent: { get: l => l.readings_environmental.humidity_percent, unit: '%' },
        light_lux: { get: l => l.readings_environmental.light_lux, unit: 'lux' },
        light: { get: l => l.readings_environmental.light_lux, unit: 'lux' },
        pressure_hpa: { get: l => l.readings_environmental.pressure_hpa, unit: 'hPa' },
        pressure: { get: l => l.readings_environmental.pressure_hpa, unit: 'hPa' },
        sound_db: { get: l => l.readings_environmental.sound_db, unit: 'dB' },
        // Others
        help: { get: l => l.others.help, unit: '' },
        panic: { get: l => l.others.panic, unit: '' },
        // alert is a catch-all – derived.aggression is the closest proxy
        alert: { get: l => l.readings_derived.aggression, unit: '' },
    };

    const entry = MAP[key];
    if (!entry) return null;
    return { value: entry.get(log), unit: entry.unit };
};

// ── Value colour based on threshold ──────────────────────────────────────────
const getLiveColor = (value: number | null | undefined, threshold: number, maxValue: number): string => {
    if (value === null || value === undefined) return '#94a3b8';
    if (maxValue > 0) {
        const pct = value / maxValue;
        if (pct >= 0.9) return '#ef4444';
        if (pct >= 0.6) return '#f59e0b';
    }
    if (value >= threshold) return '#ef4444';
    return '#22c55e';
};

// ─────────────────────────────────────────────────────────────────────────────

const SensorConfigCards: React.FC<SensorConfigCardsProps> = ({ sensorId, sensor }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: configs, isLoading } = useSensorConfigurations(sensorId);
    const { data: latestLog, isFetching: logFetching } = useLatestSensorLog(sensorId, { refetchInterval: 15000 });
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

    const syncTime = latestLog
        ? new Date(latestLog.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <>
            <style>{`
                .dock-scroll::-webkit-scrollbar { display: none; }
                .dock-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                .dock-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .dock-card:hover {
                    transform: translateY(-6px) scale(1.04);
                    box-shadow: 0 14px 32px rgba(0,0,0,0.28);
                }
                .dock-arrow {
                    cursor: pointer;
                    transition: opacity 0.2s, background 0.2s;
                    opacity: 0.55;
                }
                .dock-arrow:hover { opacity: 1; }
                @keyframes live-pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.4; }
                }
                .live-dot { animation: live-pulse 2s ease-in-out infinite; }
            `}</style>

            {/* Outer wrapper */}
            <div
                className="position-absolute top-0 start-0 end-0 d-flex flex-column align-items-center"
                style={{ zIndex: 1000, pointerEvents: 'none', paddingTop: '10px' }}
            >
                {/* ── Sensor name header ─────────────────────────────────── */}
                {sensor && (
                    <div
                        className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-1"
                        style={{
                            pointerEvents: 'auto',
                            background: darkModeStatus ? 'rgba(10, 18, 35, 0.82)' : 'rgba(255,255,255,0.82)',
                            backdropFilter: 'blur(14px)',
                            WebkitBackdropFilter: 'blur(14px)',
                            border: darkModeStatus ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            fontSize: '0.72rem',
                        }}
                    >
                        {/* live / stale dot */}
                        <span
                            className="live-dot"
                            style={{
                                display: 'inline-block',
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: latestLog ? '#22c55e' : '#94a3b8',
                                boxShadow: latestLog ? '0 0 6px #22c55e' : 'none',
                                flexShrink: 0,
                            }}
                        />
                        <span className="fw-bold" style={{ color: darkModeStatus ? '#e2e8f0' : '#1e293b' }}>
                            {sensor.name}
                        </span>
                        <span className="text-muted font-monospace" style={{ fontSize: '0.6rem' }}>
                            {sensor.mac_address}
                        </span>
                        {logFetching && (
                            <Spinner size="8px" color="info" isSmall />
                        )}
                        {syncTime && (
                            <span className="text-muted" style={{ fontSize: '0.6rem' }}>
                                Sync {syncTime}
                            </span>
                        )}
                    </div>
                )}

                {/* ── Config + live dock pill ────────────────────────────── */}
                <div
                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                    style={{
                        width: '62%',
                        background: darkModeStatus ? 'rgba(10, 18, 35, 0.88)' : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: darkModeStatus ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                        boxShadow: darkModeStatus ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Left arrow */}
                    <button
                        className="dock-arrow btn btn-sm d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 p-0"
                        onClick={() => scroll('left')}
                        style={{
                            width: 28, height: 28,
                            background: darkModeStatus ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            border: 'none',
                            color: darkModeStatus ? '#fff' : '#333',
                        }}
                    >
                        <Icon icon="ChevronLeft" size="sm" />
                    </button>

                    {/* Scrollable cards */}
                    <div
                        ref={scrollRef}
                        className="dock-scroll d-flex gap-2 overflow-auto flex-grow-1"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {configs.map((config) => {
                            const ledColor = getHexColor(config.led_color);
                            const live = latestLog ? getLiveValue(config.event_id, latestLog) : null;
                            const liveVal = live?.value;
                            const liveUnit = live?.unit ?? '';
                            const liveColor = live
                                ? getLiveColor(liveVal, config.threshold, config.max_value)
                                : '#94a3b8';
                            const hasLive = live !== null && liveVal !== null && liveVal !== undefined;

                            return (
                                <div
                                    key={config.id}
                                    className="dock-card flex-shrink-0 rounded-3 d-flex flex-column align-items-center justify-content-between px-3 py-2"
                                    style={{
                                        minWidth: '115px',
                                        height: '96px',
                                        background: darkModeStatus ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        border: darkModeStatus
                                            ? '1px solid rgba(255,255,255,0.07)'
                                            : '1px solid rgba(0,0,0,0.06)',
                                        cursor: 'default',
                                        position: 'relative',
                                    }}
                                >
                                    {/* ── Row 1: Event name + dot ── */}
                                    <div className="d-flex align-items-center gap-1 w-100">
                                        {config.enabled && (
                                            <div style={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: ledColor, boxShadow: `0 0 5px ${ledColor}`,
                                                flexShrink: 0,
                                            }} />
                                        )}
                                        <span
                                            className="fw-semibold text-truncate"
                                            style={{
                                                fontSize: '0.62rem',
                                                letterSpacing: '0.04em',
                                                color: darkModeStatus ? '#cbd5e1' : '#334155',
                                            }}
                                        >
                                            {config.event_id}
                                        </span>
                                    </div>

                                    {/* ── Row 2: Live value (prominent) ── */}
                                    <div className="d-flex flex-column align-items-center w-100 py-1">
                                        {hasLive ? (
                                            <div className="d-flex align-items-baseline gap-1">
                                                <span
                                                    className="fw-bold"
                                                    style={{ fontSize: '1.1rem', color: liveColor, lineHeight: 1 }}
                                                >
                                                    {typeof liveVal === 'number' ? liveVal.toFixed(liveVal < 10 ? 1 : 0) : liveVal}
                                                </span>
                                                {liveUnit && (
                                                    <span className="text-muted" style={{ fontSize: '0.55rem' }}>
                                                        {liveUnit}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                        )}
                                    </div>

                                    {/* ── Row 3: THR + min/max ── */}
                                    <div className="d-flex flex-column align-items-center w-100">
                                        <div className="d-flex align-items-baseline gap-1">
                                            <span className="text-muted" style={{ fontSize: '0.55rem' }}>THR:</span>
                                            <span className="fw-bold text-info" style={{ fontSize: '0.72rem' }}>
                                                {config.threshold}
                                            </span>
                                        </div>
                                        <div
                                            className="d-flex align-items-center gap-1"
                                            style={{ fontSize: '0.55rem', opacity: 0.45 }}
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
                            width: 28, height: 28,
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