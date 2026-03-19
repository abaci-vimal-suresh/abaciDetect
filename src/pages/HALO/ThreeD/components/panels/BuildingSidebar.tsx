import React, { useState, useMemo } from 'react';
import Icon from '../../../../../components/icon/Icon';
import useDarkMode from '../../../../../hooks/useDarkMode';

interface BuildingSidebarProps {
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    areas: any[];
    allAreas: any[]; // ALL areas from API (unfiltered)
    selectedAreaIds: (number | string)[];
    onAreaSelectionChange: (ids: (number | string)[]) => void;
    onEditAreaWalls: (area: any) => void;
    onShowAllAreas: () => void;
    onBuildingClick?: (building: any) => void;
    setShowSettingsOverlay: (show: boolean) => void;
    setEditingAreaForWalls: (area: any) => void;
    setActiveMetricGroup: (group: any) => void;
    setSelectedSensorId: (id: number | string | null) => void;
    darkModeStatus: boolean;
    isLoading: boolean;
}

const BuildingSidebar: React.FC<BuildingSidebarProps> = ({
    showSidebar,
    setShowSidebar,
    areas,
    allAreas,
    selectedAreaIds,
    onAreaSelectionChange,
    onEditAreaWalls,
    onShowAllAreas,
    onBuildingClick,
    setShowSettingsOverlay,
    setEditingAreaForWalls,
    setActiveMetricGroup,
    setSelectedSensorId,
    darkModeStatus,
    isLoading
}) => {
    const [collapsedBuildings, setCollapsedBuildings] = useState<Set<number>>(new Set());

    // Build a hierarchy: group floors under their parent building
    const buildingHierarchy = useMemo(() => {
        // Use allAreas for hierarchy building so we see ALL buildings
        const sourceAreas = allAreas.length > 0 ? allAreas : areas;

        // Find all buildings (parent_id null and area_type = building)
        const buildings = sourceAreas.filter(a =>
            a.area_type === 'building' && (a.parent_id === null || a.parent_id === undefined)
        );

        // Find orphan floors (floors not under any building)
        const allBuildingSubareaIds = new Set<number>();
        buildings.forEach(b => {
            (b.subareas || []).forEach((sid: number) => allBuildingSubareaIds.add(sid));
        });

        const orphanFloors = sourceAreas.filter(a =>
            (a.area_type === 'floor' || a.area_type === 'room') &&
            !allBuildingSubareaIds.has(a.id) &&
            !buildings.find(b => b.id === a.parent_id)
        );

        // Map buildings to their floors
        const result = buildings.map(building => {
            // Get subareas from the area object or by parent_id lookup
            const floors = sourceAreas.filter(a =>
                (a.area_type === 'floor' || a.area_type === 'room') &&
                (
                    (building.subareas || []).includes(a.id) ||
                    a.parent_id === building.id
                )
            );
            return { building, floors };
        });

        // Add orphan floors as a pseudo-building if any exist
        if (orphanFloors.length > 0) {
            result.push({
                building: { id: -1, name: 'Other Areas', area_type: 'building' },
                floors: orphanFloors
            });
        }

        return result;
    }, [allAreas, areas]);

    const toggleBuilding = (buildingId: number) => {
        setCollapsedBuildings(prev => {
            const next = new Set(prev);
            if (next.has(buildingId)) next.delete(buildingId);
            else next.add(buildingId);
            return next;
        });
    };

    const toggleFloor = (floorId: number | string) => {
        const numId = Number(floorId);
        const newIds = selectedAreaIds.includes(numId)
            ? selectedAreaIds.filter(i => Number(i) !== numId)
            : [...selectedAreaIds, numId];
        onAreaSelectionChange(newIds);
    };

    const toggleBuildingFloors = (floors: any[]) => {
        const floorIds = floors.map(f => f.id);
        const allSelected = floorIds.every(id => selectedAreaIds.includes(Number(id)));
        if (allSelected) {
            // deselect all floors of this building
            onAreaSelectionChange(selectedAreaIds.filter(id => !floorIds.includes(Number(id))));
        } else {
            // select all floors of this building
            const newIds = Array.from(new Set([...selectedAreaIds, ...floorIds.map(Number)]));
            onAreaSelectionChange(newIds);
        }
    };

    const isFloorSelected = (id: number | string) => selectedAreaIds.includes(Number(id));

    const isBuildingPartiallySelected = (floors: any[]) => {
        if (floors.length === 0) return false;
        const selected = floors.filter(f => isFloorSelected(f.id));
        return selected.length > 0 && selected.length < floors.length;
    };

    const isBuildingFullySelected = (floors: any[]) => {
        if (floors.length === 0) return false;
        return floors.every(f => isFloorSelected(f.id));
    };

    const totalFloors = buildingHierarchy.reduce((sum, g) => sum + g.floors.length, 0);

    if (!showSidebar) return null;

    return (
        <div
            className='position-absolute start-0 top-0 h-100'
            style={{
                width: '230px',
                zIndex: 1100,
                pointerEvents: 'auto',
                animation: 'slide-in-left 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            <style>{`
                @keyframes slide-in-left {
                    from { transform: translateX(-100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .sidebar-glass {
                    backdrop-filter: blur(28px) saturate(210%);
                    background: ${darkModeStatus
                        ? 'rgba(13, 20, 41, 0.78)'
                        : 'rgba(255, 255, 255, 0.78)'};
                    border-right: 1px solid ${darkModeStatus
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.1)'};
                    box-shadow: 10px 0 50px rgba(0,0,0,0.3);
                }
                .sb-row:hover { 
                    background: ${darkModeStatus ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; 
                    transform: translateX(2px);
                }
                .sb-row { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 8px; }
                .sb-floor-row:hover { 
                    background: ${darkModeStatus ? 'rgba(74,144,217,0.12)' : 'rgba(74,144,217,0.08)'};
                    transform: translateX(4px);
                }
                .sb-floor-row { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 6px; }
                .sb-selected-floor { 
                    background: ${darkModeStatus
                        ? 'rgba(74,144,217,0.22)'
                        : 'rgba(74,144,217,0.15)'} !important;
                    box-shadow: inset 3px 0 0 #4a90d9;
                }
                .scrollbar-hidden::-webkit-scrollbar { display: none; }
                .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
                .sb-checkbox {
                    width: 14px; height: 14px;
                    border-radius: 3px;
                    border: 1.5px solid ${darkModeStatus ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }
                .sb-checkbox.checked {
                    background: #4a90d9;
                    border-color: #4a90d9;
                }
                .sb-checkbox.partial {
                    background: rgba(74,144,217,0.4);
                    border-color: #4a90d9;
                }
                .sb-edit-btn {
                    opacity: 0;
                    transition: opacity 0.15s;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 4px;
                    color: ${darkModeStatus ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'};
                    line-height: 1;
                }
                .sb-floor-row:hover .sb-edit-btn { opacity: 1; }
                .sb-edit-btn:hover { 
                    background: ${darkModeStatus ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
                    color: #4a90d9;
                }
            `}</style>

            <div className='sidebar-glass h-100 d-flex flex-column'>
                {/* Header */}
                <div className='px-3 py-2 border-bottom' style={{
                    borderColor: darkModeStatus ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    flexShrink: 0
                }}>
                    <div className='d-flex align-items-center justify-content-between mb-1'>
                        <div className='d-flex align-items-center gap-2'>
                            <Icon icon='Domain' style={{ fontSize: 16, color: '#4a90d9' }} />
                            <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#4a90d9'
                            }}>
                                Area Explorer
                            </span>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: darkModeStatus ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                                padding: '2px', lineHeight: 1
                            }}
                            title='Close sidebar'
                        >
                            <Icon icon='Close' style={{ fontSize: 14 }} />
                        </button>
                    </div>

                    <div className='d-flex align-items-center justify-content-between'>
                        <span style={{
                            fontSize: '0.7rem',
                            color: darkModeStatus ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'
                        }}>
                            {selectedAreaIds.length}/{totalFloors} selected
                        </span>
                        <button
                            onClick={onShowAllAreas}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '0.68rem', fontWeight: 600,
                                color: '#4a90d9', padding: '0'
                            }}
                        >
                            SHOW ALL
                        </button>
                    </div>
                </div>

                {/* Building list */}
                <div className='flex-grow-1 overflow-auto scrollbar-hidden px-2 py-2'>
                    {isLoading && (
                        <div className='text-center py-4'>
                            <div className='spinner-border spinner-border-sm' style={{ color: '#4a90d9' }} />
                        </div>
                    )}

                    {!isLoading && buildingHierarchy.length === 0 && (
                        <div className='text-center py-4' style={{
                            fontSize: '0.75rem',
                            color: darkModeStatus ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                        }}>
                            No areas found
                        </div>
                    )}

                    {buildingHierarchy.map(({ building, floors }) => {
                        const isCollapsed = collapsedBuildings.has(building.id);
                        const fullySelected = isBuildingFullySelected(floors);
                        const partiallySelected = !fullySelected && isBuildingPartiallySelected(floors);

                        return (
                            <div key={building.id} className='mb-1'>
                                {/* Building header row */}
                                <div
                                    className='sb-row d-flex align-items-center gap-1 px-1 py-1 cursor-pointer'
                                    style={{ marginBottom: '2px' }}
                                >
                                    {/* Expand/collapse arrow */}
                                    <button
                                        onClick={() => toggleBuilding(building.id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: '1px 2px', lineHeight: 1,
                                            color: darkModeStatus ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Icon icon='ExpandMore' style={{ fontSize: 14 }} />
                                    </button>

                                    {/* Building check */}
                                    <div
                                        className={`sb-checkbox ${fullySelected ? 'checked' : partiallySelected ? 'partial' : ''}`}
                                        onClick={() => toggleBuildingFloors(floors)}
                                        title={fullySelected ? 'Deselect all floors' : 'Select all floors'}
                                    >
                                        {(fullySelected || partiallySelected) && (
                                            <svg width='8' height='8' viewBox='0 0 8 8'>
                                                {fullySelected
                                                    ? <polyline points='1,4 3,6 7,2' stroke='white' strokeWidth='1.5' fill='none' />
                                                    : <line x1='1' y1='4' x2='7' y2='4' stroke='white' strokeWidth='1.5' />
                                                }
                                            </svg>
                                        )}
                                    </div>

                                    {/* Building icon + name */}
                                    <div
                                        className='d-flex align-items-center gap-1 flex-grow-1 overflow-hidden'
                                        onClick={() => {
                                            toggleBuilding(building.id);
                                            onBuildingClick?.(building);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Icon icon='Domain' style={{
                                            fontSize: 14,
                                            color: '#4a90d9',
                                            flexShrink: 0
                                        }} />
                                        <span style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            color: darkModeStatus ? '#e2e8f0' : '#1a202c',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {building.name}
                                        </span>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            color: darkModeStatus ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
                                            flexShrink: 0,
                                            marginLeft: 'auto',
                                            paddingRight: '2px'
                                        }}>
                                            {floors.length}F
                                        </span>
                                    </div>
                                </div>

                                {/* Floors under this building */}
                                {!isCollapsed && (
                                    <div style={{ paddingLeft: '20px' }}>
                                        {floors.length === 0 && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 8px',
                                                color: darkModeStatus ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                                                fontStyle: 'italic'
                                            }}>
                                                No floors
                                            </div>
                                        )}
                                        {floors.map(floor => {
                                            const selected = isFloorSelected(floor.id);
                                            return (
                                                <div
                                                    key={floor.id}
                                                    className={`sb-floor-row d-flex align-items-center gap-1 px-2 py-1 mb-px ${selected ? 'sb-selected-floor' : ''}`}
                                                    style={{ marginBottom: '1px', position: 'relative' }}
                                                    onClick={() => toggleFloor(floor.id)}
                                                >
                                                    {/* Floor checkbox */}
                                                    <div
                                                        className={`sb-checkbox ${selected ? 'checked' : ''}`}
                                                        style={{ marginRight: '2px' }}
                                                    >
                                                        {selected && (
                                                            <svg width='8' height='8' viewBox='0 0 8 8'>
                                                                <polyline points='1,4 3,6 7,2' stroke='white' strokeWidth='1.5' fill='none' />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Floor icon */}
                                                    <Icon icon='Layers' style={{
                                                        fontSize: 11,
                                                        color: selected ? '#4a90d9' : (darkModeStatus ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
                                                        flexShrink: 0
                                                    }} />

                                                    {/* Floor name */}
                                                    <span style={{
                                                        fontSize: '0.78rem',
                                                        fontWeight: selected ? 600 : 400,
                                                        color: selected ? '#4a90d9' : (darkModeStatus ? '#cbd5e0' : '#2d3748'),
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        flexGrow: 1
                                                    }}>
                                                        {floor.name}
                                                    </span>

                                                    {/* Edit walls button */}
                                                    <button
                                                        className='sb-edit-btn'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAreaSelectionChange([floor.id]);
                                                            onEditAreaWalls(floor);
                                                        }}
                                                        title='Edit area walls'
                                                    >
                                                        <Icon icon='Settings' style={{ fontSize: 11 }} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer info */}
                <div className='px-3 py-2 border-top' style={{
                    borderColor: darkModeStatus ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    flexShrink: 0
                }}>
                    <div style={{
                        fontSize: '0.65rem',
                        color: darkModeStatus ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                        textAlign: 'center'
                    }}>
                        {buildingHierarchy.length} building{buildingHierarchy.length !== 1 ? 's' : ''} · {totalFloors} floor{totalFloors !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildingSidebar;
