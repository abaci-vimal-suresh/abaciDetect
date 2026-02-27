import React from 'react';
import Badge from '../../../../../components/bootstrap/Badge';
import Icon from '../../../../../components/icon/Icon';
import { AlertFilter } from '../../hooks/useFlowHealth';

export const ALERT_TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'light' | 'dark'> = {
    co2_high: 'danger',
    co2_low: 'warning',
    temp_high: 'danger',
    temp_low: 'info',
    anomaly: 'warning',
    offline: 'secondary',
    default: 'primary'
};

interface InputColumnProps {
    filters: AlertFilter[];
    activePathId: number | null;
    activeAlertTypes: string[];
}

const InputColumn: React.FC<InputColumnProps> = ({ filters, activePathId, activeAlertTypes }) => {
    const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div className="d-flex flex-column gap-4 py-2">
            {filters.map((filter) => {
                const isActive = activePathId === filter.id;
                const isMuted = activePathId !== null && !isActive;

                return (
                    <div
                        key={filter.id}
                        className={`p-3 rounded border bg-light bg-opacity-25 transition-all ${isActive ? 'border-primary shadow-sm bg-primary bg-opacity-10' : 'border-transparent'} ${isMuted ? 'opacity-50' : ''}`}
                        style={{ minHeight: '140px' }}
                    >
                        {/* Alert Types */}
                        <div className="d-flex flex-wrap gap-1 mb-2">
                            {(filter.alert_types || []).map((type) => (
                                <Badge
                                    key={type}
                                    color={ALERT_TYPE_COLORS[type] || ALERT_TYPE_COLORS.default}
                                    className={`text-uppercase small ${isActive && activeAlertTypes.includes(type) ? 'pipeline-alert-type-badge active' : ''}`}
                                    style={{ fontSize: '0.65rem' }}
                                >
                                    {type.replace('_', ' ')}
                                </Badge>
                            ))}
                        </div>

                        {/* Areas */}
                        <div className="d-flex flex-wrap gap-1 mb-3">
                            {filter.area_list?.map((area) => (
                                <span key={area.id} className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 small" style={{ fontSize: '0.65rem' }}>
                                    {area.name}
                                </span>
                            ))}
                        </div>

                        {/* Schedule */}
                        <div className="mt-auto pt-2 border-top border-light opacity-75">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex gap-1">
                                    {DAYS.map((day, idx) => (
                                        <span
                                            key={idx}
                                            className={`d-flex align-items-center justify-content-center rounded-circle small ${(filter.weekdays || []).includes(idx) ? 'bg-primary text-white shadow-sm' : 'bg-light text-muted'}`}
                                            style={{ width: '16px', height: '16px', fontSize: '10px', fontWeight: 'bold' }}
                                        >
                                            {day}
                                        </span>
                                    ))}
                                </div>
                                {filter.start_time && (
                                    <span className="text-muted" style={{ fontSize: '10px' }}>
                                        <Icon icon="Schedule" size="sm" className="me-1" />
                                        {filter.start_time} - {filter.end_time}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InputColumn;
