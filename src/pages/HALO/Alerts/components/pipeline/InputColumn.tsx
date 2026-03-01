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
        <div className="  d-flex flex-column gap-4 py-2">
            {filters.map((filter) => {
                const isActive = activePathId === filter.id;
                const isMuted = activePathId !== null && !isActive;

                return (
                    <div
                        key={filter.id}
                        className={`card pipeline-filter-card transition-all mb-0 d-flex flex-column align-items-center justify-content-center ${isActive ? 'active' : ''} ${isMuted ? 'opacity-50' : ''}`}
                        style={{ minHeight: '160px' }}
                    >
                        <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center w-100">
                            <div className="d-flex flex-wrap gap-2 justify-content-center">
                                {(filter.alert_types || []).map((type) => (
                                    <Badge
                                        key={type}
                                        color={ALERT_TYPE_COLORS[type] || ALERT_TYPE_COLORS.default}
                                        className={`text-uppercase px-3 py-2 ${isActive && activeAlertTypes.includes(type) ? 'pipeline-alert-type-badge active' : ''}`}
                                        style={{ fontSize: '0.8rem', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}
                                    >
                                        {type.replace('_', ' ')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InputColumn;
