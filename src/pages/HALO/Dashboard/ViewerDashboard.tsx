import React, { useMemo, useContext } from 'react';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle, CardLabel } from '../../../components/bootstrap/Card';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Chart from '../../../components/extras/Chart';
import AuthContext from '../../../contexts/authContext';
import { useSensors, useAreas } from '../../../api/sensors.api';
import { Area, Sensor } from '../../../types/sensor';
import { useNavigate } from 'react-router-dom';

// OPTIMIZATION 1: Extract memoized component for stat items
const StatItem = React.memo(({ icon, value, label, iconColor }: {
    icon: string;
    value: number;
    label: string;
    iconColor: string;
}) => (
    <div className='d-flex align-items-center p-3'>
        <Icon icon={icon} size='3x' className={`${iconColor} me-3`} />
        <div>
            <div className='h3 mb-0'>{value}</div>
            <div className='text-muted small'>{label}</div>
        </div>
    </div>
));
StatItem.displayName = 'StatItem';

// OPTIMIZATION 2: Extract memoized component for area list items
const AreaListItem = React.memo(({ area, onClick }: {
    area: Area;
    onClick: () => void;
}) => (
    <div
        className='list-group-item list-group-item-action p-4 border-bottom'
        style={{ cursor: 'pointer' }}
        onClick={onClick}
    >
        <div className='d-flex justify-content-between align-items-center'>
            <div className='d-flex align-items-center'>
                <div className='bg-light rounded-circle p-2 me-3'>
                    <Icon icon='Domain' className='text-primary' />
                </div>
                <div>
                    <h5 className='mb-0 fw-bold'>{area.name}</h5>
                    <div className='small text-muted'>
                        Floor Level: {area.floor_level !== null ? area.floor_level : 'Main'}
                    </div>
                </div>
            </div>
            <div className='text-end'>
                <Badge color='info' isLight className='mb-1'>
                    {area.sensor_count} Sensors
                </Badge>
                <div className='small text-primary'>
                    View Details <Icon icon='ArrowForward' size='sm' />
                </div>
            </div>
        </div>
    </div>
));
AreaListItem.displayName = 'AreaListItem';

