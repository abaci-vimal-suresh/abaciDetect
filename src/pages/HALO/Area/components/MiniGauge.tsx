import React, { useState, useMemo, memo, useCallback } from 'react';
import Icon from '../../../../components/icon/Icon';
import Chart from '../../../../components/extras/Chart';
import Card from '../../../../components/bootstrap/Card';
import { ApexOptions } from 'apexcharts';
import { ProcessedMetric } from '../../utils/radarMapping.utils';
import styles from './MiniGauge.module.css';

interface MiniGaugeProps {
    metric: ProcessedMetric;
    onSensorClick?: (sensorId: number) => void;
    onGaugeClick?: () => void;
    trendData?: {
        minSeries: { name: string; data: { x: number, y: number }[] };
        maxSeries: { name: string; data: { x: number, y: number }[] };
        sameSensor: boolean;
    } | null;
    timeWindow?: { from: string; to: string } | null;
}


function getStatusLabel(pct: number, isScaleMismatch: boolean, isAutoConverted: boolean): string {
    if (isScaleMismatch) return '⚠ Setup needed';
    if (isAutoConverted) return '✓ Calibrated';
    if (pct >= 90) return '⚠ Critical';
    if (pct >= 70) return '△ Warning';
    return '✓ Safe';
}

function buildRadialOptions(color: string, pct: number): ApexOptions {
    return {
        chart: { type: 'radialBar', sparkline: { enabled: true }, animations: { enabled: false } },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { size: '55%', background: 'transparent' },
                track: { background: `${color}22`, strokeWidth: '100%', margin: 0 },
                dataLabels: {
                    name: { show: false },
                    value: { offsetY: 5, fontSize: '14px', fontWeight: 800, color, formatter: () => `${pct}%` },
                },
            },
        },
        fill: {
            type: 'gradient',
            gradient: { shade: 'light', type: 'horizontal', shadeIntensity: 0.3, gradientToColors: [color], inverseColors: false, opacityFrom: 1, opacityTo: 1, stops: [0, 100] },
            colors: [color],
        },
        stroke: { lineCap: 'round' },
        tooltip: { enabled: false },
    };
}

// ─────────────────────────────────────────────────────────────
// Sub-components: split so hover state doesn't re-render charts
// ─────────────────────────────────────────────────────────────

