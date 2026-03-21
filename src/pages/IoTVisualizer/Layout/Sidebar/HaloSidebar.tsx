import React, { useState } from 'react';
import { AreaNode } from '../../Types/types';
import styles from './HaloSidebar.module.scss';

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icons = {
    Site: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9"
                stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 3v18M3 12h18"
                stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    Building: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2"
                stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9h18M9 3v18"
                stroke="currentColor" strokeWidth="1.4" />
        </svg>
    ),
    Floor: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="8" width="18" height="10" rx="1.5"
                stroke="currentColor" strokeWidth="1.8" />
            <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"
                stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    Area: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2"
                stroke="currentColor" strokeWidth="1.8"
                strokeDasharray="3 2" />
        </svg>
    ),
    Region: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z"
                stroke="currentColor" strokeWidth="1.8" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    ChevronRight: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" />
        </svg>
    ),
    ChevronDown: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" />
        </svg>
    ),
    ImageDot: () => (
        <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" fill="#06d6a0" />
        </svg>
    ),
};

// ── Accent colors ─────────────────────────────────────────────────────────────

function getAccent(type: string): string {
    switch (type) {
        case 'Building': return '#4a90d9';
        case 'Floor': return '#7b68ee';
        case 'Area':
        case 'Sub Area': return '#48cae4';
        case 'Region': return '#f4a261';
        default: return '#8b949e';
    }
}

// ── NodeIcon ──────────────────────────────────────────────────────────────────

const NodeIcon: React.FC<{
    type: string;
    isTop?: boolean;
}> = ({ type, isTop }) => {
    if (isTop) return (
        <span style={{ color: '#8b949e' }}><Icons.Site /></span>
    );
    const color = getAccent(type);
    return (
        <span style={{ color }}>
            {type === 'Building' && <Icons.Building />}
            {type === 'Floor' && <Icons.Floor />}
            {(type === 'Area' || type === 'Sub Area') && <Icons.Area />}
            {type === 'Region' && <Icons.Region />}
        </span>
    );
};

// ── SidebarRow ────────────────────────────────────────────────────────────────

interface RowProps {
    node: AreaNode;
    depth: number;
    isSelected: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    isTop?: boolean;
    hasImage?: boolean;
    floorCount?: number;
    onClick: () => void;
}

const SidebarRow: React.FC<RowProps> = ({
    node, depth, isSelected, isExpanded,
    hasChildren, isTop, hasImage, floorCount,
    onClick,
}) => {
    const accent = getAccent(node.area_type);

    return (
        <div
            className={`${styles.row} ${isSelected ? styles.selected : ''}`}
            onClick={onClick}
            style={{
                borderLeftColor: isSelected ? accent : 'transparent',
                '--indent-padding': `${10 + depth * 16}px`,
                color: isSelected ? accent : undefined,
            } as React.CSSProperties}
        >
            {Array.from({ length: depth }).map((_, i) => (
                <div
                    key={i}
                    className={styles.indentLine}
                    style={{ left: 16 + i * 16 }}
                />
            ))}

            <span className={styles.chevron}>
                {hasChildren && (
                    isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />
                )}
            </span>

            <span className={styles.nodeIcon}>
                <NodeIcon type={node.area_type} isTop={isTop} />
            </span>

            <span className={styles.name}>
                {node.name}
            </span>

            <span className={styles.badges}>
                {floorCount !== undefined && (
                    <span className={styles.badge}>{floorCount}F</span>
                )}
                {hasImage && (
                    <span
                        className={styles.imageDot}
                        title="Floor plan uploaded"
                    >
                        <Icons.ImageDot />
                    </span>
                )}
            </span>
        </div>
    );
};

// ── Area rows under a floor ───────────────────────────────────────────────────

interface AreaTreeProps {
    areas: AreaNode[];
    depth: number;
    selectedAreaId: number | null;
    onSelectArea: (id: number) => void;
}

const AreaTree: React.FC<AreaTreeProps> = ({
    areas, depth, selectedAreaId, onSelectArea,
}) => (
    <>
        {areas.map(area => {
            const isSelected = selectedAreaId === area.id;
            const accent = getAccent(area.area_type);
            return (
                <div
                    key={area.id}
                    className={`${styles.row} ${isSelected ? styles.selected : ''}`}
                    onClick={() => onSelectArea(area.id)}
                    style={{
                        borderLeftColor: isSelected ? accent : 'transparent',
                        '--indent-padding': `${10 + depth * 16}px`,
                        color: isSelected ? accent : undefined,
                    } as React.CSSProperties}
                >
                    {Array.from({ length: depth }).map((_, i) => (
                        <div
                            key={i}
                            className={styles.indentLine}
                            style={{ left: 16 + i * 16 }}
                        />
                    ))}
                    <span className={styles.chevron} />
                    <span className={styles.nodeIcon}>
                        <NodeIcon type={area.area_type} />
                    </span>
                    <span className={styles.name}>
                        {area.name}
                    </span>
                </div>
            );
        })}
    </>
);

// ── Floor tree ────────────────────────────────────────────────────────────────

interface FloorTreeProps {
    floors: AreaNode[];
    depth: number;
    selectedFloorId: number | null;
    selectedAreaId: number | null;
    onSelectFloor: (id: number) => void;
    onSelectArea: (id: number) => void;
}

