import React from 'react';
import Icon from '../../../../../components/icon/Icon';
import Badge from '../../../../../components/bootstrap/Badge';
import { AlertFilter } from '../../hooks/useFlowHealth';

interface FilterColumnProps {
    filters: AlertFilter[];
    activePathId: number | null;
    onFilterClick: (filter: AlertFilter) => void;
    onPathActivate: (filterId: number) => void;
}

const FilterColumn: React.FC<FilterColumnProps> = ({
    filters,
    activePathId,
    onFilterClick,
    onPathActivate
}) => {
    const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div className="d-flex flex-column gap-4 py-2">
            {filters.map((filter) => {
                const isActive = activePathId === filter.id;
                const isMuted = activePathId !== null && !isActive;
                const actionCount = filter.actions?.length || 0;

                return (
                    <div
                        key={filter.id}
                        className={`card pipeline-filter-card transition-all mb-0 ${isActive ? 'active' : ''} ${isMuted ? 'opacity-50' : ''} ${actionCount === 0 ? 'border-warning' : ''}`}
                        onClick={() => {
                            onFilterClick(filter);
                            onPathActivate(filter.id);
                        }}
                        style={{ minHeight: '160px' }}
                    >
                        <div className="card-body p-3 d-flex flex-column">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <h6 className="card-title mb-0 d-flex align-items-center text-truncate">
                                    <Icon icon="FilterAlt" className="text-primary me-2" size="sm" />
                                    {filter.name}
                                </h6>
                                <div
                                    className={`rounded-circle ${filter.is_active ? 'bg-success' : 'bg-secondary'}`}
                                    style={{ width: '8px', height: '8px', boxShadow: filter.is_active ? '0 0 8px var(--bs-success)' : 'none' }}
                                />
                            </div>

                            <div className="border-top border-light my-2 opacity-50"></div>

                            {/* Conditions Info: Where & When */}
                            <div className="mb-3">
                                {/* Where: Areas */}
                                <div className="d-flex flex-wrap gap-1 mb-2">
                                    {filter.area_list?.map((area) => (
                                        <span key={area.id} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 py-1" style={{ fontSize: '0.65rem' }}>
                                            <Icon icon="LocationOn" size="sm" className="me-1" />
                                            {area.name}
                                        </span>
                                    ))}
                                </div>

                                {/* When: Schedule */}
                                <div className="d-flex align-items-center justify-content-between mt-2">
                                    <div className="d-flex gap-1">
                                        {DAYS.map((day, idx) => (
                                            <span
                                                key={idx}
                                                className={`d-flex align-items-center justify-content-center rounded-circle small ${(filter.weekdays || []).includes(idx) ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                                                style={{ width: '14px', height: '14px', fontSize: '9px', fontWeight: 'bold' }}
                                            >
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                    {filter.start_time && (
                                        <span className="text-muted" style={{ fontSize: '10px' }}>
                                            <Icon icon="Schedule" size="sm" className="me-1" />
                                            {filter.start_time.substring(0, 5)} - {filter.end_time?.substring(0, 5)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-2 border-top border-light d-flex align-items-center justify-content-between w-100">
                                <span className={`small fw-bold ${actionCount === 0 ? 'text-warning' : 'text-primary'}`}>
                                    <Icon icon="Bolt" size="sm" className="me-1" />
                                    {actionCount} Actions
                                    {actionCount === 0 && <Icon icon="Warning" size="sm" className="ms-1 outline-none" />}
                                </span>
                                <Icon icon="ArrowForward" size="sm" className={`opacity-50 ${isActive ? 'text-primary opacity-100' : ''}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FilterColumn;
