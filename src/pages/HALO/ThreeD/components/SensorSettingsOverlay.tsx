import React, { useState, useEffect } from 'react';
import { Sensor, SensorUpdatePayload } from '../../../../types/sensor';
import { useUpdateSensor } from '../../../../api/sensors.api';
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
    onPreviewChange?: (values: Partial<SensorUpdatePayload>) => void;
}

const SensorSettingsOverlay: React.FC<SensorSettingsOverlayProps> = ({ sensor, onClose, onPreviewChange }) => {
    const { darkModeStatus } = useDarkMode();
    const updateSensorMutation = useUpdateSensor();

    // Local state for all editable fields
    const [values, setValues] = useState<Partial<SensorUpdatePayload>>({
        id: sensor.id, // Store ID to prevent unnecessary resets
        x_val: sensor.x_val || 0,
        y_val: sensor.y_val || 0,
        z_val: sensor.z_val || 0,
        x_min: sensor.x_min || 0,
        x_max: sensor.x_max || 0,
        y_min: sensor.y_min || 0,
        y_max: sensor.y_max || 0,
        z_min: sensor.z_min || 0,
        z_max: sensor.z_max || 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);

    // Sync state if sensor changes (important for real-time 3D sync)
    useEffect(() => {
        // If it's a new sensor selection, reset everything
        if (sensor.id !== (values as any).id) {
            setValues({
                id: sensor.id, // Track ID in local state for comparison
                x_val: sensor.x_val || 0,
                y_val: sensor.y_val || 0,
                z_val: sensor.z_val || 0,
                x_min: sensor.x_min || 0,
                x_max: sensor.x_max || 0,
                y_min: sensor.y_min || 0,
                y_max: sensor.y_max || 0,
                z_min: sensor.z_min || 0,
                z_max: sensor.z_max || 0,
            });
            setIsDirty(false);
            setErrors({});
        } else {
            // If it's the same sensor but values changed externally (like 3D drag)
            // merge only the coordinate values to not lose other edits
            setValues(prev => ({
                ...prev,
                x_val: sensor.x_val !== undefined ? sensor.x_val : prev.x_val,
                y_val: sensor.y_val !== undefined ? sensor.y_val : prev.y_val,
                z_val: sensor.z_val !== undefined ? sensor.z_val : prev.z_val,
            }));
            // Mark as dirty if external coordinates changed
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

    const handleStep = (field: keyof SensorUpdatePayload, step: number) => {
        const currentValue = Number(values[field]) || 0;
        const newValue = parseFloat((currentValue + step).toFixed(2));
        handleInputChange(field, newValue);
    };

    const validate = (field: keyof SensorUpdatePayload, value: number) => {
        const newErrors = { ...errors };

        if (field === 'x_min' || field === 'x_max') {
            const min = field === 'x_min' ? value : (values.x_min || 0);
            const max = field === 'x_max' ? value : (values.x_max || 0);
            if (min >= max) newErrors.x = 'Max must be greater than Min';
            else delete newErrors.x;
        }

        if (field === 'y_min' || field === 'y_max') {
            const min = field === 'y_min' ? value : (values.y_min || 0);
            const max = field === 'y_max' ? value : (values.y_max || 0);
            if (min >= max) newErrors.y = 'Max must be greater than Min';
            else delete newErrors.y;
        }

        if (field === 'z_min' || field === 'z_max') {
            const min = field === 'z_min' ? value : (values.z_min || 0);
            const max = field === 'z_max' ? value : (values.z_max || 0);
            if (min >= max) newErrors.z = 'Max must be greater than Min';
            else delete newErrors.z;
        }

        setErrors(newErrors);
    };

    const handleReset = () => {
        const initialValues = {
            x_val: sensor.x_val || 0,
            y_val: sensor.y_val || 0,
            z_val: sensor.z_val || 0,
            x_min: sensor.x_min || 0,
            x_max: sensor.x_max || 0,
            y_min: sensor.y_min || 0,
            y_max: sensor.y_max || 0,
            z_min: sensor.z_min || 0,
            z_max: sensor.z_max || 0,
        };
        setValues(initialValues);
        setIsDirty(false);
        setErrors({});

        if (onPreviewChange) {
            onPreviewChange(initialValues);
        }
    };

    const handleSave = () => {
        if (Object.keys(errors).length > 0) return;

        updateSensorMutation.mutate({
            sensorId: sensor.id,
            data: values
        }, {
            onSuccess: () => {
                if (onPreviewChange) {
                    onPreviewChange({}); // Clear preview on success
                }
                onClose();
            }
        });
    };

    const renderInput = (label: string, field: keyof SensorUpdatePayload, errorKey?: string) => (
        <FormGroup label={label} className="mb-3" id={`field-${field}`}>
            <InputGroup>
                <Button color="light" size="sm" onClick={() => handleStep(field, -0.1)}>
                    <Icon icon="Remove" />
                </Button>
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
                <Button color="light" size="sm" onClick={() => handleStep(field, 0.1)}>
                    <Icon icon="Add" />
                </Button>
            </InputGroup>
        </FormGroup>
    );

    return (
        <div
            className='position-absolute end-0 m-3 p-0 rounded shadow overflow-hidden d-flex flex-column'
            style={{
                top: '80px',
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
                            <Icon icon="BorderAll" className="text-info me-2" />
                            <h6 className="mb-0 text-uppercase small fw-bold text-info">Sensor Boundary</h6>
                        </div>
                        <div className="row g-2">
                            <div className="col-6">{renderInput('Min X', 'x_min', 'x')}</div>
                            <div className="col-6">{renderInput('Max X', 'x_max', 'x')}</div>
                        </div>
                        <div className="row g-2">
                            <div className="col-6">{renderInput('Min Y', 'y_min', 'y')}</div>
                            <div className="col-6">{renderInput('Max Y', 'y_max', 'y')}</div>
                        </div>
                        <div className="row g-2">
                            <div className="col-6">{renderInput('Min Z', 'z_min', 'z')}</div>
                            <div className="col-6">{renderInput('Max Z', 'z_max', 'z')}</div>
                        </div>
                    </div>
                </CardBody>
                <div className="p-3 border-top mt-auto" style={{ background: darkModeStatus ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                    <div className="d-grid gap-2">
                        <Button
                            color="primary"
                            onClick={handleSave}
                            isDisable={!isDirty || Object.keys(errors).length > 0 || updateSensorMutation.isPending}
                            isOutline={false}
                        >
                            {updateSensorMutation.isPending ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                        <Button
                            color="light"
                            onClick={handleReset}
                            isDisable={!isDirty || updateSensorMutation.isPending}
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
