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

import useTablestyle from '../../../hooks/useTablestyles';
import ThemeContext from '../../../contexts/themeContext';
import { useSensors, useAreas } from '../../../api/sensors.api';
import AuthContext from '../../../contexts/authContext';
import ViewerDashboard from './ViewerDashboard';
import MetricSnapshotChart from './components/MetricSnapshotChart';

const BADGE_COLORS = ['primary', 'success', 'warning', 'info', 'danger'] as const;
const RECENT_ACTIVITY_LIMIT = 3;
const DEFAULT_PAGE_SIZE = 5;

//  Memoized sub-components
const StatCard = React.memo(({ icon, value, label, iconColor }: {
    icon: string;
    value: number | string;
    label: string;
    iconColor: string;
}) => (
    <Card stretch isNeumorphic>
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
            <span className='text-muted small'>{area.sensor_count} Sensors</span>
        </div>
        <Progress
            value={totalSensors > 0 ? (area.sensor_count / totalSensors) * 100 : 0}
            color='primary'
            height='8px'
        />
        <div className='small text-muted mt-1'>{area.subareas?.length || 0} sub areas</div>
    </div>
));
AreaProgressItem.displayName = 'AreaProgressItem';

const ActivityRow = React.memo(({ sensor }: { sensor: any }) => (
    <tr>
        <td>
            <Icon icon='Circle' className={sensor.is_active ? 'text-success' : 'text-danger'} />
        </td>
        <td>
            <div className='fw-bold'>{sensor.is_active ? 'Sensor Active' : 'Sensor Inactive'}</div>
            <div className='small text-muted'>{sensor.name} - {sensor.mac_address}</div>
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

    const isAdmin = useMemo(() => userData?.role?.toLowerCase() === 'admin', [userData?.role]);

    const stats = useMemo(() => {
        if (!sensors || sensors.length === 0) return { total: 0, active: 0, inactive: 0 };
        const active = sensors.filter(s => s.is_active).length;
        return { total: sensors.length, active, inactive: sensors.length - active };
    }, [sensors]);

    const totalSubareas = useMemo(
        () => areas?.reduce((acc, area) => acc + (area.subareas?.length || 0), 0) || 0,
        [areas],
    );

    const systemHealth = useMemo(
        () => stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0,
        [stats.total, stats.active],
    );

    const recentSensors = useMemo(() => sensors?.slice(0, RECENT_ACTIVITY_LIMIT) || [], [sensors]);

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
                    <Button color='primary' isNeumorphic isLight icon='CloudDownload'>Export Data</Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
                {/* ── Stat Cards ── */}
                <summary className='row g-4 mb-4'>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard icon='Sensors' value={stats.total} label='Total Sensors' iconColor='text-primary' />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard icon='CheckCircle' value={stats.active} label='Active Units' iconColor='text-success' />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard icon='Error' value={stats.inactive} label='Inactive Units' iconColor='text-danger' />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard icon='LocationCity' value={areas?.length || 0} label='Total Areas' iconColor='text-info' />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard icon='GroupWork' value={totalSubareas} label='Sub Areas' iconColor='text-primary' />
                    </div>
                    <div className='col-xl-2 col-md-4 col-sm-6'>
                        <StatCard icon='HealthAndSafety' value={`${systemHealth}%`} label='System Health' iconColor='text-success' />
                    </div>
                </summary>

                <section className='row g-4'>
                    {/* ── Live Environmental Snapshot Chart (replaces dummy trend chart) ── */}
                    <div className='col-lg-8'>
                        <MetricSnapshotChart />
                    </div>

                    {/* ── Area Overview ── */}
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
                                        <Button color='primary' size='sm' tag='a' to='/halo/sensors/areas'>
                                            Create First Area
                                        </Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* ── Recent Activity ── */}
                    <div className='col-12'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardLabel icon='History'>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardLabel>
                                <CardActions>
                                    <Button color='info' isLight size='sm' tag='a' to='/halo/alerts/history'>
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