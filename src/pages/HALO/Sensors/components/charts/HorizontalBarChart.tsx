import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface MetricBarData {
    label: string;
    value: number;
    unit?: string;
    color?: string;
}

interface HorizontalBarChartProps {
    data: MetricBarData[];
    title?: string;
    darkMode?: boolean;
    height?: number;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
    data,
    title,
    darkMode = false,
    height = 300
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const categories = data.map(item => item.label);
    const values = data.map(item => item.value);
    const colors = data.map(item => item.color || '#4d69fa');

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
                horizontal: true,
                distributed: true,
                barHeight: '75%',
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: colors,
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            offsetX: 10,
            style: {
                fontSize: '13px',
                fontWeight: 600,
                colors: [darkMode ? '#fff' : '#323232']
            },
            formatter: function (val, opt) {
                const item = data[opt.dataPointIndex];
                return `${val} ${item.unit || ''}`;
            }
        },
        stroke: {
            width: 0
        },
        xaxis: {
            categories: categories,
            labels: {
                show: false
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
                    colors: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    fontSize: '12px',
                    fontWeight: 500
                }
            }
        },
        grid: {
            show: false
        },
        legend: {
            show: false
        },
        tooltip: {
            theme: darkMode ? 'dark' : 'light',
            y: {
                formatter: function (val, opt) {
                    const item = data[opt.dataPointIndex];
                    return `${val} ${item.unit || ''}`;
                }
            }
        }
    };

    const series = [{
        name: title || 'Value',
        data: values
    }];

    if (!mounted) return null;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {title && (
                <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {title}
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

export default HorizontalBarChart;