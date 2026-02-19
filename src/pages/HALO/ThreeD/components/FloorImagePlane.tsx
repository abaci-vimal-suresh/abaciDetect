import React, { useRef, useMemo, useEffect } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

interface FloorImagePlaneProps {
    // Required props
    imageUrl: string;
    floorLevel: number;
    areaId?: number;

    // Positioning & sizing
    floorSpacing?: number;
    centerModel?: boolean;

    // Visibility controls
    visible?: boolean;
    opacity?: number;

    // Image quality
    brightness?: number; // 0.5 = darker, 1.0 = normal, 1.2 = brighter
    contrast?: number;   // 1.0 = normal, 1.2 = more contrast (via material tonemap)

    // Glass/panel thickness
    glassThickness?: number;

    // Edge glow (static, subtle)
    enableEdgeGlow?: boolean;
    edgeGlowColor?: string;
    edgeGlowIntensity?: number;
    edgeGlowSize?: number;

    // Corner pins (static)
    enableCornerPins?: boolean;
    cornerPinColor?: string;
    cornerPinSize?: number;

    // Shadow & depth
    castShadow?: boolean;
    receiveShadow?: boolean;

    // Callbacks
    onLoad?: (calibration: any) => void;
    onClick?: (event: any) => void;
    onPointerMove?: (event: any) => void;
}

export function FloorImagePlane({
    imageUrl,
    floorLevel,
    areaId,

    floorSpacing = 4.0,
    centerModel = true,

    visible = true,
    opacity = 0.92,

    brightness = 0.82,  // Slightly darker than raw — prevents washed-out look
    contrast = 1.1,     // Very subtle contrast lift

    glassThickness = 0.05, // Much thinner — architectural, not chunky

    enableEdgeGlow = true,
    edgeGlowColor = '#7aaacc',
    edgeGlowIntensity = 0.018,
    edgeGlowSize = 0.15,

    enableCornerPins = true,
    cornerPinColor = '#5588aa',
    cornerPinSize = 0.08,

    castShadow = false,
    receiveShadow = true,

    onLoad,
    onClick,
    onPointerMove,
}: FloorImagePlaneProps) {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    // Access renderer to set max anisotropy
    const { gl } = useThree();

    // Load texture
    const texture = useLoader(TextureLoader, imageUrl);

    // Apply sharp texture settings after load
    useEffect(() => {
        if (!texture) return;

        // Correct color space — prevents washed-out / gamma-doubled look
        texture.colorSpace = THREE.SRGBColorSpace;

        // Sharpest filtering: trilinear for minification, linear for magnification
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Max anisotropy from the actual renderer — typically 16x on modern GPUs
        // This is the single biggest sharpness win at oblique viewing angles
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();

        // Generate mipmaps for the LinearMipmapLinearFilter to work
        texture.generateMipmaps = true;

        texture.needsUpdate = true;
    }, [texture, gl]);

    const yPosition = floorLevel * floorSpacing;

    const { width, height } = useMemo(() => {
        if (texture?.image) {
            const aspect = texture.image.width / texture.image.height;
            const baseWidth = 30;
            return { width: baseWidth, height: baseWidth / aspect };
        }
        return { width: 30, height: 30 };
    }, [texture]);

    useEffect(() => {
        if (onLoad && texture?.image) {
            onLoad({
                width,
                depth: height,
                height: 2.4,
                minX: centerModel ? -width / 2 : 0,
                minZ: centerModel ? -height / 2 : 0,
                minY: 0,
                centerX: centerModel ? 0 : width / 2,
                centerZ: centerModel ? 0 : height / 2,
            });
        }
    }, [texture, width, height, onLoad, centerModel]);

    // Brightness is applied via a color tint on the material.
    // THREE.Color(b, b, b) on a white-neutral image darkens proportionally.
    const brightnessColor = useMemo(
        () => new THREE.Color(brightness, brightness, brightness),
        [brightness]
    );

    return (
        <group
            ref={groupRef}
            position={[
                centerModel ? 0 : width / 2,
                yPosition,
                centerModel ? 0 : height / 2,
            ]}
            visible={visible}
        >
            {/* ── Main floor image plane ── */}
            <mesh
                ref={meshRef}
                position={[0, 0, 0]}
                castShadow={castShadow}
                receiveShadow={receiveShadow}
                userData={{ isFloor: true, areaId: areaId ?? floorLevel }}
                onClick={onClick}
                onPointerMove={onPointerMove}
            >
                {/*
                    Thin box instead of plane gives it just enough depth
                    to catch edge lighting without looking chunky.
                    glassThickness is now 0.05 by default.
                */}
                <boxGeometry args={[width, glassThickness, height]} />
                <meshStandardMaterial
                    map={texture}
                    // Tint the material color to control brightness without
                    // touching the texture itself — clean and non-destructive
                    color={brightnessColor}
                    transparent={opacity < 1}
                    opacity={opacity}
                    // Matte surface — architectural drawings aren't shiny
                    roughness={0.85}
                    metalness={0.0}
                    // Keep tone mapping OFF so the texture colors render
                    // exactly as stored — no engine "enhancement" washing it out
                    toneMapped={false}
                    side={THREE.FrontSide} // Front-only — slight perf win, no z-fighting
                    // envMapIntensity at 0 means no IBL contribution — flat, readable
                    envMapIntensity={0}
                />
            </mesh>

            {/* ── Static edge glow ── */}
            {enableEdgeGlow && (
                <mesh
                    position={[0, glassThickness / 2 + 0.01, 0]}
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
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* ── Static corner pins ── */}
            {enableCornerPins &&
                (
                    [
                        [-width / 2, -height / 2],
                        [width / 2, -height / 2],
                        [-width / 2, height / 2],
                        [width / 2, height / 2],
                    ] as [number, number][]
                ).map(([x, z], i) => (
                    <mesh
                        key={i}
                        position={[x, glassThickness / 2 + 0.2, z]}
                        castShadow={false}
                    >
                        <cylinderGeometry args={[cornerPinSize, cornerPinSize * 1.4, 0.35, 8]} />
                        <meshStandardMaterial
                            color={cornerPinColor}
                            metalness={0.6}
                            roughness={0.35}
                            // Faint emissive so they're visible without a point light
                            emissive={cornerPinColor}
                            emissiveIntensity={0.15}
                            toneMapped={false}
                        />
                    </mesh>
                ))}
        </group>
    );
}

export function preloadFloorImage(imageUrl: string) {
    useLoader.preload(TextureLoader, imageUrl);
}