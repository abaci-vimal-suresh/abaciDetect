import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AreaWall } from '../Types/types';

// ── BEZIER GEOMETRY BUILDER ───────────────────────────────────────────────────

function buildBezierGeometry(
    wall: AreaWall,
    fw: number,
    fd: number,
): THREE.BufferGeometry | null {
    const x1 = wall.r_x1 * fw - fw / 2;
    const z1 = wall.r_y1 * fd - fd / 2;
    const x2 = wall.r_x2 * fw - fw / 2;
    const z2 = wall.r_y2 * fd - fd / 2;

    const ctrlNx = wall.ctrl_x ?? (wall.r_x1 + wall.r_x2) / 2;
    const ctrlNy = wall.ctrl_y ?? (wall.r_y1 + wall.r_y2) / 2;
    const cx = ctrlNx * fw - fw / 2;
    const cz = ctrlNy * fd - fd / 2;

    const wallLength = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    if (wallLength < 0.01) return null;

    // Clamp control point to prevent degenerate geometry
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const ctrlDist = Math.sqrt((cx - midX) ** 2 + (cz - midZ) ** 2);
    const maxCtrlDist = wallLength * 3;
    let safeCx = cx, safeCz = cz;
    if (ctrlDist > maxCtrlDist && ctrlDist > 0) {
        const ratio = maxCtrlDist / ctrlDist;
        safeCx = midX + (cx - midX) * ratio;
        safeCz = midZ + (cz - midZ) * ratio;
    }

    const STEPS = 48;
    const curvePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const mt = 1 - t;
        curvePoints.push(new THREE.Vector2(
            mt * mt * x1 + 2 * mt * t * safeCx + t * t * x2,
            mt * mt * z1 + 2 * mt * t * safeCz + t * t * z2,
        ));
    }

    if (curvePoints.length < 2) return null;

    const thickness = wall.thickness ?? 0.18;
    const wallHeight = wall.r_height ?? 3.0;
    const halfT = thickness / 2;
    const N = curvePoints.length;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const rights: THREE.Vector2[] = curvePoints.map((_, i) => {
        let dx: number, dz: number;
        if (i === 0) { dx = curvePoints[1].x - curvePoints[0].x; dz = curvePoints[1].y - curvePoints[0].y; }
        else if (i === N - 1) { dx = curvePoints[N - 1].x - curvePoints[N - 2].x; dz = curvePoints[N - 1].y - curvePoints[N - 2].y; }
        else { dx = curvePoints[i + 1].x - curvePoints[i - 1].x; dz = curvePoints[i + 1].y - curvePoints[i - 1].y; }
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.0001) return new THREE.Vector2(1, 0);
        return new THREE.Vector2(dz / len, -dx / len);
    });

    for (let i = 0; i < N; i++) {
        const px = curvePoints[i].x;
        const pz = curvePoints[i].y;
        const rx = rights[i].x;
        const rz = rights[i].y;

        positions.push(px - rx * halfT, 0, pz - rz * halfT);
        positions.push(px - rx * halfT, wallHeight, pz - rz * halfT);
        positions.push(px + rx * halfT, 0, pz + rz * halfT);
        positions.push(px + rx * halfT, wallHeight, pz + rz * halfT);

        normals.push(-rx, 0, -rz, -rx, 0, -rz, rx, 0, rz, rx, 0, rz);
    }

    for (let i = 0; i < N - 1; i++) {
        const b = i * 4;
        const n = (i + 1) * 4;
        indices.push(b, n, b + 1, n, n + 1, b + 1);      // inner face
        indices.push(b + 2, b + 3, n + 2, n + 2, b + 3, n + 3); // outer face
        indices.push(b + 1, n + 1, b + 3, n + 1, n + 3, b + 3); // top cap
        indices.push(b, b + 2, n, n, b + 2, n + 2);       // bottom cap
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

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
        shape.lineTo(cx + Math.cos(a) * rInner, -cz - Math.sin(a) * rInner);
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
    onClick?: (wall: AreaWall) => void;
    onHover?: (hovered: boolean) => void;
}

