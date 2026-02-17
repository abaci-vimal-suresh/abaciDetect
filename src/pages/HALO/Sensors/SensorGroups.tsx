import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb, { BreadcrumbItem } from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../components/bootstrap/Modal';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import { useAreas, useCreateSubArea, useAddSensorToSubArea, useSensors, useUsers, useUpdateSensor, useDeleteArea, useAggregatedSensorData } from '../../../api/sensors.api';
import { Area, User } from '../../../types/sensor';
import Checks from '../../../components/bootstrap/forms/Checks';
import Label from '../../../components/bootstrap/forms/Label';
import { useQueryClient } from '@tanstack/react-query';
import { filterSensors, getSensorsByArea, getAvailableSensors } from '../utils/sensorData.utils';
import EditAreaModal from './modals/EditAreaModal';
import Swal from 'sweetalert2';


const METRIC_GROUPS = [
    {
        key: 'room_conditions',
        label: 'Room Conditions',
        icon: 'Thermostat',
        accentColor: '#1b1a1aff',
        representative: 'temperature', // shown in the row card
        representativeLabel: 'Temp',
        representativeUnit: '°C',
        metrics: [
            { key: 'temperature', label: 'Temperature', unit: '°C' },
            { key: 'humidity', label: 'Humidity', unit: '%' },
            { key: 'pressure', label: 'Pressure', unit: 'hPa' },
            { key: 'light', label: 'Light', unit: 'lux' },
        ],
    },
    {
        key: 'air_particles',
        label: 'Air Dust & Particles',
        icon: 'Grain',
        accentColor: '#f59e0b',
        representative: 'pm25',
        representativeLabel: 'PM2.5',
        representativeUnit: 'µg/m³',
        metrics: [
            { key: 'pm1', label: 'PM1', unit: 'µg/m³' },
            { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
            { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
        ],
    },
    {
        key: 'air_composition',
        label: 'Air Composition',
        icon: 'Science',
        accentColor: '#06b6d4',
        representative: 'co2',
        representativeLabel: 'CO₂',
        representativeUnit: 'ppm',
        metrics: [
            { key: 'co', label: 'CO', unit: 'ppm' },
            { key: 'co2', label: 'CO₂', unit: 'ppm' },
            { key: 'tvoc', label: 'TVOC', unit: 'ppb' },
            { key: 'nh3', label: 'NH₃', unit: 'ppm' },
            { key: 'no2', label: 'NO₂', unit: 'ppb' },
        ],
    },
    {
        key: 'air_quality_score',
        label: 'Air Quality Score',
        icon: 'Shield',
        accentColor: '#10b981',
        representative: 'aqi',
        representativeLabel: 'AQI',
        representativeUnit: 'index',
        metrics: [
            { key: 'aqi', label: 'AQI', unit: 'index' },
            { key: 'health', label: 'Health Score', unit: 'score' },
        ],
    },
    {
        key: 'activity_movement',
        label: 'Activity & Movement',
        icon: 'DirectionsRun',
        accentColor: '#6366f1',
        representative: 'movement',
        representativeLabel: 'Movement',
        representativeUnit: 'mm/s',
        metrics: [
            { key: 'movement', label: 'Movement', unit: 'mm/s' },
            { key: 'acc_x', label: 'Accel X', unit: 'mg' },
            { key: 'acc_y', label: 'Accel Y', unit: 'mg' },
            { key: 'acc_z', label: 'Accel Z', unit: 'mg' },
            { key: 'panic', label: 'Panic', unit: '—' },
        ],
    },
    {
        key: 'sound_noise',
        label: 'Sound & Noise',
        icon: 'VolumeUp',
        accentColor: '#8b5cf6',
        representative: 'sound',
        representativeLabel: 'Sound',
        representativeUnit: 'dB',
        metrics: [
            { key: 'sound', label: 'Sound', unit: 'dB' },
            { key: 'noise', label: 'Noise', unit: 'dB' },
        ],
    },
];

const SensorGroups = () => {
    const { areaId } = useParams<{ areaId: string }>();
    const navigate = useNavigate();
    const { data: areas, isLoading } = useAreas();
    const { data: users } = useUsers();
    const createSubAreaMutation = useCreateSubArea();
    const addSensorMutation = useAddSensorToSubArea();
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
    const [activeMetricGroup, setActiveMetricGroup] = useState<any>(null);

    // Use server-side filtering for sensors
    // NOTE: When using Real Data, we should fetch ALL sensors because:
    // 1. The backend "area" filter might be strict (direct assignment only), excluding sub-areas.
    // 2. We need "available sensors" (unassigned) to show in the palette.
    // 3. The frontend `getSensorsByArea` function handles the hierarchical filtering correctly.
    const { data: allSensors, isLoading: sensorsLoading } = useSensors({
        search: searchTerm || undefined,
        status: filterStatus,
        // areaId: areaId  <-- REMOVED: Fetch all sensors so we get unassigned ones and sub-area ones
    });

    // Fetch aggregated data for the current area
    const { data: aggregatedResponse, isLoading: aggregatedLoading } = useAggregatedSensorData({
        area_id: areaId ? [Number(areaId)] : []
    });

    // Find the current area
    const currentArea = useMemo(() => {
        // If data is flat, we find by ID. If nested, we find at top level (since areaId is main area)
        return areas?.find(area => area.id === Number(areaId));
    }, [areas, areaId]);

    // Map subarea IDs to actual area objects
    const subAreas = useMemo(() => {
        const subareaIds = currentArea?.subareas || [];
        if (!areas || subareaIds.length === 0) return [];

        // Map IDs to actual area objects from the flat areas list
        return subareaIds
            .map((id: number) => areas.find(area => area.id === id))
            .filter((area): area is Area => area !== undefined);
    }, [currentArea, areas]);

    // Get sensors that belong to this area (recursive)
    const areaSensors = useMemo(() => {
        return getSensorsByArea(allSensors || [], areaId, currentArea?.name, areas);
    }, [allSensors, areaId, currentArea, areas]);

    // Get available sensors (sensors with no area assigned)
    const availableSensors = useMemo(() => {
        return getAvailableSensors(allSensors || []);
    }, [allSensors]);

    // Filter sub areas based on search term
    const filteredSubAreas = useMemo(() => {
        return subAreas.filter(subArea =>
            (subArea.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [subAreas, searchTerm]);

    // Sensors are already filtered by API, no need for client-side filtering
    const filteredSensors = areaSensors;

    // Memoize aggregated metrics for display

    const metricGroups = useMemo(() => {
        const data = aggregatedResponse?.aggregated_data || {};

        return METRIC_GROUPS.map(group => ({
            ...group,
            metrics: group.metrics.map(m => ({
                ...m,
                min: data[`${m.key}_min`] != null ? Number(data[`${m.key}_min`]).toFixed(1) : null,
                max: data[`${m.key}_max`] != null ? Number(data[`${m.key}_max`]).toFixed(1) : null,
            })),
            hasData: group.metrics.some(
                m => data[`${m.key}_min`] != null || data[`${m.key}_max`] != null
            ),
            representativeMin: data[`${group.representative}_min`] != null
                ? Number(data[`${group.representative}_min`]).toFixed(1) : null,
            representativeMax: data[`${group.representative}_max`] != null
                ? Number(data[`${group.representative}_max`]).toFixed(1) : null,
        }));
    }, [aggregatedResponse]);


    const handleCreateSubArea = () => {
        if (!subAreaName.trim()) {
            setError('Sub area name is required');
            return;
        }

        // Create FormData for file upload support
        const formData = new FormData();
        formData.append('name', subAreaName);
        formData.append('area_type', subAreaType);
        formData.append('parent_id', areaId || '');
        formData.append('offset_x', subOffsetX.toString());
        formData.append('offset_y', subOffsetY.toString());
        formData.append('offset_z', subOffsetZ.toString());
        formData.append('scale_factor', subScaleFactor.toString());

        if (subAreaPlan) {
            formData.append('area_plan', subAreaPlan);
        }

        personInChargeIds.forEach(id => {
            formData.append('person_in_charge_ids', id.toString());
        });

        createSubAreaMutation.mutate(formData, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['areas'] });
                setIsSubAreaModalOpen(false);
                setSubAreaName('');
                setSubAreaType('others');
                setSubAreaPlan(null);
                setSubOffsetX(0);
                setSubOffsetY(0);
                setSubOffsetZ(0);
                setSubScaleFactor(1.0);
                setPersonInChargeIds([]);
                setError('');
            },
        });
    };

    const handleAddSensor = () => {
        // Default to current area if no specific target selected
        const targetAreaId = selectedTargetAreaId || areaId;

        if (!selectedSensorId || !targetAreaId) return;

        // Use updateSensorMutation to patch sensor with area and position
        updateSensorMutation.mutate(
            {
                sensorId: selectedSensorId,
                data: {
                    area: Number(targetAreaId),
                    x_val: sensorX,
                    y_val: sensorY,
                    z_val: sensorZ
                }
            },
            {
                onSuccess: () => {
                    setIsSensorModalOpen(false);
                    setSelectedSensorId('');
                    setSelectedTargetAreaId('');
                    setSensorX(0);
                    setSensorY(0);
                    setSensorZ(0);
                },
            }
        );
    };

    const handleCardClick = (subAreaId: number) => {
        navigate(`/halo/sensors/areas/${areaId}/subzones/${subAreaId}`);
    };

    const handleEditClick = (e: React.MouseEvent, area: Area) => {
        e.stopPropagation();
        setEditingArea(area);
        setIsEditModalOpen(true);
    };

    const handleDeleteArea = (e: React.MouseEvent, area: Area) => {
        e.stopPropagation();

        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete sub-area "${area.name}". This action cannot be undone and may affect sensors assigned here.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: document.documentElement.className.includes('dark') ? '#1a1a1a' : '#fff',
            color: document.documentElement.className.includes('dark') ? '#fff' : '#000',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAreaMutation.mutate(area.id);
            }
        });
    };

    const handleUnassignSensor = (e: React.MouseEvent, sensor: any) => {
        e.stopPropagation();

        Swal.fire({
            title: 'Unassign Sensor?',
            text: `Are you sure you want to remove "${sensor.name}" from this area?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, unassign',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'swal-neumorphic-popup',
                confirmButton: 'btn btn-neumorphic text-danger mx-2',
                cancelButton: 'btn btn-neumorphic mx-2'
            },
            buttonsStyling: false,
            background: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#1a1a1a' : '#e0e5ec',
            color: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#fff' : '#4d4d4d',
        }).then((result) => {
            if (result.isConfirmed) {
                updateSensorMutation.mutate({
                    sensorId: sensor.id,
                    data: { area: null }
                });
            }
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
                    <Breadcrumb>
                        <BreadcrumbItem to='/halo/sensors/areas'>Main Areas</BreadcrumbItem>
                    </Breadcrumb>
                </SubHeaderLeft>
                <SubHeaderRight>
                    <div className='d-flex gap-3'>
                        <Button
                            isNeumorphic
                            color='info'
                            icon='ViewInAr'
                            onClick={() => navigate(`/halo/sensors/areas/${areaId}/3d`)}
                            title='3D View'
                        >
                            3D View
                        </Button>
                        <Button
                            isNeumorphic
                            color='info'
                            icon='Add'
                            onClick={() => setIsSubAreaModalOpen(true)}
                        >
                            Create Sub Area
                        </Button>
                        <Button
                            isNeumorphic
                            color='primary'
                            icon='Sensors'
                            onClick={() => setIsSensorModalOpen(true)}
                        >
                            Add Sensor
                        </Button>
                    </div>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>
                {/* Aggregated Metrics Section */}

                {/* Metrics Row */}
                <div className='mb-4'>
                    <div className='row g-3'>
                        {metricGroups.map(group => (
                            <div key={group.key} className='col-6 col-md-4 col-xl-2'>
                                <div
                                    onClick={() => setActiveMetricGroup(group)}
                                    className='rounded-2 p-3 h-100 d-flex flex-column align-items-center text-center'
                                    style={{
                                        border: '1px solid #d1d5db',
                                        background: group.hasData ? '#f9fafb' : '#fafafa',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px #9ca3af44')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                >
                                    {/* Icon */}
                                    <div
                                        className='rounded-2 d-flex align-items-center justify-content-center mb-2'
                                        style={{ width: 36, height: 36, background: '#e5e7eb', color: '#374151' }}
                                    >
                                        <Icon icon={group.icon as any} size='sm' />
                                    </div>

                                    {/* Label */}
                                    <div className='fw-semibold mb-1' style={{ fontSize: '0.72rem', lineHeight: 1.3, color: '#111827' }}>
                                        {group.label}
                                    </div>

                                    {/* Representative value or No Data */}
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
                                            <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{group.representativeUnit}</div>
                                        </div>
                                    ) : (
                                        <div className='mt-auto text-muted' style={{ fontSize: '0.65rem' }}>No Data</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail Modal */}
                <Modal
                    isOpen={!!activeMetricGroup}
                    setIsOpen={(v) => { if (!v) setActiveMetricGroup(null); }}
                    size='lg'
                    isCentered
                    isScrollable
                >
                    <ModalHeader setIsOpen={() => setActiveMetricGroup(null)}>
                        <ModalTitle id='metric-detail-modal'>
                            {activeMetricGroup && (
                                <div className='d-flex align-items-center gap-3'>
                                    <div
                                        className='rounded-2 d-flex align-items-center justify-content-center flex-shrink-0'
                                        style={{ width: 36, height: 36, background: '#e5e7eb', color: '#374151' }}
                                    >
                                        <Icon icon={activeMetricGroup.icon as any} />
                                    </div>
                                    <div>
                                        <div className='fw-bold fs-6'>{activeMetricGroup.label}</div>
                                        <div className='text-muted' style={{ fontSize: '0.72rem' }}>
                                            {currentArea?.name} · Min & Max over selected period
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ModalTitle>
                    </ModalHeader>

                    <ModalBody className='p-0'>
                        {activeMetricGroup && (
                            <>
                                <div style={{ height: 3, background: '#e5e7eb' }} />
                                <div className='p-4'>
                                    {activeMetricGroup.hasData ? (
                                        <div className='row g-3'>
                                            {activeMetricGroup.metrics.map((metric: any) => (
                                                <div key={metric.key} className='col-6 col-md-4'>
                                                    <div
                                                        className='p-3 rounded-2 text-center'
                                                        style={{
                                                            border: '1px solid #e5e7eb',
                                                            background: '#f9fafb',
                                                        }}
                                                    >
                                                        <div className='fw-bold mb-3' style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#374151' }}>
                                                            {metric.label}
                                                        </div>
                                                        <div className='d-flex justify-content-between align-items-center mb-2 px-1'>
                                                            <span className='text-muted' style={{ fontSize: '0.65rem', fontWeight: 700 }}>MIN</span>
                                                            <span className='fw-bold' style={{ fontSize: '1.1rem' }}>
                                                                {metric.min ?? <span className='text-muted fs-6'>—</span>}
                                                            </span>
                                                        </div>
                                                        <div className='d-flex justify-content-between align-items-center px-1'>
                                                            <span className='text-muted' style={{ fontSize: '0.65rem', fontWeight: 700 }}>MAX</span>
                                                            <span className='fw-bold' style={{ fontSize: '1.1rem', color: '#374151' }}>
                                                                {metric.max ?? <span className='text-muted fs-6'>—</span>}
                                                            </span>
                                                        </div>
                                                        <div className='mt-2'>
                                                            <span
                                                                className='rounded-pill px-2 py-1'
                                                                style={{ fontSize: '0.62rem', fontWeight: 600, background: '#e5e7eb', color: '#374151' }}
                                                            >
                                                                {metric.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='text-center py-5'>
                                            <div className='rounded-circle d-inline-flex align-items-center justify-content-center mb-3'
                                                style={{ width: 64, height: 64, background: '#f3f4f6' }}>
                                                <Icon icon={activeMetricGroup.icon as any} className='text-muted fs-3' />
                                            </div>
                                            <div className='fw-semibold text-muted mb-1'>No data available</div>
                                            <div className='text-muted small'>No readings recorded for this group in the selected time window.</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </ModalBody>
                </Modal>
                {/* Filter Section */}
                <div className='row mb-4'>
                    <div className='col-12'>
                        <Card>
                            <CardBody>
                                <div className='row g-3 align-items-end'>
                                    <div className='col-md-6'>
                                        <FormGroup label='Search'>
                                            <div className='input-group'>
                                                <span className='input-group-text'>
                                                    <Icon icon='Search' />
                                                </span>
                                                <Input
                                                    type='text'
                                                    placeholder='Search by name, MAC address, or type...'
                                                    value={searchTerm}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </FormGroup>
                                    </div>
                                    <div className='col-md-3'>
                                        <FormGroup label='Status Filter'>
                                            <select
                                                className='form-select'
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                            >
                                                <option value='all'>All Status</option>
                                                <option value='active'>Active Only</option>
                                                <option value='inactive'>Inactive Only</option>
                                            </select>
                                        </FormGroup>
                                    </div>
                                    <div className='col-md-3'>
                                        <Button
                                            className='w-100'
                                            onClick={() => {
                                                setSearchTerm('');
                                                setFilterStatus('all');
                                            }}
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Sub Areas Section */}
                {subAreas.length > 0 && (
                    <div className='mb-4'>
                        <div className='d-flex align-items-center justify-content-between mb-3'>
                            <div className='d-flex align-items-center'>
                                <Icon icon='GroupWork' className='me-2 fs-4' />
                                <span className='h5 mb-0 fw-bold'>Sub Areas</span>
                            </div>
                            <Badge color='info' isLight className='fs-6'>
                                {filteredSubAreas.length} of {subAreas.length}
                            </Badge>
                        </div>
                        <div className='row g-4 mb-4'>
                            {filteredSubAreas.map(subArea => (
                                <div key={subArea.id} className='col-md-6 col-xl-4'>
                                    <Card
                                        stretch
                                        className='cursor-pointer transition-shadow'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleCardClick(subArea.id)}
                                    >
                                        <CardHeader>
                                            <CardTitle>{subArea.name}</CardTitle>
                                            <CardActions>
                                                <Button
                                                    color='info'
                                                    isLight
                                                    icon='Edit'
                                                    size='sm'
                                                    onClick={(e: any) => handleEditClick(e, subArea)}
                                                    className='me-1'
                                                    title='Edit Sub Area'
                                                />
                                                <Button
                                                    color='danger'
                                                    isLight
                                                    icon='Delete'
                                                    size='sm'
                                                    onClick={(e: any) => handleDeleteArea(e, subArea)}
                                                    className='me-1'
                                                    title='Delete Sub Area'
                                                />
                                                <Badge color='success' isLight>
                                                    Active
                                                </Badge>
                                            </CardActions>
                                        </CardHeader>
                                        <CardBody>
                                            <div className='d-flex justify-content-between align-items-center mb-2'>
                                                <div className='text-muted'>
                                                    <Icon icon='Sensors' size='sm' className='me-1' />
                                                    Sensors
                                                </div>
                                                <div className='fw-bold fs-5'>{subArea.sensor_count || 0}</div>
                                            </div>
                                            <div className='border-top border-light pt-3 mt-3'>
                                                <div className='text-muted small mb-2'>
                                                    <Icon icon='AssignmentInd' size='sm' className='me-1' />
                                                    Persons in Charge
                                                </div>
                                                <div className='d-flex flex-wrap gap-1'>
                                                    {((subArea.person_in_charge && subArea.person_in_charge.length > 0) || (subArea.person_in_charge_ids && subArea.person_in_charge_ids.length > 0)) ? (
                                                        <>
                                                            {subArea.person_in_charge && subArea.person_in_charge.length > 0 ? (
                                                                subArea.person_in_charge.map(person => (
                                                                    <Badge key={person.id} color='primary' isLight className='rounded-pill'>
                                                                        {person.first_name} {person.last_name}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                subArea.person_in_charge_ids?.map(userId => {
                                                                    const user = users?.find(u => u.id === userId);
                                                                    return user ? (
                                                                        <Badge key={userId} color='primary' isLight className='rounded-pill'>
                                                                            {user.first_name} {user.last_name}
                                                                        </Badge>
                                                                    ) : null;
                                                                })
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className='text-muted small italic text-opacity-50'>Unassigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            ))}
                            {filteredSubAreas.length === 0 && searchTerm && (
                                <div className='col-12'>
                                    <Card>
                                        <CardBody className='text-center py-4'>
                                            <Icon icon='SearchOff' className='fs-1 text-muted mb-2' />
                                            <p className='text-muted mb-0'>No sub areas match your search</p>
                                        </CardBody>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Direct Sensors Section */}
                <div>
                    <div className='d-flex align-items-center justify-content-between mb-3'>
                        <div className='d-flex align-items-center'>
                            <Icon icon='Sensors' className='me-2 fs-4' />
                            <span className='h5 mb-0 fw-bold'>Sensors in {currentArea?.name}</span>
                        </div>
                        <Badge color='success' isLight className='fs-6'>
                            {filteredSensors.length} of {areaSensors.length}
                        </Badge>
                    </div>

                    <div className='row g-4'>
                        {filteredSensors.map(sensor => (
                            <div key={sensor.id} className='col-md-6 col-xl-4'>
                                <Card stretch>
                                    <CardHeader>
                                        <CardTitle>{sensor.name}</CardTitle>
                                        <CardActions>
                                            <Button
                                                color='danger'
                                                isLight
                                                icon='LinkOff'
                                                size='sm'
                                                onClick={(e: any) => handleUnassignSensor(e, sensor)}
                                                className='me-2'
                                                title='Remove from Area'
                                            />
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

                        {subAreas.length === 0 && areaSensors.length === 0 && (
                            <div className='col-12'>
                                <Card>
                                    <CardBody className='text-center py-5'>
                                        <Icon icon='Inventory' className='display-1 text-muted mb-3' />
                                        <h4>No sub areas or sensors yet</h4>
                                        <p className='text-muted'>
                                            Create sub areas to organize this location or add sensors directly.
                                        </p>
                                        <div className='d-flex gap-2 justify-content-center mt-3'>
                                            <Button
                                                color='info'
                                                icon='Add'
                                                onClick={() => setIsSubAreaModalOpen(true)}
                                            >
                                                Create Sub Area
                                            </Button>
                                            <Button
                                                color='primary'
                                                icon='Sensors'
                                                onClick={() => setIsSensorModalOpen(true)}
                                            >
                                                Add Sensor
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        )}

                        {filteredSensors.length === 0 && areaSensors.length > 0 && (
                            <div className='col-12'>
                                <Card>
                                    <CardBody className='text-center py-4'>
                                        <Icon icon='SearchOff' className='fs-1 text-muted mb-2' />
                                        <p className='text-muted mb-0'>No sensors match your filters</p>
                                    </CardBody>
                                </Card>
                            </div>
                        )}

                        {areaSensors.length === 0 && subAreas.length > 0 && (
                            <div className='col-12'>
                                <Card>
                                    <CardBody className='text-center py-4'>
                                        <Icon icon='Sensors' className='fs-1 text-muted mb-2' />
                                        <p className='text-muted mb-0'>
                                            No sensors directly assigned to this area.
                                        </p>
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
                    <ModalTitle id='add-sensor-to-area-title'>
                        Add Sensor to Area
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='mb-3'>
                        <label className='form-label'>Target Area</label>
                        <select
                            className='form-select'
                            value={selectedTargetAreaId || areaId || ''}
                            onChange={(e) => setSelectedTargetAreaId(e.target.value)}
                        >
                            <option value={areaId}>Main Area ({currentArea?.name})</option>
                            {subAreas.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    Sub Area: {sub.name}
                                </option>
                            ))}
                        </select>
                        <div className='text-muted small mt-1'>
                            Select whether to add the sensor to the main area or one of its sub-areas.
                        </div>
                    </div>
                    <div className='mb-3'>
                        <label className='form-label'>Select Available Sensor</label>
                        <select
                            className='form-select'
                            value={selectedSensorId}
                            onChange={(e) => setSelectedSensorId(e.target.value)}
                        >
                            <option value=''>Choose a sensor...</option>
                            {availableSensors.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} - {s.mac_address} ({s.sensor_type})
                                </option>
                            ))}
                        </select>
                        {availableSensors.length === 0 && (
                            <div className='text-muted small mt-2'>
                                No unassigned sensors available. All sensors are already assigned.
                            </div>
                        )}
                    </div>

                    {/* Position Coordinates */}
                    <div className='border-top pt-3 mt-3'>
                        <label className='form-label fw-bold mb-3'>
                            <Icon icon='Place' size='sm' className='me-1' />
                            Sensor Placement Coordinates
                        </label>
                        <div className='row g-3'>
                            <div className='col-md-4'>
                                <FormGroup label='X Position'>
                                    <Input
                                        type='number'
                                        step={0.1}
                                        value={sensorX}
                                        onChange={(e: any) => setSensorX(parseFloat(e.target.value) || 0)}
                                        placeholder='0.0'
                                    />
                                </FormGroup>
                            </div>
                            <div className='col-md-4'>
                                <FormGroup label='Y Position'>
                                    <Input
                                        type='number'
                                        step={0.1}
                                        value={sensorY}
                                        onChange={(e: any) => setSensorY(parseFloat(e.target.value) || 0)}
                                        placeholder='0.0'
                                    />
                                </FormGroup>
                            </div>
                            <div className='col-md-4'>
                                <FormGroup label='Z Position (Height)'>
                                    <Input
                                        type='number'
                                        step={0.1}
                                        value={sensorZ}
                                        onChange={(e: any) => setSensorZ(parseFloat(e.target.value) || 0)}
                                        placeholder='0.0'
                                    />
                                </FormGroup>
                            </div>
                        </div>
                        <div className='text-muted small mt-2'>
                            <Icon icon='Info' size='sm' className='me-1' />
                            Specify the 3D coordinates for sensor placement in the area.
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsSensorModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleAddSensor}
                        isDisable={!selectedSensorId || updateSensorMutation.isPending}
                    >
                        {updateSensorMutation.isPending && <Spinner isSmall inButton />}
                        Add Sensor
                    </Button>
                </ModalFooter>
            </Modal >

            {/* Create Sub Area Modal */}
            < Modal isOpen={isSubAreaModalOpen} setIsOpen={setIsSubAreaModalOpen} >
                <ModalHeader setIsOpen={setIsSubAreaModalOpen}>
                    <ModalTitle id='create-subarea-title'>
                        Create Sub Area in {currentArea?.name}
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
                            <FormGroup label='Sub Area Name'>
                                <input
                                    type='text'
                                    className={`form-control ${error ? 'is-invalid' : ''}`}
                                    placeholder='e.g. West Wing, Server Room, etc.'
                                    value={subAreaName}
                                    onChange={(e) => {
                                        setSubAreaName(e.target.value);
                                        setError('');
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleCreateSubArea();
                                    }}
                                />
                                {error && <div className='invalid-feedback'>{error}</div>}
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Area Type'>
                                <select
                                    className='form-select'
                                    value={subAreaType}
                                    onChange={(e) => setSubAreaType(e.target.value)}
                                >
                                    <option value='floor'>Floor</option>
                                    <option value='room'>Room</option>
                                    <option value='zone'>Zone</option>
                                    <option value='others'>Others</option>
                                </select>
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Floor Plan Image (Optional)'>
                                <Input
                                    type='file'
                                    accept='image/*'
                                    onChange={(e: any) => setSubAreaPlan(e.target.files[0])}
                                />
                                {subAreaPlan && (
                                    <div className='mt-2 small text-success'>
                                        <Icon icon='CheckCircle' size='sm' className='me-1' />
                                        {subAreaPlan.name}
                                    </div>
                                )}
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Offset X'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={subOffsetX}
                                    onChange={(e: any) => setSubOffsetX(parseFloat(e.target.value) || 0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Offset Y'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={subOffsetY}
                                    onChange={(e: any) => setSubOffsetY(parseFloat(e.target.value) || 0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-md-4'>
                            <FormGroup label='Offset Z'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={subOffsetZ}
                                    onChange={(e: any) => setSubOffsetZ(parseFloat(e.target.value) || 0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <FormGroup label='Scale Factor'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    min={0.1}
                                    value={subScaleFactor}
                                    onChange={(e: any) => setSubScaleFactor(parseFloat(e.target.value) || 1.0)}
                                />
                            </FormGroup>
                        </div>

                        <div className='col-12'>
                            <Label>Assign Persons In Charge</Label>
                            <p className='text-muted small mb-2'>Assign one or more users to manage this sub area.</p>
                            <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users?.map((user: User) => (
                                    <div key={user.id} className='mb-2'>
                                        <Checks
                                            id={`user-${user.id}`}
                                            label={`${user.first_name} ${user.last_name} (@${user.username})`}
                                            checked={personInChargeIds.includes(user.id)}
                                            onChange={() => {
                                                setPersonInChargeIds(prev =>
                                                    prev.includes(user.id)
                                                        ? prev.filter(id => id !== user.id)
                                                        : [...prev, user.id]
                                                );
                                            }}
                                        />
                                    </div>
                                ))}
                                {(!users || users.length === 0) && (
                                    <div className='text-muted small'>No users found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color='light'
                        onClick={() => {
                            setIsSubAreaModalOpen(false);
                            setSubAreaName('');
                            setError('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleCreateSubArea}
                        isDisable={createSubAreaMutation.isPending}
                    >
                        {createSubAreaMutation.isPending && <Spinner isSmall inButton />}
                        Create Sub Area
                    </Button>
                </ModalFooter>
            </Modal >
            <EditAreaModal
                isOpen={isEditModalOpen}
                setIsOpen={setIsEditModalOpen}
                area={editingArea}
            />
        </PageWrapper >
    );
};

export default SensorGroups;