import React, { useState, useEffect } from 'react';
import { Sensor, SensorUpdatePayload, Wall } from '../../../../types/sensor';
import { useUpdateSensor, useUpdateWall, useCreateWall, useDeleteWall, useWalls } from '../../../../api/sensors.api';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import InputGroup, { InputGroupText } from '../../../../components/bootstrap/forms/InputGroup';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';

interface SensorSettingsOverlayProps {
    sensor: Sensor;
    onClose: () => void;
    onPreviewChange?: (values: Partial<SensorUpdatePayload> & { walls?: Wall[] }) => void;
    onBlinkingWallsChange?: (wallIds: (number | string)[]) => void;
}

const SensorSettingsOverlay: React.FC<SensorSettingsOverlayProps> = ({
    sensor,
    onClose,
    onPreviewChange,
    onBlinkingWallsChange
}) => {
    const { darkModeStatus } = useDarkMode();
    const updateSensorMutation = useUpdateSensor();
    const updateWallMutation = useUpdateWall();

    // Local state for all editable fields
    const [values, setValues] = useState<Partial<SensorUpdatePayload>>({
        id: sensor.id,
        x_val: sensor.x_val || 0,
        y_val: sensor.y_val || 0,
        z_val: sensor.z_val || 0,
    });

    const [walls, setWalls] = useState<Wall[]>(sensor.walls || []);
    const [originalWalls, setOriginalWalls] = useState<Wall[]>(JSON.parse(JSON.stringify(sensor.walls || [])));
    const [collapsedWallIds, setCollapsedWallIds] = useState<(number | string)[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);

    // Area Walls Fetching
    const sensorAreaId = sensor.area_id || (sensor.area as any)?.id || sensor.area;
    const { data: areaWalls } = useWalls(sensorAreaId);

    const availableAreaWalls = (areaWalls || []).filter(aw =>
        !walls.find(sw => sw.id === aw.id)
    );

    // Track hovered wall for blinking
    const [hoveredWallId, setHoveredWallId] = useState<number | string | null>(null);

    // Sync blinking walls with linked walls + hovered wall
    useEffect(() => {
        if (onBlinkingWallsChange) {
            const linkedIds = walls.map(w => w.id);
            const allBlinking = hoveredWallId ? [...linkedIds, hoveredWallId] : linkedIds;
            onBlinkingWallsChange(allBlinking);
        }
    }, [walls, hoveredWallId, onBlinkingWallsChange]);

    // Clear blinking on unmount
    useEffect(() => {
        return () => {
            if (onBlinkingWallsChange) onBlinkingWallsChange([]);
        };
    }, [onBlinkingWallsChange]);

    // Sync state if sensor changes (important for real-time 3D sync)
    useEffect(() => {
        const isSameSensor = sensor.id === (values as any).id;

        if (!isSameSensor) {
            // Completely different sensor - Reset everything
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
        } else if (!isDirty) {
            // Same sensor but background refresh, and user hasn't made changes
            // Sync current values and walls from prop
            setValues({
                id: sensor.id,
                x_val: sensor.x_val || 0,
                y_val: sensor.y_val || 0,
                z_val: sensor.z_val || 0,
            });
            const newWalls = sensor.walls || [];
            setWalls(newWalls);
            setOriginalWalls(JSON.parse(JSON.stringify(newWalls)));
        } else {
            // Same sensor, user has unsaved changes. 
            // Just update originalWalls so Reset works against latest server data
            setOriginalWalls(JSON.parse(JSON.stringify(sensor.walls || [])));
        }
    }, [sensor, sensor.id]);

    const handleInputChange = (field: keyof SensorUpdatePayload, value: number) => {
        const newValues = { ...values, [field]: value };
        setValues(newValues);
        setIsDirty(true);
        validate(field, value);

        // Notify parent of the updated preview values
        if (onPreviewChange) {
            onPreviewChange(newValues);
        }
    };

    const handleWallChange = (wallId: number | string, field: keyof Wall, value: any) => {
        const newWalls = walls.map(w => w.id === wallId ? { ...w, [field]: value } : w);
        setWalls(newWalls);
        setIsDirty(true);

        if (onPreviewChange) {
            onPreviewChange({ ...values, walls: newWalls });
        }
    };

    const validate = (field: keyof SensorUpdatePayload, value: number) => {
        // Validation for position if needed
        setErrors({});
    };

    const handleReset = () => {
        const initialValues = {
            x_val: sensor.x_val || 0,
            y_val: sensor.y_val || 0,
            z_val: sensor.z_val || 0,
        };
        const initialWalls = JSON.parse(JSON.stringify(originalWalls));
        setValues(initialValues);
        setWalls(initialWalls);
        setCollapsedWallIds([]);
        setIsDirty(false);
        setErrors({});

        if (onPreviewChange) {
            onPreviewChange({ ...initialValues, walls: initialWalls });
        }
    };

    const handleSave = async () => {
        if (Object.keys(errors).length > 0) return;

        try {
            // 1. Handle Modified Walls
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

            // 2. Collect all current wall IDs for unlinking/linking
            const finalWallIds = walls.map(w => Number(w.id));

            // 3. Update Sensor with Position AND Wall IDs
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
                onPreviewChange({});
            }
            onClose();
        } catch (error) {
            console.error('Error saving sensor settings:', error);
        }
    };

    const handleDeleteWall = (wallId: number | string) => {
        const updatedWalls = walls.filter(w => w.id !== wallId);
        setWalls(updatedWalls);
        setIsDirty(true);
        if (onPreviewChange) {
            onPreviewChange({ ...values, walls: updatedWalls });
        }
    };

    const toggleWallCollapse = (wallId: number | string) => {
        setCollapsedWallIds(prev =>
            prev.includes(wallId)
                ? prev.filter(id => id !== wallId)
                : [...prev, wallId]
        );
    };

    const handleLinkAreaWall = (areaWall: Wall) => {
        const updatedWalls = [...walls, areaWall];
        setWalls(updatedWalls);
        setIsDirty(true);
        // Ensure the newly linked wall is expanded
        setCollapsedWallIds(prev => prev.filter(id => id !== areaWall.id));
        if (onPreviewChange) {
            onPreviewChange({ ...values, walls: updatedWalls });
        }
    };

    const handleAreaIdChange = (wallId: number | string, newAreaId: string) => {
        // This is a helper for adding a new ID to the list
        if (!newAreaId) return;
        const areaId = parseInt(newAreaId);
        if (isNaN(areaId)) return;

        const updatedWalls = walls.map(w => {
            if (w.id === wallId) {
                const currentIds = w.area_ids || [];
                if (!currentIds.includes(areaId)) {
                    return { ...w, area_ids: [...currentIds, areaId] };
                }
            }
            return w;
        });
        setWalls(updatedWalls);
        setIsDirty(true);
    };

    const handleRemoveAreaId = (wallId: number | string, areaId: number) => {
        const updatedWalls = walls.map(w => {
            if (w.id === wallId) {
                return { ...w, area_ids: (w.area_ids || []).filter(id => id !== areaId) };
            }
            return w;
        });
        setWalls(updatedWalls);
        setIsDirty(true);
    };

    const renderInput = (label: string, field: keyof SensorUpdatePayload, errorKey?: string) => (
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
                    className={(sensor[field] as any) !== values[field] ? 'border-info' : ''}
                />
                <Button color="light" size="sm" onClick={() => handleInputChange(field, ((values[field] as number) || 0) + 0.1)}>
                    <Icon icon="Add" />
                </Button>
            </InputGroup>
        </FormGroup>
    );

    return (
        <div
            className='position-absolute end-0 p-0 shadow overflow-hidden d-flex flex-column'
            style={{
                top: '114px',
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                width: '350px',
                maxHeight: 'calc(100% - 110px)',
                border: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                zIndex: 101
            }}
        >
            <Card className="mb-0 border-0 bg-transparent flex-grow-1 overflow-auto scrollbar-hidden">
                <CardHeader className="bg-transparent border-bottom p-3">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="text-truncate" style={{ maxWidth: '240px' }}>
                            <h6 className={`mb-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`}>{sensor.name}</h6>
                            <div className="small text-muted font-monospace">{sensor.mac_address}</div>
                        </div>
                        <Button color="link" size="sm" onClick={onClose} icon="Close" />
                    </div>
                </CardHeader>
                <CardBody className="p-3">
                    <div className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                            <Icon icon="LocationOn" className="text-info me-2" />
                            <h6 className="mb-0 text-uppercase small fw-bold text-info">Sensor Position</h6>
                        </div>
                        {renderInput('X Position', 'x_val')}
                        {renderInput('Y Position', 'y_val')}
                        {renderInput('Z Position', 'z_val')}
                    </div>

                    <div className="mb-4 pt-3 border-top">
                        <div className="d-flex align-items-center mb-3">
                            <Icon icon="ViewQuilt" className="text-info me-2" />
                            <h6 className="mb-0 text-uppercase small fw-bold text-info">Wall Configuration</h6>
                        </div>

                        {walls.length === 0 && (
                            <div className="text-muted small py-2 text-center">No walls attached to this sensor</div>
                        )}

                        {walls.map((wall, idx) => {
                            const isCollapsed = collapsedWallIds.includes(wall.id);
                            return (
                                <div key={wall.id} className="mb-4 pb-3 border-bottom-dashed">
                                    <div
                                        className="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
                                        onClick={() => toggleWallCollapse(wall.id)}
                                    >
                                        <div className="d-flex align-items-center">
                                            <Icon
                                                icon={isCollapsed ? "ChevronRight" : "ExpandMore"}
                                                className="me-2 text-muted"
                                            />
                                            <Badge color='light' isLight className="text-dark me-2">
                                                {`Wall Segment ${idx + 1}`}
                                            </Badge>
                                            {wall.area_ids && wall.area_ids.length > 0 && (
                                                <Badge color="info" isLight className="text-dark">Area Wall</Badge>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div className="small font-monospace opacity-50 me-2">ID: {wall.id}</div>
                                            <Button
                                                color="danger" size="sm" isLight
                                                onClick={(e: any) => {
                                                    e.stopPropagation();
                                                    handleDeleteWall(wall.id);
                                                }}
                                                icon="LinkOff"
                                                className="p-1"
                                                title="Unlink from sensor"
                                            />
                                        </div>
                                    </div>

                                    {!isCollapsed && (
                                        <div className="mt-3 animate-fade-in">
                                            <div className="row g-2 mb-2">
                                                <div className="col-6">
                                                    <FormGroup label="Start X (0-1)">
                                                        <Input
                                                            type="number" step={0.01}
                                                            value={wall.r_x1}
                                                            onChange={(e: any) => handleWallChange(wall.id, 'r_x1', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormGroup>
                                                </div>
                                                <div className="col-6">
                                                    <FormGroup label="Start Y (0-1)">
                                                        <Input
                                                            type="number" step={0.01}
                                                            value={wall.r_y1}
                                                            onChange={(e: any) => handleWallChange(wall.id, 'r_y1', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormGroup>
                                                </div>
                                            </div>

                                            <div className="row g-2 mb-2">
                                                <div className="col-6">
                                                    <FormGroup label="End X (0-1)">
                                                        <Input
                                                            type="number" step={0.01}
                                                            value={wall.r_x2}
                                                            onChange={(e: any) => handleWallChange(wall.id, 'r_x2', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormGroup>
                                                </div>
                                                <div className="col-6">
                                                    <FormGroup label="End Y (0-1)">
                                                        <Input
                                                            type="number" step={0.01}
                                                            value={wall.r_y2}
                                                            onChange={(e: any) => handleWallChange(wall.id, 'r_y2', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormGroup>
                                                </div>
                                            </div>

                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <FormGroup label="Height (m)">
                                                        <Input
                                                            type="number" step={0.1}
                                                            value={wall.r_height || 2.4}
                                                            onChange={(e: any) => handleWallChange(wall.id, 'r_height', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormGroup>
                                                </div>
                                                <div className="col-6">
                                                    <FormGroup label="Color">
                                                        <Input
                                                            type="color"
                                                            value={wall.color || '#ffffff'}
                                                            onChange={(e: any) => handleWallChange(wall.id, 'color', e.target.value)}
                                                        />
                                                    </FormGroup>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Available Area Walls Section */}
                        {availableAreaWalls.length > 0 && (
                            <div className="mt-4 pt-3 border-top">
                                <h6 className="mb-3 text-uppercase small fw-bold text-info">Available Area Walls</h6>
                                <div className="d-flex flex-wrap gap-2">
                                    {availableAreaWalls.map(aw => (
                                        <Button
                                            key={`avail-${aw.id}`}
                                            color="info" size="sm" isLight
                                            onClick={() => handleLinkAreaWall(aw)}
                                            onMouseEnter={() => setHoveredWallId(aw.id)}
                                            onMouseLeave={() => setHoveredWallId(null)}
                                            className="d-flex align-items-center"
                                        >
                                            <Icon icon="Link" className="me-1" />
                                            Wall {aw.id}
                                        </Button>
                                    ))}
                                </div>
                                <div className="text-muted small mt-1">Existing walls from this area that can be linked to the sensor.</div>
                            </div>
                        )}
                    </div>
                </CardBody>
                <div className="p-3 border-top mt-auto" style={{ background: darkModeStatus ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                    <div className="d-grid gap-2">
                        <Button
                            color="primary"
                            onClick={handleSave}
                            isDisable={!isDirty || Object.keys(errors).length > 0 || updateSensorMutation.isPending || updateWallMutation.isPending}
                            isOutline={false}
                        >
                            {updateSensorMutation.isPending || updateWallMutation.isPending ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                            ) : (
                                'Save Changes'
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
    );
};

export default SensorSettingsOverlay;
