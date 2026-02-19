

import React, { useState, useMemo } from 'react';
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
import { useAreas, useCreateSubArea, useAddSensorToSubArea, useSensors, useUsers, useUpdateSensor, useDeleteArea, useAggregatedSensorData } from '../../../../api/sensors.api';
import { Area, User } from '../../../../types/sensor';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Label from '../../../../components/bootstrap/forms/Label';
import { useQueryClient } from '@tanstack/react-query';
import { filterSensors } from '../../utils/sensorData.utils';
import EditAreaModal from '../modals/EditAreaModal';
import Chart from '../../../../components/extras/Chart';
import Swal from 'sweetalert2';


// ── Metric Groups (same as before, just used differently now) ──
const METRIC_GROUPS = [
    {
        key: 'room_conditions',
        label: 'Room Conditions',
        icon: 'Thermostat',
        metrics: [
            { key: 'temperature', label: 'Temp (°C)' },
            { key: 'humidity', label: 'Humidity (%)' },
            { key: 'pressure', label: 'Pressure (hPa)' },
            { key: 'light', label: 'Light (lux)' },
        ],
        representative: 'temperature',
        representativeLabel: 'Temp',
        representativeUnit: '°C',
    },
    {
        key: 'air_particles',
        label: 'Air Dust & Particles',
        icon: 'Grain',
        metrics: [
            { key: 'pm1', label: 'PM1 (µg/m³)' },
            { key: 'pm25', label: 'PM2.5 (µg/m³)' },
            { key: 'pm10', label: 'PM10 (µg/m³)' },
        ],
        representative: 'pm25',
        representativeLabel: 'PM2.5',
        representativeUnit: 'µg/m³',
    },
    {
        key: 'air_composition',
        label: 'Air Composition',
        icon: 'Science',
        metrics: [
            { key: 'co', label: 'CO (ppm)' },
            { key: 'co2', label: 'CO₂ (ppm)' },
            { key: 'tvoc', label: 'TVOC (ppb)' },
            { key: 'nh3', label: 'NH₃ (ppm)' },
            { key: 'no2', label: 'NO₂ (ppb)' },
        ],
        representative: 'co2',
        representativeLabel: 'CO₂',
        representativeUnit: 'ppm',
    },
    {
        key: 'air_quality_score',
        label: 'Air Quality Score',
        icon: 'Shield',
        metrics: [
            { key: 'aqi', label: 'AQI' },
            { key: 'health', label: 'Health Score' },
        ],
        representative: 'aqi',
        representativeLabel: 'AQI',
        representativeUnit: 'index',
    },
    {
        key: 'activity_movement',
        label: 'Activity & Movement',
        icon: 'DirectionsRun',
        metrics: [
            { key: 'movement', label: 'Movement (mm/s)' },
            { key: 'acc_x', label: 'Accel X (mg)' },
            { key: 'acc_y', label: 'Accel Y (mg)' },
            { key: 'acc_z', label: 'Accel Z (mg)' },
            { key: 'panic', label: 'Panic' },
        ],
        representative: 'movement',
        representativeLabel: 'Movement',
        representativeUnit: 'mm/s',
    },
    {
        key: 'sound_noise',
        label: 'Sound & Noise',
        icon: 'VolumeUp',
        metrics: [
            { key: 'sound', label: 'Sound (dB)' },
            { key: 'noise', label: 'Noise (dB)' },
        ],
        representative: 'sound',
        representativeLabel: 'Sound',
        representativeUnit: 'dB',
    },
];


// All metrics flattened for overview chart
const ALL_METRICS = METRIC_GROUPS.flatMap(g => g.metrics);


