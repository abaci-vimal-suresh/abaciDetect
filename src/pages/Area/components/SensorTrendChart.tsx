import React, { FC, useMemo } from 'react';
import Chart from '../../../components/extras/Chart';
import { ApexOptions } from 'apexcharts';
import { SensorDataResponse } from '../../../types/sensor';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';

interface ISensorTrendChartProps {
    minSeries?: { name: string; data: { x: number, y: number }[] };
    maxSeries?: { name: string; data: { x: number, y: number }[] };
    sameSensor?: boolean;
    metricLabel: string;
    unit?: string;
    isLoading: boolean;
    timeWindow?: { from: string; to: string };
    sensorsCount?: number;
}


const SensorTrendChart: FC<ISensorTrendChartProps> = ({
    minSeries,
    maxSeries,
    sameSensor,
    metricLabel,
    unit = '',
    isLoading,
    timeWindow,
    sensorsCount
}) => {

    // 1. Build exactly 2 series for ApexCharts
    const series = useMemo(() => {
        if (!minSeries || !maxSeries) return [];

        return [
            {
                name: sameSensor
                    ? `Min/Max — ${minSeries.name} (only one sensor reporting)`
                    : `Min — ${minSeries.name}`,
                data: minSeries.data,
                color: '#10b981', // emerald
            },
            {
                name: sameSensor
                    ? `Min/Max — ${maxSeries.name} (only one sensor reporting)`
                    : `Max — ${maxSeries.name}`,
                data: maxSeries.data,
                color: '#fb7185', // rose
            }
        ];
    }, [minSeries, maxSeries, sameSensor]);

    // 2. Build Chart Options
    const options: ApexOptions = useMemo(() => ({
        chart: {
            type: 'area' as const,
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 500 },
            },
            fontFamily: 'inherit',
        },
        colors: ['#10b981', '#761f2cff'], // Explicitly tied to Min and Max
        fill: {
            type: 'solid',
            opacity: [0.05, 0.05]
        },
        stroke: {
            curve: 'smooth',
            width: 2.5,
        },
        markers: {
            size: 0,
            hover: { size: 5, sizeOffset: 2 },
        },
        xaxis: {
            type: 'datetime',
            labels: {
                datetimeUTC: false,
                format: 'HH:mm',
                style: { colors: 'rgba(255,255,255,0.45)', fontSize: '11px' },
                rotate: 0,
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            title: {
                text: 'Time',
                offsetY: 4,
                style: { color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 400 },
            },
            crosshairs: {
                show: true,
                stroke: { color: 'rgba(255,255,255,0.2)', width: 1, dashArray: 3 },
            },
        },
        yaxis: {
            labels: {
                style: { colors: 'rgba(255,255,255,0.45)', fontSize: '11px' },
                formatter: (val) => `${val.toFixed(1)}${unit ? ' ' + unit : ''}`,
            },
            title: {
                text: `${metricLabel}${unit ? ` (${unit})` : ''}`,
                rotate: -90,
                style: { color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 400 },
            },
            forceNiceScale: true,
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.07)',
            strokeDashArray: 4,
            padding: { left: 4, right: 4, bottom: 10 },
        },
        tooltip: {
            theme: 'dark',
            shared: true,
            intersect: false,
            x: { format: 'HH:mm' },
            y: {
                formatter: (val) => val != null ? `${val.toFixed(2)}${unit ? ' ' + unit : ''}` : '—',
            },
            style: { fontSize: '12px' },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
            floating: false,
            labels: { colors: 'rgba(255,255,255,0.7)' },
            markers: { width: 10, height: 10, radius: 10 },
            itemMargin: { horizontal: 10, vertical: 5 },
            fontSize: '12px',
        },
        dataLabels: { enabled: false },
    }), [unit, metricLabel]);

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div
                className='d-flex flex-column justify-content-center align-items-center gap-2'
                style={{ minHeight: 400 }}
            >
                <Spinner color='info' size={32 as any} />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    Loading {metricLabel} trends…
                </span>
            </div>
        );
    }

    // ── Empty ──────────────────────────────────────────────────────────────────
    if (!minSeries || !maxSeries || minSeries.data.length === 0) {
        return (
            <div
                className='d-flex flex-column justify-content-center align-items-center gap-2 text-muted'
                style={{ minHeight: 400 }}
            >
                <Icon icon='BarChart' style={{ fontSize: '2.5rem', opacity: 0.3 }} />
                <p className='mb-0' style={{ fontSize: '0.85rem', opacity: 0.5 }}>
                    No historical data available for <strong>{metricLabel}</strong>.
                </p>
            </div>
        );
    }

    // ── Pre-calculate stats for pills ──
    const getStats = (s: { name: string, data: { x: number, y: number }[] }) => {
        const vals = s.data.map(d => d.y);
        const latest = vals[vals.length - 1];
        const prev = vals.length > 1 ? vals[vals.length - 2] : latest;
        return {
            name: s.name,
            latest,
            min: Math.min(...vals),
            max: Math.max(...vals),
            avg: vals.reduce((a, b) => a + b, 0) / vals.length,
            trend: latest > prev ? 'up' : latest < prev ? 'down' : 'flat'
        };
    };

    const minStats = getStats(minSeries);
    const maxStats = getStats(maxSeries);

    const displayStats = [
        { label: 'Min', data: minStats, color: '#10b981' },
        { label: 'Max', data: maxStats, color: '#fb7185' }
    ];

    return (
        <div className='sensor-trend-chart'>

            {/* ── Stat Pills ── */}
            <div className='row g-2 mb-4'>
                {displayStats.map((s, i) => (
                    <div key={i} className='col-md-6'>
                        <div
                            className='rounded-3 p-3'
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${s.color}22`,
                                borderLeft: `4px solid ${s.color}`,
                            }}
                        >
                            <div className='d-flex justify-content-between align-items-center mb-2'>
                                <span className='fw-bold' style={{ color: s.color, fontSize: '0.85rem' }}>
                                    {s.label} — {s.data.name}
                                </span>
                                <span className='badge' style={{ background: `${s.color}15`, color: s.color }}>
                                    {s.data.latest.toFixed(1)}{unit}
                                    <span className='ms-1' style={{ fontSize: '0.65rem' }}>
                                        {s.data.trend === 'up' ? '▲' : s.data.trend === 'down' ? '▼' : '—'}
                                    </span>
                                </span>
                            </div>
                            <div className='d-flex justify-content-between' style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                                <span><span style={{ opacity: 0.6 }}>min:</span> <span className='text-light fw-semibold'>{s.data.min.toFixed(1)}{unit}</span></span>
                                <span><span style={{ opacity: 0.6 }}>max:</span> <span className='text-light fw-semibold'>{s.data.max.toFixed(1)}{unit}</span></span>
                                <span><span style={{ opacity: 0.6 }}>avg:</span> <span className='text-light fw-semibold'>{s.data.avg.toFixed(1)}{unit}</span></span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── ApexCharts Line Chart ── */}
            <Chart
                options={options}
                series={series as any}
                type='area'
                height={320}
            />

            {/* ── Time window label ── */}
            {timeWindow && (
                <div
                    className='text-center mt-3'
                    style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}
                >
                    {new Date(timeWindow.from).toLocaleString()} → {new Date(timeWindow.to).toLocaleString()}
                    {sensorsCount !== undefined && (
                        <>&nbsp;·&nbsp;{sensorsCount} sensor{sensorsCount !== 1 ? 's' : ''} in area</>
                    )}
                </div>
            )}
        </div>
    );
};

export default SensorTrendChart;
