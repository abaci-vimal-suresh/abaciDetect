import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import useDarkMode from '../../hooks/shared/useDarkMode';
import Button from '../bootstrap/Button';
import Icon from '../icon/Icon';
import { Sensor } from '../../types/sensor';
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
    onUpdateRoom: (sensorId: string, name: string, color: string, showWalls: boolean, wallOpacity?: number) => void;
    pulseSpeed: number;
    showWalls: boolean;
    hideSettings?: boolean;
    sectionCutEnabled?: boolean;
    sectionCutPlane?: 'x' | 'y' | 'z';
    sectionCutPosition?: number;
    rotation: { x: number; y: number };
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
    pulseSpeed,
    showWalls,
    hideSettings = false,
    sectionCutEnabled = false,
    sectionCutPlane = 'x',
    sectionCutPosition = 1,
    rotation
}) => {
    const { darkModeStatus } = useDarkMode();
    const boundary = sensor.boundary!;

    // CLAMP: Force a visible gap between rooms and the floor above
    const wallHeight = Math.min(externalWallHeight, Math.floor(floorSpacing * 0.9));
    const applyFilter = (floorPlanUrl && darkModeStatus)
        ? 'grayscale(1) invert(1) brightness(0.85) contrast(1.6) sepia(0.35) hue-rotate(190deg) saturate(1.4)'
        : 'none';
    // Calculate if this room should be visible based on section cut
    const isVisibleInSection = React.useMemo(() => {
        if (!sectionCutEnabled) return true;

        const roomCenter = {
            x: (boundary.x_min + boundary.x_max) / 2,
            y: (boundary.y_min + boundary.y_max) / 2,
            z: sensor.z_coordinate || 0.5
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

        const threshold = 0.15; // Fade zone width
        const centerPos = sectionCutPlane === 'x' ? (boundary.x_min + boundary.x_max) / 2 :
            sectionCutPlane === 'y' ? (boundary.y_min + boundary.y_max) / 2 :
                sensor.z_coordinate || 0.5;

        const distance = sectionCutPosition - centerPos;
        const opacity = Math.max(0, Math.min(1, distance / threshold + 0.5));

        return {
            opacity,
            transition: 'opacity 0.3s ease',
            pointerEvents: opacity < 0.1 ? 'none' : 'auto'
        } as React.CSSProperties;
    }, [sectionCutEnabled, sectionCutPlane, sectionCutPosition, boundary, sensor.z_coordinate]);

    const [showModal, setShowModal] = useState(false);
    const [roomName, setRoomName] = useState(sensor.room_name || `Room ${sensor.id.split('-').pop()}`);
    const [roomColor, setRoomColor] = useState(sensor.room_color || '#3B82F6');
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

    // Use statusColor for visualization if it's not the default "safe" green,
    // otherwise use the user-defined roomColor.
    const displayColor = statusColor === '#10B981' ? roomColor : statusColor;

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

            {/* Vertical Walls (Volumetric Smoke Effect) */}
            {roomShowWalls && (
                (() => {
                    // Vertical Gradient Logic (Top -> Bottom)
                    // Safe: Green mist at top, fading out.
                    // Warning: Yellow mist at top, Green mist below, fading out.
                    // Critical: Red mist at top, Yellow middle, Green bottom (filling room).

                    let wallBackground = '';
                    // Using RGBA for better transparency control
                    const cSafe = 'rgba(16, 185, 129,';
                    const cWarn = 'rgba(245, 158, 11,';
                    const cCrit = 'rgba(239, 68, 68,';

                    const opacity = wallOpacity; // User defined max opacity

                    if (status === 'critical') {
                        // Solid Red filling the volume
                        wallBackground = `linear-gradient(to bottom, 
                            ${cCrit} ${opacity}) 0%, 
                            ${cCrit} ${opacity * 0.5}) 70%, 
                            ${cCrit} ${opacity * 0.3}) 100%)`;
                    } else if (status === 'warning') {
                        // Solid Yellow spreading to ~70%
                        wallBackground = `linear-gradient(to bottom, 
                            ${cWarn} ${opacity}) 0%, 
                            ${cWarn} ${opacity * 0.3}) 50%, 
                            transparent 75%)`;
                    } else {
                        // Solid Green (or custom) spreading to ~20%
                        const isCustom = statusColor !== '#10B981';
                        const startColor = isCustom ? displayColor : '#10B981';
                        // Convert hex to RGBA if possible or just use opacity
                        const baseColor = isCustom ? displayColor : 'rgba(16, 185, 129,';

                        if (baseColor.includes('rgba')) {
                            wallBackground = `linear-gradient(to bottom, ${baseColor} ${opacity}) 0%, ${baseColor} 0) 15%, transparent 35%)`;
                        } else {
                            // Simple version for hex
                            wallBackground = `linear-gradient(to bottom, ${startColor} 0%, ${startColor} 15%, transparent 35%)`;
                        }
                    }

                    const wallStyle = {
                        width: bW, height: wallHeight,
                        background: wallBackground,
                        transformOrigin: 'top',
                        position: 'absolute',
                        backfaceVisibility: 'visible',
                        pointerEvents: 'none',
                        // Smoke Drifting Animation
                        animation: `smokeDrift ${pulseSpeed * 2}s ease-in-out infinite alternate`,
                        backgroundSize: '100% 200%', // Allow background pos animation to work
                    } as React.CSSProperties;

                    // Side walls need width swapping
                    const wallStyleSide = { ...wallStyle, width: bH };

                    return (
                        <>
                            {/* North Wall */}
                            <div className="room-wall" style={{
                                ...wallStyle, left: bX, top: bY,
                                transform: `translateZ(0px) rotateX(90deg)`,
                            }} />
                            {/* South Wall */}
                            <div className="room-wall" style={{
                                ...wallStyle, left: bX, top: bY + bH,
                                transform: `translateZ(0px) rotateX(90deg)`,
                            }} />
                            {/* East Wall */}
                            <div className="room-wall" style={{
                                ...wallStyleSide, left: bX + bW, top: bY,
                                transform: `translateZ(0px) rotateX(90deg) rotateY(90deg)`, transformOrigin: 'top left',
                            }} />
                            {/* West Wall */}
                            <div className="room-wall" style={{
                                ...wallStyleSide, left: bX, top: bY,
                                transform: `translateZ(0px) rotateX(90deg) rotateY(90deg)`, transformOrigin: 'top left',
                            }} />
                        </>
                    );
                })()
            )}

            {/* Internal Floor */}
            <div className="room-floor" style={{
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

            {/* Volumetric Glow (matching 2D style) */}
            {statusColor !== '#10B981' && (
                <div
                    style={{
                        position: 'absolute',
                        left: bX,
                        top: bY,
                        width: bW,
                        height: bH,
                        transform: 'translateZ(0px)',
                        transformStyle: 'preserve-3d',
                        pointerEvents: 'none'
                    } as React.CSSProperties}
                >
                    <div
                        className="room-glow-pulse"
                        style={{
                            width: '100%',
                            height: '100%',
                            background: (() => {
                                const cx = (sensor.x_coordinate! * floorW) - bX;
                                const cy = (sensor.y_coordinate! * floorH) - bY;
                                const center = `circle at ${cx}px ${cy}px`;

                                // Colors
                                const cSafe = '#10B981';
                                const cWarn = '#F59E0B';
                                const cCrit = '#EF4444';

                                if (status === 'critical') {
                                    return `radial-gradient(${center}, ${cCrit} 0%, ${cCrit} 40%, transparent 100%)`;
                                } else if (status === 'warning') {
                                    return `radial-gradient(${center}, ${cWarn} 0%, ${cWarn} 30%, transparent 70%)`;
                                } else {
                                    // Use displayColor (which is room color if safe, otherwise statusColor)
                                    return `radial-gradient(${center}, ${displayColor} 0%, ${displayColor} 20%, transparent 40%)`;
                                }
                            })(),
                            opacity: 0.8,
                            animation: `roomGlowPulse ${pulseSpeed}s ease-in-out infinite`,
                        } as React.CSSProperties}
                    />
                </div>
            )}

            {/* Ceiling Layer (Matching Floor Image) */}
            <div className="room-ceiling" style={{
                position: 'absolute',
                left: bX,
                top: bY,
                width: bW,
                height: bH,
                backgroundImage: floorPlanUrl ? `url(${floorPlanUrl})` : 'none',
                backgroundPosition: `-${bX}px -${bY}px`,
                backgroundSize: `${floorW}px ${floorH}px`,
                backgroundColor: displayColor,
                opacity: ceilingOpacity,
                border: `1px solid ${displayColor}`,
                transform: `translateZ(${wallHeight}px)`,
                backfaceVisibility: 'visible'
            } as React.CSSProperties} />

            {/* Room Label Container (separate from ceiling opacity) */}
            <div
                className="room-info-wrapper"
                style={{
                    position: 'absolute',
                    left: bX,
                    top: bY,
                    width: bW,
                    height: bH,
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
}, (prevProps, nextProps) => {
    return prevProps.rotation.x === nextProps.rotation.x &&
        prevProps.rotation.y === nextProps.rotation.y &&
        prevProps.sensor.id === nextProps.sensor.id &&
        prevProps.wallOpacity === nextProps.wallOpacity &&
        prevProps.statusColor === nextProps.statusColor &&
        prevProps.sectionCutEnabled === nextProps.sectionCutEnabled &&
        prevProps.sectionCutPosition === nextProps.sectionCutPosition &&
        prevProps.sectionCutPlane === nextProps.sectionCutPlane &&
        prevProps.floorW === nextProps.floorW &&
        prevProps.floorH === nextProps.floorH;
});

export default Room3DBox;
