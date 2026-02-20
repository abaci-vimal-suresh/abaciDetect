import React from 'react';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../../../components/bootstrap/Modal';
import Button from '../../../../../../components/bootstrap/Button';
import FormGroup from '../../../../../../components/bootstrap/forms/FormGroup';
import Select from '../../../../../../components/bootstrap/forms/Select';
import Spinner from '../../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../../components/icon/Icon';
import Badge from '../../../../../../components/bootstrap/Badge';
import classNames from 'classnames';
import { SensorConfig } from '../../../../../../types/sensor';
import styles from '../../../../../../styles/pages/HALO/Settings/ThresholdManagement.module.scss';
import {
    LED_COLOR_OPTIONS,
    LED_PATTERN_OPTIONS,
    LED_PRIORITY_OPTIONS,
    RELAY_DURATION_OPTIONS,
} from '../../../../../../constants/halo.constants';
import {
    BULK_DEVICE_TYPES,
    BULK_SUB_TYPES,
    SENSOR_KEY_TO_EVENT_SOURCE_KEY,
    SaveStatus,
} from '../../../../../../constants/threshold.constants';

interface ConfigModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;

    // Mode flags
    isBulkMode: boolean;
    setIsBulkMode: (v: boolean) => void;
    isCreatingNew: boolean;

    // Single-config form
    formData: Partial<SensorConfig>;
    handleFormChange: (updates: Partial<SensorConfig>) => void;
    saveStatus: SaveStatus;
    hasUnsavedChanges: boolean;
    handleSave: () => void;
    handleDelete: () => void;

    // Gauge helpers
    getThresholdPosition: () => number;
    getLivePointerPosition: () => number;
    liveValue: number | null;
    liveColor: string;
    liveLabel: string;

    // Dropdowns
    sensorConfigChoices: { value: string; label: string }[];
    wavefiles: { value: string; label: string }[];

    // Display helpers
    displaySensorName: (name: string) => string;

    // Bulk-mode state
    bulkDeviceType: string;
    setBulkDeviceType: (v: string) => void;
    bulkSubType: string;
    setBulkSubType: (v: string) => void;
    selectedSourceSensorId: string;
    setSelectedSourceSensorId: (v: string) => void;
    selectedBulkSensorIds: string[];
    selectedBulkConfigIds: string[];
    setSelectedBulkConfigIds: (ids: string[]) => void;

    bulkSensors: { id: string | number; name: string }[] | undefined;
    sourceConfigs: SensorConfig[] | undefined;
    isFetchingSourceConfigs: boolean;
    configs: SensorConfig[];

    // Target sensor name (for the "Copy to" label)
    targetSensorName?: string;
}

