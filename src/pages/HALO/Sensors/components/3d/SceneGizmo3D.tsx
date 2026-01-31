import React, { useRef, useState, useEffect } from 'react';
import InteractiveCube from './InteractiveCube';
import Icon from '../../../../../components/icon/Icon';
import './SceneGizmo3D.scss';

interface Point {
    x: number;
    y: number;
}

interface SceneGizmo3DProps {
    rotation: Point;
    zoom: number;
    onRotationChange?: (rotation: Point) => void;
    onZoomChange?: (zoom: number) => void;
    onResetView?: () => void;
}

const SceneGizmo3D: React.FC<SceneGizmo3DProps> = ({
    rotation,
    zoom,
    onRotationChange,
    onZoomChange,
    onResetView
}) => {
    return (
        <div className="scene-gizmo-container">
            {/* Outer Circle Container */}
            <div className="gizmo-outer-circle">
                {/* Interactive Cube in Center */}
                <div style={{ pointerEvents: 'auto', zIndex: 10, transform: 'scale(0.8)' }}>
                    <InteractiveCube
                        rotation={rotation}
                        zoom={zoom}
                        onRotationChange={onRotationChange}
                        onZoomChange={onZoomChange}
                    />
                </div>

                {/* Zoom In Button - Top */}
                <button
                    className="zoom-btn"
                    onClick={() => onZoomChange?.(Math.min(5, zoom + 0.1))}
                    title="Zoom In"
                    style={{
                        top: '-16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        '--hover-translate-x': '-50%',
                        '--hover-translate-y': '0'
                    } as React.CSSProperties}
                >
                    <Icon icon="add" size="sm" />
                </button>

                {/* Zoom Level Display - Left */}
                <div className="zoom-level">
                    {Math.round(zoom * 100)}%
                </div>

                {/* Zoom Out Button - Bottom */}
                <button
                    className="zoom-btn"
                    onClick={() => onZoomChange?.(Math.max(0.1, zoom - 0.1))}
                    title="Zoom Out"
                    style={{
                        bottom: '-16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        '--hover-translate-x': '-50%',
                        '--hover-translate-y': '0'
                    } as React.CSSProperties}
                >
                    <Icon icon="remove" size="sm" />
                </button>

                {/* Reset Button - Right */}
                <button
                    className="reset-btn"
                    onClick={() => onResetView?.()}
                    title="Reset View"
                    style={{
                        right: '-16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        '--hover-translate-x': '0',
                        '--hover-translate-y': '-50%'
                    } as React.CSSProperties}
                >
                    <Icon icon="refresh" size="sm" />
                </button>
            </div>
        </div>
    );
};

export default React.memo(SceneGizmo3D);
