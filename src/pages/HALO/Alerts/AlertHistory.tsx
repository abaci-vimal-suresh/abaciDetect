import React, { useState, useMemo } from 'react';
import { format, subDays, subHours, isToday, isWithinInterval, startOfDay } from 'date-fns';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button, { ButtonGroup } from '../../../components/bootstrap/Button';
import Badge from '../../../components/bootstrap/Badge';
import Icon from '../../../components/icon/Icon';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/useTablestyles';
import {
    useAlertFilters, useCreateAlertFilter, useUpdateAlertFilter, useDeleteAlertFilter, useActions,
    useCreateAction, useUpdateAction, useDeleteAction,
    useAlertTrends,
    useAlerts,
    useSensors,
    useAreas,
    useCreateAlert,
    useUpdateAlert,
    useDeleteAlert
} from '../../../api/sensors.api';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../components/bootstrap/Modal';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Select from '../../../components/bootstrap/forms/Select';
import Textarea from '../../../components/bootstrap/forms/Textarea';
import Checks from '../../../components/bootstrap/forms/Checks';
import Label from '../../../components/bootstrap/forms/Label';
import { Action, Alert, AlertCreateData, AlertFilter, AlertStatus, AlertType } from '../../../types/sensor';
import Chart, { IChartOptions } from '../../../components/extras/Chart';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Timeline, { TimelineItem } from '../../../components/extras/Timeline';
import useDarkMode from '../../../hooks/useDarkMode';

// Types for our Alert History
interface AlertHistoryItem {
    id: string;
    originalId: number;
    timestamp: string;
    sensor_name: string;
    area_name: string;
    alert_type: string;
    severity: 'critical' | 'warning' | 'info';
    value: string | number;
    status: AlertStatus | 'Resolved'; // Supporting AlertStatus type
    remarks?: string;
    resolved_at?: string;
}