const ConfigModal: React.FC<ConfigModalProps> = ({
    isOpen,
    setIsOpen,
    isBulkMode,
    setIsBulkMode,
    isCreatingNew,
    formData,
    handleFormChange,
    saveStatus,
    hasUnsavedChanges,
    handleSave,
    handleDelete,
    getThresholdPosition,
    getLivePointerPosition,
    liveValue,
    liveColor,
    liveLabel,
    sensorConfigChoices,
    wavefiles,
    displaySensorName,
    bulkDeviceType,
    setBulkDeviceType,
    bulkSubType,
    setBulkSubType,
    selectedSourceSensorId,
    setSelectedSourceSensorId,
    selectedBulkSensorIds,
    selectedBulkConfigIds,
    setSelectedBulkConfigIds,
    bulkSensors,
    sourceConfigs,
    isFetchingSourceConfigs,
    configs,
    targetSensorName,
}) => {
    const modalTitle = isBulkMode
        ? 'Bulk Configuration'
        : isCreatingNew
            ? 'New Configuration'
            : `Edit ${displaySensorName(formData.sensor_name || '')}`;

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered isScrollable size='lg'>
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id='config-modal-title'>
                    <div className='d-flex align-items-center gap-2'>
                        <Icon icon={isBulkMode ? 'MultipleStop' : 'Tune'} />
                        {modalTitle}
                    </div>
                </ModalTitle>
            </ModalHeader>

            <ModalBody style={{ minHeight: '600px' }}>
                {/* Bulk mode toggle */}
                <div className='mb-4 d-flex align-items-center justify-content-between p-3 rounded border'>
                    <div className='d-flex align-items-center gap-3'>
                        <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${isBulkMode ? 'bg-primary text-white' : 'bg-secondary text-white'}`}
                            style={{ width: '40px', height: '40px' }}
                        >
                            <Icon icon='MultipleStop' size='lg' />
                        </div>
                        <div>
                            <div className='fw-bold' style={{ fontSize: '1.1rem' }}>
                                Bulk Configuration Mode
                            </div>
                            <div className='text-muted small'>Apply selected templates to multiple sensors at once</div>
                        </div>
                    </div>
                    <div className='form-check form-switch'>
                        <input
                            className='form-check-input'
                            type='checkbox'
                            id='bulkModeToggle'
                            checked={isBulkMode}
                            onChange={(e) => setIsBulkMode(e.target.checked)}
                            style={{ width: '3rem', height: '1.5rem', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                <div className='row g-4'>
                    {/* ── Bulk Mode: Transfer recipe alert ── */}
                    {isBulkMode && (
                        <div className='col-md-12'>
                            <div className=' border-0 shadow-sm d-flex align-items-center gap-3 mb-2 py-3'>
                                <div
                                    className='rounded-circle text-white d-flex align-items-center justify-content-center'
                                    style={{ width: '40px', height: '40px', minWidth: '40px' }}
                                >
                                    <Icon icon='SyncAlt' />
                                </div>
                                <div>
                                    <h6 className='mb-1'>Configuration Sync Mode</h6>
                                    <div className='small'>
                                        Copying{' '}
                                        <span className='fw-bold text-dark'>
                                            {selectedBulkConfigIds.length} templates
                                        </span>
                                        {selectedBulkConfigIds.length > 0 && (
                                            <span className='ms-1 text-muted'>
                                                (
                                                {
                                                    selectedBulkConfigIds.filter((id) =>
                                                        configs.some(
                                                            (c) =>
                                                                (c.event_id &&
                                                                    c.event_id ===
                                                                    sourceConfigs?.find(
                                                                        (sc) => sc.id!.toString() === id,
                                                                    )?.event_id) ||
                                                                (c.sensor_name &&
                                                                    c.sensor_name ===
                                                                    sourceConfigs?.find(
                                                                        (sc) => sc.id!.toString() === id,
                                                                    )?.sensor_name),
                                                        ),
                                                    ).length
                                                }{' '}
                                                already exist on target)
                                            </span>
                                        )}
                                        <div className='mt-1'>
                                            from{' '}
                                            <span className='fw-bold text-dark'>
                                                {bulkSensors?.find(
                                                    (s) => s.id.toString() === selectedSourceSensorId,
                                                )?.name || 'Source'}
                                            </span>{' '}
                                            to{' '}
                                            <span className='fw-bold text-primary'>{targetSensorName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Bulk Mode: selectors ── */}
                    {isBulkMode && (
                        <>
                            <div className='col-md-6'>
                                <FormGroup label='Device Category' id='bulkDeviceType'>
                                    <Select
                                        list={BULK_DEVICE_TYPES}
                                        value={bulkDeviceType}
                                        onChange={(e: any) => {
                                            setBulkDeviceType(e.target.value);
                                            setBulkSubType(BULK_SUB_TYPES[e.target.value][0].value);
                                        }}
                                        ariaLabel='Select Device Category'
                                    />
                                </FormGroup>
                            </div>
                            <div className='col-md-6'>
                                <FormGroup label='Sensor Model' id='bulkSubType'>
                                    <Select
                                        list={BULK_SUB_TYPES[bulkDeviceType] || []}
                                        value={bulkSubType}
                                        onChange={(e: any) => setBulkSubType(e.target.value)}
                                        ariaLabel='Select Sensor Model'
                                    />
                                </FormGroup>
                            </div>

                            <div className='col-md-12'>
                                <FormGroup label='Source Sensor (Copy From)' id='bulkSourceSensor'>
                                    <Select
                                        list={(bulkSensors || []).map((s) => ({
                                            value: s.id.toString(),
                                            label: s.name,
                                        }))}
                                        value={selectedSourceSensorId}
                                        onChange={(e: any) => {
                                            setSelectedSourceSensorId(e.target.value);
                                            setSelectedBulkConfigIds([]);
                                        }}
                                        ariaLabel='Select Source Sensor'
                                    />
                                </FormGroup>
                            </div>

                            {/* Configuration Templates */}
                            <div className='col-md-12'>
                                <div className='card border shadow-none -subtle mb-4'>
                                    <div className='card-header bg-transparent d-flex justify-content-between align-items-center py-2'>
                                        <div className='fw-bold'>
                                            <Icon icon='LibraryBooks' className='me-2' />
                                            Configuration Templates
                                        </div>
                                        <div className='text-muted small'>
                                            {selectedBulkConfigIds.length} templates selected
                                        </div>
                                    </div>
                                    <div className='p-3'>
                                        {isFetchingSourceConfigs ? (
                                            <div className='text-center py-4'>
                                                <Spinner />
                                                <span className='ms-2'>Fetching templates...</span>
                                            </div>
                                        ) : (sourceConfigs || []).length === 0 ? (
                                            <div className='text-center py-2 text-muted small'>
                                                No configurations found for selected source sensor.
                                            </div>
                                        ) : (
                                            <div className='d-flex flex-wrap gap-2 mb-3'>
                                                {(sourceConfigs || []).map((config) => {
                                                    const isSelected = selectedBulkConfigIds.includes(
                                                        config.id!.toString(),
                                                    );
                                                    const isAlreadyAssigned = configs.some(
                                                        (c) =>
                                                            (c.event_id && c.event_id === config.event_id) ||
                                                            (c.sensor_name &&
                                                                c.sensor_name === config.sensor_name),
                                                    );
                                                    const icon = SENSOR_KEY_TO_EVENT_SOURCE_KEY[
                                                        config.sensor_name || ''
                                                    ]
                                                        ? 'FilterTiltShift'
                                                        : 'NotificationImportant';
                                                    return (
                                                        /* Outer wrapper receives mouse events: shows cursor + tooltip */
                                                        <div
                                                            key={config.id}
                                                            title={isAlreadyAssigned ? 'Already assigned to this sensor' : undefined}
                                                            style={{
                                                                cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
                                                                minWidth: '180px',
                                                            }}
                                                        >
                                                            {/* Inner card: pointer-events blocked when assigned so clicks never fire */}
                                                            <div
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedBulkConfigIds(
                                                                            selectedBulkConfigIds.filter(
                                                                                (id) => id !== config.id!.toString(),
                                                                            ),
                                                                        );
                                                                    } else {
                                                                        setSelectedBulkConfigIds([
                                                                            ...selectedBulkConfigIds,
                                                                            config.id!.toString(),
                                                                        ]);
                                                                    }
                                                                }}
                                                                className={classNames(
                                                                    'px-3 py-2 d-flex align-items-center gap-2 border rounded shadow-sm position-relative',
                                                                    isSelected
                                                                        ? 'bg-primary text-white border-primary fw-bold'
                                                                        : 'bg-white border-light-subtle',
                                                                    isAlreadyAssigned && 'opacity-50',
                                                                )}
                                                                style={{
                                                                    pointerEvents: isAlreadyAssigned ? 'none' : 'auto',
                                                                    transition: 'all 0.2s',
                                                                    userSelect: 'none',
                                                                }}
                                                            >
                                                                <Icon icon={icon} color='primary' />
                                                                <div className='text-start overflow-hidden'>
                                                                    <div
                                                                        className='text-truncate'
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    >
                                                                        {config.event_id || config.source}
                                                                    </div>
                                                                    <div
                                                                        className={classNames(
                                                                            'small opacity-75',
                                                                            isSelected ? 'text-white' : 'text-muted',
                                                                        )}
                                                                    >
                                                                        Val: {config.threshold}
                                                                    </div>
                                                                </div>
                                                                <div className='ms-auto d-flex flex-column align-items-end'>
                                                                    {isSelected && (
                                                                        <Icon
                                                                            icon='CheckCircle'
                                                                            size='sm'
                                                                            className='text-white'
                                                                        />
                                                                    )}
                                                                    {isAlreadyAssigned && (
                                                                        <Badge
                                                                            color='warning'
                                                                            isLight
                                                                            className='mt-1'
                                                                            style={{ fontSize: '0.65rem', padding: '2px 5px' }}
                                                                        >
                                                                            Assigned
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Single Config Form ── */}
                    {!isBulkMode && (
                        <div className={styles.visualControl}>
                            {/* Basic Configuration */}
                            <div className={styles.formSection}>
                                <div className={styles.sectionLabel}>
                                    <Icon icon='Settings' /> Basic Configuration
                                </div>
                                <div className='row g-3'>
                                    {isCreatingNew && (
                                        <div className='col-md-12'>
                                            <label className='form-label'>Sensor Source Type</label>
                                            <Select
                                                list={sensorConfigChoices}
                                                value={formData.sensor_name || ''}
                                                onChange={(e: any) =>
                                                    handleFormChange({ sensor_name: e.target.value })
                                                }
                                                ariaLabel='Select Sensor Source Type'
                                            />
                                        </div>
                                    )}
                                    <div className='col-md-12'>
                                        <label className='form-label'>Event Name (Custom Identifier)</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            value={formData.event_id || ''}
                                            onChange={(e) => handleFormChange({ event_id: e.target.value })}
                                        />
                                        <small className='text-muted'>
                                            Enter a unique name to identify this configuration. Must be unique for this
                                            sensor.
                                        </small>
                                    </div>
                                    {!isCreatingNew && (
                                        <div className='col-md-6'>
                                            <label className='form-label'>Status</label>
                                            <div
                                                className='d-flex align-items-center h-100'
                                                style={{ paddingBottom: '5px' }}
                                            >
                                                <div
                                                    onClick={() =>
                                                        handleFormChange({ enabled: !formData.enabled })
                                                    }
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <Icon
                                                        icon={formData.enabled ? 'ToggleOn' : 'ToggleOff'}
                                                        size='2x'
                                                        color={formData.enabled ? 'success' : 'secondary'}
                                                    />
                                                </div>
                                                <span
                                                    className={classNames(
                                                        'ms-2 fw-bold',
                                                        formData.enabled ? 'text-success' : 'text-danger',
                                                    )}
                                                >
                                                    {formData.enabled ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Threshold & Range */}
                            <div className={styles.formSection}>
                                <div className={styles.sectionLabel}>
                                    <Icon icon='ShowChart' /> Threshold &amp; Range
                                </div>
                                <div className={styles.gaugeDisplay}>
                                    <div className={styles.gaugeTrack}>
                                        <div
                                            className={styles.safeZone}
                                            style={{ width: `${getThresholdPosition()}%` }}
                                        />
                                        <div
                                            className={styles.warningZone}
                                            style={{
                                                left: `${getThresholdPosition()}%`,
                                                width: `${100 - getThresholdPosition()}%`,
                                            }}
                                        />
                                        <div
                                            className={styles.thresholdMarkerNew}
                                            style={{ left: `${getThresholdPosition()}%` }}
                                        >
                                            <div className={styles.markerLine} />
                                            <div className={styles.markerDot} />
                                            <div className={styles.markerLabel}>{formData.threshold}</div>
                                        </div>
                                        {liveValue !== null && (
                                            <div
                                                className={classNames(styles.livePointer, styles[liveColor])}
                                                style={{ left: `${getLivePointerPosition()}%` }}
                                            >
                                                <div className={styles.pointerLine} />
                                                <div className={styles.pointerDot} />
                                                <div className={styles.pointerLabel}>
                                                    {liveValue.toFixed(2)} - {liveLabel}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.rangeLabels}>
                                        <span>{formData.min_value}</span>
                                        <span>{formData.max_value}</span>
                                    </div>
                                </div>

                                <div className='slider-wrapper mt-4'>
                                    <div className={styles.sliderControl}>
                                        <input
                                            type='range'
                                            className={styles.thresholdSlider}
                                            min={formData.min_value}
                                            max={formData.max_value}
                                            step='0.1'
                                            value={formData.threshold}
                                            onChange={(e) =>
                                                handleFormChange({ threshold: parseFloat(e.target.value) })
                                            }
                                        />
                                    </div>
                                    <div className='row mt-3'>
                                        <div className='col-md-4'>
                                            <label className='form-label'>Threshold Val</label>
                                            <input
                                                type='number'
                                                className='form-control'
                                                value={formData.threshold}
                                                onChange={(e) =>
                                                    handleFormChange({ threshold: parseFloat(e.target.value) })
                                                }
                                            />
                                        </div>
                                        <div className='col-md-4'>
                                            <label className='form-label'>Min Range</label>
                                            <input
                                                type='number'
                                                className='form-control'
                                                value={formData.min_value}
                                                onChange={(e) =>
                                                    handleFormChange({ min_value: parseFloat(e.target.value) })
                                                }
                                            />
                                        </div>
                                        <div className='col-md-4'>
                                            <label className='form-label'>Max Range</label>
                                            <input
                                                type='number'
                                                className='form-control'
                                                value={formData.max_value}
                                                onChange={(e) =>
                                                    handleFormChange({ max_value: parseFloat(e.target.value) })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LED & Audio */}
                            <div className={styles.formSection}>
                                <div className={styles.sectionLabel}>
                                    <Icon icon='Lightbulb' /> LED &amp; Audio Controls
                                </div>
                                <div className='row g-3'>
                                    <div className='col-md-4'>
                                        <label className='form-label'>LED Color</label>
                                        <Select
                                            list={LED_COLOR_OPTIONS.map((o) => ({
                                                value: o.value.toString(),
                                                label: o.label,
                                            }))}
                                            value={formData.led_color?.toString() || '16777215'}
                                            onChange={(e: any) =>
                                                handleFormChange({ led_color: parseInt(e.target.value) })
                                            }
                                            ariaLabel='Select LED Color'
                                        />
                                    </div>
                                    <div className='col-md-4'>
                                        <label className='form-label'>LED Pattern</label>
                                        <Select
                                            list={LED_PATTERN_OPTIONS.map((o) => ({
                                                value: o.value.toString(),
                                                label: o.label,
                                            }))}
                                            value={formData.led_pattern?.toString() || '200004'}
                                            onChange={(e: any) =>
                                                handleFormChange({ led_pattern: parseInt(e.target.value) })
                                            }
                                            ariaLabel='Select LED Pattern'
                                        />
                                    </div>
                                    <div className='col-md-4'>
                                        <label className='form-label'>Priority</label>
                                        <Select
                                            list={LED_PRIORITY_OPTIONS.map((o) => ({
                                                value: o.value.toString(),
                                                label: o.label,
                                            }))}
                                            value={formData.led_priority?.toString() || '1'}
                                            onChange={(e: any) =>
                                                handleFormChange({ led_priority: parseInt(e.target.value) })
                                            }
                                            ariaLabel='Select LED Priority'
                                        />
                                    </div>
                                    <div className='col-md-6'>
                                        <label className='form-label'>Sound</label>
                                        <Select
                                            list={wavefiles}
                                            value={formData.sound || ''}
                                            onChange={(e: any) => handleFormChange({ sound: e.target.value })}
                                            ariaLabel='Select Sound Alert'
                                        />
                                    </div>
                                    <div className='col-md-6'>
                                        <label className='form-label'>Relay Duration</label>
                                        <Select
                                            list={RELAY_DURATION_OPTIONS.map((o) => ({
                                                value: o.value.toString(),
                                                label: o.label,
                                            }))}
                                            value={formData.relay1?.toString() || '0'}
                                            onChange={(e: any) =>
                                                handleFormChange({ relay1: parseInt(e.target.value) })
                                            }
                                            ariaLabel='Select Relay Duration'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Settings */}
                            <div className={styles.formSection}>
                                <div className={styles.sectionLabel}>
                                    <Icon icon='Info' /> Additional Settings
                                </div>
                                <div className='row g-3'>
                                    <div className='col-md-12'>
                                        <label className='form-label'>Pause Time (pause_minutes)</label>
                                        <div className='input-group' style={{ maxWidth: '300px' }}>
                                            <input
                                                type='number'
                                                className='form-control'
                                                value={formData.pause_minutes}
                                                onChange={(e) =>
                                                    handleFormChange({
                                                        pause_minutes: parseInt(e.target.value),
                                                    })
                                                }
                                            />
                                            <span className='input-group-text'>min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ModalBody>

            <ModalFooter>
                <div className='d-flex justify-content-between w-100'>
                    <div>
                        {!isCreatingNew && !isBulkMode && (
                            <Button color='danger' isLight icon='Delete' onClick={handleDelete}>
                                Delete
                            </Button>
                        )}
                    </div>
                    <div className='d-flex gap-2'>
                        <Button color='secondary' isLight onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color='primary'
                            icon='Save'
                            onClick={handleSave}
                            isDisable={
                                (isBulkMode
                                    ? selectedBulkSensorIds.length === 0
                                    : !hasUnsavedChanges) || saveStatus === 'saving'
                            }
                        >
                            {saveStatus === 'saving' ? <Spinner isSmall inButton /> : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default ConfigModal;
