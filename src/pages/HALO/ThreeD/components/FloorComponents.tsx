import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useGLTF, useAnimations, PivotControls, useTexture } from '@react-three/drei';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, Box3, Vector3, TextureLoader } from 'three';
import * as THREE from 'three';

import { FloorImagePlane } from './FloorImagePlane';

interface FloorModelProps {
    floorLevel: number;
    areaId?: number; // Area ID for raycasting identification
    floorSpacing?: number;
    yPosition?: number;
    visible?: boolean;
    opacity?: number;
    onLoad?: (calibration: any) => void;
    centerModel?: boolean;
    modelUrl?: string;
    onClick?: (event: any) => void;
    onPointerMove?: (event: any) => void;
}

export function FloorModel({
    floorLevel,
    areaId,
    floorSpacing = 3.5,
    yPosition,
    visible = true,
    opacity = 1,
    onLoad,
    centerModel = false,
    modelUrl = '/floor_tiles.glb',
    onClick,
    onPointerMove
}: FloorModelProps) {
    const [calibrated, setCalibrated] = useState(false);
    const [offset, setOffset] = useState(new THREE.Vector3(0, 0, 0));

    // Detect if modelUrl is an image
    const isImage = useMemo(() => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
        return imageExtensions.some(ext => modelUrl.toLowerCase().endsWith(ext)) ||
            modelUrl.includes('data:image');
    }, [modelUrl]);

    // Use a transparent pixel as fallback for texture to avoid loading errors
    const TEXTURE_FALLBACK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    // NOTE: useGLTF and useTexture should always be called with a valid string or it might suspend
    const gltf = useGLTF(isImage ? '/floor_tiles.glb' : modelUrl) as any;
    const texture = useTexture(isImage ? modelUrl : TEXTURE_FALLBACK) as any;

    // Use provided yPosition or calculate from lower floorLevel
    const floorY = yPosition !== undefined ? yPosition : floorLevel * floorSpacing;

    // Run calibration once model/image is loaded
    useEffect(() => {
        if (!calibrated) {
            if (isImage && texture) {
                // For images, we use a default "Large" size to ensure sensors fit
                // We also give it a simulated "Height" (like room height) so boundaries have volume
                const IMAGE_SIZE = 30; // 30 meters
                const IMAGE_HEIGHT = 2.4; // standard room height
                const size = new THREE.Vector3(IMAGE_SIZE, IMAGE_HEIGHT, IMAGE_SIZE);
                const min = new THREE.Vector3(-IMAGE_SIZE / 2, 0, -IMAGE_SIZE / 2);
                const center = new THREE.Vector3(0, 0, 0);

                if (centerModel) {
                    setOffset(new THREE.Vector3(0, 0, 0)); // Already centered
                }

                if (onLoad) {
                    onLoad({
                        width: size.x,
                        depth: size.z,
                        height: size.y,
                        minX: min.x,
                        minZ: min.z,
                        minY: min.y,
                        centerX: center.x,
                        centerZ: center.z
                    });
                }
                setCalibrated(true);
            } else if (!isImage && gltf) {
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                if (centerModel) {
                    setOffset(new THREE.Vector3(-center.x, -box.min.y, -center.z));
                }

                if (onLoad) {
                    onLoad({
                        width: size.x,
                        depth: size.z,
                        height: size.y,
                        minX: box.min.x,
                        minZ: box.min.z,
                        minY: box.min.y,
                        centerX: center.x,
                        centerZ: center.z
                    });
                }
                setCalibrated(true);
            }
        }
    }, [gltf, texture, isImage, calibrated, onLoad, centerModel]);

    if (!gltf && !texture) return null;

    return (
        <group position={[0, floorY, 0]} visible={visible}>
            {isImage ? (
                <FloorImagePlane
                    imageUrl={modelUrl}
                    floorLevel={0} // Positioned by the parent group
                    areaId={areaId} // Pass for raycasting
                    floorSpacing={0}
                    centerModel={centerModel}
                    visible={visible}
                    opacity={opacity}
                    edgeGlowIntensity={0.05}
                    onClick={onClick}
                    onPointerMove={onPointerMove}
                />
            ) : (
                <primitive
                    object={gltf.scene.clone()}
                    position={centerModel ? [offset.x, offset.y, offset.z] : [0, 0, 0]}
                />
            )}
        </group>
    );
}

/**
 * Get bounding box dimensions of a floor mesh
 * Used for coordinate calibration
 */
