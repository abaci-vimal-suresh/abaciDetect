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
            title: 'Alert Info',
            field: 'alert_type',
            sorting: true,
            filtering: true,
            searchable: true,
            export: true,
            filterPlaceholder: 'Filter type...',
            render: (row: AlertRecord) => (
                <div>
                    <div className='fw-bold'>{row.alert_type}</div>
                </div>
            ),
        },
        {
            title: 'Severity',
            field: 'severity',
            sorting: true,
            filtering: true,
            searchable: false,
            export: true,
            // ✅ lookup renders as dropdown in filter row
            lookup: {
                critical: 'Critical',
                warning: 'Warning',
                info: 'Info',
            },
            render: (row: AlertRecord) => {
                const colorMap: Record<string, string> = {
                    critical: '#dc3545',
                    warning: '#fd7e14',
                    info: '#0dcaf0',
                };
                return (
                    <Badge
                        isLight
                        style={{
                            fontSize: '0.7rem',
                            backgroundColor: `${colorMap[row.severity]}22`,
                            color: colorMap[row.severity],
                            border: `1px solid ${colorMap[row.severity]}55`,
                        }}>
                        {row.severity.toUpperCase()}
                    </Badge>
                );
            },
        },
        {
            title: 'Origin',
            field: 'source',
            sorting: true,
            filtering: true,
            searchable: false,
            export: true,
            // ✅ lookup renders as dropdown in filter row
            lookup: { External: 'External', Internal: 'Internal' },
            render: (row: AlertRecord) => (
                <Badge color={row.source === 'External' ? 'info' : 'secondary'} isLight style={{ fontSize: '0.7rem' }}>
                    {row.source.toUpperCase()}
                </Badge>
            ),
        },

        {
            title: 'Location',
            field: 'sensor_name',
            sorting: true,
            filtering: true,
            searchable: true,
            export: true,
            filterPlaceholder: 'Filter device...',
            // ✅ customFilterAndSearch to search both sensor and area
            customFilterAndSearch: (term: string, row: AlertRecord) =>
                `${row.sensor_name} ${row.area_name}`.toLowerCase().includes(term.toLowerCase()),
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
            sorting: false,
            filtering: false,
            searchable: true,
            export: true,
            render: (row: AlertRecord) => (
                <div className='fw-bold text-info' style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {row.value}
                </div>
            ),
        },
        {
            title: 'Status',
            field: 'status',
            sorting: true,
            filtering: true,
            searchable: false,
            export: true,
            // ✅ lookup renders as dropdown in filter row
            lookup: {
                active: 'Active',
                acknowledged: 'Acknowledged',
                resolved: 'Resolved',
                dismissed: 'Dismissed',
                suspended: 'Suspended',
            },
            render: (row: AlertRecord) => (
                <Badge color={(STATUS_COLORS[row.status.toLowerCase()] ?? 'primary') as any} isLight style={{ fontSize: '0.75rem' }}>
                    {row.status.toUpperCase()}
                </Badge>
            ),
        },
        {
            title: 'Actions',
            field: 'actions',
            sorting: false,
            filtering: false,
            searchable: false,
            export: false,                            // ✅ don't export action buttons
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
                                stretch isNeumorphic
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

                    {/* ── Trend Chart Card ── */}
                    <div className='col-xl-12 mb-4'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardTitle>
                                    <Icon icon='History' className='me-2' />
                                    Alert Incidence Trend
                                </CardTitle>
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
                            </CardBody>
                        </Card>
                    </div>

                    {/* ── Alert Table Card ── */}
                    <div className='col-xl-12 mb-4'>
                        <Card stretch className='shadow-sm'>
                            <CardHeader borderSize={1}>
                                <CardTitle>
                                    <Icon icon='History' className='me-2' />
                                    Historical Logs
                                </CardTitle>
                                <CardActions>
                                    <Button
                                        className='btn-neumorphic'
                                        color='light'
                                        icon='FilterAlt'
                                        isLight
                                        onClick={() => setShowTableFilters(prev => !prev)}
                                    >
                                        {showTableFilters ? 'Hide Filters' : 'Filters'}
                                    </Button>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                <div style={{ overflowY: 'auto' }}>
                                    <ThemeProvider theme={theme}>
                                        <MaterialTable
                                            tableRef={tableRef}
                                            totalCount={totalCount}
                                            title=''
                                            columns={columns}
                                            data={alertRecords}
                                            isLoading={isAlertsLoading}

                                            onPageChange={(newPage) => setPage(newPage)}
                                            onRowsPerPageChange={(newSize) => { setPageSize(newSize); setPage(0); }}

                                            onSearchChange={() => setPage(0)}

                                            onOrderChange={() => setPage(0)}

                                            options={{
                                                headerStyle: { ...headerStyle(), fontWeight: 'bold' },
                                                rowStyle: (rowData: AlertRecord, index: number) => ({
                                                    ...rowStyle(),
                                                    backgroundColor: index % 2 === 0
                                                        ? undefined
                                                        : themeStatus === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                    borderLeft: rowData.severity === 'critical'
                                                        ? '3px solid #dc3545'
                                                        : rowData.severity === 'warning'
                                                            ? '3px solid #fd7e14'
                                                            : '3px solid transparent',
                                                }),

                                                paging: true,
                                                pageSize,
                                                pageSizeOptions: [5, 10, 20, 50],
                                                paginationType: 'stepped',
                                                numberOfPagesAround: 2,
                                                paginationPosition: 'bottom',
                                                showFirstLastPageButtons: true,
                                                emptyRowsWhenPaging: false,

                                                // ── Search ──
                                                search: true,
                                                searchAutoFocus: false,
                                                searchFieldAlignment: 'right',
                                                searchFieldVariant: 'outlined',
                                                searchFieldStyle: { borderRadius: '8px', fontSize: '0.85rem' },
                                                debounceInterval: 400,

                                                // ── Filter ──
                                                filtering: showTableFilters,
                                                filterCellStyle: { paddingTop: '4px', paddingBottom: '4px' },

                                                // ── Sorting ──
                                                sorting: true,
                                                thirdSortClick: false,

                                                columnsButton: true,

                                                // ── Layout & Padding ──
                                                padding: 'dense',
                                                tableLayout: 'auto',
                                                maxBodyHeight: '600px',
                                                actionsColumnIndex: -1,

                                                // ── Loading ──
                                                loadingType: 'overlay',

                                                // ── Toolbar ──
                                                toolbar: true,
                                                showTitle: false,
                                                toolbarButtonAlignment: 'right',

                                                // ── Empty State ──
                                                showEmptyDataSourceMessage: true,

                                                // ── Draggable Columns ──
                                                draggable: true,
                                            }}

                                            localization={{
                                                toolbar: {
                                                    searchPlaceholder: 'Search alerts...',
                                                    searchTooltip: 'Search alerts',
                                                    exportTitle: 'Export',
                                                    exportCSVName: 'Export as CSV',
                                                    showColumnsTitle: 'Show / Hide Columns',
                                                    showColumnsAriaLabel: 'Show / Hide Columns',
                                                    addRemoveColumns: 'Show or hide columns',
                                                },
                                                pagination: {
                                                    labelRowsPerPage: 'Rows per page:',
                                                    labelDisplayedRows: '{from}-{to} of {count}',
                                                    firstTooltip: 'First Page',
                                                    previousTooltip: 'Previous Page',
                                                    nextTooltip: 'Next Page',
                                                    lastTooltip: 'Last Page',
                                                    labelRows: 'rows',
                                                },
                                                body: {
                                                    emptyDataSourceMessage: 'No alerts found.',
                                                    filterRow: {
                                                        filterTooltip: 'Filter',
                                                    },
                                                },
                                            }}
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