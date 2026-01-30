import React, { useState } from 'react';
import { AlertFilter, Area, Action, SENSOR_CONFIG_CHOICES } from '../../../../types/sensor';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Checks from '../../../../components/bootstrap/forms/Checks';
import { useAreas, useActions, useSensorGroups } from '../../../../api/sensors.api';

interface AlertFilterFormProps {
    filter?: Partial<AlertFilter>;
    onSave: (data: Partial<AlertFilter>) => void;
    onCancel: () => void;
}

const AlertFilterForm: React.FC<AlertFilterFormProps> = ({ filter, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<AlertFilter>>(filter || {
        name: '',
        description: '',
        area_ids: [],
        sensor_config_ids: [],
        sensor_group_ids: [],
        action_ids: [],
        action_for_min: false,
        action_for_max: false,
        action_for_threshold: false,
        weekdays: [],
        start_time: '',
        end_time: ''
    });

    const { data: areas } = useAreas();
    const { data: actions } = useActions();
    const { data: sensorGroups } = useSensorGroups();

    const handleToggle = (field: keyof AlertFilter, value: number) => {
        const currentList = (formData[field] as any[]) || [];
        // Handle both number arrays and object arrays by comparing IDs
        const index = currentList.findIndex((item: any) =>
            (typeof item === 'object' ? item.id : item) === value
        );

        const newList = [...currentList];
        if (index > -1) {
            newList.splice(index, 1);
        } else {
            newList.push(value);
        }
        setFormData({ ...formData, [field]: newList });
    };

    const handleDayToggle = (day: number) => {
        const currentDays = formData.weekdays || [];
        const index = currentDays.indexOf(day);
        let newDays = [...currentDays];
        if (index > -1) {
            newDays.splice(index, 1);
        } else {
            newDays.push(day);
        }
        setFormData({ ...formData, weekdays: newDays });
    };

    const isSelected = (field: keyof AlertFilter, id: number) => {
        const list = (formData[field] as any[]) || [];
        return list.some((item: any) => (typeof item === 'object' ? item.id : item) === id);
    };

    return (
        <div className="row g-3">
            <div className="col-md-6">
                <FormGroup label="Filter Name">
                    <Input
                        value={formData.name}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Critical CO2 Alerts"
                    />
                </FormGroup>
            </div>
            <div className="col-md-6">
                <FormGroup label="Description">
                    <Input
                        value={formData.description}
                        onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Purpose of this filter"
                    />
                </FormGroup>
            </div>

            <div className="col-12 mt-4">
                <h6 className="fw-bold mb-3">1. Trigger Conditions</h6>
                <div className="card bg-light border-0 shadow-none">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <Checks
                                    type="switch"
                                    label="Action for Max Value"
                                    checked={formData.action_for_max}
                                    onChange={(e: any) => setFormData({ ...formData, action_for_max: e.target.checked })}
                                />
                                <small className="text-muted d-block ms-4">Trigger when value exceeds maximum</small>
                            </div>

                            <div className="col-md-4">
                                <Checks
                                    type="switch"
                                    label="Action for Min Value"
                                    checked={formData.action_for_min}
                                    onChange={(e: any) => setFormData({ ...formData, action_for_min: e.target.checked })}
                                />
                                <small className="text-muted d-block ms-4">Trigger when value drops below minimum</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <h6 className="fw-bold mb-3">2. Active Schedule (Optional)</h6>
                <div className="card bg-light border-0 shadow-none">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label d-block">Active Days</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 border rounded text-center small ${formData.weekdays?.includes(index) ? 'bg-primary text-white border-primary' : 'bg-white'}`}
                                            style={{ cursor: 'pointer', minWidth: '40px', userSelect: 'none' }}
                                            onClick={() => handleDayToggle(index)}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <FormGroup label="Start Time">
                                    <Input
                                        type="time"
                                        value={formData.start_time || ''}
                                        onChange={(e: any) => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </FormGroup>
                            </div>
                            <div className="col-md-3">
                                <FormGroup label="End Time">
                                    <Input
                                        type="time"
                                        value={formData.end_time || ''}
                                        onChange={(e: any) => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </FormGroup>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-6">
                <FormGroup label="Apply to Areas">
                    <div className="border rounded p-2 bg-white" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {areas?.map((a: Area) => (
                            <Checks
                                key={a.id}
                                id={`area-${a.id}`}
                                label={a.name}
                                checked={isSelected('area_ids', a.id)}
                                onChange={() => handleToggle('area_ids', a.id)}
                            />
                        ))}
                    </div>
                </FormGroup>
            </div>

            <div className="col-md-6">
                <FormGroup label="Sensor Configurations">
                    <div className="border rounded p-2 bg-white" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {SENSOR_CONFIG_CHOICES.map((c: any, index: number) => (
                            <Checks
                                key={c.value}
                                id={`config-${c.value}`}
                                label={c.label}
                                checked={isSelected('sensor_config_ids', index + 1)}
                                onChange={() => handleToggle('sensor_config_ids', index + 1)}
                            />
                        ))}
                    </div>
                </FormGroup>
            </div>

            <div className="col-12">
                <FormGroup label="Sensor Groups (Optional)">
                    <div className="border rounded p-2 bg-white" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {sensorGroups?.map((g: any) => (
                            <Checks
                                key={g.id}
                                id={`group-${g.id}`}
                                label={g.name}
                                checked={isSelected('sensor_group_ids', g.id)}
                                onChange={() => handleToggle('sensor_group_ids', g.id)}
                            />
                        ))}
                    </div>
                </FormGroup>
            </div>

            <div className="col-12">
                <FormGroup label="Associated Actions">
                    <div className="border rounded p-3 bg-white">
                        <div className="row g-2">
                            {actions?.map((a: Action) => (
                                <div key={a.id} className="col-md-6">
                                    <div
                                        className={`p-2 border rounded d-flex align-items-center justify-content-between ${isSelected('action_ids', a.id) ? 'border-primary bg-primary-subtle' : ''}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleToggle('action_ids', a.id)}
                                    >
                                        <div>
                                            <div className="fw-bold small">{a.name}</div>
                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{a.type.toUpperCase()} - {a.message_type}</small>
                                        </div>
                                        <Checks
                                            id={`action-${a.id}`}
                                            checked={isSelected('action_ids', a.id)}
                                            onChange={() => { }} // Controlled by parent div click
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FormGroup>
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                <Button color="light" onClick={onCancel}>Cancel</Button>
                <Button color="primary" onClick={() => onSave(formData)} isDisable={!formData.name}>
                    Save Filter
                </Button>
            </div>
        </div>
    );
};

export default AlertFilterForm;
