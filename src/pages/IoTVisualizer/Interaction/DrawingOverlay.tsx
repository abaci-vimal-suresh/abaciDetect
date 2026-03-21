import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { UseWallDrawingReturn } from '../../../hooks/useWallDrawing';
import WallSegment from '../Elements/WallSegment';

interface DrawingOverlayProps {
    drawing: UseWallDrawingReturn;
    fw: number;
    fd: number;
}

const DrawingOverlay: React.FC<DrawingOverlayProps> = ({ drawing, fw, fd }) => {
    const { anchorPoints, points, previewPoint, arcPreviewWall, isDrawing } = drawing;

    const previewPts = useMemo((): [number, number, number][] => {
        if (!isDrawing || anchorPoints.length === 0 || !previewPoint) return [];
        const last = anchorPoints[anchorPoints.length - 1];
        return [
            [last.nx * fw - fw / 2, 0.18, last.ny * fd - fd / 2],
            [previewPoint.nx * fw - fw / 2, 0.18, previewPoint.ny * fd - fd / 2],
        ];
    }, [anchorPoints, previewPoint, isDrawing, fw, fd]);

    if (!isDrawing) return null;

    return (
        <group>
            {anchorPoints.map((p, i) => (
                <mesh key={`a-${i}`}
                    position={[p.nx * fw - fw / 2, 0.22, p.ny * fd - fd / 2]}
                    renderOrder={8}>
                    <sphereGeometry args={[0.18, 12, 12]} />
                    <meshStandardMaterial color="#f0c040"
                        emissive="#f0c040" emissiveIntensity={1.2} />
                </mesh>
            ))}
            {points.map((p, i) => (
                <mesh key={`p-${i}`}
                    position={[p.nx * fw - fw / 2, 0.22, p.ny * fd - fd / 2]}
                    renderOrder={8}>
                    <sphereGeometry args={[0.13, 10, 10]} />
                    <meshStandardMaterial color="#48cae4"
                        emissive="#48cae4" emissiveIntensity={1.0} />
                </mesh>
            ))}
            {previewPts.length === 2 && (
                <Line points={previewPts} color="#ffea00"
                    lineWidth={1.5} dashed
                    dashSize={0.35} gapSize={0.18}
                    renderOrder={7} />
            )}
            {arcPreviewWall && (
                <WallSegment
                    wall={arcPreviewWall}
                    fw={fw} fd={fd} floorY={0} isPreview />
            )}
        </group>
    );
};

export default DrawingOverlay;
