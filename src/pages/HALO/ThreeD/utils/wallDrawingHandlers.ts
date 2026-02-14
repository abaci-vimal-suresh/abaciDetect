import * as THREE from 'three';
import { Wall } from '../../../../types/sensor';
import { transform3DToNormalized, FloorCalibration } from './coordinateTransform';

/**
 * Wall drawing handlers for raycasting-based wall creation
 */

export interface WallDrawingHandlers {
    handleFloorClick: (event: any) => void;
    handleFloorPointerMove: (event: any) => void;
}

export interface FirstPoint {
    x: number;
    y: number;
    z: number;
    floorY: number;
    areaId: number;
}

export function createWallDrawingHandlers(
    wallDrawMode: boolean,
    isCalibrated: boolean,
    firstPoint: FirstPoint | null,
    setFirstPoint: (point: FirstPoint | null) => void,
    previewEndPoint: { x: number, y: number, z: number } | null,
    setPreviewEndPoint: (point: { x: number, y: number, z: number } | null) => void,
    actualCalibration: FloorCalibration,
    onWallCreated?: (wall: Partial<Wall>) => void
): WallDrawingHandlers {

    const handleFloorClick = (event: any) => {
        if (!wallDrawMode || !isCalibrated) return;
        event.stopPropagation();

        const point3D = event.point;
        const clickedMesh = event.object;
        const areaId = clickedMesh.userData?.areaId;

        if (!areaId) return;

        if (!firstPoint) {
            // First click - store point
            setFirstPoint({
                x: point3D.x,
                y: point3D.y,
                z: point3D.z,
                floorY: point3D.y,
                areaId: areaId
            });
        } else {
            // Second click - validate same floor and create wall
            if (Math.abs(point3D.y - firstPoint.floorY) < 0.5) {
                const normalized1 = transform3DToNormalized(
                    { x: firstPoint.x, y: firstPoint.y, z: firstPoint.z },
                    actualCalibration,
                    firstPoint.floorY
                );
                const normalized2 = transform3DToNormalized(
                    { x: point3D.x, y: point3D.y, z: point3D.z },
                    actualCalibration,
                    point3D.y
                );

                const newWall: Partial<Wall> = {
                    r_x1: normalized1.x,
                    r_y1: normalized1.y,
                    r_x2: normalized2.x,
                    r_y2: normalized2.y,
                    r_height: 2.4,
                    r_z_offset: 0,
                    color: '#ffffff',
                    opacity: 0.7,
                    thickness: 0.15,
                    area_ids: [areaId]
                };

                onWallCreated?.(newWall);
                setFirstPoint(null);
                setPreviewEndPoint(null);
            } else {
                console.warn('Walls must be on the same floor!');
                setFirstPoint(null);
                setPreviewEndPoint(null);
            }
        }
    };

    const handleFloorPointerMove = (event: any) => {
        if (!wallDrawMode || !firstPoint || !isCalibrated) {
            if (previewEndPoint) setPreviewEndPoint(null);
            return;
        }
        event.stopPropagation();
        const point3D = event.point;
        if (Math.abs(point3D.y - firstPoint.floorY) < 0.5) {
            setPreviewEndPoint({ x: point3D.x, y: point3D.y, z: point3D.z });
        } else {
            if (previewEndPoint) setPreviewEndPoint(null);
        }
    };

    return {
        handleFloorClick,
        handleFloorPointerMove
    };
}
