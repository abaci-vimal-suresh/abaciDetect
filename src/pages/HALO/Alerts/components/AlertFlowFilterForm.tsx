import * as React from 'react';
import { AlertFilter, Area, ALERT_TYPE_CHOICES, ALERT_SOURCE_CHOICES } from '../../../../types/sensor';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Tooltips from '../../../../components/bootstrap/Tooltips';
import Icon from '../../../../components/icon/Icon';
import { useAreas, useSensorGroups } from '../../../../api/sensors.api';
import { MultiSelectDropdown, Option } from '../../../../components/CustomComponent/Select/MultiSelectDropdown';

interface AlertFlowFilterFormProps {
    filter?: Partial<AlertFilter>;
    onSave: (data: Partial<AlertFilter>) => void;
    onCancel: () => void;
}

const AlertFlowFilterForm: React.FC<AlertFlowFilterFormProps> = ({ filter, onSave, onCancel }) => {
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
        return initial;
    });

    const { data: areas } = useAreas();
    const { data: sensorGroups } = useSensorGroups();

    const handleDayToggle = (day: number) => {
        const currentDays = formData.weekdays || [];
        const index = currentDays.indexOf(day);
        let newDays = [...currentDays];
        if (index > -1) newDays.splice(index, 1);
        else newDays.push(day);
        setFormData({ ...formData, weekdays: newDays });
    };

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
        <div className="row g-4">
            {/* ── Basic Info ── */}
            <div className="col-12">
                <FormGroup label="Rule Name">
                    <Input
                        value={formData.name || ''}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Temperature Threshold"
                    />
                </FormGroup>
            </div>
            <div className="col-12">
                <FormGroup label="Description">
                    <Input
                        value={formData.description || ''}
                        onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What does this rule do?"
                    />
                </FormGroup>
            </div>

            <div className="col-12">
                <div className="d-flex align-items-center justify-content-between p-2 border rounded bg-light">
                    <span className="small fw-bold text-muted text-uppercase">Rule Status</span>
                    <Checks
                        id="is_active_flow"
                        type="switch"
                        label={formData.is_active ? 'Active' : 'Inactive'}
                        checked={formData.is_active}
                        onChange={(e: any) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                </div>
            </div>

            {/* ── Selectors ── */}
            <div className="col-12">
                <FormGroup label="Alert Types">
                    <MultiSelectDropdown
                        options={alertTypeOptions}
                        value={(formData.alert_types ?? []).map(String)}
                        onChange={(vals) => setFormData({ ...formData, alert_types: vals })}
                        placeholder="Select Types"
                        searchPlaceholder="Filter types…"
                        selectAll
                        clearable
                        className="w-100"
                    />
                </FormGroup>
            </div>

            <div className="col-12">
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
                        onChange={(vals) => setFormData({ ...formData, source_types: vals })}
                        placeholder="Select Sources"
                        searchPlaceholder="Filter sources…"
                        selectAll
                        clearable
                        className="w-100"
                    />
                </FormGroup>
            </div>

            {/* ── Conditions ── */}
            <div className="col-12">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Trigger Conditions</label>
                <div className="d-flex gap-4 p-2 border rounded">
                    <Checks
                        type="checkbox"
                        label="Over Max"
                        checked={formData.action_for_max || false}
                        onChange={(e: any) => setFormData({ ...formData, action_for_max: e.target.checked })}
                    />
                    <Checks
                        type="checkbox"
                        label="Under Min"
                        checked={formData.action_for_min || false}
                        onChange={(e: any) => setFormData({ ...formData, action_for_min: e.target.checked })}
                    />
                </div>
            </div>

            {/* ── Schedule ── */}
            <div className="col-12">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Schedule</label>
                <div className="p-3 border rounded bg-light">
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                            <div
                                key={index}
                                className={`border rounded text-center small fw-bold ${formData.weekdays?.includes(index) ? 'bg-primary text-white border-primary' : 'bg-white text-muted'}`}
                                style={{ cursor: 'pointer', width: '36px', height: '36px', lineHeight: '36px', userSelect: 'none', transition: 'all 0.2s' }}
                                onClick={() => handleDayToggle(index)}
                                title={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="row g-2">
                        <div className="col-6">
                            <FormGroup label="Start Time">
                                <Input
                                    type="time"
                                    value={formData.start_time || ''}
                                    onChange={(e: any) => setFormData({ ...formData, start_time: e.target.value })}
                                />
                            </FormGroup>
                        </div>
                        <div className="col-6">
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

            {/* ── Assignment ── */}
            <div className="col-12">
                <FormGroup label="Apply to Areas">
                    <MultiSelectDropdown
                        options={areaOptions}
                        value={(formData.area_ids ?? []).map(String)}
                        onChange={(vals) => setFormData({ ...formData, area_ids: vals.map(Number) })}
                        placeholder="Select Areas"
                        searchPlaceholder="Search areas…"
                        selectAll
                        clearable
                        className="w-100"
                    />
                </FormGroup>
            </div>

            <div className="col-12">
                <FormGroup label="Sensor Groups (Optional)">
                    <MultiSelectDropdown
                        options={sensorGroupOptions}
                        value={(formData.sensor_group_ids ?? []).map(String)}
                        onChange={(vals) => setFormData({ ...formData, sensor_group_ids: vals.map(Number) })}
                        placeholder="Select Sensor Groups"
                        searchPlaceholder="Search groups…"
                        selectAll
                        clearable
                        className="w-100"
                    />
                </FormGroup>
            </div>

            {/* ── Footer ── */}
            <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Button color="light" onClick={onCancel}>Cancel</Button>
                <Button color="primary" onClick={() => onSave(formData)} isDisable={!formData.name}>
                    Save Changes
                </Button>
            </div>
        </div>
    );
};

export default AlertFlowFilterForm;
