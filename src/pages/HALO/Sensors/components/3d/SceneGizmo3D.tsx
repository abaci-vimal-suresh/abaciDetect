import React, { useRef, useState, useEffect } from 'react';

interface Point {
    x: number;
    y: number;
}

interface SceneGizmo3DProps {
    rotation: Point;
    onRotationChange?: (rotation: Point) => void;
}

const SceneGizmo3D: React.FC<SceneGizmo3DProps> = ({ rotation, onRotationChange }) => {
    const gizmoRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'y' | 'x' | null>(null);

    const handleMouseDown = (e: React.MouseEvent, axis: 'y' | 'x') => {
        e.stopPropagation();
        setIsDragging(axis);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!gizmoRef.current) return;
            const rect = gizmoRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            if (isDragging === 'y') {
                // Horizontal rotation (North dial)
                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
                // Add 90 because our 0 degrees is N (Top)
                onRotationChange?.({ ...rotation, y: angle + 90 });
            } else {
                // Vertical rotation (Elevation dial)
                const deltaY = e.movementY;
                onRotationChange?.({ ...rotation, x: Math.max(-90, Math.min(90, rotation.x - deltaY)) });
            }
        };

        const handleMouseUp = () => setIsDragging(null);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, rotation, onRotationChange]);

    return (
        <div
            ref={gizmoRef}
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
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Outer Rotation Ring (Clickable area for Y rotation) */}
                <div
                    style={{
                        position: 'absolute', width: '100%', height: '100%',
                        cursor: 'ew-resize', borderRadius: '50%'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'y')}
                />

                <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
                    <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    {/* Tick marks */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                        <line
                            key={deg}
                            x1={70 + 58 * Math.cos(deg * Math.PI / 180)}
                            y1={70 + 58 * Math.sin(deg * Math.PI / 180)}
                            x2={70 + 64 * Math.cos(deg * Math.PI / 180)}
                            y2={70 + 64 * Math.sin(deg * Math.PI / 180)}
                            stroke="rgba(59, 130, 246, 0.3)"
                            strokeWidth="1"
                        />
                    ))}
                    <path
                        d={`M 70 8 A 62 62 0 0 1 ${70 + 62 * Math.cos((rotation.y - 90) * Math.PI / 180)} ${70 + 62 * Math.sin((rotation.y - 90) * Math.PI / 180)}`}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>

                {/* The "Lever" / Handle for Y Rotation */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '124px',
                    height: '124px',
                    margin: '-62px 0 0 -62px',
                    transform: `rotate(${rotation.y}deg)`,
                    pointerEvents: 'none'
                }}>
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'y')}
                        style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '16px',
                            height: '24px',
                            background: '#3B82F6',
                            borderRadius: '4px',
                            cursor: 'grab',
                            pointerEvents: 'auto',
                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px'
                        }}
                    >
                        <div style={{ width: '8px', height: '1px', background: 'rgba(255,255,255,0.5)' }} />
                        <div style={{ width: '8px', height: '1px', background: 'rgba(255,255,255,0.5)' }} />
                        <div style={{ width: '8px', height: '1px', background: 'rgba(255,255,255,0.5)' }} />
                    </div>
                </div>

                <div className="position-absolute top-50 start-50 translate-middle text-center text-white" style={{ fontSize: '10px', pointerEvents: 'none' }}>
                    <div className="fw-bold" style={{ color: '#3B82F6', fontSize: '12px' }}>{Math.round(rotation.y % 360)}°</div>
                    <div style={{ opacity: 0.6, fontSize: '8px' }}>Y AXIS</div>
                </div>
            </div>

            {/* Vertical Elevation Slider (Optional Lever for X) */}
            <div
                onMouseDown={(e) => handleMouseDown(e, 'x')}
                style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '20px',
                    height: '100px',
                    width: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '6px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    cursor: 'ns-resize',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Elevation Control"
            >
                <div style={{
                    position: 'absolute',
                    bottom: `${((rotation.x + 90) / 180) * 100}%`,
                    width: '18px',
                    height: '8px',
                    background: '#10B981',
                    borderRadius: '2px',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                    transform: 'translateY(4px)'
                }} />
            </div>

            {/* North Indicator */}
            <div style={{
                position: 'absolute',
                top: '-30px',
                fontSize: '14px',
                color: rotation.y % 360 < 10 || rotation.y % 360 > 350 ? '#EF4444' : '#3B82F6',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
            }}>N</div>
        </div>
    );
};

export default React.memo(SceneGizmo3D);