const AreaSubzones = () => {
    const { areaId } = useParams<{ areaId: string }>();
    const navigate = useNavigate();
    const { data: areas, isLoading } = useAreas();
    const { data: users } = useUsers();
    const createSubAreaMutation = useCreateSubArea();
    const updateSensorMutation = useUpdateSensor();
    const deleteAreaMutation = useDeleteArea();
    const queryClient = useQueryClient();


    const [isSubAreaModalOpen, setIsSubAreaModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
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
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');


    // ── Active group state (null = show all metrics overview) ──
    const [activeGroup, setActiveGroup] = useState<typeof METRIC_GROUPS[0] | null>(null);


    // Sensors belonging to this area — fetched directly from the API
    const { data: areaSensors = [], isLoading: sensorsLoading } = useSensors({
        areaId: areaId || undefined,
        search: searchTerm || undefined,
        status: filterStatus,
    });


    // Available (unassigned) sensors for the Add Sensor modal
    const { data: allUnassignedSensors = [] } = useSensors();
    const availableSensors = useMemo(() => {
        return allUnassignedSensors.filter(s => !s.area && !s.area_name);
    }, [allUnassignedSensors]);


    const { data: aggregatedResponse } = useAggregatedSensorData({
        area_id: areaId ? [Number(areaId)] : []
    });


    const currentArea = useMemo(() => {
        return areas?.find(area => area.id === Number(areaId));
    }, [areas, areaId]);


    const subAreas = useMemo(() => {
        const subareaIds = currentArea?.subareas || [];
        if (!areas || subareaIds.length === 0) return [];
        return subareaIds
            .map((id: number) => areas.find(area => area.id === id))
            .filter((area): area is Area => area !== undefined);
    }, [currentArea, areas]);


    const filteredSubAreas = useMemo(() => {
        return subAreas.filter(subArea =>
            (subArea.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [subAreas, searchTerm]);


    const filteredSensors = filterSensors(areaSensors, searchTerm, filterStatus);


    // ── Metric group tiles (with hasData + representativeMin/Max) ──
    const metricGroups = useMemo(() => {
        const data = aggregatedResponse?.aggregated_data || {};
        return METRIC_GROUPS.map(group => ({
            ...group,
            hasData: group.metrics.some(
                m => data[`${m.key}_min`] != null || data[`${m.key}_max`] != null
            ),
            representativeMin: data[`${group.representative}_min`] != null
                ? Number(data[`${group.representative}_min`]).toFixed(1) : null,
            representativeMax: data[`${group.representative}_max`] != null
                ? Number(data[`${group.representative}_max`]).toFixed(1) : null,
        }));
    }, [aggregatedResponse]);


    // ── Range Bar Chart Data ──
    // If activeGroup → show only that group's metrics
    // If null        → show all metrics (overview)
    const rangeBarData = useMemo(() => {
        const data = aggregatedResponse?.aggregated_data || {};
        const metricsToShow = activeGroup ? activeGroup.metrics : ALL_METRICS;


        return metricsToShow
            .filter(m => data[`${m.key}_min`] != null && data[`${m.key}_max`] != null)
            .map(m => ({
                x: m.label,
                y: [
                    Number(data[`${m.key}_min`]),
                    Number(data[`${m.key}_max`])
                ]
            }));
    }, [aggregatedResponse, activeGroup]);


    const rangeBarSeries = [{ data: rangeBarData }];


    const rangeBarOptions: any = {
        chart: {
            type: 'rangeBar',
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number[]) => `${val[0]} — ${val[1]}`,
            style: {
                fontSize: '10px',
                colors: ['#374151']
            },
            offsetX: 5,
        },
        xaxis: {
            title: { text: 'Sensor Reading Value' },
            labels: { style: { fontSize: '11px' } }
        },
        yaxis: {
            labels: { style: { fontSize: '11px' } }
        },
        tooltip: {
            custom: ({ dataPointIndex, w }: any) => {
                const d = w.globals.initialSeries[0].data[dataPointIndex];
                return `
                    <div style="padding:10px;font-size:12px">
                        <strong>${d.x}</strong><br/>
                        <span style="color:#6b7280">Min:</span> <strong>${d.y[0]}</strong><br/>
                        <span style="color:#6b7280">Max:</span> <strong>${d.y[1]}</strong>
                    </div>
                `;
            }
        },
        colors: [
            activeGroup
                ? (import.meta.env.VITE_INFO_COLOR || '#4d69fa')
                : (import.meta.env.VITE_PRIMARY_COLOR || '#7a3a6f')
        ],
        noData: {
            text: 'No sensor data available',
            align: 'center',
            verticalAlign: 'middle',
        }
    };


    // ── Handlers ──
    const handleCreateSubArea = () => {
        if (!subAreaName.trim()) { setError('Sub area name is required'); return; }
        const formData = new FormData();
        formData.append('name', subAreaName);
        formData.append('area_type', subAreaType);
        formData.append('parent_id', areaId || '');
        formData.append('offset_x', subOffsetX.toString());
        formData.append('offset_y', subOffsetY.toString());
        formData.append('offset_z', subOffsetZ.toString());
        formData.append('scale_factor', subScaleFactor.toString());
        if (subAreaPlan) formData.append('area_plan', subAreaPlan);
        personInChargeIds.forEach(id => formData.append('person_in_charge_ids', id.toString()));


        createSubAreaMutation.mutate(formData, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['areas'] });
                setIsSubAreaModalOpen(false);
                setSubAreaName(''); setSubAreaType('others'); setSubAreaPlan(null);
                setSubOffsetX(0); setSubOffsetY(0); setSubOffsetZ(0);
                setSubScaleFactor(1.0); setPersonInChargeIds([]); setError('');
            },
        });
    };


    const handleAddSensor = () => {
        const targetAreaId = selectedTargetAreaId || areaId;
        if (!selectedSensorId || !targetAreaId) return;
        updateSensorMutation.mutate(
            { sensorId: selectedSensorId, data: { area: Number(targetAreaId), x_val: sensorX, y_val: sensorY, z_val: sensorZ } },
            {
                onSuccess: () => {
                    setIsSensorModalOpen(false);
                    setSelectedSensorId(''); setSelectedTargetAreaId('');
                    setSensorX(0); setSensorY(0); setSensorZ(0);
                },
            }
        );
    };


    const handleCardClick = (subAreaId: number) => navigate(`/halo/sensors/areas/${areaId}/subzones/${subAreaId}`);


    const handleEditClick = (e: React.MouseEvent, area: Area) => {
        e.stopPropagation(); setEditingArea(area); setIsEditModalOpen(true);
    };


    const handleDeleteArea = (e: React.MouseEvent, area: Area) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete sub-area "${area.name}".`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: document.documentElement.className.includes('dark') ? '#1a1a1a' : '#fff',
            color: document.documentElement.className.includes('dark') ? '#fff' : '#000',
        }).then(result => { if (result.isConfirmed) deleteAreaMutation.mutate(area.id); });
    };


    const handleUnassignSensor = (e: React.MouseEvent, sensor: any) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Unassign Sensor?',
            text: `Remove "${sensor.name}" from this area?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Yes, unassign', cancelButtonText: 'Cancel',
            buttonsStyling: false,
            customClass: { confirmButton: 'btn btn-danger mx-2', cancelButton: 'btn btn-secondary mx-2' },
        }).then(result => {
            if (result.isConfirmed) updateSensorMutation.mutate({ sensorId: sensor.id, data: { area: null } });
        });
    };


    if (isLoading || sensorsLoading) {
        return (
            <PageWrapper title='Sub Areas'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }


    return (
        <PageWrapper title='Sensor Sub Areas'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb list={[
                        { title: 'Areas', to: '/halo/sensors/areas' },
                        { title: currentArea?.name || 'Area', to: `/halo/sensors/areas/${areaId}/subzones` }
                    ]} />
                </SubHeaderLeft>
                <SubHeaderRight>
                    <div className='d-flex gap-3'>
                        <Button isNeumorphic color='info' icon='ViewInAr' onClick={() => navigate(`/halo/sensors/areas/${areaId}/3d`)}>3D View</Button>
                        <Button isNeumorphic color='info' icon='Add' onClick={() => setIsSubAreaModalOpen(true)}>Create Sub Area</Button>
                        <Button isNeumorphic color='primary' icon='Sensors' onClick={() => setIsSensorModalOpen(true)}>Add Sensor</Button>
                    </div>
                </SubHeaderRight>
            </SubHeader>


            <Page container='fluid'>


                {/* ── Environmental Range Overview Card ── */}
                <div className='row mb-4'>
                    <div className='col-12'>
                        <Card stretch className='shadow-none border border-light'>
                            <CardHeader className='bg-transparent'>
                                <CardTitle>
                                    <Icon icon='Analytics' className='me-2 text-primary' />
                                    {activeGroup ? `${activeGroup.label} — Min / Max Range` : 'Environmental Range Overview'}
                                </CardTitle>
                                <CardActions>
                                    {activeGroup ? (
                                        <Button
                                            size='sm'
                                            color='primary'
                                            isLight
                                            icon='RestartAlt'
                                            onClick={() => setActiveGroup(null)}
                                        >
                                            Back to Overview
                                        </Button>
                                    ) : (
                                        <Badge color='info' isLight className='px-3 py-2'>
                                            All Metrics · Min / Max
                                        </Badge>
                                    )}
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                {rangeBarData.length > 0 ? (
                                    <Chart
                                        type='rangeBar'
                                        series={rangeBarSeries}
                                        options={rangeBarOptions}
                                        height={Math.max(200, rangeBarData.length * 45 + 60)}
                                    />
                                ) : (
                                    <div className='text-center py-5 text-muted'>
                                        <Icon icon='BarChart' className='fs-1 mb-2' />
                                        <p className='mb-0'>No sensor data available for this area yet.</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>


                {/* ── Metric Group Tiles ── */}
                {/* Click a tile → rangeBar filters to that group only */}
                <div className='mb-4'>
                    <div className='row g-3'>
                        {metricGroups.map(group => (
                            <div key={group.key} className='col-6 col-md-4 col-xl-2'>
                                <div
                                    onClick={() => setActiveGroup(
                                        activeGroup?.key === group.key ? null : group
                                    )}
                                    className='rounded-2 p-3 h-100 d-flex flex-column align-items-center text-center'
                                    style={{
                                        border: activeGroup?.key === group.key
                                            ? '2px solid #4d69fa'      // highlighted when selected
                                            : '1px solid #d1d5db',
                                        background: activeGroup?.key === group.key
                                            ? '#eff2ff'
                                            : group.hasData ? '#f9fafb' : '#fafafa',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px #9ca3af44')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                >
                                    <div
                                        className='rounded-2 d-flex align-items-center justify-content-center mb-2'
                                        style={{
                                            width: 36, height: 36,
                                            background: activeGroup?.key === group.key ? '#4d69fa22' : '#e5e7eb',
                                            color: activeGroup?.key === group.key ? '#4d69fa' : '#374151'
                                        }}
                                    >
                                        <Icon icon={group.icon as any} size='sm' />
                                    </div>
                                    <div className='fw-semibold mb-1' style={{ fontSize: '0.72rem', lineHeight: 1.3, color: '#111827' }}>
                                        {group.label}
                                    </div>
                                    {group.hasData ? (
                                        <div className='mt-auto'>
                                            <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600 }}>
                                                {group.representativeLabel}
                                            </div>
                                            <div className='d-flex align-items-center justify-content-center gap-2 mt-1'>
                                                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                    ↓ {group.representativeMin ?? '—'}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: '#374151', fontWeight: 700 }}>
                                                    ↑ {group.representativeMax ?? '—'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                                                {group.representativeUnit}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='mt-auto text-muted' style={{ fontSize: '0.65rem' }}>No Data</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Filter Section */}
                <div className='row mb-4'>
                    <div className='col-12'>
                        <Card>
                            <CardBody>
                                <div className='row g-3 align-items-end'>
                                    <div className='col-md-6'>
                                        <FormGroup label='Search'>
                                            <div className='input-group'>
                                                <span className='input-group-text'><Icon icon='Search' /></span>
                                                <Input type='text' placeholder='Search by name, MAC address, or type...'
                                                    value={searchTerm}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} />
                                            </div>
                                        </FormGroup>
                                    </div>
                                    <div className='col-md-3'>
                                        <FormGroup label='Status Filter'>
                                            <select className='form-select' value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}>
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


                {/* Sub Areas Section */}
                <div className='mb-4'>
                    <div className='d-flex align-items-center justify-content-between mb-3'>
                        <div className='d-flex align-items-center'>
                            <Icon icon='GroupWork' className='me-2 fs-4' />
                            <span className='h5 mb-0 fw-bold'>Sub Areas</span>
                        </div>
                        <Badge color='info' isLight className='fs-6'>{filteredSubAreas.length} of {subAreas.length}</Badge>
                    </div>
                    <div className='row g-4 mb-4'>
                        {subAreas.length === 0 ? (
                            <div className='col-12'>
                                <Card>
                                    <CardBody className='text-center py-4'>
                                        <Icon icon='AccountTree' className='display-4 text-muted mb-3' />
                                        <h5 className='text-muted mb-2'>No sub-areas in this area</h5>
                                        <p className='text-muted small mb-3'>This area has no sub-areas yet.</p>
                                        <Button color='info' icon='Add' size='sm' onClick={() => setIsSubAreaModalOpen(true)}>
                                            Create Sub Area
                                        </Button>
                                    </CardBody>
                                </Card>
                            </div>
                        ) : filteredSubAreas.length === 0 ? (
                            <div className='col-12'>
                                <Card>
                                    <CardBody className='text-center py-3'>
                                        <p className='text-muted small mb-0'>No sub-areas match your search.</p>
                                    </CardBody>
                                </Card>
                            </div>
                        ) : (
                            filteredSubAreas.map(subArea => (
                                <div key={subArea.id} className='col-md-6 col-xl-4'>
                                    <Card stretch className='cursor-pointer' style={{ cursor: 'pointer' }} onClick={() => handleCardClick(subArea.id)}>
                                        <CardHeader>
                                            <CardTitle>{subArea.name}</CardTitle>
                                            <CardActions>
                                                <Button color='info' isLight icon='Edit' size='sm' onClick={(e: any) => handleEditClick(e, subArea)} className='me-1' />
                                                <Button color='danger' isLight icon='Delete' size='sm' onClick={(e: any) => handleDeleteArea(e, subArea)} className='me-1' />
                                                <Badge color='success' isLight>Active</Badge>
                                            </CardActions>
                                        </CardHeader>
                                        <CardBody>
                                            <div className='d-flex justify-content-between align-items-center mb-2'>
                                                <div className='text-muted'><Icon icon='Sensors' size='sm' className='me-1' />Sensors</div>
                                                <div className='fw-bold fs-5'>{subArea.sensor_count || 0}</div>
                                            </div>
                                            <div className='border-top border-light pt-3 mt-3'>
                                                <div className='text-muted small mb-2'>
                                                    <Icon icon='AssignmentInd' size='sm' className='me-1' />Persons in Charge
                                                </div>
                                                <div className='d-flex flex-wrap gap-1'>
                                                    {subArea.person_in_charge && subArea.person_in_charge.length > 0 ? (
                                                        subArea.person_in_charge.map(person => (
                                                            <Badge key={person.id} color='primary' isLight className='rounded-pill'>
                                                                {person.first_name} {person.last_name}
                                                            </Badge>
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


                {/* Sensors Section */}
                <div>
                    <div className='d-flex align-items-center justify-content-between mb-3'>
                        <div className='d-flex align-items-center'>
                            <Icon icon='Sensors' className='me-2 fs-4' />
                            <span className='h5 mb-0 fw-bold'>Sensors in {currentArea?.name}</span>
                        </div>
                        <Badge color='success' isLight className='fs-6'>{filteredSensors.length} of {areaSensors.length}</Badge>
                    </div>
                    <div className='row g-4'>
                        {filteredSensors.map(sensor => (
                            <div key={sensor.id} className='col-md-6 col-xl-4'>
                                <Card stretch>
                                    <CardHeader>
                                        <CardTitle>{sensor.name}</CardTitle>
                                        <CardActions>
                                            <Button color='danger' isLight icon='LinkOff' size='sm' onClick={(e: any) => handleUnassignSensor(e, sensor)} className='me-2' />
                                            <Badge color={sensor.is_active ? 'success' : 'danger'} isLight>
                                                {sensor.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </CardActions>
                                    </CardHeader>
                                    <CardBody>
                                        <div className='mb-2'>
                                            <div className='small text-muted'>Type</div>
                                            <div className='fw-bold'>{sensor.sensor_type || 'N/A'}</div>
                                        </div>
                                        <div className='mb-2'>
                                            <div className='small text-muted'>MAC Address</div>
                                            <div className='font-monospace small'>{sensor.mac_address || 'N/A'}</div>
                                        </div>
                                        {sensor.ip_address && (
                                            <div className='mb-2'>
                                                <div className='small text-muted'>IP Address</div>
                                                <div className='font-monospace small'>{sensor.ip_address}</div>
                                            </div>
                                        )}
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
                                            {areaSensors.length === 0
                                                ? 'No sensors are assigned to this area yet.'
                                                : 'No sensors match your current search or filter.'}
                                        </p>
                                        <Button color='primary' icon='Sensors' size='sm' onClick={() => setIsSensorModalOpen(true)}>
                                            Add Sensor
                                        </Button>
                                    </CardBody>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </Page>


            {/* Add Sensor Modal */}
            <Modal isOpen={isSensorModalOpen} setIsOpen={setIsSensorModalOpen}>
                <ModalHeader setIsOpen={setIsSensorModalOpen}>
                    <ModalTitle id='add-sensor-title'>Add Sensor to Area</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='mb-3'>
                        <label className='form-label'>Target Area</label>
                        <select className='form-select' value={selectedTargetAreaId || areaId || ''} onChange={(e) => setSelectedTargetAreaId(e.target.value)}>
                            <option value={areaId}>Main Area ({currentArea?.name})</option>
                            {subAreas.map(sub => <option key={sub.id} value={sub.id}>Sub Area: {sub.name}</option>)}
                        </select>
                    </div>
                    <div className='mb-3'>
                        <label className='form-label'>Select Available Sensor</label>
                        <select className='form-select' value={selectedSensorId} onChange={(e) => setSelectedSensorId(e.target.value)}>
                            <option value=''>Choose a sensor...</option>
                            {availableSensors.map(s => <option key={s.id} value={s.id}>{s.name} - {s.mac_address} ({s.sensor_type})</option>)}
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
                    <Button color='light' onClick={() => setIsSensorModalOpen(false)}>Cancel</Button>
                    <Button color='primary' onClick={handleAddSensor} isDisable={!selectedSensorId || updateSensorMutation.isPending}>
                        {updateSensorMutation.isPending && <Spinner isSmall inButton />}Add Sensor
                    </Button>
                </ModalFooter>
            </Modal>


            {/* Create Sub Area Modal */}
            <Modal isOpen={isSubAreaModalOpen} setIsOpen={setIsSubAreaModalOpen}>
                <ModalHeader setIsOpen={setIsSubAreaModalOpen}>
                    <ModalTitle id='create-subarea-title'>Create Sub Area in {currentArea?.name}</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
                            <FormGroup label='Sub Area Name'>
                                <input type='text' className={`form-control ${error ? 'is-invalid' : ''}`}
                                    placeholder='e.g. West Wing, Server Room...' value={subAreaName}
                                    onChange={(e) => { setSubAreaName(e.target.value); setError(''); }}
                                    onKeyPress={(e) => { if (e.key === 'Enter') handleCreateSubArea(); }} />
                                {error && <div className='invalid-feedback'>{error}</div>}
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Area Type'>
                                <select className='form-select' value={subAreaType} onChange={(e) => setSubAreaType(e.target.value)}>
                                    <option value='floor'>Floor</option>
                                    <option value='room'>Room</option>
                                    <option value='zone'>Zone</option>
                                    <option value='others'>Others</option>
                                </select>
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Floor Plan (Optional)'>
                                <Input type='file' accept='image/*' onChange={(e: any) => setSubAreaPlan(e.target.files[0])} />
                                {subAreaPlan && <div className='mt-2 small text-success'><Icon icon='CheckCircle' size='sm' className='me-1' />{subAreaPlan.name}</div>}
                            </FormGroup>
                        </div>
                        <div className='col-md-4'><FormGroup label='Offset X'><Input type='number' step={0.1} value={subOffsetX} onChange={(e: any) => setSubOffsetX(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                        <div className='col-md-4'><FormGroup label='Offset Y'><Input type='number' step={0.1} value={subOffsetY} onChange={(e: any) => setSubOffsetY(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                        <div className='col-md-4'><FormGroup label='Offset Z'><Input type='number' step={0.1} value={subOffsetZ} onChange={(e: any) => setSubOffsetZ(parseFloat(e.target.value) || 0)} /></FormGroup></div>
                        <div className='col-12'><FormGroup label='Scale Factor'><Input type='number' step={0.1} min={0.1} value={subScaleFactor} onChange={(e: any) => setSubScaleFactor(parseFloat(e.target.value) || 1.0)} /></FormGroup></div>
                        <div className='col-12'>
                            <Label>Assign Persons In Charge</Label>
                            <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users?.map((user: User) => (
                                    <div key={user.id} className='mb-2'>
                                        <Checks id={`user-${user.id}`}
                                            label={`${user.first_name} ${user.last_name} (@${user.username})`}
                                            checked={personInChargeIds.includes(user.id)}
                                            onChange={() => setPersonInChargeIds(prev =>
                                                prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                            )} />
                                    </div>
                                ))}
                                {(!users || users.length === 0) && <div className='text-muted small'>No users found.</div>}
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => { setIsSubAreaModalOpen(false); setSubAreaName(''); setError(''); }}>Cancel</Button>
                    <Button color='primary' onClick={handleCreateSubArea} isDisable={createSubAreaMutation.isPending}>
                        {createSubAreaMutation.isPending && <Spinner isSmall inButton />}Create Sub Area
                    </Button>
                </ModalFooter>
            </Modal>


            <EditAreaModal isOpen={isEditModalOpen} setIsOpen={setIsEditModalOpen} area={editingArea} />
        </PageWrapper>
    );
};


export default AreaSubzones;
