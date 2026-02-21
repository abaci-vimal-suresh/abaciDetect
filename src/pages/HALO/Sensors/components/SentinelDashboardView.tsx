import React, { useState } from 'react';
import classNames from 'classnames';
import styles from './SentinelSensorDetail.module.scss';
import Icon from '../../../../components/icon/Icon';
import { Sensor, SensorLog } from '../../../../types/sensor';
import { getSensorMetricValue } from '../../utils/sensorData.utils';
import { getMetricStatus } from '../../utils/threshold.utils';

interface SentinelDashboardViewProps {
    sensor: Sensor;
    latestLog?: SensorLog | null;
    darkModeStatus: boolean;
    configurations: any[];
}

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    title: string;
    description: string;
    safeRange?: string;
}

const SentinelDashboardView: React.FC<SentinelDashboardViewProps> = ({
    sensor,
    latestLog,
    darkModeStatus,
    configurations,
}) => {
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        title: '',
        description: ''
    });

    // Helper to get value from sensor data, prioritizing real-time log
    const getValue = (key: string): any => {
        if (latestLog) {
            // Check groups
            if (key in latestLog.readings_environmental) return (latestLog.readings_environmental as any)[key];
            if (key in latestLog.readings_air) return (latestLog.readings_air as any)[key];
            if (key in latestLog.readings_derived) return (latestLog.readings_derived as any)[key];
            if (key in latestLog.others) return (latestLog.others as any)[key];

            // Map legacy keys to new log keys if needed
            if (key === 'humidity') return latestLog.readings_environmental.humidity_percent;
            if (key === 'light') return latestLog.readings_environmental.light_lux;
            if (key === 'noise') return latestLog.readings_environmental.sound_db || latestLog.readings_derived.noise_db || 0;
            if (key === 'co2') return latestLog.readings_air.co2_eq;
        }
        return getSensorMetricValue(sensor, key);
    };

    const handleMouseMove = (e: React.MouseEvent, title: string, desc: string, range?: string) => {
        setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title,
            description: desc,
            safeRange: range
        });
    };

    const hideTooltip = () => setTooltip(prev => ({ ...prev, visible: false }));

    // Granular Status Logic (Ported from standard dashboard behavior)
    // Now uses centralized utility

    const getCardStatus = (cardType: string) => {
        const statuses: ('safe' | 'warning' | 'critical')[] = [];

        switch (cardType) {
            case 'aqi':
                statuses.push(getMetricStatus('aqi', getValue('aqi')));
                break;
            case 'health':
                statuses.push(getMetricStatus('health_index', getValue('health_index')));
                break;
            case 'environment':
                statuses.push(getMetricStatus('temp_c', getValue('temp_c')) || getMetricStatus('temp_c', getValue('temperature_c')));
                statuses.push(getMetricStatus('humidity', getValue('humidity')) || getMetricStatus('humidity', getValue('humidity_percent')));
                break;
            case 'gases':
                statuses.push(getMetricStatus('co2', getValue('co2')) || getMetricStatus('co2', getValue('co2_eq')));
                statuses.push(getMetricStatus('tvoc', getValue('tvoc')));
                statuses.push(getMetricStatus('co', getValue('co')));
                statuses.push(getMetricStatus('nh3', getValue('nh3')));
                break;
            case 'particulates':
                statuses.push(getMetricStatus('pm25', getValue('pm25')));
                statuses.push(getMetricStatus('pm10', getValue('pm10')));
                break;
            case 'sound':
                statuses.push(getMetricStatus('noise', getValue('noise')));
                statuses.push(getMetricStatus('gunshot', getValue('gunshot')));
                statuses.push(getMetricStatus('aggression', getValue('aggression')));
                break;
            case 'occupancy':
                // For occupancy, we use motion as a trigger
                if (getValue('motion') > 5) statuses.push('warning');
                else statuses.push('safe');
                break;
            default:
                statuses.push('safe');
        }

        if (statuses.includes('critical')) return styles.statusCritical;
        if (statuses.includes('warning')) return styles.statusWarning;
        return styles.statusSafe;
    };

    const personCount = getValue('person_count') || getValue('motion') || 0;
    const sensorStatus = sensor.status?.toLowerCase() || 'safe';


    return (
        <div className={styles.sentinelSensor}>
            <div className={styles.sentinelContainer}>

                <div className={styles.dashboardGrid}>

                    {/* AQI CARD */}
                    <div
                        className={classNames(styles.sentinelCard, styles.aqiCard, getCardStatus('aqi'))}
                        onMouseMove={(e) => handleMouseMove(e, 'Air Quality Index', 'Aggregated measurement of harmful pollutants in the atmosphere.', '0 - 50 AQI (Good)')}
                        onMouseLeave={hideTooltip}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Air Quality Analysis
                        </div>
                        <div className={styles.aqiLayout}>
                            <div className={styles.aqiVisualWrapper}>
                                <div className={styles.aqiContainer}>
                                    <div
                                        className={classNames(styles.aqiCircle, getCardStatus('aqi'))}
                                        style={{ '--aqi-fill': `${Math.min((getValue('aqi') / 150) * 100, 100)}%` } as React.CSSProperties}
                                    >
                                        <div className={styles.aqiInner}>
                                            <div className={styles.aqiLabel}>Global AQI</div>
                                            <div className={styles.aqiValue}>{getValue('aqi')}</div>
                                            <div className={styles.aqiStatus}>{getValue('aqi') < 50 ? 'EXCELLENT' : (getValue('aqi') < 100 ? 'GOOD' : 'MODERATE')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HEALTH CARD */}
                    <div
                        className={classNames(styles.sentinelCard, styles.healthCard, getCardStatus('health'))}
                        onMouseMove={(e) => handleMouseMove(e, 'Health & Safety', 'Combined metric of CO2, TVOC, and particulate risks to human health.', '80% - 100% (Safe)')}
                        onMouseLeave={hideTooltip}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Health & Safety Index
                        </div>
                        <div className={styles.healthLayout}>
                            <div className={styles.healthScoreContainer}>
                                <div className={styles.healthScoreValue}>{getValue('health_index')}</div>
                                <div className={styles.healthLabel}>Overall Score</div>

                            </div>
                            <div className={styles.miniMetricGrid}>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>CO2 Risk</div>
                                    <div className={classNames(styles.subMetricValue, { [styles.warning]: getValue('hi_co2') < 80 })}>{getValue('hi_co2')}%</div>
                                </div>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>VOC Risk</div>
                                    <div className={styles.subMetricValue}>{getValue('hi_tvoc')}%</div>
                                </div>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>PM Risk</div>
                                    <div className={styles.subMetricValue}>{getValue('hi_pm25')}%</div>
                                </div>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>NO2 Risk</div>
                                    <div className={styles.subMetricValue}>{getValue('hi_no2')}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ENVIRONMENT CARD */}
                    <div
                        className={classNames(styles.sentinelCard, styles.environmentCard, getCardStatus('environment'))}
                        onMouseMove={(e) => handleMouseMove(e, 'Atmospheric Data', 'Real-time readings of ambient temperature, humidity, light, and pressure.')}
                        onMouseLeave={hideTooltip}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Environment
                        </div>
                        <div className={styles.metricGrid}>
                            <div className={styles.metric}>
                                <div className={styles.metricIcon}>🌡️</div>
                                <div className={styles.metricLabel}>Temp</div>
                                <div className={styles.metricValue}>
                                    {getValue('temp_c')} <span className={styles.metricUnit}>°C</span>
                                </div>
                            </div>
                            <div className={styles.metric}>
                                <div className={styles.metricIcon}>💧</div>
                                <div className={styles.metricLabel}>Humidity</div>
                                <div className={styles.metricValue}>
                                    {getValue('humidity')} <span className={styles.metricUnit}>%</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.miniMetricGrid}>
                            <div className={styles.subMetric}>
                                <div className={styles.subMetricLabel}>Light</div>
                                <div className={styles.subMetricValue}>{getValue('light')} <span className={styles.metricUnit}>lux</span></div>
                            </div>
                            <div className={styles.subMetric}>
                                <div className={styles.subMetricLabel}>Pressure</div>
                                <div className={styles.subMetricValue}>{getValue('pressure_hpa')} <span className={styles.metricUnit}>hPa</span></div>
                            </div>
                        </div>
                    </div>



                    {/* GASES CARD */}
                    <div
                        className={classNames(styles.sentinelCard, styles.gasesCard, getCardStatus('gases'))}
                        onMouseMove={(e) => handleMouseMove(e, 'Chemical Analysis', 'Spectroscopic analysis of airborne chemical compounds and hazardous gases.', '< 1000 ppm (CO2)')}
                        onMouseLeave={hideTooltip}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Chemical Analysis
                        </div>
                        <div className={styles.gasesContainer}>
                            <div className={styles.mainGasMetric}>
                                <div className={styles.gasIcon}>CO₂</div>
                                <div className={styles.gasInfo}>
                                    <div className={styles.gasLabel}>Carbon Dioxide</div>
                                    <div className={styles.gasValue}>{getValue('co2')} <span className={styles.metricUnit}>ppm</span></div>
                                </div>
                            </div>
                            <div className={styles.miniMetricGrid}>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>CO</div>
                                    <div className={styles.subMetricValue}>{getValue('co')} <span className={styles.metricUnit}>ppm</span></div>
                                </div>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>NH₃</div>
                                    <div className={styles.subMetricValue}>{getValue('nh3')} <span className={styles.metricUnit}>ppb</span></div>
                                </div>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>NO2</div>
                                    <div className={styles.subMetricValue}>{getValue('no2')} <span className={styles.metricUnit}>ppb</span></div>
                                </div>
                                <div className={styles.subMetric}>
                                    <div className={styles.subMetricLabel}>TVOC</div>
                                    <div className={styles.subMetricValue}>{getValue('tvoc')} <span className={styles.metricUnit}>ppb</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PARTICULATES CARD */}
                    <div
                        className={classNames(styles.sentinelCard, styles.particulatesCard, getCardStatus('particulates'))}
                        onMouseMove={(e) => handleMouseMove(e, 'Particulate Matter', 'Real-time monitoring of Suspended Particulate Matter (SPM) by size.', '< 15 µg/m³ (PM2.5)')}
                        onMouseLeave={hideTooltip}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Particulate Matter
                        </div>
                        <div className={styles.particulatesContainer}>
                            <div className={styles.particulateItem}>
                                <div className={styles.particulateLabel}>
                                    <span>PM1 (Ultrafine)</span>
                                    <span>{getValue('pm1')} µg/m³</span>
                                </div>
                                <div className={styles.particulateBarContainer}>
                                    <div className={classNames(styles.particulateBar, styles[`status${getMetricStatus('pm1', getValue('pm1')).charAt(0).toUpperCase() + getMetricStatus('pm1', getValue('pm1')).slice(1)}`])} style={{ width: `${Math.min(getValue('pm1') * 2, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className={styles.particulateItem}>
                                <div className={styles.particulateLabel}>
                                    <span>PM2.5 (Combustion)</span>
                                    <span>{getValue('pm25')} µg/m³</span>
                                </div>
                                <div className={styles.particulateBarContainer}>
                                    <div className={classNames(styles.particulateBar, styles[`status${getMetricStatus('pm25', getValue('pm25')).charAt(0).toUpperCase() + getMetricStatus('pm25', getValue('pm25')).slice(1)}`])} style={{ width: `${Math.min(getValue('pm25') * 1.5, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className={styles.particulateItem}>
                                <div className={styles.particulateLabel}>
                                    <span>PM10 (Dust/Pollen)</span>
                                    <span>{getValue('pm10')} µg/m³</span>
                                </div>
                                <div className={styles.particulateBarContainer}>
                                    <div className={classNames(styles.particulateBar, styles[`status${getMetricStatus('pm10', getValue('pm10')).charAt(0).toUpperCase() + getMetricStatus('pm10', getValue('pm10')).slice(1)}`])} style={{ width: `${Math.min(getValue('pm10'), 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.insightOrb} onMouseEnter={(e) => handleMouseMove(e, 'Toxicity Analysis', 'CO2 levels are being monitored for workspace safety.')}>
                        <div className={styles.orbValue}>{getValue('co2')}</div>
                        <div className={styles.orbLabel}>ppm co2</div>
                    </div>

                    <div className={styles.insightOrb}>
                        <div className={styles.orbValue}>{getValue('humidity')}%</div>
                        <div className={styles.orbLabel}>Humidity</div>
                    </div>

                    {/* ACOUSTIC MONITORING CARD */}
                    <div
                        className={classNames(styles.sentinelCard, styles.soundCard, getCardStatus('sound'))}
                        onMouseMove={(e) => handleMouseMove(e, 'Acoustic Defense', 'Advanced audio analysis for gunshot detection and aggression patterns.', '< 70 dB (Ambient)')}
                        onMouseLeave={hideTooltip}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Acoustic Monitoring
                        </div>
                        <div className={styles.soundContainer}>
                            {/* Left: Noise Value */}
                            <div className={styles.soundInfoLeft}>
                                <div className={styles.noiseLabel}>NOISE</div>
                                <div className={classNames(styles.soundValue, { [styles.critical]: getValue('gunshot') === 1 })}>
                                    {getValue('noise')} <span className={styles.metricUnit}>dB</span>
                                </div>
                            </div>

                            {/* Center: Spectrum Analyzer */}
                            <div className={classNames(styles.spectrumAnalyzer, { [styles.gunshotActive]: getValue('gunshot') === 1 })}>
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={styles.spectrumBar}
                                        style={{
                                            // More active in the middle, or chaotic if gunshot
                                            height: getValue('gunshot') === 1
                                                ? `${30 + Math.random() * 70}%`
                                                : `${10 + Math.sin(i / 3 + Date.now() / 1000) * 40 + 20}%`,
                                            transitionDelay: `${i * 0.02}s`
                                        }}
                                    ></div>
                                ))}
                            </div>

                            {/* Right: Alert Column */}
                            <div className={styles.alertColumn}>
                                <Icon
                                    icon={getValue('gunshot') === 1 ? 'Report' : 'GraphicEq'}
                                    className={styles.alertIconTriangle}
                                />
                                <div className={styles.alertText}>
                                    {getValue('gunshot') === 1 ? (
                                        <>GUNSHOT<br />ALERT</>
                                    ) : (
                                        <>ACOUSTIC<br />STABLE</>
                                    )}
                                </div>
                                {getValue('aggression') === 1 && (
                                    <div className={styles.alertText} style={{ color: '#ffd93d', marginTop: '5px' }}>
                                        AGGRESSION<br />DETECTED
                                    </div>
                                )}
                            </div>

                            {/* Bullet Impact Overlay */}
                            {getValue('gunshot') === 1 && (
                                <div className={styles.bulletImpact}>
                                    <div className={styles.muzzleFlash}></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ROOM OCCUPANCY CARD */}
                    <div
                        className={classNames(styles.sentinelCard, styles.occupancyCard, getCardStatus('occupancy'))}
                        onMouseMove={(e) => handleMouseMove(e, 'Occupancy Radar', 'Low-power millimeter wave radar for human presence and motion tracking.')}
                        onMouseLeave={hideTooltip}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Room Occupancy
                        </div>
                        <div className={styles.occupancyContainer}>
                            <div className={styles.radar}>
                                {personCount > 0 && [...Array(personCount)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={styles.radarPoint}
                                        style={{
                                            top: `${20 + Math.random() * 60}%`,
                                            left: `${20 + Math.random() * 60}%`,
                                            animationDelay: `${i * 0.5}s`
                                        }}
                                    />
                                ))}
                            </div>
                            <div className={styles.occupancyInfo}>
                                <div className={styles.personIcon}>
                                    <Icon icon='Person' />
                                </div>
                                <div className={styles.motionData}>
                                    <div className={styles.motionLabel}>MOTION</div>
                                    <div className={styles.motionValue}>{personCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>





                    {/* SYSTEM CARD */}

                    <div className={classNames(styles.sentinelCard, styles.systemCard, styles.statusSafe)}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}></div>
                            Hardware Diagnostics
                        </div>
                        <div className={styles.systemGrid}>
                            <div className={styles.systemItem}>
                                <span className={styles.systemLabel}>MAC ADDRESS</span>
                                <span className={styles.systemValue}>{sensor.mac_address || '00:00:00:00:00:00'}</span>
                            </div>
                            <div className={styles.systemItem}>
                                <span className={styles.systemLabel}>FIRMWARE</span>
                                <span className={styles.systemValue}>{sensor.firmware_version || 'v2.1.0'}</span>
                            </div>
                            <div className={styles.systemItem}>
                                <span className={styles.systemLabel}>IP ADDRESS</span>
                                <span className={styles.systemValue}>{sensor.ip_address || '192.168.1.100'}</span>
                            </div>
                            <div className={styles.systemItem}>
                                <span className={styles.systemLabel}>CPU TEMP</span>
                                <span className={styles.systemValue}>42°C</span>
                            </div>
                        </div>
                    </div>

                    {/* DIAGNOSTIC TERMINAL (Matches API Response Structure) */}


                </div>
            </div>

            {/* GLASSY TOOLTIP */}
            {tooltip.visible && (
                <div
                    className={styles.glassyTooltip}
                    style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y,
                    }}
                >
                    <div className={styles.tooltipHeader}>{tooltip.title}</div>
                    <div className={styles.tooltipDesc}>{tooltip.description}</div>
                    {tooltip.safeRange && (
                        <div className={styles.tooltipRange}>
                            <span>Optimal Range:</span>
                            <span>{tooltip.safeRange}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default SentinelDashboardView;
