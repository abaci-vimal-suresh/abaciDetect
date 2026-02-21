import React from 'react';
import Icon from '../../../../components/icon/Icon';
import Chart from '../../../../components/extras/Chart';
import Card from '../../../../components/bootstrap/Card';
import { ProcessedMetric } from '../../utils/radarMapping.utils';

const MiniGauge: React.FC<{
    metric: ProcessedMetric;
    onSensorClick?: (sensorId: number) => void;
}> = ({ metric, onSensorClick }) => {
    const [hovered, setHovered] = React.useState(false);
    const pct = parseFloat(metric.normalizedValue.toFixed(1));
    const color = metric.statusColor;

    const statusLabel = metric.isScaleMismatch
        ? '⚠ Setup needed'
        : metric.isAutoConverted
            ? '✓ Calibrated'
            : pct >= 90 ? '⚠ Critical'
                : pct >= 70 ? '△ Warning'
                    : '✓ Safe';

    const options: any = {
        chart: {
            type: 'radialBar',
            sparkline: { enabled: true },
            animations: { enabled: true, speed: 800, easing: 'easeinout' },
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { size: '55%', background: 'transparent' },
                track: {
                    background: `${color}22`,
                    strokeWidth: '100%',
                    margin: 0,
                },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 5,
                        fontSize: '14px',
                        fontWeight: 800,
                        color: color,
                        formatter: () => `${pct}%`,
                    },
                },
            },
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.3,
                gradientToColors: [color],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100],
            },
            colors: [color],
        },
        stroke: { lineCap: 'round' },
        tooltip: { enabled: false },
    };

    const hasSensorInfo = metric.minSensorId != null || metric.maxSensorId != null;
    const shouldFlip = hasSensorInfo && hovered;

    const faceBase: React.CSSProperties = {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 12,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 10px',
    };

    return (
        <div
            style={{
                perspective: '1200px',
                cursor: hasSensorInfo ? 'pointer' : 'default',
                height: '100%',
                minHeight: 200,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Card
                isNeumorphic
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)',
                    transformStyle: 'preserve-3d',
                    transform: shouldFlip ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    background: hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                }}
            >
                {/* ════ FRONT FACE ════ */}
                <div
                    style={{
                        ...faceBase,
                        background: 'rgba(255, 255, 255, 0.05)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ width: 110, height: 85 }}>
                        <Chart
                            type='radialBar'
                            series={[pct]}
                            options={options}
                            height={110}
                            width={110}
                        />
                    </div>

                    <div className='fw-bold' style={{ fontSize: '1rem', color: '#000', lineHeight: 1.2, marginBottom: 4 }}>
                        {metric.label}
                    </div>

                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color, lineHeight: 1 }}>
                        {metric.rawMax}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginLeft: 2 }}>
                            {metric.unit}
                        </span>
                    </div>

                    {metric.rawMin !== metric.rawMax && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#4b5563', marginTop: 2 }}>
                            min: {metric.rawMin} {metric.unit}
                        </div>
                    )}

                    <div
                        className='rounded-pill mt-2 px-3 py-1'
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            background: `${color}22`,
                            color,
                            letterSpacing: '0.04em',
                        }}
                    >
                        {statusLabel}
                    </div>

                    {hasSensorInfo && (
                        <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: 6, fontStyle: 'italic' }}>
                            <Icon icon="Info" size="sm" className="me-1" />
                            hover for sensors
                        </div>
                    )}
                </div>

                {/* ════ BACK FACE ════ */}
                <div
                    style={{
                        ...faceBase,
                        transform: 'rotateY(180deg)',
                        gap: 14,
                        padding: '20px 16px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '1rem', fontWeight: 900, marginBottom: 2 }}>
                        {metric.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Source Sensors
                    </div>

                    {metric.minSensorId != null && (
                        <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600, marginBottom: 5 }}>
                                Min: <span style={{ color: '#238e6cff', fontWeight: 900 }}>{metric.rawMin} {metric.unit}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onSensorClick?.(metric.minSensorId!); }}
                                className="btn-neumorphic w-100 d-flex align-items-center justify-content-center gap-2"
                                style={{
                                    border: '2px solid #059669',
                                    color: '#1b3930ff',
                                    padding: '10px 0',
                                }}
                            >
                                <Icon icon="Sensors" className="fs-5" />
                                Sensor #{metric.minSensorId}
                            </button>
                        </div>
                    )}

                    {metric.maxSensorId != null && (
                        <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600, marginBottom: 5 }}>
                                Max: <span style={{ color: '#ac4747ff', fontWeight: 900 }}>{metric.rawMax} {metric.unit}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onSensorClick?.(metric.maxSensorId!); }}
                                className="btn-neumorphic w-100 d-flex align-items-center justify-content-center gap-2"
                                style={{
                                    border: '2px solid #9c3131ff',
                                    color: '#843c3cff',
                                    padding: '10px 0',
                                }}
                            >
                                <Icon icon="Sensors" className="fs-5" />
                                Sensor #{metric.maxSensorId}
                            </button>
                        </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700, marginTop: 4 }}>
                        {/* Click to view details */}
                    </div>
                </div>
            </Card>
        </div >
    );
};

export default MiniGauge;