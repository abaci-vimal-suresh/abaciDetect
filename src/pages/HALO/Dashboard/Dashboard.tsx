import React, { useContext, useMemo, useCallback } from 'react';
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

//  1: Extract constants outside component to prevent recreation
const CHART_CATEGORIES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
const CHART_TEMP_DATA = [22, 23, 24, 23.5, 25, 24, 23];
const CHART_HUMIDITY_DATA = [45, 47, 48, 46, 49, 48, 47];
const BADGE_COLORS = ['primary', 'success', 'warning', 'info', 'danger'] as const;
const RECENT_ACTIVITY_LIMIT = 3;
const DEFAULT_PAGE_SIZE = 5;

//  2: Memoize static chart configuration
const getChartOptions = (): ApexOptions => ({
    chart: {
        id: 'sensor-trends',
        toolbar: { show: false },
    },
    xaxis: {
        categories: CHART_CATEGORIES,
    },
    stroke: { curve: 'smooth' },
    colors: [import.meta.env.VITE_PRIMARY_COLOR, import.meta.env.VITE_INFO_COLOR],
});

const chartSeries = [
    { name: 'Temperature', data: CHART_TEMP_DATA },
    { name: 'Humidity', data: CHART_HUMIDITY_DATA },
];

//  3: Extract sub-components to prevent unnecessary re-renders
const StatCard = React.memo(({ icon, value, label, iconColor }: {
    icon: string;
    value: number | string;
    label: string;
    iconColor: string;
}) => (
    <Card stretch className='border-0 shadow-sm'>
        <CardBody className='text-center'>
            <Icon icon={icon} size='2x' className={`${iconColor} mb-2`} />
            <div className='h3 mb-0'>{value}</div>
            <div className='text-muted small'>{label}</div>
        </CardBody>
    </Card>
));

StatCard.displayName = 'StatCard';

const AreaProgressItem = React.memo(({ area, totalSensors }: {
    area: any;
    totalSensors: number;
}) => (
    <div className='mb-4'>
        <div className='d-flex justify-content-between mb-1'>
            <span className='fw-bold'>{area.name}</span>
            <span className='text-muted small'>
                {area.sensor_count} Sensors
            </span>
        </div>
        <Progress
            value={totalSensors > 0 ? (area.sensor_count / totalSensors) * 100 : 0}
            color='primary'
            height='8px'
        />
        <div className='small text-muted mt-1'>
            {area.subareas?.length || 0} sub areas
        </div>
    </div>
));

AreaProgressItem.displayName = 'AreaProgressItem';

const ActivityRow = React.memo(({ sensor }: { sensor: any }) => (
    <tr>
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
));

ActivityRow.displayName = 'ActivityRow';



const Dashboard = () => {
    const { userData } = useContext(AuthContext);
    const { data: sensors, isLoading: sensorsLoading } = useSensors();
    const { data: areas, isLoading: areasLoading } = useAreas();
    const { fullScreenStatus } = useContext(ThemeContext);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();

    //  4: Memoize role check
    const isAdmin = useMemo(() => {
        return userData?.role?.toLowerCase() === 'admin';
    }, [userData?.role]);

    //  5: Memoize stats calculation with dependency on sensors length instead of entire array
    const stats = useMemo(() => {
        if (!sensors || sensors.length === 0) {
            return { total: 0, active: 0, inactive: 0, alerts: 0 };
        }

        const active = sensors.filter(s => s.is_active).length;
        return {
            total: sensors.length,
            active,
            inactive: sensors.length - active,
            alerts: 3,
        };
    }, [sensors]);

    //  6: Memoize chart options (only create once)
    const chartOptions = useMemo(() => getChartOptions(), []);

    //  7: Memoize sensor columns definition
    const sensorColumns = useMemo(() => [
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
    ], []);

    //  8: Memoize area distribution calculation
    const areaDistribution = useMemo(() => {
        if (!areas || areas.length === 0) {
            return { labels: [], series: [] };
        }
        return {
            labels: areas.map(area => area.name),
            series: areas.map(area => area.sensor_count)
        };
    }, [areas]);

    //  9: Memoize donut chart options
    const donutChartOptions = useMemo(() => ({
        labels: areaDistribution.labels,
        legend: { show: false },
        colors: [
            import.meta.env.VITE_PRIMARY_COLOR,
            import.meta.env.VITE_SUCCESS_COLOR,
            import.meta.env.VITE_WARNING_COLOR,
            import.meta.env.VITE_INFO_COLOR,
            import.meta.env.VITE_DANGER_COLOR,
        ]
    }), [areaDistribution.labels]);

    //  10: Memoize table options
    const tableOptions = useMemo(() => ({
        headerStyle: headerStyles(),
        rowStyle: rowStyles(),
        searchFieldStyle: searchFieldStyle(),
        pageSize: DEFAULT_PAGE_SIZE,
        search: true,
        toolbar: true,
    }), [headerStyles, rowStyles, searchFieldStyle]);

    //  11: Memoize computed values
    const totalSubareas = useMemo(() =>
        areas?.reduce((acc, area) => acc + (area.subareas?.length || 0), 0) || 0,
        [areas]);

    const systemHealth = useMemo(() =>
        stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0,
        [stats.total, stats.active]);

    const recentSensors = useMemo(() =>
        sensors?.slice(0, RECENT_ACTIVITY_LIMIT) || [],
        [sensors]);

    //  12: Early return for loading state
    if (sensorsLoading || areasLoading) {
        return (
            <PageWrapper title='HALO Dashboard'>
                <div className='d-flex justify-content-center align-items-center h-100 py-5'>
                    <Spinner size='3rem' color='primary' />
                </div>
            </PageWrapper>
        );
    }

    //  13: Early return for non-admin users
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
                <summary className='row g-4 mb-4'>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard
                            icon='Sensors'
                            value={stats.total}
                            label='Total Sensors'
                            iconColor='text-primary'
                        />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard
                            icon='CheckCircle'
                            value={stats.active}
                            label='Active Units'
                            iconColor='text-success'
                        />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard
                            icon='Error'
                            value={stats.inactive}
                            label='Inactive Units'
                            iconColor='text-danger'
                        />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard
                            icon='LocationCity'
                            value={areas?.length || 0}
                            label='Total Areas'
                            iconColor='text-info'
                        />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard
                            icon='GroupWork'
                            value={totalSubareas}
                            label='Sub Areas'
                            iconColor='text-warning'
                        />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard
                            icon='HealthAndSafety'
                            value={`${systemHealth}%`}
                            label='System Health'
                            iconColor='text-success'
                        />
                    </div>
                </summary>

                <section className='row g-4'>
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
                                            <AreaProgressItem
                                                key={area.id}
                                                area={area}
                                                totalSensors={stats.total}
                                            />
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



                    <div className='col-12'>
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
                                            {recentSensors.length > 0 ? (
                                                recentSensors.map(sensor => (
                                                    <ActivityRow key={sensor.id} sensor={sensor} />
                                                ))
                                            ) : (
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
                </section>
            </Page>
        </PageWrapper>
    );
};

export default Dashboard;