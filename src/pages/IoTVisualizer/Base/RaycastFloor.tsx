import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { UseWallDrawingReturn } from '../hooks/useWallDrawing';

interface RaycastFloorProps {
    fw: number;
    fd: number;
    floorY: number;
    drawing: UseWallDrawingReturn;
    isPlacing?: boolean;
    onSensorPlaced?: (nx: number, ny: number) => void;
    onUpdatePlacementPreview?: (nx: number, ny: number) => void;
}

const RaycastFloor: React.FC<RaycastFloorProps> = ({
    fw, fd, floorY, drawing,
    isPlacing = false, onSensorPlaced, onUpdatePlacementPreview
}) => {
    const isDrawingRef = useRef(false);
    const isClosedRef = useRef(false);
    const lastClickTime = useRef(0);
    const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        isDrawingRef.current = drawing.isDrawing;
        isClosedRef.current = drawing.isShapeClosed;
    }, [drawing.isDrawing, drawing.isShapeClosed]);

    useEffect(() => () => {
        if (clickTimer.current) clearTimeout(clickTimer.current);
    }, []);

    const toNorm = (pt: THREE.Vector3) => ({
        nx: (pt.x + fw / 2) / fw,
        ny: (pt.z + fd / 2) / fd,
    });

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, floorY + 0.05, 0]}
            onPointerMove={e => {
                e.stopPropagation();
                const { nx, ny } = toNorm((e as any).point);

                if (isDrawingRef.current && !isClosedRef.current) {
                    drawing.updatePreview(nx, ny);
                } else if (isPlacing) {
                    onUpdatePlacementPreview?.(nx, ny);
                }
            }}
            onPointerDown={e => {
                e.stopPropagation();
                const { nx, ny } = toNorm((e as any).point);

                if (isPlacing) {
                    onSensorPlaced?.(nx, ny);
                    return;
                }

                if (!isDrawingRef.current || isClosedRef.current) return;

                const now = Date.now();
                const delta = now - lastClickTime.current;
                lastClickTime.current = now;

                if (delta < 300) {
                    if (clickTimer.current) {
                        clearTimeout(clickTimer.current);
                        clickTimer.current = null;
                    }
                    drawing.finishDrawing();
                    return;
                }
                clickTimer.current = setTimeout(() => {
                    drawing.addPoint(nx, ny);
                    clickTimer.current = null;
                }, 310);
            }}
        >
            <planeGeometry args={[fw, fd]} />
            <meshBasicMaterial transparent opacity={0}
                depthWrite={false} colorWrite={false}
                side={THREE.DoubleSide} />
        </mesh>
    );
};

export default RaycastFloor;
