import React, { useState } from 'react';
import Icon from '../../../../../components/icon/Icon';
import Button from '../../../../../components/bootstrap/Button';
import FormGroup from '../../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../../components/bootstrap/forms/Input';
import Select from '../../../../../components/bootstrap/forms/Select';
import Option from '../../../../../components/bootstrap/Option';
import { AlertFilter, Action } from '../../hooks/useFlowHealth';
import { ALERT_TYPE_CHOICES } from '../../../../../types/sensor';
import { useAreas } from '../../../../../api/sensors.api';

interface DryRunTabProps {
    filters: AlertFilter[];
    currentDay: number;
    currentTime: string;
}

interface SimResult {
    matched: AlertFilter[];
    skipped: { filter: AlertFilter, reason: string }[];
    wouldFire: Action[];
    warnings: string[];
}

const DryRunTab: React.FC<DryRunTabProps> = ({ filters, currentDay, currentTime }) => {
    const { data: areas } = useAreas();
    const [simAlertType, setSimAlertType] = useState('');
    const [simAreaId, setSimAreaId] = useState<number | null>(null);
    const [simDay, setSimDay] = useState<number>(currentDay);
    const [simTime, setSimTime] = useState<string>(currentTime);
    const [simResult, setSimResult] = useState<SimResult | null>(null);

    const DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const runSimulation = () => {
        const matched: AlertFilter[] = [];
        const skipped: { filter: AlertFilter, reason: string }[] = [];

        filters.forEach(filter => {
            // Check active
            if (!filter.is_active) {
                skipped.push({ filter, reason: 'Filter is inactive' });
                return;
            }
            // Check alert type
            if (simAlertType && !filter.alert_types?.includes(simAlertType)) {
                skipped.push({ filter, reason: 'Alert type not matched' });
                return;
            }
            // Check area
            if (simAreaId && !filter.area_ids.includes(simAreaId)) {
                skipped.push({ filter, reason: 'Area not in filter scope' });
                return;
            }
            // Check day
            if ((filter.weekdays?.length || 0) > 0 && !filter.weekdays?.includes(simDay)) {
                skipped.push({ filter, reason: 'Day not in schedule' });
                return;
            }
            // Check time
            if (filter.start_time && simTime < filter.start_time) {
                skipped.push({ filter, reason: 'Before scheduled start time' });
                return;
            }
            if (filter.end_time && simTime > filter.end_time) {
                skipped.push({ filter, reason: 'After scheduled end time' });
                return;
            }

            matched.push(filter);
        });

        const wouldFire = matched.flatMap(f => f.actions || []).filter(a => a.is_active);

        // Detect duplicate recipient warnings
        const recipientIds = wouldFire.flatMap(a => {
            if (!a.recipients) return [];
            return a.recipients.map(r => (typeof r === 'object' ? r.id : r));
        });
        const dupes = recipientIds.filter((r, i) => recipientIds.indexOf(r) !== i);
        const uniqueDupes = Array.from(new Set(dupes));

        const warnings: string[] = [];
        if (uniqueDupes.length > 0) warnings.push(`${uniqueDupes.length} recipients will get duplicate alerts`);
        if (matched.length === 0) warnings.push('No filters matched — alert would be silently ignored');

        setSimResult({ matched, skipped, wouldFire, warnings });
    };

    return (
        <div className="p-3">
            <div className="border rounded p-3 bg-light bg-opacity-10 mb-4">
                <h6 className="text-muted small text-uppercase fw-bold mb-3 d-flex align-items-center">
                    <Icon icon="Science" className="me-2 text-primary" />
                    Simulate an Alert
                </h6>

                <div className="row g-3">
                    <div className="col-12">
                        <FormGroup label="Alert Type">
                            <Select
                                value={simAlertType}
                                onChange={(e: any) => setSimAlertType(e.target.value)}
                                ariaLabel="Select alert type"
                            >
                                <Option value="">Select Type...</Option>
                                {ALERT_TYPE_CHOICES.map(choice => (
                                    <Option key={choice.value} value={choice.value}>{choice.label}</Option>
                                ))}
                            </Select>
                        </FormGroup>
                    </div>

                    <div className="col-12">
                        <FormGroup label="Area">
                            <Select
                                value={simAreaId?.toString() || ""}
                                onChange={(e: any) => setSimAreaId(e.target.value ? parseInt(e.target.value) : null)}
                                ariaLabel="Select area"
                            >
                                <Option value="">Select Area...</Option>
                                {areas?.map((area: any) => (
                                    <Option key={area.id} value={area.id.toString()}>{area.name}</Option>
                                ))}
                            </Select>
                        </FormGroup>
                    </div>

                    <div className="col-12">
                        <label className="form-label small fw-bold text-muted text-uppercase mb-2">Simulated Day</label>
                        <div className="d-flex gap-1 justify-content-between mb-3">
                            {DAYS_SHORT.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={`d-flex align-items-center justify-content-center rounded border transition-all cursor-pointer ${simDay === idx ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-muted border-light'}`}
                                    style={{ width: '36px', height: '36px', fontWeight: 'bold' }}
                                    onClick={() => setSimDay(idx)}
                                    title={DAYS_LONG[idx]}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-12">
                        <FormGroup label="Simulated Time">
                            <Input
                                type="time"
                                value={simTime}
                                onChange={(e: any) => setSimTime(e.target.value)}
                            />
                        </FormGroup>
                    </div>

                    <div className="col-12 mt-4">
                        <Button color="primary" className="w-100" onClick={runSimulation} icon="PlayArrow">
                            Run Simulation
                        </Button>
                    </div>
                </div>
            </div>

            {simResult && (
                <div className="simulation-results slide-in">
                    <h6 className="text-muted small text-uppercase fw-bold mb-3">Results</h6>

                    {/* Matched */}
                    <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Icon icon="CheckCircle" className="text-success" size="sm" />
                            <span className="small fw-bold text-uppercase" style={{ fontSize: '10px' }}>Matched ({simResult.matched.length})</span>
                        </div>
                        {simResult.matched.length > 0 ? (
                            <ul className="list-unstyled mb-0 ps-4">
                                {simResult.matched.map(f => (
                                    <li key={f.id} className="small text-muted mb-1">• {f.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <span className="small text-muted ps-4 italic">No matched filters</span>
                        )}
                    </div>

                    {/* Skipped */}
                    <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Icon icon="SkipNext" className="text-secondary" size="sm" />
                            <span className="small fw-bold text-uppercase" style={{ fontSize: '10px' }}>Skipped ({simResult.skipped.length})</span>
                        </div>
                        <ul className="list-unstyled mb-0 ps-4">
                            {simResult.skipped.slice(0, 3).map(s => (
                                <li key={s.filter.id} className="small text-muted mb-1 d-flex justify-content-between">
                                    <span>• {s.filter.name}</span>
                                    <span className="opacity-50" style={{ fontSize: '9px' }}>{s.reason}</span>
                                </li>
                            ))}
                            {simResult.skipped.length > 3 && (
                                <li className="small text-muted opacity-50 ps-4">...and {simResult.skipped.length - 3} more</li>
                            )}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="mb-3 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded shadow-sm">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Icon icon="Bolt" className="text-success" size="sm" />
                            <span className="small fw-bold text-uppercase text-success" style={{ fontSize: '10px' }}>Would Fire ({simResult.wouldFire.length})</span>
                        </div>
                        {simResult.wouldFire.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                                {simResult.wouldFire.map(a => (
                                    <div key={a.id} className="small d-flex align-items-center gap-2">
                                        <Icon icon="Check" className="text-success" size="sm" />
                                        <strong>{a.name}</strong>
                                        <span className="opacity-75" style={{ fontSize: '9px' }}>({a.type})</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="small text-danger italic">No actions would be triggered</span>
                        )}
                    </div>

                    {/* Warnings */}
                    {simResult.warnings.length > 0 && (
                        <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded mb-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <Icon icon="Warning" className="text-warning" size="sm" />
                                <span className="small fw-bold text-uppercase text-warning" style={{ fontSize: '10px' }}>Warnings</span>
                            </div>
                            <ul className="list-unstyled mb-0 m-0 p-0">
                                {simResult.warnings.map((w, i) => (
                                    <li key={i} className="small text-warning-emphasis fw-bold mb-1">• {w}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DryRunTab;
