import React from 'react';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';
import Checks from '../../../../components/bootstrap/forms/Checks';
import { useSensorGroups } from '../../../../api/sensors.api';
import Button from '../../../../components/bootstrap/Button';

interface AggregationFilterPanelProps {
    areas: any[];
    selectedAreaIds: (number | string)[];
    onAreaSelectionChange: (ids: (number | string)[]) => void;
    selectedGroupIds: (number | string)[];
    onGroupSelectionChange: (ids: (number | string)[]) => void;
    onShowAllAreas: () => void;
    onEditAreaWalls: (area: any) => void;
}

const AggregationFilterPanel: React.FC<AggregationFilterPanelProps> = ({
    areas,
    selectedAreaIds,
    onAreaSelectionChange,
    selectedGroupIds,
    onGroupSelectionChange,
    onShowAllAreas,
    onEditAreaWalls
}) => {
    const { darkModeStatus } = useDarkMode();
    const { data: groups, isLoading: groupsLoading } = useSensorGroups();

    // Filter to only floors and rooms
    const selectableAreas = areas.filter(a => a.area_type === 'floor' || a.area_type === 'room');

    const toggleArea = (id: number | string) => {
        const numId = Number(id);
        const newIds = selectedAreaIds.includes(numId)
            ? selectedAreaIds.filter(i => Number(i) !== numId)
            : [...selectedAreaIds, numId];
        onAreaSelectionChange(newIds);
    };

    const isAreaSelected = (id: number | string) => selectedAreaIds.includes(Number(id));

    const toggleGroup = (id: number | string) => {
        const numId = Number(id);
        const newIds = selectedGroupIds.includes(numId)
            ? selectedGroupIds.filter(i => Number(i) !== numId)
            : [...selectedGroupIds, numId];
        onGroupSelectionChange(newIds);
    };

    const isGroupSelected = (id: number | string) => selectedGroupIds.includes(Number(id));

    return (
        <div className="no-scrollbar overflow-auto h-100">
            {/* Areas Section */}
            <div className='mb-4'>
                <div className='d-flex justify-content-between align-items-center mb-2 px-2'>
                    <div className='small fw-bold text-info text-uppercase' style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                        <Icon icon="PinDrop" className="me-1" /> Areas ({selectedAreaIds.length})
                    </div>
                    {selectableAreas.length > 0 && (
                        <div
                            className="text-info cursor-pointer hover-text-primary fw-bold"
                            style={{ fontSize: '0.7rem' }}
                            onClick={onShowAllAreas}
                        >
                            SHOW ALL
                        </div>
                    )}
                </div>
                {selectableAreas.map(area => (
                    <div
                        key={area.id}
                        className={`p-2 rounded mb-1 cursor-pointer transition-all d-flex align-items-center justify-content-between ${isAreaSelected(area.id) ? 'bg-info bg-opacity-25 border border-info border-opacity-50 text-info shadow-sm' : (darkModeStatus ? 'hover-bg-dark text-white text-opacity-75' : 'hover-bg-light text-dark text-opacity-75')}`}
                        onClick={() => toggleArea(area.id)}
                        style={{ fontSize: '0.85rem' }}
                    >
                        <div className="d-flex align-items-center flex-grow-1 overflow-hidden">
                            <Checks
                                id={`area-${area.id}`}
                                checked={isAreaSelected(area.id)}
                                onChange={() => toggleArea(area.id)}
                                className="me-2"
                            />
                            <div className="fw-bold text-truncate me-2">{area.name}</div>
                            <Button
                                color="info"
                                size="sm"
                                isLight
                                className="p-1 line-height-1 ms-auto"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    // Only check the clicked area and uncheck everything else
                                    onAreaSelectionChange([area.id]);
                                    onEditAreaWalls(area);
                                }}
                            >
                                <Icon icon="Settings" size="sm" />
                            </Button>
                        </div>
                        {/* <div style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                            {area.area_type === 'floor' ? 'Floor' : 'Zone'}
                        </div> */}
                    </div>
                ))}
            </div>

            {/* Groups Section */}
            <div>
                <div className='small fw-bold mb-2 px-2 text-info text-uppercase' style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    <Icon icon="Groups" className="me-1" /> Sensor Groups ({selectedGroupIds.length})
                </div>

                {groupsLoading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-info" role="status" />
                    </div>
                ) : (
                    <>
                        {groups?.map(group => (
                            <div
                                key={group.id}
                                className={`p-2 rounded mb-1 cursor-pointer transition-all ${isGroupSelected(group.id) ? 'bg-info bg-opacity-25 border border-info border-opacity-50 text-info shadow-sm' : (darkModeStatus ? 'hover-bg-dark text-white text-opacity-75' : 'hover-bg-light text-dark text-opacity-75')}`}
                                onClick={() => toggleGroup(group.id)}
                                style={{ fontSize: '0.85rem' }}
                            >
                                <div className="d-flex align-items-center mb-1">
                                    <Checks
                                        id={`group-${group.id}`}
                                        checked={isGroupSelected(group.id)}
                                        onChange={() => toggleGroup(group.id)}
                                        className="me-2"
                                    />
                                    <div className="fw-bold text-truncate">{group.name}</div>
                                </div>
                                <div className="d-flex gap-2" style={{ fontSize: '0.75rem', opacity: 0.6, paddingLeft: '28px' }}>
                                    {group.sensor_list?.length || 0} Sensors
                                </div>
                            </div>
                        ))}
                        {(!groups || groups.length === 0) && (
                            <div className="text-center py-3 text-muted x-small">No groups available</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AggregationFilterPanel;
