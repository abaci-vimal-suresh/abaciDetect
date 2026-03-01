import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import Icon from '../../../../../components/icon/Icon';

const FilterGroupNode = ({ data, selected, id }: any) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Get the nested filters from data
    const memberFilters: any[] = data.alert_filters || [];
    const totalRules = (data.alert_filter_ids || data.alert_filters || []).length;

    // Health computations
    const deadCount = memberFilters.filter(
        (f: any) => !f.actions || f.actions.length === 0
    ).length;

    const now = new Date();
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const silentCount = memberFilters.filter((f: any) => {
        const hasWeekdaySchedule = f.weekdays && f.weekdays.length > 0 && f.weekdays.length < 7;
        const isWrongDay = hasWeekdaySchedule && !f.weekdays.includes(currentDay);
        const isOutsideTime = f.start_time && f.end_time &&
            (currentTime < f.start_time || currentTime > f.end_time);
        return isWrongDay || isOutsideTime;
    }).length;

    const isFullyHealthy = deadCount === 0 && silentCount === 0;

    const handleCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = !isCollapsed;
        setIsCollapsed(next);
        // Call parent callback if provided
        if (data.onCollapse && data.id) {
            data.onCollapse(data.id, next);
        }
    };

    return (
        <div className="group-node-card" style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)',
            border: '2px solid #4a90d9',
            borderRadius: 12,
            color: 'white',
            boxShadow: '0 4px 16px rgba(30, 58, 95, 0.4)',
            position: 'relative',
        }}>
            {isCollapsed ? (
                /* COLLAPSED VIEW */
                <div className="group-node-collapsed">
                    <div className="group-node-collapsed-header">
                        <Icon icon="Folder" style={{ color: '#ffd700', fontSize: '1rem' }} />
                        <span className="group-node-collapsed-name">{data.name}</span>
                        <span className="group-node-collapsed-count">{totalRules}</span>
                        <button
                            className="group-node-toggle-btn"
                            onClick={handleCollapse}
                            title="Expand group"
                        >
                            <Icon icon="ExpandMore" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }} />
                        </button>
                    </div>
                    {/* Health mini pills */}
                    <div className="group-node-health-row" style={{ padding: '4px 10px 8px 22px' }}>
                        {isFullyHealthy ? (
                            <span className="group-node-health-item healthy">✅ Healthy</span>
                        ) : (
                            <>
                                {deadCount > 0 && <span className="group-node-health-item dead">⚠️ {deadCount} dead</span>}
                                {silentCount > 0 && <span className="group-node-health-item silent">🔇 {silentCount} silent</span>}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                /* EXPANDED VIEW */
                <div className="group-node-expanded">
                    <div className="group-node-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <Icon icon="Folder" style={{ color: '#ffd700', fontSize: '1.2rem' }} />
                            <span className="group-node-name">{data.name}</span>
                        </div>
                        {/* Collapse button */}
                        <button
                            className="group-node-toggle-btn"
                            onClick={handleCollapse}
                            title="Collapse group"
                        >
                            <Icon icon="ExpandLess" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }} />
                        </button>
                    </div>

                    <div className="group-node-body">
                        <div className="group-node-count-badge">
                            {totalRules} {totalRules === 1 ? 'rule' : 'rules'}
                        </div>

                        <div className="group-node-health-row">
                            {isFullyHealthy ? (
                                <span className="group-node-health-item healthy">
                                    ✅ All rules healthy
                                </span>
                            ) : (
                                <>
                                    {deadCount > 0 && (
                                        <span className="group-node-health-item dead">
                                            ⚠️ {deadCount} dead
                                        </span>
                                    )}
                                    {silentCount > 0 && (
                                        <span className="group-node-health-item silent">
                                            🔇 {silentCount} silent
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {data.description && (
                            <div className="group-node-description">
                                {data.description}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default memo(FilterGroupNode);
