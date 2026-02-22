import React, { useMemo } from 'react';
import Card, { CardBody, CardHeader, CardLabel, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import Chart from '../../../../components/extras/Chart';
import { useAreas, useAggregatedSensorData } from '../../../../api/sensors.api';
import { ApexOptions } from 'apexcharts';

const METRIC_CONFIG: Record<string, { label: string; unit: string; safeMax: number }> = {
    temperature: { label: 'Temperature', unit: '°C', safeMax: 45 },
    humidity: { label: 'Humidity', unit: '%', safeMax: 100 },
    co2: { label: 'CO₂', unit: 'ppm', safeMax: 2000 },
    tvoc: { label: 'TVOC', unit: 'ppb', safeMax: 1000 },
    pm25: { label: 'PM2.5', unit: 'µg/m³', safeMax: 75 },
    pm10: { label: 'PM10', unit: 'µg/m³', safeMax: 150 },
    noise: { label: 'Noise', unit: 'dB', safeMax: 85 },
    aqi: { label: 'AQI', unit: '', safeMax: 300 },
    co: { label: 'CO', unit: 'ppm', safeMax: 50 },
    light: { label: 'Light', unit: 'lux', safeMax: 10000 },
};

const COLOR = {
    safe: '#5a9e8f',
    moderate: '#c49a3c',
    critical: '#b85c4a',
};

const getStatusColor = (pct: number): string => {
    if (pct >= 80) return COLOR.critical;
    if (pct >= 50) return COLOR.moderate;
    return COLOR.safe;
};

interface MetricBar {
    key: string;
    label: string;
    unit: string;
    avg: number;
    min: number;
    max: number;
    pct: number;
    color: string;
}

const MOCK_AGG_DATA: Record<string, { min: number; max: number; avg: number }> = {
    temperature: { min: 22.1, max: 31.4, avg: 26.5 },
    humidity: { min: 38.0, max: 72.0, avg: 54.3 },
    co2: { min: 410, max: 1340, avg: 820 },
    tvoc: { min: 50, max: 480, avg: 210 },
    pm25: { min: 5.2, max: 42.1, avg: 18.7 },
    pm10: { min: 8.0, max: 88.0, avg: 35.4 },
    noise: { min: 32, max: 74, avg: 51 },
    aqi: { min: 28, max: 134, avg: 72 },
    co: { min: 0.3, max: 8.1, avg: 3.2 },
};

const USE_MOCK = true; // flip to false when real API is ready

interface MetricSnapshotChartProps {
    onRefresh?: () => void;
}

const MetricSnapshotChart: React.FC<MetricSnapshotChartProps> = ({ onRefresh }) => {
    const { data: areas } = useAreas();
    const allAreaIds = useMemo(() => areas?.map(a => a.id) || [], [areas]);

    const { data: aggregatedResponse, isLoading, refetch } = useAggregatedSensorData({
        area_id: allAreaIds,
    });

    const aggData = useMemo(() => {
        if (USE_MOCK) return MOCK_AGG_DATA;
        return aggregatedResponse?.aggregated_data || {};
    }, [aggregatedResponse]);

    const metrics: MetricBar[] = useMemo(() => {
        return Object.entries(METRIC_CONFIG)
            .map(([key, cfg]) => {
                const raw = aggData[key];
                if (!raw) return null;
                const avg = raw.avg ?? raw.max ?? 0;
                const pct = parseFloat(Math.min((avg / cfg.safeMax) * 100, 100).toFixed(1));
                return {
                    key,
                    label: cfg.label,
                    unit: cfg.unit,
                    avg: parseFloat(avg.toFixed(2)),
                    min: raw.min ?? 0,
                    max: raw.max ?? 0,
                    pct,
                    color: getStatusColor(pct),
                };
            })
            .filter((m): m is MetricBar => m !== null)
            .sort((a, b) => b.pct - a.pct);
    }, [aggData]);

    const series = useMemo<ApexOptions['series']>(
        () => [{ name: 'Threshold Usage', data: metrics.map(m => m.pct) }],
        [metrics],
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
        colors: metrics.map(m => m.color),
        dataLabels: {
            enabled: true,
            formatter: (_val: number, opts: any) => {
                const m = metrics[opts.dataPointIndex];
                if (!m) return '';
                return m.pct > 12 ? `${m.avg}${m.unit ? ' ' + m.unit : ''}` : '';
            },
            style: {
                fontSize: '11px',
                fontWeight: 600,
                // Slightly off-white so it's readable but not glaring
                colors: ['rgba(255,255,255,0.92)'],
            },
            dropShadow: { enabled: false },
        },
        xaxis: {
            categories: metrics.map(m => m.label),
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
                const m = metrics[dataPointIndex];
                if (!m) return '';
                return `
                    <div style="
                        padding: 12px 16px;
                        font-size: 12px;
                        line-height: 1.9;
                        font-family: inherit;
                        border-left: 3px solid ${m.color};
                        background: #fff;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.10);
                        border-radius: 6px;
                        min-width: 160px;
                    ">
                        <div style="font-weight:700;margin-bottom:4px;font-size:13px;color:#2d3748">${m.label}</div>
                        <div style="color:#4a5568">Avg: <b style="color:#2d3748">${m.avg} ${m.unit}</b></div>
                        <div style="color:#4a5568">Min: <b style="color:#2d3748">${m.min} ${m.unit}</b></div>
                        <div style="color:#4a5568">Max: <b style="color:#2d3748">${m.max} ${m.unit}</b></div>
                        <div style="
                            margin-top:8px;
                            padding-top:8px;
                            border-top:1px solid #e2e8f0;
                            color:${m.color};
                            font-weight:700;
                            font-size:11px;
                            letter-spacing:0.02em;
                        ">${m.pct}% of safe threshold</div>
                    </div>`;
            },
        },
        states: {
            hover: { filter: { type: 'darken', value: 0.08 } },
        },
    }), [metrics]);

    const handleRefresh = () => {
        refetch();
        onRefresh?.();
    };

    const legendItems = [
        { label: 'Safe', color: COLOR.safe },
        { label: 'Moderate', color: COLOR.moderate },
        { label: 'Critical', color: COLOR.critical },
    ];

    return (
        <Card stretch className='shadow-sm'>
            <CardHeader borderSize={1}>
                <CardLabel icon='BarChart'>
                    <CardTitle>Live Environmental Snapshot</CardTitle>
                </CardLabel>
                <CardActions>
                    <div className='d-flex align-items-center gap-3 me-3'>
                        {legendItems.map(l => (
                            <div key={l.label} className='d-flex align-items-center gap-1'>
                                <div style={{
                                    width: 9,
                                    height: 9,
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
                {!USE_MOCK && (isLoading || allAreaIds.length === 0) ? (
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
                ) : metrics.length === 0 ? (
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
                            height={Math.max(240, metrics.length * 48)}
                        />

                        {/* Summary pill strip */}
                        <div
                            className='d-flex flex-wrap gap-2 mt-2 pt-3'
                            style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
                        >
                            {metrics.map(m => (
                                <div
                                    key={m.key}
                                    className='d-flex align-items-center gap-1 rounded-pill px-2 py-1'
                                    style={{
                                        background: `${m.color}14`,
                                        border: `1px solid ${m.color}38`,
                                        fontSize: '0.68rem',
                                        fontWeight: 600,
                                        color: m.color,
                                        whiteSpace: 'nowrap',
                                        opacity: 0.9,
                                    }}
                                >
                                    <span>{m.label}:</span>
                                    <span>{m.avg}{m.unit ? ` ${m.unit}` : ''}</span>
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