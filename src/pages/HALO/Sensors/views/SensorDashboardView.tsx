import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Modal, { ModalHeader, ModalTitle, ModalBody } from '../../../../components/bootstrap/Modal';
import { TColor } from '../../../../type/color-type';
import RadialGaugeChart from '../components/charts/RadialGaugeChart';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import VerticalColumnChart from '../components/charts/VerticalColumnChart';
import CentralLoadGauge from '../components/charts/Centralloadgauge';
import styles from '../../../../styles/pages/HALO/Sensors/SensorDetail.module.scss';
import { SensorConfig, SensorLog } from '../../../../types/sensor';
import { getMetricStatusFromConfig, getConfigForMetric, getStatusColor } from '../../../../helpers/thresholdUtils';
import { getSensorMetricValue } from '../../utils/sensorData.utils';

interface SensorDashboardViewProps {
    sensor: any;
    latestLog?: SensorLog | null;
    darkModeStatus: boolean;
    configurations: SensorConfig[];
}

const SensorDashboardView: React.FC<SensorDashboardViewProps> = ({ sensor, latestLog, darkModeStatus, configurations }) => {
    const [isThresholdModalOpen, setIsThresholdModalOpen] = React.useState(false);

    // Helper to get value from sensor data, prioritizing real-time log
    const getValue = (key: string): any => {
        if (latestLog) {
            // Map common keys to nested structure
            if (key === 'humidity') return latestLog.readings_environmental.humidity_percent;
            if (key === 'light') return latestLog.readings_environmental.light_lux;
            if (key === 'co2') return latestLog.readings_air.co2_eq;
            if (key === 'noise') return latestLog.readings_environmental.sound_db || latestLog.readings_derived.noise_db || 0;
            if (key === 'temp_c') return latestLog.readings_environmental.temperature_c;

            // Check nested groups in latestLog
            if (key in latestLog.readings_environmental) return (latestLog.readings_environmental as any)[key];
            if (key in latestLog.readings_air) return (latestLog.readings_air as any)[key];
            if (key in latestLog.readings_derived) return (latestLog.readings_derived as any)[key];
            if (key in latestLog.others) return (latestLog.others as any)[key];
        }
        return getSensorMetricValue(sensor, key);
    };

    const activeEvents = sensor.sensor_data?.active_events_list || (sensor as any).active_events_list || [];

    // Determine status based on thresholds
    const getStatus = (): 'ready' | 'running' | 'warning' | 'error' => {
        const eventValue = getValue('val') || sensor.event_value;
        const eventThreshold = getValue('threshold') || sensor.event_threshold;

        if (!eventThreshold || !eventValue) return 'ready';

        const percentage = (eventValue / eventThreshold) * 100;
        if (eventValue > eventThreshold) return 'error';
        if (percentage >= 90) return 'warning';
        return 'running';
    };

    // Helper to get color for gauges based on thresholds
    const getGaugeColor = (metric: string, value: number, defaultValue: string): string => {
        const status = getMetricStatusFromConfig(metric, value, configurations);
        const hasConfig = configurations.some(c => c.sensor_name === metric && c.enabled);

        if (hasConfig) {
            switch (status) {
                case 'danger': return '#f35421'; // Red-Orange
                case 'warning': return '#ffcf52'; // Yellow
                case 'safe': return '#46bcaa'; // Green
                default: return defaultValue;
            }
        }

        return defaultValue; // Fallback to chart's specific logic if no config
    };

    // Prepare chart data - ENVIRONMENT METRICS (Using getValue for live updates)
    const environmentData = [
        { label: 'Temperature', value: getValue('temp_c') || 0, unit: '°C', color: '#4d69fa' },
        { label: 'Humidity', value: getValue('humidity') || 0, unit: '%', color: '#46bcaa' },
        { label: 'Pressure', value: getValue('pressure_hpa') || 0, unit: 'hPa', color: '#ffcf52' },
        { label: 'Light', value: getValue('light') || 0, unit: 'lux', color: '#a87ca1' }
    ];

    // AIR QUALITY METRICS
    const airQualityData = [
        { label: 'AQI', value: getValue('aqi') || 0, unit: '', color: '#f35421' },
        { label: 'PM2.5 AQI', value: getValue('pm25aqi') || 0, unit: '', color: '#ffcf52' },
        { label: 'PM10 AQI', value: getValue('pm10aqi') || 0, unit: '', color: '#4d69fa' },
        { label: 'CO AQI', value: getValue('coaqi') || 0, unit: '', color: '#46bcaa' },
        { label: 'NO₂ AQI', value: getValue('no2aqi') || 0, unit: '', color: '#a87ca1' }
    ];

    // PARTICULATE MATTER
    const particulateData = [
        { label: 'PM1', value: getValue('pm1') || 0, unit: 'µg/m³', color: '#4d69fa' },
        { label: 'PM2.5', value: getValue('pm25') || 0, unit: 'µg/m³', color: '#f35421' },
        { label: 'PM10', value: getValue('pm10') || 0, unit: 'µg/m³', color: '#ffcf52' }
    ];

    // GAS SENSORS
    const gasData = [
        { label: 'CO₂', value: getValue('co2') || 0, unit: 'ppm', color: '#f35421' },
        { label: 'TVOC', value: getValue('tvoc') || 0, unit: 'ppb', color: '#ffcf52' },
        { label: 'CO', value: getValue('co') || 0, unit: 'ppm', color: '#4d69fa' },
        { label: 'NO₂', value: getValue('no2') || 0, unit: 'ppb', color: '#a87ca1' },
        { label: 'NH₃', value: getValue('nh3') || 0, unit: 'ppm', color: '#46bcaa' }
    ];

    // HEALTH INDEX FACTORS
    const healthFactorsData = [
        { label: 'HI PM1', value: getValue('hi_pm1') || 0, color: '#4d69fa' },
        { label: 'HI PM2.5', value: getValue('hi_pm25') || 0, color: '#f35421' },
        { label: 'HI PM10', value: getValue('hi_pm10') || 0, color: '#ffcf52' },
        { label: 'HI CO₂', value: getValue('hi_co2') || 0, color: '#46bcaa' },
        { label: 'HI TVOC', value: getValue('hi_tvoc') || 0, color: '#a87ca1' },
        { label: 'HI Humidity', value: getValue('hi_hum') || 0, color: '#7a3a6f' }
    ];

    // SOUND & SAFETY
    const soundSafetyData = [
        { label: 'Noise Level', value: getValue('noise') || 0, unit: 'dB', color: '#4d69fa' },
        { label: 'Aggression', value: getValue('aggression') || 0, unit: '', color: '#f35421' },
        { label: 'Gunshot', value: getValue('gunshot') || 0, unit: '', color: getValue('gunshot') > 0 ? '#f35421' : '#46bcaa' }
    ];

    return (
        <>
            {/* Main Dashboard Grid */}
            <div className={styles.dashboardGrid}>
                {/* Top Row - Key Metric Radial Gauges */}
                <Card className={styles.gaugeCard}>
                    <CardBody>
                        <RadialGaugeChart
                            value={getValue('temp_c') || 0}
                            max={35}
                            title="TEMPERATURE"
                            subtitle={sensor.building_room || sensor.location}
                            unit="°C"
                            color={
                                getGaugeColor('temp_c', getValue('temp_c'),
                                    getValue('temp_c') > 30 ? '#f35421' :
                                        getValue('temp_c') > 25 ? '#ffcf52' :
                                            '#46bcaa'
                                )
                            }
                            darkMode={darkModeStatus}
                        />
                    </CardBody>
                </Card>

                <Card className={styles.gaugeCard}>
                    <CardBody>
                        <RadialGaugeChart
                            value={getValue('humidity') || 0}
                            max={100}
                            title="HUMIDITY"
                            subtitle="Relative Humidity"
                            unit="%"
                            color={
                                getGaugeColor('humidity', getValue('humidity'),
                                    getValue('humidity') > 70 ? '#f35421' :
                                        getValue('humidity') > 60 ? '#ffcf52' :
                                            '#4d69fa'
                                )
                            }
                            darkMode={darkModeStatus}
                        />
                    </CardBody>
                </Card>

                <Card className={styles.gaugeCard}>
                    <CardBody>
                        <RadialGaugeChart
                            value={getValue('aqi') || 0}
                            max={200}
                            title="AIR QUALITY"
                            subtitle="AQI Index"
                            unit="AQI"
                            color={
                                getGaugeColor('aqi', getValue('aqi'),
                                    getValue('aqi') > 150 ? '#f35421' :
                                        getValue('aqi') > 100 ? '#ffcf52' :
                                            '#46bcaa'
                                )
                            }
                            darkMode={darkModeStatus}
                        />
                    </CardBody>
                </Card>

                <Card className={styles.gaugeCard}>
                    <CardBody>
                        <RadialGaugeChart
                            value={getValue('co2') || 0}
                            max={3000}
                            title="CO₂ LEVEL"
                            subtitle="Carbon Dioxide"
                            unit="ppm"
                            color={
                                getGaugeColor('co2', getValue('co2'),
                                    getValue('co2') > 2000 ? '#f35421' :
                                        getValue('co2') > 1000 ? '#ffcf52' :
                                            '#46bcaa'
                                )
                            }
                            darkMode={darkModeStatus}
                        />
                    </CardBody>
                </Card>

                {/* Second Row - Environment Details */}
                {/* <Card className={styles.barChartCard}>
                    <CardHeader>
                        <CardTitle>ENVIRONMENT</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <HorizontalBarChart
                            data={environmentData}
                            darkMode={darkModeStatus}
                            height={200}
                        />
                    </CardBody>
                </Card> */}

                {/* <Card className={styles.barChartCard}>
                    <CardHeader>
                        <CardTitle>PARTICULATE MATTER</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <HorizontalBarChart
                            data={particulateData}
                            darkMode={darkModeStatus}
                            height={150}
                        />
                    </CardBody>
                </Card> */}

                <Card className={styles.barChartCard}>
                    <CardHeader>
                        <CardTitle>SOUND & SAFETY</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <HorizontalBarChart
                            data={soundSafetyData}
                            darkMode={darkModeStatus}
                            height={150}
                        />
                    </CardBody>
                </Card>

                {/* <Card className={styles.barChartCard}>
                    <CardHeader>
                        <CardTitle>AIR QUALITY INDEX</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <HorizontalBarChart
                            data={airQualityData}
                            darkMode={darkModeStatus}
                            height={250}
                        />
                    </CardBody>
                </Card> */}

                {/* Third Row - Central Health Display & Gases */}
                {/* <Card className={styles.centralGaugeCard}>
                    <CardBody>
                        <CentralLoadGauge
                            load={sensorData?.health_index || 0}
                            speed={sensorData?.motion || 0}
                            maxLoad={10}
                            maxSpeed={100}
                            status={getStatus()}
                            statusText={activeEvents && activeEvents.length > 0 ? `${activeEvents.length} Active Events` : 'Normal Operation'}
                            darkMode={darkModeStatus}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: darkModeStatus ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                marginBottom: '4px'
                            }}>
                                HEALTH INDEX
                            </div>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: darkModeStatus ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                marginTop: '8px'
                            }}>
                                MOTION LEVEL
                            </div>
                        </div>
                    </CardBody>
                </Card> */}

                {/* <Card className={styles.generatorCard}>
                    <CardHeader>
                        <CardTitle>GAS SENSORS</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <HorizontalBarChart
                            data={gasData}
                            darkMode={darkModeStatus}
                            height={250}
                        />
                    </CardBody>
                </Card> */}

                {/* Bottom Row - Health Factors */}
                {/* <Card className={styles.healthIndexCard}>
                    <CardHeader>
                        <CardTitle>HEALTH INDEX FACTORS</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <VerticalColumnChart
                            data={healthFactorsData}
                            darkMode={darkModeStatus}
                            height={220}
                        />
                        <div className="mt-3" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            fontSize: '11px',
                            color: darkModeStatus ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                        }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>PM1:</span> {sensorData?.hi_pm1 || 0}
                            </div>
                            <div>
                                <span style={{ fontWeight: 600 }}>PM2.5:</span> {sensorData?.hi_pm25 || 0}
                            </div>
                            <div>
                                <span style={{ fontWeight: 600 }}>PM10:</span> {sensorData?.hi_pm10 || 0}
                            </div>
                            <div>
                                <span style={{ fontWeight: 600 }}>CO₂:</span> {sensorData?.hi_co2 || 0}
                            </div>
                            <div>
                                <span style={{ fontWeight: 600 }}>TVOC:</span> {sensorData?.hi_tvoc || 0}
                            </div>
                            <div>
                                <span style={{ fontWeight: 600 }}>Humidity:</span> {sensorData?.hi_hum || 0}
                            </div>
                        </div>
                    </CardBody>
                </Card> */}
            </div>

            {/* Active Events Modal */}
            {activeEvents && activeEvents.length > 0 && (
                <Modal
                    isOpen={isThresholdModalOpen}
                    setIsOpen={setIsThresholdModalOpen}
                    size='lg'
                    isScrollable
                    isCentered
                >
                    <ModalHeader setIsOpen={setIsThresholdModalOpen}>
                        <ModalTitle id='active-events-modal'>
                            Active Events ({activeEvents.length})
                        </ModalTitle>
                    </ModalHeader>
                    <ModalBody>
                        <div className="alert alert-soft-warning d-flex align-items-center mb-4">
                            <Icon icon='Warning' size='lg' className='me-2' />
                            <div>
                                <strong>Sensor Alert:</strong> The following events are currently active.
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {activeEvents.map((event: string, index: number) => (
                                <div key={index} style={{
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    background: darkModeStatus ? 'rgba(255, 207, 82, 0.1)' : 'rgba(255, 207, 82, 0.15)',
                                    border: `1px solid ${darkModeStatus ? 'rgba(255, 207, 82, 0.3)' : 'rgba(255, 207, 82, 0.4)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <Icon icon='Notifications' style={{ color: '#ffcf52' }} />
                                    <span style={{
                                        fontWeight: 600,
                                        color: darkModeStatus ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                                    }}>
                                        {event.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ModalBody>
                </Modal>
            )}
        </>
    );
};

export default SensorDashboardView;