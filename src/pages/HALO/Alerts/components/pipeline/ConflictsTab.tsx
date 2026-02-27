import React from 'react';
import Icon from '../../../../../components/icon/Icon';
import { AlertFilter } from '../../hooks/useFlowHealth';

interface ConflictsTabProps {
    deadFilters: AlertFilter[];
    overlappingFilters: AlertFilter[];
    silentFilters: AlertFilter[];
    duplicateRecipients: number[];
}

const ConflictsTab: React.FC<ConflictsTabProps> = ({
    deadFilters,
    overlappingFilters,
    silentFilters,
    duplicateRecipients
}) => {
    const hasConflicts = deadFilters.length > 0 || overlappingFilters.length > 0 || silentFilters.length > 0 || duplicateRecipients.length > 0;

    if (!hasConflicts) {
        return (
            <div className="text-center p-5">
                <Icon icon="CheckCircle" size="4x" className="text-success mb-3 opacity-25" />
                <h6 className="fw-bold">No conflicts detected</h6>
                <p className="text-muted small">All filters are healthy and properly connected.</p>
            </div>
        );
    }

    return (
        <div className="p-3 d-flex flex-column gap-3">
            {/* Dead filters */}
            {deadFilters.map(f => (
                <div key={`dead-${f.id}`} className="alert alert-warning border-warning border-opacity-25 bg-warning bg-opacity-10 d-flex gap-3 mb-0">
                    <Icon icon="Warning" className="text-warning mt-1" />
                    <div className="small">
                        <strong className="d-block mb-1">{f.name}</strong>
                        <span>Filter has no actions linked. Alert will fire but nothing will happen.</span>
                    </div>
                </div>
            ))}

            {/* Overlapping filters */}
            {overlappingFilters.map(f => (
                <div key={`overlap-${f.id}`} className="alert alert-danger border-danger border-opacity-25 bg-danger bg-opacity-10 d-flex gap-3 mb-0">
                    <Icon icon="Error" className="text-danger mt-1" />
                    <div className="small">
                        <strong className="d-block mb-1">{f.name}</strong>
                        <span>Overlaps with another filter (same alert type + area). This may cause duplicate notifications.</span>
                    </div>
                </div>
            ))}

            {/* Silent filters */}
            {silentFilters.map(f => (
                <div key={`silent-${f.id}`} className="alert alert-secondary border-secondary border-opacity-25 bg-secondary bg-opacity-10 d-flex gap-3 mb-0">
                    <Icon icon="NotificationsOff" className="text-secondary mt-1" />
                    <div className="small">
                        <strong className="d-block mb-1">{f.name}</strong>
                        <span>Currently outside its scheduled hours or days. It will not trigger right now.</span>
                    </div>
                </div>
            ))}

            {/* Duplicate recipients */}
            {duplicateRecipients.length > 0 && (
                <div className="alert alert-info border-info border-opacity-25 bg-info bg-opacity-10 d-flex gap-3 mb-0">
                    <Icon icon="People" className="text-info mt-1" />
                    <div className="small">
                        <strong className="d-block mb-1">Duplicate Recipients</strong>
                        <span>{duplicateRecipients.length} recipients will receive multiple alerts from different actions for the same event.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConflictsTab;
