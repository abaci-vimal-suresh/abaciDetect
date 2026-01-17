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

const ViewerDashboard = () => {
    const { userData } = useContext(AuthContext);
    const { data: sensors, isLoading: sensorsLoading } = useSensors();
    const { data: areas, isLoading: areasLoading } = useAreas();
    const navigate = useNavigate();

    // Filter areas to only those assigned to the viewer
    const assignedAreas = useMemo(() => {
        if (!areas || !userData) return [];
        const assignedIds = userData.assigned_area_ids || [];
        return areas.filter((area: Area) => assignedIds.includes(area.id));
    }, [areas, userData]);

    // Filter sensors belonging to assigned areas
    const assignedSensors = useMemo(() => {
        if (!sensors || assignedAreas.length === 0) return [];
        const areaIds = assignedAreas.map(a => a.id);
        return sensors.filter((sensor: Sensor) => sensor.area_id && areaIds.includes(sensor.area_id));
    }, [sensors, assignedAreas]);

    const stats = useMemo(() => {
        return {
            total: assignedSensors.length,
            active: assignedSensors.filter(s => s.is_active).length,
            alerts: assignedSensors.filter(s => s.status === 'critical').length,
        };
    }, [assignedSensors]);

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
                                    You are currently overseeing <strong>{assignedAreas.length}</strong> assigned areas.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className='col-md-4'>
                <Card stretch className='border-0 shadow-sm'>
                    <CardBody className='d-flex align-items-center'>
                        <Icon icon='Sensors' size='3x' className='text-primary me-3' />
                        <div>
                            <div className='h3 mb-0'>{stats.total}</div>
                            <div className='text-muted small'>Assigned Sensors</div>
                        </div>
                    </CardBody>
                </Card>
            </div>
            <div className='col-md-4'>
                <Card stretch className='border-0 shadow-sm'>
                    <CardBody className='d-flex align-items-center'>
                        <Icon icon='CheckCircle' size='3x' className='text-success me-3' />
                        <div>
                            <div className='h3 mb-0'>{stats.active}</div>
                            <div className='text-muted small'>Active Units</div>
                        </div>
                    </CardBody>
                </Card>
            </div>
            <div className='col-md-4'>
                <Card stretch className='border-0 shadow-sm'>
                    <CardBody className='d-flex align-items-center'>
                        <Icon icon='ReportProblem' size='3x' className='text-danger me-3' />
                        <div>
                            <div className='h3 mb-0'>{stats.alerts}</div>
                            <div className='text-muted small'>Critical Alerts</div>
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
                                    <div
                                        key={area.id}
                                        className='list-group-item list-group-item-action p-4 border-bottom'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/halo/sensors/areas/${area.parent_id || area.id}/subzones`)}
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

            {/* Area Distribution Chart (Simplified) */}
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
                                series={assignedAreas.map(a => a.sensor_count)}
                                options={{
                                    labels: assignedAreas.map(a => a.name),
                                    legend: { position: 'bottom' },
                                    colors: ['var(--bs-primary)', 'var(--bs-success)', 'var(--bs-warning)', 'var(--bs-info)']
                                }}
                                height={300}
                            />
                        ) : (
                            <div className='text-center py-5'>
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
