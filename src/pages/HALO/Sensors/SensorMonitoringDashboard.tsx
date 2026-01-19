import React from 'react';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Progress from '../../../components/bootstrap/Progress';
import { useHeartbeatStatus, useActiveEvents, useAllSensorsLatestData, useDeviceHealth } from '../../../api/sensors.api';

const SensorMonitoringDashboard = () => {
    const { data: heartbeatStatus, isLoading: heartbeatLoading } = useHeartbeatStatus();
    const { data: activeEvents, isLoading: eventsLoading } = useActiveEvents();
    const { data: latestData, isLoading: dataLoading } = useAllSensorsLatestData();
    const { data: deviceHealth, isLoading: healthLoading } = useDeviceHealth();

    const isLoading = heartbeatLoading || eventsLoading || dataLoading || healthLoading;

    return (
        <PageWrapper title='Real-Time Monitoring'>
            <SubHeader>
                <SubHeaderLeft>
                    <Icon icon='Monitor' className='me-2 fs-4' />
                    <span className='h4 mb-0 fw-bold'>Real-Time Sensor Monitoring</span>
                </SubHeaderLeft>
            </SubHeader>

            <Page container='fluid'>
                {/* Auto-refresh indicator */}
                <div className='mb-3 d-flex align-items-center gap-2'>
                    <div className='spinner-grow spinner-grow-sm text-success' role='status'>
                        <span className='visually-hidden'>Auto-refreshing...</span>
                    </div>
                    <small className='text-muted'>Auto-refreshing every 3-10 seconds</small>
                </div>

                {/* System Health Status */}
                <div className='row g-4 mb-4'>
                    <div className='col-12'>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <Icon icon='HealthAndSafety' className='me-2' />
                                    System Health
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                {healthLoading ? (
                                    <Spinner color='primary' />
                                ) : (
                                    <div className='d-flex align-items-center gap-3'>
                                        <div className={`badge bg-${deviceHealth?.status === 'healthy' ? 'success' : 'danger'} fs-5 px-3 py-2`}>
                                            {deviceHealth?.status?.toUpperCase() || 'UNKNOWN'}
                                        </div>
                                        <small className='text-muted'>
                                            Last checked: {deviceHealth?.timestamp ? new Date(deviceHealth.timestamp).toLocaleString() : 'N/A'}
                                        </small>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Heartbeat Status Cards */}
                <div className='row g-4 mb-4'>
                    <div className='col-md-3'>
                        <Card className='border-0 shadow-sm'>
                            <CardBody>
                                <div className='d-flex align-items-center justify-content-between'>
                                    <div>
                                        <div className='text-muted small mb-1'>Total Sensors</div>
                                        <div className='h2 mb-0 fw-bold'>
                                            {heartbeatLoading ? <Spinner isSmall /> : heartbeatStatus?.total_sensors || 0}
                                        </div>
                                    </div>
                                    <div className='bg-primary bg-opacity-10 rounded p-3'>
                                        <Icon icon='Sensors' size='2x' className='text-primary' />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className='col-md-3'>
                        <Card className='border-0 shadow-sm'>
                            <CardBody>
                                <div className='d-flex align-items-center justify-content-between'>
                                    <div>
                                        <div className='text-muted small mb-1'>Online</div>
                                        <div className='h2 mb-0 fw-bold text-success'>
                                            {heartbeatLoading ? <Spinner isSmall /> : heartbeatStatus?.online_sensors || 0}
                                        </div>
                                    </div>
                                    <div className='bg-success bg-opacity-10 rounded p-3'>
                                        <Icon icon='CheckCircle' size='2x' className='text-success' />
                                    </div>
                                </div>
                                {!heartbeatLoading && heartbeatStatus && (
                                    <Progress
                                        value={(heartbeatStatus.online_sensors / heartbeatStatus.total_sensors) * 100}
                                        color='success'
                                        className='mt-2'
                                        height={6}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    <div className='col-md-3'>
                        <Card className='border-0 shadow-sm'>
                            <CardBody>
                                <div className='d-flex align-items-center justify-content-between'>
                                    <div>
                                        <div className='text-muted small mb-1'>Offline</div>
                                        <div className='h2 mb-0 fw-bold text-danger'>
                                            {heartbeatLoading ? <Spinner isSmall /> : heartbeatStatus?.offline_sensors || 0}
                                        </div>
                                    </div>
                                    <div className='bg-danger bg-opacity-10 rounded p-3'>
                                        <Icon icon='Cancel' size='2x' className='text-danger' />
                                    </div>
                                </div>
                                {!heartbeatLoading && heartbeatStatus && heartbeatStatus.offline_sensors > 0 && (
                                    <Progress
                                        value={(heartbeatStatus.offline_sensors / heartbeatStatus.total_sensors) * 100}
                                        color='danger'
                                        className='mt-2'
                                        height={6}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    <div className='col-md-3'>
                        <Card className='border-0 shadow-sm'>
                            <CardBody>
                                <div className='d-flex align-items-center justify-content-between'>
                                    <div>
                                        <div className='text-muted small mb-1'>Active Events</div>
                                        <div className='h2 mb-0 fw-bold text-warning'>
                                            {eventsLoading ? <Spinner isSmall /> : activeEvents?.length || 0}
                                        </div>
                                    </div>
                                    <div className='bg-warning bg-opacity-10 rounded p-3'>
                                        <Icon icon='Notifications' size='2x' className='text-warning' />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Latest Sensor Data */}
                <div className='row g-4'>
                    <div className='col-12'>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <Icon icon='Timeline' className='me-2' />
                                    Latest Sensor Readings
                                </CardTitle>
                                <Badge color='info' isLight>
                                    Real-time
                                </Badge>
                            </CardHeader>
                            <CardBody>
                                {dataLoading ? (
                                    <div className='text-center py-5'>
                                        <Spinner color='primary' size='3rem' />
                                        <div className='mt-3 text-muted'>Loading latest data...</div>
                                    </div>
                                ) : latestData && latestData.length > 0 ? (
                                    <div className='table-responsive'>
                                        <table className='table table-hover'>
                                            <thead>
                                                <tr>
                                                    <th>Device</th>
                                                    <th>Status</th>
                                                    <th>Last Reading</th>
                                                    <th>Data</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {latestData.slice(0, 10).map((reading: any, index: number) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className='fw-bold'>{reading.device_name || 'Unknown'}</div>
                                                            <div className='small text-muted'>{reading.mac_address}</div>
                                                        </td>
                                                        <td>
                                                            <Badge color={reading.is_online ? 'success' : 'danger'} isLight>
                                                                {reading.is_online ? 'Online' : 'Offline'}
                                                            </Badge>
                                                        </td>
                                                        <td className='small text-muted'>
                                                            {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : 'N/A'}
                                                        </td>
                                                        <td>
                                                            <div className='small'>
                                                                {reading.sensor_data ? JSON.stringify(reading.sensor_data).substring(0, 50) + '...' : 'No data'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className='text-center py-5 text-muted'>
                                        <Icon icon='DataUsage' size='3x' className='mb-3' />
                                        <div>No sensor data available</div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Last Update Time */}
                {heartbeatStatus?.last_update && (
                    <div className='mt-3 text-center'>
                        <small className='text-muted'>
                            <Icon icon='Update' size='sm' className='me-1' />
                            Last heartbeat update: {new Date(heartbeatStatus.last_update).toLocaleString()}
                        </small>
                    </div>
                )}
            </Page>
        </PageWrapper>
    );
};

export default SensorMonitoringDashboard;