export function useFloorBounds(floorMesh: Mesh | null) {
    return useMemo(() => {
        if (!floorMesh) return null;

        const boundingBox = new Box3().setFromObject(floorMesh);
        const size = new Vector3();
        boundingBox.getSize(size);

        return {
            width: size.x,
            depth: size.z,
            height: size.y,
            minX: boundingBox.min.x,
            minZ: boundingBox.min.z,
            minY: boundingBox.min.y,
            center: boundingBox.getCenter(new Vector3())
        };
    }, [floorMesh]);
}

interface SensorMarkerProps {
    position: [number, number, number];
    status?: 'safe' | 'warning' | 'critical';
    onClick?: () => void;
    onHover?: (hovered: boolean) => void;
    scale?: number;
    sensorName?: string;
    hasBoundary?: boolean;
    onDrag?: (newPos: [number, number, number]) => void;
    isSelected?: boolean;
}

/**
 * SensorMarker - 3D sensor visualization with volumetric light beam
 */
export function SensorMarker({
    position,
    status = 'critical',
    onClick,
    onHover,
    scale = 1,
    sensorName,
    hasBoundary = false,
    onDrag,
    isSelected = false
}: SensorMarkerProps) {
    const meshRef = useRef<Mesh>(null);
    const lightRef = useRef<THREE.SpotLight>(null);
    const beamRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = React.useState(false);

    // // Animation for pulsation
    // useFrame(({ clock }: any) => {
    //     const t = clock.getElapsedTime();
    //     const pulse = (Math.sin(t * 2) + 1) / 2; // 0 to 1

    //     if (beamRef.current && !hasBoundary) {
    //         (beamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + pulse * 0.2;
    //     }
    //     if (lightRef.current) {
    //         lightRef.current.intensity = 5 + pulse * 10;
    //     }
    // });

    const statusColors = {
        safe: '#10B981',
        warning: '#F59E0B',
        critical: '#EF4444'
    };

    const color = statusColors[status];

    // Load custom sensor model
    const gltf = useGLTF('/hemi_sphere.glb') as any;

    // Memoize the tinted scene
    const tintedScene = useMemo(() => {
        if (!gltf) return null;
        const scene = gltf.scene.clone();
        scene.traverse((node: any) => {
            if (node.isMesh) {
                node.material = node.material.clone();
                node.material.color.set(color);
                node.material.emissive.set(color);
                node.material.emissiveIntensity = 2.0;
                node.frustumCulled = false;
            }
        });
        return scene;
    }, [gltf, color]);

    return (
        <group position={position}>
            <PivotControls
                anchor={[0, 0, 0]}
                depthTest={false}
                scale={75} // Pixel based when fixed=true
                lineWidth={3}
                fixed={true}
                disableRotations={false} // Enable rotation handles as shown in diagram
                disableAxes={false}
                disableSliders={false}
                visible={isSelected}
                activeAxes={[true, false, true]} // Maintain horizontal dragging constraint
                onDrag={(local) => {
                    // Extract position from the matrix
                    const pos = new THREE.Vector3();
                    pos.setFromMatrixPosition(local);
                    // Pass the new global position (offset by the group's position)
                    onDrag?.([
                        position[0] + pos.x,
                        position[1] + pos.y,
                        position[2] + pos.z
                    ]);
                }}
            >
                {/* Volumetric SpotLight */}
                <spotLight
                    ref={lightRef}
                    position={[0, 0, 0]}
                    angle={0.6}
                    penumbra={0.5}
                    intensity={10}
                    color={color}
                    castShadow
                    target-position={[0, -20, 0]} // Points downward toward boundary
                />


                {tintedScene ? (
                    <primitive
                        object={tintedScene}
                        scale={scale}
                        frustumCulled={false}
                        onClick={onClick}
                        onPointerOver={(e: any) => {
                            e.stopPropagation();
                            setHovered(true);
                            onHover?.(true);
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            onHover?.(false);
                        }}
                    />
                ) : (
                    <mesh ref={meshRef} onClick={onClick}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
                    </mesh>
                )}

                {/* Pulse effect for all sensors now to show activity */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                    <ringGeometry args={[scale * 0.5, scale * 0.7, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>
            </PivotControls>
        </group>
    );
}

// Preload the models
useGLTF.preload('/floor_tiles.glb');
useGLTF.preload('/sensor.glb');

