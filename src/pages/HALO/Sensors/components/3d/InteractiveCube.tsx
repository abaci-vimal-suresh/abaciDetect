import React from 'react';
import './InteractiveCube.scss';

interface Point {
    x: number;
    y: number;
}

interface InteractiveCubeProps {
    rotation: Point;
    zoom?: number; // Add zoom prop
    onRotationChange?: (rotation: Point) => void;
    onZoomChange?: (zoom: number) => void; // Add zoom change handler
}

const InteractiveCube: React.FC<InteractiveCubeProps> = ({
    rotation,
    zoom = 1,
    onRotationChange,
    onZoomChange
}) => {
    const isMouseDown = React.useRef(false);
    const hasDragged = React.useRef(false);
    const startPos = React.useRef({ x: 0, y: 0 });
    const lastPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isMouseDown.current = true;
        hasDragged.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    // Add wheel handler for zoom
    // Add wheel handler for zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta)); // Use same limits as main scene

        onZoomChange?.(newZoom);
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseDown.current) return;

            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                hasDragged.current = true;
            }

            if (!hasDragged.current) return;

            const deltaX = e.clientX - lastPos.current.x;
            const deltaY = e.clientY - lastPos.current.y;

            lastPos.current = { x: e.clientX, y: e.clientY };

            onRotationChange?.({
                x: Math.max(-90, Math.min(90, rotation.x - deltaY * 0.5)),
                y: (rotation.y + deltaX * 0.5) % 360
            });
        };

        const handleMouseUp = () => {
            isMouseDown.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [rotation, onRotationChange]);

    const handleFaceClick = (e: React.MouseEvent, face: string) => {
        if (hasDragged.current) return;
        e.stopPropagation();

        let targetRotation = { x: 0, y: 0 };

        switch (face) {
            case 'FRONT':
                targetRotation = { x: 20, y: 0 };
                break;
            case 'BACK':
                targetRotation = { x: 25, y: 180 };
                break;
            case 'LEFT':
                targetRotation = { x: 25, y: 45 };
                break;
            case 'RIGHT':
                targetRotation = { x: 25, y: -45 };
                break;
            case 'TOP':
                targetRotation = { x: 75, y: 0 };
                break;
            case 'BOTTOM':
                targetRotation = { x: -75, y: 0 };
                break;
            default:
                return;
        }

        onRotationChange?.(targetRotation);
    };

    // Apply both rotation and zoom
    const cubeTransform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;

    return (
        <div
            className="interactive-cube-container"
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
        >
            <div className="cube-loader" style={{ transform: cubeTransform }}>
                <div className="cube-wrapper">
                    <div className="cube-face front" onClick={(e) => handleFaceClick(e, 'FRONT')}>FRONT</div>
                    <div className="cube-face back" onClick={(e) => handleFaceClick(e, 'BACK')}>BACK</div>
                    <div className="cube-face right" onClick={(e) => handleFaceClick(e, 'RIGHT')}>RIGHT</div>
                    <div className="cube-face left" onClick={(e) => handleFaceClick(e, 'LEFT')}>LEFT</div>
                    <div className="cube-face top" onClick={(e) => handleFaceClick(e, 'TOP')}>TOP</div>
                    <div className="cube-face bottom" onClick={(e) => handleFaceClick(e, 'BOTTOM')}>BOTTOM</div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveCube;