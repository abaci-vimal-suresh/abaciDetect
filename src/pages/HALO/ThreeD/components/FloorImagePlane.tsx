import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { TextureLoader } from 'three';
import * as THREE from 'three';

interface FloorImagePlaneProps {
    // Required props
    imageUrl: string;
    floorLevel: number;

    // Positioning & sizing
    floorSpacing?: number;
    centerModel?: boolean;

    // Visibility controls
    visible?: boolean;
    opacity?: number;

    // Glass effect controls
    glassThickness?: number;
    glassTransmission?: number;
    glassClearcoat?: number;
    glassRoughness?: number;
    glassIor?: number; // Index of refraction

    // Glow & edge effects
    enableEdgeGlow?: boolean;
    edgeGlowColor?: string;
    edgeGlowIntensity?: number;
    edgeGlowSize?: number;

    // Corner pins/anchors
    enableCornerPins?: boolean;
    cornerPinColor?: string;
    cornerPinSize?: number;
    cornerPinGlow?: boolean;

    // Animation
    enablePulseAnimation?: boolean;
    pulseSpeed?: number;
    pulseIntensity?: number;

    // Lighting
    enableAmbientLight?: boolean;
    ambientLightIntensity?: number;
    ambientLightColor?: string;

    // Multi-layer effects
    enableReflectionLayer?: boolean;
    reflectionOpacity?: number;
    reflectionMetalness?: number;

    enableBottomLayer?: boolean;
    bottomLayerOpacity?: number;

    // Shadow & depth
    castShadow?: boolean;
    receiveShadow?: boolean;

    // Callbacks
    onLoad?: (calibration: any) => void;
}

