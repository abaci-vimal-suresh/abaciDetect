import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';

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
        <PageWrapper title='Analytics & Reports'>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='Analytics' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>Historical Analysis</span>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <div className='d-flex gap-2'>
                        <div className='btn-group'>
                            <Button color={dateRange === '24h' ? 'primary' : 'light'} onClick={() => setDateRange('24h')}>24h</Button>
                            <Button color={dateRange === '7d' ? 'primary' : 'light'} onClick={() => setDateRange('7d')}>7d</Button>
                            <Button color={dateRange === '30d' ? 'primary' : 'light'} onClick={() => setDateRange('30d')}>30d</Button>
                        </div>
                        <Button color='success' icon='Download' onClick={handleExport}>
                            Export CSV
                        </Button>
                    </div>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>
                <div className='row g-4'>
                    <div className='col-12'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Trends</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <ReactApexChart options={options} series={series} type="area" height={350} />
                            </CardBody>
                        </Card>
                    </div>

                    {/* Summary Stats */}
                    <div className='col-md-4'>
                        <Card stretch>
                            <CardBody className='text-center'>
                                <div className='h1 fw-bold text-primary mb-0'>108</div>
                                <div className='text-muted'>Total Alerts (7d)</div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='col-md-4'>
                        <Card stretch>
                            <CardBody className='text-center'>
                                <div className='h1 fw-bold text-danger mb-0'>12</div>
                                <div className='text-muted'>Critical Incidents</div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='col-md-4'>
                        <Card stretch>
                            <CardBody className='text-center'>
                                <div className='h1 fw-bold text-success mb-0'>98%</div>
                                <div className='text-muted'>Uptime</div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default Reports;
