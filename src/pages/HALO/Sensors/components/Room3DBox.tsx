import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import useDarkMode from '../../../../hooks/useDarkMode';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import { Sensor } from '../../../../types/sensor';
import './Room3DBox.scss';

interface Room3DBoxProps {
    sensor: Sensor;
    floorW: number;
    floorH: number;
    wallHeight: number;
    floorSpacing?: number;
    floorPlanUrl?: string;
    statusColor: string;
    status?: 'safe' | 'warning' | 'critical';
    wallOpacity: number;
    floorOpacity: number;
    ceilingOpacity: number;
    onUpdateRoom: (sensorId: string | number, name: string, color: string, showWalls: boolean, wallOpacity?: number) => void;
    showWalls: boolean;
    hideSettings?: boolean;
    sectionCutEnabled?: boolean;
    sectionCutPlane?: 'x' | 'y' | 'z';
    sectionCutPosition?: number;
    rotation: { x: number; y: number };
    visionMode?: 'none' | 'night' | 'batman';
    selectedParameters?: string[];
    displayVal?: number;
    displayType?: string;
    polygon_coords?: number[][];
}

const Room3DBox = React.memo<Room3DBoxProps>(({
    sensor,
    floorW,
    floorH,
    wallHeight: externalWallHeight,
    floorSpacing = 400,
    floorPlanUrl,
    statusColor,
    status = 'safe',
    wallOpacity,
    floorOpacity,
    ceilingOpacity,
    onUpdateRoom,
    showWalls,
    hideSettings = false,
    sectionCutEnabled = false,
    sectionCutPlane = 'x',
    sectionCutPosition = 1,
    rotation,
    visionMode = 'none',
    selectedParameters = [],
    displayVal,
    displayType,
    polygon_coords
}) => {
    const { darkModeStatus } = useDarkMode();
    const boundary = sensor.boundary!;

    // CLAMP: Force a visible gap between rooms and the floor above
    const wallHeight = Math.min(externalWallHeight, Math.floor(floorSpacing * 0.9));

    const applyFilter = (floorPlanUrl && darkModeStatus)
        ? (visionMode === 'batman'
            ? 'brightness(0.6) contrast(2) hue-rotate(185deg) saturate(3) brightness(1.2) drop-shadow(0 0 5px #00c8ff)'
            : 'grayscale(1) invert(1) brightness(0.85) contrast(1.6) sepia(0.35) hue-rotate(190deg) saturate(1.4)')
        : 'none';

    // Calculate if this room should be visible based on section cut
    const isVisibleInSection = React.useMemo(() => {
        if (!sectionCutEnabled) return true;

        const roomCenter = {
            x: (boundary.x_min + boundary.x_max) / 2,
            y: (boundary.y_min + boundary.y_max) / 2,
            z: (sensor.z_coordinate ?? sensor.z_val ?? 0.5)
        };

        switch (sectionCutPlane) {
            case 'x':
                return roomCenter.x < sectionCutPosition;
            case 'y':
                return roomCenter.y < sectionCutPosition;
            case 'z':
                return roomCenter.z < sectionCutPosition;
            default:
                return true;
        }
    }, [sectionCutEnabled, sectionCutPlane, sectionCutPosition, boundary, sensor.z_coordinate]);

    // Calculate clip-style for gradual fade at section boundary
    const clipStyle = React.useMemo(() => {
        if (!sectionCutEnabled) return {};

        const threshold = 0.15;
        const centerPos = sectionCutPlane === 'x' ? (boundary.x_min + boundary.x_max) / 2 :
            sectionCutPlane === 'y' ? (boundary.y_min + boundary.y_max) / 2 :
                (sensor.z_coordinate ?? sensor.z_val ?? 0.5);

        const distance = sectionCutPosition - centerPos;
        const opacity = Math.max(0, Math.min(1, distance / threshold + 0.5));

        return {
            opacity,
            transition: 'opacity 0.3s ease',
            pointerEvents: opacity < 0.1 ? 'none' : 'auto'
        } as React.CSSProperties;
    }, [sectionCutEnabled, sectionCutPlane, sectionCutPosition, boundary, sensor.z_coordinate]);

    const [showModal, setShowModal] = useState(false);
    const [roomName, setRoomName] = useState(sensor.room_name || `Room ${String(sensor.id).split('-').pop()}`);
    const [roomColor, setRoomColor] = useState(sensor.room_color || (darkModeStatus ? '#3B82F6' : '#94A3B8'));
    const [roomShowWalls, setRoomShowWalls] = useState(showWalls);
    const [roomWallOpacity, setRoomWallOpacity] = useState(wallOpacity);

    if (!isVisibleInSection) return null;

    const handleSave = () => {
        onUpdateRoom(sensor.id, roomName, roomColor, roomShowWalls, roomWallOpacity);
        setShowModal(false);
    };

    const bX = boundary.x_min * floorW;
    const bY = boundary.y_min * floorH;
    const bW = (boundary.x_max - boundary.x_min) * floorW;
    const bH = (boundary.y_max - boundary.y_min) * floorH;

    const displayColor = statusColor === '#10B981' ? roomColor : statusColor;

    // Helper for Polygon Path
    const polygonPath = React.useMemo(() => {
        if (!polygon_coords || polygon_coords.length < 3) return null;
        return `polygon(${polygon_coords.map(p => `${p[0] * 100}% ${p[1] * 100}%`).join(', ')})`;
    }, [polygon_coords]);

    return (
        <div
            className="room-box-3d"
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                pointerEvents: 'none',
                ...clipStyle
            } as React.CSSProperties}
        >

            {/* Vertical Walls */}
            {roomShowWalls && (
                (() => {
                    // DYNAMIC DATA-DRIVEN OPACITY
                    let dynamicOpacity = wallOpacity;
                    const val = displayVal !== undefined ? displayVal : sensor.sensor_data?.val;
                    const type = displayType || sensor.sensor_type;

                    if (val !== undefined) {
                        let boost = 0;
                        if (type === 'Temperature') {
                            // Scale 20°C (0) to 40°C (0.5)
                            boost = Math.max(0, Math.min(0.5, (val - 20) / 40));
                        } else if (type === 'Humidity') {
                            // Scale 30% (0) to 90% (0.5)
                            boost = Math.max(0, Math.min(0.5, (val - 30) / 120));
                        } else if (type === 'CO2') {
                            // Scale 400 (0) to 2000 (0.5)
                            boost = Math.max(0, Math.min(0.5, (val - 400) / 3200));
                        }
                        dynamicOpacity = Math.min(0.9, wallOpacity + boost);
                    }

                    // Status boost (overlay on top of value)
                    if (status === 'critical') dynamicOpacity = Math.max(dynamicOpacity, 0.2);
                    else if (status === 'warning') dynamicOpacity = Math.max(dynamicOpacity, 0.1);

                    const opacity = dynamicOpacity;
                    let wallBackground = '';
                    const cSafe = 'rgba(16, 185, 129,';
                    const cWarn = 'rgba(245, 158, 11,';
                    const cCrit = 'rgba(239, 68, 68,';

                    // Standard wall background
                    if (status === 'critical') {
                        wallBackground = `linear-gradient(to bottom, 
                                ${cCrit} ${opacity}) 0%, 
                                ${cCrit} ${opacity * 0.5}) 70%, 
                                ${cCrit} ${opacity * 0.3}) 100%)`;
                    } else if (status === 'warning') {
                        wallBackground = `linear-gradient(to bottom, 
                                ${cWarn} ${opacity}) 0%, 
                                ${cWarn} ${opacity * 0.3}) 50%, 
                                transparent 75%)`;
                    } else {
                        const isCustom = sensor.room_color !== undefined;
                        const startColor = isCustom ? roomColor : (darkModeStatus ? '#10B981' : '#94A3B8');
                        const baseColor = isCustom ? roomColor : (darkModeStatus ? 'rgba(16, 185, 129,' : 'rgba(148, 163, 184,');

                        if (baseColor.includes('rgba')) {
                            wallBackground = darkModeStatus
                                ? `linear-gradient(to bottom, ${baseColor} ${opacity}) 0%, ${baseColor} 0) 15%, transparent 35%)`
                                : `linear-gradient(to bottom, ${baseColor} ${opacity * 0.8}) 0%, ${baseColor} 0) 10%, transparent 25%)`;
                        } else {
                            wallBackground = darkModeStatus
                                ? `linear-gradient(to bottom, ${startColor} 0%, ${startColor} 15%, transparent 35%)`
                                : `linear-gradient(to bottom, ${startColor} 0%, ${startColor} 10%, transparent 25%)`;
                        }
                    }

                    const wallStyle = {
                        background: wallBackground,
                        backgroundSize: '100% 200%',
                        transformOrigin: 'top',
                        position: 'absolute',
                        backfaceVisibility: 'visible',
                        pointerEvents: 'none',
                        opacity: dynamicOpacity
                    } as React.CSSProperties;

                    // POLYGON WALLS
                    if (polygon_coords && polygon_coords.length >= 3) {
                        return (
                            <>
                                {polygon_coords.map((p1, idx) => {
                                    const p2 = polygon_coords[(idx + 1) % polygon_coords.length];
                                    const x1 = p1[0] * floorW;
                                    const y1 = p1[1] * floorH;
                                    const x2 = p2[0] * floorW;
                                    const y2 = p2[1] * floorH;
                                    const dx = x2 - x1;
                                    const dy = y2 - y1;
                                    const length = Math.sqrt(dx * dx + dy * dy);
                                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                                    return (
                                        <div
                                            key={`wall-${idx}`}
                                            className={`room-wall status-${status}`}
                                            style={{
                                                ...wallStyle,
                                                width: length,
                                                height: wallHeight,
                                                left: x1,
                                                top: y1,
                                                transformOrigin: '0 0',
                                                transform: `translateZ(0px) rotateZ(${angle}deg) rotateX(90deg)`
                                            }}
                                        />
                                    );
                                })}
                            </>
                        );
                    }

                    // RECTANGLE WALLS (Fallback)
                    const rectWallStyle = {
                        ...wallStyle,
                        width: bW,
                        height: wallHeight,
                    };
                    const rectWallStyleSide = { ...rectWallStyle, width: bH };

                    return (
                        <>
                            {/* North Wall */}
                            <div className={`room-wall status-${status}`} style={{
                                ...rectWallStyle, left: bX, top: bY,
                                transform: `translateZ(0px) rotateX(90deg)`,
                            }} />
                            {/* South Wall */}
                            <div className={`room-wall status-${status}`} style={{
                                ...rectWallStyle, left: bX, top: bY + bH,
                                transform: `translateZ(0px) rotateX(90deg)`,
                            }} />
                            {/* East Wall */}
                            <div className={`room-wall status-${status}`} style={{
                                ...rectWallStyleSide, left: bX + bW, top: bY,
                                transform: `translateZ(0px) rotateX(90deg) rotateY(90deg)`,
                                transformOrigin: 'top left',
                            }} />
                            {/* West Wall */}
                            <div className={`room-wall status-${status}`} style={{
                                ...rectWallStyleSide, left: bX, top: bY,
                                transform: `translateZ(0px) rotateX(90deg) rotateY(90deg)`,
                                transformOrigin: 'top left',
                            }} />
                        </>
                    );
                })()
            )}

            {/* Internal Floor */}
            {polygonPath ? (
                // Polygon Floor
                <div className={`room-floor vision-${visionMode}`} style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: floorPlanUrl ? `url(${floorPlanUrl})` : 'none',
                    backgroundSize: `${floorW}px ${floorH}px`,
                    backgroundColor: displayColor,
                    opacity: floorOpacity,
                    transform: `translateZ(0.1px)`,
                    backfaceVisibility: 'visible',
                    filter: applyFilter,
                    clipPath: polygonPath
                } as React.CSSProperties} />
            ) : (
                // Rectangle Floor
                <div className={`room-floor vision-${visionMode}`} style={{
                    position: 'absolute',
                    left: bX,
                    top: bY,
                    width: bW,
                    height: bH,
                    backgroundImage: floorPlanUrl ? `url(${floorPlanUrl})` : 'none',
                    backgroundPosition: `-${bX}px -${bY}px`,
                    backgroundSize: `${floorW}px ${floorH}px`,
                    backgroundColor: displayColor,
                    opacity: floorOpacity,
                    border: `2px solid ${displayColor}`,
                    transform: `translateZ(0.1px)`,
                    backfaceVisibility: 'visible',
                    filter: applyFilter
                } as React.CSSProperties} />
            )}


            {statusColor !== '#10B981' && (
                <div
                    style={{
                        position: 'absolute',
                        left: polygonPath ? 0 : bX,
                        top: polygonPath ? 0 : bY,
                        width: polygonPath ? '100%' : bW,
                        height: polygonPath ? '100%' : bH,
                        transform: 'translateZ(0px)',
                        transformStyle: 'preserve-3d',
                        pointerEvents: 'none',
                        clipPath: polygonPath || undefined
                    } as React.CSSProperties}
                >
                    <div
                        className="room-glow-pulse"
                        style={{
                            width: '100%',
                            height: '100%',
                            background: (() => {
                                const cx = ((sensor.x_val ?? sensor.x_coordinate!) * floorW) - (polygonPath ? 0 : bX);
                                const cy = ((sensor.y_val ?? sensor.y_coordinate!) * floorH) - (polygonPath ? 0 : bY);
                                const center = `circle at ${cx}px ${cy}px`;

                                const cSafe = '#10B981';
                                const cWarn = '#F59E0B';
                                const cCrit = '#EF4444';

                                if (status === 'critical') {
                                    return `radial-gradient(${center}, ${cCrit} 0%, ${cCrit} 40%, transparent 100%)`;
                                } else if (status === 'warning') {
                                    return `radial-gradient(${center}, ${cWarn} 0%, ${cWarn} 30%, transparent 70%)`;
                                } else {
                                    return `radial-gradient(${center}, ${displayColor} 0%, ${displayColor} 20%, transparent 40%)`;
                                }
                            })(),
                            opacity: 0.4
                        } as React.CSSProperties}
                    />
                </div>
            )}

            {/* Ceiling Layer */}
            {polygonPath ? (
                <div className="room-ceiling" style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: displayColor,
                    opacity: ceilingOpacity,
                    transform: `translateZ(${wallHeight}px)`,
                    backfaceVisibility: 'visible',
                    clipPath: polygonPath
                } as React.CSSProperties} />
            ) : (
                <div className="room-ceiling" style={{
                    position: 'absolute',
                    left: bX,
                    top: bY,
                    width: bW,
                    height: bH,
                    backgroundColor: displayColor,
                    opacity: ceilingOpacity,
                    border: `1px solid ${displayColor}`,
                    transform: `translateZ(${wallHeight}px)`,
                    backfaceVisibility: 'visible'
                } as React.CSSProperties} />
            )}


            {/* Room Label Container */}
            <div
                className="room-info-wrapper"
                style={{
                    position: 'absolute',
                    left: (boundary.x_min + boundary.x_max) / 2 * floorW - 50, // Approximate center
                    top: (boundary.y_min + boundary.y_max) / 2 * floorH - 25,
                    width: 100,
                    height: 50,
                    transform: `translateZ(${wallHeight}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    pointerEvents: 'none'
                } as React.CSSProperties}
            >
                <div
                    className="room-info-container"
                    style={{
                        transform: `translateZ(10px) rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`,
                        pointerEvents: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'transform 0.1s ease-out'
                    } as React.CSSProperties}
                >
                    <div className="room-label">{roomName}</div>
                </div>
            </div>

            <Modal isOpen={showModal} toggle={() => setShowModal(false)} centered className="room-config-modal">
                <ModalHeader toggle={() => setShowModal(false)}>Configure {roomName}</ModalHeader>
                <ModalBody>
                    <FormGroup className="mb-3">
                        <Label>Room Name</Label>
                        <Input
                            type="text"
                            value={roomName}
                            onChange={(e: any) => setRoomName(e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup className="mb-3">
                        <Label>Room Color</Label>
                        <Input
                            type="color"
                            value={roomColor}
                            onChange={(e: any) => setRoomColor(e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup check className="mb-3">
                        <Label check>
                            <Input
                                type="checkbox"
                                checked={roomShowWalls}
                                onChange={(e: any) => setRoomShowWalls(e.target.checked)}
                            />{' '}
                            Enable Room Walls
                        </Label>
                    </FormGroup>

                    <FormGroup className="mb-3">
                        <div className="d-flex justify-content-between">
                            <Label>Wall Opacity</Label>
                            <span className="text-muted">{Math.round(roomWallOpacity * 100)}%</span>
                        </div>
                        <Input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={roomWallOpacity}
                            disabled={!roomShowWalls}
                            onChange={(e: any) => setRoomWallOpacity(parseFloat(e.target.value))}
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button color="primary" onClick={handleSave}>Save Room</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
    , (prevProps, nextProps) => {
        return prevProps.rotation.x === nextProps.rotation.x &&
            prevProps.rotation.y === nextProps.rotation.y &&
            prevProps.sensor.id === nextProps.sensor.id &&
            prevProps.wallOpacity === nextProps.wallOpacity &&
            prevProps.statusColor === nextProps.statusColor &&
            prevProps.sectionCutEnabled === nextProps.sectionCutEnabled &&
            prevProps.sectionCutPosition === nextProps.sectionCutPosition &&
            prevProps.sectionCutPlane === nextProps.sectionCutPlane &&
            prevProps.floorW === nextProps.floorW &&
            prevProps.floorH === nextProps.floorH &&
            prevProps.displayVal === nextProps.displayVal &&
            prevProps.displayType === nextProps.displayType;
    });

export default Room3DBox;
