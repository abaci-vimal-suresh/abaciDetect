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
            className='position-absolute end-0 m-3 p-0 rounded shadow overflow-hidden d-flex flex-column transition-all'
            style={{
                top: '80px',
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                width: '320px',
                maxHeight: 'calc(100% - 110px)',
                border: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                zIndex: 101,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
        >
            <Card className="mb-0 border-0 bg-transparent flex-grow-1 overflow-auto scrollbar-hidden">
                <CardHeader className="bg-transparent border-bottom p-3">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="text-truncate" style={{ maxWidth: '220px' }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h6 className={`mb-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`}>{sensor.name}</h6>
                                {isFetching && <Spinner size="10px" color="info" isSmall />}
                            </div>
                            <div className="small text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{sensor.mac_address}</div>
                        </div>
                        <div className="d-flex align-items-center">
                            {onSettingsClick && (
                                <Button
                                    color="link"
                                    size="sm"
                                    onClick={onSettingsClick}
                                    icon="Settings"
                                    className="me-1"
                                    title="Open Settings"
                                />
                            )}
                            <Button color="link" size="sm" onClick={onClose} icon="Close" />
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-3">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner color="info" />
                            <div className="small mt-2 text-muted">Awaiting Sensor Data...</div>
                        </div>
                    ) : latestLog ? (
                        <>
                            {/* Environmental Section */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2 border-bottom pb-1">
                                    <Icon icon="Thermostat" className="text-info me-2" size="sm" />
                                    <h6 className="mb-0 text-uppercase x-small fw-bold text-info" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Environmental</h6>
                                </div>
                                {renderMetric('Temperature', latestLog.readings_environmental.temperature_c, '°C', 'DeviceThermostat')}
                                {renderMetric('Humidity', latestLog.readings_environmental.humidity_percent, '%', 'WaterDrop')}
                                {renderMetric('Light', latestLog.readings_environmental.light_lux, 'lux', 'LightMode')}
                                {renderMetric('Pressure', latestLog.readings_environmental.pressure_hpa, 'hPa', 'Compress')}
                            </div>

                            {/* Air Quality Section */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2 border-bottom pb-1">
                                    <Icon icon="Air" className="text-info me-2" size="sm" />
                                    <h6 className="mb-0 text-uppercase x-small fw-bold text-info" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Air Quality</h6>
                                </div>
                                {renderMetric('CO2 Eq', latestLog.readings_air.co2_eq, 'ppm', 'Cloud')}
                                {renderMetric('TVOC', latestLog.readings_air.tvoc, 'ppb', 'Co2')}
                                {renderMetric('PM2.5', latestLog.readings_air.pm25, 'µg/m³', 'Grain')}
                                {renderMetric('PM10', latestLog.readings_air.pm10, 'µg/m³', 'BlurOn')}
                                {renderMetric('NO2', latestLog.readings_air.no2, 'ppb', 'Science')}
                            </div>

                            {/* Derived Metrics Section */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2 border-bottom pb-1">
                                    <Icon icon="Insights" className="text-info me-2" size="sm" />
                                    <h6 className="mb-0 text-uppercase x-small fw-bold text-info" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Derived Metrics</h6>
                                </div>
                                {renderMetric('AQI', latestLog.readings_derived.aqi, 'index', 'Speed')}
                                {renderMetric('Health Index', latestLog.readings_derived.health_index, '/ 5', 'MonitorHeart')}
                                {renderMetric('Noise', latestLog.readings_derived.noise_db, 'dB', 'GraphicEq')}
                                {renderMetric('Motion', latestLog.readings_derived.motion, '%', 'DirectionsRun')}
                            </div>

                            <div className="text-center mt-3 pt-2 border-top">
                                <span className="small text-muted" style={{ fontSize: '0.65rem' }}>
                                    Last Sync: {new Date(latestLog.recorded_at).toLocaleTimeString()}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5">
                            <Icon icon="SensorsOff" className="text-muted mb-2" size="lg" />
                            <div className="small text-muted">No readings available for this sensor.</div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default SensorDataOverlay;
