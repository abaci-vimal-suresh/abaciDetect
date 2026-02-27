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
                        style={{ minHeight: '140px' }}
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

                            <div className="d-flex gap-2 mb-2">
                                {filter.action_for_max && (
                                    <Badge color="success" isLight className="small px-2" style={{ fontSize: '0.65rem' }}>
                                        <Icon icon="CheckCircle" size="sm" className="me-1" /> Over Max
                                    </Badge>
                                )}
                                {filter.action_for_min && (
                                    <Badge color="success" isLight className="small px-2" style={{ fontSize: '0.65rem' }}>
                                        <Icon icon="CheckCircle" size="sm" className="me-1" /> Under Min
                                    </Badge>
                                )}
                            </div>

                            <div className="small text-muted mb-1 text-truncate">
                                <Icon icon="LocationOn" size="sm" className="me-1" />
                                {filter.area_list?.map(a => a.name).join(', ') || 'Global'}
                            </div>

                            <div className="small text-muted mb-auto text-truncate">
                                <Icon icon="Groups" size="sm" className="me-1" />
                                {filter.sensor_groups?.map(g => g.name).join(', ') || 'All Sensors'}
                            </div>

                            <div className="mt-2 pt-2 border-top border-light d-flex align-items-center justify-content-between align-self-end w-100">
                                <span className={`small fw-bold ${actionCount === 0 ? 'text-warning' : 'text-primary'}`}>
                                    <Icon icon="Bolt" size="sm" className="me-1" />
                                    {actionCount} Actions
                                    {actionCount === 0 && <Icon icon="Warning" size="sm" className="ms-1" />}
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
