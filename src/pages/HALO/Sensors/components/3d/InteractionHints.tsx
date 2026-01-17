import React from 'react';
import Icon from '../../../../../components/icon/Icon';
import Button from '../../../../../components/bootstrap/Button';

interface InteractionHintsProps {
    zoom: number;
    editMode: boolean;
    selectedSensor: string | null;
    showBoundaryHint: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    onResetPan: () => void;
    onShowView: (view: string) => void;
    onToggleFullScreen: () => void;
    darkModeStatus: boolean;
}

const InteractionHints: React.FC<InteractionHintsProps> = ({
    zoom,
    editMode,
    selectedSensor,
    showBoundaryHint,
    onZoomIn,
    onZoomOut,
    onResetView,
    onResetPan,
    onShowView,
    onToggleFullScreen,
    darkModeStatus
}) => {
    return (
        <>
            {/* ✅ Boundary Drawing Hint Overlay for 3D */}
            {editMode && selectedSensor && showBoundaryHint && (
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(59, 130, 246, 0.95)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Icon icon="Draw" size="md" />
                    Hold Shift + Click and drag to draw sensor coverage
                </div>
            )}

            {/* View & Zoom Controls Overlay */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '25px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 1000,
                padding: '12px',
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
                border: darkModeStatus ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)'
            }}>
                {/* Zoom Box */}
                <div className="d-flex gap-1">
                    <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onZoomIn(); }} title="Zoom In">
                        <Icon icon="Add" />
                    </Button>
                    <div className="flex-fill d-flex align-items-center justify-content-center px-2" style={{
                        fontSize: '11px',
                        color: darkModeStatus ? '#fff' : '#000',
                        fontWeight: 'bold',
                        minWidth: '45px'
                    }}>
                        {Math.round(zoom * 100)}%
                    </div>
                    <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onZoomOut(); }} title="Zoom Out">
                        <Icon icon="Remove" />
                    </Button>
                </div>

                {/* Navigation Tools */}
                <div className="d-flex gap-1 border-top border-secondary pt-2 mt-1">
                    <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onResetPan(); }} title="Center View" className="flex-fill">
                        <Icon icon="CenterFocusStrong" />
                    </Button>
                    <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onToggleFullScreen(); }} title="Full Screen" className="flex-fill">
                        <Icon icon="Fullscreen" />
                    </Button>
                    <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onResetView(); }} title="Reset All" className="flex-fill">
                        <Icon icon="Refresh" />
                    </Button>
                </div>

                {/* View Presets */}
                <div className="d-flex flex-column gap-1 mt-1">
                    <div className="d-flex gap-1">
                        <Button size="sm" color="info" isLight onClick={(e: any) => { e.stopPropagation(); onShowView('perspective'); }} title="Perspective" className="flex-fill">
                            <Icon icon="3d_rotation" />
                        </Button>
                        <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onShowView('top'); }} title="Top" className="flex-fill">
                            <Icon icon="ExpandLess" />
                        </Button>
                    </div>

                    <div className="d-flex gap-1">
                        <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onShowView('front'); }} title="Front" className="flex-fill">
                            F
                        </Button>
                        <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onShowView('back'); }} title="Back" className="flex-fill">
                            B
                        </Button>
                    </div>

                    <div className="d-flex gap-1">
                        <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onShowView('left'); }} title="Left" className="flex-fill">
                            L
                        </Button>
                        <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onShowView('right'); }} title="Right" className="flex-fill">
                            R
                        </Button>
                    </div>

                    <Button size="sm" isLight onClick={(e: any) => { e.stopPropagation(); onShowView('bottom'); }} title="Bottom">
                        Bottom
                    </Button>
                </div>
            </div>
        </>
    );
};

export default React.memo(InteractionHints);
