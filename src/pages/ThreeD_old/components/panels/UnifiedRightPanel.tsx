import React from 'react';
import { Sensor, Area, Wall } from '../../../../types/sensor';
import SensorPlacementPanel from './SensorPlacementPanel';
import AreaSettingsOverlay from './AreaSettingsOverlay';
import MetricIntegratedDashboard from '../dashboards/MetricIntegratedDashboard';
import { PreviewState } from '../../utils/previewState';
import { WallDrawSettings } from '../walls/WallDrawingPanel';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';

interface UnifiedRightPanelProps {
    // Selection state
    selectedSensor: Sensor | null;
    editingAreaForWalls: Area | null;
    activeMetricGroup: any | null;
    
    // Common handlers
    onClose: () => void;
    previewState: PreviewState | null;
    onPreviewChange: (changes: any) => void;
    onBlinkingWallsChange: (ids: (number | string)[]) => void;
    darkModeStatus: boolean;

    // Sensor Specific
    externalWallToLink: Wall | null;
    onExternalWallLinkHandled: () => void;

    // Area / Wall Drawing Specific
    wallDrawMode: boolean;
    onToggleDrawing: (active: boolean) => void;
    pendingWalls: Partial<Wall>[] | null;
    wallCreationTrigger: number;
    selectedWallId: number | string | null;
    wallDrawSettings: WallDrawSettings;
    onDrawSettingsChange: (partial: Partial<WallDrawSettings>) => void;
    drawPointCount: number;
    drawArcBufferCount: number;
    drawCommittedCount: number;
    onDrawFinish: () => void;
    onDrawUndo: () => void;
    onDrawClear: () => void;

    // Sensor List / Selection
    showSensorList?: boolean;
    sensors?: Sensor[];
    sensorsByFloor?: Record<number, Sensor[]>;
    onSensorSelect?: (sensor: Sensor) => void;
}

const UnifiedRightPanel: React.FC<UnifiedRightPanelProps> = ({
    selectedSensor,
    editingAreaForWalls,
    activeMetricGroup,
    onClose,
    previewState,
    onPreviewChange,
    onBlinkingWallsChange,
    darkModeStatus,
    externalWallToLink,
    onExternalWallLinkHandled,
    wallDrawMode,
    onToggleDrawing,
    pendingWalls,
    wallCreationTrigger,
    selectedWallId,
    wallDrawSettings,
    onDrawSettingsChange,
    drawPointCount,
    drawArcBufferCount,
    drawCommittedCount,
    onDrawFinish,
    onDrawUndo,
    onDrawClear,
    showSensorList,
    sensors,
    sensorsByFloor,
    onSensorSelect
}) => {
    // If nothing is selected and no active sensor list, don't render anything in the sidebar
    if (!selectedSensor && !editingAreaForWalls && !activeMetricGroup && !showSensorList) {
        return null;
    }

    return (
        <div
            className="h-100"
            style={{
                pointerEvents: 'auto',
                width: '300px',
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderLeft: `1px solid ${darkModeStatus ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)'}`,
                boxShadow: '-5px 0 20px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div className='p-2 border-bottom d-flex align-items-center justify-content-between'>
                <div className='small fw-bold text-info text-uppercase' style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    {showSensorList && !selectedSensor && !editingAreaForWalls ? 'Sensor List' : 'Component Settings'}
                </div>
                <button onClick={onClose} className='btn btn-link btn-sm p-0 text-muted'>
                    <Icon icon="Close" />
                </button>
            </div>

            <div className='flex-grow-1 overflow-auto'>
                {/* Sensor List Mode */}
                {showSensorList && !selectedSensor && !editingAreaForWalls && !activeMetricGroup && sensorsByFloor && (
                    <div className='p-3'>
                        {Object.keys(sensorsByFloor).sort((a, b) => Number(b) - Number(a)).map(floor => (
                            <div key={floor} className='mb-4'>
                                <div className='text-muted small mb-2 px-1' style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    Floor {floor}
                                </div>
                                {sensorsByFloor[Number(floor)].map(s => (
                                    <div
                                        key={s.id}
                                        className={`p-2 rounded mb-1 cursor-pointer transition-all ${selectedSensor?.id === s.id ? 'bg-info bg-opacity-25 border border-info border-opacity-50 text-info shadow-sm' : (darkModeStatus ? 'hover-bg-dark text-white text-opacity-75' : 'hover-bg-light text-dark text-opacity-75')}`}
                                        onClick={() => onSensorSelect?.(s)}
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        <div className='d-flex align-items-center justify-content-between mb-1'>
                                            <div className='text-truncate fw-bold'>{s.name}</div>
                                            <Badge
                                                color={s.status === 'safe' || s.status === 'Normal' ? 'success' : s.status === 'warning' || s.status === 'Warning' ? 'warning' : 'danger'}
                                                isLight
                                                style={{ fontSize: '0.7rem' }}
                                            >
                                                {s.status}
                                            </Badge>
                                        </div>
                                        <div className='d-flex gap-2' style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                            <span className='font-monospace'>{s.mac_address || 'NO-MAC'}</span>
                                            <span className='ms-auto'>{s.ip_address || 'NO-IP'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Sensor Placement/CRUD Mode */}
                {selectedSensor && !wallDrawMode && !activeMetricGroup && (
                    <SensorPlacementPanel
                        sensor={selectedSensor}
                        originalSensor={selectedSensor}
                        onClose={onClose}
                        onPreviewChange={onPreviewChange}
                        onBlinkingWallsChange={onBlinkingWallsChange}
                        previewState={previewState || undefined}
                        externalWallToLink={externalWallToLink}
                        onExternalWallLinkHandled={onExternalWallLinkHandled}
                    />
                )}

                {/* Area Settings / Wall Drawing Mode */}
                {editingAreaForWalls && !activeMetricGroup && (
                    <AreaSettingsOverlay
                        area={editingAreaForWalls}
                        isDrawing={wallDrawMode}
                        onToggleDrawing={onToggleDrawing}
                        newlyCreatedWalls={pendingWalls}
                        wallCreationTrigger={wallCreationTrigger}
                        onClose={onClose}
                        onPreviewChange={onPreviewChange}
                        onBlinkingWallsChange={onBlinkingWallsChange}
                        previewState={previewState || undefined}
                        externalSelectedWallId={selectedWallId}
                        drawSettings={wallDrawSettings}
                        onDrawSettingsChange={onDrawSettingsChange}
                        drawPointCount={drawPointCount}
                        drawArcBufferCount={drawArcBufferCount}
                        drawCommittedCount={drawCommittedCount}
                        onDrawFinish={onDrawFinish}
                        onDrawUndo={onDrawUndo}
                        onDrawClear={onDrawClear}
                    />
                )}

                {/* Dashboard / Analytics Mode */}
                {activeMetricGroup && (
                    <MetricIntegratedDashboard
                        group={activeMetricGroup}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
};

export default UnifiedRightPanel;
