import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from '../../../../layout/Page/Page';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../../layout/SubHeader/SubHeader';
import Breadcrumb, { BreadcrumbItem } from '../../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Spinner from '../../../../components/bootstrap/Spinner';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import { useAreas, useAddSensorToSubArea, useSensors, useCreateSubArea, useUpdateSensor, useUsers, useAggregatedSensorData } from '../../../../api/sensors.api';
import { useQueryClient } from '@tanstack/react-query';
import { Area, User } from '../../../../types/sensor';
import Swal from 'sweetalert2';
import { buildAreaBreadcrumbPath } from '../../utils/navigation.utils';
import { filterSensors, getSensorsByArea, getAvailableSensors, calculateRadarSeries, calculateGroupRadarSeries } from '../../utils/sensorData.utils';
import Label from '../../../../components/bootstrap/forms/Label';
import Chart from '../../../../components/extras/Chart';
import Checks from '../../../../components/bootstrap/forms/Checks';

const METRIC_GROUPS = [
    {
        key: 'room_conditions',
        label: 'Room Conditions',
        icon: 'Thermostat',
        accentColor: '#1b1a1aff',
        representative: 'temperature',
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

const AreaSubzoneDetail = () => {
    const { areaId, subzoneId } = useParams<{ areaId: string; subzoneId: string }>();
    const navigate = useNavigate();
    const { data: areas, isLoading: areasLoading } = useAreas();
    const { data: allSensors, isLoading: sensorsLoading } = useSensors();
    const { data: users } = useUsers();
    const addSensorMutation = useAddSensorToSubArea();
    const createSubAreaMutation = useCreateSubArea();
    const updateSensorMutation = useUpdateSensor();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubAreaModalOpen, setIsSubAreaModalOpen] = useState(false);
    const [selectedSensorId, setSelectedSensorId] = useState('');
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

    // Fetch aggregated data for the current subzone
    const { data: aggregatedResponse, isLoading: aggregatedLoading } = useAggregatedSensorData({
        area_id: subzoneId ? [Number(subzoneId)] : []
    });

    // Find target subarea directly from the flat list
    const currentSubArea = useMemo(() => {
        return areas?.find(sub => sub.id === Number(subzoneId));
    }, [areas, subzoneId]);

    // Find the main area for context
    const currentArea = useMemo(() => {
        return areas?.find(area => area.id === Number(areaId));
    }, [areas, areaId]);

    // Get nested sub-areas
    const nestedSubAreas = useMemo(() => {
        const subareaIds = currentSubArea?.subareas || [];
        if (!areas || subareaIds.length === 0) return [];
        return subareaIds
            .map((id: number) => areas.find(area => area.id === id))
            .filter((area): area is Area => area !== undefined);
    }, [currentSubArea, areas]);

    // Build breadcrumb path
    const breadcrumbPath = useMemo(() => {
        return buildAreaBreadcrumbPath(currentSubArea, areas, areaId || '');
    }, [currentSubArea, areas, areaId]);

    // Get sensors for this area
    const sensors = useMemo(() => {
        const targetId = subzoneId || areaId;
        const rawSensors = getSensorsByArea(allSensors || [], targetId, currentSubArea?.name, areas);
        return rawSensors.map(s => ({
            ...s,
            x_coordinate: s.x_coordinate ?? s.x_val,
            y_coordinate: s.y_coordinate ?? s.y_val,
        }));
    }, [allSensors, subzoneId, areaId, currentSubArea, areas]);

    // Get available sensors
    const availableSensors = useMemo(() => {
        return getAvailableSensors(allSensors || []);
    }, [allSensors]);

    // Filter nested sub areas
    const filteredNestedSubAreas = useMemo(() => {
        if (!nestedSubAreas) return [];
        return nestedSubAreas.filter(subArea =>
            (subArea.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [nestedSubAreas, searchTerm]);

    // Filter sensors
    const filteredSensors = useMemo(() => {
        return filterSensors(sensors, searchTerm, filterStatus);
    }, [sensors, searchTerm, filterStatus]);

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

    const radarData = useMemo(() => {
        if (activeMetricGroup) {
            return calculateGroupRadarSeries(aggregatedResponse?.aggregated_data, activeMetricGroup.metrics);
        }
        return {
            categories: ['Temp', 'CO2', 'PM2.5', 'Sound', 'Light', 'AQI'],
            series: [{ name: 'Environment Score', data: calculateRadarSeries(aggregatedResponse?.aggregated_data) }]
        };
    }, [aggregatedResponse, activeMetricGroup]);

    const radarOptions: any = {
        chart: {
            type: 'radar',
            toolbar: { show: false },
        },
        xaxis: {
            categories: radarData.categories,
            labels: {
                style: {
                    colors: Array(radarData.categories.length).fill(document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#adb5bd' : '#495057'),
                    fontSize: '11px',
                }
            }
        },
        yaxis: {
            show: false,
            min: 0,
            max: 100,
        },
        fill: {
            opacity: activeMetricGroup ? 0.2 : 0.3,
        },
        markers: {
            size: activeMetricGroup ? 3 : 4,
        },
        stroke: {
            width: 2,
        },
        colors: activeMetricGroup
            ? [import.meta.env.VITE_INFO_COLOR || '#4d69fa', import.meta.env.VITE_PRIMARY_COLOR || '#7a3a6f']
            : [import.meta.env.VITE_PRIMARY_COLOR || '#7a3a6f'],
        legend: {
            show: !!activeMetricGroup,
            position: 'bottom',
        }
    };


    const handleAddSensor = () => {
        if (!selectedSensorId || !subzoneId) return;
        updateSensorMutation.mutate(
            {
                sensorId: selectedSensorId,
                data: {
                    area: Number(subzoneId),
                    x_val: sensorX,
                    y_val: sensorY,
                    z_val: sensorZ
                }
            },
            {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setSelectedSensorId('');
                    setSensorX(0);
                    setSensorY(0);
                    setSensorZ(0);
                },
            }
        );
    };

    const handleCreateSubArea = () => {
        if (!subAreaName.trim()) {
            setError('Sub area name is required');
            return;
        }

        const formData = new FormData();
        formData.append('name', subAreaName);
        formData.append('area_type', subAreaType);
        formData.append('parent_id', subzoneId || '');
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

    const handleNestedCardClick = (nestedSubAreaId: number) => {
        navigate(`/halo/sensors/areas/${areaId}/subzones/${nestedSubAreaId}`);
    };

    const handleUnassignSensor = (e: React.MouseEvent, sensor: any) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Unassign Sensor?',
            text: `Are you sure you want to remove "${sensor.name}" from this sub-area?`,
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

    if (areasLoading || sensorsLoading) {
        return (
            <PageWrapper title='Sub Area Details'>
                <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
                    <Spinner color='primary' size='3rem' />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title='Sub Area Details'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'Areas', to: '/halo/sensors/areas' },
                            { title: currentArea?.name || 'Area', to: `/halo/sensors/areas/${areaId}/subzones` },
                            ...breadcrumbPath
                        ]}
                    />
                </SubHeaderLeft>
                <SubHeaderRight>
                    <div className='d-flex gap-3'>
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
                            onClick={() => setIsModalOpen(true)}
                        >
                            Add Sensor
                        </Button>
                    </div>
                </SubHeaderRight>
            </SubHeader>
            <Page container='fluid'>
                {/* Environmental Overview Section */}
                <div className='row mb-4'>
                    <div className='col-lg-12'>
                        <Card stretch className='shadow-none border border-light'>
                            <CardHeader className='bg-transparent'>
                                <CardTitle>
                                    <Icon icon='Analytics' className='me-2 text-primary' />
                                    Environmental Overview
                                </CardTitle>
                                <CardActions>
                                    <Badge color='info' isLight className='px-3 py-2'>
                                        Real-time Analysis
                                    </Badge>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                <div className='row align-items-center'>
                                    <div className='col-md-5 text-center'>
                                        <Chart
                                            type='radar'
                                            series={radarData.series}
                                            options={radarOptions}
                                            height={300}
                                        />
                                    </div>
                                    <div className='col-md-7 border-start border-light ps-4'>
                                        <div className='d-flex justify-content-between align-items-start mb-3'>
                                            <div>
                                                <h5 className='mb-1 fw-bold'>
                                                    {activeMetricGroup ? `${activeMetricGroup.label} Detail` : 'Area Health Score'}
                                                </h5>
                                                <p className='text-muted small mb-0'>
                                                    {activeMetricGroup
                                                        ? `Showing Min/Max ranges for ${activeMetricGroup.label.toLowerCase()} sensors.`
                                                        : 'Overall environmental balance based on all sensor categories.'
                                                    }
                                                </p>
                                            </div>
                                            {activeMetricGroup && (
                                                <Button
                                                    size='sm'
                                                    color='primary'
                                                    isLight
                                                    onClick={() => setActiveMetricGroup(null)}
                                                    icon='RestartAlt'
                                                >
                                                    Back to Overview
                                                </Button>
                                            )}
                                        </div>

                                        {!activeMetricGroup ? (
                                            <div className='row g-3 mt-2'>
                                                <div className='col-6'>
                                                    <div className='d-flex align-items-center mb-2'>
                                                        <div className='rounded-circle bg-primary bg-opacity-10 p-2 me-2'>
                                                            <Icon icon='Thermostat' className='text-primary' size='sm' />
                                                        </div>
                                                        <span className='small fw-bold'>Comfort: {Math.round(radarData.series[0].data[0])}%</span>
                                                    </div>
                                                    <div className='d-flex align-items-center'>
                                                        <div className='rounded-circle bg-info bg-opacity-10 p-2 me-2'>
                                                            <Icon icon='Science' className='text-info' size='sm' />
                                                        </div>
                                                        <span className='small fw-bold'>Air Purity: {Math.round(radarData.series[0].data[1])}%</span>
                                                    </div>
                                                </div>
                                                <div className='col-6'>
                                                    <div className='d-flex align-items-center mb-2'>
                                                        <div className='rounded-circle bg-success bg-opacity-10 p-2 me-2'>
                                                            <Icon icon='Shield' className='text-success' size='sm' />
                                                        </div>
                                                        <span className='small fw-bold'>Safety: {Math.round(radarData.series[0].data[5])}%</span>
                                                    </div>
                                                    <div className='d-flex align-items-center'>
                                                        <div className='rounded-circle bg-warning bg-opacity-10 p-2 me-2'>
                                                            <Icon icon='VolumeUp' className='text-warning' size='sm' />
                                                        </div>
                                                        <span className='small fw-bold'>Acoustics: {Math.round(radarData.series[0].data[3])}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className='row g-2 mt-2'>
                                                {activeMetricGroup.metrics.map((m: any, idx: number) => (
                                                    <div key={m.key} className='col-6'>
                                                        <div className='p-2 border border-light rounded bg-light bg-opacity-25'>
                                                            <div className='small text-muted mb-1'>{m.label}</div>
                                                            <div className='d-flex justify-content-between align-items-baseline'>
                                                                <span className='fw-bold text-dark'>{Math.round(radarData.series[1].data[idx])}%</span>
                                                                <span className='small text-muted'>{m.unit}</span>
                                                            </div>
                                                            <div className='progress mt-1' style={{ height: 4 }}>
                                                                <div
                                                                    className='progress-bar bg-primary'
                                                                    style={{ width: `${radarData.series[1].data[idx]}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Aggregated Metrics Row */}
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
                                    <div
                                        className='rounded-2 d-flex align-items-center justify-content-center mb-2'
                                        style={{ width: 36, height: 36, background: '#e5e7eb', color: '#374151' }}
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

                {
                    nestedSubAreas.length > 0 && (
                        <div className='mb-4'>
                            <div className='d-flex align-items-center justify-content-between mb-3'>
                                <div className='d-flex align-items-center'>
                                    <Icon icon='AccountTree' className='me-2 fs-4' />
                                    <span className='h5 mb-0 fw-bold'>Sub Areas of {currentSubArea?.name}</span>
                                </div>
                                <Badge color='info' isLight className='fs-6'>
                                    {filteredNestedSubAreas.length} of {nestedSubAreas.length}
                                </Badge>
                            </div>
                            <div className='row g-4 mb-4'>
                                {filteredNestedSubAreas.map(nestedSubArea => (
                                    <div key={nestedSubArea.id} className='col-md-6 col-xl-4'>
                                        <Card
                                            stretch
                                            className='cursor-pointer transition-shadow'
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleNestedCardClick(nestedSubArea.id)}
                                        >
                                            <CardHeader>
                                                <CardTitle>{nestedSubArea.name}</CardTitle>
                                                <CardActions>
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
                                                    <div className='fw-bold fs-5'>{nestedSubArea.sensor_count || 0}</div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                <div>
                    <div className='d-flex align-items-center justify-content-between mb-3'>
                        <div className='d-flex align-items-center'>
                            <Icon icon='Sensors' className='me-2 fs-4' />
                            <span className='h5 mb-0 fw-bold'>Sensors in {currentSubArea?.name}</span>
                        </div>
                        <Badge color='success' isLight className='fs-6'>
                            {filteredSensors.length} of {sensors.length}
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
                                    </CardBody>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </Page>

            {/* Standardized Add Sensor Modal */}
            <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} isCentered>
                <ModalHeader setIsOpen={setIsModalOpen}>
                    <ModalTitle id='add-sensor-to-subzone-title'>Add Sensor to {currentSubArea?.name}</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
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
                        </div>
                        <div className='col-md-4'>
                            <FormGroup label='X Position'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={sensorX}
                                    onChange={(e: any) => setSensorX(parseFloat(e.target.value) || 0)}
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
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-4'>
                            <FormGroup label='Z Position'>
                                <Input
                                    type='number'
                                    step={0.1}
                                    value={sensorZ}
                                    onChange={(e: any) => setSensorZ(parseFloat(e.target.value) || 0)}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={handleAddSensor}
                        isDisable={!selectedSensorId || updateSensorMutation.isPending}
                    >
                        {updateSensorMutation.isPending && <Spinner isSmall inButton />}
                        Add to Sub Area
                    </Button>
                </ModalFooter>
            </Modal >

            {/* Standardized Create Sub Area Modal */}
            < Modal isOpen={isSubAreaModalOpen} setIsOpen={setIsSubAreaModalOpen} isCentered size='lg' >
                <ModalHeader setIsOpen={setIsSubAreaModalOpen}>
                    <ModalTitle id='create-nested-subarea-title'>
                        Create Sub Area in {currentSubArea?.name}
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-3'>
                        <div className='col-12'>
                            <FormGroup label='Sub Area Name'>
                                <input
                                    type='text'
                                    className={`form-control ${error ? 'is-invalid' : ''}`}
                                    placeholder='e.g. Room 101, Workstation Area, etc.'
                                    value={subAreaName}
                                    onChange={(e) => {
                                        setSubAreaName(e.target.value);
                                        setError('');
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
                                    <option value='building'>Building</option>
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
                                {subAreaPlan && <div className='mt-2 small text-success'>{subAreaPlan.name}</div>}
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
                            <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users?.map((user: User) => (
                                    <div key={user.id} className='mb-2'>
                                        <Checks
                                            id={`user-${user.id}`}
                                            label={`${user.first_name} ${user.last_name}`}
                                            checked={personInChargeIds.includes(user.id)}
                                            onChange={() => {
                                                setPersonInChargeIds(prev =>
                                                    prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                                );
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsSubAreaModalOpen(false)}>
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
            </Modal>
        </PageWrapper>
    );
};

export default AreaSubzoneDetail;

