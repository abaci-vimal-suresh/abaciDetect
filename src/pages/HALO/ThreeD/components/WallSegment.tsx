import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PivotControls } from '@react-three/drei';
import { Wall } from '../../../../types/sensor';
import { transformWallTo3D, FloorCalibration } from '../utils/coordinateTransform';

interface WallSegmentProps {
    wall: Wall;
    calibration: FloorCalibration;
    floorY: number;
    isSelected?: boolean;
    isHovered?: boolean;
    isBlinking?: boolean;
    onClick?: (wall: Wall) => void;
    onHover?: (hovered: boolean) => void;
    onDrag?: (delta: { x: number, y: number, z: number }) => void;
}

export const WallSegment: React.FC<WallSegmentProps> = ({
    wall,
    calibration,
    floorY,
    isSelected = false,
    isHovered = false,
    isBlinking = false,
    onClick,
    onHover,
    onDrag
}) => {
    const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

    const { position, rotation, size } = useMemo(() =>
        transformWallTo3D(wall, calibration, floorY),
        [wall, calibration, floorY]);

    // Material properties based on wall opacity and color
    const isGlass = (wall.opacity ?? 1) < 0.8;
    const baseColor = wall.color || (isGlass ? '#a5d8ff' : '#ffffff');
    const opacity = wall.opacity ?? 0.7;

    // Handle blinking effect
    useFrame((state) => {
        if (!materialRef.current) return;
        if (isBlinking) {
            // Pulse emissive intensity between 0.1 and 0.8
            const pulse = 0.45 + Math.sin(state.clock.elapsedTime * 8) * 0.35;
            materialRef.current.emissiveIntensity = pulse;
            materialRef.current.emissive.set(baseColor);
        } else {
            // Standard selection/hover highlighting
            materialRef.current.emissiveIntensity = isSelected ? 0.5 : isHovered ? 0.2 : 0;
            materialRef.current.emissive.set(isSelected || isHovered ? baseColor : '#000000');
        }
    });

    return (
        <group>
            <PivotControls
                anchor={[0, 0, 0]}
                depthTest={false}
                scale={75}
                lineWidth={3}
                fixed={true}
                visible={isSelected}
                activeAxes={[true, true, true]} // Allow all horizontal movements
                onDrag={(local) => {
                    const pos = new THREE.Vector3();
                    pos.setFromMatrixPosition(local);
                    // Pass the delta movement
                    onDrag?.({ x: pos.x, y: pos.y, z: pos.z });
                }}
            >
                <mesh
                    position={position}
                    rotation={rotation}
                    castShadow
                    receiveShadow
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.(wall);
                    }}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        onHover?.(true);
                    }}
                    onPointerOut={() => {
                        onHover?.(false);
                    }}
                >
                    <boxGeometry args={size} />
                    <meshPhysicalMaterial
                        ref={materialRef}
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
                    />

                    {/* Edge Glow for selected/hovered/blinking walls */}
                    {(isSelected || isHovered || isBlinking) && (
                        <mesh scale={[1.002, 1.002, 1.05]}>
                            <boxGeometry args={size} />
                            <meshBasicMaterial
                                color={baseColor}
                                wireframe
                                transparent
                                opacity={isBlinking || isSelected ? 0.8 : 0.4}
                            />
                        </mesh>
                    )}
                </mesh>
            </PivotControls>
        </group>
    );
};
