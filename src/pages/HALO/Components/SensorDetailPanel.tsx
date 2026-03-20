import React, { useState } from 'react';
import { SensorNode, HaloEventConfig, SensorLatestLog } from '../Types/types';
import styles from './SensorDetailPanel.module.scss';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LED_TO_HEX = (dec: number): string =>
    `#${dec.toString(16).padStart(6, '0')}`;

const STATUS_COLORS = {
    online: 'var(--bs-success)',
    offline: 'var(--bs-secondary-color, var(--bs-gray-500))',
    alert: 'var(--bs-danger)',
};

const STATUS_BG = {
    online: 'rgba(var(--bs-success-rgb), 0.1)',
    offline: 'var(--bs-tertiary-bg)',
    alert: 'rgba(var(--bs-danger-rgb), 0.1)',
};

// ── Event row ─────────────────────────────────────────────────────────────────

const EventRow: React.FC<{ config: HaloEventConfig }> = ({ config }) => {
    const isTriggered = config.is_triggered;
    const hasValue = config.current_value !== null;
    const pct = hasValue && config.max_value > 0
        ? Math.min(100, ((config.current_value! - config.min_value) /
            (config.max_value - config.min_value)) * 100)
        : 0;
    const ledHex = LED_TO_HEX(config.led_color);
    const barColor = isTriggered ? 'var(--bs-danger)' : 'var(--bs-success)';

    return (
        <div className={`${styles.eventRow} ${isTriggered ? styles.triggered : ''}`}>
            <div className={styles.eventLeft}>
                {/* LED color dot */}
                <span
                    className={styles.ledDot}
                    style={{ background: ledHex, boxShadow: `0 0 6px ${ledHex}` }}
                />
                <span className={styles.eventName}>{config.event_id}</span>
                {isTriggered && (
                    <span className={styles.triggeredBadge}>ALERT</span>
                )}
            </div>

            <div className={styles.eventRight}>
                {hasValue ? (
                    <>
                        <span
                            className={styles.eventValue}
                            style={{
                                color: isTriggered
                                    ? 'var(--bs-danger)' : 'var(--bs-body-color)'
                            }}
                        >
                            {config.current_value!.toFixed(
                                config.current_value! < 10 ? 1 : 0
                            )}
                        </span>
                        <span className={styles.eventThreshold}>
                            / {config.threshold}
                        </span>
                    </>
                ) : (
                    <span className={styles.noData}>—</span>
                )}
            </div>

            {/* Progress bar */}
            <div className={styles.eventBar}>
                <div
                    className={styles.eventBarFill}
                    style={{
                        width: `${pct}%`,
                        background: barColor,
                    }}
                />
                {/* Threshold marker */}
                <div
                    className={styles.thresholdMarker}
                    style={{
                        left: `${Math.min(100, ((config.threshold - config.min_value) /
                            (config.max_value - config.min_value)) * 100)}%`,
                    }}
                />
            </div>
        </div>
    );
};

// ── Log metric ────────────────────────────────────────────────────────────────

