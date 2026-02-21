import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import Spinner from '../../../components/bootstrap/Spinner';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import {
    useAreas,
    useSensors,
    useUsers,
    useUpdateSensor,
    useAggregatedSensorData,
} from '../../../api/sensors.api';
import { Area } from '../../../types/sensor';
import { filterSensors } from '../utils/sensorData.utils';
import { buildAreaBreadcrumbPath } from '../utils/navigation.utils';
import EditAreaModal from './modals/EditAreaModal';
import {
    getEffectiveConfig,
    buildProcessedMetrics,
    buildEventStatuses,
} from '../utils/radarMapping.utils';

import MiniGauge from './components/MiniGauge';
import SensorCard from './components/SensorCard';
import AddSensorModal from './modals/AddSensorModal';
import CreateSubAreaModal from './modals/CreateSubAreaModal';
import { useAreaActions } from './hooks/useAreaActions';

// ── Metric Groups ─────────────────────────────────────────────────────────────
const METRIC_GROUPS = [
    { key: 'room_conditions', label: 'Room Conditions', icon: 'Thermostat', metricKeys: ['temperature', 'humidity', 'pressure', 'light'] },
    { key: 'air_particles', label: 'Air Dust & Particles', icon: 'Grain', metricKeys: ['pm1', 'pm25', 'pm10'] },
    { key: 'air_composition', label: 'Air Composition', icon: 'Science', metricKeys: ['co', 'co2', 'tvoc', 'nh3', 'no2'] },
    { key: 'air_quality', label: 'Air Quality Score', icon: 'Shield', metricKeys: ['aqi', 'health'] },
    { key: 'movement', label: 'Activity & Movement', icon: 'DirectionsRun', metricKeys: ['movement'] },
    { key: 'sound', label: 'Sound & Noise', icon: 'VolumeUp', metricKeys: ['noise'] },
];

const AreaZoneView = () => {
    const { areaId, subzoneId } = useParams<{ areaId: string; subzoneId?: string }>();
    const navigate = useNavigate();

    const isSubzone = !!subzoneId;
    const activeId = subzoneId ?? areaId;

    // ── Data fetching ─────────────────────────────────────────────────────────
    const { data: areas, isLoading: areasLoading } = useAreas();
    const { data: users } = useUsers();
    const { data: zoneSensors = [], isLoading: sensorsLoading } = useSensors({ areaId: activeId || undefined });
    const { data: allUnassignedSensors = [] } = useSensors();
    const { data: aggregatedResponse } = useAggregatedSensorData({
        area_id: activeId ? [Number(activeId)] : [],
    });

    // ── Actions hook ──────────────────────────────────────────────────────────
    const {
        isSubAreaModalOpen,
        setIsSubAreaModalOpen,
        isSensorModalOpen,
        setIsSensorModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        editingArea,
        handleCreateSubArea,
        handleOpenEditModal,
        handleDeleteArea,
        handleAddSensor,
        handleUnassignSensor,
        createSubAreaMutation,
        updateSensorMutation
    } = useAreaActions();

    // ── UI State ──────────────────────────────────────────────────────────────
    const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [isMetricsCollapsed, setIsMetricsCollapsed] = useState(false);

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

    // buildEventStatuses used for future event status display
    const _eventStatuses = useMemo(() => buildEventStatuses(aggData), [aggData]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChildCardClick = (childId: number) => navigate(`/halo/sensors/areas/${areaId}/subzones/${childId}`);

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

                {hasNoConfig && (
                    <div className='alert alert-primary text-light d-flex align-items-center mb-4' role='alert'>
                        <Icon icon='WarningAmber' className='me-2' />
                        <span>No threshold configuration found for this area. Gauges will show raw values without color status.</span>
                    </div>
                )}

                {/* ── Environmental Insights ── */}
                <Card className='mb-4'>
                    <CardHeader className='bg-transparent border-light border-bottom pb-3'>
                        <CardTitle tag='h4' className='mb-0'>
                            <Icon icon='Analytics' className='me-2 text-primary' />
                            Environmental Insights
                        </CardTitle>
                        <CardActions>
                            <Button
                                isNeumorphic
                                size='sm'
                                icon={isMetricsCollapsed ? 'KeyboardArrowDown' : 'KeyboardArrowUp'}
                                onClick={() => setIsMetricsCollapsed(!isMetricsCollapsed)}
                                title={isMetricsCollapsed ? 'Expand Metrics' : 'Collapse Metrics'}
                            />
                        </CardActions>
                    </CardHeader>
                    {!isMetricsCollapsed && (
                        <CardBody className='py-3'>
                            <div className='d-flex flex-wrap gap-2'>
                                <Button
                                    isNeumorphic
                                    onClick={() => { setActiveGroupKey(null); setIsMetricsCollapsed(false); }}
                                >
                                    All
                                </Button>
                                {METRIC_GROUPS.map(g => {
                                    const gm = buildProcessedMetrics(aggData, effectiveConfig, g.metricKeys);
                                    if (gm.length === 0) return null;
                                    const isActive = activeGroupKey === g.key;
                                    return (
                                        <Button
                                            key={g.key}
                                            onClick={() => { setActiveGroupKey(isActive ? null : g.key); setIsMetricsCollapsed(false); }}
                                            isNeumorphic
                                        >
                                            {g.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardBody>
                    )}
                    {!isMetricsCollapsed && (
                        <CardBody>
                            {displayedMetrics.length > 0 ? (
                                <div className='row g-3'>
                                    {displayedMetrics.map(metric => (
                                        <div key={metric.key} className='col-6 col-md-4 col-lg-3 col-xl-2'>
                                            <MiniGauge
                                                metric={metric}
                                                onSensorClick={(sensorId) => navigate(`/halo/sensors/detail/${sensorId}`)}
                                            />
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
                    )}
                </Card>

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
                                                <Button color='info' isLight icon='Edit' size='sm' onClick={(e: any) => handleOpenEditModal(e, child)} className='me-1' />
                                                <Button color='danger' isLight icon='Delete' size='sm' onClick={(e: any) => handleDeleteArea(child, e)} className='me-1' />
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

                {/* ── Sensors ── */}
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
                                <SensorCard sensor={sensor} onUnassign={handleUnassignSensor} />
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

            </Page>

            {/* Modals */}
            <AddSensorModal
                isOpen={isSensorModalOpen}
                setIsOpen={setIsSensorModalOpen}
                zoneName={currentZone?.name}
                isSubzone={isSubzone}
                areaId={areaId}
                parentAreaName={parentArea?.name}
                childSubAreas={childSubAreas}
                availableSensors={availableSensors}
                isPending={updateSensorMutation.isPending}
                onSubmit={handleAddSensor}
            />

            <CreateSubAreaModal
                isOpen={isSubAreaModalOpen}
                setIsOpen={setIsSubAreaModalOpen}
                parentZoneName={currentZone?.name}
                users={users}
                isPending={createSubAreaMutation.isPending}
                onSubmit={(data) => handleCreateSubArea(data, activeId)}
            />

            <EditAreaModal
                isOpen={isEditModalOpen}
                setIsOpen={setIsEditModalOpen}
                area={editingArea}
            />
        </PageWrapper>
    );
};

export default AreaZoneView;