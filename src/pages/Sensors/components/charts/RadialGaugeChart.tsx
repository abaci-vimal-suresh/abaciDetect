import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface RadialGaugeChartProps {
    value: number;
    max?: number;
    title: string;
    subtitle?: string;
    unit?: string;
    color?: string;
    size?: number;
    darkMode?: boolean;
}

const RadialGaugeChart: React.FC<RadialGaugeChartProps> = ({
    value,
    max = 100,
    title,
    subtitle,
    unit = '',
    color = '#4d69fa',
    size = 180,
    darkMode = false
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const percentage = Math.min((value / max) * 100, 100);

    const options: ApexOptions = {
        chart: {
            type: 'radialBar',
            sparkline: {
                enabled: true
            },
            background: 'transparent'
        },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                track: {
                    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    strokeWidth: '100%',
                    margin: 5,
                },
                hollow: {
                    size: '60%',
                    background: 'transparent',
                },
                dataLabels: {
                    name: {
                        show: false
                    },
                    value: {
                        offsetY: 0,
                        fontSize: '32px',
                        fontWeight: 700,
                        color: darkMode ? '#fff' : '#323232',
                        formatter: function (val) {
                            return value.toFixed(1);
                        }
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: [color],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        stroke: {
            lineCap: 'round'
        },
        colors: [color],
        labels: ['']
    };

    const series = [percentage];

    if (!mounted) return null;

    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: size, height: size }}>
                <Chart
                    options={options}
                    series={series}
                    type="radialBar"
                    height={size}
                    width={size}
                />
            </div>
            <div className="text-center mt-2">
                <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {title}
                </div>
                {subtitle && (
                    <div style={{
                        fontSize: '9px',
                        color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                        marginTop: '2px'
                    }}>
                        {subtitle}
                    </div>
                )}
                {unit && (
                    <div style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                        marginTop: '4px'
                    }}>
                        {unit}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RadialGaugeChart;