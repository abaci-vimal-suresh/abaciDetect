import React from 'react';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';

interface HealthBarProps {
    totalFilters: number;
    totalActions: number;
    deadFilters: number;        // filters with no actions
    overlaps: number;           // overlapping filter count
    silentNow: number;          // filters silent at current time
    duplicateAlerts: number;    // duplicate recipients
    groupName: string;
}

const HealthBar: React.FC<HealthBarProps> = ({
    totalFilters,
    totalActions,
    deadFilters,
    overlaps,
    silentNow,
    duplicateAlerts,
    groupName
}) => {
    const isHealthy = deadFilters === 0 && overlaps === 0 && duplicateAlerts === 0;

    return (
        <div className="d-flex flex-wrap align-items-center gap-3 p-3 border-bottom mb-3 bg-light bg-opacity-10 rounded">
            <div className="d-flex align-items-center gap-2 me-2">
                <Icon icon="Folder" size="lg" className="text-warning" />
                <h5 className="mb-0 fw-bold">{groupName || 'All Filters'}</h5>
            </div>

            <div className="vr mx-2 text-muted opacity-25" style={{ height: '24px' }}></div>

            <div className="d-flex align-items-center gap-3 flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small text-uppercase fw-bold">Filters:</span>
                    <Badge color="primary" isLight>{totalFilters}</Badge>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small text-uppercase fw-bold">Actions:</span>
                    <Badge color="info" isLight>{totalActions}</Badge>
                </div>

                {deadFilters > 0 && (
                    <Badge color="warning" className="d-flex align-items-center gap-1">
                        <Icon icon="Warning" size="sm" />
                        {deadFilters} dead
                    </Badge>
                )}

                {overlaps > 0 && (
                    <Badge color="danger" className="d-flex align-items-center gap-1">
                        <Icon icon="Error" size="sm" />
                        {overlaps} overlapping
                    </Badge>
                )}

                {silentNow > 0 && (
                    <Badge color="secondary" className="d-flex align-items-center gap-1">
                        <Icon icon="NotificationsOff" size="sm" />
                        {silentNow} silent now
                    </Badge>
                )}

                {duplicateAlerts > 0 && (
                    <Badge color="info" className="d-flex align-items-center gap-1">
                        <Icon icon="People" size="sm" />
                        {duplicateAlerts} duplicate recipients
                    </Badge>
                )}

                {isHealthy && (
                    <Badge color="success" className="d-flex align-items-center gap-1 ms-auto">
                        <Icon icon="CheckCircle" size="sm" />
                        All systems healthy
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default HealthBar;
