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
    rotation
}) => {
    const [isInternalHover, setIsInternalHover] = useState(false);

    // CLAMP: Must match Room3DBox clamping exactly
    const wallHeight = Math.min(rawWallHeight, Math.floor(floorSpacing * 0.9));

    // POSITION: If z_coordinate is undefined (99% default), 
    // we want it floating slightly ABOVE the ceiling for clear visibility.
    // 1.05 * wallHeight puts it 5% higher than the ceiling.
    const zRatio = sensor.z_coordinate !== undefined ? sensor.z_coordinate : 1.05;
    const zPos = zRatio * wallHeight;

    return (
        <div
            className={`sensor3d-wrapper ${isHovered || isInternalHover ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
            style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                transform: `translateZ(${zPos}px)`,
                zIndex: 100, // Higher than room boxes (50)
                pointerEvents: 'auto',
                position: 'absolute',
                cursor: editMode ? 'move' : 'pointer'
            }}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onMouseEnter={() => setIsInternalHover(true)}
            onMouseLeave={() => setIsInternalHover(false)}
        >
            <div
                className={`sensor-ball ${status}`}
                style={{ color: statusColor }}
            >
                <div className="ball-core" />
                <div className="ball-ring x" />
                <div className="ball-ring y" />
                <div className="ball-ring z" />

                {status === 'critical' && (
                    <>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="spark-particle" />
                        ))}
                    </>
                )}

                {status === 'warning' && (
                    <>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="warning-wave" />
                        ))}
                    </>
                )}

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

                {/* FLOATING DATA LABEL */}
                <div className="sensor-label-3d" style={{
                    color: statusColor,
                    transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg) translateZ(50px)`,
                    transition: 'transform 0.1s ease-out'
                }}>
                    {sensor.sensor_data?.val ?? '--'} {sensor.sensor_type === 'Temperature' ? '°C' : ''}
                </div>

                {/* EXPANDED HOVER CARD */}
                <div className="sensor-detail-card" style={{
                    color: statusColor,
                    borderColor: statusColor,
                    transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg) translateZ(50px)`,
                    transition: 'transform 0.1s ease-out, opacity 0.3s ease, visibility 0.3s ease'
                }}>
                    <div className="corner tl"></div>
                    <div className="corner tr"></div>
                    <div className="corner bl"></div>
                    <div className="corner br"></div>

                    <h4>{sensor.name}</h4>
                    <div className="data-row">
                        <span>Type:</span>
                        <span>{sensor.sensor_type}</span>
                    </div>
                    <div className="data-row">
                        <span>Status:</span>
                        <span style={{ color: statusColor, textTransform: 'uppercase' }}>{status}</span>
                    </div>
                    <div className="data-row">
                        <span>Value:</span>
                        <span style={{ fontSize: '14px' }}>
                            {sensor.sensor_data?.val ?? '--'}
                            {sensor.sensor_type === 'Temperature' ? '°C' :
                                sensor.sensor_type === 'CO2' ? ' ppm' :
                                    sensor.sensor_type === 'Humidity' ? '%' : ''}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Sensor3DMarker);
