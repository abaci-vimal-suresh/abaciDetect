import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import UnderConstructionPage from '../../../components/extras/UnderConstructionPage';

const Reports = () => {
    const [dateRange, setDateRange] = useState('7d');

    // Mock Chart Data
    const series = [
        {
            name: 'Vape Events',
            data: [4, 3, 10, 9, 29, 19, 22]
        },
        {
            name: 'Poor AQI Incidents',
            data: [12, 11, 14, 18, 17, 13, 13]
        }
    ];

    const options: ApexCharts.ApexOptions = {
        chart: {
            height: 350,
            type: 'area', // Corrected type usage
            toolbar: {
                show: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
        xaxis: {
            type: 'datetime',
            categories: [
                new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                new Date(Date.now()).toISOString()
            ]
        },
        tooltip: {
            x: {
                format: 'dd/MM/yy'
            },
        },
        colors: ['#ea580c', '#3b82f6']
    };

    const handleExport = () => {
        // Mock Export Functionality
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Vape Events,AQI Incidents\n"
            + series[0].data.map((val, idx) => `${options.xaxis?.categories[idx]},${val},${series[1].data[idx]}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "halo_analytics_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <UnderConstructionPage
            title="Analytics"
            icon="Analytics"
            description="Comprehensive analytics and reporting features are currently being built."
        />
    );
};

export default Reports;
