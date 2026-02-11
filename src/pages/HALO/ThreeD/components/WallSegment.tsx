import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MeshPhysicalMaterial } from 'three';
import { Wall } from '../../../../types/sensor';
import { transformWallTo3D, FloorCalibration } from '../utils/coordinateTransform';

interface WallSegmentProps {
    wall: Wall;
    calibration: FloorCalibration;
    floorY: number;
    isSelected?: boolean;
    isHovered?: boolean;
}

export const WallSegment: React.FC<WallSegmentProps> = ({
    wall,
    calibration,
    floorY,
    isSelected = false,
    isHovered = false
}) => {
    const { position, rotation, size } = useMemo(() =>
        transformWallTo3D(wall, calibration, floorY),
        [wall, calibration, floorY]);

    // Material properties based on wall opacity and color
    const isGlass = (wall.opacity ?? 1) < 0.8;
    const baseColor = wall.color || (isGlass ? '#a5d8ff' : '#ffffff');
    const opacity = wall.opacity ?? 0.7;

    return (
        <mesh position={position} rotation={rotation} castShadow receiveShadow>
            <boxGeometry args={size} />
            <meshPhysicalMaterial
                color={baseColor}
                transparent={true}
                opacity={opacity}
                metalness={isGlass ? 0.1 : 0}
                roughness={isGlass ? 0.15 : 0.5}
                transmission={isGlass ? 0.6 : 0}
                thickness={wall.thickness ?? 0.15}
                ior={1.5}
                clearcoat={1.0}
                envMapIntensity={1.0}
                emissive={isSelected || isHovered ? baseColor : '#000000'}
                emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.2 : 0}
            />

            {/* Edge Glow for selected/hovered walls */}
            {(isSelected || isHovered) && (
                <mesh scale={[1.002, 1.002, 1.05]}>
                    <boxGeometry args={size} />
                    <meshBasicMaterial
                        color={baseColor}
                        wireframe
                        transparent
                        opacity={isSelected ? 0.8 : 0.4}
                    />
                </mesh>
            )}
        </mesh>
    );
};
