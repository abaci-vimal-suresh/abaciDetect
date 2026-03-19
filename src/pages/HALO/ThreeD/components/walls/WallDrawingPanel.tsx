import React from 'react';

export interface WallDrawSettings {
    drawingMode: 'straight' | 'arc';
    height: number;
    thickness: number;
    color: string;
    opacity: number;
}

export interface WallDrawingControlsProps {
    settings: WallDrawSettings;
    onSettingsChange: (partial: Partial<WallDrawSettings>) => void;
    pointCount: number;
    committedWallCount: number;
    arcBufferCount: number;
    onFinish: () => void;
    onCancel: () => void;
    onUndo: () => void;
    onClear: () => void;
    subAreas?: Array<{ id: number; name: string }>;
    targetAreaId?: number | null;
    onTargetAreaChange?: (id: number | null) => void;
    darkModeStatus?: boolean;
    isSidebar?: boolean;
}

export const WallDrawingControls: React.FC<WallDrawingControlsProps> = ({
    settings,
    onSettingsChange,
    pointCount,
    committedWallCount,
    arcBufferCount,
    onFinish,
    onCancel,
    onUndo,
    onClear,
    subAreas = [],
    targetAreaId,
    onTargetAreaChange,
    darkModeStatus,
    isSidebar = false,
}) => {
    const bgColor = darkModeStatus
        ? 'rgba(15,23,42,0.92)'
        : 'rgba(255,255,255,0.92)';
    const borderColor = darkModeStatus
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(0,0,0,0.12)';
    const textColor = darkModeStatus ? '#e2e8f0' : '#1e293b';
    const mutedColor = darkModeStatus
        ? 'rgba(255,255,255,0.45)'
        : 'rgba(0,0,0,0.45)';

    const getStatusMessage = () => {
        if (!settings) return 'Initializing...';
        if (settings.drawingMode === 'arc') {
            if (arcBufferCount === 0 && pointCount === 0)
                return 'Click to place arc start point';
            if (arcBufferCount === 0 && pointCount > 0)
                return 'Click arc start (chains from last)';
            if (arcBufferCount === 1)
                return 'Click arc END point';
            if (arcBufferCount === 2)
                return 'Click any point ON the curve';
            return 'Arc captured';
        }
        if (pointCount === 0) return 'Click to place first point';
        if (pointCount === 1) return 'Click next point to start a wall';
        return `${committedWallCount} wall${committedWallCount !== 1 ? 's' : ''} drawn — click near start to close`;
    };

    const inputStyle: React.CSSProperties = {
        width: '44px',
        fontSize: '11px',
        padding: '3px 4px',
        borderRadius: '4px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        color: textColor,
        textAlign: 'center',
    };

    const labelStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: mutedColor,
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isSidebar ? '12px' : '0',
            color: textColor,
        }}>
            {/* Header row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: isSidebar ? '0' : '10px',
            }}>
                <div style={{ display: 'flex', alignItems: isSidebar ? 'flex-start' : 'center', gap: '8px', flexDirection: isSidebar ? 'column' : 'row' }}>
                    <span style={{ fontSize: isSidebar ? '12px' : '13px', fontWeight: 600 }}>
                        Wall Drawing
                    </span>
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        background: settings?.drawingMode === 'arc'
                            ? 'rgba(72,202,228,0.15)'
                            : 'rgba(240,192,64,0.15)',
                        color: settings?.drawingMode === 'arc' ? '#48cae4' : '#f0c040',
                        border: `1px solid ${settings?.drawingMode === 'arc'
                            ? 'rgba(72,202,228,0.4)'
                            : 'rgba(240,192,64,0.4)'}`,
                    }}>
                        {getStatusMessage()}
                    </span>
                </div>
                {!isSidebar && (
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: mutedColor,
                            fontSize: '16px',
                            lineHeight: 1,
                            padding: '0 4px',
                        }}
                        title="Cancel (ESC)"
                    >✕</button>
                )}
            </div>

            {/* Controls row */}
            <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}>
                {/* Mode toggle */}
                <div style={{
                    display: 'flex',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: `1px solid ${borderColor}`,
                    width: isSidebar ? '100%' : 'auto',
                }}>
                    {(['straight', 'arc'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => onSettingsChange({ drawingMode: mode })}
                            style={{
                                flex: isSidebar ? 1 : 'none',
                                padding: '4px 10px',
                                fontSize: '11px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: settings?.drawingMode === mode ? 600 : 400,
                                background: settings?.drawingMode === mode
                                    ? (darkModeStatus
                                        ? 'rgba(255,255,255,0.15)'
                                        : 'rgba(0,0,0,0.08)')
                                    : 'transparent',
                                color: settings?.drawingMode === mode ? textColor : mutedColor,
                            }}
                        >
                            {mode === 'straight' ? '━ Straight' : '〜 Arc'}
                        </button>
                    ))}
                </div>

                {/* Height */}
                <div style={{ display: 'flex', gap: '8px', width: isSidebar ? '100%' : 'auto', justifyContent: isSidebar ? 'space-between' : 'flex-start' }}>
                    <label style={labelStyle}>
                        H
                        <input
                            type="number"
                            step={0.1}
                            min={0.1}
                            value={settings?.height}
                            onChange={e => onSettingsChange({
                                height: parseFloat(e.target.value) || 2.4,
                            })}
                            style={inputStyle}
                        />m
                    </label>

                    {/* Thickness */}
                    <label style={labelStyle}>
                        T
                        <input
                            type="number"
                            step={0.05}
                            min={0.05}
                            value={settings?.thickness}
                            onChange={e => onSettingsChange({
                                thickness: parseFloat(e.target.value) || 0.15,
                            })}
                            style={inputStyle}
                        />m
                    </label>

                    {/* Color */}
                    <input
                        type="color"
                        value={settings?.color}
                        onChange={e => onSettingsChange({ color: e.target.value })}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            border: `1px solid ${borderColor}`,
                            padding: '1px',
                            cursor: 'pointer',
                            background: 'none',
                        }}
                        title="Wall color"
                    />
                </div>

                {/* Opacity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isSidebar ? '100%' : 'auto' }}>
                    <span style={{ fontSize: '10px', color: mutedColor }}>Opacity</span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={settings?.opacity}
                        onChange={e => onSettingsChange({
                            opacity: parseFloat(e.target.value),
                        })}
                        style={{ flex: isSidebar ? 1 : 'none', width: isSidebar ? 'auto' : '60px', cursor: 'pointer' }}
                        title={`Opacity: ${Math.round((settings?.opacity || 0) * 100)}%`}
                    />
                </div>

                {subAreas.length > 0 && (
                    <select
                        value={targetAreaId ?? ''}
                        onChange={e => onTargetAreaChange?.(
                            e.target.value ? parseInt(e.target.value) : null
                        )}
                        style={{
                            width: isSidebar ? '100%' : 'auto',
                            fontSize: '11px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: `1px solid ${borderColor}`,
                            background: bgColor,
                            color: textColor,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="">No Area</option>
                        {subAreas.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                )}

                {/* Action buttons */}
                <div style={{ marginLeft: isSidebar ? '0' : 'auto', display: 'flex', gap: '6px', width: isSidebar ? '100%' : 'auto', marginTop: isSidebar ? '8px' : '0' }}>
                    <button
                        onClick={onUndo}
                        disabled={committedWallCount === 0}
                        style={{
                            flex: isSidebar ? 1 : 'none',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${borderColor}`,
                            background: 'transparent',
                            color: committedWallCount === 0 ? mutedColor : textColor,
                            cursor: committedWallCount === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >↩ Undo</button>
                    <button
                        onClick={onClear}
                        disabled={committedWallCount === 0}
                        style={{
                            flex: isSidebar ? 1 : 'none',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239,68,68,0.4)',
                            background: 'transparent',
                            color: committedWallCount === 0 ? mutedColor : 'rgba(239,68,68,0.8)',
                            cursor: committedWallCount === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >✕ Clear</button>
                    <button
                        onClick={onFinish}
                        disabled={committedWallCount === 0}
                        style={{
                            flex: isSidebar ? 2 : 'none',
                            fontSize: '11px',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: committedWallCount === 0
                                ? (darkModeStatus ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                                : '#3b82f6',
                            color: committedWallCount === 0 ? mutedColor : '#ffffff',
                            cursor: committedWallCount === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        💾 Save {committedWallCount > 0 && !isSidebar
                            ? `${committedWallCount} wall${committedWallCount !== 1 ? 's' : ''}`
                            : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

const WallDrawingPanel: React.FC<WallDrawingControlsProps> = (props) => {
    const { darkModeStatus } = props;
    const bgColor = darkModeStatus
        ? 'rgba(15,23,42,0.92)'
        : 'rgba(255,255,255,0.92)';
    const borderColor = darkModeStatus
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(0,0,0,0.12)';

    return (
        <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: '12px 16px',
            minWidth: '480px',
            maxWidth: '600px',
            pointerEvents: 'auto',
        }}>
            <WallDrawingControls {...props} />
        </div>
    );
};

export default WallDrawingPanel;
