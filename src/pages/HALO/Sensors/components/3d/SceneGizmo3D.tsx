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
        <div
            className="scene-gizmo-container"
            style={{
                position: 'absolute',
                bottom: '15px',
                right: '15px',
                width: '150px',
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                userSelect: 'none'
            }}
        >
            {/* Outer Circle Container */}
            <div style={{
                position: 'relative',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
                border: '1.5px solid rgba(59, 130, 246, 0.5)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
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
                        position: 'absolute',
                        top: '-14px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'auto',
                        width: '28px',
                        height: '28px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.6)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)',
                        borderRadius: '50%'
                    }}
                >
                    <Icon icon="add" size="sm" />
                </button>

                {/* Zoom Level Display - Left */}
                <div className="zoom-level" style={{
                    position: 'absolute',
                    left: '-45px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    borderRadius: '4px',
                    color: '#3B82F6'
                }}>
                    {Math.round(zoom * 100)}%
                </div>

                {/* Zoom Out Button - Bottom */}
                <button
                    className="zoom-btn"
                    onClick={() => onZoomChange?.(Math.max(0.1, zoom - 0.1))}
                    title="Zoom Out"
                    style={{
                        position: 'absolute',
                        bottom: '-14px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'auto',
                        width: '28px',
                        height: '28px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.6)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)',
                        borderRadius: '50%'
                    }}
                >
                    <Icon icon="remove" size="sm" />
                </button>

                {/* Reset Button - Right */}
                <button
                    className="reset-btn"
                    onClick={() => onResetView?.()}
                    title="Reset View"
                    style={{
                        position: 'absolute',
                        right: '-14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'auto',
                        width: '28px',
                        height: '28px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.6)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2), inset 0 0 8px rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                        borderRadius: '50%'
                    }}
                >
                    <Icon icon="refresh" size="sm" />
                </button>
            </div>
        </div>
    );
};

export default React.memo(SceneGizmo3D);
