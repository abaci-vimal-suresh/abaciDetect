import React, { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
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
import { useAlertTrends, useAlerts, useAreas } from '../../../api/sensors.api';
import { AlertStatus } from '../../../types/sensor';
import Chart, { IChartOptions } from '../../../components/extras/Chart';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import useDarkMode from '../../../hooks/useDarkMode';

import AlertDetailModal from './modals/AlertDetailModal';
import AlertStatusModal from './modals/AlertStatusModal';
import AlertCreateModal from './modals/AlertCreateModal';
import { useAlertActions } from './hooks/useAlertActions';

// ─── Types ────────────────────────────────────────────────────────────────────
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
    alert_actions: any[];
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
    width: '36px', height: '36px', borderRadius: '8px', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
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

    // ── Detail Modal State ──
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetailAlert, setSelectedDetailAlert] = useState<AlertRecord | null>(null);

    // ── Actions Hook ──
    const {
        updateAlertMutation, createAlertMutation,
        isStatusModalOpen, setIsStatusModalOpen,
        selectedAlert, targetStatus,
        statusRemarks, setStatusRemarks,
        nextTriggerTime, setNextTriggerTime,
        isRecheckEnabled, setIsRecheckEnabled,
        openStatusModal, handleStatusUpdate,
        handleDeleteAlert,
        isCreateModalOpen, setIsCreateModalOpen,
        newAlertForm, setNewAlertForm, handleCreateAlert,
    } = useAlertActions();

    // ── API ──
    const { data: trendData } = useAlertTrends({ period: chartTimeRange });
    const { data: alertsData, isLoading: isAlertsLoading } = useAlerts({
        limit: pageSize,
        offset: page * pageSize,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
    });
    const { data: areas } = useAreas();

    // ── Derived Data ──
    const alertRecords: AlertRecord[] = useMemo(
        () => (alertsData?.results ?? []).map(mapApiAlertToRecord),
        [alertsData],
    );

    const totalCount = alertsData?.count ?? 0;

    const stats = useMemo(() => ({
        total: totalCount,
        critical: alertsData?.critical_count ?? alertRecords.filter(r => r.severity === 'critical').length,
        warning: alertsData?.warning_count ?? alertRecords.filter(r => r.severity === 'warning').length,
        resolved: alertsData?.resolved_count ?? alertRecords.filter(r => r.status === 'resolved' || r.status === 'Resolved').length,
    }), [alertRecords, alertsData, totalCount]);

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
                    type: 'vertical', shadeIntensity: 0.5,
                    gradientToColors: [themeStatus === 'dark' ? '#7a3a6f' : '#a87ca1'],
                    inverseColors: true,
                    opacityFrom: themeStatus === 'dark' ? 0.5 : 0.4,
                    opacityTo: 0.1, stops: [0, 100],
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
            title: 'Alert Info', field: 'alert_type',
            render: (row: AlertRecord) => (
                <div>
                    <div className='fw-bold'>{row.alert_type}</div>
                    <div className='small text-muted' style={{ fontSize: '0.75rem' }}>{row.id}</div>
                </div>
            ),
        },
        {
            title: 'Origin', field: 'source',
            render: (row: AlertRecord) => (
                <Badge color={row.source === 'External' ? 'info' : 'secondary'} isLight style={{ fontSize: '0.7rem' }}>
                    {row.source.toUpperCase()}
                </Badge>
            ),
        },
        {
            title: 'Timestamp', field: 'timestamp',
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
            title: 'Device / Location', field: 'sensor_name',
            render: (row: AlertRecord) => (
                <div style={{ fontSize: '0.75rem' }}>
                    <div className='fw-bold'>{row.sensor_name}</div>
                    <div className='small text-muted'>{row.area_name}</div>
                </div>
            ),
        },
        {
            title: 'Value', field: 'value',
            render: (row: AlertRecord) => (
                <div className='fw-bold text-info' style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {row.value}
                </div>
            ),
        },
        {
            title: 'Status', field: 'status',
            render: (row: AlertRecord) => (
                <Badge color={(STATUS_COLORS[row.status.toLowerCase()] ?? 'primary') as any} isLight style={{ fontSize: '0.75rem' }}>
                    {row.status.toUpperCase()}
                </Badge>
            ),
        },
        {
            title: 'Actions', field: 'actions', sorting: false, filtering: false,
            render: (row: AlertRecord) => {
                const isDark = themeStatus === 'dark';
                return (
                    <div className='d-flex gap-2 align-items-center'>
                        <Button color='primary' isLight icon='Visibility' title='View Details'
                            style={getButtonBaseStyle(77, 105, 250, isDark)}
                            onClick={() => { setSelectedDetailAlert(row); setIsDetailModalOpen(true); }}
                        />
                        {row.status === 'active' && (
                            <Button color='success' isLight icon='CheckCircle' title='Acknowledge'
                                style={getButtonBaseStyle(25, 135, 84, isDark)}
                                onClick={() => openStatusModal(row, 'acknowledged')}
                            />
                        )}
                        {row.status === 'acknowledged' && (
                            <Button color='success' isLight icon='TaskAlt' title='Resolve'
                                style={getButtonBaseStyle(25, 135, 84, isDark)}
                                onClick={() => openStatusModal(row, 'resolved')}
                            />
                        )}
                        {(row.status === 'active' || row.status === 'suspended') && (
                            <Button color='secondary' isLight icon='Block' title='Dismiss'
                                style={getButtonBaseStyle(108, 117, 125, isDark)}
                                onClick={() => openStatusModal(row, 'dismissed')}
                            />
                        )}
                        {row.status === 'active' && (
                            <Button color='dark' isLight icon='PauseCircle' title='Suspend'
                                style={getButtonBaseStyle(33, 37, 41, isDark)}
                                onClick={() => openStatusModal(row, 'suspended')}
                            />
                        )}
                        <Button color='danger' isLight icon='Delete' title='Delete Log'
                            style={getButtonBaseStyle(239, 79, 79, isDark)}
                            onClick={(e: any) => handleDeleteAlert(row, e)}
                        />
                    </div>
                );
            },
        },
    ];

    return (
        <PageWrapper title='Alert History'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb list={[
                        { title: 'HALO', to: '/halo' },
                        { title: 'Alert History', to: '/halo/alerts' },
                    ]} />
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
                                            <Button key={range} color='primary' isLight={chartTimeRange !== range} size='sm' onClick={() => setChartTimeRange(range)}>
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

            {/* ── Modals ── */}
            <AlertDetailModal
                isOpen={isDetailModalOpen}
                setIsOpen={setIsDetailModalOpen}
                alert={selectedDetailAlert}
            />

            <AlertStatusModal
                isOpen={isStatusModalOpen}
                setIsOpen={setIsStatusModalOpen}
                selectedAlert={selectedAlert}
                targetStatus={targetStatus}
                statusRemarks={statusRemarks}
                setStatusRemarks={setStatusRemarks}
                nextTriggerTime={nextTriggerTime}
                setNextTriggerTime={setNextTriggerTime}
                isRecheckEnabled={isRecheckEnabled}
                setIsRecheckEnabled={setIsRecheckEnabled}
                onConfirm={handleStatusUpdate}
                isPending={updateAlertMutation.isPending}
            />

            <AlertCreateModal
                isOpen={isCreateModalOpen}
                setIsOpen={setIsCreateModalOpen}
                areas={areas}
                description={newAlertForm.description}
                area={newAlertForm.area}
                onDescriptionChange={(v) => setNewAlertForm(f => ({ ...f, description: v }))}
                onAreaChange={(v) => setNewAlertForm(f => ({ ...f, area: v }))}
                onConfirm={handleCreateAlert}
                isPending={createAlertMutation.isPending}
            />
        </PageWrapper>
    );
};

export default AlertHistory;