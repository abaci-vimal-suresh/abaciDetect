import React, { useState, useEffect, useRef } from 'react';
import { SensorNode } from '../Types/types';
import { HALO_EVENTS } from '../Dummy/dummyData';
import styles from './MockAlertPanel.module.scss';

// ── Alert payload — mirrors real WebSocket message shape ──────────────────────
export interface HaloAlertPayload {
    id: number;
    title: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    sensor_name: string;
    sensor_id?: number;
    event_source: string;
    current_value: number;
    threshold_value: number;
    intensity: number;
    area_name: string;
    created_time: string;
}

interface MockAlertPanelProps {
    sensors: SensorNode[];
    onFire: (alert: HaloAlertPayload) => void;
    onClose: () => void;
}

const MockAlertPanel: React.FC<MockAlertPanelProps> = ({
    sensors, onFire, onClose,
}) => {
    const [selectedEvent, setSelectedEvent] = useState<string>('Motion');
    const [selectedSensorId, setSelectedSensorId] = useState<number>(sensors[0]?.id ?? 1);
    const [intensity, setIntensity] = useState<number>(1.5);
    const [threshold, setThreshold] = useState<number>(200);
    const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('CRITICAL');
    const [autoFire, setAutoFire] = useState<boolean>(false);
    const [logs, setLogs] = useState<{ msg: string; time: string }[]>([]);

    const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Cleanup
    useEffect(() => () => {
        if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
        timeoutsRef.current.forEach(t => clearTimeout(t));
    }, []);

    // Auto-fire
    useEffect(() => {
        if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
        if (autoFire) {
            autoIntervalRef.current = setInterval(() => handleFire(), 3000);
        }
    }, [autoFire, selectedEvent, selectedSensorId, intensity, threshold, severity]);

    const buildPayload = (
        eventId: string,
        sensorId: number,
    ): HaloAlertPayload => {
        const sensor = sensors.find(s => s.id === sensorId) ?? sensors[0];
        const mockValue = threshold * intensity;
        return {
            id: Date.now(),
            title: `${eventId} Detection`,
            severity,
            sensor_name: sensor.name,
            sensor_id: sensor.id,
            event_source: eventId,
            current_value: mockValue,
            threshold_value: threshold,
            intensity,
            area_name: 'Demo Area',
            created_time: new Date().toISOString(),
        };
    };

    const handleFire = (overrideEvent?: string, overrideSensorId?: number) => {
        const eventId = overrideEvent ?? selectedEvent;
        const sensorId = overrideSensorId ?? selectedSensorId;
        const payload = buildPayload(eventId, sensorId);
        onFire(payload);

        const sensor = sensors.find(s => s.id === sensorId);
        const ts = new Date().toLocaleTimeString([], { hour12: false });
        setLogs(prev => [{
            msg: `→ ${eventId} @ ${intensity.toFixed(1)}x [${sensor?.name ?? '?'}]`,
            time: ts,
        }, ...prev].slice(0, 6));
    };

    const handleFireAll = () => {
        HALO_EVENTS.forEach((ev, i) => {
            const t = setTimeout(
                () => handleFire(ev, selectedSensorId),
                i * 220,
            );
            timeoutsRef.current.push(t);
        });
    };

    const severityColors = {
        INFO: '#3b82f6',
        WARNING: '#f59e0b',
        CRITICAL: '#ef4444',
    };

    return (
        <div className={styles.panel}>
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.headerTitle}>🐛 Alert Simulator</span>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <div className={styles.body}>

                {/* Event */}
                <div className={styles.field}>
                    <label className={styles.label}>Event Source</label>
                    <select
                        className={styles.select}
                        value={selectedEvent}
                        onChange={e => setSelectedEvent(e.target.value)}
                    >
                        {HALO_EVENTS.map(ev => (
                            <option key={ev} value={ev}>{ev}</option>
                        ))}
                    </select>
                </div>

                {/* Sensor */}
                <div className={styles.field}>
                    <label className={styles.label}>Target Sensor</label>
                    <select
                        className={styles.select}
                        value={selectedSensorId}
                        onChange={e => setSelectedSensorId(Number(e.target.value))}
                    >
                        {sensors.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                                {s.sensor_status === 'offline' ? ' (offline)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Intensity */}
                <div className={styles.field}>
                    <div className={styles.labelRow}>
                        <label className={styles.label}>Intensity</label>
                        <span className={styles.value}>{intensity.toFixed(1)}×</span>
                    </div>
                    <input
                        type="range"
                        className={styles.slider}
                        min={1} max={5} step={0.1}
                        value={intensity}
                        onChange={e => setIntensity(parseFloat(e.target.value))}
                    />
                </div>

                {/* Threshold + computed value */}
                <div className={styles.twoCol}>
                    <div className={styles.field}>
                        <label className={styles.label}>Threshold</label>
                        <input
                            type="number"
                            className={styles.numInput}
                            value={threshold}
                            onChange={e => setThreshold(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Value</label>
                        <div className={styles.computedValue}>
                            {(threshold * intensity).toFixed(0)}
                        </div>
                    </div>
                </div>

                {/* Severity */}
                <div className={styles.field}>
                    <label className={styles.label}>Severity</label>
                    <div className={styles.severityRow}>
                        {(['INFO', 'WARNING', 'CRITICAL'] as const).map(s => (
                            <button
                                key={s}
                                className={`${styles.severityBtn}
                                    ${severity === s ? styles.severityActive : ''}`}
                                style={{
                                    borderColor: severity === s
                                        ? severityColors[s] : 'transparent',
                                    color: severity === s
                                        ? severityColors[s] : '#8b949e',
                                    background: severity === s
                                        ? `${severityColors[s]}18` : 'transparent',
                                }}
                                onClick={() => setSeverity(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={styles.fireBtn}
                        onClick={() => handleFire()}
                    >
                        ⚡ FIRE ALERT
                    </button>

                    <button
                        className={styles.fireAllBtn}
                        onClick={handleFireAll}
                    >
                        🔥 Fire All Events
                    </button>

                    <label className={styles.autoLabel}>
                        <input
                            type="checkbox"
                            checked={autoFire}
                            onChange={e => setAutoFire(e.target.checked)}
                            className={styles.checkbox}
                        />
                        Auto-fire every 3s
                    </label>
                </div>

                {/* Log */}
                <div className={styles.logBox}>
                    {logs.length === 0 ? (
                        <span className={styles.logEmpty}>
                            Waiting for events…
                        </span>
                    ) : (
                        logs.map((log, i) => (
                            <div
                                key={i}
                                className={styles.logRow}
                                style={{ opacity: Math.max(0.25, 1 - i * 0.18) }}
                            >
                                <span>{log.msg}</span>
                                <span className={styles.logTime}>{log.time}</span>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default MockAlertPanel;