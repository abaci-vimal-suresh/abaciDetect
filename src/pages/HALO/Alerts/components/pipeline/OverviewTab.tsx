import React from 'react';
import Icon from '../../../../../components/icon/Icon';
import Badge from '../../../../../components/bootstrap/Badge';
import { AlertFilter, AlertFilterGroup } from '../../hooks/useFlowHealth';

interface OverviewTabProps {
    filterGroups: AlertFilterGroup[];
    filters: AlertFilter[];
    activePathId: number | null;
    onEditFilter: (filter: AlertFilter) => void;
    isHealthy: boolean;
    deadFilters: AlertFilter[];
    overlappingFilters: AlertFilter[];
    silentFilters: AlertFilter[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    filters,
    onEditFilter,
    isHealthy,
    deadFilters,
    overlappingFilters,
    silentFilters
}) => {
    return (
        <div className="p-3">
            {/* Group Summary Stats */}
            <div className="row g-2 mb-4">
                <div className="col-6">
                    <div className="p-3 border rounded bg-light bg-opacity-10 text-center">
                        <div className="h4 mb-1 fw-bold">{filters.length}</div>
                        <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '10px' }}>Total Filters</div>
                    </div>
                </div>
                <div className="col-6">
                    <div className="p-3 border rounded bg-light bg-opacity-10 text-center">
                        <div className="h4 mb-1 fw-bold text-primary">
                            {filters.reduce((acc, f) => acc + (f.actions?.length || 0), 0)}
                        </div>
                        <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '10px' }}>Total Actions</div>
                    </div>
                </div>
            </div>

            {/* Health Checklist */}
            <div className="mb-4">
                <h6 className="text-muted small text-uppercase fw-bold mb-3">Health Checklist</h6>
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center justify-content-between p-2 rounded border bg-light bg-opacity-10">
                        <div className="d-flex align-items-center gap-2">
                            <Icon
                                icon={deadFilters.length === 0 ? "CheckCircle" : "Warning"}
                                className={deadFilters.length === 0 ? "text-success" : "text-warning"}
                            />
                            <span className="small">{filters.length} filters configured</span>
                        </div>
                        {deadFilters.length > 0 && (
                            <Badge color="warning" isLight className="cursor-pointer" onClick={() => onEditFilter(deadFilters[0])}>Fix</Badge>
                        )}
                    </div>


                    <div className="d-flex align-items-center justify-content-between p-2 rounded border bg-light bg-opacity-10">
                        <div className="d-flex align-items-center gap-2">
                            <Icon
                                icon={silentFilters.length === 0 ? "CheckCircle" : "NotificationsOff"}
                                className={silentFilters.length === 0 ? "text-success" : "text-secondary"}
                            />
                            <span className="small">{silentFilters.length > 0 ? `${silentFilters.length} filters silent now` : 'All scheduled filters active'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter List */}
            <div>
                <h6 className="text-muted small text-uppercase fw-bold mb-3">Filter Details</h6>
                <div className="list-group list-group-flush">
                    {filters.map((filter) => (
                        <div key={filter.id} className="list-group-item bg-transparent px-0 py-2 d-flex align-items-center justify-content-between">
                            <div className="d-flex flex-column text-truncate" style={{ maxWidth: '70%' }}>
                                <span className="small fw-bold text-truncate">{filter.name}</span>
                                <span className="text-muted" style={{ fontSize: '10px' }}>{filter.alert_types.join(', ')}</span>
                            </div>
                            <Badge color={filter.actions?.length ? 'primary' : 'warning'} isLight className="ms-2">
                                {filter.actions?.length || 0} actions
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
