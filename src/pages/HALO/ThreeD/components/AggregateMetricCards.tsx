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
    activeMetricGroup: any;
    setActiveMetricGroup: (group: any) => void;
}



const AggregateMetricCards: React.FC<AggregateMetricCardsProps> = ({
    areaIds,
    sensorGroupIds,
    activeMetricGroup,
    setActiveMetricGroup
}) => {
    const { darkModeStatus } = useDarkMode();
    const navigate = useNavigate();
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const { data: response, isLoading } = useAggregatedSensorData({
        area_id: areaIds,
        sensor_group_id: sensorGroupIds,
    });

    const { data: areas } = useAreas();

    const metricGroups = useMemo(() => {
        const data = response?.aggregated_data || {};

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

    // Neutral gray palette
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
                .dock-container {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    display: flex;
                    alignItems: flex-end;
                    gap: 8px;
                    padding: 0 4px;
                }
            `}</style>



            {/* ── Dock ── */}
            <div className="dock-container">
                {metricGroups.map(group => {
                    const isHovered = hoveredKey === group.key;
                    const isActive = activeMetricGroup?.key === group.key;

                    return (
                        <div
                            key={group.key}
                            className='dock-card'
                            onClick={() => setActiveMetricGroup(isActive ? null : group)}
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
                                background: isActive || isHovered ? cardBgHovered : cardBgDefault,
                                border: `1px solid ${isActive || isHovered ? borderHovered : borderDefault}`,
                                outline: isActive ? `2px solid #4d69fa` : 'none',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                cursor: 'pointer',
                                boxShadow: isActive || isHovered
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
                                color: isActive || isHovered ? labelHovered : labelColor,
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
                                background: isActive || isHovered ? dividerHovered : dividerDefault,
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
        </>
    );
};

export default AggregateMetricCards;
