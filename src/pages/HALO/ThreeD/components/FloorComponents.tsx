import React, { useRef, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Mesh, Box3, Vector3 } from 'three';
import * as THREE from 'three';

interface FloorModelProps {
    floorLevel: number;
    floorSpacing?: number;
    visible?: boolean;
    opacity?: number;
    onLoad?: (calibration: any) => void;
    centerModel?: boolean;
    modelUrl?: string;
}


export function FloorModel({
    floorLevel,
    floorSpacing = 4,
    visible = true,
    opacity = 1,
    onLoad,
    centerModel = false,
    modelUrl = '/floor_tiles.glb'
}: FloorModelProps) {
    const gltf = useGLTF(modelUrl) as any;
    const meshRef = useRef<THREE.Group>(null);
    const [calibrated, setCalibrated] = React.useState(false);
    const [offset, setOffset] = React.useState(new THREE.Vector3(0, 0, 0));

    // Calculate Y position based on floor level
    const yPosition = floorLevel * floorSpacing;

    // Run calibration once model is loaded
    React.useEffect(() => {
        if (gltf && !calibrated) {
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
    }, [gltf, calibrated, onLoad, centerModel]);

    if (!gltf) return null;

    return (
        <group position={[0, yPosition, 0]} visible={visible}>
            <primitive
                object={gltf.scene.clone()}
                position={centerModel ? [offset.x, offset.y, offset.z] : [0, 0, 0]}
            >
                {/* Apply opacity to children if needed */}
            </primitive>
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
    hasBoundary = false
}: SensorMarkerProps) {
    const meshRef = useRef<Mesh>(null);
    const lightRef = useRef<THREE.SpotLight>(null);
    const beamRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = React.useState(false);

    // Animation for pulsation
    useFrame(({ clock }: any) => {
        const t = clock.getElapsedTime();
        const pulse = (Math.sin(t * 2) + 1) / 2; // 0 to 1

        if (beamRef.current && !hasBoundary) {
            (beamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + pulse * 0.2;
        }
        if (lightRef.current) {
            lightRef.current.intensity = 5 + pulse * 10;
        }
    });

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

            {/* Visual Light Beam (Cone) - Only if NO boundary */}
            {!hasBoundary && (
                <mesh ref={beamRef} position={[0, -5, 0]} rotation={[0, 0, 0]}>
                    <coneGeometry args={[2, 10, 32, 1, true]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.15}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

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
                <ringGeometry args={[0.5, 0.7, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

interface BoundaryBoxProps {
    position: [number, number, number];
    size: [number, number, number];
    color?: string;
    opacity?: number;
    visible?: boolean;
}

/**
 * BoundaryBox - Transparent pulsating light volume showing sensor coverage
 */
export function BoundaryBox({
    position,
    size,
    color = '#10B981',
    opacity = 0.2,
    visible = true
}: BoundaryBoxProps) {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame(({ clock }: any) => {
        if (materialRef.current) {
            const t = clock.getElapsedTime();
            const pulse = (Math.sin(t * 3) + 1) / 2; // Faster pulse for boundaries
            materialRef.current.emissiveIntensity = 0.5 + pulse * 1.5;
            materialRef.current.opacity = 0.1 + pulse * 0.3;

            if (lightRef.current) {
                lightRef.current.intensity = 2 + pulse * 4;
            }
        }
    });

    if (!visible) return null;

    return (
        <group position={position}>
            {/* Internal light source for the volume */}
            <pointLight
                ref={lightRef}
                color={color}
                distance={Math.max(...size) * 2}
                decay={2}
                intensity={3}
            />

            {/* Main Light Volume */}
            <mesh>
                <boxGeometry args={size} />
                <meshStandardMaterial
                    ref={materialRef}
                    color={color}
                    transparent
                    opacity={opacity}
                    emissive={color}
                    emissiveIntensity={1.0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending} // Makes it look more like light
                />
            </mesh>

            {/* Subtle Core Glow */}
            <mesh scale={0.95}>
                <boxGeometry args={size} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
                <lineBasicMaterial color={color} opacity={0.4} transparent />
            </lineSegments>
        </group>
    );
}

// Preload the models
useGLTF.preload('/floor_tiles.glb');
useGLTF.preload('/sensor.glb');