// Front face — memo so it only re-renders when props change, NOT on flip hover
const FrontFace = memo(({ metric, trendData, timeWindow, hasSensorInfo, onFlip, onGaugeClick }: {
    metric: ProcessedMetric;
    trendData: MiniGaugeProps['trendData'];
    timeWindow: MiniGaugeProps['timeWindow'];
    hasSensorInfo: boolean;
    onFlip: () => void;
    onGaugeClick?: () => void;
}) => {
    const pct = parseFloat(metric.normalizedValue.toFixed(1));
    const color = metric.statusColor;
    const statusLabel = getStatusLabel(pct, metric.isScaleMismatch, metric.isAutoConverted);

    // Memoized so ApexCharts doesn't get new object ref on parent re-render
    const radialOptions = useMemo(() => buildRadialOptions(color, pct), [color, pct]);

    const hasData = trendData && (trendData.minSeries.data.length > 0 || trendData.maxSeries.data.length > 0);

    const { minDate, maxDate } = useMemo(() => {
        if (!timeWindow) return { minDate: undefined, maxDate: undefined };
        return {
            minDate: new Date(timeWindow.from).getTime(),
            maxDate: new Date(timeWindow.to).getTime()
        };
    }, [timeWindow]);

    // Calculate combined sparkline series and y-axis range
    const sparkSeries = useMemo(() => {
        if (!hasData || !trendData) return [];
        return [
            {
                name: 'Min',
                data: trendData.minSeries.data.map(d => [d.x, d.y]),
                color: '#10b981'
            },
            {
                name: 'Max',
                data: trendData.maxSeries.data.map(d => [d.x, d.y]),
                color: '#fb7185'
            }
        ];
    }, [trendData, hasData]);

    const sparkYRange = useMemo(() => {
        if (!hasData || !trendData) return { min: 0, max: 100 };
        const allY = [
            ...trendData.minSeries.data.map(d => d.y),
            ...trendData.maxSeries.data.map(d => d.y)
        ];
        return {
            min: Math.min(...allY) * 0.95,
            max: Math.max(...allY) * 1.05
        };
    }, [trendData, hasData]);

    const sparkOptions: ApexOptions = useMemo(() => ({
        chart: {
            type: 'area',
            sparkline: { enabled: true },
            animations: { enabled: false },
            parentHeightOffset: 0
        },
        xaxis: {
            type: 'datetime',
            min: minDate,
            max: maxDate,
        },
        colors: ['#10b981', '#fb7185'],
        stroke: { curve: 'smooth', width: 1.5 },
        fill: {
            type: 'solid',
            opacity: [0.05, 0.05],
        },
        tooltip: {
            theme: 'dark',
            shared: true,
            intersect: false,
            fixed: { enabled: false },
            x: { show: false },
            y: {
                formatter: (val: number) => `${val?.toFixed(1)}${metric.unit}`,
                title: { formatter: (name: string) => name + ': ' }
            },
            style: {
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif'
            }
        },
        yaxis: {
            min: sparkYRange.min,
            max: sparkYRange.max,
            show: false
        }
    }), [metric.unit, sparkYRange, minDate, maxDate]);

    return (
        <div className={`${styles.face} ${styles.front}`} onClick={onGaugeClick}>
            {hasSensorInfo && (
                <button className={styles.flipBtn} onClick={onFlip} title='View sensor details'>
                    <Icon icon='ArrowForward' style={{ fontSize: '1rem' }} />
                </button>
            )}

            <div className={styles.radialWrap}>
                <Chart type='radialBar' series={[pct]} options={radialOptions} height={110} width={110} />
            </div>

            <div className={styles.metricLabel}>{metric.label}</div>

            <div className={styles.metricValue} style={{ color }}>
                {metric.rawMax}
                <span className={styles.metricUnit}>{metric.unit}</span>
            </div>

            {metric.rawMin !== metric.rawMax && (
                <div className={styles.metricMin}>min: {metric.rawMin} {metric.unit}</div>
            )}

            <div className={styles.statusPill} style={{ background: `${color}22`, color }}>
                {statusLabel}
            </div>

            <div className={styles.sparklineSection}>
                {hasData && trendData ? (
                    <>
                        <div className={styles.sparklineLabels}>
                            <span className={styles.sparkMin}>
                                ↓ {Math.min(...trendData.minSeries.data.map(d => d.y)).toFixed(1)}{metric.unit}
                            </span>
                            <span className={styles.sparkWindow}>30 min range</span>
                            <span className={styles.sparkMax}>
                                ↑ {Math.max(...trendData.maxSeries.data.map(d => d.y)).toFixed(1)}{metric.unit}
                            </span>
                        </div>
                        <div className={styles.sparklineChart}>
                            <Chart
                                type='area'
                                series={sparkSeries}
                                options={sparkOptions}
                                height={48}
                                width='100%'
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.noSparklineData}>No Trend Data</div>
                )}
            </div>
        </div>
    );
});
FrontFace.displayName = 'FrontFace';

