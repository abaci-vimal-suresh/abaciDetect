import React, { useState, useRef } from 'react';
import { AreaNode, AreaWall, SensorHalo, SensorNode } from '../Types/types';
import styles from './HaloRightPanel.module.scss';
import { UseWallDrawingReturn } from '../Hooks/useWallDrawing';
import SensorDetailPanel from './SensorDetailPanel';
import SensorPlacementPanel from './SensorPlacementPanel';
import { PendingSensor } from '../Hooks/useSensorPlacement';
import AggregatedDetailPanel from './AggregatedDetailPanel';

export type RightPanelMode =
    | 'wall_draw'
    | 'image_upload'
    | 'sensor_place'
    | 'sensor_detail'
    | 'sensor_placement'
    | 'aggregated_detail'
    | null;

// ── Panel header icons ────────────────────────────────────────────────────────

const PanelIcons = {
    Wall: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2"
                stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9h18M3 15h18M9 9v6M15 9v6"
                stroke="currentColor" strokeWidth="1.4" />
        </svg>
    ),
    Image: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2"
                stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M3 16l5-5 4 4 3-3 6 6"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    Sensor: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M3.5 3.5a15 15 0 0 0 0 17M20.5 3.5a15 15 0 0 1 0 17"
                stroke="currentColor" strokeWidth="1.4"
                strokeLinecap="round" opacity="0.4" />
        </svg>
    ),
    Close: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Trash: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    ),
    Undo: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M9 14H4V9" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 14a9 9 0 1 1 2.5 6.2"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Check: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    ),
};

// ── Section wrapper ───────────────────────────────────────────────────────────

const Section: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => (
    <div className={styles.section}>
        <div className={styles.sectionTitle}>{title}</div>
        {children}
    </div>
);

// ── Row ───────────────────────────────────────────────────────────────────────

const FieldRow: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>{label}</span>
        <div className={styles.fieldControl}>{children}</div>
    </div>
);

// ────────────────────────────────────────────────────────────────────────────
// WALL DRAW PANEL
// ────────────────────────────────────────────────────────────────────────────

