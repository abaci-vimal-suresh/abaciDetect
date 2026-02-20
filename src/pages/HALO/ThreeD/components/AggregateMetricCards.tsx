import React, { useState, useMemo } from 'react';
import useDarkMode from '../../../../hooks/useDarkMode';
import { useAggregatedSensorData, useAreas } from '../../../../api/sensors.api';
import Icon from '../../../../components/icon/Icon';
import Modal, { ModalHeader, ModalBody, ModalTitle } from '../../../../components/bootstrap/Modal';
import { useNavigate } from 'react-router-dom';
import { getEffectiveConfig, buildProcessedMetrics } from '../../utils/radarMapping.utils';
import Button from '../../../../components/bootstrap/Button';

const METRIC_GROUPS = [
    {
        key: 'room_conditions',
        label: 'Room Conditions',
        icon: 'Thermostat',
        accentColor: '#ef4444',
        representative: 'temperature',
        representativeLabel: 'Temp',
        representativeUnit: '°C',
        metrics: [
            { key: 'temperature', label: 'Temperature', unit: '°C' },
            { key: 'humidity', label: 'Humidity', unit: '%' },
            { key: 'pressure', label: 'Pressure', unit: 'hPa' },
            { key: 'light', label: 'Light', unit: 'lux' },
        ],
    },
    {
        key: 'air_particles',
        label: 'Air Dust & Particles',
        icon: 'Grain',
        accentColor: '#f59e0b',
        representative: 'pm25',
        representativeLabel: 'PM2.5',
        representativeUnit: 'µg/m³',
        metrics: [
            { key: 'pm1', label: 'PM1', unit: 'µg/m³' },
            { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
            { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
        ],
    },
    {
        key: 'air_composition',
        label: 'Air Composition',
        icon: 'Science',
        accentColor: '#06b6d4',
        representative: 'co2',
        representativeLabel: 'CO₂',
        representativeUnit: 'ppm',
        metrics: [
            { key: 'co', label: 'CO', unit: 'ppm' },
            { key: 'co2', label: 'CO₂', unit: 'ppm' },
            { key: 'tvoc', label: 'TVOC', unit: 'ppb' },
            { key: 'nh3', label: 'NH₃', unit: 'ppm' },
            { key: 'no2', label: 'NO₂', unit: 'ppb' },
        ],
    },
    {
        key: 'air_quality_score',
        label: 'Air Quality Score',
        icon: 'Shield',
        accentColor: '#10b981',
        representative: 'aqi',
        representativeLabel: 'AQI',
        representativeUnit: 'index',
        metrics: [
            { key: 'aqi', label: 'AQI', unit: 'index' },
            { key: 'health', label: 'Health Score', unit: 'score' },
        ],
    },
    {
        key: 'activity_movement',
        label: ' Movement',
        icon: 'DirectionsRun',
        accentColor: '#6366f1',
        representative: 'movement',
        representativeLabel: 'Movement',
        representativeUnit: 'mm/s',
        metrics: [
            { key: 'movement', label: 'Movement', unit: 'mm/s' },
            { key: 'acc_x', label: 'Accel X', unit: 'mg' },
            { key: 'acc_y', label: 'Accel Y', unit: 'mg' },
            { key: 'acc_z', label: 'Accel Z', unit: 'mg' },
            { key: 'panic', label: 'Panic', unit: '—' },
        ],
    },
    {
        key: 'sound_noise',
        label: 'Sound & Noise',
        icon: 'VolumeUp',
        accentColor: '#8b5cf6',
        representative: 'sound',
        representativeLabel: 'Sound',
        representativeUnit: 'dB',
        metrics: [
            { key: 'sound', label: 'Sound', unit: 'dB' },
            { key: 'noise', label: 'Noise', unit: 'dB' },
        ],
    },
];

interface AggregateMetricCardsProps {
    areaIds: (number | string)[];
    sensorGroupIds?: (number | string)[];
}

const AggregateMetricCards: React.FC<AggregateMetricCardsProps> = ({ areaIds, sensorGroupIds }) => {
    const { darkModeStatus } = useDarkMode();
    const navigate = useNavigate();
    const [activeMetricGroup, setActiveMetricGroup] = useState<any>(null);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const { data: response, isLoading } = useAggregatedSensorData({
        area_id: areaIds,
        sensor_group_id: sensorGroupIds,
    });

    const { data: areas } = useAreas();

    const metricGroups = useMemo(() => {
        const data = response?.aggregated_data || {};

        // Find the "primary" area for config (usually the first one or the building)
        const primaryArea = areas?.find(a => areaIds.includes(a.id));
        const effectiveConfig = getEffectiveConfig(primaryArea, areas);

        return METRIC_GROUPS.map(group => {
            const metricKeys = group.metrics.map(m => m.key);
            const processed = buildProcessedMetrics(data, effectiveConfig, metricKeys);

            return {
                ...group,
                metrics: processed,
                hasData: processed.length > 0,
                representativeMin: data[`${group.representative}_min`] != null
                    ? Number(data[`${group.representative}_min`]).toFixed(1) : null,
                representativeMax: data[`${group.representative}_max`] != null
                    ? Number(data[`${group.representative}_max`]).toFixed(1) : null,
            };
        });
    }, [response, areas, areaIds]);

    if (isLoading) return null;

    // Neutral gray palette (dark-mode aware)
    const cardBgDefault = darkModeStatus ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)';
    const cardBgHovered = darkModeStatus ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)';
    const borderDefault = darkModeStatus ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const borderHovered = darkModeStatus ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
    const iconBg = darkModeStatus ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
    const iconColor = darkModeStatus ? 'rgba(255,255,255,0.7)' : '#374151';
    const labelColor = darkModeStatus ? 'rgba(255,255,255,0.85)' : '#111827';
    const labelHovered = darkModeStatus ? 'rgba(255,255,255,0.95)' : '#000000';
    const dividerDefault = darkModeStatus ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const dividerHovered = darkModeStatus ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';
    const mutedColor = darkModeStatus ? 'rgba(255,255,255,0.35)' : '#6b7280';
    const valueColor = darkModeStatus ? 'rgba(255,255,255,0.85)' : '#374151';

    return (
        <>
            <style>{`
                .dock-card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                }
                .dock-card:hover {
                    transform: translateY(-8px) scale(1.08);
                }
            `}</style>

            {/* ── Dock ── */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 8,
                    padding: '0 4px',
                }}
            >
                {metricGroups.map(group => {
                    const isHovered = hoveredKey === group.key;

                    return (
                        <div
                            key={group.key}
                            className='dock-card'
                            onClick={() => setActiveMetricGroup(group)}
                            onMouseEnter={() => setHoveredKey(group.key)}
                            onMouseLeave={() => setHoveredKey(null)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 112,
                                padding: '10px 10px 8px',
                                borderRadius: 14,
                                background: isHovered ? cardBgHovered : cardBgDefault,
                                border: `1px solid ${isHovered ? borderHovered : borderDefault}`,
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                cursor: 'pointer',
                                boxShadow: isHovered
                                    ? '0 6px 20px rgba(0,0,0,0.12)'
                                    : '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            {/* Icon bubble */}
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: iconColor,
                                marginBottom: 5,
                                transition: 'background 0.3s ease',
                            }}>
                                <Icon icon={group.icon as any} size='sm' />
                            </div>

                            {/* Label */}
                            <div style={{
                                fontSize: '0.58rem',
                                fontWeight: 700,
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                color: isHovered ? labelHovered : labelColor,
                                lineHeight: 1.3,
                                marginBottom: 6,
                                transition: 'color 0.3s ease',
                            }}>
                                {group.label}
                            </div>

                            {/* Divider */}
                            <div style={{
                                width: '100%',
                                height: 1,
                                background: isHovered ? dividerHovered : dividerDefault,
                                marginBottom: 6,
                                transition: 'background 0.3s ease',
                            }} />

                            {/* Values */}
                            {group.hasData ? (
                                <div style={{ width: '100%' }}>
                                    <div style={{
                                        fontSize: '0.55rem',
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        color: mutedColor,
                                        marginBottom: 3,
                                        letterSpacing: '0.03em',
                                    }}>
                                        {group.representativeLabel}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginBottom: 2 }}>
                                        <span style={{ fontSize: '0.55rem', color: mutedColor, fontWeight: 600 }}>MIN</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: valueColor }}>
                                            {group.representativeMin ?? '—'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
                                        <span style={{ fontSize: '0.55rem', color: mutedColor, fontWeight: 600 }}>MAX</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: valueColor }}>
                                            {group.representativeMax ?? '—'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span style={{ fontSize: '0.55rem', color: mutedColor, letterSpacing: '0.03em' }}>
                                    No Data
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Detail Modal ── */}
            <Modal
                isOpen={!!activeMetricGroup}
                setIsOpen={(v) => { if (!v) setActiveMetricGroup(null); }}
                size='lg'
                isCentered
                isScrollable
            >
                <ModalHeader setIsOpen={(v: boolean) => { if (!v) setActiveMetricGroup(null); }}>
                    <ModalTitle id='metric-detail-modal'>
                        {activeMetricGroup && (
                            <div className='d-flex align-items-center gap-3'>
                                <div
                                    className='rounded-2 d-flex align-items-center justify-content-center flex-shrink-0'
                                    style={{ width: 36, height: 36, background: '#e5e7eb', color: '#374151' }}
                                >
                                    <Icon icon={activeMetricGroup.icon as any} />
                                </div>
                                <div>
                                    <div className='fw-bold fs-6'>{activeMetricGroup.label}</div>
                                    <div className='text-muted' style={{ fontSize: '0.72rem' }}>
                                        Building Metrics · Min & Max over selected period
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalTitle>
                </ModalHeader>

                <ModalBody>
                    {activeMetricGroup && (
                        <>
                            <div style={{ height: 3, background: '#e5e7eb' }} />
                            <div className='p-4'>
                                {activeMetricGroup.hasData ? (
                                    <div className='row g-3'>
                                        {activeMetricGroup.metrics.map((metric: any) => (
                                            <div key={metric.key} className='col-6 col-md-4'>
                                                <div
                                                    className='p-3 rounded-2 text-center'
                                                    style={{
                                                        border: `1px solid ${darkModeStatus ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                                                        background: darkModeStatus ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                                                    }}
                                                >
                                                    <div className='fw-bold mb-3' style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: darkModeStatus ? 'rgba(255,255,255,0.7)' : '#374151' }}>
                                                        {metric.label}
                                                    </div>

                                                    {/* MIN Value with Sensor Navigation */}
                                                    <div className='d-flex flex-column gap-2 mb-3'>
                                                        <div className='d-flex justify-content-between align-items-center px-1'>
                                                            <span className='text-muted' style={{ fontSize: '0.65rem', fontWeight: 700 }}>MIN</span>
                                                            <span className='fw-bold' style={{ fontSize: '1.1rem' }}>
                                                                {metric.rawMin != null ? metric.rawMin.toFixed(1) : <span className='text-muted fs-6'>—</span>}
                                                            </span>
                                                        </div>
                                                        {metric.minSensorId && (
                                                            <Button
                                                                isNeumorphic
                                                                size='sm'
                                                                color='info'
                                                                isLight
                                                                icon='DirectionsRun'
                                                                className='w-100 py-1'
                                                                style={{ fontSize: '0.7rem' }}
                                                                onClick={() => navigate(`/halo/sensors/detail/${metric.minSensorId}`)}
                                                            >
                                                                Sensor #{metric.minSensorId}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* MAX Value with Sensor Navigation */}
                                                    <div className='d-flex flex-column gap-2'>
                                                        <div className='d-flex justify-content-between align-items-center px-1'>
                                                            <span className='text-muted' style={{ fontSize: '0.65rem', fontWeight: 700 }}>MAX</span>
                                                            <span className='fw-bold' style={{ fontSize: '1.1rem', color: metric.statusColor }}>
                                                                {metric.rawMax != null ? metric.rawMax.toFixed(1) : <span className='text-muted fs-6'>—</span>}
                                                            </span>
                                                        </div>
                                                        {metric.maxSensorId && (
                                                            <Button
                                                                isNeumorphic
                                                                size='sm'
                                                                color='danger'
                                                                isLight
                                                                icon='Sensors'
                                                                className='w-100 py-1'
                                                                style={{ fontSize: '0.7rem' }}
                                                                onClick={() => navigate(`/halo/sensors/detail/${metric.maxSensorId}`)}
                                                            >
                                                                Sensor #{metric.maxSensorId}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className='mt-3'>
                                                        <span
                                                            className='rounded-pill px-2 py-1'
                                                            style={{
                                                                fontSize: '0.62rem',
                                                                fontWeight: 600,
                                                                background: darkModeStatus ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                                                                color: darkModeStatus ? 'rgba(255,255,255,0.7)' : '#374151'
                                                            }}
                                                        >
                                                            {metric.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='text-center py-5'>
                                        <div
                                            className='rounded-circle d-inline-flex align-items-center justify-content-center mb-3'
                                            style={{ width: 64, height: 64, background: '#f3f4f6' }}
                                        >
                                            <Icon icon={activeMetricGroup.icon as any} className='text-muted fs-3' />
                                        </div>
                                        <div className='fw-semibold text-muted mb-1'>No data available</div>
                                        <div className='text-muted small'>No readings recorded for this group in the selected time window.</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </ModalBody>
            </Modal>
        </>
    );
};

export default AggregateMetricCards;