import { useCallback, RefObject } from 'react';

interface Point {
    x: number;
    y: number;
}

export const useCoordinateProjection = (
    containerRef: RefObject<HTMLDivElement>,
    pan: Point,
    zoom: number,
    rotationY: number,
    canvasDimensions: { width: number; height: number }
) => {
    const projectTo3DFloor = useCallback((clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return null;

        // 1. Mouse relative to center
        const mouseX = clientX - (rect.left + rect.width / 2);
        const mouseY = clientY - (rect.top + rect.height / 2);

        // 2. Remove Pan/Zoom
        const unpannedX = mouseX - pan.x;
        const unpannedY = mouseY - pan.y;
        const unzoomedX = unpannedX / (zoom * canvasDimensions.width);
        const unzoomedY = unpannedY / (zoom * canvasDimensions.height);

        // 3. De-rotate based on the camera Y rotation
        const rad = rotationY * (Math.PI / 180);
        const finalX = (unzoomedX * Math.cos(rad) + unzoomedY * Math.sin(rad)) + 0.5;
        const finalY = (unzoomedY * Math.cos(rad) - unzoomedX * Math.sin(rad)) + 0.5;

        return {
            x: Math.max(0, Math.min(1, finalX)),
            y: Math.max(0, Math.min(1, finalY))
        };

    }, [containerRef, pan.x, pan.y, zoom, rotationY, canvasDimensions]);

    return { projectTo3DFloor };
};