const ViewerDashboard = () => {
    const { userData } = useContext(AuthContext);
    const { data: sensors, isLoading: sensorsLoading } = useSensors();
    const { data: areas, isLoading: areasLoading } = useAreas();
    const navigate = useNavigate();

    // OPTIMIZATION 3: Filter areas with granular dependencies
    const assignedAreas = useMemo(() => {
        if (!areas || !userData) return [];
        const assignedIds = userData.assigned_area_ids || [];
        if (assignedIds.length === 0) return [];
        return areas.filter((area: Area) => assignedIds.includes(area.id));
    }, [areas, userData?.assigned_area_ids]); // More specific dependency

    // OPTIMIZATION 4: Filter sensors with early return
    const assignedSensors = useMemo(() => {
        if (!sensors || assignedAreas.length === 0) return [];
        const areaIds = assignedAreas.map(a => a.id);
        return sensors.filter((sensor: Sensor) => sensor.area_id && areaIds.includes(sensor.area_id));
    }, [sensors, assignedAreas]);

    // OPTIMIZATION 5: Optimize stats calculation (single pass)
    const stats = useMemo(() => {
        if (assignedSensors.length === 0) {
            return { total: 0, active: 0, alerts: 0 };
        }

        let active = 0;
        let alerts = 0;

        assignedSensors.forEach(s => {
            if (s.is_active) active++;
            if (s.status === 'critical') alerts++;
        });

        return {
            total: assignedSensors.length,
            active,
            alerts,
        };
    }, [assignedSensors]);

    // OPTIMIZATION 6: Memoize chart data
    const chartData = useMemo(() => ({
        series: assignedAreas.map(a => a.sensor_count),
        labels: assignedAreas.map(a => a.name),
    }), [assignedAreas]);

    // OPTIMIZATION 7: Memoize chart options
    const chartOptions = useMemo(() => ({
        labels: chartData.labels,
        legend: { position: 'bottom' as const },
        colors: ['var(--bs-primary)', 'var(--bs-success)', 'var(--bs-warning)', 'var(--bs-info)']
    }), [chartData.labels]);

    // OPTIMIZATION 8: Memoize navigation handlers
    const handleAreaClick = useMemo(() => {
        const handlers = new Map();
        assignedAreas.forEach(area => {
            handlers.set(area.id, () => navigate(`/halo/sensors/areas/${area.parent_id || area.id}/subzones`));
        });
        return handlers;
    }, [assignedAreas, navigate]);

    // OPTIMIZATION 9: Early return for loading
    if (sensorsLoading || areasLoading) {
        return (
            <div className='d-flex justify-content-center align-items-center h-100 py-5'>
                <Spinner size='3rem' color='primary' />
            </div>
        );
    }

    return (
        <div className='row g-4'>
            {/* Greeting & Summary */}
            <div className='col-12'>
                <Card className='border-0 shadow-sm bg-primary bg-opacity-10'>
                    <CardBody className='p-4'>
                        <div className='d-flex align-items-center'>
                            <div className='bg-primary text-white rounded-pill p-3 me-4'>
                                <Icon icon='WavingHand' size='2x' />
                            </div>
                            <div>
                                <h2 className='fw-bold mb-1'>Welcome back, {userData?.first_name || 'User'}!</h2>
                                <p className='text-muted mb-0'>
                                    You are currently overseeing <strong>{assignedAreas.length}</strong> assigned area{assignedAreas.length !== 1 ? 's' : ''}.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* CARD REDUCTION: 3 separate cards → 1 unified card with borders */}
            <div className='col-12'>
                <Card className='border-0 shadow-sm'>
                    <CardBody className='p-0'>
                        <div className='row g-0'>
                            <div className='col-md-4 border-end'>
                                <StatItem
                                    icon='Sensors'
                                    value={stats.total}
                                    label='Assigned Sensors'
                                    iconColor='text-primary'
                                />
                            </div>
                            <div className='col-md-4 border-end'>
                                <StatItem
                                    icon='CheckCircle'
                                    value={stats.active}
                                    label='Active Units'
                                    iconColor='text-success'
                                />
                            </div>
                            <div className='col-md-4'>
                                <StatItem
                                    icon='ReportProblem'
                                    value={stats.alerts}
                                    label='Critical Alerts'
                                    iconColor='text-danger'
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Assigned Areas List */}
            <div className='col-lg-7'>
                <Card stretch className='shadow-sm'>
                    <CardHeader borderSize={1}>
                        <CardLabel icon='LocationCity'>
                            <CardTitle>My Assigned Areas</CardTitle>
                        </CardLabel>
                    </CardHeader>
                    <CardBody className='p-0'>
                        <div className='list-group list-group-flush'>
                            {assignedAreas.length > 0 ? (
                                assignedAreas.map(area => (
                                    <AreaListItem
                                        key={area.id}
                                        area={area}
                                        onClick={handleAreaClick.get(area.id)!}
                                    />
                                ))
                            ) : (
                                <div className='p-5 text-center'>
                                    <Icon icon='NearbyOff' size='3x' className='text-muted mb-3 opacity-25' />
                                    <p className='text-muted'>No areas assigned to your account yet.</p>
                                    <small>Contact your administrator for access.</small>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Area Distribution Chart */}
            <div className='col-lg-5'>
                <Card stretch className='shadow-sm'>
                    <CardHeader borderSize={1}>
                        <CardLabel icon='PieChart'>
                            <CardTitle>Sensor Distribution</CardTitle>
                        </CardLabel>
                    </CardHeader>
                    <CardBody>
                        {assignedAreas.length > 0 ? (
                            <Chart
                                type='donut'
                                series={chartData.series}
                                options={chartOptions}
                                height={300}
                            />
                        ) : (
                            <div className='text-center py-5'>
                                <Icon icon='PieChart' size='3x' className='text-muted mb-3 opacity-25' />
                                <p className='text-muted'>No data to visualize</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default ViewerDashboard;