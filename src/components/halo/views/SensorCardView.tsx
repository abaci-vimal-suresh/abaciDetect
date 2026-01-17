import React from 'react';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Modal, { ModalHeader, ModalTitle, ModalBody } from '../../../components/bootstrap/Modal';
import { TColor } from '../../../type/color-type';
import styles from '../../../styles/pages/HALO/Sensors/views/Sensorcardview.module.scss';
import { SensorConfig } from '../../../types/sensor';
import { getMetricStatusFromConfig, hasActiveConfig, getConfigForMetric } from '../../../utils/halo/threshold.utils';

interface SensorCardViewProps {
    sensor: any;
    darkModeStatus: boolean;
    configurations: SensorConfig[];
}

const SensorCardView: React.FC<SensorCardViewProps> = ({ sensor, darkModeStatus, configurations }) => {
    const [isThresholdModalOpen, setIsThresholdModalOpen] = React.useState(false);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = React.useState(false);

    // Extract sensor data
    const sensorData = sensor.sensor_data?.sensors || (sensor as any).sensors || (sensor as any);
    const activeEvents = sensor.sensor_data?.active_events_list || (sensor as any).active_events_list || [];
    const eventThreshold = sensor.sensor_data?.threshold || sensor.event_threshold;
    const eventValue = sensor.sensor_data?.val !== undefined ? sensor.sensor_data.val : sensor.event_value;
    const eventSource = sensor.sensor_data?.source || sensor.event_source;
    const firmwareVersion = sensor.firmware_version || sensor.sensor_data?.firmware_version;
    const macAddress = sensor.mac_address || sensor.sensor_data?.mac;
    const ipAddress = sensor.ip_address || sensor.sensor_data?.ip;
    const updateTime = sensor.sensor_data?.time || sensor.timestamp;

    // Hardcoded status determination logic (FALLBACK when no configuration exists)
    const getMetricStatusHardcoded = (metric: string, value: number): 'safe' | 'warning' | 'danger' => {
        if (value === undefined || value === null) return 'safe';

        // Metric-specific defaults
        switch (metric.toLowerCase()) {
            case 'temp_c':
            case 'temperature':
                if (value >= 18 && value <= 26) return 'safe';
                if (value >= 15 && value <= 32) return 'warning';
                return 'danger';
            case 'humidity':
                if (value >= 30 && value <= 60) return 'safe';
                if (value >= 20 && value <= 75) return 'warning';
                return 'danger';
            case 'co2':
            case 'co2cal':
                if (value < 1000) return 'safe';
                if (value < 2000) return 'warning';
                return 'danger';
            case 'aqi':
                if (value <= 50) return 'safe';
                if (value <= 100) return 'warning';
                return 'danger';
            case 'tvoc':
                if (value < 25.0) return 'safe';
                if (value < 100.0) return 'warning';
                return 'danger';
            case 'noise':
            case 'sound':
                if (value < 65) return 'safe';
                if (value < 85) return 'warning';
                return 'danger';
            case 'motion':
                if (value < 80) return 'safe';
                if (value < 100) return 'warning';
                return 'danger';
            case 'pm25':
            case 'pm2.5':
                if (value < 15) return 'safe';
                if (value < 35) return 'warning';
                return 'danger';
            case 'no2':
                if (value < 0.5) return 'safe';
                if (value < 1.5) return 'warning';
                return 'danger';
            case 'nh3':
                if (value < 0.2) return 'safe';
                if (value < 1.0) return 'warning';
                return 'danger';
            case 'co':
                if (value < 0.05) return 'safe';
                if (value < 0.2) return 'warning';
                return 'danger';
            case 'aggression':
                if (value < 40) return 'safe';
                if (value < 70) return 'warning';
                return 'danger';
            case 'health_index':
                if (value <= 2) return 'safe';
                if (value <= 6) return 'warning';
                return 'danger';
            default:
                return 'safe';
        }
    };

    // NEW: Dynamic status determination using configured thresholds
    const getMetricStatus = (metric: string, value: number): 'safe' | 'warning' | 'danger' => {
        if (value === undefined || value === null) return 'safe';

        const normalizedMetric = metric.toLowerCase();
        const normalizedSource = eventSource?.toLowerCase() || '';

        // Check if this metric is the primary event source
        const isPrimarySource = normalizedSource.includes(normalizedMetric) ||
            normalizedMetric.includes(normalizedSource);

        // Try to use configured threshold from settings
        const configStatus = getMetricStatusFromConfig(metric, value, configurations);
        const hasConfig = hasActiveConfig(metric, configurations);
        const fallbackStatus = getMetricStatusHardcoded(metric, value);

        // If it's the primary source and we have event threshold, use that first
        if (isPrimarySource && eventThreshold) {
            const percentage = (value / eventThreshold) * 100;
            if (value > eventThreshold) return 'danger';
            if (percentage >= 80) return 'warning';
            return 'safe';
        }

        // Use configured threshold if available
        if (hasConfig) {
            return configStatus;
        }

        // No configuration found, fall back to hardcoded logic
        return fallbackStatus;
    };

    const getAQIStatus = (aqi: number): { color: TColor; label: string } => {
        if (aqi <= 50) return { color: 'success' as TColor, label: 'Good' };
        if (aqi <= 100) return { color: 'warning' as TColor, label: 'Moderate' };
        if (aqi <= 150) return { color: 'warning' as TColor, label: 'Unhealthy' };
        return { color: 'danger' as TColor, label: 'Very Unhealthy' };
    };

    const getHealthIndexStatus = (hi: number): { color: TColor; label: string } => {
        if (hi <= 2) return { color: 'success' as TColor, label: 'Excellent' };
        if (hi <= 4) return { color: 'info' as TColor, label: 'Good' };
        if (hi <= 6) return { color: 'warning' as TColor, label: 'Fair' };
        if (hi <= 8) return { color: 'warning' as TColor, label: 'Poor' };
        return { color: 'danger' as TColor, label: 'Very Poor' };
    };

    const getCardHighlightClass = (cardType: string): string => {
        if (!sensorData) return '';

        let statuses: ('safe' | 'warning' | 'danger')[] = [];

        switch (cardType.toLowerCase()) {
            case 'environment':
                statuses.push(getMetricStatus('temp_c', sensorData.temp_c || sensorData.temperature));
                statuses.push(getMetricStatus('humidity', sensorData.humidity));
                statuses.push(getMetricStatus('pressure_hpa', sensorData.pressure_hpa));
                statuses.push(getMetricStatus('light', sensorData.light));
                break;
            case 'airquality':
                statuses.push(getMetricStatus('aqi', sensorData.aqi));
                statuses.push(getMetricStatus('co2', sensorData.co2 || sensorData.co2cal));
                statuses.push(getMetricStatus('tvoc', sensorData.tvoc));
                break;
            case 'health':
                statuses.push(getMetricStatus('health_index', sensorData.health_index));
                break;
            case 'gases':
                statuses.push(getMetricStatus('co2', sensorData.co2 || sensorData.co2cal));
                statuses.push(getMetricStatus('tvoc', sensorData.tvoc));
                statuses.push(getMetricStatus('co', sensorData.co));
                statuses.push(getMetricStatus('no2', sensorData.no2));
                statuses.push(getMetricStatus('nh3', sensorData.nh3));
                break;
            case 'particulates':
                statuses.push(getMetricStatus('pm1', sensorData.pm1));
                statuses.push(getMetricStatus('pm25', sensorData.pm25));
                statuses.push(getMetricStatus('pm10', sensorData.pm10));
                statuses.push(getMetricStatus('pm1.0', sensorData.pm1));
                statuses.push(getMetricStatus('pm2.5', sensorData.pm25));
                statuses.push(getMetricStatus('pm10.0', sensorData.pm10));
                break;
            case 'occupancy':
                statuses.push(getMetricStatus('motion', sensorData.motion));
                break;
            case 'sound':
                statuses.push(getMetricStatus('noise', sensorData.noise));
                if (sensorData.gunshot > 0) statuses.push('danger');
                statuses.push(getMetricStatus('aggression', sensorData.aggression));
                break;
            case 'system':
                // System card is generally neutral unless MAC or IP is missing
                if (!macAddress || !ipAddress) statuses.push('warning');
                break;
        }

        if (statuses.includes('danger')) {
            return `${styles.thresholdDanger} ${styles.criticalAlert}`;
        }
        if (statuses.includes('warning')) return styles.thresholdWarning;
        if (statuses.length > 0) return styles.thresholdSafe;

        return '';
    };

    const getStatusColorClass = (status: 'safe' | 'warning' | 'danger' | string): string => {
        switch (status) {
            case 'safe': return styles.success;
            case 'warning': return styles.warning;
            case 'danger': return styles.danger;
            default: return '';
        }
    };

    const getAllThresholdAlerts = () => {
        const alerts: any[] = [];

        if (eventThreshold !== undefined && eventValue !== undefined && eventSource) {
            const percentage = (eventValue / eventThreshold) * 100;
            if (eventValue > eventThreshold) {
                alerts.push({ source: eventSource, status: 'danger', percentage, color: 'danger', label: 'Critical Threshold Exceeded', value: eventValue, threshold: eventThreshold });
            } else if (percentage >= 80) {
                alerts.push({ source: eventSource, status: 'warning', percentage, color: 'warning', label: 'Approaching Threshold', value: eventValue, threshold: eventThreshold });
            }
        }

        if (activeEvents && activeEvents.length > 0) {
            activeEvents.forEach((evt: string) => {
                if (alerts.some(a => a.source.toLowerCase().includes(evt.toLowerCase()))) return;

                alerts.push({
                    source: evt.replace('_', ' '),
                    status: 'danger',
                    percentage: 100,
                    color: 'danger',
                    label: 'Critical Event Active',
                    value: 0,
                    threshold: 0
                });
            });
        }

        if (sensorData) {
            const metricsToScan = [
                { key: 'temp_c', label: 'Temperature' },
                { key: 'humidity', label: 'Humidity' },
                { key: 'co2', label: 'CO2' },
                { key: 'tvoc', label: 'TVOC' },
                { key: 'aqi', label: 'AQI' },
                { key: 'noise', label: 'Noise' },
                { key: 'pm25', label: 'PM2.5' },
                { key: 'motion', label: 'Motion' },
                { key: 'aggression', label: 'Aggression' }
            ];

            metricsToScan.forEach(m => {
                const val = sensorData[m.key] || sensorData[m.key.replace('.', '')];
                if (val !== undefined && val !== null) {
                    const status = getMetricStatus(m.key, val);

                    // Check if this metric has a custom configuration
                    const config = getConfigForMetric(m.key, configurations);

                    if (status !== 'safe' && !alerts.some(a => a.source.toLowerCase().includes(m.label.toLowerCase()))) {
                        alerts.push({
                            source: m.label,
                            status,
                            percentage: status === 'danger' ? 100 : 85,
                            color: status === 'danger' ? 'danger' : 'warning',
                            label: status === 'danger' ? 'Limit Exceeded' : 'Warning Level',
                            value: val,
                            threshold: config?.threshold || 0,
                            hasCustomConfig: !!config // NEW: Flag to show if using custom threshold
                        });
                    }
                }
            });
        }

        return alerts;
    };

    const aqiStatus = sensorData ? getAQIStatus(sensorData.aqi) : null;
    const healthStatus = sensorData ? getHealthIndexStatus(sensorData.health_index) : null;
    const allAlerts = getAllThresholdAlerts();
    const hasActiveAlerts = allAlerts.length > 0;

    return (
        <>
            {/* Active Events Header */}
            {activeEvents.length > 0 && (
                <div className="mb-4 d-flex flex-wrap gap-2">
                    {activeEvents.map((evt: string, idx: number) => (
                        <Badge key={idx} color='danger' className="py-2 px-3 shadow-sm border border-danger border-opacity-25" style={{ fontSize: '0.9rem', borderRadius: '30px' }}>
                            <Icon icon='Warning' className='me-2' />
                            {evt.replace('_', ' ')} ACTIVE
                        </Badge>
                    ))}
                </div>
            )}

            <div className={styles.sensorGrid}>
                {/* Environment Card */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('environment')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            {getCardHighlightClass('environment').includes(styles.thresholdDanger) && (
                                <div className={styles.alertLed} />
                            )}
                            <h6>Environment</h6>
                        </div>
                        <Icon icon='Info' className={styles.helpIcon} size='lg' />
                    </div>
                    <div className={styles.metricsGrid + ' ' + styles.threeCol}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Temperature</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('temp_c', sensorData?.temp_c || 0))}`}>
                                {sensorData?.temp_c || '--'}
                                <span className={styles.unit}>°C</span>
                                {sensorData?.temp_f && (
                                    <span className={styles.unit} style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '4px' }}>
                                        / {sensorData.temp_f.toFixed(1)}°F
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Humidity</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('humidity', sensorData?.humidity || 0))}`}>
                                {sensorData?.humidity || '--'}
                                <span className={styles.unit}>%</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Pressure</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('pressure_hpa', sensorData?.pressure_hpa || 0))}`}>
                                {sensorData?.pressure_hpa || '--'}
                                <span className={styles.unit}>hPa</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Light</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('light', sensorData?.light || 0))}`}>
                                {sensorData?.light || '--'}
                                <span className={styles.unit}>lux</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Air Particulates Card */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('particulates')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            {getCardHighlightClass('particulates').includes(styles.thresholdDanger) && (
                                <div className={styles.alertLed} />
                            )}
                            <h6>Air Particulates</h6>
                        </div>
                        <Icon icon='Info' className={styles.helpIcon} size='lg' />
                    </div>
                    <div className={styles.metricsGrid + ' ' + styles.threeCol}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>PM1</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('pm1', sensorData?.pm1 || 0))}`}>
                                {sensorData?.pm1 || '--'}
                                <span className={styles.unit}>µg/m³</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>PM2.5</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('pm25', sensorData?.pm25 || 0))}`}>
                                {sensorData?.pm25 || '--'}
                                <span className={styles.unit}>µg/m³</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>PM10</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('pm10', sensorData?.pm10 || 0))}`}>
                                {sensorData?.pm10 || '--'}
                                <span className={styles.unit}>µg/m³</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gases Card */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('gases')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            {getCardHighlightClass('gases').includes(styles.thresholdDanger) && (
                                <div className={styles.alertLed} />
                            )}
                            <h6>Gases</h6>
                        </div>
                        <Icon icon='Info' className={styles.helpIcon} size='lg' />
                    </div>
                    <div className={styles.metricsGrid + ' ' + styles.threeCol}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>CO</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('co', sensorData?.co || 0))}`}>
                                {sensorData?.co2 || '--'}
                                <span className={styles.unit}>ppm</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>NH₃</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('nh3', sensorData?.nh3 || 0))}`}>
                                {sensorData?.nh3 || '--'}
                                <span className={styles.unit}>ppm</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>NO₂</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('no2', sensorData?.no2 || 0))}`}>
                                {sensorData?.no2 || '--'}
                                <span className={styles.unit}>ppb</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>CO2cal</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('co2', sensorData?.co2 || sensorData?.co2cal || 0))}`}>
                                {sensorData?.co2 || sensorData?.co2cal || '--'}
                                <span className={styles.unit}>ppm</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>TVOC</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('tvoc', sensorData?.tvoc || 0))}`}>
                                {sensorData?.tvoc || '--'}
                                <span className={styles.unit}>ppb</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Air Quality Index Card */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('airquality')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            {getCardHighlightClass('airquality').includes(styles.thresholdDanger) && (
                                <div className={styles.alertLed} />
                            )}
                            <h6>Air Quality Index</h6>
                        </div>
                        <Icon icon='Info' className={styles.helpIcon} size='lg' />
                    </div>
                    <div className={styles.largeMetric}>
                        <div className={`${styles.metricIcon} ${aqiStatus ? styles[aqiStatus.color] : ''}`}>
                            {sensorData?.aqi || 0}
                        </div>
                        <div className={styles.metricContent}>
                            <div className={styles.metricLabel}>Current AQI</div>
                            {aqiStatus && (
                                <Badge color={aqiStatus.color as TColor} className={styles.metricStatus}>
                                    {aqiStatus.label}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className={styles.factorsList}>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>PM2.5</div>
                            <div className={`${styles.factorValue} ${styles.unhealthy}`}>{sensorData?.pm25aqi || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>PM10</div>
                            <div className={`${styles.factorValue} ${styles.moderate}`}>{sensorData?.pm10aqi || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>CO2</div>
                            <div className={`${styles.factorValue} ${styles.good}`}>{sensorData?.co2aqi || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>NO₂</div>
                            <div className={`${styles.factorValue} ${styles.good}`}>{sensorData?.no2aqi || '--'}</div>
                        </div>
                    </div>
                </div>

                {/* Health Index Card */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('health')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            {getCardHighlightClass('health').includes(styles.thresholdDanger) && (
                                <div className={styles.alertLed} />
                            )}
                            <h6>Health Index</h6>
                        </div>
                        <Icon icon='Info' className={styles.helpIcon} size='lg' />
                    </div>
                    <div className={styles.largeMetric}>
                        <div className={`${styles.metricIcon} ${healthStatus ? styles[healthStatus.color] : ''}`}>
                            {sensorData?.health_index || 0}
                        </div>
                        <div className={styles.metricContent}>
                            <div className={styles.metricLabel}>Overall Health</div>
                            {healthStatus && (
                                <Badge color={healthStatus.color as TColor} className={styles.metricStatus}>
                                    {healthStatus.label}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className={styles.factorsList}>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>PM1</div>
                            <div className={`${styles.factorValue} ${styles.unhealthy}`}>{sensorData?.hi_pm1 || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>PM2.5</div>
                            <div className={`${styles.factorValue} ${styles.moderate}`}>{sensorData?.hi_pm25 || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>PM10</div>
                            <div className={`${styles.factorValue} ${styles.good}`}>{sensorData?.hi_pm10 || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>CO2cal</div>
                            <div className={`${styles.factorValue} ${styles.unhealthy}`}>{sensorData?.hi_co2 || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>TVOC</div>
                            <div className={`${styles.factorValue} ${styles.good}`}>{sensorData?.hi_tvoc || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>Humidity</div>
                            <div className={`${styles.factorValue} ${styles.good}`}>{sensorData?.humidity || '--'}</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>NO₂</div>
                            <div className={`${styles.factorValue} ${styles.good}`}>{sensorData?.hi_no2 || '--'}</div>
                        </div>
                    </div>
                </div>

                {/* Room Occupancy Card */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('occupancy')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            {getCardHighlightClass('occupancy').includes(styles.thresholdDanger) && (
                                <div className={styles.alertLed} />
                            )}
                            <h6>Room Occupancy</h6>
                        </div>
                        <Icon icon='Info' className={styles.helpIcon} size='lg' />
                    </div>
                    <div className={styles.metricItem}>
                        <div className={styles.metricLabel}>Motion</div>
                        <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('motion', sensorData?.motion || 0))}`}>
                            {sensorData?.motion || '--'}
                        </div>
                    </div>
                </div>

                {/* Sound Card */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('sound')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            {getCardHighlightClass('sound').includes(styles.thresholdDanger) && (
                                <div className={styles.alertLed} />
                            )}
                            <h6>Sound</h6>
                        </div>
                        <Icon icon='Info' className={styles.helpIcon} size='lg' />
                    </div>
                    <div className={styles.metricsGrid + ' ' + styles.threeCol}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Noise</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('noise', sensorData?.noise || 0))}`}>
                                {sensorData?.noise || '--'}
                                <span className={styles.unit}>dB</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Gunshot</div>
                            <div className={`${styles.metricValue} ${sensorData?.gunshot === 0 ? styles.success : styles.danger}`}>
                                {sensorData?.gunshot === 0 ? 'Safe' : 'Alert'}
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricLabel}>Aggression</div>
                            <div className={`${styles.metricValue} ${getStatusColorClass(getMetricStatus('aggression', sensorData?.aggression || 0))}`}>
                                {sensorData?.aggression || '--'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Information Card - NEW */}
                <div className={`${styles.neuCard} ${styles.glossyCard} ${getCardHighlightClass('system')}`}>
                    <div className={styles.cardHeader}>
                        <div className='d-flex align-items-center'>
                            <h6>System Information</h6>
                        </div>
                        <Icon
                            icon='Settings'
                            className={styles.helpIcon}
                            size='lg'
                            onClick={() => setIsDeviceModalOpen(true)}
                            style={{ cursor: 'pointer', opacity: 0.6 }}
                        />
                    </div>
                    <div className={styles.deviceInfo} style={{ border: 'none', background: 'transparent' }}>
                        <div className={styles.infoRow} style={{ padding: '0.5rem 0' }}>
                            <span className={styles.infoLabel}>MAC Address</span>
                            <span className={styles.infoValue} style={{ fontSize: '0.8rem' }}>{macAddress || 'N/A'}</span>
                        </div>
                        <div className={styles.infoRow} style={{ padding: '0.5rem 0' }}>
                            <span className={styles.infoLabel}>IP Address</span>
                            <span className={styles.infoValue}>{ipAddress || 'N/A'}</span>
                        </div>
                        <div className={styles.infoRow} style={{ padding: '0.5rem 0' }}>
                            <span className={styles.infoLabel}>Firmware</span>
                            <span className={styles.infoValue}>{firmwareVersion || 'N/A'}</span>
                        </div>
                        <div className={styles.infoRow} style={{ padding: '0.5rem 0' }}>
                            <span className={styles.infoLabel}>Last Update</span>
                            <span className={styles.infoValue} style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                {updateTime ? new Date(updateTime).toLocaleTimeString() : 'N/A'}
                            </span>
                        </div>
                        {sensor.building_room && (
                            <div className={styles.infoRow} style={{ padding: '0.5rem 0' }}>
                                <span className={styles.infoLabel}>Room</span>
                                <span className={styles.infoValue}>{sensor.building_room}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Threshold Modal */}
            {hasActiveAlerts && (
                <Modal
                    isOpen={isThresholdModalOpen}
                    setIsOpen={setIsThresholdModalOpen}
                    size='lg'
                    isScrollable
                    isCentered
                >
                    <ModalHeader setIsOpen={setIsThresholdModalOpen}>
                        <ModalTitle id='threshold-analysis-modal-title'>
                            Threshold Analysis ({allAlerts.length} Alerts)
                        </ModalTitle>
                    </ModalHeader>
                    <ModalBody className={styles.scrollableModalBody}>
                        <div className="alert alert-soft-danger d-flex align-items-center mb-4">
                            <Icon icon='Warning' size='lg' className='me-2' />
                            <div>
                                <strong>Sensor Vigilance:</strong> Multiple metrics have reached critical or warning thresholds.
                            </div>
                        </div>

                        <div className={styles.thresholdList}>
                            {allAlerts.map((alert, index) => (
                                <div key={index} className={`${styles.thresholdInfo} mb-3`}>
                                    <div className='d-flex justify-content-between align-items-center mb-3'>
                                        <h6 className="mb-0 fw-bold">{alert.source}</h6>
                                        <Badge color={alert.color} isLight>
                                            {alert.label}
                                        </Badge>
                                    </div>

                                    <div className={styles.thresholdRow}>
                                        <span className={styles.thresholdLabel}>Current Reading</span>
                                        <span className={`${styles.thresholdValue} ${styles[alert.status]}`}>
                                            {alert.value > 0 ? alert.value.toFixed(1) : 'ACTIVE'}
                                        </span>
                                    </div>

                                    {alert.threshold > 0 && (
                                        <div className={styles.thresholdRow}>
                                            <span className={styles.thresholdLabel}>Target Limit</span>
                                            <span className={styles.thresholdValue}>{alert.threshold.toFixed(1)}</span>
                                        </div>
                                    )}

                                    <div className={styles.thresholdProgress + ' mt-3'}>
                                        <div
                                            className={`${styles.thresholdBar} ${styles[alert.status]}`}
                                            style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ModalBody>
                </Modal>
            )}

            {/* Device Info Modal */}
            <Modal
                isOpen={isDeviceModalOpen}
                setIsOpen={setIsDeviceModalOpen}
                isScrollable
                isCentered
            >
                <ModalHeader setIsOpen={setIsDeviceModalOpen}>
                    <ModalTitle id='device-info-modal-title'>Device Information</ModalTitle>
                </ModalHeader>
                <ModalBody className={styles.scrollableModalBody}>
                    <div className={styles.deviceInfo}>
                        <div className='mb-3 text-center'>
                            <Badge color={sensor.is_active ? 'success' : 'danger'} isLight>
                                {sensor.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Device Name</span>
                            <span className={styles.infoValue}>{sensor.device_name || sensor.name}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>MAC Address</span>
                            <span className={styles.infoValue}>{sensor.mac_address || 'N/A'}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>IP Address</span>
                            <span className={styles.infoValue}>{sensor.ip_address || 'N/A'}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Firmware Version</span>
                            <span className={styles.infoValue}>{sensor.firmware_version || 'N/A'}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Location</span>
                            <span className={styles.infoValue}>
                                {sensor.building_room || sensor.location || 'N/A'}
                            </span>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </>
    );
};

export default SensorCardView;