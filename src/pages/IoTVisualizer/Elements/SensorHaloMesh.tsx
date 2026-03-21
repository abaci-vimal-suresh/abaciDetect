import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SensorHalo } from '../Types/types';

interface SensorHaloMeshProps {
    halo: SensorHalo;
    fw: number;
    fd: number;
    floorY: number;
}

const SensorHaloMesh: React.FC<SensorHaloMeshProps> = ({ halo, fw, fd, floorY }) => {
    const outerRef = useRef<THREE.Mesh>(null);
    const innerRef = useRef<THREE.Mesh>(null);

    const wx = halo.nx * fw - fw / 2;
    const wz = halo.ny * fd - fd / 2;

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (outerRef.current) {
            const mat = outerRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.15 + Math.abs(Math.sin(t * 1.8))
                * halo.intensity * 0.35;
            outerRef.current.scale.setScalar(
                1 + Math.abs(Math.sin(t * 1.2)) * 0.08 * halo.intensity
            );
        }
        if (innerRef.current) {
            const mat = innerRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.04 + Math.abs(Math.sin(t * 2.2))
                * 0.06 * halo.intensity;
        }
    });

    return (
        <group position={[wx, floorY + 0.05, wz]}>
            <mesh ref={outerRef}
                rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
                <ringGeometry
                    args={[halo.radius - 0.3, halo.radius, 64]} />
                <meshBasicMaterial color={halo.color} transparent
                    opacity={0.3} depthWrite={false}
                    side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={innerRef}
                rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
                <circleGeometry args={[halo.radius - 0.3, 64]} />
                <meshBasicMaterial color={halo.color} transparent
                    opacity={0.06} depthWrite={false}
                    side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
                <circleGeometry args={[0.25, 24]} />
                <meshBasicMaterial color={halo.color}
                    transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <Html position={[0, 0.8, 0]} center
                distanceFactor={20}
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{
                    background: 'rgba(13,17,23,0.85)',
                    border: `1px solid ${halo.color}66`,
                    borderRadius: 4, padding: '2px 7px',
                    fontSize: 9, fontWeight: 700,
                    color: halo.color, whiteSpace: 'nowrap',
                    backdropFilter: 'blur(4px)',
                }}>
                    📡 {halo.name}
                </div>
            </Html>
        </group>
    );
};

export default SensorHaloMesh;
