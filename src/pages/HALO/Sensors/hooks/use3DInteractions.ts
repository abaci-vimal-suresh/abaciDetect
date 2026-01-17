import { useState, useCallback, useEffect } from 'react';

interface Point {
    x: number;
    y: number;
}

interface Boundary {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Use3DInteractionsProps {
    editMode: boolean;
    zoom: number;
    rotationY: number;
    canvasDimensions: { width: number; height: number };
    sensorMarkers: any[];
    selectedSensor: string | null;
    selectedSensorBoundary: any | null; // Added
    setSelectedSensor: (id: string | null) => void;
    projectTo3DFloor: (clientX: number, clientY: number) => Point | null;
    onSensorDrop?: (id: string, x: number, y: number) => void;
    onBoundaryUpdate?: (id: string, boundary: any) => void;
}

export const use3DInteractions = ({
    editMode,
    zoom,
    rotationY,
    canvasDimensions,
    sensorMarkers,
    selectedSensor,
    selectedSensorBoundary,
    setSelectedSensor,
    projectTo3DFloor,
    onSensorDrop,
    onBoundaryUpdate
}: Use3DInteractionsProps) => {
    const [isDragging3DSensor, setIsDragging3DSensor] = useState<string | null>(null);
    const [localDraggedSensorPos, setLocalDraggedSensorPos] = useState<{ id: string; x: number; y: number } | null>(null);
    const [isDrawingBoundary3D, setIsDrawingBoundary3D] = useState(false);
    const [isResizingBoundary3D, setIsResizingBoundary3D] = useState<string | null>(null); // 'n' | 's' | 'e' | 'w' | 'ne' | ...
    const [boundaryStart3D, setBoundaryStart3D] = useState<Point | null>(null);
    const [sensorBoundary, setSensorBoundary] = useState<Boundary | null>(null); // This is pixels for drawing preview
    const [dragStart3D, setDragStart3D] = useState<Point>({ x: 0, y: 0 });

    const handleSensorMouseDown3D = useCallback((e: React.MouseEvent, sensorId: string) => {
        if (!editMode) return;

        // Always select when clicking
        setSelectedSensor(sensorId);
        e.stopPropagation();

        // If user wants to drag the sensor
        setIsDragging3DSensor(sensorId);
        setDragStart3D({ x: e.clientX, y: e.clientY });
    }, [editMode, setSelectedSensor]);

    const handleFloorMouseDown3D = useCallback((e: React.MouseEvent) => {
        if (!editMode || !selectedSensor) return;

        const pos = projectTo3DFloor(e.clientX, e.clientY);
        if (!pos) return;

        // Check for resizing existing boundary
        if (selectedSensorBoundary) {
            const b = selectedSensorBoundary;
            const threshold = 0.03; // 3% margin

            let handle = '';
            if (Math.abs(pos.y - b.y_min) < threshold) handle += 'n';
            else if (Math.abs(pos.y - b.y_max) < threshold) handle += 's';

            if (Math.abs(pos.x - b.x_min) < threshold) handle += 'w';
            else if (Math.abs(pos.x - b.x_max) < threshold) handle += 'e';

            if (handle) {
                setIsResizingBoundary3D(handle);
                setBoundaryStart3D(pos);
                // Initialize local preview with existing boundary
                setSensorBoundary({
                    x: b.x_min * canvasDimensions.width,
                    y: b.y_min * canvasDimensions.height,
                    width: (b.x_max - b.x_min) * canvasDimensions.width,
                    height: (b.y_max - b.y_min) * canvasDimensions.height
                });
                e.stopPropagation();
                return;
            }
        }

        // Default: Start fresh drawing
        setIsDrawingBoundary3D(true);
        setBoundaryStart3D(pos);
        setSensorBoundary(null);
        e.stopPropagation();
    }, [editMode, selectedSensor, selectedSensorBoundary, projectTo3DFloor, canvasDimensions]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingBoundary3D && boundaryStart3D && selectedSensorBoundary) {
                const pos = projectTo3DFloor(e.clientX, e.clientY);
                if (!pos) return;

                const b = selectedSensorBoundary;
                let newXmin = b.x_min;
                let newXmax = b.x_max;
                let newYmin = b.y_min;
                let newYmax = b.y_max;

                if (isResizingBoundary3D.includes('n')) newYmin = pos.y;
                if (isResizingBoundary3D.includes('s')) newYmax = pos.y;
                if (isResizingBoundary3D.includes('w')) newXmin = pos.x;
                if (isResizingBoundary3D.includes('e')) newXmax = pos.x;

                // Ensure min < max
                const xMin = Math.min(newXmin, newXmax);
                const xMax = Math.max(newXmin, newXmax);
                const yMin = Math.min(newYmin, newYmax);
                const yMax = Math.max(newYmin, newYmax);

                setSensorBoundary({
                    x: xMin * canvasDimensions.width,
                    y: yMin * canvasDimensions.height,
                    width: (xMax - xMin) * canvasDimensions.width,
                    height: (yMax - yMin) * canvasDimensions.height
                });
                return;
            }

            if (isDrawingBoundary3D && boundaryStart3D) {
                const pos = projectTo3DFloor(e.clientX, e.clientY);
                if (pos) {
                    const x = Math.min(boundaryStart3D.x, pos.x);
                    const y = Math.min(boundaryStart3D.y, pos.y);
                    const width = Math.abs(pos.x - boundaryStart3D.x);
                    const height = Math.abs(pos.y - boundaryStart3D.y);

                    setSensorBoundary({
                        x: x * canvasDimensions.width,
                        y: y * canvasDimensions.height,
                        width: width * canvasDimensions.width,
                        height: height * canvasDimensions.height
                    });
                }
                return;
            }

            if (isDragging3DSensor) {
                const pos = projectTo3DFloor(e.clientX, e.clientY);
                if (pos) {
                    setLocalDraggedSensorPos({
                        id: isDragging3DSensor,
                        x: Math.max(0, Math.min(1, pos.x)),
                        y: Math.max(0, Math.min(1, pos.y))
                    });
                }
            }
        };

