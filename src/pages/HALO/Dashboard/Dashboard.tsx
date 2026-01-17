import React, { useContext, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import MaterialTable from '@material-table/core';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle, CardFooter, CardLabel, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Progress from '../../../components/bootstrap/Progress';
import Spinner from '../../../components/bootstrap/Spinner';
import Chart from '../../../components/extras/Chart';

import useTablestyle from '../../../hooks/useTablestyles';
import ThemeContext from '../../../contexts/themeContext';
import { useSensors, useAreas } from '../../../api/sensors.api';
import { ApexOptions } from 'apexcharts';
import AuthContext from '../../../contexts/authContext';
import ViewerDashboard from './ViewerDashboard';

const Dashboard = () => {
    const { userData } = useContext(AuthContext);
    const { data: sensors, isLoading: sensorsLoading } = useSensors();
    const { data: areas, isLoading: areasLoading } = useAreas();
    const { fullScreenStatus } = useContext(ThemeContext);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    const isAdmin = useMemo(() => {
        return userData?.role?.toLowerCase() === 'admin';
    }, [userData]);

    const stats = useMemo(() => {
        if (!sensors) return { total: 0, active: 0, inactive: 0, alerts: 0 };
        return {
            total: sensors.length,
            active: sensors.filter(s => s.is_active).length,
            inactive: sensors.filter(s => !s.is_active).length,
            alerts: 3, // Mock for now - can be calculated from actual alert data
        };
    }, [sensors]);

    const chartOptions: ApexOptions = {
        chart: {
            id: 'sensor-trends',
            toolbar: { show: false },
        },
        xaxis: {
            categories: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
        },
        stroke: { curve: 'smooth' },
        colors: [import.meta.env.VITE_PRIMARY_COLOR, import.meta.env.VITE_INFO_COLOR],
    };

    const chartSeries = [
        { name: 'Temperature', data: [22, 23, 24, 23.5, 25, 24, 23] },
        { name: 'Humidity', data: [45, 47, 48, 46, 49, 48, 47] },
    ];

    const sensorColumns = [
        {
            title: 'Sensor Name',
            field: 'name',
            render: (rowData: any) => (
                <div className='d-flex align-items-center'>
                    <Icon icon='Sensors' className='me-2 text-primary' />
                    <div>
                        <div className='fw-bold'>{rowData.name}</div>
                        <div className='small text-muted'>{rowData.sensor_type}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'MAC Address',
            field: 'mac_address',
            render: (rowData: any) => (
                <div>
                    <div className='font-monospace small'>{rowData.mac_address}</div>
                    {rowData.ip_address && (
                        <div className='small text-muted'>{rowData.ip_address}</div>
                    )}
                </div>
            )
        },
        {
            title: 'Location',
            field: 'location',
            render: (rowData: any) => rowData.location || 'N/A'
        },
        {
            title: 'Status',
            field: 'is_active',
            render: (rowData: any) => (
                <Badge color={rowData.is_active ? 'success' : 'danger'} isLight>
                    {rowData.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
            )
        },
        {
            title: 'Last Updated',
            field: 'created_at',
            render: (rowData: any) => rowData.created_at
                ? new Date(rowData.created_at).toLocaleString()
                : 'N/A'
        }
    ];

    // Calculate area distribution for pie chart
    const areaDistribution = useMemo(() => {
        if (!areas) return { labels: [], series: [] };
        const labels = areas.map(area => area.name);
        const series = areas.map(area => area.sensor_count);
        return { labels, series };
    }, [areas]);

    if (sensorsLoading || areasLoading) {
        return (
            <PageWrapper title='HALO Dashboard'>
                <div className='d-flex justify-content-center align-items-center h-100 py-5'>
                    <Spinner size='3rem' color='primary' />
                </div>
            </PageWrapper>
        );
    }

    if (!isAdmin) {
        return (
            <PageWrapper title='HALO Dashboard'>
                <SubHeader>
                    <SubHeaderLeft>
                        <Icon icon='Dashboard' className='me-2 fs-4' />
                        <span className='h4 mb-0 fw-bold'>My Monitoring Dashboard</span>
                    </SubHeaderLeft>
                </SubHeader>
                <Page container='fluid'>
                    <ViewerDashboard />
                </Page>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title='HALO IoT Dashboard'>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='Dashboard' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>HALO IoT Command Center</span>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button color='primary' isLight icon='CloudDownload'>Export Data</Button>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>
                {/* Summary Row */}
                <div className='row g-4 mb-4'>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <Card stretch className='border-0 shadow-sm'>
                            <CardBody className='text-center'>
                                <Icon icon='Sensors' size='2x' className='text-primary mb-2' />
                                <div className='h3 mb-0'>{stats.total}</div>
                                <div className='text-muted small'>Total Sensors</div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <Card stretch className='border-0 shadow-sm'>
                            <CardBody className='text-center'>
                                <Icon icon='CheckCircle' size='2x' className='text-success mb-2' />
                                <div className='h3 mb-0'>{stats.active}</div>
                                <div className='text-muted small'>Active Units</div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <Card stretch className='border-0 shadow-sm'>
                            <CardBody className='text-center'>
                                <Icon icon='Error' size='2x' className='text-danger mb-2' />
                                <div className='h3 mb-0'>{stats.inactive}</div>
                                <div className='text-muted small'>Inactive Units</div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <Card stretch className='border-0 shadow-sm'>
                            <CardBody className='text-center'>
                                <Icon icon='LocationCity' size='2x' className='text-info mb-2' />
                                <div className='h3 mb-0'>{areas?.length || 0}</div>
                                <div className='text-muted small'>Total Areas</div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <Card stretch className='border-0 shadow-sm'>
                            <CardBody className='text-center'>
                                <Icon icon='GroupWork' size='2x' className='text-warning mb-2' />
                                <div className='h3 mb-0'>
                                    {areas?.reduce((acc, area) => acc + (area.subareas?.length || 0), 0) || 0}
                                </div>
                                <div className='text-muted small'>Sub Areas</div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <Card stretch className='border-0 shadow-sm'>
                            <CardBody className='text-center'>
                                <Icon icon='HealthAndSafety' size='2x' className='text-success mb-2' />
                                <div className='h3 mb-0'>
                                    {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
                                </div>
                                <div className='text-muted small'>System Health</div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                <div className='row g-4'>
                    {/* Real-time Monitoring & Analytics */}
                    <div className='col-lg-8'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardLabel icon='Timeline'>
                                    <CardTitle>Real-time Trends (24h)</CardTitle>
                                </CardLabel>
                            </CardHeader>
                            <CardBody>
                                <Chart
                                    type='area'
                                    series={chartSeries}
                                    options={chartOptions}
                                    height={300}
                                />
                            </CardBody>
                        </Card>
                    </div>

                    <div className='col-lg-4'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardLabel icon='LocationCity'>
                                    <CardTitle>Area Overview</CardTitle>
                                </CardLabel>
                            </CardHeader>
                            <CardBody>
                                {areas && areas.length > 0 ? (
                                    <>
                                        {areas.map(area => (
                                            <div key={area.id} className='mb-4'>
                                                <div className='d-flex justify-content-between mb-1'>
                                                    <span className='fw-bold'>{area.name}</span>
                                                    <span className='text-muted small'>
                                                        {area.sensor_count} Sensors
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={stats.total > 0 ? (area.sensor_count / stats.total) * 100 : 0}
                                                    color='primary'
                                                    height='8px'
                                                />
                                                <div className='small text-muted mt-1'>
                                                    {area.subareas?.length || 0} sub areas
                                                </div>
                                            </div>
                                        ))}
                                        <Button
                                            color='primary'
                                            isLight
                                            className='w-100 mt-2'
                                            tag='a'
                                            to='/halo/sensors/areas'
                                        >
                                            Manage Areas
                                        </Button>
                                    </>
                                ) : (
                                    <div className='text-center py-4'>
                                        <Icon icon='LocationCity' className='text-muted mb-2' size='3x' />
                                        <p className='text-muted'>No areas configured yet</p>
                                        <Button
                                            color='primary'
                                            size='sm'
                                            tag='a'
                                            to='/halo/sensors/areas'
                                        >
                                            Create First Area
                                        </Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sensor Inventory Table */}
                    <div className='col-12'>
                        <Card className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardLabel icon='List'>
                                    <CardTitle>Live Sensor Registry</CardTitle>
                                </CardLabel>
                                <CardActions>
                                    <Button
                                        color='primary'
                                        isLight
                                        size='sm'
                                        tag='a'
                                        to='/halo/sensors/list'
                                    >
                                        View All
                                    </Button>
                                </CardActions>
                            </CardHeader>
                            <CardBody className='table-responsive p-0'>
                                <ThemeProvider theme={theme}>
                                    <MaterialTable
                                        title=' '
                                        columns={sensorColumns}
                                        data={sensors || []}
                                        options={{
                                            headerStyle: headerStyles(),
                                            rowStyle: rowStyles(),
                                            searchFieldStyle: searchFieldStyle(),
                                            pageSize: 5,
                                            search: true,
                                            toolbar: true,
                                        }}
                                        localization={{
                                            pagination: { labelRowsPerPage: '' }
                                        }}
                                    />
                                </ThemeProvider>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Area Distribution */}
                    <div className='col-lg-6'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardLabel icon='PieChart'>
                                    <CardTitle>Sensor Distribution by Area</CardTitle>
                                </CardLabel>
                            </CardHeader>
                            <CardBody>
                                {areas && areas.length > 0 && stats.total > 0 ? (
                                    <div className='row align-items-center'>
                                        <div className='col-md-5'>
                                            <Chart
                                                type='donut'
                                                series={areaDistribution.series}
                                                options={{
                                                    labels: areaDistribution.labels,
                                                    legend: { show: false },
                                                    colors: [
                                                        import.meta.env.VITE_PRIMARY_COLOR,
                                                        import.meta.env.VITE_SUCCESS_COLOR,
                                                        import.meta.env.VITE_WARNING_COLOR,
                                                        import.meta.env.VITE_INFO_COLOR,
                                                        import.meta.env.VITE_DANGER_COLOR,
                                                    ]
                                                }}
                                                height={200}
                                            />
                                        </div>
                                        <div className='col-md-7'>
                                            <ul className='list-group list-group-flush'>
                                                {areas.map((area, index) => {
                                                    const colors: any[] = ['primary', 'success', 'warning', 'info', 'danger'];
                                                    return (
                                                        <li
                                                            key={area.id}
                                                            className='list-group-item d-flex justify-content-between align-items-center py-2 border-0'
                                                        >
                                                            <span>{area.name}</span>
                                                            <Badge color={colors[index % colors.length] as any}>
                                                                {area.sensor_count} Sensors
                                                            </Badge>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='text-center py-5'>
                                        <Icon icon='PieChart' className='text-muted mb-2' size='3x' />
                                        <p className='text-muted'>No sensor data to display</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Alert Log */}
                    <div className='col-lg-6'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardLabel icon='History'>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardLabel>
                                <CardActions>
                                    <Button
                                        color='info'
                                        isLight
                                        size='sm'
                                        tag='a'
                                        to='/halo/alerts/history'
                                    >
                                        View All
                                    </Button>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                <div className='table-responsive'>
                                    <table className='table table-borderless table-hover align-middle mb-0'>
                                        <tbody>
                                            {sensors && sensors.slice(0, 3).map((sensor, index) => (
                                                <tr key={sensor.id}>
                                                    <td>
                                                        <Icon
                                                            icon='Circle'
                                                            className={sensor.is_active ? 'text-success' : 'text-danger'}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className='fw-bold'>
                                                            {sensor.is_active ? 'Sensor Active' : 'Sensor Inactive'}
                                                        </div>
                                                        <div className='small text-muted'>
                                                            {sensor.name} - {sensor.mac_address}
                                                        </div>
                                                    </td>
                                                    <td className='text-end small text-muted'>
                                                        {new Date(sensor.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!sensors || sensors.length === 0) && (
                                                <tr>
                                                    <td colSpan={3} className='text-center text-muted py-4'>
                                                        No recent activity
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default Dashboard;