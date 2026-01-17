import React from 'react';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

export interface IChartOptions {
    type?: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick' | 'boxPlot' | 'radar' | 'polarArea' | 'rangeBar' | 'rangeArea' | 'treemap';
    series: any[];
    options: ApexOptions;
    height?: number | string;
    width?: number | string;
    className?: string;
}

const Chart: React.FC<IChartOptions> = ({ type = 'line', series, options, height = 'auto', width = '100%', className }) => {
    return (
        <div className={className}>
            <ApexChart
                options={options}
                series={series}
                type={type}
                height={height}
                width={width}
            />
        </div>
    );
};

export default Chart;