const Metric: React.FC<{
    label: string;
    value: number | null | undefined;
    unit: string;
    warn?: boolean;
}> = ({ label, value, unit, warn }) => (
    <div className={styles.metric}>
        <span className={styles.metricLabel}>{label}</span>
        <span
            className={styles.metricValue}
            style={{ color: warn ? 'var(--bs-warning)' : undefined }}
        >
            {value !== null && value !== undefined
                ? `${typeof value === 'number'
                    ? value.toFixed(value < 10 ? 1 : 0)
                    : value} ${unit}`
                : '—'}
        </span>
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────

interface SensorDetailPanelProps {
    sensor: SensorNode;
    latestLog?: SensorLatestLog | null;
    onClose?: () => void;
}

const SensorDetailPanel: React.FC<SensorDetailPanelProps> = ({ sensor, latestLog, onClose }) => {
    const [configsExpanded, setConfigsExpanded] = useState(false);

    const triggered = sensor.event_configs.filter(e => e.is_triggered);
    const important = sensor.event_configs.filter(e =>
        !e.is_triggered &&
        ['Motion', 'temp_c', 'Humidity', 'CO2cal', 'AQI', 'Sound'].includes(e.event_id)
    );
    const rest = sensor.event_configs.filter(e =>
        !e.is_triggered &&
        !['Motion', 'temp_c', 'Humidity', 'CO2cal', 'AQI', 'Sound'].includes(e.event_id)
    );

    const log = latestLog ?? sensor.latest_log;
    const statusColor = STATUS_COLORS[sensor.sensor_status];
    const statusBg = STATUS_BG[sensor.sensor_status];

    return (
        <div className={styles.panel}>

            {/* ── Sensor identity ──────────────────────────────────────────── */}
            <div className={styles.identity}>
                <div className={styles.identityLeft}>
                    <div
                        className={styles.sensorIcon}
                        style={{
                            background: statusBg,
                            borderColor: statusColor,
                        }}
                    >
                        📡
                    </div>
                    <div className={styles.identityInfo}>
                        <span className={styles.sensorName}>{sensor.name}</span>
                        <span className={styles.sensorMac}>{sensor.mac_address}</span>
                        {sensor.ip_address && (
                            <span className={styles.sensorIp}>{sensor.ip_address}</span>
                        )}
                    </div>
                </div>
                <div
                    className={styles.statusPill}
                    style={{
                        color: statusColor,
                        background: statusBg,
                        borderColor: `${statusColor}44`,
                    }}
                >
                    <span
                        className={`${styles.statusDot}
                            ${sensor.sensor_status === 'alert' ? styles.pulseDot : ''}`}
                        style={{ background: statusColor }}
                    />
                    {sensor.sensor_status.toUpperCase()}
                </div>
            </div>

            {/* ── Position ─────────────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Position</div>
                <div className={styles.posGrid}>
                    <div className={styles.posItem}>
                        <span className={styles.posLabel}>X</span>
                        <span className={styles.posVal}>
                            {sensor.x_val.toFixed(3)}
                        </span>
                    </div>
                    <div className={styles.posItem}>
                        <span className={styles.posLabel}>Y</span>
                        <span className={styles.posVal}>
                            {sensor.y_val.toFixed(3)}
                        </span>
                    </div>
                    <div className={styles.posItem}>
                        <span className={styles.posLabel}>Z</span>
                        <span className={styles.posVal}>
                            {sensor.z_val.toFixed(3)}
                        </span>
                    </div>
                    <div className={styles.posItem}>
                        <span className={styles.posLabel}>Radius</span>
                        <span className={styles.posVal}>
                            {sensor.halo_radius}m
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Triggered events — always visible ────────────────────────── */}
            {triggered.length > 0 && (
                <div className={styles.section}>
                    <div className={`${styles.sectionTitle} ${styles.alertTitle}`}>
                        ⚠ Active Alerts ({triggered.length})
                    </div>
                    <div className={styles.eventList}>
                        {triggered.map(cfg => (
                            <EventRow key={cfg.id} config={cfg} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Key metrics — always visible ─────────────────────────────── */}
            {important.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Key Metrics</div>
                    <div className={styles.eventList}>
                        {important.map(cfg => (
                            <EventRow key={cfg.id} config={cfg} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Latest log readings ───────────────────────────────────────── */}
            {log && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        Live Readings
                        <span className={styles.syncTime}>
                            {new Date(log.recorded_at).toLocaleTimeString([], {
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </span>
                    </div>

                    <div className={styles.logGroup}>
                        <div className={styles.logGroupTitle}>Environmental</div>
                        <div className={styles.metricGrid}>
                            <Metric label="Temp"
                                value={log.readings_environmental.temperature_c}
                                unit="°C"
                                warn={(log.readings_environmental.temperature_c ?? 0) > 30}
                            />
                            <Metric label="Humidity"
                                value={log.readings_environmental.humidity_percent}
                                unit="%"
                            />
                            <Metric label="Light"
                                value={log.readings_environmental.light_lux}
                                unit="lux"
                            />
                            <Metric label="Pressure"
                                value={log.readings_environmental.pressure_hpa}
                                unit="hPa"
                            />
                        </div>
                    </div>

                    <div className={styles.logGroup}>
                        <div className={styles.logGroupTitle}>Air Quality</div>
                        <div className={styles.metricGrid}>
                            <Metric label="CO₂"
                                value={log.readings_air.co2_cal}
                                unit="ppm"
                                warn={(log.readings_air.co2_cal ?? 0) > 900}
                            />
                            <Metric label="TVOC"
                                value={log.readings_air.tvoc}
                                unit="ppb"
                            />
                            <Metric label="PM2.5"
                                value={log.readings_air.pm25}
                                unit="µg"
                            />
                            <Metric label="NO₂"
                                value={log.readings_air.no2}
                                unit="ppb"
                            />
                        </div>
                    </div>

                    <div className={styles.logGroup}>
                        <div className={styles.logGroupTitle}>Derived</div>
                        <div className={styles.metricGrid}>
                            <Metric label="AQI"
                                value={log.readings_derived.aqi}
                                unit=""
                                warn={(log.readings_derived.aqi ?? 0) > 100}
                            />
                            <Metric label="Health"
                                value={log.readings_derived.health_index}
                                unit="/5"
                            />
                            <Metric label="Motion"
                                value={log.readings_derived.motion}
                                unit="%"
                            />
                            <Metric label="Noise"
                                value={log.readings_derived.noise_db}
                                unit="dB"
                            />
                        </div>
                    </div>
                </div>
            )}

            {!log && (
                <div className={styles.noLog}>
                    <span>📭</span>
                    <span>No readings available</span>
                    {sensor.online_status === false && (
                        <span className={styles.offlineNote}>
                            Sensor is offline
                        </span>
                    )}
                </div>
            )}

            {/* ── All configs — collapsed accordion ────────────────────────── */}
            {rest.length > 0 && (
                <div className={styles.section}>
                    <button
                        className={styles.accordionToggle}
                        onClick={() => setConfigsExpanded(e => !e)}
                    >
                        <span>All Configurations ({rest.length})</span>
                        <span className={`${styles.accordionChevron}
                            ${configsExpanded ? styles.open : ''}`}>
                            ▾
                        </span>
                    </button>

                    {configsExpanded && (
                        <div className={styles.eventList}>
                            {rest.map(cfg => (
                                <EventRow key={cfg.id} config={cfg} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SensorDetailPanel;