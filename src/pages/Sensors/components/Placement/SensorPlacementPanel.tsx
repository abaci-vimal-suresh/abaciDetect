import React, { useState } from 'react';
import { PendingSensor } from '../../hooks/useSensorPlacement';
import styles from './SensorPlacementPanel.module.scss';

const SENSOR_TYPES = ['HALO_3C', 'HALO_SMART', 'HALO_IOT', 'HALO_CUSTOM'] as const;

export interface SensorFormData {
    name: string;
    sensor_type: string;
    description: string;
    mac_address: string;
    ip_address: string;
    username: string;
    password: string;
    x_val: number;
    y_val: number;
    z_val: number;
    z_max: number;
}

interface SensorPlacementPanelProps {
    pending: PendingSensor;
    onConfirm: (data: SensorFormData) => void;
    onCancel: () => void;
}

const SensorPlacementPanel: React.FC<SensorPlacementPanelProps> = ({
    pending, onConfirm, onCancel,
}) => {
    const [form, setForm] = useState<SensorFormData>({
        name: pending.name,
        sensor_type: 'HALO_3C',
        description: '',
        mac_address: '',
        ip_address: '',
        username: '',
        password: '',
        x_val: parseFloat(pending.nx.toFixed(4)),
        y_val: parseFloat(pending.ny.toFixed(4)),
        z_val: 0.85,
        z_max: 1.0,
    });

    const set = <K extends keyof SensorFormData>(key: K, value: SensorFormData[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const isValid = form.name.trim().length > 0 && form.mac_address.trim().length > 0;

    return (
        <div className={styles.panel}>

            {/* ── Banner ───────────────────────────────────────────────────────── */}
            <div className={styles.banner}>
                <span className={styles.bannerIcon}>📡</span>
                <div className={styles.bannerText}>
                    <span className={styles.bannerTitle}>Register New Sensor</span>
                    <span className={styles.bannerSub}>
                        Dropped at ({pending.nx.toFixed(3)}, {pending.ny.toFixed(3)})
                    </span>
                </div>
                <div className={styles.bannerCoords} style={{
                    background: 'rgba(var(--bs-success-rgb), 0.1)',
                    color: 'var(--bs-success)',
                    border: '1px solid rgba(var(--bs-success-rgb), 0.25)',
                }}>
                    ✓ Placed
                </div>
            </div>

            {/* ── Identity ─────────────────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Identity</div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        Sensor Name <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={styles.input}
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        placeholder="e.g. HALO-LOBBY-01"
                        autoFocus
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Sensor Type</label>
                    <select
                        className={styles.input}
                        value={form.sensor_type}
                        onChange={e => set('sensor_type', e.target.value)}
                    >
                        {SENSOR_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        Description <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                        className={styles.input}
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="e.g. Lobby entrance monitor"
                    />
                </div>
            </div>

            {/* ── Network ──────────────────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Network</div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        MAC Address <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={styles.input}
                        value={form.mac_address}
                        onChange={e => set('mac_address', e.target.value)}
                        placeholder="AA:BB:CC:DD:EE:FF"
                        maxLength={17}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        IP Address <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                        className={styles.input}
                        value={form.ip_address}
                        onChange={e => set('ip_address', e.target.value)}
                        placeholder="192.168.1.100"
                    />
                </div>

                <div className={styles.twoCol}>
                    <div className={styles.field}>
                        <label className={styles.label}>Username</label>
                        <input
                            className={styles.input}
                            value={form.username}
                            onChange={e => set('username', e.target.value)}
                            placeholder="admin"
                            autoComplete="off"
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <input
                            className={styles.input}
                            type="password"
                            value={form.password}
                            onChange={e => set('password', e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>
                </div>
            </div>

            {/* ── Position ─────────────────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    Position
                    <span className={styles.posHint}>editable</span>
                </div>

                <div className={styles.twoCol}>
                    <div className={styles.field}>
                        <label className={styles.label}>X (0–1)</label>
                        <input
                            className={styles.input}
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={form.x_val}
                            onChange={e => set('x_val', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Y (0–1)</label>
                        <input
                            className={styles.input}
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={form.y_val}
                            onChange={e => set('y_val', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className={styles.twoCol}>
                    <div className={styles.field}>
                        <label className={styles.label}>Z Height</label>
                        <input
                            className={styles.input}
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={form.z_val}
                            onChange={e => set('z_val', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Z Max</label>
                        <input
                            className={styles.input}
                            type="number"
                            step="0.1"
                            min="0"
                            value={form.z_max}
                            onChange={e => set('z_max', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Actions ───────────────────────────────────────────────────────── */}
            <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={onCancel}>
                    Cancel
                </button>
                <button
                    className={styles.confirmBtn}
                    onClick={() => onConfirm(form)}
                    disabled={!isValid}
                >
                    ✓ Register Sensor
                </button>
            </div>
        </div>
    );
};

export default SensorPlacementPanel;