        const handleMouseUp = () => {
            if ((isDrawingBoundary3D || isResizingBoundary3D) && sensorBoundary && selectedSensor) {
                const normalizedBoundary = {
                    x_min: sensorBoundary.x / canvasDimensions.width,
                    x_max: (sensorBoundary.x + sensorBoundary.width) / canvasDimensions.width,
                    y_min: sensorBoundary.y / canvasDimensions.height,
                    y_max: (sensorBoundary.y + sensorBoundary.height) / canvasDimensions.height,
                    z_min: 0,
                    z_max: 1
                };
                onBoundaryUpdate?.(selectedSensor, normalizedBoundary);
                setSensorBoundary(null);
            }

            if (isDragging3DSensor && localDraggedSensorPos) {
                onSensorDrop?.(isDragging3DSensor, localDraggedSensorPos.x, localDraggedSensorPos.y);
            }

            setIsDragging3DSensor(null);
            setLocalDraggedSensorPos(null);
            setIsDrawingBoundary3D(false);
            setIsResizingBoundary3D(null);
            setBoundaryStart3D(null);
        };

        if (isDragging3DSensor || isDrawingBoundary3D || isResizingBoundary3D) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging3DSensor, isDrawingBoundary3D, isResizingBoundary3D, boundaryStart3D, rotationY, zoom, sensorMarkers, localDraggedSensorPos, projectTo3DFloor, canvasDimensions, selectedSensor, selectedSensorBoundary, onBoundaryUpdate, onSensorDrop]);

    return {
        handleSensorMouseDown3D,
        handleFloorMouseDown3D,
        isDragging3DSensor,
        localDraggedSensorPos,
        isDrawingBoundary3D,
        isResizingBoundary3D,
        sensorBoundary,
        setDragStart3D,
        setIsDrawingBoundary3D,
        setBoundaryStart3D
    };
};
