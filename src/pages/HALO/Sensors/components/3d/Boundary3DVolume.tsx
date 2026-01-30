import React from 'react';

interface Boundary3DVolumeProps {
    x: number;
    y: number;
    width: number;
    height: number;
    wallHeight: number;
    color?: string;
    sensorX?: number;      // Normalized (0-1)
    sensorY?: number;      // Normalized (0-1)
    canvasWidth?: number;
    canvasHeight?: number;
    z_min?: number;        // Normalized (0-1)
    z_max?: number;        // Normalized (0-1)
    opacity?: number;      // 0-1
}

const Boundary3DVolume: React.FC<Boundary3DVolumeProps> = ({
    x,
    y,
    width,
    height,
    wallHeight,
    color = '#3B82F6',
    sensorX,
    sensorY,
    canvasWidth = 800,
    canvasHeight = 800,
    z_min = 0,
    z_max = 1,
    opacity = 0.5
}) => {
    // Calculate vertical position and height based on z_min/z_max and wallHeight
    const bottomZ = z_min * wallHeight;
    const heightZ = (z_max - z_min) * wallHeight;

    return (
        <div
            className="drawing-boundary-3d"
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                height: height,
                backgroundColor: `${color}1A`,
                transform: `translateZ(${bottomZ}px)`,
                transformStyle: 'preserve-3d',
                pointerEvents: 'none',
            }}
        >
            {/* 1. Volumetric Glow Pulse (Matching Room3DBox) */}
            {sensorX !== undefined && sensorY !== undefined && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <div
                        className="room-glow-pulse"
                        style={{
                            width: '100%',
                            height: '100%',
                            background: `radial-gradient(circle at ${(sensorX * canvasWidth) - x}px ${(sensorY * canvasHeight) - y}px, ${color} 0%, transparent 50%, ${color} 70%, transparent 100%)`,
                            opacity: 0.6,
                            animation: `roomGlowPulse 2.5s ease-in-out infinite`,
                        } as React.CSSProperties}
                    />
                </div>
            )}

            {/* 2. Vertical Walls (Solid style) */}
            {/* North Wall */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: heightZ,
                backgroundColor: color, opacity: opacity * 0.4,
                transform: 'rotateX(-90deg)', transformOrigin: 'top'
            }} />
            {/* South Wall */}
            <div style={{
                position: 'absolute', top: height, left: 0, width: '100%', height: heightZ,
                backgroundColor: color, opacity: opacity * 0.4,
                transform: 'rotateX(-90deg)', transformOrigin: 'top'
            }} />
            {/* East Wall */}
            <div style={{
                position: 'absolute', top: 0, left: width, width: height, height: heightZ,
                backgroundColor: color, opacity: opacity * 0.4,
                transform: 'rotateX(-90deg) rotateY(90deg)', transformOrigin: 'top left'
            }} />
            {/* West Wall */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: height, height: heightZ,
                backgroundColor: color, opacity: opacity * 0.4,
                transform: 'rotateX(-90deg) rotateY(90deg)', transformOrigin: 'top left'
            }} />

            {/* 3. Top / Ceiling Layer */}
            <div style={{
                position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                border: `1px solid ${color}`,
                transform: `translateZ(${heightZ}px)`,
                backgroundColor: `${color}`, 
                opacity: opacity * 0.6
            }} />
            
            {/* 4. Bottom / Floor Layer */}
            <div style={{
                position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                border: `1px solid ${color}`,
                backgroundColor: `${color}`, 
                opacity: opacity * 0.2
            }} />
        </div>
    );
};

export default React.memo(Boundary3DVolume);
