import React, { useState, useEffect, useMemo } from 'react';
import { Sensor, SensorUpdatePayload, Wall } from '../../../../types/sensor';
import { useUpdateSensor, useUpdateWall, useWalls } from '../../../../api/sensors.api';
import Card, { CardBody, CardHeader } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import InputGroup from '../../../../components/bootstrap/forms/InputGroup';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';
import DeleteWallModal from './DeleteWallModal';
import {
    calculateWallDiff,
    formatDiffSummary,
    formatDiffSummaryVerbose
} from '../utils/wallDiff';

interface SensorSettingsOverlayProps {
    sensor: Sensor;
    originalSensor?: Sensor;
    onClose: () => void;
    onPreviewChange?: (values: (Partial<SensorUpdatePayload> & { walls?: Wall[] }) | null) => void;
    onBlinkingWallsChange?: (wallIds: (number | string)[]) => void;
}

const SensorSettingsOverlay: React.FC<SensorSettingsOverlayProps> = ({
    sensor,
    originalSensor,
    onClose,
    onPreviewChange,
    onBlinkingWallsChange
}) => {
    const { darkModeStatus } = useDarkMode();
    const updateSensorMutation = useUpdateSensor();
    const updateWallMutation = useUpdateWall();

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    // Sensor position
    const [values, setValues] = useState<Partial<SensorUpdatePayload>>({
        id: sensor.id,
        x_val: sensor.x_val || 0,
        y_val: sensor.y_val || 0,
        z_val: sensor.z_val || 0,
    });

    // Walls
    const [walls, setWalls] = useState<Wall[]>(sensor.walls || []);
    const [originalWalls, setOriginalWalls] = useState<Wall[]>(JSON.parse(JSON.stringify(sensor.walls || [])));

    // ✨ NEW: Selected wall for mini drawer
    const [selectedWallId, setSelectedWallId] = useState<number | string | null>(null);

    // UI state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [hoveredWallId, setHoveredWallId] = useState<number | string | null>(null);

    // Delete confirmation modal
    const [unlinkModalWall, setUnlinkModalWall] = useState<{ wall: Wall; segmentNumber: number } | null>(null);

    // ============================================
    // FETCH AREA WALLS
    // ============================================

    const sensorAreaId = sensor.area_id || (sensor.area as any)?.id || sensor.area;
    const { data: areaWalls } = useWalls(sensorAreaId);

    const availableAreaWalls = (areaWalls || []).filter(aw =>
        !walls.find(sw => sw.id === aw.id)
    );

    // ============================================
    // BLINKING WALLS SYNC
    // ============================================

    useEffect(() => {
        if (onBlinkingWallsChange) {
            const linkedIds = walls.map(w => w.id);
            const allBlinking = hoveredWallId ? [...linkedIds, hoveredWallId] : linkedIds;
            onBlinkingWallsChange(allBlinking);
        }
    }, [walls, hoveredWallId, onBlinkingWallsChange]);

    useEffect(() => {
        return () => {
            if (onBlinkingWallsChange) onBlinkingWallsChange([]);
        };
    }, [onBlinkingWallsChange]);

    // ============================================
    // SYNC STATE
    // ============================================

    useEffect(() => {
        const isSameSensor = sensor.id === (values as any).id;

        if (!isSameSensor) {
            setValues({
                id: sensor.id,
                x_val: sensor.x_val || 0,
                y_val: sensor.y_val || 0,
                z_val: sensor.z_val || 0,
            });
            const newWalls = sensor.walls || [];
            setWalls(newWalls);
            setOriginalWalls(JSON.parse(JSON.stringify(newWalls)));
            setIsDirty(false);
            setErrors({});
            setSelectedWallId(null);
        } else {
            if (
                (sensor.x_val !== undefined && sensor.x_val !== values.x_val) ||
                (sensor.y_val !== undefined && sensor.y_val !== values.y_val) ||
                (sensor.z_val !== undefined && sensor.z_val !== values.z_val)
            ) {
                setValues(prev => ({
                    ...prev,
                    x_val: sensor.x_val !== undefined ? sensor.x_val : prev.x_val,
                    y_val: sensor.y_val !== undefined ? sensor.y_val : prev.y_val,
                    z_val: sensor.z_val !== undefined ? sensor.z_val : prev.z_val,
                }));
            }

            if (!isDirty) {
                const newWalls = sensor.walls || [];
                setWalls(newWalls);
                setOriginalWalls(JSON.parse(JSON.stringify(newWalls)));
            } else {
                setOriginalWalls(JSON.parse(JSON.stringify(sensor.walls || [])));
            }

            const base = originalSensor || sensor;
            const posChanged =
                (values.x_val !== undefined && values.x_val !== base.x_val) ||
                (values.y_val !== undefined && values.y_val !== base.y_val) ||
                (values.z_val !== undefined && values.z_val !== base.z_val);

            if (posChanged) {
                setIsDirty(true);
            }
        }
    }, [sensor, sensor.id, originalSensor]);

    // ============================================
    // INPUT CHANGE HANDLER
    // ============================================

    const handleInputChange = (field: keyof SensorUpdatePayload, value: number) => {
        const newValues = { ...values, [field]: value };
        setValues(newValues);
        setIsDirty(true);
        validate(field, value);

        if (onPreviewChange) {
            onPreviewChange(newValues);
        }
    };

    // ============================================
    // VALIDATION
    // ============================================

    const validate = (field: keyof SensorUpdatePayload, value: number) => {
        setErrors({});
    };

    // ============================================
    // RESET HANDLER
    // ============================================

    const handleReset = () => {
        const initialValues = {
            x_val: sensor.x_val || 0,
            y_val: sensor.y_val || 0,
            z_val: sensor.z_val || 0,
        };
        const initialWalls = JSON.parse(JSON.stringify(originalWalls));
        setWalls(initialWalls);
        setIsDirty(false);
        setErrors({});
        setSelectedWallId(null);

        if (onPreviewChange) {
            onPreviewChange({ ...initialValues, walls: initialWalls });
        }
    };

    // ============================================
    // SAVE HANDLER
    // ============================================

    const handleSave = async () => {
        if (Object.keys(errors).length > 0) return;

        try {
            const modifiedWalls = walls.filter((wall) => {
                const original = originalWalls.find(ow => ow.id === wall.id);
                if (!original) return false;
                return JSON.stringify(wall) !== JSON.stringify(original);
            });

            const patchPromises = modifiedWalls.map(wall =>
                updateWallMutation.mutateAsync({
                    wallId: wall.id,
                    data: wall
                })
            );
            await Promise.all(patchPromises);

            const finalWallIds = walls.map(w => Number(w.id));

            if (isDirty) {
                await updateSensorMutation.mutateAsync({
                    sensorId: sensor.id,
                    data: {
                        ...values,
                        wall_ids: finalWallIds
                    }
                });
            }

            if (onPreviewChange) {
                onPreviewChange(null);
            }
            onClose();
        } catch (error) {
            console.error('Error saving sensor settings:', error);
        }
    };

    // ============================================
    // ✨ NEW: LINK WALL HANDLER
    // ============================================

    const handleLinkWall = (areaWall: Wall) => {
        const updatedWalls = [...walls, areaWall];
        setWalls(updatedWalls);
        setIsDirty(true);

        // Auto-select the newly linked wall
        setSelectedWallId(areaWall.id);

        if (onPreviewChange) {
            onPreviewChange({ ...values, walls: updatedWalls });
        }
    };

    // ============================================
    // ✨ NEW: UNLINK WALL HANDLERS
    // ============================================

    const handleUnlinkWallClick = (wall: Wall, segmentNumber: number) => {
        setUnlinkModalWall({ wall, segmentNumber });
    };

    const handleUnlinkWallConfirm = () => {
        if (!unlinkModalWall) return;

        const updatedWalls = walls.filter(w => w.id !== unlinkModalWall.wall.id);
        setWalls(updatedWalls);
        setIsDirty(true);

        // Close drawer if unlinked wall was selected
        if (selectedWallId === unlinkModalWall.wall.id) {
            setSelectedWallId(null);
        }

        if (onPreviewChange) {
            onPreviewChange({ ...values, walls: updatedWalls });
        }

        setUnlinkModalWall(null);
    };

    // ============================================
    // ✨ NEW: CALCULATE WALL LENGTH
    // ============================================

    const calculateWallLength = (wall: Wall): string => {
        const dx = wall.r_x2 - wall.r_x1;
        const dy = wall.r_y2 - wall.r_y1;
        const normalizedLength = Math.sqrt(dx * dx + dy * dy);

        const estimatedLength = normalizedLength * 30;

        if (estimatedLength < 1) {
            return `${(estimatedLength * 100).toFixed(0)}cm`;
        } else {
            return `${estimatedLength.toFixed(1)}m`;
        }
    };

    // ============================================
    // DIFF SUMMARY
    // ============================================

    const wallDiff = useMemo(() => {
        return calculateWallDiff(originalWalls, walls);
    }, [originalWalls, walls]);

    const diffSummary = useMemo(() => {
        return formatDiffSummary(wallDiff);
    }, [wallDiff]);

    const diffSummaryVerbose = useMemo(() => {
        return formatDiffSummaryVerbose(wallDiff);
    }, [wallDiff]);

    // ✨ NEW: Get selected wall object
    const selectedWall = useMemo(() => {
        return walls.find(w => w.id === selectedWallId) || null;
    }, [walls, selectedWallId]);

    // ============================================
    // RENDER INPUT FIELD
    // ============================================

    const renderInput = (label: string, field: keyof SensorUpdatePayload, errorKey?: string) => {
        const base = originalSensor || sensor;
        const isModified = (values[field] ?? (base[field] || 0)) !== (base[field] || 0);

        return (
            <FormGroup label={label} className="mb-3" id={`field-${field}`}>
                <InputGroup>
                    <Input
                        type="number"
                        step={0.1}
                        value={(values[field] as number | string) ?? ''}
                        onChange={(e: any) => handleInputChange(field, parseFloat(e.target.value) || 0)}
                        isValid={!errors[errorKey || (field as string)]}
                        isTouched={isDirty}
                        invalidFeedback={errors[errorKey || (field as string)]}
                        className={isModified ? 'border-info' : ''}
                    />
                    <Button
                        color="light"
                        size="sm"
                        onClick={() => handleInputChange(field, ((values[field] as number) || 0) + 0.1)}
                    >
                        <Icon icon="Add" />
                    </Button>
                </InputGroup>
            </FormGroup>
        );
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            <div
                className='position-absolute end-0 p-0 shadow overflow-hidden d-flex flex-column'
                style={{
                    top: '114px',
                    background: darkModeStatus ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(16px)',
                    width: '380px',
                    maxHeight: 'calc(100% - 110px)',
                    border: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    zIndex: 101
                }}
            >
                <Card className="mb-0 border-0 bg-transparent flex-grow-1 overflow-auto scrollbar-hidden">

                    {/* ============================================ */}
                    {/* HEADER                                       */}
                    {/* ============================================ */}

                    <CardHeader className="bg-transparent border-bottom p-3">
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <div className="text-truncate" style={{ maxWidth: '240px' }}>
                                <h6 className={`mb-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`}>{sensor.name}</h6>
                                <div className="small text-muted font-monospace">{sensor.mac_address}</div>
                            </div>
                            <Button color="link" size="sm" onClick={onClose} icon="Close" />
                        </div>
                    </CardHeader>

                    {/* ============================================ */}
                    {/* BODY                                         */}
                    {/* ============================================ */}

                    <CardBody className="p-3">

                        {/* ============================================ */}
                        {/* SENSOR POSITION SECTION                      */}
                        {/* ============================================ */}

                        <div className="mb-4">
                            <div className="d-flex align-items-center mb-3">
                                <Icon icon="LocationOn" className="text-info me-2" />
                                <h6 className="mb-0 text-uppercase small fw-bold text-info">Sensor Position</h6>
                            </div>
                            {renderInput('X Position', 'x_val')}
                            {renderInput('Y Position', 'y_val')}
                            {renderInput('Z Position', 'z_val')}
                        </div>

                        {/* ============================================ */}
                        {/* ✨ NEW: WALL GRID SECTION                    */}
                        {/* ============================================ */}

                        <div className="mb-4 pt-3 border-top">
                            <div className="d-flex align-items-center mb-3">
                                <Icon icon="ViewQuilt" className="text-info me-2" />
                                <h6 className="mb-0 text-uppercase small fw-bold text-info">
                                    Monitoring Area Walls ({walls.length})
                                </h6>
                            </div>

                            {/* Info Tip */}
                            <div className="mb-3 p-2 rounded" style={{
                                background: darkModeStatus ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.05)',
                                border: '1px solid rgba(74, 144, 226, 0.2)'
                            }}>
                                <div className="small text-muted">
                                    <Icon icon="Lightbulb" className="me-2" size="sm" />
                                    These walls define the sensor's monitoring boundary.
                                </div>
                            </div>

                            {/* Wall Grid (4 per row) */}
                            {walls.length === 0 ? (
                                <div className="text-muted small py-3 text-center">
                                    <Icon icon="Info" className="mb-2 d-block mx-auto" />
                                    No walls linked to this sensor
                                </div>
                            ) : (
                                <div className="row g-2 mb-3">
                                    {walls.map((wall, idx) => {
                                        const isSelected = selectedWallId === wall.id;
                                        const length = calculateWallLength(wall);

                                        return (
                                            <div key={wall.id} className="col-3">
                                                <div
                                                    className={`
                                                        p-2 rounded cursor-pointer text-center
                                                        transition-all
                                                        ${isSelected
                                                            ? 'bg-info bg-opacity-25 border border-info border-2 shadow'
                                                            : darkModeStatus
                                                                ? 'bg-dark bg-opacity-50 border border-secondary hover-bg-dark'
                                                                : 'bg-light border border-secondary hover-bg-light'
                                                        }
                                                    `}
                                                    onClick={() => setSelectedWallId(isSelected ? null : wall.id)}
                                                    style={{
                                                        minHeight: '70px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {/* Wall Number */}
                                                    <div
                                                        className={`fw-bold mb-1 ${isSelected ? 'text-info' : darkModeStatus ? 'text-white' : 'text-dark'}`}
                                                        style={{ fontSize: '1.3rem' }}
                                                    >
                                                        {idx + 1}
                                                    </div>

                                                    {/* Wall Length */}
                                                    <div
                                                        className="small text-muted"
                                                        style={{ fontSize: '0.7rem' }}
                                                    >
                                                        {length}
                                                    </div>

                                                    {/* Color Indicator */}
                                                    <div
                                                        className="mt-1"
                                                        style={{
                                                            width: '20px',
                                                            height: '3px',
                                                            backgroundColor: wall.color || '#ffffff',
                                                            borderRadius: '2px'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ✨ NEW: MINI INFO DRAWER (Expands below grid) */}
                            {selectedWall && (
                                <div
                                    className="mb-3 p-3 rounded border"
                                    style={{
                                        background: darkModeStatus ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                                        borderColor: darkModeStatus ? 'rgba(74, 144, 226, 0.3)' : 'rgba(74, 144, 226, 0.2)',
                                        animation: 'slideDown 0.3s ease'
                                    }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0 text-info">
                                            <Icon icon="Info" className="me-2" />
                                            Wall {walls.findIndex(w => w.id === selectedWall.id) + 1} Details
                                        </h6>
                                        <Button
                                            color="link"
                                            size="sm"
                                            onClick={() => setSelectedWallId(null)}
                                            icon="Close"
                                        />
                                    </div>

                                    {/* Wall Info Grid */}
                                    <div className="row g-2 small mb-3">
                                        <div className="col-6">
                                            <div className="text-muted">Length:</div>
                                            <div className="fw-bold">{calculateWallLength(selectedWall)}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">Height:</div>
                                            <div className="fw-bold">{(selectedWall.r_height || 2.4).toFixed(2)}m</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">Start Point:</div>
                                            <div className="font-monospace" style={{ fontSize: '0.8rem' }}>
                                                ({selectedWall.r_x1.toFixed(2)}, {selectedWall.r_y1.toFixed(2)})
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">End Point:</div>
                                            <div className="font-monospace" style={{ fontSize: '0.8rem' }}>
                                                ({selectedWall.r_x2.toFixed(2)}, {selectedWall.r_y2.toFixed(2)})
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">Color:</div>
                                            <div className="d-flex align-items-center">
                                                <span
                                                    className="d-inline-block me-2"
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        backgroundColor: selectedWall.color || '#ffffff',
                                                        border: '1px solid #ccc',
                                                        borderRadius: '2px'
                                                    }}
                                                />
                                                <span className="font-monospace" style={{ fontSize: '0.75rem' }}>
                                                    {selectedWall.color || '#ffffff'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">Wall ID:</div>
                                            <div className="font-monospace" style={{ fontSize: '0.8rem' }}>
                                                {selectedWall.id}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex gap-2">
                                        <Button
                                            color="info"
                                            size="sm"
                                            isLight
                                            icon="Visibility"
                                            onClick={() => {
                                                // Trigger camera focus (handled by parent)
                                                console.log('View wall in 3D:', selectedWall.id);
                                            }}
                                        >
                                            View in 3D
                                        </Button>
                                        <Button
                                            color="warning"
                                            size="sm"
                                            isLight
                                            icon="LinkOff"
                                            onClick={() => handleUnlinkWallClick(
                                                selectedWall,
                                                walls.findIndex(w => w.id === selectedWall.id) + 1
                                            )}
                                        >
                                            Unlink
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ============================================ */}
                            {/* ✨ NEW: AVAILABLE WALLS (Chip Buttons)       */}
                            {/* ============================================ */}

                            {availableAreaWalls.length > 0 && (
                                <div className="mt-3 pt-3 border-top">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <h6 className="mb-0 text-uppercase small fw-bold text-muted">
                                            <Icon icon="Link" className="me-2" />
                                            Link More Walls
                                        </h6>
                                    </div>

                                    <div className="small text-muted mb-2">
                                        <Icon icon="Info" className="me-1" size="sm" />
                                        Hover to highlight in 3D view
                                    </div>

                                    <div className="d-flex flex-wrap gap-2">
                                        {availableAreaWalls.map(aw => (
                                            <Button
                                                key={`avail-${aw.id}`}
                                                color="info"
                                                size="sm"
                                                isLight
                                                onClick={() => handleLinkWall(aw)}
                                                onMouseEnter={() => setHoveredWallId(aw.id)}
                                                onMouseLeave={() => setHoveredWallId(null)}
                                                className="d-flex align-items-center"
                                            >
                                                Wall {aw.id}
                                                <span className="ms-1 opacity-75">• {calculateWallLength(aw)}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardBody>

                    {/* ============================================ */}
                    {/* FOOTER WITH SAVE BUTTONS                     */}
                    {/* ============================================ */}

                    <div
                        className="p-3 border-top mt-auto"
                        style={{ background: darkModeStatus ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}
                    >
                        {isDirty && (diffSummary !== 'No changes' ||
                            values.x_val !== (originalSensor || sensor).x_val ||
                            values.y_val !== (originalSensor || sensor).y_val ||
                            values.z_val !== (originalSensor || sensor).z_val) && (
                                <div className="mb-2 p-2 rounded" style={{
                                    background: darkModeStatus ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.05)',
                                    border: '1px solid rgba(74, 144, 226, 0.3)'
                                }}>
                                    <div className="small text-muted mb-1">Changes to be saved:</div>
                                    <div className="small fw-bold text-info">
                                        {values.x_val !== (originalSensor || sensor).x_val ||
                                            values.y_val !== (originalSensor || sensor).y_val ||
                                            values.z_val !== (originalSensor || sensor).z_val
                                            ? 'Position updated' : ''}
                                        {values.x_val !== (originalSensor || sensor).x_val && diffSummary !== 'No changes' ? ', ' : ''}
                                        {diffSummary !== 'No changes' ? diffSummaryVerbose : ''}
                                    </div>
                                </div>
                            )}

                        <div className="d-grid gap-2">
                            <Button
                                color="primary"
                                onClick={handleSave}
                                isDisable={!isDirty || Object.keys(errors).length > 0 || updateSensorMutation.isPending || updateWallMutation.isPending}
                                data-save-button="true"
                            >
                                {updateSensorMutation.isPending || updateWallMutation.isPending ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Save Changes
                                        {isDirty && (diffSummary !== 'No changes' ||
                                            values.x_val !== (originalSensor || sensor).x_val ||
                                            values.y_val !== (originalSensor || sensor).y_val ||
                                            values.z_val !== (originalSensor || sensor).z_val) && (
                                                <span className="ms-2 opacity-75">
                                                    ({diffSummary !== 'No changes' ? diffSummary : 'Position'})
                                                </span>
                                            )}
                                    </>
                                )}
                            </Button>
                            <Button
                                color="light"
                                onClick={handleReset}
                                isDisable={!isDirty || updateSensorMutation.isPending || updateWallMutation.isPending}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* ============================================ */}
            {/* UNLINK CONFIRMATION MODAL                    */}
            {/* ============================================ */}

            <DeleteWallModal
                isOpen={unlinkModalWall !== null}
                wall={unlinkModalWall?.wall || null}
                segmentNumber={unlinkModalWall?.segmentNumber}
                onConfirm={handleUnlinkWallConfirm}
                onCancel={() => setUnlinkModalWall(null)}
                showDetails={true}
                warningMessage="This will unlink the wall from this sensor. The wall will remain in the area."
            />

            {/* ✨ NEW: Slide down animation */}
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default SensorSettingsOverlay;