const AlertHistory = () => {
    const { themeStatus } = useDarkMode();
    const { theme, headerStyle, rowStyle } = useTablestyle();

    const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');
    const [timelineFilter, setTimelineFilter] = useState<'today' | '24h' | 'all'>('all');
    const [chartTimeRange, setChartTimeRange] = useState<'24h' | '7d'>('7d');
    const [showTableFilters, setShowTableFilters] = useState(false);


    // Fetch trends and alerts from API
    const { data: trendData, isLoading: isTrendLoading } = useAlertTrends({ period: chartTimeRange });
    const { data: alertsData, isLoading: isAlertsLoading } = useAlerts();
    const { data: sensors } = useSensors();
    const { data: areas } = useAreas();

    const createAlertMutation = useCreateAlert();
    const updateAlertMutation = useUpdateAlert();
    const deleteAlertMutation = useDeleteAlert();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAlert, setNewAlert] = useState<Partial<AlertCreateData>>({
        type: 'high_temperature',
        status: 'active',
        description: '',
        remarks: '',
        sensor: undefined,
        area: undefined
    });

    // States for status update modal
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<AlertHistoryItem | null>(null);
    const [targetStatus, setTargetStatus] = useState<AlertStatus | null>(null);
    const [remarks, setRemarks] = useState('');
    const [nextTriggerTime, setNextTriggerTime] = useState<string>('');
    const [isNextTriggerEnabled, setIsNextTriggerEnabled] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [alertToDelete, setAlertToDelete] = useState<AlertHistoryItem | null>(null);

    // Alert Filters State
    const deleteFilterMutation = useDeleteAlertFilter();

    const createActionMutation = useCreateAction();
    const updateActionMutation = useUpdateAction();
    const deleteActionMutation = useDeleteAction();


    const handleStatusUpdate = async () => {
        if (!selectedAlert || !targetStatus) return;

        const payload: any = {
            status: targetStatus,
            remarks: remarks,
        };

        if (targetStatus === 'acknowledged') {
            payload.user_acknowledged = 1;
        }

        if (targetStatus === 'suspended' && isNextTriggerEnabled && nextTriggerTime) {
            payload.next_trigger_time = nextTriggerTime;
        } else if (targetStatus === 'suspended') {
            payload.next_trigger_time = null;
        }

        await updateAlertMutation.mutateAsync({
            alertId: selectedAlert.originalId,
            data: payload
        });

        setIsStatusModalOpen(false);
        setRemarks('');
        setNextTriggerTime('');
        setSelectedAlert(null);
        setTargetStatus(null);
    };

    const openStatusModal = (alert: AlertHistoryItem, status: AlertStatus) => {
        setSelectedAlert(alert);
        setTargetStatus(status);
        setNextTriggerTime('');
        setIsNextTriggerEnabled(false);
        setIsStatusModalOpen(true);
    };

    const handleDeleteClick = (alert: AlertHistoryItem) => {
        setAlertToDelete(alert);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (alertToDelete) {
            await deleteAlertMutation.mutateAsync(alertToDelete.originalId);
            setIsDeleteModalOpen(false);
            setAlertToDelete(null);
        }
    };

    const handleCreateAlert = async () => {
        if (newAlert.sensor && newAlert.area && newAlert.type && newAlert.description) {
            await createAlertMutation.mutateAsync(newAlert as AlertCreateData);
            setIsCreateModalOpen(false);
            setNewAlert({
                type: 'high_temperature',
                status: 'active',
                description: '',
                remarks: '',
                sensor: undefined,
                area: undefined
            });
        }
    };

    // Map API Alerts to UI format
    const mockAlertHistory: AlertHistoryItem[] = useMemo(() => {
        if (!alertsData) return [];
        return (alertsData as any[]).map((alert: any) => ({
            id: `ALH-${1000 + alert.id}`,
            originalId: alert.id,
            timestamp: alert.created_at,
            sensor_name: alert.sensor_name || (typeof alert.sensor === 'object' ? alert.sensor?.name : `Sensor-${alert.sensor}`),
            area_name: alert.area_name || (typeof alert.area === 'object' ? alert.area?.name : `Area-${alert.area}`),
            alert_type: alert.type,
            severity: (alert.type.includes('smoke') || alert.type.includes('fire') || alert.type === 'sensor_offline' || alert.status === 'critical') ? 'critical' :
                (alert.status === 'warning' || alert.type.includes('high')) ? 'warning' : 'info',
            value: alert.description,
            status: alert.status,
            remarks: alert.remarks,
            resolved_at: alert.status === 'resolved' ? alert.updated_at : undefined,
        }));
    }, [alertsData]);

    const filteredData = useMemo(() => {
        if (filter === 'all') return mockAlertHistory;
        return mockAlertHistory.filter(item => item.severity === filter);
    }, [filter, mockAlertHistory]);

    const timelineItems = useMemo(() => {
        let items = [...mockAlertHistory];

        if (timelineFilter === 'today') {
            items = items.filter(item => isToday(new Date(item.timestamp)));
        } else if (timelineFilter === '24h') {
            const twentyFourHoursAgo = subHours(new Date(), 24);
            items = items.filter(item => new Date(item.timestamp) >= twentyFourHoursAgo);
        }

        // Grouping by day
        const groups: { [key: string]: AlertHistoryItem[] } = {};
        items.forEach(item => {
            const date = new Date(item.timestamp);
            let dateKey = format(date, 'yyyy-MM-dd');

            if (isToday(date)) {
                dateKey = 'Today';
            } else if (format(subDays(new Date(), 1), 'yyyy-MM-dd') === dateKey) {
                dateKey = 'Yesterday';
            } else {
                dateKey = format(date, 'MMM dd, yyyy');
            }

            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(item);
        });

        return groups;
    }, [timelineFilter, mockAlertHistory]);

    const stats = useMemo(() => {
        return {
            total: mockAlertHistory.length,
            critical: mockAlertHistory.filter(h => h.severity === 'critical').length,
            warning: mockAlertHistory.filter(h => h.severity === 'warning').length,
            resolved: mockAlertHistory.filter(h => h.status === 'resolved' || h.status === 'Resolved').length,
        };
    }, [mockAlertHistory]);

    const chartOptions: IChartOptions = useMemo(() => {
        const data = trendData?.data?.chart_data?.values || [];
        const labels = trendData?.data?.chart_data?.labels || [];

        const maxValue = data.length > 0 ? Math.max(...data) : 0;
        const minValue = data.length > 0 ? Math.min(...data) : 0;
        const range = maxValue - minValue;

        return {
            series: [{
                name: 'Alerts',
                data
            }],
            options: {
                chart: {
                    type: 'area',
                    height: 150,
                    sparkline: { enabled: true },
                    toolbar: { show: false },
                },
                stroke: {
                    curve: 'smooth',
                    width: 3,
                },
                fill: {
                    type: 'gradient',
                    gradient: {
                        shade: themeStatus === 'dark' ? 'dark' : 'light',
                        type: 'vertical',
                        shadeIntensity: 0.5,
                        gradientToColors: [themeStatus === 'dark' ? '#7a3a6f' : '#a87ca1'],
                        inverseColors: true,
                        opacityFrom: themeStatus === 'dark' ? 0.5 : 0.4,
                        opacityTo: 0.1,
                        stops: [0, 100]
                    }
                },
                colors: [themeStatus === 'dark' ? '#a87ca1' : '#7a3a6f'], // Subtle purple line
                labels,
                tooltip: {
                    theme: themeStatus,
                    y: {
                        formatter: (value: number) => `${value} alerts`
                    }
                },
                grid: {
                    show: false,
                },
                xaxis: {
                    labels: { show: false },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: { show: false }
                },
                dataLabels: {
                    enabled: false
                },
                markers: {
                    size: 0,
                    hover: {
                        size: 6,
                        sizeOffset: 3
                    }
                }
            }
        };
    }, [trendData, themeStatus]);

    const columns = [
        {
            title: 'Timestamp',
            field: 'timestamp',
            render: (rowData: AlertHistoryItem) => (
                <div className="d-flex align-items-center">
                    <Icon icon="Schedule" className="me-2 text-muted" />
                    {format(new Date(rowData.timestamp), 'MMM dd, HH:mm')}
                </div>
            ),
        },
       
        { title: 'Type', field: 'alert_type' },
        { title: 'Sensor', field: 'sensor_name', render: (row: any) => <code>{row.sensor_name}</code> },
        { title: 'Area', field: 'area_name' },
        { title: 'Value', field: 'value' },
        {
            title: 'Status',
            field: 'status',
            render: (rowData: AlertHistoryItem) => {
                const colors: Record<string, string> = {
                    'active': 'danger',
                    'acknowledged': 'warning',
                    'resolved': 'success',
                    'dismissed': 'secondary',
                    'suspended': 'dark'
                };
                return (
                    <Badge color={colors[rowData.status.toLowerCase()] as any || 'primary'} isLight>
                        {rowData.status.toUpperCase()}
                    </Badge>
                );
            },
        },
        {
            title: 'Remarks',
            field: 'remarks',
            render: (rowData: AlertHistoryItem) => (
                <small className="text-muted">{rowData.remarks || '-'}</small>
            )
        },
        {
            title: 'Actions',
            field: 'actions',
            sorting: false,
            filtering: false,
            render: (rowData: AlertHistoryItem) => (
                <div className="d-flex gap-2">
                    {rowData.status === 'active' && (
                        <Button
                            color="success"
                            isLight
                            icon="CheckCircle"
                            size="sm"
                            title="Acknowledge Alert"
                            onClick={() => openStatusModal(rowData, 'acknowledged')}
                        />
                    )}
                    {rowData.status === 'acknowledged' && (
                        <Button
                            color="success"
                            isLight
                            icon="TaskAlt"
                            size="sm"
                            title="Resolve Alert"
                            onClick={() => openStatusModal(rowData, 'resolved')}
                        />
                    )}
                    {(rowData.status === 'active' || rowData.status === 'suspended') && (
                        <>
                            <Button
                                color="secondary"
                                isLight
                                icon="Block"
                                size="sm"
                                title="Dismiss Alert"
                                onClick={() => openStatusModal(rowData, 'dismissed')}
                            />
                            {rowData.status === 'active' && (
                                <Button
                                    color="dark"
                                    isLight
                                    icon="PauseCircle"
                                    size="sm"
                                    title="Suspend Alert"
                                    onClick={() => openStatusModal(rowData, 'suspended')}
                                />
                            )}
                        </>
                    )}
                    <Button
                        color="danger"
                        isLight
                        icon="Delete"
                        size="sm"
                        title="Delete Log"
                        onClick={() => handleDeleteClick(rowData)}
                    />
                </div>
            )
        }
    ];

    return (
        <PageWrapper title="Alert History">
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo' },
                            { title: 'Alert History', to: '/halo/alerts' },
                        ]}
                    />
                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button color="primary" isLight icon="Add" onClick={() => setIsCreateModalOpen(true)}>
                        Trigger Alert
                    </Button>
                    <Button color="dark" isLight icon="Download" className="ms-2">
                        Export Logs
                    </Button>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid' >
                <div className="row">

                    <div className="col-lg-3 col-md-6 mb-4">
                        <Card stretch className="shadow-sm">
                            <CardBody className="py-4">
                                <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 bg-white rounded-circle p-3 shadow-sm">
                                        <Icon icon="ReportProblem" size="2x" className="text-danger" />
                                    </div>
                                    <div className="flex-grow-1 ms-3 text-end">
                                        <div className="h4 fw-bold mb-0 text-danger">{stats.critical}</div>
                                        <div className="small">Critical Alerts</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <Card stretch>
                            <CardBody className="py-4">
                                <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 bg-white rounded-circle p-3 shadow-sm">
                                        <Icon icon="Warning" size="2x" className="text-warning" />
                                    </div>
                                    <div className="flex-grow-1 ms-3 text-end">
                                        <div className="h4 fw-bold mb-0 text-warning">{stats.warning}</div>
                                        <div className="small">Warnings</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <Card stretch className="shadow-sm">
                            <CardBody className="py-4">
                                <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 bg-l10-success rounded-circle p-3">
                                        <Icon icon="CheckCircle" size="2x" className="text-success" />
                                    </div>
                                    <div className="flex-grow-1 ms-3 text-end">
                                        <div className="h4 fw-bold mb-0">{stats.resolved}</div>
                                        <div className="text-muted small">Cases Resolved</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <Card stretch className="shadow-sm">
                            <CardBody className="py-4">
                                <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 bg-l10-primary rounded-circle p-3">
                                        <Icon icon="SignalCellularAlt" size="2x" className="text-primary" />
                                    </div>
                                    <div className="flex-grow-1 ms-3 text-end">
                                        <div className="h4 fw-bold mb-0">{stats.total}</div>
                                        <div className="text-muted small">Total Records</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>



                    <div className="col-xl-12 mb-4">
                        <Card stretch className="shadow-sm">
                            <CardHeader borderSize={1}>
                                <CardTitle>Alert Incidence Trend</CardTitle>
                                <CardActions>
                                    <ButtonGroup>
                                        <Button
                                            color="primary"
                                            isLight={chartTimeRange !== '24h'}
                                            onClick={() => setChartTimeRange('24h')}
                                            size="sm"
                                        >
                                            Last 24 Hours
                                        </Button>
                                        <Button
                                            color="primary"
                                            isLight={chartTimeRange !== '7d'}
                                            onClick={() => setChartTimeRange('7d')}
                                            size="sm"
                                        >
                                            Last 7 Days
                                        </Button>
                                    </ButtonGroup>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                <Chart
                                    series={chartOptions.series}
                                    options={chartOptions.options}
                                    type="area"
                                    height={200}
                                />
                                <div className="mt-4">
                                    <ThemeProvider theme={theme}>
                                        <MaterialTable
                                            title="Historical Logs"
                                            columns={columns}
                                            data={filteredData as any}
                                            options={{
                                                headerStyle: headerStyle(),
                                                rowStyle: rowStyle(),
                                                pageSize: 5,
                                                search: true,
                                                filtering: showTableFilters,
                                                actionsColumnIndex: -1,
                                            }}
                                            actions={[
                                                {
                                                    icon: () => <Icon icon="FilterAlt" />,
                                                    tooltip: showTableFilters ? 'Hide filters' : 'Show filters',
                                                    isFreeAction: true,
                                                    onClick: () => setShowTableFilters(prev => !prev),
                                                },
                                            ]}
                                        />
                                    </ThemeProvider>
                                </div>
                            </CardBody>
                        </Card>
                    </div>


                    <div className="col-xl-12 mb-4">
                        <Card stretch className="shadow-sm">
                            <CardHeader borderSize={1}>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardActions>
                                    <ButtonGroup>
                                        <Button
                                            color="primary"
                                            isLight={timelineFilter !== 'today'}
                                            onClick={() => setTimelineFilter('today')}
                                            size="sm"
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            color="primary"
                                            isLight={timelineFilter !== '24h'}
                                            onClick={() => setTimelineFilter('24h')}
                                            size="sm"
                                        >
                                            24h
                                        </Button>
                                        <Button
                                            color="primary"
                                            isLight={timelineFilter !== 'all'}
                                            onClick={() => setTimelineFilter('all')}
                                            size="sm"
                                        >
                                            All
                                        </Button>
                                    </ButtonGroup>
                                </CardActions>
                            </CardHeader>
                            <CardBody className="overflow-auto" style={{ maxHeight: '600px' }}>
                                <Timeline>
                                    {Object.keys(timelineItems).map((date) => (
                                        <React.Fragment key={date}>
                                            <div className="text-muted fw-bold small p-2 rounded-pill mb-3 text-center sticky-top" style={{ top: 0, zIndex: 10 }}>
                                                {date}
                                            </div>
                                            {timelineItems[date].map((item) => (
                                                <TimelineItem
                                                    key={item.id}
                                                    label={format(new Date(item.timestamp), 'HH:mm')}
                                                    color={item.severity === 'critical' ? 'danger' : item.severity === 'warning' ? 'warning' : 'primary'}
                                                >
                                                    <div className="fw-bold">{item.alert_type}</div>
                                                    <div className="text-muted small mb-1">
                                                        {item.area_name} • <code>{item.sensor_name}</code>
                                                    </div>
                                                    <Badge color={item.status === 'Resolved' ? 'success' : 'danger'} isLight>
                                                        {item.status}
                                                    </Badge>
                                                </TimelineItem>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {Object.keys(timelineItems).length === 0 && (
                                        <div className="text-center text-muted py-5">
                                            No activities found for this period.
                                        </div>
                                    )}
                                </Timeline>
                            </CardBody>
                        </Card>

                    </div>
                </div>
            </Page>

            <Modal isOpen={isStatusModalOpen} setIsOpen={setIsStatusModalOpen}>
                <ModalHeader setIsOpen={setIsStatusModalOpen}>
                    Update Alert Status: {targetStatus?.toUpperCase()}
                </ModalHeader>
                <ModalBody>
                    <div className="row g-3">
                        <div className="col-12 text-center mb-2">
                            <Icon
                                icon={
                                    targetStatus === 'resolved' ? 'TaskAlt' :
                                        targetStatus === 'dismissed' ? 'Block' :
                                            targetStatus === 'suspended' ? 'PauseCircle' : 'Info'
                                }
                                size="3x"
                                className={`text-${targetStatus === 'resolved' ? 'success' :
                                    targetStatus === 'dismissed' ? 'secondary' :
                                        targetStatus === 'suspended' ? 'dark' : 'primary'
                                    }`}
                            />
                            <div className="mt-2 fw-bold">
                                Updating Alert {selectedAlert?.id} to {targetStatus?.toUpperCase()}
                            </div>
                        </div>
                        <div className="col-12">
                            <FormGroup label="Remarks / Resolution Notes">
                                <Textarea
                                    placeholder="Enter details about why this alert is being updated..."
                                    value={remarks}
                                    onChange={(e: any) => setRemarks(e.target.value)}
                                    rows={4}
                                />
                            </FormGroup>
                        </div>
                        {targetStatus === 'suspended' && (
                            <div className="col-12">
                                <div className='d-flex align-items-center justify-content-between mb-3'>
                                    <Label htmlFor='toggle-next-trigger' className='mb-0 fw-bold'>Set Automatic Reactivation?</Label>
                                    <Checks
                                        type='switch'
                                        id='toggle-next-trigger'
                                        checked={isNextTriggerEnabled}
                                        onChange={() => setIsNextTriggerEnabled(!isNextTriggerEnabled)}
                                        label={isNextTriggerEnabled ? 'Yes' : 'No'}
                                    />
                                </div>
                                {isNextTriggerEnabled && (
                                    <FormGroup label="Next Trigger Time" formText="The alert will be reactivated after this time.">
                                        <Input
                                            type="datetime-local"
                                            value={nextTriggerTime}
                                            onChange={(e: any) => setNextTriggerTime(e.target.value)}
                                        />
                                    </FormGroup>
                                )}
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" isLight onClick={() => setIsStatusModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color={
                            targetStatus === 'resolved' ? 'success' :
                                targetStatus === 'dismissed' ? 'secondary' :
                                    targetStatus === 'suspended' ? 'dark' : 'primary'
                        }
                        icon="Save"
                        onClick={handleStatusUpdate}
                        isDisable={updateAlertMutation.isPending || !remarks.trim() || (targetStatus === 'suspended' && isNextTriggerEnabled && !nextTriggerTime)}
                    >
                        Confirm Update
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={isCreateModalOpen} setIsOpen={setIsCreateModalOpen} size="lg">
                <ModalHeader setIsOpen={setIsCreateModalOpen}>
                    Trigger Manual Alert
                </ModalHeader>
                <ModalBody>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <FormGroup label="Alert Type">
                                <Select
                                    ariaLabel='test'
                                    value={newAlert.type}
                                    onChange={(e: any) => setNewAlert({ ...newAlert, type: e.target.value as AlertType })}
                                    list={[
                                        { text: 'High Temperature', value: 'temperature' },
                                        { text: 'High CO2', value: 'co2' },
                                        { text: 'Smoke Detected', value: 'smoke' },
                                        { text: 'Sensor Offline', value: 'offline' },
                                        { text: 'Motion Detected', value: 'motion' },
                                    ]}
                                />
                            </FormGroup>
                        </div>
                        <div className="col-md-6">
                            <FormGroup label="Status">
                                <Select
                                    ariaLabel='test'
                                    value={newAlert.status}
                                    onChange={(e: any) => setNewAlert({ ...newAlert, status: e.target.value as AlertStatus })}
                                    list={[
                                        { text: 'Active', value: 'active' },
                                        { text: 'Warning', value: 'warning' },
                                    ]}
                                />
                            </FormGroup>
                        </div>
                        <div className="col-md-6">
                            <FormGroup label="Sensor">
                                <Select
                                    value={newAlert.sensor?.toString()}
                                    onChange={(e: any) => setNewAlert({ ...newAlert, sensor: parseInt(e.target.value) })}
                                    list={sensors?.map((s: any) => ({ text: s.name, value: s.id.toString() })) || []}
                                    ariaLabel="Select Sensor"
                                />
                            </FormGroup>
                        </div>
                        <div className="col-md-6">
                            <FormGroup label="Area">
                                <Select
                                    value={newAlert.area?.toString()}
                                    onChange={(e: any) => setNewAlert({ ...newAlert, area: parseInt(e.target.value) })}
                                    list={areas?.map((a: any) => ({ text: a.name, value: a.id.toString() })) || []}
                                    ariaLabel="Select Area"
                                />
                            </FormGroup>
                        </div>
                        <div className="col-12">
                            <FormGroup label="Description">
                                <Input
                                    placeholder="Enter alert description..."
                                    value={newAlert.description}
                                    onChange={(e: any) => setNewAlert({ ...newAlert, description: e.target.value })}
                                />
                            </FormGroup>
                        </div>
                        <div className="col-12">
                            <FormGroup label="Remarks">
                                <Input
                                    placeholder="Enter remarks..."
                                    value={newAlert.remarks}
                                    onChange={(e: any) => setNewAlert({ ...newAlert, remarks: e.target.value })}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" isLight onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="danger"
                        icon="ReportProblem"
                        onClick={handleCreateAlert}
                        isDisable={createAlertMutation.isPending}
                    >
                        Trigger Now
                    </Button>
                </ModalFooter>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} title="Confirm Deletion">
                <ModalBody>
                    <div className="text-center p-3">
                        <Icon icon="ReportProblem" size="3x" className="text-danger mb-3" />
                        <h5>Are you sure?</h5>
                        <p className="text-muted">
                            Do you really want to delete this alert log? This action cannot be undone.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setIsDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={confirmDelete}>
                        Delete Log
                    </Button>
                </ModalFooter>
            </Modal>

        </PageWrapper >
    );
};

export default AlertHistory;
