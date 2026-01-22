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
}) => {
    const [isInternalHover, setIsInternalHover] = useState(false);

    // CLAMP: Must match Room3DBox clamping exactly
    const wallHeight = Math.min(rawWallHeight, Math.floor(floorSpacing * 0.9));

    // POSITION: If z_coordinate is undefined (99% default), 
    // we want it partially submerged into the ceiling (more than half inside).
    const zRatio = sensor.z_coordinate !== undefined ? sensor.z_coordinate : 1.0;
    const zPos = (zRatio * wallHeight) - 8; // Submerge 8px below ceiling line

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

                {/* FLOATING DATA LABEL */}
                <div className="sensor-label-3d" style={{
                    color: visionMode === 'blueprint' ? '#00c8ff' : statusColor,
                    textShadow: visionMode === 'blueprint' ? '0 0 10px rgba(0, 200, 255, 0.8)' : 'none',
                    transform: `translateZ(50px)`,
                    transition: 'transform 0.1s ease-out'
                }}>
                    {displayVal !== undefined ? displayVal : (sensor.sensor_data?.val ?? '--')}
                    {(() => {
                        const type = displayType || sensor.sensor_type;
                        if (type.includes('Temperature')) return '°C';
                        if (type.includes('Humidity')) return '%';
                        if (type.includes('CO2')) return ' ppm';
                        if (type.includes('TVOC')) return ' ppb';
                        if (type.includes('AQI')) return '';
                        if (type.includes('PM2.5')) return ' µg/m³';
                        if (type.includes('Noise')) return ' dB';
                        if (type.includes('Light')) return ' lux';
                        return '';
                    })()}
                </div>

                {/* EXPANDED HOVER CARD */}
                <div className="sensor-detail-card" style={{
                    color: statusColor,
                    borderColor: statusColor,
                    transform: `translateZ(60px)`, // Offset slightly from data label
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
