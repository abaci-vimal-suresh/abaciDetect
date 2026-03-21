// src/pages/halo/components/HaloSensorMarker.tsx

import React, { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { SensorNode } from '../../../IoTVisualizer/Types/types';

// ── Preload ───────────────────────────────────────────────────────────────────
useGLTF.preload('/hemi_sphere.glb');

// ── Status colors ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    online: '#06d6a0',
    offline: '#adb5bd',
    alert: '#e63946',
};

// ── Hemi sphere GLB marker ────────────────────────────────────────────────────
const HemiSphereModel: React.FC<{
    color: string;
    pulse: number;   // 0.0–1.0
    isAlert: boolean;
    isOffline: boolean;
}> = ({ color, pulse, isAlert, isOffline }) => {
    const { scene } = useGLTF('/hemi_sphere.glb');
    const cloned = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef<THREE.Group>(null);
    const matsRef = useRef<THREE.MeshStandardMaterial[]>([]);

    // Collect materials once
    useMemo(() => {
        matsRef.current = [];
        cloned.traverse((node: any) => {
            if (node.isMesh && node.material) {
                node.material = node.material.clone();
                node.material.transparent = true;
                node.material.color?.set(color);
                node.material.emissive?.set(color);
                matsRef.current.push(node.material);
            }
        });
    }, [cloned, color]);

    const baseScale = 0.35;
    const alertScale = baseScale + pulse * 0.45; // 0.35 → 0.80 at full intensity

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        if (isOffline) {
            // Dim, slow breathe
            matsRef.current.forEach(m => {
                m.emissiveIntensity = 0.05 + Math.abs(Math.sin(t * 0.5)) * 0.05;
                m.opacity = 0.4;
            });
            if (groupRef.current) groupRef.current.scale.setScalar(baseScale);
            return;
        }

        if (isAlert) {
            // Fast aggressive pulse
            const p = 0.6 + Math.abs(Math.sin(t * 5.0)) * 1.8 * pulse;
            matsRef.current.forEach(m => {
                m.emissiveIntensity = p;
                m.opacity = 0.75 + Math.abs(Math.sin(t * 5.0)) * 0.25;
            });
            if (groupRef.current) {
                const breathe = 1.0 + Math.abs(Math.sin(t * 5.0)) * 0.12 * pulse;
                groupRef.current.scale.setScalar(alertScale * breathe);
            }
        } else {
            // Gentle idle breathe
            const p = 0.2 + Math.abs(Math.sin(t * 1.5)) * 0.15;
            matsRef.current.forEach(m => {
                m.emissiveIntensity = p;
                m.opacity = 0.72;
            });
            if (groupRef.current) {
                groupRef.current.scale.setScalar(baseScale);
            }
        }
    });

    return (
        <primitive
            ref={groupRef}
            object={cloned}
            scale={[baseScale, baseScale, baseScale]} // initial — overridden in useFrame
        />
    );
};

