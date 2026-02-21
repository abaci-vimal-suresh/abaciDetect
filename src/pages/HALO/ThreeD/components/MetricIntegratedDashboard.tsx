import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../../components/icon/Icon';
import Button from '../../../../components/bootstrap/Button';
import Chart, { IChartOptions } from '../../../../components/extras/Chart';
import useDarkMode from '../../../../hooks/useDarkMode';
import { ProcessedMetric } from '../../utils/radarMapping.utils';

interface MetricIntegratedDashboardProps {
    group: {
        key: string;
        label: string;
        icon: string;
        metrics: ProcessedMetric[];
    };
    onClose: () => void;
}

const MetricIntegratedDashboard: React.FC<MetricIntegratedDashboardProps> = ({ group, onClose }) => {
    const { darkModeStatus } = useDarkMode();
    const navigate = useNavigate();

    const chartOptions: IChartOptions = {
        series: group.metrics.map(m => m.normalizedValue),
        options: {
            chart: {
                type: 'radialBar',
                background: 'transparent',
                toolbar: { show: false },
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        size: '30%',
                    },
                    track: {
                        background: darkModeStatus ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        strokeWidth: '100%',
                    },
                    dataLabels: {
                        name: {
                            show: true,
                            fontSize: '10px',
                            fontWeight: 600,
                            offsetY: -5,
                            color: darkModeStatus ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        },
                        value: {
                            show: true,
                            fontSize: '12px',
                            fontWeight: 700,
                            offsetY: 5,
                            color: darkModeStatus ? '#fff' : '#000',
                            formatter: (val: number) => `${val.toFixed(0)}%`
                        },
                        total: {
                            show: false
                        }
                    }
                }
            },
            colors: group.metrics.map(m => m.statusColor),
            labels: group.metrics.map(m => m.label),
            stroke: {
                lineCap: 'round'
            },
            legend: {
                show: false
            },
            theme: { mode: darkModeStatus ? 'dark' : 'light' },
            tooltip: {
                enabled: true,
                custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
                    const metric = group.metrics[seriesIndex];
                    if (!metric) return '';
                    return `
                        <div class="p-2" style="background: ${darkModeStatus ? '#1e293b' : '#fff'}; border: 1px solid ${darkModeStatus ? '#334155' : '#e2e8f0'}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                            <div style="font-weight: 700; font-size: 0.75rem; color: ${darkModeStatus ? '#cbd5e1' : '#1e293b'}; margin-bottom: 4px; text-transform: uppercase;">
                                ${metric.label}
                            </div>
                            <div style="font-weight: 800; font-size: 1rem; color: ${metric.statusColor};">
                                ${metric.normalizedValue.toFixed(0)}%
                            </div>
                            <div style="font-size: 0.65rem; color: ${darkModeStatus ? '#94a3b8' : '#64748b'};">
                                Range: ${metric.rawMin.toFixed(1)} - ${metric.rawMax.toFixed(1)} ${metric.unit}
                            </div>
                        </div>
                    `;
                }
            }
        }
    };

    return (
        <div
            className="h-100 p-0"
            style={{
                width: '100%',
                zIndex: 1100,
                pointerEvents: 'auto',
                animation: 'slide-in-right 0.4s ease-out'
            }}
        >
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .integrated-card {
                    backdrop-filter: blur(20px);
                    background: ${darkModeStatus ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)'};
                    border-left: 1px solid ${darkModeStatus ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)'};
                    box-shadow: -5px 0 20px rgba(0,0,0,0.2);
                }
            `}</style>

            <div className="integrated-card h-100 d-flex flex-column overflow-auto scrollbar-hidden">
                {/* Header */}
                <div className="p-2 border-bottom d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <div
                            className="p-1 rounded-3"
                            style={{ background: darkModeStatus ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                        >
                            <Icon icon={group.icon as any} className="text-info" size="sm" />
                        </div>
                        <div>
                            <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{group.label}</div>
                            <div className="text-muted" style={{ fontSize: '0.6rem' }}>Aggregated Insights</div>
                        </div>
                    </div>
                    <Button
                        onClick={onClose}
                        className="btn-sm p-1"
                    >
                        <Icon icon="Close" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-grow-1 overflow-auto p-2 no-scrollbar">
                    {/* Gauge Chart */}
                    <div className="mb-3 text-center">
                        <Chart
                            series={chartOptions.series}
                            options={chartOptions.options}
                            type="radialBar"
                            height={220}
                        />
                    </div>

                    {/* Metric List */}
                    <div className="small fw-bold text-uppercase text-info mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                        Sensor Extremes
                    </div>

                    <div className="d-flex flex-column gap-3">
                        {group.metrics.map(metric => (
                            <div
                                key={metric.key}
                                className="p-2 rounded-3"
                                style={{
                                    background: darkModeStatus ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${darkModeStatus ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="fw-bold" style={{ fontSize: '0.8rem' }}>{metric.label}</span>
                                    <span
                                        className="badge rounded-pill"
                                        style={{
                                            fontSize: '0.65rem',
                                            background: metric.statusColor + '20',
                                            color: metric.statusColor,
                                            border: `1px solid ${metric.statusColor}40`
                                        }}
                                    >
                                        {metric.rawMax.toFixed(1)} {metric.unit}
                                    </span>
                                </div>

                                <div className="row g-2">
                                    <div className="col-6">
                                        <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>LOWEST READ</div>
                                        {metric.minSensorId ? (
                                            <Button
                                                isLight
                                                color="info"
                                                size="sm"
                                                className="w-100 py-1"
                                                style={{ fontSize: '0.7rem' }}
                                                onClick={() => navigate(`/halo/sensors/detail/${metric.minSensorId}`)}
                                            >
                                                #{metric.minSensorId} · {metric.rawMin.toFixed(1)}
                                            </Button>
                                        ) : (
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>No data</div>
                                        )}
                                    </div>
                                    <div className="col-6">
                                        <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>HIGHEST READ</div>
                                        {metric.maxSensorId ? (
                                            <Button
                                                isLight
                                                color="danger"
                                                size="sm"
                                                className="w-100 py-1"
                                                style={{ fontSize: '0.7rem' }}
                                                onClick={() => navigate(`/halo/sensors/detail/${metric.maxSensorId}`)}
                                            >
                                                #{metric.maxSensorId} · {metric.rawMax.toFixed(1)}
                                            </Button>
                                        ) : (
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>No data</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="p-2 bg-opacity-10 bg-info border-top mt-auto">
                    <div className="d-flex gap-2">
                        <Icon icon="Info" className="text-info" size="sm" />
                        <div className="text-muted" style={{ fontSize: '0.62rem' }}>
                            Values normalized to thresholds.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetricIntegratedDashboard;
