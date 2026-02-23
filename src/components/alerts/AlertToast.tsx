import React from 'react';

export interface SocketAlert {
    id: number;
    type: string;
    source: string;
    status: string;
    area?: number;
    area_name?: string;
    sensor?: number;
    sensor_name?: string;
    description?: string;
    timestamp?: string;
    created_at?: string;
}

// Severity colour derived from alert type / status
export const getSeverityConfig = (alert: SocketAlert) => {
    const t = alert.type?.toLowerCase() || '';
    if (t.includes('critical') || t.includes('max') || alert.status === 'critical') {
        return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🔴' };
    }
    if (t.includes('warn') || t.includes('threshold')) {
        return { label: 'WARNING', color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: '🟠' };
    }
    return { label: 'ALERT', color: '#a7810eff', bg: 'rgba(234,179,8,0.12)', icon: '🟡' };
};

const fmt = (iso?: string) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return '';
    }
};

interface AlertToastProps {
    alert: SocketAlert;
}

export const AlertToastTitle: React.FC<AlertToastProps> = ({ alert }) => {
    const cfg = getSeverityConfig(alert);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{cfg.icon}</span>
            <span
                style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    color: cfg.color,
                    background: cfg.bg,
                    padding: '2px 7px',
                    borderRadius: 4,
                    border: `1px solid ${cfg.color}44`,
                }}
            >
                {cfg.label}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: 'auto' }}>
                {fmt(alert.timestamp || alert.created_at)}
            </span>
        </div>
    );
};

export const AlertToastBody: React.FC<AlertToastProps> = ({ alert }) => {
    return (
        <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
            {/* Description */}
            {alert.description && (
                <div style={{ marginBottom: 6, fontWeight: 500 }}>
                    {alert.description}
                </div>
            )}
            {/* Sensor / Area row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', opacity: 0.8 }}>
                {alert.sensor_name && (
                    <span>
                        <span style={{ opacity: 0.6, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sensor  </span>
                        <b>{alert.sensor_name}</b>
                    </span>
                )}
                {alert.area_name && (
                    <span>
                        <span style={{ opacity: 0.6, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Area  </span>
                        <b>{alert.area_name}</b>
                    </span>
                )}
                {alert.source && (
                    <span>
                        <span style={{ opacity: 0.6, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Source  </span>
                        <b>{alert.source}</b>
                    </span>
                )}
            </div>
        </div>
    );
};
