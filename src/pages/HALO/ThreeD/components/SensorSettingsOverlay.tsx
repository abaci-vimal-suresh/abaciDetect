import React, { useState, useEffect } from 'react';
import { Sensor, SensorUpdatePayload, Wall } from '../../../../types/sensor';
import { useUpdateSensor, useUpdateWall, useCreateWall, useDeleteWall } from '../../../../api/sensors.api';
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
}

const SensorSettingsOverlay: React.FC<SensorSettingsOverlayProps> = ({ sensor, onClose, onPreviewChange }) => {
    const { darkModeStatus } = useDarkMode();
    const updateSensorMutation = useUpdateSensor();
    const updateWallMutation = useUpdateWall();
    const createWallMutation = useCreateWall();
    const deleteWallMutation = useDeleteWall();

    // Local state for all editable fields
    const [values, setValues] = useState<Partial<SensorUpdatePayload>>({
        id: sensor.id,
        x_val: sensor.x_val || 0,
        y_val: sensor.y_val || 0,
        z_val: sensor.z_val || 0,
    });

    const [walls, setWalls] = useState<Wall[]>(sensor.walls || []);
    const [originalWalls, setOriginalWalls] = useState<Wall[]>(JSON.parse(JSON.stringify(sensor.walls || [])));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);

    // Sync state if sensor changes (important for real-time 3D sync)
    useEffect(() => {
        if (sensor.id !== (values as any).id) {
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
        } else {
            setValues(prev => ({
                ...prev,
                x_val: sensor.x_val !== undefined ? sensor.x_val : prev.x_val,
                y_val: sensor.y_val !== undefined ? sensor.y_val : prev.y_val,
                z_val: sensor.z_val !== undefined ? sensor.z_val : prev.z_val,
            }));
            setIsDirty(true);
        }
    }, [sensor]);

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
        setIsDirty(false);
        setErrors({});

        if (onPreviewChange) {
            onPreviewChange({ ...initialValues, walls: initialWalls });
        }
    };

    const handleSave = async () => {
        if (Object.keys(errors).length > 0) return;

        // 1. Update Sensor Position
        if (isDirty) {
            await updateSensorMutation.mutateAsync({
                sensorId: sensor.id,
                data: values
            });
        }

        // 2. Separate New Walls from Modified Walls and Deleted Walls
        const newWallsList = walls.filter(w => String(w.id).startsWith('new-'));
        const existingWallsList = walls.filter(w => !String(w.id).startsWith('new-'));

        // Find deleted walls (walls that were in original but not in current)
        const deletedWallIds = originalWalls
            .filter(ow => !walls.find(w => w.id === ow.id))
            .map(ow => ow.id);

        // 3. Handle Created Walls
        const createPromises = newWallsList.map(wall => {
            const { id, ...payload } = wall;
            return createWallMutation.mutateAsync({
                ...payload,
                area_ids: (wall.area_ids && wall.area_ids.length > 0)
                    ? wall.area_ids
                    : [Number(sensor.area_id || (sensor.area as any)?.id)]
            });
        });

        // 4. Handle Modified Walls
        const modifiedWalls = existingWallsList.filter((wall) => {
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

        // 5. Handle Deleted Walls
        const deletePromises = deletedWallIds.map(id => deleteWallMutation.mutateAsync(id));

        await Promise.all([...createPromises, ...patchPromises, ...deletePromises]);

        if (onPreviewChange) {
            onPreviewChange({});
        }
        onClose();
    };

    const handleAddWall = () => {
        const currentAreaId = Number(sensor.area_id || (sensor.area as any)?.id || sensor.area);
        const newWall: Wall = {
            id: `new-${Date.now()}`,
            r_x1: 0, r_y1: 0, r_x2: 1, r_y2: 0,
            r_height: 2.4,
            color: '#ffffff',
            area_ids: currentAreaId ? [currentAreaId] : []
        };
        const updatedWalls = [...walls, newWall];
        setWalls(updatedWalls);
        setIsDirty(true);
        if (onPreviewChange) {
            onPreviewChange({ ...values, walls: updatedWalls });
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
                            <Button
                                color="info" size="sm" isLight
                                onClick={handleAddWall}
                                icon="Add"
                                className="ms-auto"
                            >
                                Add Wall
                            </Button>
                        </div>

                        {walls.length === 0 && (
                            <div className="text-muted small py-2 text-center">No walls attached to this sensor</div>
                        )}

                        {walls.map((wall, idx) => (
                            <div key={wall.id} className="mb-4 pb-3 border-bottom-dashed">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Badge color={String(wall.id).startsWith('new-') ? 'success' : 'light'} isLight className="text-dark">
                                        {String(wall.id).startsWith('new-') ? 'New Wall' : `Wall Segment ${idx + 1}`}
                                    </Badge>
                                    <div className="d-flex align-items-center">
                                        <div className="small font-monospace opacity-50 me-2">ID: {wall.id}</div>
                                        <Button
                                            color="danger" size="sm" isLight
                                            onClick={() => handleDeleteWall(wall.id)}
                                            icon="Delete"
                                            className="p-1"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="small text-muted mb-1 x-small font-weight-bold d-flex justify-content-between">
                                        Linked Areas
                                    </div>
                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                        {wall.area_ids?.map(aId => (
                                            <Badge key={aId} color="info" isLight className="x-small d-flex align-items-center">
                                                Area {aId}
                                                <Icon
                                                    icon="Close" size="sm" className="ms-1 cursor-pointer"
                                                    onClick={() => handleRemoveAreaId(wall.id, aId)}
                                                />
                                            </Badge>
                                        ))}
                                        {(!wall.area_ids || wall.area_ids.length === 0) && (
                                            <span className="text-danger x-small">No areas linked</span>
                                        )}
                                    </div>
                                    <InputGroup size="sm">
                                        <Input
                                            type="number" placeholder="Add Area ID..."
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter') {
                                                    handleAreaIdChange(wall.id, e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <Button
                                            color="info" isLight size="sm"
                                            onClick={(e: any) => {
                                                const input = e.target.closest('.input-group').querySelector('input');
                                                handleAreaIdChange(wall.id, input.value);
                                                input.value = '';
                                            }}
                                        >
                                            Link
                                        </Button>
                                    </InputGroup>
                                </div>

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
                        ))}
                    </div>
                </CardBody>
                <div className="p-3 border-top mt-auto" style={{ background: darkModeStatus ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                    <div className="d-grid gap-2">
                        <Button
                            color="primary"
                            onClick={handleSave}
                            isDisable={!isDirty || Object.keys(errors).length > 0 || updateSensorMutation.isPending || updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending}
                            isOutline={false}
                        >
                            {updateSensorMutation.isPending || updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                        <Button
                            color="light"
                            onClick={handleReset}
                            isDisable={!isDirty || updateSensorMutation.isPending || updateWallMutation.isPending || deleteWallMutation.isPending}
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
