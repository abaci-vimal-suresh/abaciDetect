import React, { useMemo } from 'react';
import Card, { CardBody, CardHeader, CardLabel, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import Chart from '../../../../components/extras/Chart';
import { useAreas, useAggregatedSensorData } from '../../../../api/sensors.api';
import { buildProcessedMetrics, ProcessedMetric } from '../../utils/radarMapping.utils';
import { ApexOptions } from 'apexcharts';

// ── Legend colours mirrored from radarMapping.utils ──────────────────────────
const LEGEND = [
    { label: 'Safe', color: '#10b981' },
    { label: 'Warning', color: '#f59e0b' },
    { label: 'Critical', color: '#ef4444' },
];

interface MetricSnapshotChartProps {
    onRefresh?: () => void;
}

const MetricSnapshotChart: React.FC<MetricSnapshotChartProps> = ({ onRefresh }) => {
    // ── 1. Fetch all area IDs ─────────────────────────────────────────────────
    const { data: areas } = useAreas();
    const allAreaIds = useMemo(() => areas?.map(a => a.id) || [], [areas]);

    // ── 2. Fetch aggregated data across ALL areas ─────────────────────────────
    const { data: aggregatedResponse, isLoading, refetch } = useAggregatedSensorData({
        area_id: allAreaIds,
    });

    // ── 3. Flatten aggData (same as AreaZoneView) ─────────────────────────────
    const aggData = useMemo(
        () => aggregatedResponse?.aggregated_data || {},
        [aggregatedResponse],
    );

    // ── 4. Build processed metrics via radarMapping utils ─────────────────────
    //    No area-level config here (global overview) so we pass {} which means
    //    hasThreshold = false → normalizeMetric uses rawMax * 2 as the ceiling.
    //    Colors and status labels still work proportionally.
    const metrics: ProcessedMetric[] = useMemo(
        () => buildProcessedMetrics(aggData, {}),
        [aggData],
    );

    // ── 5. Sort by normalizedValue desc (highest concern first) ───────────────
    const sortedMetrics = useMemo(
        () => [...metrics].sort((a, b) => b.normalizedValue - a.normalizedValue),
        [metrics],
    );

    // ── 6. ApexCharts series + options ────────────────────────────────────────
    const series = useMemo<ApexOptions['series']>(
        () => [{ name: 'Level', data: sortedMetrics.map(m => m.normalizedValue) }],
        [sortedMetrics],
    );

    const options = useMemo<ApexOptions>(() => ({
        chart: {
            type: 'bar',
            toolbar: { show: false },
            animations: { enabled: true, speed: 700, easing: 'easeinout' },
            background: 'transparent',
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                distributed: true,
                barHeight: '52%',
                dataLabels: { position: 'center' },
            },
        },
        colors: sortedMetrics.map(m => m.statusColor),
        dataLabels: {
            enabled: true,
            formatter: (_val: number, opts: any) => {
                const m = sortedMetrics[opts.dataPointIndex];
                if (!m) return '';
                // Only show inside-bar label when bar is wide enough
                return m.normalizedValue > 12 ? `${m.rawMax} ${m.unit}` : '';
            },
            style: {
                fontSize: '11px',
                fontWeight: 600,
                colors: ['rgba(255,255,255,0.92)'],
            },
            dropShadow: { enabled: false },
        },
        xaxis: {
            categories: sortedMetrics.map(m => m.label),
            min: 0,
            max: 100,
            labels: {
                formatter: (val: string) => `${val}%`,
                style: { fontSize: '10px', colors: '#a0aec0' },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { fontSize: '12px', fontWeight: 500, colors: ['#718096'] },
                maxWidth: 95,
            },
        },
        grid: {
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
            borderColor: 'rgba(0,0,0,0.06)',
            padding: { left: 0, right: 28, top: 0, bottom: 0 },
        },
        legend: { show: false },
        tooltip: {
            theme: 'light',
            custom: ({ dataPointIndex }: any) => {
                const m = sortedMetrics[dataPointIndex];
                if (!m) return '';
                const statusLabel = m.isScaleMismatch
                    ? '⚠ Setup needed'
                    : m.isAutoConverted
                        ? '✓ Calibrated (auto-converted)'
                        : m.normalizedValue >= 90 ? '⚠ Critical'
                            : m.normalizedValue >= 70 ? '△ Warning'
                                : '✓ Safe';
                return `
                    <div style="
                        padding: 12px 16px;
                        font-size: 12px;
                        line-height: 1.9;
                        font-family: inherit;
                        border-left: 3px solid ${m.statusColor};
                        background: #fff;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.10);
                        border-radius: 6px;
                        min-width: 170px;
                    ">
                        <div style="font-weight:700;margin-bottom:4px;font-size:13px;color:#2d3748">${m.label}</div>
                        <div style="color:#4a5568">Max: <b style="color:#2d3748">${m.rawMax} ${m.unit}</b></div>
                        <div style="color:#4a5568">Min: <b style="color:#2d3748">${m.rawMin} ${m.unit}</b></div>
                        <div style="
                            margin-top:8px;
                            padding-top:8px;
                            border-top:1px solid #e2e8f0;
                            color:${m.statusColor};
                            font-weight:700;
                            font-size:11px;
                            letter-spacing:0.02em;
                        ">${statusLabel} · ${m.normalizedValue.toFixed(1)}%</div>
                    </div>`;
            },
        },
        states: {
            hover: { filter: { type: 'darken', value: 0.08 } },
        },
    }), [sortedMetrics]);

    const handleRefresh = () => {
        refetch();
        onRefresh?.();
    };

    // ── 7. Render ──────────────────────────────────────────────────────────────
    return (
        <Card stretch className='shadow-sm'>
            <CardHeader borderSize={1}>
                <CardLabel icon='BarChart'>
                    <CardTitle>Live Environmental Snapshot</CardTitle>
                </CardLabel>
                <CardActions>
                    <div className='d-flex align-items-center gap-3 me-3'>
                        {LEGEND.map(l => (
                            <div key={l.label} className='d-flex align-items-center gap-1'>
                                <div style={{
                                    width: 9, height: 9,
                                    borderRadius: '50%',
                                    background: l.color,
                                    flexShrink: 0,
                                    opacity: 0.85,
                                }} />
                                <span className='small' style={{ color: '#718096' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                    <Button color='info' isLight size='sm' icon='Refresh' onClick={handleRefresh}>
                        Refresh
                    </Button>
                </CardActions>
            </CardHeader>

            <CardBody>
                {isLoading || allAreaIds.length === 0 ? (
                    <div className='d-flex flex-column align-items-center justify-content-center py-5 gap-3'>
                        {isLoading ? (
                            <>
                                <Spinner color='primary' size='2rem' />
                                <span style={{ color: '#a0aec0' }} className='small'>Loading sensor data…</span>
                            </>
                        ) : (
                            <>
                                <Icon icon='BarChart' size='3x' className='text-muted' />
                                <span style={{ color: '#a0aec0' }} className='small'>No areas configured yet.</span>
                            </>
                        )}
                    </div>
                ) : sortedMetrics.length === 0 ? (
                    <div className='d-flex flex-column align-items-center justify-content-center py-5 gap-2'>
                        <Icon icon='SignalWifiOff' size='3x' className='text-muted' />
                        <span style={{ color: '#a0aec0' }} className='small'>No sensor readings available right now.</span>
                    </div>
                ) : (
                    <>
                        <Chart
                            type='bar'
                            series={series}
                            options={options}
                            height={Math.max(240, sortedMetrics.length * 48)}
                        />

                        {/* Summary pill strip */}
                        <div
                            className='d-flex flex-wrap gap-2 mt-2 pt-3'
                            style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
                        >
                            {sortedMetrics.map(m => (
                                <div
                                    key={m.key}
                                    className='d-flex align-items-center gap-1 rounded-pill px-2 py-1'
                                    style={{
                                        background: `${m.statusColor}14`,
                                        border: `1px solid ${m.statusColor}38`,
                                        fontSize: '0.68rem',
                                        fontWeight: 600,
                                        color: m.statusColor,
                                        whiteSpace: 'nowrap',
                                        opacity: 0.9,
                                    }}
                                >
                                    <span>{m.label}:</span>
                                    <span>{m.rawMax}{m.unit ? ` ${m.unit}` : ''}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default MetricSnapshotChart;