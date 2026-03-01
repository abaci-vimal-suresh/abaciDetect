import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import Icon from '../../../../../components/icon/Icon';
import { ALERT_TYPE_CHOICES } from '../../../../../types/sensor';

const FilterNode = ({ data, selected, id }: any) => {
    const alertTypes = data.alert_types || [];
    const isDead = !data.actions || data.actions.length === 0;
    const isInactive = data.is_active === false;

    // --- Schedule display ---
    const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const isAllDays = !data.weekdays || data.weekdays.length === 7;
    const hasSchedule = data.weekdays && data.weekdays.length > 0 && !isAllDays;
    const hasTimeRange = data.start_time || data.end_time;

    const scheduleText = isAllDays
        ? 'All Days'
        : data.weekdays.map((d: number) => DAY_LABELS[d]).join(' · ');

    const timeText = (data.start_time && data.end_time)
        ? `${data.start_time} – ${data.end_time}`
        : data.start_time
            ? `From ${data.start_time}`
            : data.end_time
                ? `Until ${data.end_time}`
                : '';

    // --- Silent detection ---
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const isSilentNow = data.weekdays &&
        data.weekdays.length > 0 &&
        data.weekdays.length < 7 &&
        !data.weekdays.includes(currentDay);

    const isTimeRestricted = data.start_time && data.end_time &&
        (currentTime < data.start_time || currentTime > data.end_time);

    const showSilentBadge = isSilentNow || isTimeRestricted;

    // --- Area display ---
    const areaText = data.area_list?.length > 0
        ? data.area_list.map((a: any) => a.name).join(', ')
        : data.area_ids?.length > 0
            ? `${data.area_ids.length} area(s)`
            : 'All Areas';

    // --- Conditions ---
    const conditions = [];
    if (data.action_for_max) conditions.push('Over Max');
    if (data.action_for_min) conditions.push('Under Min');
    const conditionText = conditions.length > 0 ? conditions.join(' · ') : 'Threshold';

    const healthColor = isInactive ? '#6c757d' : isDead ? '#dc3545' : '#198754';
    const healthTitle = isInactive ? 'Inactive' : isDead ? 'No actions linked — will fire silently' : 'Healthy';

    return (
        <div className="filter-node-card" style={{
            borderLeft: `3px solid ${healthColor}`,
            opacity: isInactive ? 0.7 : 1,
            position: 'relative'
        }}>
            {/* Input Summary Strip */}
            <div className="filter-node-input-strip">
                <div className="filter-node-input-row">
                    <span className="filter-node-input-icon">🕐</span>
                    <span className="filter-node-input-text">
                        {scheduleText}
                        {timeText && ` · ${timeText}`}
                    </span>
                    {showSilentBadge && (
                        <span className="filter-node-silent-badge">🔇 Silent Now</span>
                    )}
                </div>
                <div className="filter-node-input-row">
                    <span className="filter-node-input-icon">📍</span>
                    <span className="filter-node-input-text">{areaText}</span>
                </div>
                {conditions.length > 0 && (
                    <div className="filter-node-input-row">
                        <span className="filter-node-input-icon">⚡</span>
                        <span className="filter-node-input-text">{conditionText}</span>
                    </div>
                )}
            </div>

            <div className="filter-node-header">
                <Icon icon="FilterAlt" style={{ color: '#0d6efd' }} />
                <span className="filter-node-name text-truncate" title={data.name}>
                    {data.name || 'Filter Rule'}
                </span>
                <div
                    title={healthTitle}
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: healthColor,
                        border: '2px solid white',
                        boxShadow: `0 0 0 1px ${healthColor}`,
                        flexShrink: 0
                    }}
                />
            </div>

            <div className="filter-node-body">
                <div className="filter-node-area text-truncate" title={areaText}>
                    <Icon icon="Place" size="sm" className="me-1" style={{ fontSize: '0.8rem' }} />
                    {areaText}
                </div>
            </div>

            <div className="filter-node-footer">
                <span>ID: {data.id}</span>
                <span>{data.actions?.length || 0} actions</span>
            </div>

            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default memo(FilterNode);
