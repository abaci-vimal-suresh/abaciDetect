import React, { useState, useMemo } from 'react';
import { useFlowHealth, AlertFilter, Action, AlertFilterGroup } from '../../../../hooks/useFlowHealth';
import HealthBar from './HealthBar';
import PipelineLeft, { ActivePath } from './PipelineLeft';
import PipelineRight from './PipelineRight';

interface PipelineViewProps {
    filterGroups: AlertFilterGroup[];
    alertFilters: AlertFilter[];
    actions: Action[];
    focusedGroupId: number | null;
    onEditFilter: (filter: AlertFilter) => void;
    onEditAction: (action: Action) => void;
}

const PipelineView: React.FC<PipelineViewProps> = ({
    filterGroups,
    alertFilters,
    actions,
    focusedGroupId,
    onEditFilter,
    onEditAction
}) => {
    const [activePath, setActivePath] = useState<ActivePath | null>(null);

    // Compute health data
    const healthData = useFlowHealth(alertFilters, filterGroups);

    // Determine filters to show based on focus
    const displayFilters = useMemo(() => {
        if (!focusedGroupId) return alertFilters;
        const group = filterGroups.find(g => g.id === focusedGroupId);
        if (!group) return alertFilters;
        const memberIds = group.alert_filter_ids || group.alert_filters?.map(af => af.id) || [];
        return alertFilters.filter(f => memberIds.includes(f.id));
    }, [alertFilters, filterGroups, focusedGroupId]);

    const focusedGroupName = useMemo(() => {
        if (!focusedGroupId) return 'All Filters';
        return filterGroups.find(g => g.id === focusedGroupId)?.name || 'Filter Group';
    }, [filterGroups, focusedGroupId]);

    const handleFilterClick = (filter: AlertFilter) => {
        setActivePath({
            filterId: filter.id,
            actionIds: filter.actions?.map(a => a.id) || [],
            alertTypes: filter.alert_types || []
        });
        onEditFilter(filter);
    };

    const handleActionClick = (action: Action) => {
        onEditAction(action);
    };

    return (
        <div className="pipeline-view-container  d-flex flex-column h-100  bg-opacity-10 rounded shadow-lg overflow-hidden border">
            <HealthBar
                totalFilters={displayFilters.length}
                totalActions={displayFilters.reduce((acc, f) => acc + (f.actions?.length || 0), 0)}
                deadFilters={healthData.deadFilters.filter(f => displayFilters.some(df => df.id === f.id)).length}
                overlaps={healthData.overlappingFilters.filter(f => displayFilters.some(df => df.id === f.id)).length}
                silentNow={healthData.silentFilters.filter(f => displayFilters.some(df => df.id === f.id)).length}
                duplicateAlerts={healthData.duplicateRecipients.length}
                groupName={focusedGroupName}
            />

            <div className="row g-0 flex-grow-1 overflow-hidden p-4">
                <div className="col-8 border-end overflow-auto h-100 bg-light bg-opacity-10 py-3">
                    <PipelineLeft
                        filters={displayFilters}
                        activePath={activePath}
                        onFilterClick={handleFilterClick}
                        onActionClick={handleActionClick}
                        onPathActivate={(filterId) => {
                            const filter = displayFilters.find(f => f.id === filterId);
                            if (filter) {
                                setActivePath({
                                    filterId: filter.id,
                                    actionIds: filter.actions?.map(a => a.id) || [],
                                    alertTypes: filter.alert_types || []
                                });
                            }
                        }}
                        onPathClear={() => setActivePath(null)}
                    />
                </div>
                <div className="col-4 h-100">
                    <PipelineRight
                        filterGroups={filterGroups}
                        filters={displayFilters}
                        activePathId={activePath?.filterId || null}
                        onEditFilter={onEditFilter}
                        isHealthy={healthData.isHealthy}
                        deadFilters={healthData.deadFilters.filter(f => displayFilters.some(df => df.id === f.id))}
                        overlappingFilters={healthData.overlappingFilters.filter(f => displayFilters.some(df => df.id === f.id))}
                        silentFilters={healthData.silentFilters.filter(f => displayFilters.some(df => df.id === f.id))}
                        duplicateRecipients={healthData.duplicateRecipients}
                        currentDay={healthData.currentDay}
                        currentTime={healthData.currentTime}
                    />
                </div>
            </div>
        </div>
    );
};

export default PipelineView;