export function FloorImagePlane({
    // Required
    imageUrl,
    floorLevel,

    // Positioning
    floorSpacing = 4.0,
    centerModel = true,

    // Visibility
    visible = true,
    opacity = 1,

    // Glass effects
    glassThickness = 0.5,
    glassTransmission = 0.3,
    glassClearcoat = 1,
    glassRoughness = 0.1,
    glassIor = 1.5,

    // Edge glow
    enableEdgeGlow = true,
    edgeGlowColor = '#4a90e2',
    edgeGlowIntensity = 0.03,
    edgeGlowSize = 0.2,

    // Corner pins
    enableCornerPins = true,
    cornerPinColor = '#4a90e2',
    cornerPinSize = 0.1,
    cornerPinGlow = true,

    // Animation
    enablePulseAnimation = true,
    pulseSpeed = 0.5,
    pulseIntensity = 0.1,

    // Lighting
    enableAmbientLight = true,
    ambientLightIntensity = 0.3,
    ambientLightColor = '#ffffff',

    // Layers
    enableReflectionLayer = true,
    reflectionOpacity = 0.05,
    reflectionMetalness = 0.9,

    enableBottomLayer = true,
    bottomLayerOpacity = 0.1,

    // Shadows
    castShadow = false,
    receiveShadow = true,

    // Callbacks
    onLoad
}: FloorImagePlaneProps) {
    const groupRef = useRef<THREE.Group>(null);
    const glassPanelRef = useRef<THREE.Mesh>(null);
    const edgeGlowRef = useRef<THREE.Mesh>(null);
    const cornerPinsRef = useRef<THREE.Group[]>([]);

    // Load texture
    const texture = useLoader(TextureLoader, imageUrl);

    // Calculate Y position
    const yPosition = floorLevel * floorSpacing;

    // Calculate dimensions based on texture
    const { width, height } = useMemo(() => {
        if (texture.image) {
            const aspect = texture.image.width / texture.image.height;
            // The original code used 800x800 for images
            // We'll use 30 as the base width and maintain aspect ratio (e.g. 30 meters)
            const baseWidth = 30;
            return {
                width: baseWidth,
                height: baseWidth / aspect
            };
        }
        return { width: 30, height: 30 };
    }, [texture]);

    // Call onLoad with calibration
    React.useEffect(() => {
        if (onLoad && texture.image) {
            onLoad({
                width: width,
                depth: height,
                height: 2.4,
                minX: centerModel ? -width / 2 : 0,
                minZ: centerModel ? -height / 2 : 0,
                minY: 0,
                centerX: centerModel ? 0 : width / 2,
                centerZ: centerModel ? 0 : height / 2
            });
        }
    }, [texture, width, height, onLoad, centerModel]);

    // Pulse animation
    useFrame(({ clock }) => {
        if (!enablePulseAnimation) return;

        const t = clock.getElapsedTime();
        const pulse = (Math.sin(t * pulseSpeed) + 1) / 2;

        if (glassPanelRef.current) {
            const material = glassPanelRef.current.material as any;
            if (material.thickness !== undefined) {
                material.thickness = glassThickness + pulse * pulseIntensity;
            }
        }

        if (edgeGlowRef.current && enableEdgeGlow) {
            const material = edgeGlowRef.current.material as THREE.MeshBasicMaterial;
            material.opacity = edgeGlowIntensity + pulse * 0.02;
        }

        if (enableCornerPins && cornerPinGlow) {
            cornerPinsRef.current.forEach((pinGroup, i) => {
                if (pinGroup) {
                    const offset = i * 0.2;
                    pinGroup.position.y = 0.3 + Math.sin(t * pulseSpeed + offset) * 0.05;
                }
            });
        }
    });

    return (
        <group
            ref={groupRef}
            position={[
                centerModel ? 0 : width / 2,
                yPosition,
                centerModel ? 0 : height / 2
            ]}
            visible={visible}
        >
            {/* Main frosted glass panel with image */}
            <mesh
                ref={glassPanelRef}
                position={[0, 0, 0]}
                castShadow={castShadow}
                receiveShadow={receiveShadow}
            >
                {/* We use a thin BoxGeometry to give it real 3D thickness */}
                <boxGeometry args={[width, glassThickness, height]} />
                <meshPhysicalMaterial
                    /* The texture is applied as the main map */
                    map={texture}
                    transparent={true}
                    opacity={opacity}

                    /* Glass properties - Using standard MeshPhysicalMaterial for maximum stability */
                    thickness={glassThickness}
                    transmission={0.9}
                    roughness={glassRoughness}
                    clearcoat={glassClearcoat}
                    clearcoatRoughness={0.1}
                    ior={glassIor}
                    reflectivity={0.5}

                    /* Performance and quality */
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>


            {/* Edge glow */}
            {enableEdgeGlow && (
                <mesh
                    ref={edgeGlowRef}
                    position={[0, 0.15, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[width + edgeGlowSize, height + edgeGlowSize]} />
                    <meshBasicMaterial
                        color={edgeGlowColor}
                        transparent={true}
                        opacity={edgeGlowIntensity}
                        side={THREE.DoubleSide}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>
            )}

            {/* Corner pins */}
            {enableCornerPins && [
                [-width / 2, -height / 2],
                [width / 2, -height / 2],
                [-width / 2, height / 2],
                [width / 2, height / 2]
            ].map(([x, z], i) => (
                <group
                    key={i}
                    position={[x, 0.3, z]}
                    ref={(el) => {
                        if (el) cornerPinsRef.current[i] = el;
                    }}
                >
                    {/* Pin cylinder */}
                    <mesh position={[0, 0.2, 0]} castShadow>
                        <cylinderGeometry args={[cornerPinSize, cornerPinSize * 1.5, 0.4, 8]} />
                        <meshStandardMaterial
                            color={cornerPinColor}
                            metalness={0.8}
                            roughness={0.2}
                            emissive={cornerPinGlow ? cornerPinColor : '#000000'}
                            emissiveIntensity={cornerPinGlow ? 0.3 : 0}
                            toneMapped={false}
                        />
                    </mesh>

                    {/* Pin light */}
                    {cornerPinGlow && (
                        <pointLight
                            color={cornerPinColor}
                            intensity={0.5}
                            distance={2}
                            decay={2}
                        />
                    )}
                </group>
            ))}

            {/* Ambient lighting for the glass */}
            {enableAmbientLight && (
                <pointLight
                    position={[0, 5, 0]}
                    intensity={ambientLightIntensity}
                    color={ambientLightColor}
                    distance={width * 2}
                />
            )}
        </group>
    );
}

// Preload hook for better performance
export function preloadFloorImage(imageUrl: string) {
    useLoader.preload(TextureLoader, imageUrl);
}