const WallDrawPanel: React.FC<{
    drawing: UseWallDrawingReturn;
    onSaveWalls: () => void;
}> = ({ drawing, onSaveWalls }) => {
    const {
        drawingMode, setDrawingMode,
        settings, updateSettings,
        anchorPoints, drawnWalls,
        isShapeClosed,
        finishDrawing, cancelDrawing,
        removeLastWall, clearAll,
    } = drawing;

    return (
        <div className={styles.panelBody}>

            {/* Mode toggle */}
            <Section title="Shape Mode">
                <div className={styles.modeToggle}>
                    {(['straight', 'arc'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setDrawingMode(mode)}
                            className={`${styles.modeBtn}
                                ${drawingMode === mode ? styles.modeBtnActive : ''}`}
                        >
                            {mode === 'straight' ? '━ Straight' : '〜 Arc'}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Wall type */}
            <Section title="Wall Settings">
                <FieldRow label="Type">
                    <select
                        className={styles.select}
                        value={settings.wall_type}
                        onChange={e =>
                            updateSettings({
                                wall_type: e.target.value as any,
                            })
                        }
                    >
                        <option value="outer">Outer</option>
                        <option value="partition">Partition</option>
                        <option value="glass">Glass</option>
                    </select>
                </FieldRow>

                <FieldRow label="Height (m)">
                    <input
                        type="number"
                        className={styles.input}
                        value={settings.height}
                        step={0.1}
                        min={0.1}
                        onChange={e =>
                            updateSettings({
                                height: parseFloat(e.target.value) || 0,
                            })
                        }
                    />
                </FieldRow>

                <FieldRow label="Thickness (m)">
                    <input
                        type="number"
                        className={styles.input}
                        value={settings.thickness}
                        step={0.05}
                        min={0.05}
                        onChange={e =>
                            updateSettings({
                                thickness: parseFloat(e.target.value) || 0,
                            })
                        }
                    />
                </FieldRow>

                <FieldRow label="Color">
                    <div className={styles.colorRow}>
                        <input
                            type="color"
                            className={styles.colorPicker}
                            value={settings.color}
                            onChange={e =>
                                updateSettings({ color: e.target.value })
                            }
                        />
                        <span className={styles.colorHex}>
                            {settings.color}
                        </span>
                    </div>
                </FieldRow>

                <FieldRow label="Opacity">
                    <div className={styles.sliderRow}>
                        <input
                            type="range"
                            className={styles.slider}
                            min={0}
                            max={1}
                            step={0.05}
                            value={settings.opacity}
                            onChange={e =>
                                updateSettings({
                                    opacity: parseFloat(e.target.value),
                                })
                            }
                        />
                        <span className={styles.sliderVal}>
                            {settings.opacity.toFixed(2)}
                        </span>
                    </div>
                </FieldRow>
            </Section>

            {/* Status */}
            <Section title="Drawing Status">
                <div className={styles.statusBox}>
                    <div className={styles.statusRow}>
                        <span className={styles.statusLabel}>Anchors</span>
                        <span className={styles.statusVal}>
                            {anchorPoints.length}
                        </span>
                    </div>
                    <div className={styles.statusRow}>
                        <span className={styles.statusLabel}>Walls drawn</span>
                        <span className={styles.statusVal}>
                            {drawnWalls.length}
                        </span>
                    </div>
                    {isShapeClosed && (
                        <div className={styles.closedBadge}>
                            ✅ Shape closed — ready to save
                        </div>
                    )}
                </div>

                {/* Instructions */}
                {!isShapeClosed && (
                    <div className={styles.hint}>
                        {drawingMode === 'straight'
                            ? 'Click to place points. Double-click or press Close Shape to finish.'
                            : 'Click 3 points: start → end → on-arc curve.'}
                    </div>
                )}
            </Section>

            {/* Actions */}
            <div className={styles.actionStack}>
                <div className={styles.actionRow}>
                    <button
                        className={styles.btnSecondary}
                        onClick={removeLastWall}
                        disabled={drawnWalls.length === 0}
                        title="Undo last wall"
                    >
                        <PanelIcons.Undo /> Undo
                    </button>
                    <button
                        className={styles.btnDanger}
                        onClick={clearAll}
                        disabled={drawnWalls.length === 0}
                        title="Clear all drawn walls"
                    >
                        <PanelIcons.Trash /> Clear
                    </button>
                </div>

                {!isShapeClosed && (
                    <button
                        className={styles.btnOutline}
                        onClick={finishDrawing}
                        disabled={anchorPoints.length < 3}
                    >
                        ⬡ Close Shape
                        {anchorPoints.length >= 3
                            ? ` (${anchorPoints.length} pts)`
                            : ''}
                    </button>
                )}

                <button
                    className={styles.btnPrimary}
                    onClick={onSaveWalls}
                    disabled={drawnWalls.length === 0}
                >
                    <PanelIcons.Check /> Save Walls
                </button>

                <button
                    className={styles.btnGhost}
                    onClick={cancelDrawing}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD PANEL
// ────────────────────────────────────────────────────────────────────────────

const ImageUploadPanel: React.FC<{
    floor: AreaNode;
    onUpload: (floorId: number, objectUrl: string) => void;
    onRemove: (floorId: number) => void;
}> = ({ floor, onUpload, onRemove }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = (file: File) => {
        setError(null);
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            setError('File too large — max 15 MB.');
            return;
        }
        const url = URL.createObjectURL(file);
        onUpload(floor.id, url);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className={styles.panelBody}>
            <Section title="Floor Plan Image">

                {/* Current image preview */}
                {floor.area_plan && (
                    <div className={styles.currentPlan}>
                        <img
                            src={floor.area_plan}
                            alt="Floor plan"
                            className={styles.planPreview}
                        />
                        <div className={styles.planActions}>
                            <span className={styles.planLabel}>
                                Current plan
                            </span>
                            <button
                                className={styles.btnDangerSm}
                                onClick={() => onRemove(floor.id)}
                            >
                                <PanelIcons.Trash /> Remove
                            </button>
                        </div>
                    </div>
                )}

                {/* Drop zone */}
                <div
                    className={`${styles.dropzone}
                        ${isDragging ? styles.dropzoneDragging : ''}`}
                    onDragOver={e => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <span className={styles.dropIcon}>🗺️</span>
                    <span className={styles.dropText}>
                        {floor.area_plan
                            ? 'Drop to replace'
                            : 'Drop image here'}
                    </span>
                    <span className={styles.dropSub}>
                        or click to browse
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                            e.target.value = '';
                        }}
                    />
                </div>

                {error && (
                    <div className={styles.errorMsg}>⚠ {error}</div>
                )}

                <div className={styles.hint}>
                    Supported: PNG, JPG, SVG · Max 15 MB
                </div>
            </Section>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// SENSOR PLACE PANEL
// ────────────────────────────────────────────────────────────────────────────

const SensorPlacePanel: React.FC<{
    sensors:          SensorNode[];   // placed on this floor
    unplacedSensors:  SensorNode[];   // floor_id = null
    onRemove:         (id: number) => void;
    onStartPlacing?:  () => void;     // add brand new
    onPlaceExisting?: (id: number) => void; // place existing unplaced
    isPlacing?:       boolean;
    pendingUnplacedId?: number | null;
}> = ({
    sensors, unplacedSensors, onRemove,
    onStartPlacing, onPlaceExisting,
    isPlacing, pendingUnplacedId,
}) => {

    const statusBadgeClass = (status: string) => {
        if (status === 'alert')   return styles.statusAlertBadge;
        if (status === 'offline') return styles.statusOfflineBadge;
        return styles.statusOnlineBadge;
    };

    const statusRowClass = (status: string) => {
        if (status === 'alert')   return styles.haloRowAlert;
        if (status === 'offline') return styles.haloRowOffline;
        return styles.haloRowOnline;
    };

    const statusColor = (status: string) => {
        if (status === 'alert')   return 'var(--bs-danger)';
        if (status === 'offline') return 'var(--bs-secondary-color)';
        return 'var(--bs-success)';
    };

    return (
        <div className={styles.panelBody}>

            {/* ── Add new sensor button / placing hint ──────────────────── */}
            <div className={styles.section}>
                {!isPlacing ? (
                    <button
                        className={styles.addSensorBtn}
                        onClick={onStartPlacing}
                    >
                        <span className={styles.addSensorIcon}>＋</span>
                        <div className={styles.addSensorText}>
                            <span className={styles.addSensorTitle}>
                                Add New Sensor
                            </span>
                            <span className={styles.addSensorSub}>
                                Click to activate placement mode
                            </span>
                        </div>
                        <span className={styles.addSensorArrow}>→</span>
                    </button>
                ) : (
                    <div className={styles.placingHintCard}>
                        <div className={styles.placingHintTop}>
                            <span className={styles.placingDot} />
                            <span className={styles.placingTitle}>
                                {pendingUnplacedId
                                    ? `Placing: ${unplacedSensors.find(
                                        s => s.id === pendingUnplacedId
                                      )?.name ?? 'Sensor'}`
                                    : 'Placement Active'
                                }
                            </span>
                        </div>
                        <p className={styles.placingDesc}>
                            Move your mouse over the floor.
                            Click anywhere to drop the sensor.
                        </p>
                        <div className={styles.placingSteps}>
                            <div className={styles.placingStep}>
                                <span className={styles.stepNum}>1</span>
                                Hover floor to preview
                            </div>
                            <div className={styles.placingStep}>
                                <span className={styles.stepNum}>2</span>
                                Click to place
                            </div>
                            <div className={styles.placingStep}>
                                <span className={styles.stepNum}>3</span>
                                {pendingUnplacedId
                                    ? 'Sensor placed immediately'
                                    : 'Name it and assign events'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Unplaced sensors — ready to deploy ───────────────────── */}
            {unplacedSensors.length > 0 && (
                <Section title={`Unplaced Sensors (${unplacedSensors.length})`}>
                    <div className={styles.haloList}>
                        {unplacedSensors.map(s => {
                            const isPending = pendingUnplacedId === s.id;
                            return (
                                <div
                                    key={s.id}
                                    className={`${styles.unplacedRow}
                                        ${isPending ? styles.unplacedRowActive : ''}`}
                                >
                                    {/* Left — sensor info */}
                                    <div className={styles.unplacedLeft}>
                                        <div className={styles.unplacedIconWrap}>
                                            <span className={styles.unplacedIcon}>
                                                📡
                                            </span>
                                        </div>
                                        <div className={styles.haloInfo}>
                                            <span className={styles.haloName}>
                                                {s.name}
                                            </span>
                                            <span className={styles.haloMeta}>
                                                {s.mac_address}
                                            </span>
                                            {/* Events preview */}
                                            <div className={styles.eventTags}>
                                                {s.event_configs
                                                    .slice(0, 3)
                                                    .map(e => (
                                                        <span
                                                            key={e.id}
                                                            className={styles.eventTag}
                                                        >
                                                            {e.event_id}
                                                        </span>
                                                    ))}
                                                {s.event_configs.length > 3 && (
                                                    <span className={styles.eventTagMore}>
                                                        +{s.event_configs.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right — place button */}
                                    {!isPlacing ? (
                                        <button
                                            className={styles.placeBtn}
                                            onClick={() => onPlaceExisting?.(s.id)}
                                            title="Place on floor"
                                        >
                                            <span className={styles.placeBtnIcon}>
                                                📍
                                            </span>
                                            <span className={styles.placeBtnText}>
                                                Place
                                            </span>
                                        </button>
                                    ) : isPending ? (
                                        <div className={styles.pendingIndicator}>
                                            <span className={styles.pendingDot} />
                                            Placing…
                                        </div>
                                    ) : (
                                        <div className={styles.waitingIndicator}>
                                            Wait
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* ── Placed sensors on this floor ─────────────────────────── */}
            <Section title={`Placed Here (${sensors.length})`}>
                {sensors.length === 0 ? (
                    <div className={styles.emptyList}>
                        <div className={styles.emptyListIcon}>📡</div>
                        <div className={styles.emptyListText}>
                            No sensors placed
                        </div>
                        <div className={styles.emptyListSub}>
                            Use Add New or place an<br />
                            unplaced sensor above.
                        </div>
                    </div>
                ) : (
                    <div className={styles.haloList}>
                        {sensors.map(s => (
                            <div
                                key={s.id}
                                className={statusRowClass(s.sensor_status)}
                            >
                                <div
                                    className={`${styles.haloDot}
                                        ${s.sensor_status === 'alert'
                                            ? styles.pulse : ''}`}
                                    style={{
                                        background: statusColor(s.sensor_status),
                                        color:      statusColor(s.sensor_status),
                                    }}
                                />
                                <div className={styles.haloInfo}>
                                    <span className={styles.haloName}>
                                        {s.name}
                                    </span>
                                    <span className={styles.haloMeta}>
                                        {s.x_val?.toFixed(2)}, {s.y_val?.toFixed(2)}
                                    </span>
                                </div>
                                <span className={statusBadgeClass(s.sensor_status)}>
                                    {s.sensor_status}
                                </span>
                                <button
                                    className={styles.haloRemove}
                                    onClick={() => onRemove(s.id)}
                                    title="Remove sensor"
                                >
                                    <PanelIcons.Trash />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
};





interface HaloRightPanelProps {
    mode: RightPanelMode;
    selectedFloor: AreaNode | null;
    drawing: UseWallDrawingReturn;
    sensors: SensorNode[];
    unplacedSensors?:    SensorNode[];
    onSaveWalls: () => void;
    onImageUpload: (floorId: number, url: string) => void;
    onImageRemove: (floorId: number) => void;
    onAddSensor: (sensor: SensorNode) => void;
    onRemoveSensor: (id: number) => void;
    onClose: () => void;

    selectedSensor?: SensorNode | null;
    pendingSensor?: PendingSensor | null;
    onConfirmPlacement?: (name: string, mac: string, events: string[]) => void;
    onCancelPlacement?: () => void;
    onStartPlacing?:     () => void;
    onPlaceExisting?:    (id: number) => void;
    isPlacing?:          boolean;
    pendingUnplacedId?:  number | null;

    // Aggregated details
    aggData?:            any;
    activeMetricGroup? : string | null;
    onSensorFocus?:      (id: number) => void;
}

const HaloRightPanel: React.FC<HaloRightPanelProps> = ({
    mode, selectedFloor, drawing, sensors, unplacedSensors,
    onSaveWalls, onImageUpload, onImageRemove,
    onAddSensor, onRemoveSensor, onClose,
    selectedSensor, pendingSensor, onConfirmPlacement, onCancelPlacement, 
    onStartPlacing, onPlaceExisting, isPlacing, pendingUnplacedId,
    aggData, activeMetricGroup, onSensorFocus,
}) => {
    const isOpen = mode !== null;

    const headerConfig = {
        wall_draw: {
            icon: <PanelIcons.Wall />,
            title: 'Draw Walls',
            subtitle: selectedFloor?.name ?? '',
            accent: '#7b68ee',
        },
        image_upload: {
            icon: <PanelIcons.Image />,
            title: 'Floor Plan',
            subtitle: selectedFloor?.name ?? '',
            accent: '#06d6a0',
        },
        sensor_place: {
            icon: <PanelIcons.Sensor />,
            title: 'Inventory',
            subtitle: selectedFloor?.name ?? '',
            accent: '#4a90d9',
        },
        sensor_detail: {
            icon: <PanelIcons.Sensor />,
            title: 'Sensor Detail',
            subtitle: selectedSensor?.name ?? '',
            accent: '#06d6a0',
        },
        sensor_placement: {
            icon: <PanelIcons.Sensor />,
            title: 'Place Sensor',
            subtitle: selectedFloor?.name ?? '',
            accent: '#06d6a0',
        },
        aggregated_detail: {
            icon: <PanelIcons.Sensor />,
            title: 'Analytics',
            subtitle: activeMetricGroup ? activeMetricGroup.toUpperCase() : 'Aggregated',
            accent: '#facc15',
        },
    };

    const cfg = mode ? headerConfig[mode] : null;

    return (
        <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>

            {/* Header */}
            {cfg && (
                <div className={styles.panelHeader}>
                    <div
                        className={styles.panelIconWrap}
                        style={{
                            background: `${cfg.accent}18`,
                            border: `1px solid ${cfg.accent}44`,
                            color: cfg.accent,
                        }}
                    >
                        {cfg.icon}
                    </div>
                    <div className={styles.panelTitles}>
                        <span className={styles.panelTitle}>
                            {cfg.title}
                        </span>
                        {cfg.subtitle && (
                            <span className={styles.panelSubtitle}>
                                {cfg.subtitle}
                            </span>
                        )}
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        title="Close panel"
                    >
                        <PanelIcons.Close />
                    </button>
                </div>
            )}

            {/* Body — mode switch */}
            {mode === 'wall_draw' && (
                <WallDrawPanel
                    drawing={drawing}
                    onSaveWalls={onSaveWalls}
                />
            )}

            {mode === 'image_upload' && selectedFloor && (
                <ImageUploadPanel
                    floor={selectedFloor}
                    onUpload={onImageUpload}
                    onRemove={onImageRemove}
                />
            )}

            {mode === 'sensor_place' && (
                <SensorPlacePanel
                    sensors={sensors}
                    unplacedSensors={unplacedSensors ?? []}
                    onRemove={onRemoveSensor}
                    onStartPlacing={onStartPlacing}
                    onPlaceExisting={onPlaceExisting}
                    isPlacing={isPlacing}
                    pendingUnplacedId={pendingUnplacedId}
                />
            )}

            {mode === 'sensor_detail' && selectedSensor && (
                <SensorDetailPanel sensor={selectedSensor} />
            )}

            {mode === 'sensor_placement' && pendingSensor && onConfirmPlacement && (
                <SensorPlacementPanel
                    pending={pendingSensor}
                    onConfirm={onConfirmPlacement}
                    onCancel={onCancelPlacement ?? (() => { })}
                />
            )}

            {mode === 'aggregated_detail' && activeMetricGroup && aggData && onSensorFocus && (
                <AggregatedDetailPanel
                    groupKey={activeMetricGroup}
                    agg={aggData.aggregated_data ?? {}}
                    onSensorFocus={onSensorFocus}
                />
            )}

            {/* Empty states */}
            {mode === 'image_upload' && !selectedFloor && (
                <div className={styles.emptyState}>
                    Select a floor first.
                </div>
            )}

        </div>
    );
};

export default HaloRightPanel;