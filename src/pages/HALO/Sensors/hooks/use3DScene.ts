import { useState, useCallback, useEffect, RefObject } from 'react';

interface Point {
    x: number;
    y: number;
}

interface Rotation {
    x: number;
    y: number;
}

export const use3DScene = (containerRef: RefObject<HTMLDivElement>, locked: boolean = false) => {
    const [rotation, setRotation] = useState<Rotation>({ x: 45, y: -30 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

    const [isDragging3D, setIsDragging3D] = useState(false);
    const [dragStart3D, setDragStart3D] = useState<Point>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

    const handleZoom = useCallback((delta: number) => {
        if (locked) return;
        setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
    }, [locked]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (locked) return;
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta));

        if (newZoom !== zoom) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const mouseX = e.clientX - (rect.left + rect.width / 2);
                const mouseY = e.clientY - (rect.top + rect.height / 2);
                const zoomFactor = newZoom / zoom;
                setPan(prev => ({
                    x: mouseX - (mouseX - prev.x) * zoomFactor,
                    y: mouseY - (mouseY - prev.y) * zoomFactor
                }));
            }
            setZoom(newZoom);
        }
    }, [zoom, containerRef, locked]);

    const handlePanStart = useCallback((e: React.MouseEvent) => {
        if (locked) return false;
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            e.preventDefault();
            return true;
        }
        return false;
    }, [pan.x, pan.y, locked]);

    const showView = useCallback((view: string) => {
        switch (view) {
            case 'back': setRotation({ x: 25, y: 180 }); break;
            case 'right': setRotation({ x: 25, y: -45 }); break;
            case 'left': setRotation({ x: 25, y: 45 }); break;
            case 'top': setRotation({ x: 75, y: 0 }); break;
            case 'bottom': setRotation({ x: -75, y: 0 }); break;
            case 'front': setRotation({ x: 20, y: 0 }); break;
            case 'perspective': setRotation({ x: 45, y: -30 }); break;
        }
    }, []);

    const resetPan = useCallback(() => {
        setPan({ x: 0, y: 0 });
    }, []);

    const resetView = useCallback(() => {
        setZoom(1);
        resetPan();
        showView('perspective');
    }, [showView, resetPan]);

    useEffect(() => {
        if (locked) {
            setIsPanning(false);
            return;
        }
        const handlePanMove = (e: MouseEvent) => {
            if (!isPanning) return;
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        };

        const handlePanEnd = () => setIsPanning(false);

        if (isPanning) {
            window.addEventListener('mousemove', handlePanMove);
            window.addEventListener('mouseup', handlePanEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handlePanMove);
            window.removeEventListener('mouseup', handlePanEnd);
        };
    }, [isPanning, panStart, locked]);

    useEffect(() => {
        if (locked) {
            setIsDragging3D(false);
            return;
        }
        const handleRotationMove = (e: MouseEvent) => {
            if (!isDragging3D) return;
            const deltaX = e.clientX - dragStart3D.x;
            const deltaY = e.clientY - dragStart3D.y;

            setRotation(prev => ({
                x: prev.x - deltaY * 0.5,  // Inverted: drag up → rotate up
                y: prev.y + deltaX * 0.5   // Inverted: drag left → rotate left
            }));
            setDragStart3D({ x: e.clientX, y: e.clientY });
        };

        const handleRotationEnd = () => setIsDragging3D(false);

        if (isDragging3D) {
            window.addEventListener('mousemove', handleRotationMove);
            window.addEventListener('mouseup', handleRotationEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleRotationMove);
            window.removeEventListener('mouseup', handleRotationEnd);
        };
    }, [isDragging3D, dragStart3D, locked]);

    return {
        rotation,
        setRotation,
        zoom,
        setZoom,
        pan,
        setPan,
        isDragging3D,
        setIsDragging3D,
        dragStart3D,
        setDragStart3D,
        isPanning,
        setIsPanning,
        handleZoom,
        handleWheel,
        handlePanStart,
        showView,
        resetView,
        resetPan
    };
};
