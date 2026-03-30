import React, { useMemo, useState } from 'react';
import { SensorNode } from '../../Types/types';
import styles from './HaloMetricDock.module.scss';
import { useAggregatedSensorData, useAreas } from '../../../../api/sensors.api';
import { METRIC_GROUPS } from '../../../utils/sensorUtils';
import { METRIC_MAP, getEffectiveConfig, normalizeMetric } from '../../../utils/radarMapping.utils';

interface HaloMetricDockProps {
    areaId: number | null;
    sensors: SensorNode[];
    onSensorFocus: (sensorId: number) => void;
    onGroupSelect?: (groupKey: string) => void;
    activeGroupKey?: string | null;
}

// ── Crisp SVG icons ───────────────────────────────────────────────────────────

const IconEnv: React.FC<{ c: string }> = ({ c }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.8" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);
const IconParticles: React.FC<{ c: string }> = ({ c }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="2.2" fill={c} opacity="0.9" />
        <circle cx="12" cy="6" r="1.6" fill={c} opacity="0.65" />
        <circle cx="19" cy="10" r="2.6" fill={c} opacity="0.45" />
        <circle cx="9" cy="18" r="1.1" fill={c} opacity="0.8" />
        <circle cx="16" cy="17" r="1.6" fill={c} opacity="0.55" />
    </svg>
);
const IconAir: React.FC<{ c: string }> = ({ c }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M3 8c0-2.2 1.8-4 4-4s4 1.8 4 4H3z" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M3 12h13M3 16h9" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M19 12c1.1 0 2 .9 2 2s-.9 2-2 2h-3" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);
const IconAqi: React.FC<{ c: string }> = ({ c }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6l-8-4z"
            stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconMotion: React.FC<{ c: string }> = ({ c }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="4.5" r="1.8" fill={c} />
        <path d="M12 7v5l2.5 2.5M9.5 9.5L7 12l2.5 2M14.5 9.5L17 12l-2.5 2"
            stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 14.5V19" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);
const IconSound: React.FC<{ c: string }> = ({ c }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M11 5L6 9H2v6h4l5 4V5z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M15.5 8.5c1.2 1.2 1.9 2.8 1.9 4.5s-.7 3.3-1.9 4.5"
            stroke={c} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M19 6c2 2 3.2 4.7 3.2 7s-1.2 5-3.2 7"
            stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
);

const ICON_MAP: Record<string, React.FC<{ c: string }>> = {
    environment: IconEnv,
    particles: IconParticles,
    air: IconAir,
    aqi: IconAqi,
    motion: IconMotion,
    sound: IconSound,
};

// ── Component ─────────────────────────────────────────────────────────────────

const HaloMetricDock: React.FC<HaloMetricDockProps> = ({
    areaId, sensors, onSensorFocus, onGroupSelect, activeGroupKey,
}) => {
    const [collapsed, setCollapsed] = useState(false);

    const { data: aggData, isLoading } = useAggregatedSensorData({
        area_id: areaId ? [areaId] : [],
    });
    const agg = aggData?.aggregated_data ?? {};

    const { data: areas } = useAreas();
    const currentArea = useMemo(
        () => areas?.find(a => a.id === areaId),
        [areas, areaId],
    );
    const configData = useMemo(
        () => getEffectiveConfig(currentArea, areas),
        [currentArea, areas],
    );

    const enrichedGroups = useMemo(() => METRIC_GROUPS.map(group => {
        const minVal = agg[`${group.representative}_min`];
        const maxVal = agg[`${group.representative}_max`];
        const hasData =
            minVal != null && !isNaN(Number(minVal)) &&
            maxVal != null && !isNaN(Number(maxVal));

        const maxNum = hasData ? Number(maxVal) : 0;

        // Use dynamic threshold from area config_data if available
        const metricMapping = METRIC_MAP[group.representative];
        const threshold = metricMapping ? configData[metricMapping.config] : undefined;
        const normalized = threshold
            ? normalizeMetric(maxNum, threshold.min, threshold.max)
            : null;

        const healthLevel: 'good' | 'warn' | 'critical' =
            normalized !== null
                ? normalized >= 90 ? 'critical' : normalized >= 70 ? 'warn' : 'good'
                : 'good'; // no config → default to good (no false alarms)

        return {
            ...group,
            hasData,
            minVal: hasData ? Number(minVal).toFixed(1) : null,
            maxVal: hasData ? Number(maxVal).toFixed(1) : null,
            healthLevel,
        };
    }), [agg, configData]);

    if (!areaId || isLoading) return null;

    const accentMap = {
        good: 'var(--bs-success)',
        warn: 'var(--bs-warning)',
        critical: 'var(--bs-danger)',
    };

    const hasCritical = enrichedGroups.some(g => g.healthLevel === 'critical');
    const hasWarn = enrichedGroups.some(g => g.healthLevel === 'warn');

    return (
        <div className={`${styles.root} ${collapsed ? styles.rootCollapsed : ''}`}>

            {/* ── Collapse toggle ───────────────────────────────────────── */}
            <div className={styles.handleRow}>
                <button
                    className={styles.handle}
                    onClick={() => setCollapsed(c => !c)}
                >
                    <div className={styles.handleInner}>

                        {/* Status dots — one per non-good group */}
                        <div className={styles.statusDots}>
                            {enrichedGroups
                                .filter(g => g.healthLevel !== 'good' && g.hasData)
                                .map(g => (
                                    <span
                                        key={g.key}
                                        className={`${styles.dot} ${g.healthLevel === 'critical' ? styles.dotCrit : styles.dotWarn}`}
                                        title={`${g.label}: ${g.healthLevel}`}
                                    />
                                ))
                            }
                            {!hasCritical && !hasWarn && (
                                <span className={`${styles.dot} ${styles.dotGood}`} />
                            )}
                        </div>

                        <span className={styles.handleLabel}>
                            Floor Analytics
                        </span>

                        {/* Chevron */}
                        <svg
                            width="11" height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            className={`${styles.chevron} ${collapsed ? styles.chevronDown : styles.chevronUp}`}
                        >
                            <path
                                d="M6 15l6-6 6 6"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </button>
            </div>

            {/* ── Bar ───────────────────────────────────────────────────── */}
            <div className={styles.bar}>
                {enrichedGroups.map((group, i) => {
                    const isActive = activeGroupKey === group.key;
                    const Icon = ICON_MAP[group.key] ?? IconEnv;
                    const accent = isActive
                        ? 'var(--bs-primary)'
                        : group.hasData ? accentMap[group.healthLevel] : 'var(--bs-secondary-color)';

                    return (
                        <React.Fragment key={group.key}>
                            {i > 0 && <div className={styles.sep} />}

                            <button
                                className={`${styles.seg}
                                    ${isActive ? styles.segActive : ''}
                                    ${group.healthLevel === 'critical' ? styles.segCritical : ''}
                                    ${group.healthLevel === 'warn' ? styles.segWarn : ''}`}
                                onClick={() => onGroupSelect?.(group.key)}
                                style={{ '--a': accent } as React.CSSProperties}
                            >
                                {/* Top line */}
                                <div className={styles.segLine} style={{ background: accent }} />

                                {/* Icon + title */}
                                <div className={styles.segTop}>
                                    <span className={styles.segIcon}>
                                        <Icon c={accent} />
                                    </span>
                                    <span className={styles.segTitle}>{group.label}</span>
                                    {group.healthLevel !== 'good' && (
                                        <span
                                            className={styles.segAlert}
                                            style={{ background: accent }}
                                        />
                                    )}
                                </div>

                                {/* Metric name */}
                                <div className={styles.segMetricName}>
                                    {group.repLabel}
                                    {group.repUnit && (
                                        <span className={styles.segMetricUnit}>
                                            {' '}{group.repUnit}
                                        </span>
                                    )}
                                </div>

                                {/* Values */}
                                {group.hasData ? (
                                    <div className={styles.segVals}>
                                        <div className={styles.segValRow}>
                                            <span className={styles.segValTag}>MIN</span>
                                            <span className={styles.segValNum}>{group.minVal}</span>
                                        </div>
                                        <div className={styles.segValRow}>
                                            <span className={styles.segValTag}>MAX</span>
                                            <span
                                                className={styles.segValNum}
                                                style={{ color: accent }}
                                            >
                                                {group.maxVal}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.segEmpty}>No data</div>
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default HaloMetricDock;