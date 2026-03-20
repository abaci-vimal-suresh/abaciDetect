import React, { useState } from 'react';
import { PendingSensor } from '../Hooks/useSensorPlacement';
import { HALO_EVENTS } from '../Dummy/dummyData';
import styles from './SensorPlacementPanel.module.scss';

// Default events pre-selected for new sensors
const DEFAULT_SELECTED = ['Motion', 'temp_c', 'Humidity', 'CO2cal', 'AQI'];

interface SensorPlacementPanelProps {
    pending: PendingSensor;
    onConfirm: (name: string, mac: string, events: string[]) => void;
    onCancel: () => void;
}

const SensorPlacementPanel: React.FC<SensorPlacementPanelProps> = ({
    pending, onConfirm, onCancel,
}) => {
    const [name, setName] = useState(pending.name);
    const [mac, setMac] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>(DEFAULT_SELECTED);
    const [showAllEvents, setShowAllEvents] = useState(false);

    const toggleEvent = (ev: string) => {
        setSelectedEvents(prev =>
            prev.includes(ev)
                ? prev.filter(e => e !== ev)
                : [...prev, ev]
        );
    };

    const visibleEvents = showAllEvents
        ? HALO_EVENTS
        : HALO_EVENTS.slice(0, 12);

    return (
        <div className={styles.panel}>

            {/* ── Placement confirmed banner ────────────────────────────────── */}
            <div className={styles.banner}>
                <span className={styles.bannerIcon}>📍</span>
                <div className={styles.bannerText}>
                    <span className={styles.bannerTitle}>Sensor Placed</span>
                    <span className={styles.bannerSub}>
                        {pending.nx.toFixed(3)}, {pending.ny.toFixed(3)}
                    </span>
                </div>
                <div
                    className={styles.bannerCoords}
                    style={{
                        background: 'rgba(var(--bs-success-rgb), 0.1)',
                        color: 'var(--bs-success)',
                        border: '1px solid rgba(var(--bs-success-rgb), 0.25)'
                    }}
                >
                    ✓ On floor
                </div>
            </div>

            {/* ── Name ─────────────────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Identity</div>

                <div className={styles.field}>
                    <label className={styles.label}>Sensor Name</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. HALO-LOBBY-01"
                        autoFocus
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        MAC Address
                        <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        value={mac}
                        onChange={e => setMac(e.target.value)}
                        placeholder="AA:BB:CC:DD:EE:FF"
                        maxLength={17}
                    />
                </div>
            </div>

            {/* ── Event selection ───────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    Monitor Events
                    <span className={styles.eventCount}>
                        {selectedEvents.length} selected
                    </span>
                </div>

                <div className={styles.eventGrid}>
                    {(visibleEvents as readonly string[]).map(ev => {
                        const active = selectedEvents.includes(ev);
                        return (
                            <button
                                key={ev}
                                className={`${styles.eventChip}
                                    ${active ? styles.eventChipActive : ''}`}
                                onClick={() => toggleEvent(ev)}
                            >
                                {ev}
                            </button>
                        );
                    })}
                </div>

                <button
                    className={styles.showMoreBtn}
                    onClick={() => setShowAllEvents(s => !s)}
                >
                    {showAllEvents
                        ? '▲ Show less'
                        : `▼ Show all ${HALO_EVENTS.length} events`}
                </button>
            </div>

            {/* ── Actions ───────────────────────────────────────────────────── */}
            <div className={styles.actions}>
                <button
                    className={styles.cancelBtn}
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    className={styles.confirmBtn}
                    onClick={() => onConfirm(name, mac, selectedEvents)}
                    disabled={!name.trim() || selectedEvents.length === 0}
                >
                    ✓ Place Sensor
                </button>
            </div>
        </div>
    );
};

export default SensorPlacementPanel;