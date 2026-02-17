import * as React from 'react';
import { AlertFilter, Area, Action, ALERT_TYPE_CHOICES, ALERT_SOURCE_CHOICES } from '../../../../types/sensor';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Tooltips from '../../../../components/bootstrap/Tooltips';
import Icon from '../../../../components/icon/Icon';
import { useAreas, useActions, useSensorGroups } from '../../../../api/sensors.api';
import { MultiSelectDropdown, Option } from '../../../../components/CustomComponent/Select/MultiSelectDropdown';

interface AlertFilterFormProps {
    filter?: Partial<AlertFilter>;
    onSave: (data: Partial<AlertFilter>) => void;
    onCancel: () => void;
}

const AlertFilterForm: React.FC<AlertFilterFormProps> = ({ filter, onSave, onCancel }) => {
    const [formData, setFormData] = React.useState<Partial<AlertFilter>>(() => {
        if (!filter) return {
            name: '',
            description: '',
            area_ids: [],
            sensor_config_ids: [],
            alert_types: [],
            source_types: [],
            sensor_group_ids: [],
            action_ids: [],
            action_for_min: false,
            action_for_max: false,
            action_for_threshold: false,
            weekdays: [],
            start_time: '',
            end_time: '',
            is_active: true
        };

        const initial = { ...filter };

        if (typeof initial.is_active === 'undefined') initial.is_active = true;

        if (filter.area_list && (!filter.area_ids || filter.area_ids.length === 0)) {
            initial.area_ids = filter.area_list.map(a => a.id);
        }
        if (filter.sensor_groups && (!filter.sensor_group_ids || filter.sensor_group_ids.length === 0)) {
            initial.sensor_group_ids = filter.sensor_groups.map(g => g.id);
        }
        if (filter.actions && (!filter.action_ids || filter.action_ids.length === 0)) {
            initial.action_ids = filter.actions.map(a => a.id);
        }
        return initial;
    });

    const { data: areas } = useAreas();
    const { data: actions } = useActions();
    const { data: sensorGroups } = useSensorGroups();

    // ── Helpers ─────────────────────────────────────────────────────────────

    const handleToggle = (field: keyof AlertFilter, value: number) => {
        const currentList = (formData[field] as any[]) || [];
        const index = currentList.findIndex((item: any) =>
            (typeof item === 'object' ? item.id : item) === value
        );
        const newList = [...currentList];
        if (index > -1) newList.splice(index, 1);
        else newList.push(value);
        setFormData({ ...formData, [field]: newList });
    };

    const handleDayToggle = (day: number) => {
        const currentDays = formData.weekdays || [];
        const index = currentDays.indexOf(day);
        let newDays = [...currentDays];
        if (index > -1) newDays.splice(index, 1);
        else newDays.push(day);
        setFormData({ ...formData, weekdays: newDays });
    };

    const isSelected = (field: keyof AlertFilter, id: number) => {
        const list = (formData[field] as any[]) || [];
        return list.some((item: any) => (typeof item === 'object' ? item.id : item) === id);
    };

    // ── Derived option lists for MultiSelectDropdown ─────────────────────────

    // ALERT_TYPE_CHOICES already has { value, label } — map value to string
    const alertTypeOptions: Option[] = ALERT_TYPE_CHOICES.map(c => ({
        value: String(c.value),
        label: c.label,
    }));

    const alertSourceOptions: Option[] = ALERT_SOURCE_CHOICES.map(c => ({
        value: String(c.value),
        label: c.label,
    }));

    const areaOptions: Option[] = (areas ?? []).map((a: Area) => ({
        value: String(a.id),
        label: a.name,
    }));

    const sensorGroupOptions: Option[] = (sensorGroups ?? []).map((g: any) => ({
        value: String(g.id),
        label: g.name,
    }));

    return (
        <div className="row g-3">

            {/* ── Name / Description / Status ────────────────────────────── */}
            <div className="col-md-4">
                <FormGroup label="Filter Name">
                    <Input
                        value={formData.name}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Critical CO2 Alerts"
                    />
                </FormGroup>
            </div>
            <div className="col-md-5">
                <FormGroup label="Description">
                    <Input
                        value={formData.description}
                        onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Purpose of this filter"
                    />
                </FormGroup>
            </div>
            <div className="col-md-3 d-flex align-items-center">
                <FormGroup label="Status">
                    <Checks
                        id="is_active"
                        type="switch"
                        label={formData.is_active ? 'Active' : 'Inactive'}
                        checked={formData.is_active}
                        onChange={(e: any) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                </FormGroup>
            </div>

            {/* ── Logic & Triggers ────────────────────────────────────────── */}
            <div className="col-12">
                <div className="card border shadow-sm mb-0">
                    <div className="card-header bg-light py-2">
                        <span className="fw-bold small text-uppercase">Logic &amp; Triggers</span>
                    </div>
                    <div className="card-body p-3">
                        <div className="row g-3">

                            {/* Alert Types — MultiSelectDropdown */}
                            <div className="col-md-4">
                                <FormGroup label="Alert Types">
                                    <MultiSelectDropdown
                                        options={alertTypeOptions}
                                        value={(formData.alert_types ?? []).map(String)}
                                        onChange={(vals) =>
                                            setFormData({ ...formData, alert_types: vals })
                                        }
                                        placeholder="Select Types"
                                        searchPlaceholder="Filter types…"
                                        selectAll
                                        clearable
                                        className="w-100"
                                    />
                                </FormGroup>
                            </div>

                            {/* Source Types — MultiSelectDropdown */}
                            <div className="col-md-4">
                                <FormGroup label={
                                    <div className="d-flex align-items-center gap-1">
                                        Source Types
                                        <Tooltips title="Internal system rules, external hardware alerts, or manual entries">
                                            <Icon icon="Info" size="sm" className="text-info cursor-pointer" />
                                        </Tooltips>
                                    </div>
                                }>
                                    <MultiSelectDropdown
                                        options={alertSourceOptions}
                                        value={(formData.source_types ?? []).map(String)}
                                        onChange={(vals) =>
                                            setFormData({ ...formData, source_types: vals })
                                        }
                                        placeholder="Select Sources"
                                        searchPlaceholder="Filter sources…"
                                        selectAll
                                        clearable
                                        className="w-100"
                                    />
                                </FormGroup>
                            </div>

                            {/* Trigger Conditions — unchanged (checkboxes) */}
                            <div className="col-md-4">
                                <FormGroup label="Trigger Conditions">
                                    <div className="d-flex gap-3 mt-2">
                                        <Checks
                                            type="checkbox"
                                            label="Over Max"
                                            checked={formData.action_for_max}
                                            onChange={(e: any) => setFormData({ ...formData, action_for_max: e.target.checked })}
                                        />
                                        <Checks
                                            type="checkbox"
                                            label="Under Min"
                                            checked={formData.action_for_min}
                                            onChange={(e: any) => setFormData({ ...formData, action_for_min: e.target.checked })}
                                        />
                                    </div>
                                </FormGroup>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ── Active Schedule ─────────────────────────────────────────── */}
            <div className="col-12">
                <div className="card border shadow-sm">
                    <div className="card-header bg-light py-2">
                        <span className="fw-bold small text-uppercase">Active Schedule (Optional)</span>
                    </div>
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-6 d-flex align-items-end">
                                <div className="d-flex flex-wrap gap-1">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                                        <div
                                            key={index}
                                            className={`border rounded text-center small fw-bold ${formData.weekdays?.includes(index) ? 'bg-primary text-white border-primary' : 'bg-light text-muted'}`}
                                            style={{ cursor: 'pointer', width: '32px', height: '32px', lineHeight: '32px', userSelect: 'none' }}
                                            onClick={() => handleDayToggle(index)}
                                            title={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}
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
                                        size="sm"
                                    />
                                </FormGroup>
                            </div>
                            <div className="col-md-3">
                                <FormGroup label="End Time">
                                    <Input
                                        type="time"
                                        value={formData.end_time || ''}
                                        onChange={(e: any) => setFormData({ ...formData, end_time: e.target.value })}
                                        size="sm"
                                    />
                                </FormGroup>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Target Assignment ───────────────────────────────────────── */}
            <div className="col-12">
                <div className="card border shadow-sm">
                    <div className="card-header bg-light py-2">
                        <span className="fw-bold small text-uppercase">Target Assignment</span>
                    </div>
                    <div className="card-body p-3">
                        <div className="row g-3">

                            {/* Areas — MultiSelectDropdown */}
                            <div className="col-md-6">
                                <FormGroup label="Apply to Areas">
                                    <MultiSelectDropdown
                                        options={areaOptions}
                                        value={(formData.area_ids ?? []).map(String)}
                                        onChange={(vals) =>
                                            setFormData({ ...formData, area_ids: vals.map(Number) })
                                        }
                                        placeholder="Select Areas"
                                        searchPlaceholder="Search areas…"
                                        selectAll
                                        clearable
                                        className="w-100"
                                    />
                                </FormGroup>
                            </div>

                            {/* Sensor Groups — MultiSelectDropdown */}
                            <div className="col-md-6">
                                <FormGroup label="Sensor Groups (Optional)">
                                    <MultiSelectDropdown
                                        options={sensorGroupOptions}
                                        value={(formData.sensor_group_ids ?? []).map(String)}
                                        onChange={(vals) =>
                                            setFormData({ ...formData, sensor_group_ids: vals.map(Number) })
                                        }
                                        placeholder="Select Sensor Groups"
                                        searchPlaceholder="Search groups…"
                                        selectAll
                                        clearable
                                        className="w-100"
                                    />
                                </FormGroup>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ── Associated Actions — kept as click-cards (no change) ─────── */}
            <div className="col-12">
                <div className="card border shadow-sm">
                    <div className="card-header bg-light py-2">
                        <span className="fw-bold small text-uppercase">Associated Actions</span>
                    </div>
                    <div className="card-body p-3">
                        <div className="row g-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {actions?.map((a: Action) => (
                                <div key={a.id} className="col-md-6">
                                    <div
                                        className={`p-2 border rounded d-flex align-items-center justify-content-between ${isSelected('action_ids', a.id) ? 'border-primary bg-primary-subtle' : 'bg-light-subtle'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleToggle('action_ids', a.id)}
                                    >
                                        <div className="text-truncate" style={{ maxWidth: '80%' }}>
                                            <div className="fw-bold small text-truncate">{a.name}</div>
                                            <small className="text-muted d-block text-truncate" style={{ fontSize: '0.65rem' }}>{a.type.toUpperCase()} - {a.message_type}</small>
                                        </div>
                                        <Checks
                                            id={`action-${a.id}`}
                                            checked={isSelected('action_ids', a.id)}
                                            onChange={() => { }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
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