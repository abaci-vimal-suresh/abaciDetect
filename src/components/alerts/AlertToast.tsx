import React from 'react';
import { parseAlertBody } from '../../helpers/parseAlertBody';

export interface SocketAlert {
    id: number;
    type?: string;
    source?: string;
    status?: string;
    // Notification shape (new)
    title?: string;
    body?: string;
    severity?: string;       // e.g. "WARNING", "ERROR", "INFO"
    severity_display?: string;
    created_time?: string;
    is_acknowledged_by_user?: boolean;
    // Legacy sensor-alert shape
    area?: number;
    area_name?: string;
    sensor?: number;
    sensor_name?: string;
    description?: string;
    timestamp?: string;
    created_at?: string;
}

export const getSeverityConfig = (alert: SocketAlert) => {
    const sev = (alert.severity ?? '').toUpperCase();
    const t = (alert.type ?? '').toLowerCase();
    if (sev === 'ERROR' || sev === 'CRITICAL' || t.includes('critical') || t.includes('max') || alert.status === 'critical') {
        return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: '🔴' };
    }
    if (sev === 'WARNING' || t.includes('warn') || t.includes('threshold')) {
        return { label: 'WARNING', color: '#f97316', bg: 'rgba(249,115,22,0.10)', icon: '🟠' };
    }
    if (sev === 'SUCCESS') {
        return { label: 'SUCCESS', color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: '🟢' };
    }
    return { label: 'INFO', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', icon: '🔵' };
};

const fmtTime = (iso?: string) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
};

interface AlertToastProps {
    alert: SocketAlert;
}

// ─── Title Row ────────────────────────────────────────────────────────────────
export const AlertToastTitle: React.FC<AlertToastProps> = ({ alert }) => {
    const cfg = getSeverityConfig(alert);
    const displayTitle = alert.title || cfg.label;
    const timestamp = alert.created_time || alert.timestamp || alert.created_at;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{cfg.icon}</span>
            <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: cfg.color,
                background: cfg.bg,
                padding: '2px 8px',
                borderRadius: 4,
                border: `1px solid ${cfg.color}33`,
            }}>
                {displayTitle}
            </span>
            {timestamp && (
                <span style={{ fontSize: '0.72rem', opacity: 0.55, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    {fmtTime(timestamp)}
                </span>
            )}
        </div>
    );
};

// ─── Body ─────────────────────────────────────────────────────────────────────
export const AlertToastBody: React.FC<AlertToastProps> = ({ alert }) => {
    const rawBody = alert.body || alert.description || '';
    const parsed = parseAlertBody(rawBody);
    const cfg = getSeverityConfig(alert);

    const pill = (label: string, value: string, accent?: string) => (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 5, padding: '1px 7px',
            fontSize: '0.72rem', color: 'inherit',
        }}>
            <span style={{ opacity: 0.55, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {label}
            </span>
            <span style={{ fontWeight: 600, color: accent || 'inherit' }}>{value}</span>
        </span>
    );

    // If body is unparseable / legacy, fall back to raw text
    if (!parsed.area && !parsed.sensor && !parsed.value) {
        return (
            <div style={{ fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>
                {rawBody || alert.severity_display}
            </div>
        );
    }

    return (
        <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
            {/* Location row */}
            {(parsed.area || parsed.sensor) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                    {parsed.area && pill('Area', parsed.area)}
                    {parsed.sensor && pill('Sensor', parsed.sensor)}
                </div>
            )}

            {/* Event / source row */}
            {(parsed.eventSource || parsed.sourceType) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                    {parsed.eventSource && pill('Event', parsed.eventSource)}
                    {parsed.sourceType && pill('Source', parsed.sourceType)}
                    {parsed.unit && pill('Unit', parsed.unit)}
                </div>
            )}

            {/* Value vs Threshold — highlighted row */}
            {(parsed.value || parsed.threshold) && (
                <div style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    marginTop: 4, padding: '4px 8px',
                    background: `${cfg.color}18`,
                    borderLeft: `3px solid ${cfg.color}`,
                    borderRadius: '0 5px 5px 0',
                    fontSize: '0.78rem',
                }}>
                    {parsed.value && (
                        <span>
                            <span style={{ opacity: 0.55, fontSize: '0.65rem', textTransform: 'uppercase' }}>Value </span>
                            <span style={{ fontWeight: 700, color: cfg.color }}>{parsed.value}</span>
                        </span>
                    )}
                    {parsed.value && parsed.threshold && (
                        <span style={{ opacity: 0.3, fontSize: '0.75rem' }}>vs</span>
                    )}
                    {parsed.threshold && (
                        <span>
                            <span style={{ opacity: 0.55, fontSize: '0.65rem', textTransform: 'uppercase' }}>Limit </span>
                            <span style={{ fontWeight: 600 }}>{parsed.threshold}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
