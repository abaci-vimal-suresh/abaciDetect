import React from 'react';
import Icon from '../../../../../components/icon/Icon';
import Button from '../../../../../components/bootstrap/Button';

interface InteractionHintsProps {
    zoom: number;
    editMode: boolean;
    selectedSensor: string | number | null;
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

        </>
    );
};

export default React.memo(InteractionHints);
