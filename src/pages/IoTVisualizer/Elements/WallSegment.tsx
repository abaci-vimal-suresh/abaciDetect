import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AreaWall } from '../Types/types';

// ── ARC GEOMETRY BUILDER ─────────────────────────────────────────────────────

function buildArcGeometry(
    wall: AreaWall, fw: number, fd: number
): THREE.ExtrudeGeometry | null {
    const {
        arc_center_x, arc_center_z, arc_radius,
        arc_start_angle, arc_end_angle,
        arc_segments = 48, r_height, thickness,
    } = wall;

    if (
        arc_center_x == null || arc_center_z == null ||
        arc_radius == null ||
        arc_start_angle == null || arc_end_angle == null
    ) return null;

    const cx = arc_center_x * fw - fw / 2;
    const cz = arc_center_z * fd - fd / 2;
    const rOuter = arc_radius * fw;
    const rInner = Math.max(0.05, rOuter - (thickness ?? 0.18));

    let startA = arc_start_angle;
    let endA = arc_end_angle;
    if (endA <= startA) endA += Math.PI * 2;

    const shape = new THREE.Shape();

    for (let i = 0; i <= arc_segments; i++) {
        const t = i / arc_segments;
        const a = startA + t * (endA - startA);
        const px = cx + Math.cos(a) * rOuter;
        const pz = -cz - Math.sin(a) * rOuter;
        if (i === 0) shape.moveTo(px, pz);
        else shape.lineTo(px, pz);
    }
    for (let i = arc_segments; i >= 0; i--) {
        const t = i / arc_segments;
        const a = startA + t * (endA - startA);
        shape.lineTo(
            cx + Math.cos(a) * rInner,
            -cz - Math.sin(a) * rInner,
        );
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
        depth: r_height ?? 3.0,
        bevelEnabled: false,
        steps: 1,
    });
}

// ── WALL SEGMENT ─────────────────────────────────────────────────────────────

interface WallSegmentProps {
    wall: AreaWall;
    fw: number;
    fd: number;
    floorY: number;
    isPreview?: boolean;
    isSelected?: boolean;
    isAlert?: boolean;
    isBlinking?: boolean;
}

const WallSegment: React.FC<WallSegmentProps> = ({
    wall, fw, fd, floorY,
    isPreview = false,
    isSelected = false,
    isAlert = false,
    isBlinking = false,
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const isArc = wall.wall_shape === 'arc' || wall.arc_center_x != null;

    const arcGeo = useMemo(() => {
        if (!isArc) return null;
        return buildArcGeometry(wall, fw, fd);
    }, [
        isArc, wall.arc_center_x, wall.arc_center_z,
        wall.arc_radius, wall.arc_start_angle, wall.arc_end_angle,
        wall.r_height, wall.thickness, fw, fd,
    ]);

    useEffect(() => () => { arcGeo?.dispose(); }, [arcGeo]);

    // Pulse animation
    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        const t = clock.getElapsedTime();
        if (isPreview) {
            mat.emissiveIntensity =
                0.3 + Math.abs(Math.sin(t * 2.5)) * 0.6;
        } else if (isAlert) {
            mat.emissiveIntensity =
                0.6 + Math.abs(Math.sin(t * 4.0)) * 1.8;
        } else if (isBlinking) {
            mat.emissiveIntensity =
                0.45 + (Math.sin(t * 12.0) > 0 ? 2.5 : 0);
        } else if (isSelected) {
            mat.emissiveIntensity =
                0.3 + Math.abs(Math.sin(t * 2.0)) * 0.5;
        }
    });

    const x1 = wall.r_x1 * fw - fw / 2;
    const z1 = wall.r_y1 * fd - fd / 2;
    const x2 = wall.r_x2 * fw - fw / 2;
    const z2 = wall.r_y2 * fd - fd / 2;
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    const ang = -Math.atan2(z2 - z1, x2 - x1);

    const h = wall.r_height ?? 3.0;
    const thickness = wall.thickness ?? 0.18;
    const baseY = floorY + (wall.r_z_offset ?? 0);
    const yCenter = baseY + h / 2;

    const color = isPreview
        ? '#f0c040'
        : isAlert
            ? '#e63946'
            : isBlinking
                ? '#facc15'
                : isSelected
                    ? '#ffec80'
                    : wall.color;

    const emissive = isPreview
        ? '#f0c040'
        : isAlert
            ? '#e63946'
            : isBlinking
                ? '#facc15'
                : isSelected
                    ? '#f0c040'
                    : '#000000';

    const emissiveIntensity = isPreview
        ? 0.5
        : isAlert
            ? 1.0
            : isBlinking
                ? 1.5
                : isSelected
                    ? 0.3
                    : 0;

    const material = (
        <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={
                isPreview || isAlert || isBlinking
                    ? Math.max(wall.opacity, 0.8)
                    : wall.opacity
            }
            roughness={0.6}
            metalness={0.05}
            depthWrite={!isPreview}
        />
    );

    if (isArc) {
        if (!arcGeo) return null;
        return (
            <mesh
                ref={meshRef}
                geometry={arcGeo}
                position={[0, baseY, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                castShadow receiveShadow
                renderOrder={10}
            >
                {material}
            </mesh>
        );
    }

    if (len < 0.01) return null;

    return (
        <mesh
            ref={meshRef}
            position={[cx, yCenter, cz]}
            rotation={[0, ang, 0]}
            castShadow receiveShadow
            renderOrder={10}
        >
            <boxGeometry args={[len, h, thickness]} />
            {material}
        </mesh>
    );
};

export default WallSegment;