const FloorTree: React.FC<FloorTreeProps> = ({
    floors, depth,
    selectedFloorId, selectedAreaId,
    onSelectFloor, onSelectArea,
}) => {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    return (
        <>
            {floors.map(floor => {
                const isSelected = selectedFloorId === floor.id;
                const areas = (floor.children ?? []).filter(
                    c => c.area_type === 'Area' || c.area_type === 'Sub Area'
                );
                const hasChildren = areas.length > 0;
                const isOpen = !!expanded[floor.id];

                return (
                    <React.Fragment key={floor.id}>
                        <SidebarRow
                            node={floor}
                            depth={depth}
                            isSelected={isSelected}
                            isExpanded={isOpen}
                            hasChildren={hasChildren}
                            hasImage={!!floor.area_plan}
                            onClick={() => {
                                onSelectFloor(floor.id);
                                if (hasChildren) {
                                    setExpanded(s => ({
                                        ...s,
                                        [floor.id]: !s[floor.id],
                                    }));
                                }
                            }}
                        />
                        {/* Areas under floor */}
                        {hasChildren && isOpen && (
                            <AreaTree
                                areas={areas}
                                depth={depth + 1}
                                selectedAreaId={selectedAreaId}
                                onSelectArea={onSelectArea}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

// ── Building node ─────────────────────────────────────────────────────────────

interface BuildingNodeProps {
    node: AreaNode;
    depth: number;
    selectedBuildingId: number | null;
    selectedFloorId: number | null;
    selectedAreaId: number | null;
    onSelectBuilding: (id: number) => void;
    onSelectFloor: (id: number) => void;
    onSelectArea: (id: number) => void;
}

const BuildingNode: React.FC<BuildingNodeProps> = ({
    node, depth,
    selectedBuildingId, selectedFloorId, selectedAreaId,
    onSelectBuilding, onSelectFloor, onSelectArea,
}) => {
    const floors = (node.children ?? []).filter(
        c => c.area_type === 'Floor'
    );
    const isSelected = selectedBuildingId === node.id;
    const hasChildren = floors.length > 0;
    const [expanded, setExpanded] = useState(true);

    return (
        <>
            <SidebarRow
                node={node}
                depth={depth}
                isSelected={isSelected}
                isExpanded={expanded}
                hasChildren={hasChildren}
                floorCount={floors.length}
                onClick={() => {
                    onSelectBuilding(node.id);
                    if (hasChildren) setExpanded(e => !e);
                }}
            />
            {expanded && hasChildren && (
                <FloorTree
                    floors={floors}
                    depth={depth + 1}
                    selectedFloorId={selectedFloorId}
                    selectedAreaId={selectedAreaId}
                    onSelectFloor={onSelectFloor}
                    onSelectArea={onSelectArea}
                />
            )}
        </>
    );
};

// ── Root tree ─────────────────────────────────────────────────────────────────

interface RootTreeProps {
    node: AreaNode;
    selectedBuildingId: number | null;
    selectedFloorId: number | null;
    selectedAreaId: number | null;
    onSelectSite: () => void;
    onSelectBuilding: (id: number) => void;
    onSelectFloor: (id: number) => void;
    onSelectArea: (id: number) => void;
}

const RootTree: React.FC<RootTreeProps> = ({
    node,
    selectedBuildingId, selectedFloorId, selectedAreaId,
    onSelectSite, onSelectBuilding, onSelectFloor, onSelectArea,
}) => {
    const [expanded, setExpanded] = useState(true);
    const buildings = (node.children ?? []).filter(
        c => c.area_type === 'Building' || c.area_type === 'Region'
    );
    const hasChildren = buildings.length > 0;

    return (
        <>
            <SidebarRow
                node={node}
                depth={0}
                isSelected={false}
                isExpanded={expanded}
                hasChildren={hasChildren}
                isTop={true}
                onClick={() => {
                    onSelectSite();
                    if (hasChildren) setExpanded(e => !e);
                }}
            />
            {expanded && buildings.map(child => (
                child.area_type === 'Building' ? (
                    <BuildingNode
                        key={child.id}
                        node={child}
                        depth={1}
                        selectedBuildingId={selectedBuildingId}
                        selectedFloorId={selectedFloorId}
                        selectedAreaId={selectedAreaId}
                        onSelectBuilding={onSelectBuilding}
                        onSelectFloor={onSelectFloor}
                        onSelectArea={onSelectArea}
                    />
                ) : (
                    <RootTree
                        key={child.id}
                        node={child}
                        selectedBuildingId={selectedBuildingId}
                        selectedFloorId={selectedFloorId}
                        selectedAreaId={selectedAreaId}
                        onSelectSite={onSelectSite}
                        onSelectBuilding={onSelectBuilding}
                        onSelectFloor={onSelectFloor}
                        onSelectArea={onSelectArea}
                    />
                )
            ))}
        </>
    );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface HaloSidebarProps {
    root: AreaNode;
    selectedBuildingId: number | null;
    selectedFloorId: number | null;
    selectedAreaId: number | null;
    onSelectSite: () => void;
    onSelectBuilding: (id: number) => void;
    onSelectFloor: (id: number) => void;
    onSelectArea: (id: number) => void;
}

const HaloSidebar: React.FC<HaloSidebarProps> = ({
    root,
    selectedBuildingId, selectedFloorId, selectedAreaId,
    onSelectSite, onSelectBuilding, onSelectFloor, onSelectArea,
}) => (
    <div className={styles.sidebar}>
        <div className={styles.header}>
            <span className={styles.headerTitle}>Area Explorer</span>
        </div>
        <div className={styles.body}>
            <RootTree
                node={root}
                selectedBuildingId={selectedBuildingId}
                selectedFloorId={selectedFloorId}
                selectedAreaId={selectedAreaId}
                onSelectSite={onSelectSite}
                onSelectBuilding={onSelectBuilding}
                onSelectFloor={onSelectFloor}
                onSelectArea={onSelectArea}
            />
        </div>
        <div className={styles.footer}>
            <button className={styles.manageBtn}>+ Manage Areas</button>
        </div>
    </div>
);

export default HaloSidebar;