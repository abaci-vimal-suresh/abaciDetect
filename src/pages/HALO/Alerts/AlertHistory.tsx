import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, subHours, isToday } from 'date-fns';
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
    useAlertTrends,
    useAlerts,
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
import { AlertAction, AlertStatus } from '../../../types/sensor';
import Chart, { IChartOptions } from '../../../components/extras/Chart';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import useDarkMode from '../../../hooks/useDarkMode';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AlertRecord {
    id: string;
    originalId: number;
    timestamp: string;
    sensor_name: string;
    area_name: string;
    alert_type: string;
    severity: 'critical' | 'warning' | 'info';
    value: string | number;
    status: AlertStatus | 'Resolved';
    remarks?: string | null;
    resolved_at?: string;
    value_reset_time?: string;
    source: string;
    alert_actions: AlertAction[];
    recheck_next_trigger?: boolean;
}

type SeverityFilter = 'all' | 'critical' | 'warning';
type ChartTimeRange = '24h' | '7d';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapApiAlertToRecord = (alert: any): AlertRecord => ({
    id: `ALH-${1000 + alert.id}`,
    originalId: alert.id,
    timestamp: alert.created_at,
    sensor_name:
        alert.sensor_name ??
        (typeof alert.sensor === 'object' ? alert.sensor?.name : `Sensor-${alert.sensor}`),
    area_name:
        alert.area_name ??
        (typeof alert.area === 'object' ? alert.area?.name : `Area-${alert.area}`),
    alert_type: alert.type,
    severity:
        alert.type.includes('smoke') ||
            alert.type.includes('fire') ||
            alert.type === 'sensor_offline' ||
            alert.status === 'critical'
            ? 'critical'
            : alert.status === 'warning' || alert.type.includes('high')
                ? 'warning'
                : 'info',
    value: alert.description,
    status: alert.status,
    remarks: alert.remarks,
    resolved_at: alert.status === 'resolved' ? alert.updated_at : undefined,
    value_reset_time: alert.value_reset_time ?? undefined,
    source: alert.source,
    alert_actions: alert.alert_actions ?? [],
    recheck_next_trigger: alert.recheck_next_trigger,
});

const STATUS_COLORS: Record<string, string> = {
    active: 'danger',
    acknowledged: 'warning',
    resolved: 'success',
    dismissed: 'secondary',
    suspended: 'dark',
};

const getButtonBaseStyle = (r: number, g: number, b: number, isDark: boolean) => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark ? `rgba(${r},${g},${b},0.15)` : `rgba(${r},${g},${b},0.12)`,
    border: isDark ? 'none' : `1px solid rgba(${r},${g},${b},0.3)`,
    color: isDark ? `rgb(${r},${g},${b})` : `rgb(${Math.floor(r * 0.85)},${Math.floor(g * 0.85)},${Math.floor(b * 0.85)})`,
    transition: 'all 0.2s ease',
});

// ─── Component ────────────────────────────────────────────────────────────────