const BackFace = memo(({ metric, onFlipBack, onSensorClick }: {
    metric: ProcessedMetric;
    onFlipBack: () => void;
    onSensorClick?: (sensorId: number) => void;
}) => (
    <div className={`${styles.face} ${styles.back}`}>
        <button className={`${styles.flipBtn} ${styles.flipBtnBack}`} onClick={onFlipBack} title='Back to gauge'>
            <Icon icon='ArrowBack' style={{ fontSize: '1rem' }} />
        </button>

        <div className={styles.backHeader}>
            <div className={styles.backTitle}>{metric.label}</div>
            <div className={styles.backSubtitle}>Source Sensors</div>
        </div>

        <div className={styles.sensorRows}>
            {metric.minSensorId != null && (
                <div className={styles.sensorRow}>
                    <div className={styles.sensorRowLabel}>
                        <span>Minimum reading</span>
                        <span className={styles.sensorRowValue} style={{ color: '#34d399' }}>
                            {metric.rawMin} {metric.unit}
                        </span>
                    </div>
                    <button
                        className={`${styles.sensorBtn} ${styles.sensorBtnMin}`}
                        onClick={(e) => { e.stopPropagation(); onSensorClick?.(metric.minSensorId!); }}
                    >
                        <Icon icon='Sensors' className={styles.sensorBtnIcon} />
                        <span className={styles.sensorBtnText}>
                            {metric.minSensor?.sensor__name || `Sensor #${metric.minSensorId}`}
                        </span>
                        <span className={styles.sensorBtnArrow}>→</span>
                    </button>
                </div>
            )}

            {metric.minSensorId != null && metric.maxSensorId != null && (
                <div className={styles.rowDivider} />
            )}

            {metric.maxSensorId != null && (
                <div className={styles.sensorRow}>
                    <div className={styles.sensorRowLabel}>
                        <span>Maximum reading</span>
                        <span className={styles.sensorRowValue} style={{ color: '#f87171' }}>
                            {metric.rawMax} {metric.unit}
                        </span>
                    </div>
                    <button
                        className={`${styles.sensorBtn} ${styles.sensorBtnMax}`}
                        onClick={(e) => { e.stopPropagation(); onSensorClick?.(metric.maxSensorId!); }}
                    >
                        <Icon icon='Sensors' className={styles.sensorBtnIcon} />
                        <span className={styles.sensorBtnText}>
                            {metric.maxSensor?.sensor__name || `Sensor #${metric.maxSensorId}`}
                        </span>
                        <span className={styles.sensorBtnArrow}>→</span>
                    </button>
                </div>
            )}
        </div>

    </div>
));
BackFace.displayName = 'BackFace';

// ─────────────────────────────────────────────────────────────
// Main component — only manages flip state
// ─────────────────────────────────────────────────────────────
const MiniGauge: React.FC<MiniGaugeProps> = ({ metric, onSensorClick, onGaugeClick, trendData, timeWindow }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const hasData = trendData && (trendData.minSeries.data.length > 0 || trendData.maxSeries.data.length > 0);
    const hasSensorInfo = metric.minSensorId != null || metric.maxSensorId != null;

    // Stable callbacks — don't change reference on re-render
    const handleFlip = useCallback(() => setIsFlipped(true), []);
    const handleFlipBack = useCallback(() => setIsFlipped(false), []);

    const wrapperClass = [
        hasData ? styles.wrapper : styles.wrapperNoTrend,
        hasSensorInfo ? styles.wrapperClickable : '',
    ].join(' ');

    const cardClass = [styles.card, isFlipped ? styles.flipped : ''].join(' ');

    return (
        <div className={wrapperClass}>
            <Card isNeumorphic className={cardClass}>
                <FrontFace
                    metric={metric}
                    trendData={trendData}
                    timeWindow={timeWindow}
                    hasSensorInfo={hasSensorInfo}
                    onFlip={handleFlip}
                    onGaugeClick={onGaugeClick}
                />
                {/* Back face only mounts when there's sensor info — saves DOM nodes */}
                {hasSensorInfo && (
                    <BackFace
                        metric={metric}
                        onFlipBack={handleFlipBack}
                        onSensorClick={onSensorClick}
                    />
                )}
            </Card>
        </div>
    );
};

// Outer memo: skip re-render if metric data and trendData haven't changed
export default memo(MiniGauge, (prev, next) => {
    return (
        prev.metric === next.metric &&
        prev.trendData === next.trendData &&
        prev.onSensorClick === next.onSensorClick
    );
});