const WallSegment: React.FC<WallSegmentProps> = ({
    wall, fw, fd, floorY,
    isPreview = false,
    isSelected = false,
    isAlert = false,
    isBlinking = false,
    onClick,
    onHover,
}) => {
    const meshRef = useRef<THREE.Mesh>(null);

    const isArc = wall.wall_shape === 'arc' || wall.arc_center_x != null;
    const isBezier = !isArc && (wall.wall_shape === 'bezier' || wall.ctrl_x != null);

    const arcGeo = useMemo(() => {
        if (!isArc) return null;
        return buildArcGeometry(wall, fw, fd);
    }, [
        isArc, wall.arc_center_x, wall.arc_center_z,
        wall.arc_radius, wall.arc_start_angle, wall.arc_end_angle,
        wall.r_height, wall.thickness, fw, fd,
    ]);

    const bezierGeo = useMemo(() => {
        if (!isBezier) return null;
        return buildBezierGeometry(wall, fw, fd);
    }, [
        isBezier, wall.r_x1, wall.r_y1, wall.r_x2, wall.r_y2,
        wall.ctrl_x, wall.ctrl_y, wall.r_height, wall.thickness, fw, fd,
    ]);

    useEffect(() => () => { arcGeo?.dispose(); }, [arcGeo]);
    useEffect(() => () => { bezierGeo?.dispose(); }, [bezierGeo]);

    // Pulse animation
    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        const t = clock.getElapsedTime();
        if (isPreview) {
            mat.emissiveIntensity = 0.3 + Math.abs(Math.sin(t * 2.5)) * 0.6;
        } else if (isAlert) {
            mat.emissiveIntensity = 0.6 + Math.abs(Math.sin(t * 4.0)) * 1.8;
        } else if (isBlinking) {
            mat.emissiveIntensity = 0.45 + (Math.sin(t * 12.0) > 0 ? 2.5 : 0);
        } else if (isSelected) {
            mat.emissiveIntensity = 0.3 + Math.abs(Math.sin(t * 2.0)) * 0.5;
        }
    });

    const color = isPreview ? '#f0c040'
        : isAlert ? '#e63946'
        : isBlinking ? '#facc15'
        : isSelected ? '#ffec80'
        : wall.color;

    const emissive = isPreview ? '#f0c040'
        : isAlert ? '#e63946'
        : isBlinking ? '#facc15'
        : isSelected ? '#f0c040'
        : '#000000';

    const emissiveIntensity = isPreview ? 0.5
        : isAlert ? 1.0
        : isBlinking ? 1.5
        : isSelected ? 0.3
        : 0;

    const material = (
        <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={isPreview || isAlert || isBlinking ? Math.max(wall.opacity, 0.8) : wall.opacity}
            roughness={0.6}
            metalness={0.05}
            depthWrite={!isPreview}
        />
    );

    const eventHandlers = onClick || onHover ? {
        onClick: (e: any) => { e.stopPropagation(); onClick?.(wall); },
        onPointerOver: (e: any) => { e.stopPropagation(); onHover?.(true); },
        onPointerOut: () => onHover?.(false),
    } : {};

    const baseY = floorY + (wall.r_z_offset ?? 0);

    // Arc
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
                {...eventHandlers}
            >
                {material}
            </mesh>
        );
    }

    // Bezier
    if (isBezier) {
        if (!bezierGeo) return null;
        return (
            <mesh
                ref={meshRef}
                geometry={bezierGeo}
                position={[0, baseY, 0]}
                castShadow receiveShadow
                renderOrder={10}
                {...eventHandlers}
            >
                {material}
            </mesh>
        );
    }

    // Straight
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

    if (len < 0.01) return null;

    return (
        <mesh
            ref={meshRef}
            position={[cx, baseY + h / 2, cz]}
            rotation={[0, ang, 0]}
            castShadow receiveShadow
            renderOrder={10}
            {...eventHandlers}
        >
            <boxGeometry args={[len, h, thickness]} />
            {material}
        </mesh>
    );
};

export default WallSegment;
