import React, { useMemo } from 'react';
import styles from './AggregatedDetailPanel.module.scss';
import { METRIC_GROUPS } from '../../../utils/sensorUtils';
import { METRIC_MAP, ConfigData, normalizeMetric, getStatusColor } from '../../../utils/radarMapping.utils';

const Sparkline: React.FC<{ min: number; max: number; color?: string }> = ({
    min, max, color = 'currentColor',
}) => {
    const points = useMemo(() => {
        const seed = min + max;
        const rand = (n: number) => {
            const x = Math.sin(n + seed) * 10000;
            return x - Math.floor(x);
        };
        return Array.from({ length: 7 }, (_, i) => {
            const rawY = min + rand(i * 3.7) * (max - min);
            return rawY;
        });
    }, [min, max]);

    const vals = points;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const range = hi - lo || 1;

    const toY = (v: number) => 18 - ((v - lo) / range) * 14;
    const toX = (i: number) => (i / (vals.length - 1)) * 100;

    const d = vals
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
        .join(' ');

    // Area fill
    const area = `${d} L${toX(vals.length - 1)},20 L0,20 Z`;

    return (
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={styles.sparklineSvg}>
            <defs>
                <linearGradient id={`sg-${min}-${max}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#sg-${min}-${max})`} />
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

// ── Arc gauge ─────────────────────────────────────────────────────────────────
const ArcGauge: React.FC<{
    label: string;
    value: number;   // 0-100
    color: string;
    size?: number;
}> = ({ label, value, color, size = 64 }) => {
    const r = 24;
    const cx = 32;
    const cy = 32;
    const circumference = Math.PI * r; // half circle
    const progress = Math.min(Math.max(value, 0), 100);
    const dashOffset = circumference - (progress / 100) * circumference;

    return (
        <div className={styles.arcGauge} style={{ width: size, flexShrink: 0 }}>
            <svg viewBox="0 0 64 40" style={{ overflow: 'visible' }}>
                {/* Track */}
                <path
                    d={`M8,32 A24,24 0 0,1 56,32`}
                    fill="none"
                    stroke="var(--bs-border-color)"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                {/* Fill */}
                <path
                    d={`M8,32 A24,24 0 0,1 56,32`}
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${dashOffset}`}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                />
                {/* Value text */}
                <text
                    x="32"
                    y="36"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill={color}
                    fontFamily="Poppins, sans-serif"
                >
                    {progress.toFixed(0)}%
                </text>
            </svg>
            <div className={styles.arcLabel}>{label}</div>
        </div>
    );
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ value: number; threshold: number }> = ({ value, threshold }) => {
    const pct = (value / threshold) * 100;
    const status =
        pct > 120 ? { label: 'CRITICAL', cls: styles.badgeCritical } :
            pct > 80 ? { label: 'WARNING', cls: styles.badgeWarning } :
                { label: 'NORMAL', cls: styles.badgeNormal };

    return <span className={`${styles.statusBadge} ${status.cls}`}>{status.label}</span>;
};

// ── Main panel ────────────────────────────────────────────────────────────────

export interface AggregatedDetailPanelProps {
    groupKey: string;
    agg: Record<string, any>;
    onSensorFocus: (id: number) => void;
    configData?: ConfigData;
}

const AggregatedDetailPanel: React.FC<AggregatedDetailPanelProps> = ({
    groupKey, agg, onSensorFocus, configData = {},
}) => {
    const group = METRIC_GROUPS.find(g => g.key === groupKey);
    if (!group) return null;

    const metricRows = useMemo(() => {
        return group.metrics.map(metricKey => {
            const minRaw = agg[`${metricKey}_min`];
            const maxRaw = agg[`${metricKey}_max`];
            const minVal = (minRaw !== null && minRaw !== undefined && !isNaN(Number(minRaw)))
                ? Number(minRaw) : null;
            const maxVal = (maxRaw !== null && maxRaw !== undefined && !isNaN(Number(maxRaw)))
                ? Number(maxRaw) : null;

            if (minVal === null && maxVal === null) return null;

            const minRef = agg[`${metricKey}_min_sensor`] as any;
            const maxRef = agg[`${metricKey}_max_sensor`] as any;

            const maxNum = maxVal ?? 0;
            const mapping = METRIC_MAP[metricKey];
            const thresholdEntry = mapping ? configData[mapping.config] : undefined;
            const pct = thresholdEntry
                ? Math.min(100, Math.max(0, normalizeMetric(maxNum, thresholdEntry.min, thresholdEntry.max)))
                : Math.min(100, (maxNum / 100) * 100); // fallback: treat 100 as max

            const color = getStatusColor(
                thresholdEntry ? normalizeMetric(maxNum, thresholdEntry.min, thresholdEntry.max) : pct,
            );

            return {
                key: metricKey,
                label: metricKey.toUpperCase().replace('_', ' '),
                minVal: minVal !== null ? minVal.toFixed(1) : '—',
                maxVal: maxVal !== null ? maxVal.toFixed(1) : '—',
                minNum: minVal ?? 0,
                maxNum,
                pct,
                color,
                threshold: thresholdEntry?.max ?? 100,
                minSensorId: minRef?.sensor_id ?? null,
                minSensorName: minRef?.sensor__name ?? null,
                maxSensorId: maxRef?.sensor_id ?? null,
                maxSensorName: maxRef?.sensor__name ?? null,
            };
        }).filter(Boolean);
    }, [group, agg]);

    return (
        <div className={styles.panel}>

            {/* ── Mini gauge row ────────────────────────────────────────── */}
            {metricRows.length > 0 && (
                <div className={styles.gaugeRow}>
                    {metricRows.slice(0, 4).map(row => row && (
                        <ArcGauge
                            key={row.key}
                            label={row.label}
                            value={row.pct}
                            color={row.color}
                            size={58}
                        />
                    ))}
                </div>
            )}

            {/* ── Metric cards ──────────────────────────────────────────── */}
            <div className={styles.metricList}>
                {metricRows.map(row => row && (
                    <div
                        key={row.key}
                        className={styles.metricCard}
                        style={{ '--row-color': row.color } as React.CSSProperties}
                    >
                        {/* Left color strip */}
                        <div
                            className={styles.metricStrip}
                            style={{ background: row.color }}
                        />

                        <div className={styles.metricCardInner}>
                            {/* Header row */}
                            <div className={styles.metricHead}>
                                <div className={styles.metricHeadLeft}>
                                    <span className={styles.metricLabel}>{row.label}</span>
                                    <StatusBadge value={row.maxNum} threshold={row.threshold} />
                                </div>
                                <div className={styles.sparklineWrap}>
                                    <Sparkline
                                        min={row.minNum}
                                        max={row.maxNum}
                                        color={row.color}
                                    />
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className={styles.progressTrack}>
                                <div
                                    className={styles.progressFill}
                                    style={{
                                        width: `${row.pct}%`,
                                        background: row.color,
                                    }}
                                />
                                {/* Threshold marker at 80% */}
                                <div className={styles.thresholdTick} style={{ left: '80%' }} />
                            </div>

                            {/* Values row */}
                            <div className={styles.extremesRow}>
                                {/* MIN */}
                                <div className={styles.extreme}>
                                    <span className={styles.extremeTag}>LOW</span>
                                    <div className={styles.extremeBig} style={{ color: 'var(--bs-success)' }}>
                                        {row.minVal}
                                    </div>
                                    {row.minSensorId && (
                                        <button
                                            className={styles.sensorPill}
                                            onClick={() => onSensorFocus(row.minSensorId)}
                                            title={`Focus ${row.minSensorName}`}
                                        >
                                            <span className={styles.sensorPillDot}
                                                style={{ background: 'var(--bs-success)' }} />
                                            {row.minSensorName ?? `#${row.minSensorId}`}
                                        </button>
                                    )}
                                </div>

                                {/* Vertical divider */}
                                <div className={styles.extremeDivider} />

                                {/* MAX */}
                                <div className={styles.extreme}>
                                    <span className={styles.extremeTag}>HIGH</span>
                                    <div className={styles.extremeBig} style={{ color: row.color }}>
                                        {row.maxVal}
                                    </div>
                                    {row.maxSensorId && (
                                        <button
                                            className={`${styles.sensorPill} ${styles.sensorPillHigh}`}
                                            onClick={() => onSensorFocus(row.maxSensorId)}
                                            title={`Focus ${row.maxSensorName}`}
                                            style={{
                                                '--pill-color': row.color,
                                                color: row.color,
                                                borderColor: `${row.color}44`,
                                                background: `${row.color}12`,
                                            } as React.CSSProperties}
                                        >
                                            <span
                                                className={styles.sensorPillDot}
                                                style={{ background: row.color }}
                                            />
                                            {row.maxSensorName ?? `#${row.maxSensorId}`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className={styles.footer}>
                <span className={styles.footerIcon}>ℹ</span>
                Floor-level aggregated extremes — click a sensor to focus in 3D
            </div>
        </div>
    );
};

export default AggregatedDetailPanel;