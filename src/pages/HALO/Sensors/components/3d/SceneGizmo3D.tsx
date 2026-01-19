import React, { useRef, useState, useEffect } from 'react';
import InteractiveCube from './InteractiveCube';

interface Point {
    x: number;
    y: number;
}

interface SceneGizmo3DProps {
    rotation: Point;
    zoom: number; // Add main scene zoom
    onRotationChange?: (rotation: Point) => void;
    onZoomChange?: (zoom: number) => void; // Add zoom change handler
}

const SceneGizmo3D: React.FC<SceneGizmo3DProps> = ({
    rotation,
    zoom,
    onRotationChange,
    onZoomChange
}) => {
    return (
        <div
            className="scene-gizmo-container"
            style={{
                position: 'absolute',
                bottom: '25px',
                right: '25px',
                width: '140px',
                height: '140px',
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '50%',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                userSelect: 'none'
            }}
        >
            <div className="position-absolute top-50 start-50 translate-middle" style={{ pointerEvents: 'auto' }}>
                <InteractiveCube
                    rotation={rotation}
                    zoom={zoom}
                    onRotationChange={onRotationChange}
                    onZoomChange={onZoomChange}
                />
            </div>
        </div>
    );
};

export default React.memo(SceneGizmo3D);
