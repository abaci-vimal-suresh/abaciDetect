import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from '../../../../layout/Page/Page';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Spinner from '../../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import {
    useAreas,
    useCreateSubArea,
    useSensors,
    useUsers,
    useUpdateSensor,
    useDeleteArea,
    useAggregatedSensorData,
} from '../../../../api/sensors.api';
import { Area, User } from '../../../../types/sensor';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Label from '../../../../components/bootstrap/forms/Label';
import { useQueryClient } from '@tanstack/react-query';
import { filterSensors } from '../../utils/sensorData.utils';
import { buildAreaBreadcrumbPath } from '../../utils/navigation.utils';
import EditAreaModal from '../modals/EditAreaModal';
import Chart from '../../../../components/extras/Chart';
import Swal from 'sweetalert2';
import {
    getEffectiveConfig,
    buildProcessedMetrics,
    buildEventStatuses,
    ProcessedMetric,
} from '../../utils/radarMapping.utils';

// ── Metric Groups ─────────────────────────────────────────────────────────────
const METRIC_GROUPS = [
    { key: 'room_conditions', label: 'Room Conditions', icon: 'Thermostat', metricKeys: ['temperature', 'humidity', 'pressure', 'light'] },
    { key: 'air_particles', label: 'Air Dust & Particles', icon: 'Grain', metricKeys: ['pm1', 'pm25', 'pm10'] },
    { key: 'air_composition', label: 'Air Composition', icon: 'Science', metricKeys: ['co', 'co2', 'tvoc', 'nh3', 'no2'] },
    { key: 'air_quality', label: 'Air Quality Score', icon: 'Shield', metricKeys: ['aqi', 'health'] },
    { key: 'movement', label: 'Activity & Movement', icon: 'DirectionsRun', metricKeys: ['movement'] },
    { key: 'sound', label: 'Sound & Noise', icon: 'VolumeUp', metricKeys: ['noise'] },
];

