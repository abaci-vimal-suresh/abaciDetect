import React from 'react';
import Icon from '../../../../../components/icon/Icon';
import InputColumn from './InputColumn';
import FilterColumn from './FilterColumn';
import ActionColumn from './ActionColumn';
import { AlertFilter, Action } from '../../hooks/useFlowHealth';

export interface ActivePath {
    filterId: number;
    actionIds: number[];
    alertTypes: string[];
}

interface PipelineLeftProps {
    filters: AlertFilter[];
    activePath: ActivePath | null;
    onFilterClick: (filter: AlertFilter) => void;
    onActionClick: (action: Action) => void;
    onPathActivate: (filterId: number) => void;
    onPathClear: () => void;
}

const PipelineLeft: React.FC<PipelineLeftProps> = ({
    filters,
    activePath,
    onFilterClick,
    onActionClick,
    onPathActivate,
    onPathClear
}) => {
    return (
        <div className="row g-0 h-100 pipeline-rail-container" onClick={(e) => {
            // Clear path if clicking background
            if (e.target === e.currentTarget) onPathClear();
        }}>
            {/* Column A - Inputs */}
            <div className="col-3 border-end border-light border-opacity-10 px-3">
                <h6 className="text-muted small text-uppercase fw-bold mb-3 border-bottom pb-2">Inputs</h6>
                <InputColumn
                    filters={filters}
                    activePathId={activePath?.filterId || null}
                    activeAlertTypes={activePath?.alertTypes || []}
                />
            </div>

            {/* Connector A-B */}
            <div className="d-flex flex-column gap-4 py-2 justify-content-around align-items-center" style={{ width: '32px' }}>
                {filters.map(f => (
                    <div key={f.id} className="d-flex align-items-center justify-content-center" style={{ height: '140px' }}>
                        <Icon
                            icon="ArrowForward"
                            className={`text-muted transition-all ${activePath?.filterId === f.id ? 'pipeline-connector active' : 'opacity-25'}`}
                        />
                    </div>
                ))}
            </div>

            {/* Column B - Filters */}
            <div className="col-4 border-end border-light border-opacity-10 px-3">
                <h6 className="text-muted small text-uppercase fw-bold mb-3 border-bottom pb-2">Conditions</h6>
                <FilterColumn
                    filters={filters}
                    activePathId={activePath?.filterId || null}
                    onFilterClick={onFilterClick}
                    onPathActivate={onPathActivate}
                />
            </div>

            {/* Connector B-C */}
            <div className="d-flex flex-column gap-4 py-2 justify-content-around align-items-center" style={{ width: '32px' }}>
                {filters.map(f => (
                    <div key={f.id} className="d-flex align-items-center justify-content-center" style={{ height: '140px' }}>
                        <Icon
                            icon="ArrowForward"
                            className={`text-muted transition-all ${activePath?.filterId === f.id ? 'pipeline-connector active' : 'opacity-25'}`}
                        />
                    </div>
                ))}
            </div>

            {/* Column C - Actions */}
            <div className="col-4 px-3">
                <h6 className="text-muted small text-uppercase fw-bold mb-3 border-bottom pb-2">Actions</h6>
                <ActionColumn
                    actions={filters.flatMap(f => f.actions || [])}
                    activeActionIds={activePath?.actionIds || []}
                    onActionClick={onActionClick}
                />
            </div>
        </div>
    );
};

export default PipelineLeft;
