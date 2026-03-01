import React, { useState } from 'react';
import Nav, { NavItem } from '../../../../../components/bootstrap/Nav';
import OverviewTab from './OverviewTab';
import ConflictsTab from './ConflictsTab';
import DryRunTab from './DryRunTab';
import { AlertFilter, AlertFilterGroup } from '../../hooks/useFlowHealth';

interface PipelineRightProps {
    filterGroups: AlertFilterGroup[];
    filters: AlertFilter[];
    activePathId: number | null;
    onEditFilter: (filter: AlertFilter) => void;
    isHealthy: boolean;
    deadFilters: AlertFilter[];
    overlappingFilters: AlertFilter[];
    silentFilters: AlertFilter[];
    duplicateRecipients: number[];
    currentDay: number;
    currentTime: string;
}

const PipelineRight: React.FC<PipelineRightProps> = ({
    filterGroups,
    filters,
    activePathId,
    onEditFilter,
    isHealthy,
    deadFilters,
    overlappingFilters,
    silentFilters,
    duplicateRecipients,
    currentDay,
    currentTime
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'conflicts' | 'dryrun'>('overview');

    return (
        <div className="card h-100 border-0 bg-transparent">
            <div className="card-header bg-transparent border-bottom p-0">
                <Nav design="tabs" className="px-3 border-0">
                    <NavItem
                        isActive={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    >
                        <span className="cursor-pointer small fw-bold text-uppercase">Overview</span>
                    </NavItem>
                    <NavItem
                        isActive={activeTab === 'conflicts'}
                        onClick={() => setActiveTab('conflicts')}
                    >
                        <span className="cursor-pointer small fw-bold text-uppercase d-flex align-items-center gap-1">
                            Conflicts
                            {!isHealthy && (
                                <span className="rounded-circle bg-danger" style={{ width: '6px', height: '6px' }}></span>
                            )}
                        </span>
                    </NavItem>
                    <NavItem
                        isActive={activeTab === 'dryrun'}
                        onClick={() => setActiveTab('dryrun')}
                    >
                        <span className="cursor-pointer small fw-bold text-uppercase">Alert Preview</span>
                    </NavItem>
                </Nav>
            </div>
            <div className="card-body p-0 overflow-auto">
                {activeTab === 'overview' && (
                    <OverviewTab
                        filters={filters}
                        filterGroups={filterGroups}
                        activePathId={activePathId}
                        onEditFilter={onEditFilter}
                        isHealthy={isHealthy}
                        deadFilters={deadFilters}
                        overlappingFilters={overlappingFilters}
                        silentFilters={silentFilters}
                    />
                )}
                {activeTab === 'conflicts' && (
                    <ConflictsTab
                        deadFilters={deadFilters}
                        overlappingFilters={overlappingFilters}
                        silentFilters={silentFilters}
                        duplicateRecipients={duplicateRecipients}
                    />
                )}
                {activeTab === 'dryrun' && (
                    <DryRunTab
                        filters={filters}
                        currentDay={currentDay}
                        currentTime={currentTime}
                    />
                )}
            </div>
        </div>
    );
};

export default PipelineRight;
