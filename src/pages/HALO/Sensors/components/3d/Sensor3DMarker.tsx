import React, { useState } from 'react';
import { Sensor } from '../../../../../types/sensor';

interface Sensor3DMarkerProps {
    sensor: Sensor;
    x: number;
    y: number;
    status: 'safe' | 'warning' | 'critical';
    statusColor: string;
    isHovered: boolean;
    isSelected: boolean;
    editMode: boolean;
    wallHeight: number;
    floorSpacing?: number;
    onMouseDown: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    rotation: { x: number; y: number };
    visionMode?: 'none' | 'invert' | 'sepia' | 'negative' | 'dog' | 'batman' | 'blueprint';
    selectedParameters?: string[];
    displayVal?: number;
    displayType?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const Sensor3DMarker: React.FC<Sensor3DMarkerProps> = ({
    sensor,
    x,
    y,
    status,
    statusColor,
    isHovered,
    isSelected,
    editMode,
    wallHeight: rawWallHeight,
    floorSpacing = 400,
    onMouseDown,
    onClick,
    rotation,
    visionMode = 'none',
    selectedParameters = [],
    displayVal,
    displayType,
    onMouseEnter,
    onMouseLeave,
}) => {
    const [isInternalHover, setIsInternalHover] = useState(false);

    // CLAMP: Must match Room3DBox clamping exactly
    const wallHeight = Math.min(rawWallHeight, Math.floor(floorSpacing * 0.9));

    // POSITION: 
    // If zRatio is close to 0 (floor), we want it sitting ON TOP (+8px).
    // If zRatio is close to 1 (ceiling), we want it SUBMERGED (-8px).
    const zRatio = (sensor.z_coordinate !== undefined && sensor.z_coordinate !== null)
        ? sensor.z_coordinate
        : ((sensor.z_val !== undefined && sensor.z_val !== null) ? sensor.z_val : 0.0);
    const isFloorMounted = zRatio < 0.5;
    const zOffset = isFloorMounted ? 8 : -8;
    const zPos = (zRatio * wallHeight) + zOffset;

    return (
        <div
            className={`sensor3d-wrapper ${isHovered || isInternalHover ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
            style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                transform: `translateZ(${zPos}px)`,
                zIndex: 999, // Higher than room boxes (50)
                pointerEvents: 'auto',
                position: 'absolute',
                cursor: editMode ? 'move' : 'pointer'
            }}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onMouseEnter={() => {
                setIsInternalHover(true);
                onMouseEnter?.();
            }}
            onMouseLeave={() => {
                setIsInternalHover(false);
                onMouseLeave?.();
            }}
        >
            <div
                className={`sensor-ball ${status}`}
                style={{
                    color: statusColor,
                    transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                <div className="ball-core" />

                {[...Array(5)].map((_, i) => (
                    <div key={i} className="status-ribbon" style={{ background: `linear-gradient(to top, ${statusColor}, transparent)` }} />
                ))}

                {/* Tether line to floor */}
                <div style={{
                    position: 'absolute',
                    width: '1px',
                    height: `${zPos}px`,
                    background: `linear-gradient(to bottom, ${statusColor}, transparent)`,
                    left: '50%',
                    bottom: '0',
                    transform: 'translateX(-50%) translateZ(0)',
                    opacity: 0.4,
                    pointerEvents: 'none'
                }} />

                {/* Hiding 3D Holographic Overlays as they are now in the sidebar */}
                {false && (
                    <>
                        {/* FLOATING DATA LABEL */}
                        <div className="sensor-label-3d" style={{
                            color: visionMode === 'blueprint' ? '#00c8ff' : statusColor,
                            textShadow: visionMode === 'blueprint' ? '0 0 10px rgba(0, 200, 255, 0.8)' : 'none',
                            transform: `translateZ(50px)`,
                            transition: 'transform 0.1s ease-out'
                        }}>
                            {displayVal !== undefined ? displayVal : (sensor.sensor_data?.val ?? '--')}
                            {/* ... unit logic ... */}
                        </div>

                        {/* EXPANDED HOVER CARD */}
                        <div className="sensor-detail-card" style={{
                            color: statusColor,
                            borderColor: statusColor,
                            transform: `translateZ(60px)`,
                            transition: 'transform 0.1s ease-out, opacity 0.3s ease, visibility 0.3s ease'
                        }}>
                            {/* ... card content ... */}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default React.memo(Sensor3DMarker);