// ── Halo ring on floor ────────────────────────────────────────────────────────
const HaloRing: React.FC<{
    radius: number;
    color: string;
    intensity: number;
    isOffline: boolean;
    isAlert: boolean;
}> = ({ radius, color, intensity, isOffline, isAlert }) => {
    const outerRef = useRef<THREE.Mesh>(null);
    const innerRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        if (outerRef.current) {
            const mat = outerRef.current.material as THREE.MeshBasicMaterial;

            if (isOffline) {
                mat.opacity = 0.08;
                outerRef.current.scale.setScalar(1.0);
            } else if (isAlert) {
                // Ring breathes AND expands with intensity
                const expandedRadius = radius * (1 + intensity * 0.6);
                // Scale the ring mesh to match expanded radius
                outerRef.current.scale.setScalar(
                    expandedRadius / radius *
                    (1 + Math.abs(Math.sin(t * 4.0)) * 0.15 * intensity)
                );
                mat.opacity = 0.2 + Math.abs(Math.sin(t * 4.0)) * intensity * 0.5;
            } else {
                outerRef.current.scale.setScalar(
                    1 + Math.abs(Math.sin(t * 1.2)) * 0.05
                );
                mat.opacity = 0.1 + Math.abs(Math.sin(t * 1.8)) * 0.15;
            }
        }

        if (innerRef.current) {
            const mat = innerRef.current.material as THREE.MeshBasicMaterial;
            if (isOffline) {
                mat.opacity = 0.03;
            } else if (isAlert) {
                mat.opacity = 0.05 + Math.abs(Math.sin(t * 4.5)) * 0.08 * intensity;
            } else {
                mat.opacity = 0.04 + Math.abs(Math.sin(t * 2.0)) * 0.04;
            }
        }
    });

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
            {/* Outer ring */}
            <mesh ref={outerRef} renderOrder={4}>
                <ringGeometry args={[radius - 0.3, radius, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Inner filled disc */}
            <mesh ref={innerRef} renderOrder={3}>
                <circleGeometry args={[radius - 0.3, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.04}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};

// ── Label ─────────────────────────────────────────────────────────────────────
const SensorLabel: React.FC<{
    sensor: SensorNode;
    color: string;
    isFocused: boolean;
}> = ({ sensor, color, isFocused }) => {
    const triggered = sensor.event_configs.filter(e => e.is_triggered);

    return (
        <Html
            position={[0, 1.2, 0]}
            center
            distanceFactor={20}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
            <div style={{
                background: 'rgba(13,17,23,0.90)',
                border: `1px solid ${color}66`,
                borderRadius: 5,
                padding: '3px 9px',
                fontSize: 9,
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(6px)',
                boxShadow: isFocused ? `0 0 12px ${color}88` : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 5px ${color}`,
                        flexShrink: 0,
                        display: 'inline-block',
                    }} />
                    {sensor.name}
                </div>
                {triggered.length > 0 && (
                    <div style={{
                        fontSize: 8,
                        color: '#e63946',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                    }}>
                        ⚠ {triggered.map(e => e.event_id).join(' · ')}
                    </div>
                )}
            </div>
        </Html>
    );
};

// ── Main export ───────────────────────────────────────────────────────────────
interface HaloSensorMarkerProps {
    sensor: SensorNode;
    fw: number;    // floor_width in metres
    fd: number;    // floor_depth in metres
    floorY: number;    // Y position of this floor
    isFocused: boolean;
    onClick?: (sensor: SensorNode) => void;
}

const HaloSensorMarker: React.FC<HaloSensorMarkerProps> = ({
    sensor, fw, fd, floorY, isFocused, onClick,
}) => {
    // Denormalize to world position
    const wx = sensor.x_val * fw - fw / 2;
    const wz = sensor.y_val * fd - fd / 2;
    const wy = floorY + sensor.z_val * (fd * 0.18);  // rough ceiling height

    const color = STATUS_COLORS[sensor.sensor_status];
    const isAlert = sensor.sensor_status === 'alert';
    const isOffline = sensor.sensor_status === 'offline';
    const pulse = sensor.halo_intensity;

    return (
        <group
            position={[wx, 0, wz]}
            onClick={e => {
                e.stopPropagation();
                onClick?.(sensor);
            }}
        >
            {/* Halo ring on floor */}
            <group position={[0, floorY + 0.05, 0]}>
                <HaloRing
                    radius={sensor.halo_radius}
                    color={color}
                    intensity={pulse}
                    isOffline={isOffline}
                    isAlert={isAlert}
                />
            </group>

            {/* Hemi sphere model at sensor height */}
            <group position={[0, wy, 0]}>
                <Suspense fallback={
                    <mesh>
                        <sphereGeometry args={[0.3, 12, 12]} />
                        <meshBasicMaterial color={color} transparent opacity={0.6} />
                    </mesh>
                }>
                    <HemiSphereModel
                        color={color}
                        pulse={pulse}
                        isAlert={isAlert}
                        isOffline={isOffline}
                    />
                </Suspense>

                {/* Label */}
                <SensorLabel
                    sensor={sensor}
                    color={color}
                    isFocused={isFocused}
                />
            </group>
        </group>
    );
};

export default HaloSensorMarker;