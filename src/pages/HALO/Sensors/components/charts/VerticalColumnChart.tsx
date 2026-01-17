import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ColumnData {
    label: string;
    value: number;
    secondaryValue?: number;
    color?: string;
}

interface VerticalColumnChartProps {
    data: ColumnData[];
    title?: string;
    subtitle?: string;
    darkMode?: boolean;
    height?: number;
    showSecondary?: boolean;
}

const VerticalColumnChart: React.FC<VerticalColumnChartProps> = ({
    data,
    title,
    subtitle,
    darkMode = false,
    height = 250,
    showSecondary = false
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const categories = data.map(item => item.label);
    const primaryValues = data.map(item => item.value);
    const secondaryValues = data.map(item => item.secondaryValue || 0);

    const series = showSecondary ? [
        {
            name: 'Primary',
            data: primaryValues
        },
        {
            name: 'Secondary',
            data: secondaryValues
        }
    ] : [
        {
            name: 'Value',
            data: primaryValues
        }
    ];

    const options: ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: {
                show: false
            },
            background: 'transparent'
        },
        plotOptions: {
            bar: {
                columnWidth: '65%',
                distributed: !showSecondary,
                borderRadius: 4,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: showSecondary
            ? ['#4d69fa', '#46bcaa']
            : data.map(item => item.color || '#4d69fa'),
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    colors: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    fontSize: '11px',
                    fontWeight: 600
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    fontSize: '11px'
                }
            }
        },
        grid: {
            show: true,
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            strokeDashArray: 3,
            position: 'back',
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        },
        legend: {
            show: showSecondary,
            position: 'top',
            horizontalAlign: 'right',
            labels: {
                colors: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
            },
            markers: {
                radius: 2
            }
        },
        tooltip: {
            theme: darkMode ? 'dark' : 'light',
            y: {
                formatter: function (val) {
                    return val.toFixed(1);
                }
            }
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {(title || subtitle) && (
                <div style={{ marginBottom: '12px' }}>
                    {title && (
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {title}
                        </div>
                    )}
                    {subtitle && (
                        <div style={{
                            fontSize: '11px',
                            color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                            marginTop: '2px'
                        }}>
                            {subtitle}
                        </div>
                    )}
                </div>
            )}
            <Chart
                options={options}
                series={series}
                type="bar"
                height={height}
            />
        </div>
    );
};

export default VerticalColumnChart;