const AlertHistory = () => {
    const { themeStatus } = useDarkMode();
    const { theme, headerStyle, rowStyle } = useTablestyle();
    const tableRef = useRef<any>();

    // ── Filter & Pagination State ──
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
    const [chartTimeRange, setChartTimeRange] = useState<ChartTimeRange>('7d');
    const [showTableFilters, setShowTableFilters] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // ── Modal State ──
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
    const [alertToDelete, setAlertToDelete] = useState<AlertRecord | null>(null);
    const [selectedDetailAlert, setSelectedDetailAlert] = useState<AlertRecord | null>(null);

    // ── Status Update Form State ──
    const [targetStatus, setTargetStatus] = useState<AlertStatus | null>(null);
    const [statusRemarks, setStatusRemarks] = useState('');
    const [nextTriggerTime, setNextTriggerTime] = useState('');
    const [isRecheckEnabled, setIsRecheckEnabled] = useState(false);

    // ── Create Alert Form State ──
    const [newAlertForm, setNewAlertForm] = useState<{ description: string; area: number | undefined }>({
        description: '',
        area: undefined,
    });

    // ── API Hooks ──
    const { data: trendData } = useAlertTrends({ period: chartTimeRange });
    const { data: alertsData, isLoading: isAlertsLoading } = useAlerts({
        limit: pageSize,
        offset: page * pageSize,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
    });
    const { data: areas } = useAreas();

    const createAlertMutation = useCreateAlert();
    const updateAlertMutation = useUpdateAlert();
    const deleteAlertMutation = useDeleteAlert();

    // ── Derived Data ──
    const alertRecords: AlertRecord[] = useMemo(
        () => (alertsData?.results ?? []).map(mapApiAlertToRecord),
        [alertsData],
    );

    const totalCount = alertsData?.count ?? (alertsData as any)?.total ?? 0;

    const stats = useMemo(() => ({
        total: totalCount,
        critical: (alertsData as any)?.critical_count ?? alertRecords.filter(r => r.severity === 'critical').length,
        warning: (alertsData as any)?.warning_count ?? alertRecords.filter(r => r.severity === 'warning').length,
        resolved: (alertsData as any)?.resolved_count ?? alertRecords.filter(r => r.status === 'resolved' || r.status === 'Resolved').length,
    }), [alertRecords, alertsData, totalCount]);



    // ── Handlers ──
    const openStatusModal = (alert: AlertRecord, status: AlertStatus) => {
        setSelectedAlert(alert);
        setTargetStatus(status);
        setStatusRemarks('');
        setNextTriggerTime('');
        setIsRecheckEnabled(false);
        setIsStatusModalOpen(true);
    };

    const handleStatusUpdate = async () => {
        if (!selectedAlert || !targetStatus) return;

        const payload: any = { status: targetStatus, remarks: statusRemarks };

        if (targetStatus === 'acknowledged') payload.user_acknowledged = 1;
        if (targetStatus === 'suspended') {
            payload.next_trigger_time = nextTriggerTime || null;
            payload.recheck_next_trigger = isRecheckEnabled;
        }

        await updateAlertMutation.mutateAsync({ alertId: selectedAlert.originalId, data: payload });

        setIsStatusModalOpen(false);
        setSelectedAlert(null);
        setTargetStatus(null);
    };

    const handleDeleteConfirm = async () => {
        if (!alertToDelete) return;
        await deleteAlertMutation.mutateAsync(alertToDelete.originalId);
        setIsDeleteModalOpen(false);
        setAlertToDelete(null);
    };

    const handleCreateAlert = async () => {
        if (!newAlertForm.description || !newAlertForm.area) return;
        await createAlertMutation.mutateAsync(newAlertForm as any);
        setIsCreateModalOpen(false);
        setNewAlertForm({ description: '', area: undefined });
    };

    const handleSeverityFilterClick = (clicked: SeverityFilter) => {
        setSeverityFilter(prev => (prev === clicked ? 'all' : clicked));
        setPage(0);
    };

    // ── Chart Config ──
    const chartOptions: IChartOptions = useMemo(() => ({
        series: [{ name: 'Alerts', data: trendData?.data?.chart_data?.values ?? [] }],
        options: {
            chart: { type: 'area', height: 150, sparkline: { enabled: true }, toolbar: { show: false } },
            stroke: { curve: 'smooth', width: 3 },
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
                    stops: [0, 100],
                },
            },
            colors: [themeStatus === 'dark' ? '#a87ca1' : '#7a3a6f'],
            labels: trendData?.data?.chart_data?.labels ?? [],
            tooltip: { theme: themeStatus, y: { formatter: (v: number) => `${v} alerts` } },
            grid: { show: false },
            xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { labels: { show: false } },
            dataLabels: { enabled: false },
            markers: { size: 0, hover: { size: 6, sizeOffset: 3 } },
        },
    }), [trendData, themeStatus]);

    // ── Table Columns ──
    const columns = [
        {
            title: 'Alert Info',
            field: 'alert_type',
            render: (row: AlertRecord) => (
                <div>
                    <div className='fw-bold'>{row.alert_type}</div>
                    <div className='small text-muted' style={{ fontSize: '0.75rem' }}>{row.id}</div>
                </div>
            ),
        },
        {
            title: 'Origin',
            field: 'source',
            render: (row: AlertRecord) => (
                <Badge color={row.source === 'External' ? 'info' : 'secondary'} isLight style={{ fontSize: '0.7rem' }}>
                    {row.source.toUpperCase()}
                </Badge>
            ),
        },
        {
            title: 'Timestamp',
            field: 'timestamp',
            render: (row: AlertRecord) => (
                <div className='d-flex align-items-center' style={{ fontSize: '0.75rem' }}>
                    <Icon icon='Schedule' className='me-2 text-muted' />
                    <div>
                        <div className='fw-bold'>{format(new Date(row.timestamp), 'MMM dd, yyyy')}</div>
                        <div className='small text-muted'>{format(new Date(row.timestamp), 'HH:mm')}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Device / Location',
            field: 'sensor_name',
            render: (row: AlertRecord) => (
                <div style={{ fontSize: '0.75rem' }}>
                    <div className='fw-bold'>{row.sensor_name}</div>
                    <div className='small text-muted'>{row.area_name}</div>
                </div>
            ),
        },
        {
            title: 'Value',
            field: 'value',
            render: (row: AlertRecord) => (
                <div className='fw-bold text-info' style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {row.value}
                </div>
            ),
        },
        {
            title: 'Status',
            field: 'status',
            render: (row: AlertRecord) => (
                <Badge
                    color={(STATUS_COLORS[row.status.toLowerCase()] ?? 'primary') as any}
                    isLight
                    style={{ fontSize: '0.75rem' }}
                >
                    {row.status.toUpperCase()}
                </Badge>
            ),
        },
        {
            title: 'Actions',
            field: 'actions',
            sorting: false,
            filtering: false,
            render: (row: AlertRecord) => {
                const isDark = themeStatus === 'dark';
                return (
                    <div className='d-flex gap-2 align-items-center'>
                        {/* View */}
                        <Button
                            color='primary' isLight icon='Visibility'
                            title='View Details'
                            style={getButtonBaseStyle(77, 105, 250, isDark)}
                            onClick={() => { setSelectedDetailAlert(row); setIsDetailModalOpen(true); }}
                        />
                        {/* Acknowledge (active only) */}
                        {row.status === 'active' && (
                            <Button
                                color='success' isLight icon='CheckCircle'
                                title='Acknowledge'
                                style={getButtonBaseStyle(25, 135, 84, isDark)}
                                onClick={() => openStatusModal(row, 'acknowledged')}
                            />
                        )}
                        {/* Resolve (acknowledged only) */}
                        {row.status === 'acknowledged' && (
                            <Button
                                color='success' isLight icon='TaskAlt'
                                title='Resolve'
                                style={getButtonBaseStyle(25, 135, 84, isDark)}
                                onClick={() => openStatusModal(row, 'resolved')}
                            />
                        )}
                        {/* Dismiss */}
                        {(row.status === 'active' || row.status === 'suspended') && (
                            <Button
                                color='secondary' isLight icon='Block'
                                title='Dismiss'
                                style={getButtonBaseStyle(108, 117, 125, isDark)}
                                onClick={() => openStatusModal(row, 'dismissed')}
                            />
                        )}
                        {/* Suspend (active only) */}
                        {row.status === 'active' && (
                            <Button
                                color='dark' isLight icon='PauseCircle'
                                title='Suspend'
                                style={getButtonBaseStyle(33, 37, 41, isDark)}
                                onClick={() => openStatusModal(row, 'suspended')}
                            />
                        )}
                        {/* Delete */}
                        <Button
                            color='danger' isLight icon='Delete'
                            title='Delete Log'
                            style={getButtonBaseStyle(239, 79, 79, isDark)}
                            onClick={() => { setAlertToDelete(row); setIsDeleteModalOpen(true); }}
                        />
                    </div>
                );
            },
        },
    ];

    // ── Render ──
    return (
        <PageWrapper title='Alert History'>
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
                    <Button className='btn-neumorphic' color='primary' isLight icon='Add' onClick={() => setIsCreateModalOpen(true)}>
                        Trigger Alert
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>
                <div className='row'>
                    {/* ── Stat Cards ── */}
                    {[
                        { label: 'Critical Alerts', value: stats.critical, icon: 'ReportProblem', color: 'danger', filterKey: 'critical' as SeverityFilter },
                        { label: 'Warnings', value: stats.warning, icon: 'Warning', color: 'warning', filterKey: 'warning' as SeverityFilter },
                        { label: 'Cases Resolved', value: stats.resolved, icon: 'CheckCircle', color: 'success', filterKey: null },
                        { label: 'Total Records', value: stats.total, icon: 'SignalCellularAlt', color: 'primary', filterKey: 'all' as SeverityFilter },
                    ].map(({ label, value, icon, color, filterKey }) => (
                        <div key={label} className='col-lg-3 col-md-6 mb-4'>
                            <Card
                                stretch
                                className={`shadow-sm ${filterKey ? 'cursor-pointer' : ''} ${severityFilter === filterKey && filterKey ? 'border-primary' : ''}`}
                                onClick={filterKey ? () => handleSeverityFilterClick(filterKey) : undefined}
                            >
                                <CardBody className='py-4'>
                                    <div className='d-flex align-items-center'>
                                        <div className={`flex-shrink-0 bg-l10-${color} rounded-circle p-3`}>
                                            <Icon icon={icon as any} size='2x' className={`text-${color}`} />
                                        </div>
                                        <div className='flex-grow-1 ms-3 text-end'>
                                            <div className={`h4 fw-bold mb-0 text-${color}`}>{value}</div>
                                            <div className='text-muted small'>{label}</div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    ))}

                    {/* ── Main Card ── */}
                    <div className='col-xl-12 mb-4'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardTitle>Alert Incidence Trend</CardTitle>
                                <CardActions>
                                    <ButtonGroup>
                                        {(['24h', '7d'] as ChartTimeRange[]).map(range => (
                                            <Button
                                                key={range}
                                                color='primary'
                                                isLight={chartTimeRange !== range}
                                                size='sm'
                                                onClick={() => setChartTimeRange(range)}
                                            >
                                                {range === '24h' ? 'Last 24 Hours' : 'Last 7 Days'}
                                            </Button>
                                        ))}
                                    </ButtonGroup>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                <Chart series={chartOptions.series} options={chartOptions.options} type='area' height={200} />

                                <div className='mt-4'>
                                    <ThemeProvider theme={theme}>
                                        <MaterialTable
                                            tableRef={tableRef}
                                            page={page}
                                            totalCount={totalCount}
                                            title={
                                                <div className='d-flex align-items-center'>
                                                    <Icon icon='History' className='me-2 text-primary fs-4' />
                                                    <span className='fw-bold h5 mb-0'>Historical Logs</span>
                                                </div>
                                            }
                                            columns={columns}
                                            data={alertRecords}
                                            isLoading={isAlertsLoading}
                                            onPageChange={(newPage) => setPage(newPage)}
                                            onRowsPerPageChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                                            options={{
                                                headerStyle: { ...headerStyle(), fontWeight: 'bold' },
                                                rowStyle: rowStyle(),
                                                pageSize,
                                                search: true,
                                                filtering: showTableFilters,
                                                showFirstLastPageButtons: true,
                                                paginationType: 'stepped',
                                                actionsColumnIndex: -1,
                                            }}
                                            actions={[
                                                {
                                                    icon: () => <Icon icon='FilterAlt' />,
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
                </div>
            </Page>

            {/* ── Status Update Modal ── */}
            <Modal isOpen={isStatusModalOpen} setIsOpen={setIsStatusModalOpen}>
                <ModalHeader setIsOpen={setIsStatusModalOpen}>
                    Update Alert Status: {targetStatus?.toUpperCase()}
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12 text-center mb-2'>
                            <Icon
                                icon={
                                    targetStatus === 'resolved' ? 'TaskAlt' :
                                        targetStatus === 'dismissed' ? 'Block' :
                                            targetStatus === 'suspended' ? 'PauseCircle' : 'Info'
                                }
                                size='3x'
                                className={`text-${targetStatus === 'resolved' ? 'success' :
                                    targetStatus === 'dismissed' ? 'secondary' :
                                        targetStatus === 'suspended' ? 'dark' : 'primary'
                                    }`}
                            />
                            <div className='mt-2 fw-bold'>
                                Updating Alert {selectedAlert?.id} → {targetStatus?.toUpperCase()}
                            </div>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Remarks / Resolution Notes'>
                                <Textarea
                                    placeholder='Enter details about this status change...'
                                    value={statusRemarks}
                                    onChange={(e: any) => setStatusRemarks(e.target.value)}
                                    rows={4}
                                />
                            </FormGroup>
                        </div>
                        {targetStatus === 'suspended' && (
                            <div className='col-12'>
                                <FormGroup label='Next Trigger Time' formText='Alert will reactivate after this time.'>
                                    <Input
                                        type='datetime-local'
                                        value={nextTriggerTime}
                                        onChange={(e: any) => setNextTriggerTime(e.target.value)}
                                    />
                                </FormGroup>
                                <div className='d-flex align-items-center justify-content-between mt-3 pt-3 border-top'>
                                    <div>
                                        <Label htmlFor='toggle-recheck' className='mb-0 fw-bold'>
                                            Only reactivate if condition persists?
                                        </Label>
                                        <div className='text-muted small mt-1'>
                                            System will check sensor value before reactivating
                                        </div>
                                    </div>
                                    <Checks
                                        type='switch'
                                        id='toggle-recheck'
                                        checked={isRecheckEnabled}
                                        onChange={() => setIsRecheckEnabled(v => !v)}
                                        label={isRecheckEnabled ? 'Yes' : 'No'}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='secondary' isLight onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
                    <Button
                        color={
                            targetStatus === 'resolved' ? 'success' :
                                targetStatus === 'dismissed' ? 'secondary' :
                                    targetStatus === 'suspended' ? 'dark' : 'primary'
                        }
                        icon='Save'
                        onClick={handleStatusUpdate}
                        isDisable={updateAlertMutation.isPending || !statusRemarks.trim()}
                    >
                        Confirm Update
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={isCreateModalOpen} setIsOpen={setIsCreateModalOpen}>
                <ModalHeader setIsOpen={setIsCreateModalOpen}>Trigger Manual Alert</ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
                            <FormGroup label='Area'>
                                <Select
                                    value={newAlertForm.area?.toString()}
                                    onChange={(e: any) => setNewAlertForm(f => ({ ...f, area: parseInt(e.target.value) }))}
                                    list={areas?.map((a: any) => ({ text: a.name, value: a.id.toString() })) ?? []}
                                    ariaLabel='Select Area'
                                />
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Description'>
                                <Input
                                    placeholder='Enter alert description...'
                                    value={newAlertForm.description}
                                    onChange={(e: any) => setNewAlertForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='secondary' isLight onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button
                        color='danger'
                        icon='ReportProblem'
                        onClick={handleCreateAlert}
                        isDisable={createAlertMutation.isPending || !newAlertForm.description.trim() || !newAlertForm.area}
                    >
                        Trigger Now
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} title='Confirm Deletion'>
                <ModalBody>
                    <div className='text-center p-3'>
                        <Icon icon='ReportProblem' size='3x' className='text-danger mb-3' />
                        <h5>Are you sure?</h5>
                        <p className='text-muted'>
                            Do you really want to delete this alert log? This action cannot be undone.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    <Button color='danger' onClick={handleDeleteConfirm}>Delete Log</Button>
                </ModalFooter>
            </Modal>

            {/* ── Alert Detail Modal ── */}
            <Modal isOpen={isDetailModalOpen} setIsOpen={setIsDetailModalOpen} size='lg' isCentered>
                <ModalHeader setIsOpen={setIsDetailModalOpen}>
                    Alert Details: {selectedDetailAlert?.id}
                </ModalHeader>
                <ModalBody>
                    {selectedDetailAlert && (
                        <div className='row g-3'>
                            <div className='col-12 text-center mb-4'>
                                <div
                                    className='mx-auto mb-3'
                                    style={{
                                        width: '80px', height: '80px',
                                        background: '#e0e5ec', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
                                    }}
                                >
                                    <Icon
                                        icon={selectedDetailAlert.severity === 'critical' ? 'ReportProblem' : selectedDetailAlert.severity === 'warning' ? 'Warning' : 'Info'}
                                        size='3x'
                                        className={`text-${selectedDetailAlert.severity === 'critical' ? 'danger' : selectedDetailAlert.severity === 'warning' ? 'warning' : 'primary'}`}
                                    />
                                </div>
                                <div className='h4 fw-bold mb-1'>{selectedDetailAlert.alert_type}</div>
                                <div className='text-muted small'>
                                    ID: {selectedDetailAlert.id} • {format(new Date(selectedDetailAlert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                </div>
                            </div>

                            <div className='col-12'>
                                <div className='border-top pt-3 mb-3'>
                                    <div className='row g-3'>
                                        <div className='col-md-6'>
                                            <Label className='fw-bold text-secondary small text-uppercase mb-1'>Sensor Source</Label>
                                            <div className='d-flex align-items-center p-3 rounded'>
                                                <Icon icon='Sensors' className='me-2 text-primary' />
                                                <span className='fw-bold'>{selectedDetailAlert.sensor_name}</span>
                                            </div>
                                        </div>
                                        <div className='col-md-6'>
                                            <Label className='fw-bold text-secondary small text-uppercase mb-1'>Location Area</Label>
                                            <div className='d-flex align-items-center p-3 rounded'>
                                                <Icon icon='Place' className='me-2 text-info' />
                                                <span className='fw-bold'>{selectedDetailAlert.area_name}</span>
                                            </div>
                                        </div>
                                        <div className='col-md-6'>
                                            <Label className='fw-bold text-secondary small text-uppercase mb-1'>Alert Origin</Label>
                                            <div className='d-flex align-items-center p-3 rounded'>
                                                <Icon icon='Hub' className='me-2 text-warning' />
                                                <Badge color={selectedDetailAlert.source === 'External' ? 'info' : 'secondary'} isLight>
                                                    {selectedDetailAlert.source.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='border-top pt-3 mb-3'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1'>Value / Description</Label>
                                    <div className='p-3 rounded font-monospace'>{selectedDetailAlert.value}</div>
                                </div>

                                {selectedDetailAlert.alert_actions?.length > 0 && (
                                    <div className='border-top pt-3 mb-3'>
                                        <Label className='fw-bold text-secondary small text-uppercase mb-1'>Notification Actions</Label>
                                        <div className='mt-2'>
                                            {selectedDetailAlert.alert_actions.map((action, i) => (
                                                <div
                                                    key={i}
                                                    className='d-flex align-items-center justify-content-between p-2 mb-2 rounded border-start border-4'
                                                    style={{
                                                        background: 'rgba(0,0,0,0.02)',
                                                        borderLeftColor: action.status === 'success' ? '#198754' : action.status === 'failed' ? '#dc3545' : '#ffc107',
                                                    }}
                                                >
                                                    <div className='d-flex align-items-center'>
                                                        <Icon
                                                            icon={action.action_name.toLowerCase().includes('email') ? 'Email' : 'Notifications'}
                                                            className='me-2 text-muted'
                                                        />
                                                        <div>
                                                            <div className='fw-bold small'>{action.action_name}</div>
                                                            <div className='text-muted' style={{ fontSize: '0.7rem' }}>
                                                                {format(new Date(action.executed_at), 'HH:mm:ss')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge color={action.status === 'success' ? 'success' : action.status === 'failed' ? 'danger' : 'warning'} isLight>
                                                        {action.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className='border-top pt-3 mb-3'>
                                    <Label className='fw-bold text-secondary small text-uppercase mb-1'>Remarks / Notes</Label>
                                    <div className='p-3 rounded'>
                                        {selectedDetailAlert.remarks ?? <span className='text-muted fst-italic'>No remarks available</span>}
                                    </div>
                                </div>

                                {(selectedDetailAlert.resolved_at || selectedDetailAlert.value_reset_time) && (
                                    <div className='border-top pt-3'>
                                        <div className='row g-3'>
                                            {selectedDetailAlert.resolved_at && (
                                                <div className='col-md-6'>
                                                    <Label className='fw-bold text-secondary small text-uppercase mb-1'>Resolved At</Label>
                                                    <div className='text-success fw-bold p-2'>
                                                        <Icon icon='CheckCircle' className='me-1' />
                                                        {format(new Date(selectedDetailAlert.resolved_at), 'MMM dd, HH:mm')}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedDetailAlert.value_reset_time && (
                                                <div className='col-md-6'>
                                                    <Label className='fw-bold text-secondary small text-uppercase mb-1'>Condition Cleared</Label>
                                                    <div className='text-success fw-bold p-2'>
                                                        <Icon icon='AutoMode' className='me-1' />
                                                        {format(new Date(selectedDetailAlert.value_reset_time), 'MMM dd, HH:mm')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className='justify-content-center border-0 pb-4'>
                    <Button className='btn-neumorphic px-5 py-2' onClick={() => setIsDetailModalOpen(false)}>
                        Close Details
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper>
    );
};

export default AlertHistory;