// ── Mini Gauge Card ───────────────────────────────────────────────────────────
const MiniGauge: React.FC<{ metric: ProcessedMetric }> = ({ metric }) => {
    const pct = parseFloat(metric.normalizedValue.toFixed(1));
    const color = metric.statusColor;

    const statusLabel = metric.isScaleMismatch
        ? '⚠ Setup needed'
        : metric.isAutoConverted
            ? '✓ Calibrated'
            : pct >= 90 ? '⚠ Critical'
                : pct >= 70 ? '△ Warning'
                    : '✓ Safe';

    const options: any = {
        chart: {
            type: 'radialBar',
            sparkline: { enabled: true },
            animations: { enabled: true, speed: 800, easing: 'easeinout' },
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { size: '55%', background: 'transparent' },
                track: {
                    background: `${color}22`,
                    strokeWidth: '100%',
                    margin: 0,
                },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 5,
                        fontSize: '14px',
                        fontWeight: 800,
                        color: color,
                        formatter: () => `${pct}%`,
                    },
                },
            },
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.3,
                gradientToColors: [color],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100],
            },
            colors: [color],
        },
        stroke: { lineCap: 'round' },
        tooltip: { enabled: false },
    };

    return (
        <div
            className='rounded-3 p-3 d-flex flex-column align-items-center text-center h-100'
            style={{
                border: `1.5px solid ${color}44`,
                background: `${color}08`,
                transition: 'all 0.2s ease',
                cursor: 'default',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 6px 24px ${color}33`;
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
            }}
        >
            {/* Gauge chart */}
            <div style={{ width: 110, height: 85, marginBottom: 0 }}>
                <Chart
                    type='radialBar'
                    series={[pct]}
                    options={options}
                    height={110}
                    width={110}
                />
            </div>

            {/* Metric label */}
            <div className='fw-bold' style={{ fontSize: '0.75rem', color: '#111827', lineHeight: 1.2, marginBottom: 4 }}>
                {metric.label}
            </div>

            {/* Raw value — big and prominent */}
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: color, lineHeight: 1 }}>
                {metric.rawMax}
                <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#9ca3af', marginLeft: 2 }}>
                    {metric.unit}
                </span>
            </div>

            {/* Min value */}
            {metric.rawMin !== metric.rawMax && (
                <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: 1 }}>
                    min: {metric.rawMin} {metric.unit}
                </div>
            )}

            {/* Threshold reference */}
            {metric.hasThreshold && !metric.isScaleMismatch && (
                <div style={{ fontSize: '0.58rem', color: '#d1d5db', marginTop: 1 }}>
                    limit: {metric.thresholdMax} {metric.unit}
                </div>
            )}

            {/* Mismatch hint */}
            {metric.isScaleMismatch && (
                <div style={{ fontSize: '0.58rem', color: '#9ca3af', marginTop: 1, fontStyle: 'italic' }}>
                    Check unit/threshold
                </div>
            )}

            {/* Conversion hint */}
            {metric.isAutoConverted && (
                <div style={{ fontSize: '0.58rem', color: '#10b981', marginTop: 1, fontStyle: 'italic' }}>
                    inHg → hPa
                </div>
            )}

            {/* Status pill */}
            <div
                className='rounded-pill mt-2 px-2 py-1'
                style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    background: `${color}22`,
                    color: color,
                    letterSpacing: '0.03em',
                }}
            >
                {statusLabel}
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AreaZoneView = () => {
    const { areaId, subzoneId } = useParams<{ areaId: string; subzoneId?: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const isSubzone = !!subzoneId;
    const activeId = subzoneId ?? areaId;

    // ── Data fetching ────────────────────────────────────────────────────────
    const { data: areas, isLoading: areasLoading } = useAreas();
    const { data: users } = useUsers();
    const { data: zoneSensors = [], isLoading: sensorsLoading } = useSensors({ areaId: activeId || undefined });
    const { data: allUnassignedSensors = [] } = useSensors();
    const { data: aggregatedResponse } = useAggregatedSensorData({
        area_id: activeId ? [Number(activeId)] : [],
    });

    const createSubAreaMutation = useCreateSubArea();
    const updateSensorMutation = useUpdateSensor();
    const deleteAreaMutation = useDeleteArea();

    // ── UI State ─────────────────────────────────────────────────────────────
    const [isSubAreaModalOpen, setIsSubAreaModalOpen] = useState(false);
    const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedSensorId, setSelectedSensorId] = useState('');
    const [selectedTargetAreaId, setSelectedTargetAreaId] = useState('');
    const [sensorX, setSensorX] = useState(0);
    const [sensorY, setSensorY] = useState(0);
    const [sensorZ, setSensorZ] = useState(0);
    const [subAreaName, setSubAreaName] = useState('');
    const [subAreaType, setSubAreaType] = useState('others');
    const [subAreaPlan, setSubAreaPlan] = useState<File | null>(null);
    const [subOffsetX, setSubOffsetX] = useState(0);
    const [subOffsetY, setSubOffsetY] = useState(0);
    const [subOffsetZ, setSubOffsetZ] = useState(0);
    const [subScaleFactor, setSubScaleFactor] = useState(1.0);
    const [personInChargeIds, setPersonInChargeIds] = useState<number[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!subAreaPlan) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(subAreaPlan);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [subAreaPlan]);

    // ── Derived area data ─────────────────────────────────────────────────────
    const parentArea = useMemo(() => areas?.find(a => a.id === Number(areaId)), [areas, areaId]);
    const currentZone = useMemo(() => areas?.find(a => a.id === Number(activeId)), [areas, activeId]);

    const childSubAreas = useMemo(() => {
        const ids = currentZone?.subareas || [];
        if (!areas || ids.length === 0) return [];
        return ids.map((id: number) => areas.find(a => a.id === id)).filter((a): a is Area => a !== undefined);
    }, [currentZone, areas]);

    const filteredChildSubAreas = useMemo(
        () => childSubAreas.filter(a => (a.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
        [childSubAreas, searchTerm],
    );

    const availableSensors = useMemo(
        () => allUnassignedSensors.filter(s => !s.area && !s.area_name),
        [allUnassignedSensors],
    );

    const sensors = useMemo(
        () => zoneSensors.map(s => ({ ...s, x_coordinate: s.x_coordinate ?? s.x_val, y_coordinate: s.y_coordinate ?? s.y_val })),
        [zoneSensors],
    );

    const filteredSensors = useMemo(
        () => filterSensors(sensors, searchTerm, filterStatus),
        [sensors, searchTerm, filterStatus],
    );

    const breadcrumbList = useMemo(() => {
        const base = [
            { title: 'Areas', to: '/halo/sensors/areas' },
            { title: parentArea?.name || 'Area', to: `/halo/sensors/areas/${areaId}/subzones` },
        ];
        if (isSubzone) return [...base, ...buildAreaBreadcrumbPath(currentZone, areas, areaId || '')];
        return base;
    }, [isSubzone, parentArea, currentZone, areas, areaId]);

    // ── Metrics ───────────────────────────────────────────────────────────────
    const effectiveConfig = useMemo(() => getEffectiveConfig(currentZone, areas), [currentZone, areas]);
    const aggData = useMemo(() => aggregatedResponse?.aggregated_data || {}, [aggregatedResponse]);
    const hasNoConfig = Object.keys(effectiveConfig).length === 0;

    const allProcessedMetrics = useMemo(
        () => buildProcessedMetrics(aggData, effectiveConfig),
        [aggData, effectiveConfig],
    );

    const displayedMetrics = useMemo(() => {
        if (!activeGroupKey) return allProcessedMetrics;
        const group = METRIC_GROUPS.find(g => g.key === activeGroupKey);
        return group ? buildProcessedMetrics(aggData, effectiveConfig, group.metricKeys) : allProcessedMetrics;
    }, [activeGroupKey, aggData, effectiveConfig, allProcessedMetrics]);

    const eventStatuses = useMemo(() => buildEventStatuses(aggData), [aggData]);

    // Summary counts for the 4 stat cards
    const summaryStats = useMemo(() => {
        if (allProcessedMetrics.length === 0) return null;
        const avg = allProcessedMetrics.reduce((s, m) => s + m.normalizedValue, 0) / allProcessedMetrics.length;
        const critical = allProcessedMetrics.filter(m => m.normalizedValue >= 90).length;
        const warning = allProcessedMetrics.filter(m => m.normalizedValue >= 70 && m.normalizedValue < 90).length;
        const safe = allProcessedMetrics.filter(m => m.normalizedValue < 70).length;
        return { avg, critical, warning, safe, total: allProcessedMetrics.length };
    }, [allProcessedMetrics]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const isDark = () =>
        document.documentElement.className.includes('dark') ||
        document.documentElement.getAttribute('data-bs-theme') === 'dark';

    const swalTheme = () => ({
        background: isDark() ? '#1a1a1a' : '#fff',
        color: isDark() ? '#fff' : '#000',
    });

    const resetSubAreaForm = () => {
        setSubAreaName(''); setSubAreaType('others'); setSubAreaPlan(null);
        setSubOffsetX(0); setSubOffsetY(0); setSubOffsetZ(0);
        setSubScaleFactor(1.0); setPersonInChargeIds([]); setError('');
    };

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleAddSensor = () => {
        const targetId = isSubzone ? activeId : (selectedTargetAreaId || activeId);
        if (!selectedSensorId || !targetId) return;
        updateSensorMutation.mutate(
            { sensorId: selectedSensorId, data: { area: Number(targetId), x_val: sensorX, y_val: sensorY, z_val: sensorZ } },
            { onSuccess: () => { setIsSensorModalOpen(false); setSelectedSensorId(''); setSelectedTargetAreaId(''); setSensorX(0); setSensorY(0); setSensorZ(0); } },
        );
    };

    const handleCreateSubArea = () => {
        if (!subAreaName.trim()) { setError('Sub area name is required'); return; }
        const formData = new FormData();
        formData.append('name', subAreaName);
        formData.append('area_type', subAreaType);
        formData.append('parent_id', activeId || '');
        formData.append('offset_x', subOffsetX.toString());
        formData.append('offset_y', subOffsetY.toString());
        formData.append('offset_z', subOffsetZ.toString());
        formData.append('scale_factor', subScaleFactor.toString());
        if (subAreaPlan) formData.append('area_plan', subAreaPlan);
        personInChargeIds.forEach(id => formData.append('person_in_charge_ids', id.toString()));
        createSubAreaMutation.mutate(formData, {
            onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['areas'] }); setIsSubAreaModalOpen(false); resetSubAreaForm(); },
        });
    };

    const handleChildCardClick = (childId: number) => navigate(`/halo/sensors/areas/${areaId}/subzones/${childId}`);
    const handleEditClick = (e: React.MouseEvent, area: Area) => { e.stopPropagation(); setEditingArea(area); setIsEditModalOpen(true); };
    const handleDeleteArea = (e: React.MouseEvent, area: Area) => {
        e.stopPropagation();
        Swal.fire({ title: 'Are you sure?', text: `You are about to delete "${area.name}".`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!', ...swalTheme() })
            .then(r => { if (r.isConfirmed) deleteAreaMutation.mutate(area.id); });
    };
    const handleUnassignSensor = (e: React.MouseEvent, sensor: any) => {
        e.stopPropagation();
        Swal.fire({ title: 'Unassign Sensor?', text: `Remove "${sensor.name}" from this area?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, unassign', cancelButtonText: 'Cancel', buttonsStyling: false, customClass: { confirmButton: 'btn btn-danger mx-2', cancelButton: 'btn btn-secondary mx-2' }, ...swalTheme() })
            .then(r => { if (r.isConfirmed) updateSensorMutation.mutate({ sensorId: sensor.id, data: { area: null } }); });
    };

    if (areasLoading || sensorsLoading) {
        return (
            <PageWrapper title='Area'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title={currentZone?.name || 'Area'}>

            <SubHeader>
                <SubHeaderLeft><Breadcrumb list={breadcrumbList} /></SubHeaderLeft>
                <SubHeaderRight>
                    <div className='d-flex gap-3'>
                        {!isSubzone && (
                            <Button isNeumorphic color='info' icon='ViewInAr' onClick={() => navigate(`/halo/sensors/areas/${areaId}/3d`)}>
                                3D View
                            </Button>
                        )}
                        <Button isNeumorphic color='info' icon='Add' onClick={() => setIsSubAreaModalOpen(true)}>Create Sub Area</Button>
                        <Button isNeumorphic color='primary' icon='Sensors' onClick={() => setIsSensorModalOpen(true)}>Add Sensor</Button>
                    </div>
                </SubHeaderRight>
            </SubHeader>

            <Page container='fluid'>

                {/* ── No config warning ── */}
                {hasNoConfig && (
                    <div className='alert alert-warning d-flex align-items-center mb-4' role='alert'>
                        <Icon icon='WarningAmber' className='me-2' />
                        <span>No threshold configuration found for this area. Gauges will show raw values without color status.</span>
                    </div>
                )}

                {/* ── Summary stat cards ── */}
                {summaryStats && (
                    <div className='row g-3 mb-4'>
                        {[
                            { label: 'Active Metrics', value: summaryStats.total, color: '#6366f1', border: '#6366f133' },
                            { label: 'Safe', value: summaryStats.safe, color: '#10b981', border: '#10b98133' },
                            { label: 'Warning', value: summaryStats.warning, color: '#f59e0b', border: '#f59e0b33' },
                            { label: 'Critical', value: summaryStats.critical, color: '#ef4444', border: '#ef444433' },
                        ].map(stat => (
                            <div key={stat.label} className='col-6 col-md-3'>
                                <Card className='shadow-none text-center h-100' style={{ border: `1px solid ${stat.border}` }}>
                                    <CardBody className='py-3'>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                                            {stat.value}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>{stat.label}</div>
                                    </CardBody>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}



                {/* {eventStatuses.length > 0 && (
                    <Card className='shadow-none border border-light mb-4'>
                        <CardHeader className='bg-transparent'>
                            <CardTitle>
                                <Icon icon='NotificationsActive' className='me-2 text-warning' />
                                Detection Events
                            </CardTitle>
                            <CardActions>
                                <Badge color={eventStatuses.some(e => e.triggered) ? 'danger' : 'success'} isLight className='px-3 py-2'>
                                    {eventStatuses.some(e => e.triggered)
                                        ? `${eventStatuses.filter(e => e.triggered).length} Active`
                                        : 'All Clear'}
                                </Badge>
                            </CardActions>
                        </CardHeader>
                        <CardBody>
                            <div className='row g-3'>
                                {eventStatuses.map(evt => (
                                    <div key={evt.key} className='col-6 col-md-4 col-lg-3 col-xl-2'>
                                        <div
                                            className='rounded-2 p-3 d-flex flex-column align-items-center text-center'
                                            style={{
                                                border: `1px solid ${evt.triggered ? '#ef444433' : '#10b98133'}`,
                                                background: evt.triggered ? '#ef444411' : '#10b98111',
                                            }}
                                        >
                                            <Icon
                                                icon={evt.triggered ? 'Error' : 'CheckCircle'}
                                                className='mb-1'
                                                style={{ color: evt.triggered ? '#ef4444' : '#10b981', fontSize: '1.5rem' }}
                                            />
                                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151' }}>{evt.label}</div>
                                            <Badge color={evt.triggered ? 'danger' : 'success'} isLight className='mt-1' style={{ fontSize: '0.6rem' }}>
                                                {evt.triggered ? 'Triggered' : 'Clear'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )} */}

                {/* ── Filter Bar ── */}
                <div className='row mb-4'>
                    <div className='col-12'>
                        <Card>
                            <CardBody>
                                <div className='row g-3 align-items-end'>
                                    <div className='col-md-6'>
                                        <FormGroup label='Search'>
                                            <div className='input-group'>
                                                <span className='input-group-text'><Icon icon='Search' /></span>
                                                <Input type='text' placeholder='Search by name, MAC address, or type...' value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} />
                                            </div>
                                        </FormGroup>
                                    </div>
                                    <div className='col-md-3'>
                                        <FormGroup label='Status Filter'>
                                            <select className='form-select' value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                                                <option value='all'>All Status</option>
                                                <option value='active'>Active Only</option>
                                                <option value='inactive'>Inactive Only</option>
                                            </select>
                                        </FormGroup>
                                    </div>
                                    <div className='col-md-3'>
                                        <Button className='w-100' onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}>Clear Filters</Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* ── Child Sub Areas ── */}
                <div className='mb-4'>
                    <div className='d-flex align-items-center justify-content-between mb-3'>
                        <div className='d-flex align-items-center'>
                            <Icon icon={isSubzone ? 'AccountTree' : 'GroupWork'} className='me-2 fs-4' />
                            <span className='h5 mb-0 fw-bold'>{isSubzone ? `Sub Areas of ${currentZone?.name}` : 'Sub Areas'}</span>
                        </div>
                        <Badge color='info' isLight className='fs-6'>{filteredChildSubAreas.length} of {childSubAreas.length}</Badge>
                    </div>
                    <div className='row g-4 mb-4'>
                        {childSubAreas.length === 0 ? (
                            <div className='col-12'>
                                <Card>
                                    <CardBody className='text-center py-4'>
                                        <Icon icon='AccountTree' className='display-4 text-muted mb-3' />
                                        <h5 className='text-muted mb-2'>No sub-areas here</h5>
                                        <p className='text-muted small mb-3'>This area has no sub-areas yet.</p>
                                        <Button color='info' icon='Add' size='sm' onClick={() => setIsSubAreaModalOpen(true)}>Create Sub Area</Button>
                                    </CardBody>
                                </Card>
                            </div>
                        ) : filteredChildSubAreas.length === 0 ? (
                            <div className='col-12'>
                                <Card><CardBody className='text-center py-3'><p className='text-muted small mb-0'>No sub-areas match your search.</p></CardBody></Card>
                            </div>
                        ) : (
                            filteredChildSubAreas.map(child => (
                                <div key={child.id} className='col-md-6 col-xl-4'>
                                    <Card stretch className='cursor-pointer' style={{ cursor: 'pointer' }} onClick={() => handleChildCardClick(child.id)}>
                                        <CardHeader>
                                            <CardTitle>{child.name}</CardTitle>
                                            <CardActions>
                                                <Button color='info' isLight icon='Edit' size='sm' onClick={(e: any) => handleEditClick(e, child)} className='me-1' />
                                                <Button color='danger' isLight icon='Delete' size='sm' onClick={(e: any) => handleDeleteArea(e, child)} className='me-1' />
                                                <Badge color='success' isLight>Active</Badge>
                                            </CardActions>
                                        </CardHeader>
                                        <CardBody>
                                            <div className='d-flex justify-content-between align-items-center mb-2'>
                                                <div className='text-muted'><Icon icon='Sensors' size='sm' className='me-1' />Sensors</div>
                                                <div className='fw-bold fs-5'>{child.sensor_count || 0}</div>
                                            </div>
                                            <div className='border-top border-light pt-3 mt-3'>
                                                <div className='text-muted small mb-2'><Icon icon='AssignmentInd' size='sm' className='me-1' />Persons in Charge</div>
                                                <div className='d-flex flex-wrap gap-1'>
                                                    {child.person_in_charge && child.person_in_charge.length > 0 ? (
                                                        child.person_in_charge.map(p => (
                                                            <Badge key={p.id} color='primary' isLight className='rounded-pill'>{p.first_name} {p.last_name}</Badge>
                                                        ))
                                                    ) : (
                                                        <span className='text-muted small'>Unassigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Sensors Section ── */}
                <div>
                    <div className='d-flex align-items-center justify-content-between mb-3'>
                        <div className='d-flex align-items-center'>
                            <Icon icon='Sensors' className='me-2 fs-4' />
                            <span className='h5 mb-0 fw-bold'>Sensors in {currentZone?.name}</span>
                        </div>
                        <Badge color='success' isLight className='fs-6'>{filteredSensors.length} of {sensors.length}</Badge>
                    </div>
                    <div className='row g-4'>
                        {filteredSensors.map(sensor => (
                            <div key={sensor.id} className='col-md-6 col-xl-4'>
                                <Card stretch>
                                    <CardHeader>
                                        <CardTitle>{sensor.name}</CardTitle>
                                        <CardActions>
                                            <Button color='danger' isLight icon='LinkOff' size='sm' onClick={(e: any) => handleUnassignSensor(e, sensor)} className='me-2' />
                                            <Badge color={sensor.is_active ? 'success' : 'danger'} isLight>{sensor.is_active ? 'Active' : 'Inactive'}</Badge>
                                        </CardActions>
                                    </CardHeader>
                                    <CardBody>
                                        <div className='mb-2'><div className='small text-muted'>Type</div><div className='fw-bold'>{sensor.sensor_type || 'N/A'}</div></div>
                                        <div className='mb-2'><div className='small text-muted'>MAC Address</div><div className='font-monospace small'>{sensor.mac_address || 'N/A'}</div></div>
                                        {sensor.ip_address && <div className='mb-2'><div className='small text-muted'>IP Address</div><div className='font-monospace small'>{sensor.ip_address}</div></div>}
                                    </CardBody>
                                </Card>
                            </div>
                        ))}
                        {filteredSensors.length === 0 && (
                            <div className='col-12'>
                                <Card>
                                    <CardBody className='text-center py-4'>
                                        <Icon icon='SensorsOff' className='display-4 text-muted mb-3' />
                                        <h5 className='text-muted mb-2'>No sensors available</h5>
                                        <p className='text-muted small mb-3'>
                                            {sensors.length === 0 ? 'No sensors are assigned to this area yet.' : 'No sensors match your current search or filter.'}
                                        </p>
                                        <Button color='primary' icon='Sensors' size='sm' onClick={() => setIsSensorModalOpen(true)}>Add Sensor</Button>
                                    </CardBody>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Gauge Grid Section ── */}
                <Card className='shadow-none border border-light mb-4'>
                    <CardHeader className='bg-transparent'>
                        <CardTitle>
                            <Icon icon='Speed' className='me-2 text-primary' />
                            {activeGroupKey
                                ? `${METRIC_GROUPS.find(g => g.key === activeGroupKey)?.label} — Live Readings`
                                : 'All Metrics — Live Readings'}
                        </CardTitle>
                        <CardActions>
                            {/* Group filter pill tabs */}
                            <div className='d-flex flex-wrap gap-2'>
                                <button
                                    onClick={() => setActiveGroupKey(null)}
                                    style={{
                                        background: !activeGroupKey ? '#4d69fa' : 'transparent',
                                        color: !activeGroupKey ? '#fff' : '#6b7280',
                                        border: `1px solid ${!activeGroupKey ? '#4d69fa' : '#d1d5db'}`,
                                        borderRadius: 20, fontSize: '0.7rem', padding: '3px 12px',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >
                                    All
                                </button>
                                {METRIC_GROUPS.map(g => {
                                    const gm = buildProcessedMetrics(aggData, effectiveConfig, g.metricKeys);
                                    if (gm.length === 0) return null;
                                    const isActive = activeGroupKey === g.key;
                                    const worstColor = [...gm].sort((a, b) => b.normalizedValue - a.normalizedValue)[0]?.statusColor || '#6b7280';
                                    return (
                                        <button
                                            key={g.key}
                                            onClick={() => setActiveGroupKey(isActive ? null : g.key)}
                                            style={{
                                                background: isActive ? worstColor : 'transparent',
                                                color: isActive ? '#fff' : '#6b7280',
                                                border: `1px solid ${isActive ? worstColor : '#d1d5db'}`,
                                                borderRadius: 20, fontSize: '0.7rem', padding: '3px 12px',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                        >
                                            {g.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardActions>
                    </CardHeader>
                    <CardBody>
                        {displayedMetrics.length > 0 ? (
                            <div className='row g-3'>
                                {displayedMetrics.map(metric => (
                                    <div key={metric.key} className='col-6 col-md-4 col-lg-3 col-xl-2'>
                                        <MiniGauge metric={metric} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-5 text-muted'>
                                <Icon icon='Speed' className='fs-1 mb-2' />
                                <p className='mb-0'>No sensor data available for this area yet.</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Page>

            {/* ── Add Sensor Modal ── */}
            <Modal isOpen={isSensorModalOpen} setIsOpen={setIsSensorModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsSensorModalOpen}>
                    <ModalTitle id='add-sensor-title'>Add Sensor to {currentZone?.name}</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    {!isSubzone && (
                        <div className='mb-3'>
                            <label className='form-label'>Target Area</label>
                            <select className='form-select' value={selectedTargetAreaId || areaId || ''} onChange={(e) => setSelectedTargetAreaId(e.target.value)}>
                                <option value={areaId}>Main Area ({parentArea?.name})</option>
                                {childSubAreas.map(sub => (<option key={sub.id} value={sub.id}>Sub Area: {sub.name}</option>))}
                            </select>
                        </div>
                    )}
                    <div className='mb-3'>
                        <label className='form-label'>Select Available Sensor</label>
                        <select className='form-select' value={selectedSensorId} onChange={(e) => setSelectedSensorId(e.target.value)}>
                            <option value=''>Choose a sensor...</option>
                            {availableSensors.map(s => (<option key={s.id} value={s.id}>{s.name} - {s.mac_address} ({s.sensor_type})</option>))}
                        </select>
                        {availableSensors.length === 0 && <div className='text-muted small mt-2'>No unassigned sensors available.</div>}
                    </div>
                    <div className='border-top pt-3 mt-3'>
                        <label className='form-label fw-bold mb-3'><Icon icon='Place' size='sm' className='me-1' />Placement Coordinates</label>
                        <div className='row g-3'>
                            <div className='col-md-4'><FormGroup label='X'><Input type='number' step={0.1} value={sensorX} onChange={(e: any) => setSensorX(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                            <div className='col-md-4'><FormGroup label='Y'><Input type='number' step={0.1} value={sensorY} onChange={(e: any) => setSensorY(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                            <div className='col-md-4'><FormGroup label='Z'><Input type='number' step={0.1} value={sensorZ} onChange={(e: any) => setSensorZ(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => { setIsSensorModalOpen(false); setSelectedSensorId(''); setSelectedTargetAreaId(''); setSensorX(0); setSensorY(0); setSensorZ(0); }}>Cancel</Button>
                    <Button color='primary' onClick={handleAddSensor} isDisable={!selectedSensorId || updateSensorMutation.isPending}>
                        {updateSensorMutation.isPending && <Spinner isSmall inButton />}Add Sensor
                    </Button>
                </ModalFooter>
            </Modal>

            {/* ── Create Sub Area Modal ── */}
            <Modal isOpen={isSubAreaModalOpen} setIsOpen={setIsSubAreaModalOpen} isCentered size='lg'>
                <ModalHeader setIsOpen={setIsSubAreaModalOpen}>
                    <ModalTitle id='create-subarea-title'>Create Sub Area in {currentZone?.name}</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
                            <FormGroup label='Sub Area Name'>
                                <input type='text' className={`form-control ${error ? 'is-invalid' : ''}`} placeholder='e.g. Room 101, West Wing...' value={subAreaName}
                                    onChange={(e) => { setSubAreaName(e.target.value); setError(''); }}
                                    onKeyPress={(e) => { if (e.key === 'Enter') handleCreateSubArea(); }}
                                />
                                {error && <div className='invalid-feedback'>{error}</div>}
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Area Type'>
                                <select className='form-select' value={subAreaType} onChange={(e) => setSubAreaType(e.target.value)}>
                                    <option value='floor'>Floor</option><option value='room'>Room</option>
                                    <option value='zone'>Zone</option><option value='others'>Others</option>
                                </select>
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Floor Plan (Optional)'>
                                <Input type='file' accept='image/*' onChange={(e: any) => setSubAreaPlan(e.target.files[0])} />
                                {previewUrl && (
                                    <div className='mt-3 text-center border rounded p-2 bg-light bg-opacity-10'>
                                        <p className='small text-muted mb-2'>Image Preview:</p>
                                        <img
                                            src={previewUrl}
                                            alt='Sub Area Plan Preview'
                                            style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '4px' }}
                                        />
                                        <div className='mt-2 small text-success'>
                                            <Icon icon='CheckCircle' size='sm' className='me-1' />
                                            {subAreaPlan?.name}
                                        </div>
                                    </div>
                                )}
                            </FormGroup>
                        </div>
                        <div className='col-md-4'><FormGroup label='Offset X'><Input type='number' step={0.1} value={subOffsetX} onChange={(e: any) => setSubOffsetX(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                        <div className='col-md-4'><FormGroup label='Offset Y'><Input type='number' step={0.1} value={subOffsetY} onChange={(e: any) => setSubOffsetY(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                        <div className='col-md-4'><FormGroup label='Offset Z'><Input type='number' step={0.1} value={subOffsetZ} onChange={(e: any) => setSubOffsetZ(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                        <div className='col-12'>
                            <FormGroup label='Scale Factor'>
                                <Input type='number' step={0.1} min={0.1} value={subScaleFactor} onChange={(e: any) => setSubScaleFactor(parseFloat(e.target.value) || 1.0)} />
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <Label>Assign Persons In Charge</Label>
                            <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users?.map((user: User) => (
                                    <div key={user.id} className='mb-2'>
                                        <Checks
                                            id={`user-${user.id}`}
                                            label={`${user.first_name} ${user.last_name} (@${user.username})`}
                                            checked={personInChargeIds.includes(user.id)}
                                            onChange={() => setPersonInChargeIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                                        />
                                    </div>
                                ))}
                                {(!users || users.length === 0) && <div className='text-muted small'>No users found.</div>}
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => { setIsSubAreaModalOpen(false); resetSubAreaForm(); }}>Cancel</Button>
                    <Button color='primary' onClick={handleCreateSubArea} isDisable={createSubAreaMutation.isPending}>
                        {createSubAreaMutation.isPending && <Spinner isSmall inButton />}Create Sub Area
                    </Button>
                </ModalFooter>
            </Modal>

            <EditAreaModal isOpen={isEditModalOpen} setIsOpen={setIsEditModalOpen} area={editingArea} />
        </PageWrapper>
    );
};

export default AreaZoneView;