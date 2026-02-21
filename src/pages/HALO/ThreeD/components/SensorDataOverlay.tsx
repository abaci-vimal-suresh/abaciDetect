import React from 'react';
import { Sensor } from '../../../../types/sensor';
import { useLatestSensorLog } from '../../../../api/sensors.api';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';
import Spinner from '../../../../components/bootstrap/Spinner';

interface SensorDataOverlayProps {
    sensor: Sensor;
    onClose: () => void;
    onSettingsClick?: () => void;
}

const SensorDataOverlay: React.FC<SensorDataOverlayProps> = ({ sensor, onClose, onSettingsClick }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: latestLog, isLoading, isFetching } = useLatestSensorLog(sensor.id, { refetchInterval: 15000 });

    const renderMetric = (label: string, value: any, unit: string, icon: string, color: string = 'info') => (
        <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center">
                <Icon icon={icon} className={`text-${color} me-2`} size="sm" />
                <span className="small text-muted">{label}</span>
            </div>
            <div className="fw-bold small">
                {value !== null && value !== undefined ? (
                    <>
                        {value} <span className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>{unit}</span>
                    </>
                ) : (
                    <span className="text-muted italic">N/A</span>
                )}
            </div>
        </div>
    );

    return (
        <div
            className='h-100 p-0'
            style={{
                width: '100%',
                zIndex: 1100,
                pointerEvents: 'auto',
                animation: 'slide-in-right 0.4s ease-out'
            }}
        >
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .sensor-data-card {
                    backdrop-filter: blur(20px);
                    background: ${darkModeStatus ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)'};
                    border-left: 1px solid ${darkModeStatus ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)'};
                    box-shadow: -5px 0 20px rgba(0,0,0,0.2);
                }
            `}</style>

            <div className="sensor-data-card h-100 d-flex flex-column overflow-auto scrollbar-hidden">
                <CardHeader className="bg-transparent border-bottom p-2">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="text-truncate" style={{ maxWidth: '120px' }}>
                            <div className="d-flex align-items-center gap-1 mb-0">
                                <h6 className={`mb-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.8rem' }}>{sensor.name}</h6>
                                {isFetching && <Spinner size="8px" color="info" isSmall />}
                            </div>
                            <div className="small text-muted font-monospace" style={{ fontSize: '0.6rem' }}>{sensor.mac_address}</div>
                        </div>
                        <div className="d-flex align-items-center">
                            {onSettingsClick && (
                                <Button
                                    color="link"
                                    size="sm"
                                    onClick={onSettingsClick}
                                    icon="Settings"
                                    className="p-1"
                                    title="Open Settings"
                                />
                            )}
                            <Button color="link" size="sm" onClick={onClose} icon="Close" className="p-1" />
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-2">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner color="info" />
                            <div className="small mt-2 text-muted" style={{ fontSize: '0.7rem' }}>Loading...</div>
                        </div>
                    ) : latestLog ? (
                        <>
                            {/* Environmental Section */}
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1 border-bottom pb-1">
                                    <Icon icon="Thermostat" className="text-info me-1" size="sm" />
                                    <h6 className="mb-0 text-uppercase x-small fw-bold text-info" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Environmental</h6>
                                </div>
                                {renderMetric('Temp', latestLog.readings_environmental.temperature_c, '°C', 'DeviceThermostat')}
                                {renderMetric('Humidity', latestLog.readings_environmental.humidity_percent, '%', 'WaterDrop')}
                                {renderMetric('Light', latestLog.readings_environmental.light_lux, 'lux', 'LightMode')}
                                {renderMetric('Pressure', latestLog.readings_environmental.pressure_hpa, 'hPa', 'Compress')}
                            </div>

                            {/* Air Quality Section */}
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1 border-bottom pb-1">
                                    <Icon icon="Air" className="text-info me-1" size="sm" />
                                    <h6 className="mb-0 text-uppercase x-small fw-bold text-info" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Air Quality</h6>
                                </div>
                                {renderMetric('CO2 Eq', latestLog.readings_air.co2_eq, 'ppm', 'Cloud')}
                                {renderMetric('TVOC', latestLog.readings_air.tvoc, 'ppb', 'Co2')}
                                {renderMetric('PM2.5', latestLog.readings_air.pm25, 'µg/m³', 'Grain')}
                                {renderMetric('PM10', latestLog.readings_air.pm10, 'µg/m³', 'BlurOn')}
                                {renderMetric('NO2', latestLog.readings_air.no2, 'ppb', 'Science')}
                            </div>

                            {/* Derived Metrics Section */}
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1 border-bottom pb-1">
                                    <Icon icon="Insights" className="text-info me-1" size="sm" />
                                    <h6 className="mb-0 text-uppercase x-small fw-bold text-info" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Derived</h6>
                                </div>
                                {renderMetric('AQI', latestLog.readings_derived.aqi, 'idx', 'Speed')}
                                {renderMetric('Health', latestLog.readings_derived.health_index, '/5', 'MonitorHeart')}
                                {renderMetric('Noise', latestLog.readings_derived.noise_db, 'dB', 'GraphicEq')}
                                {renderMetric('Motion', latestLog.readings_derived.motion, '%', 'DirectionsRun')}
                            </div>

                            <div className="text-center mt-2 pt-1 border-top">
                                <span className="small text-muted" style={{ fontSize: '0.6rem' }}>
                                    Sync: {new Date(latestLog.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <Icon icon="SensorsOff" className="text-muted mb-1" size="lg" />
                            <div className="small text-muted" style={{ fontSize: '0.7rem' }}>No data.</div>
                        </div>
                    )}
                </CardBody>
            </div>
        </div>
    );
};

export default SensorDataOverlay;
