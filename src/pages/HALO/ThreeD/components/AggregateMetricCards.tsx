import React from 'react';
import useDarkMode from '../../../../hooks/useDarkMode';
import { useAggregatedSensorData } from '../../../../api/sensors.api';
import Icon from '../../../../components/icon/Icon';

interface AggregateMetricCardsProps {
    areaIds: (number | string)[];
    sensorGroupIds?: (number | string)[];
}

const AggregateMetricCards: React.FC<AggregateMetricCardsProps> = ({ areaIds, sensorGroupIds }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: response, isLoading } = useAggregatedSensorData({
        area_id: areaIds,
        sensor_group_id: sensorGroupIds
    });

    if (isLoading) {
        return (
            <div className="position-absolute top-0 start-0 d-flex gap-3 px-4 py-3 shadow-lg border-bottom border-info border-opacity-25"
                style={{ width: '100%', background: darkModeStatus ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000 }}>
                <div className="spinner-border spinner-border-sm text-info m-auto" role="status" />
                <span className="text-info small fw-bold text-uppercase">Aggregating Building Data...</span>
            </div>
        );
    }

    const data = response?.aggregated_data || {};

    const metrics = [
        { key: 'temperature', label: 'TEMP', unit: '°C', icon: 'Thermostat' },
        { key: 'humidity', label: 'HUM', unit: '%', icon: 'WaterDrop' },
        { key: 'aqi', label: 'AQI', unit: 'Index', icon: 'Air' },
        { key: 'co2', label: 'CO2', unit: 'PPM', icon: 'Cloud' },
        { key: 'tvoc', label: 'TVOC', unit: 'PPB', icon: 'Co2' },
        { key: 'pm25', label: 'PM2.5', unit: 'µg', icon: 'Grain' },
        { key: 'noise', label: 'NOISE', unit: 'dB', icon: 'GraphicEq' },
        { key: 'light', label: 'LIGHT', unit: 'Lux', icon: 'LightMode' },
        { key: 'pressure', label: 'PRESSURE', unit: 'hPa', icon: 'Compress' },
        { key: 'pm1', label: 'PM1.0', unit: 'µg', icon: 'Grain' },
        { key: 'pm10', label: 'PM10', unit: 'µg', icon: 'BlurOn' },
        { key: 'no2', label: 'NO2', unit: 'PPB', icon: 'Science' },
        { key: 'co', label: 'CO', unit: 'PPM', icon: 'CloudQueue' },
        { key: 'movement', label: 'MOVEMENT', unit: '%', icon: 'DirectionsRun' },
        { key: 'health', label: 'HEALTH', unit: '/ 5', icon: 'MonitorHeart' },
    ];

    return (
        <div className="position-absolute start-0 d-flex gap-3 px-4 py-3 shadow-lg overflow-auto no-scrollbar"
            style={{
                top: '0',
                left: '0',
                right: '0',
                width: '100%',
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: darkModeStatus ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
                zIndex: 1000,
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }}>
            {metrics.map(m => {
                const min = data[`${m.key}_min`] ?? '--';
                const max = data[`${m.key}_max`] ?? '--';

                return (
                    <div key={m.key}
                        className="flex-shrink-0 d-flex flex-column align-items-center justify-content-center px-3 py-2 rounded-3"
                        style={{
                            minWidth: '110px',
                            height: '95px',
                            background: darkModeStatus ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                            border: darkModeStatus ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.02)'
                        }}>
                        <div className="d-flex align-items-center gap-2 mb-1 opacity-75">
                            <Icon icon={m.icon} size="sm" className="text-info" />
                            <span className="fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>{m.label}</span>
                        </div>

                        <div className="d-flex flex-column align-items-center gap-0 w-100 mt-1">
                            {/* Min Value */}
                            <div className="d-flex justify-content-between align-items-center w-100 px-2">
                                <span className="text-muted" style={{ fontSize: '0.6rem' }}>MIN:</span>
                                <span className="fw-bold text-info" style={{ fontSize: '0.8rem' }}>{min}</span>
                            </div>

                            {/* Max Value */}
                            <div className="d-flex justify-content-between align-items-center w-100 px-2 mt-n1">
                                <span className="text-muted" style={{ fontSize: '0.6rem' }}>MAX:</span>
                                <span className="fw-bold text-info" style={{ fontSize: '0.8rem' }}>{max}</span>
                            </div>

                            <div className="mt-1 opacity-50 text-uppercase fw-bold" style={{ fontSize: '0.55rem', letterSpacing: '0.05em' }}>
                                {m.unit}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AggregateMetricCards;
