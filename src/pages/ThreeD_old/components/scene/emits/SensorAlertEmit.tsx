import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';

interface SensorAlertEmitProps {
    id: string | number;
    position: [number, number, number]; // [x, y, z] of the sensor
    eventSource: string;
    intensity: number;
    onComplete: (id: string | number) => void;
}

const EVENT_COLORS: Record<string, string> = {
    'Motion': '#378ADD',
    'Gunshot': '#EF4444',
    'Panic': '#EF4444',
    'Aggression': '#F97316',
    'Help': '#EC4899',
    'Sound': '#F97316',
    'CO': '#6B7280',
    'NH3': '#84CC16',
    'NO2': '#EF4444',
    'CO2cal': '#8B5CF6',
    'TVOC': '#8B5CF6',
    'Smoking': '#9CA3AF',
    'Vape': '#E5E7EB',
    'THC': '#22C55E',
    'PM1': '#F59E0B',
    'PM2.5': '#F59E0B',
    'PM10': '#F59E0B',
    'temp_c': '#F97316',
    'Temp_F': '#F97316',
    'Humidity': '#06B6D4',
    'Pressure': '#8B5CF6',
    'AQI': '#EF4444',
    'Health_Index': '#22C55E',
    'Light': '#FBBF24',
    'Alert': '#FBBF24',
    'Masking': '#F59E0B',
    'Tamper': '#F97316',
};

const DEFAULT_COLOR = '#378ADD';

interface EmitSubProps {
    tx: number;
    ty: number;
    tz: number;
    color: string;
    intensity: number;
    eventSource: string;
    onComplete: () => void;
}

// ── GLB: SMOKE / VAPE ────────────────────────────────────────────────────────
const SmokeGLB: React.FC<EmitSubProps> = ({ tx, ty, tz, color, intensity, eventSource, onComplete }) => {
    const { scene, animations } = useGLTF('/smoke.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);
    const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);

    const ringRef = useRef<THREE.Mesh>(null);
    const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

    useMemo(() => {
        clonedScene.traverse((node: any) => {
            if (node.isMesh && node.material) {
                node.material = node.material.clone();
                node.material.transparent = true;
                node.material.depthTest = false;
                if (node.material.color) {
                    node.material.color.set(eventSource === 'Smoking' ? '#9CA3AF' : '#E5E7EB');
                }
                materialsRef.current.push(node.material);
            }
        });
    }, [clonedScene, eventSource]);

    useEffect(() => {
        const action = Object.values(actions)[0];
        if (action) action.reset().play();
    }, [actions]);

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const elapsed = elapsedRef.current;

        if (groupRef.current) {
            // Drift upward
            groupRef.current.position.y += delta * 0.3;

            // Expanding Scale over 1s
            const scaleProgress = Math.min(1.0, elapsed / 1.0);
            const scale = 0.1 + scaleProgress * 0.7;
            groupRef.current.scale.set(scale, scale, scale);

            // Dissipate after 2s
            if (elapsed > 2.0) {
                const fadeProgress = (elapsed - 2.0) / 1.5;
                materialsRef.current.forEach(m => {
                    m.opacity = Math.max(0, 1 - fadeProgress);
                });
            }
        }

        // Floor Ring
        const ringElapsed = elapsed;
        const ringDuration = 1.2;
        const rp = Math.min(1.0, ringElapsed / ringDuration);
        if (ringRef.current) {
            const rScale = rp * 4 * intensity;
            ringRef.current.scale.set(rScale, rScale, rScale);
        }
        if (ringMatRef.current) ringMatRef.current.opacity = (1 - rp) * 0.8;

        if (elapsed >= 3.5 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <group>
            <primitive ref={groupRef} object={clonedScene} position={[tx, ty, tz]} scale={[0.1, 0.1, 0.1]} />
            <mesh ref={ringRef} position={[tx, 0.05, tz]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.05, 16, 32]} />
                <meshBasicMaterial ref={ringMatRef} color={color} transparent opacity={0.8} />
            </mesh>
        </group>
    );
};

// ── GLB: FIRE (Aggression) ───────────────────────────────────────────────────
const FireGLB: React.FC<EmitSubProps> = ({ tx, ty, tz, onComplete, intensity }) => {
    const { scene, animations } = useGLTF('/fire.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);
    const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);

    useMemo(() => {
        clonedScene.traverse((node: any) => {
            if (node.isMesh && node.material) {
                node.material = node.material.clone();
                node.material.transparent = true;
                node.material.emissive = new THREE.Color('#FF4500');
                node.material.emissiveIntensity = 0.5;
                materialsRef.current.push(node.material);
            }
        });
    }, [clonedScene]);

    useEffect(() => {
        const action = Object.values(actions)[0];
        if (action) action.reset().play();
    }, [actions]);

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const elapsed = elapsedRef.current;

        if (groupRef.current) {
            const pulse = 0.4 + Math.sin(elapsed * 8) * 0.05 * intensity;
            groupRef.current.scale.set(pulse, pulse, pulse);
            groupRef.current.rotation.y += delta * 0.5;

            if (elapsed > 2.0) {
                const fade = (elapsed - 2.0) / 0.5;
                materialsRef.current.forEach(m => {
                    m.opacity = Math.max(0, 1 - fade);
                });
            }
        }

        if (elapsed >= 2.5 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return <primitive ref={groupRef} object={clonedScene} position={[tx, ty, tz]} />;
};

// ── GLB: GUNSHOT (Final Tweaks) ────────────────────────────────────────────────
const GunshotGLB: React.FC<EmitSubProps> = ({ tx, ty, tz, intensity, onComplete }) => {
    const { scene, animations } = useGLTF('/gunshot.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);

    const gunRotationRef = useRef(Math.random() * Math.PI * 2);
    const gunMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

    const shockwaveRef = useRef<THREE.Mesh>(null);
    const shockwaveMatRef = useRef<THREE.MeshBasicMaterial>(null);

    const emergenceDuration = 0.4;
    const fireStartTime = 0.5;
    const builtInAnimDuration = (animations[0]?.duration || 1.5);
    const fadeDuration = 0.4;

    const fadeStartTime = fireStartTime + builtInAnimDuration;
    const totalDuration = fadeStartTime + fadeDuration;

    useMemo(() => {
        clonedScene.traverse((node: any) => {
            if (node.isMesh && node.material) {
                node.material = node.material.clone();
                node.material.transparent = true;
                gunMaterialsRef.current.push(node.material);
            }
        });
    }, [clonedScene]);

    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y = gunRotationRef.current;
            groupRef.current.position.y = ty;
        }
    }, [ty]);

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const elapsed = elapsedRef.current;

        if (groupRef.current && !completedRef.current) {
            // Emergence: Scale and Float up subtler (ty + 0.15)
            if (elapsed < emergenceDuration) {
                const p = elapsed / emergenceDuration;
                groupRef.current.scale.set(p * 0.15, p * 0.15, p * 0.15);
                groupRef.current.position.y = ty + p * 0.15; // Much lower float
            } else if (elapsed < fadeStartTime) {
                groupRef.current.scale.set(0.15, 0.15, 0.15);
                groupRef.current.position.y = ty + 0.15;
            }

            // Start firing animation once at height
            if (elapsed >= fireStartTime && elapsed < fireStartTime + delta + 0.01) {
                const action = Object.values(actions)[0];
                if (action && !action.isRunning()) action.reset().play();
            }

            // Fade Out
            if (elapsed > fadeStartTime) {
                const fadeProgress = (elapsed - fadeStartTime) / fadeDuration;
                gunMaterialsRef.current.forEach(mat => {
                    mat.opacity = Math.max(0, 1 - fadeProgress);
                });
            }
        }

        // Floor Shockwave
        if (elapsed > fireStartTime) {
            const sp = Math.min(1.0, (elapsed - fireStartTime) / 0.6);
            const shockScale = sp * 2 * intensity;
            if (shockwaveRef.current) {
                shockwaveRef.current.scale.set(shockScale, shockScale, shockScale);
            }
            if (shockwaveMatRef.current) {
                shockwaveMatRef.current.opacity = (1 - sp) * 0.7;
            }
        }

        if (elapsed >= totalDuration && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <group>
            <primitive ref={groupRef} object={clonedScene} position={[tx, ty, tz]} scale={[0, 0, 0]} />
            <mesh ref={shockwaveRef} position={[tx, 0.05, tz]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.04, 16, 32]} />
                <meshBasicMaterial ref={shockwaveMatRef} color="#EF4444" transparent opacity={0} side={THREE.DoubleSide} depthTest={false} />
            </mesh>
        </group>
    );
};

// ── GLB: HELP ────────────────────────────────────────────────────────────────
const HelpGLB: React.FC<EmitSubProps> = ({ tx, ty, tz, color, intensity, onComplete }) => {
    const { scene, animations } = useGLTF('/help.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);
    const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);

    const ringRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
    const ringMatRefs = [useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null)];

    useMemo(() => {
        clonedScene.traverse((node: any) => {
            if (node.isMesh && node.material) {
                node.material = node.material.clone();
                node.material.transparent = true;
                if (node.material.color) node.material.color.set('#EC4899');
                materialsRef.current.push(node.material);
            }
        });
    }, [clonedScene]);

    useEffect(() => {
        const action = Object.values(actions)[0];
        if (action) action.reset().play();
    }, [actions]);

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const elapsed = elapsedRef.current;

        if (groupRef.current) {
            groupRef.current.position.y = ty + 0.5 + Math.sin(elapsed * 3) * 0.2;
            groupRef.current.rotation.y += delta * 1.5;

            const sP = Math.min(1.0, elapsed / 0.4);
            const scale = sP * 0.5;
            groupRef.current.scale.set(scale, scale, scale);

            if (elapsed > 2.4) {
                const fade = (elapsed - 2.4) / 0.6;
                materialsRef.current.forEach(m => {
                    m.opacity = Math.max(0, 1 - fade);
                });
            }
        }

        const delays = [0, 0.3, 0.9];
        delays.forEach((delay, i) => {
            const rElapsed = elapsed - delay;
            if (rElapsed > 0 && rElapsed < 0.8) {
                const p = rElapsed / 0.8;
                const scale = p * 2 * intensity;
                if (ringRefs[i].current) ringRefs[i].current.scale.set(scale, scale, scale);
                if (ringMatRefs[i].current) ringMatRefs[i].current.opacity = (1 - p) * 0.7;
            } else if (rElapsed >= 0.8) {
                if (ringMatRefs[i].current) ringMatRefs[i].current.opacity = 0;
            }
        });

        if (elapsed >= 3.0 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <group>
            <primitive ref={groupRef} object={clonedScene} position={[tx, ty + 0.5, tz]} scale={[0, 0, 0]} />
            {ringRefs.map((ref, i) => (
                <mesh key={i} ref={ref} position={[tx, 0.05, tz]} rotation={[-Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1, 0.05, 16, 32]} />
                    <meshBasicMaterial ref={ringMatRefs[i]} color='#EC4899' transparent opacity={0} />
                </mesh>
            ))}
        </group>
    );
};

// ── GLB: WEED (THC) ──────────────────────────────────────────────────────────
const WeedGLB: React.FC<EmitSubProps> = ({ tx, ty, tz, onComplete }) => {
    const { scene, animations } = useGLTF('/weed.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);
    const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);

    useMemo(() => {
        clonedScene.traverse((node: any) => {
            if (node.isMesh && node.material) {
                node.material = node.material.clone();
                node.material.transparent = true;
                if (node.material.color) node.material.color.set('#22C55E');
                materialsRef.current.push(node.material);
            }
        });
    }, [clonedScene]);

    useEffect(() => {
        const action = Object.values(actions)[0];
        if (action) action.reset().play();
    }, [actions]);

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const elapsed = elapsedRef.current;

        if (groupRef.current) {
            groupRef.current.position.y += delta * 0.15;
            groupRef.current.rotation.y += delta * 0.8;
            groupRef.current.rotation.z = Math.sin(elapsed * 1.5) * 0.1;

            const sP = Math.min(1.0, elapsed / 0.6);
            const scale = sP * 0.4;
            groupRef.current.scale.set(scale, scale, scale);

            if (elapsed > 3.0) {
                const fade = (elapsed - 3.0) / 1.0;
                materialsRef.current.forEach(m => {
                    m.opacity = Math.max(0, 1 - fade);
                });
            }
        }

        if (elapsed >= 4.0 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return <primitive ref={groupRef} object={clonedScene} position={[tx, ty, tz]} scale={[0, 0, 0]} />;
};

// ── PROCEDURAL FALLBACKS (UNCHANGED) ──────────────────────────────────────────

const CascadeRings: React.FC<EmitSubProps> = ({ tx, ty, tz, color, intensity, onComplete }) => {
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);
    const ringRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
    const matRefs = [useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null)];
    const strobeRef = useRef<THREE.Mesh>(null);
    const strobeMatRef = useRef<THREE.MeshBasicMaterial>(null);

    const DURATION = 2.0;

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const progress = elapsedRef.current / DURATION;
        ringRefs.forEach((ref, i) => {
            const delay = i * 0.2;
            const ringElapsed = elapsedRef.current - delay;
            if (ringElapsed > 0 && ringElapsed < 1.0) {
                const p = ringElapsed / 1.0;
                const scale = p * (2 + i * 0.4) * intensity;
                if (ref.current) ref.current.scale.set(scale, scale, scale);
                if (matRefs[i].current) matRefs[i].current.opacity = (1 - p) * 0.9;
            } else if (ringElapsed >= 1.0) {
                if (matRefs[i].current) matRefs[i].current.opacity = 0;
            }
        });
        if (strobeMatRef.current) {
            const strobe = Math.sin(elapsedRef.current * 60);
            strobeMatRef.current.opacity = strobe > 0 ? 0.9 : 0;
        }
        if (progress >= 1 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <group>
            {ringRefs.map((ref, i) => (
                <mesh key={i} ref={ref} position={[tx, 0.05, tz]} rotation={[-Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1, 0.05, 16, 32]} />
                    <meshBasicMaterial ref={matRefs[i]} color={color} transparent opacity={0} depthTest={false} />
                </mesh>
            ))}
            <mesh ref={strobeRef} position={[tx, ty, tz]}>
                <sphereGeometry args={[0.3, 12, 12]} />
                <meshBasicMaterial ref={strobeMatRef} color={color} transparent opacity={0} depthTest={false} />
            </mesh>
        </group>
    );
};

const ShootingLines: React.FC<EmitSubProps> = ({ tx, ty, tz, color, intensity, onComplete }) => {
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);
    const lineRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
    const lineMatRefs = [useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null)];
    const ringRef = useRef<THREE.Mesh>(null);
    const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const DURATION_LINES = 0.5;
    const DURATION_TOTAL = 0.9;
    const SPEED = 12 * intensity;

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const lineProgress = Math.min(1, elapsedRef.current / DURATION_LINES);
        lineRefs.forEach((ref, i) => {
            const angle = (i * 120 * Math.PI) / 180;
            if (ref.current) {
                const dist = elapsedRef.current * SPEED;
                ref.current.position.set(tx + Math.cos(angle) * dist, ty, tz + Math.sin(angle) * dist);
                ref.current.rotation.y = -angle + Math.PI / 2;
            }
            if (lineMatRefs[i].current) lineMatRefs[i].current.opacity = 1 - lineProgress;
        });
        if (elapsedRef.current > DURATION_LINES) {
            const shockProgress = (elapsedRef.current - DURATION_LINES) / 0.4;
            if (shockProgress < 1) {
                const scale = shockProgress * 2 * intensity;
                if (ringRef.current) ringRef.current.scale.set(scale, scale, scale);
                if (ringMatRef.current) ringMatRef.current.opacity = (1 - shockProgress) * 0.6;
            }
        }
        if (elapsedRef.current >= DURATION_TOTAL && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <group>
            {lineRefs.map((ref, i) => (
                <mesh key={i} ref={ref} position={[tx, ty, tz]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 1, 4]} />
                    <meshBasicMaterial ref={lineMatRefs[i]} color={color} transparent opacity={1} depthTest={false} />
                </mesh>
            ))}
            <mesh ref={ringRef} position={[tx, 0.05, tz]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.05, 16, 32]} />
                <meshBasicMaterial ref={ringMatRef} color={color} transparent opacity={0} depthTest={false} />
            </mesh>
        </group>
    );
};

const RisingParticles: React.FC<EmitSubProps> = ({ tx, ty, tz, color, intensity, onComplete }) => {
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = Math.floor(Math.min(3.0, intensity) * 30);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particleData = useMemo(() => {
        return Array.from({ length: 90 }).map(() => ({
            offsetX: (Math.random() - 0.5) * 1.5,
            offsetZ: (Math.random() - 0.5) * 1.5,
            speed: 0.3 + Math.random() * 0.4,
            wobbleFreq: Math.random() * 3,
            wobbleAmp: 0.1 + Math.random() * 0.15,
            startDelay: Math.random() * 0.8,
        }));
    }, []);

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        if (meshRef.current) {
            for (let i = 0; i < count; i++) {
                const data = particleData[i];
                const pElapsed = elapsedRef.current - data.startDelay;
                if (pElapsed > 0) {
                    const y = ty + data.speed * pElapsed;
                    const x = tx + data.offsetX + Math.sin(elapsedRef.current * data.wobbleFreq) * data.wobbleAmp;
                    const z = tz + data.offsetZ + Math.cos(elapsedRef.current * data.wobbleFreq) * data.wobbleAmp;
                    const distProgress = (y - ty) / 4;
                    const scale = Math.max(0, 1 - distProgress);
                    dummy.position.set(x, y, z);
                    dummy.scale.set(scale, scale, scale);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                } else {
                    dummy.scale.set(0, 0, 0);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                }
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
        if (elapsedRef.current >= 3.5 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 90]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} depthTest={false} />
        </instancedMesh>
    );
};

const SphereBloom: React.FC<EmitSubProps> = ({ tx, ty, tz, color, intensity, eventSource, onComplete }) => {
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);
    const sphereRef = useRef<THREE.Mesh>(null);
    const sphereMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const DURATION = 3.0;
    const maxOpacity = useMemo(() => {
        switch (eventSource) {
            case 'CO': return 0.10;
            case 'NH3': return 0.25;
            case 'NO2': return 0.20;
            case 'CO2cal': return 0.15;
            case 'TVOC': return 0.18;
            case 'AQI': return 0.22;
            default: return 0.15;
        }
    }, [eventSource]);

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        const progress = elapsedRef.current / DURATION;
        if (sphereRef.current) {
            const scale = progress * 3 * intensity;
            sphereRef.current.scale.set(scale, scale, scale);
        }
        if (sphereMatRef.current) {
            let opacity = 0;
            if (progress < 0.3) opacity = (progress / 0.3) * maxOpacity;
            else opacity = (1 - (progress - 0.3) / 0.7) * maxOpacity;
            sphereMatRef.current.opacity = Math.max(0, opacity);
        }
        if (progress > 0.5) {
            const ringProgress = (progress - 0.5) / 0.5;
            const scale = progress * 3 * intensity;
            if (ringRef.current) ringRef.current.scale.set(scale, scale, scale);
            if (ringMatRef.current) ringMatRef.current.opacity = (1 - ringProgress) * 0.3;
        }
        if (progress >= 1 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <group>
            <mesh ref={sphereRef} position={[tx, ty, tz]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial ref={sphereMatRef} color={color} transparent side={THREE.DoubleSide} depthWrite={false} depthTest={false} opacity={0} />
            </mesh>
            <mesh ref={ringRef} position={[tx, 0.05, tz]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.05, 16, 32]} />
                <meshBasicMaterial ref={ringMatRef} color={color} transparent opacity={0} depthTest={false} />
            </mesh>
        </group>
    );
};

const DefaultRing: React.FC<EmitSubProps> = ({ tx, ty, tz, color, intensity, eventSource, onComplete }) => {
    const completedRef = useRef(false);
    const elapsedRef = useRef(0);
    const dropProgressRef = useRef(0);
    const ringProgressRefArr = [useRef(0), useRef(0), useRef(0)];
    const cylinderRef = useRef<THREE.Mesh>(null);
    const cylinderMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const ringRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
    const ringMatRefs = [useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null)];
    const tamperPosRef = useRef(new THREE.Vector3(tx, ty, tz));
    const DURATION_DROP = 0.4;
    const DURATION_RING = 1.2;
    const MAX_RADIUS = 4 * intensity;

    useFrame((_, delta) => {
        elapsedRef.current += delta;
        if (eventSource === 'Tamper') {
            const decay = 1 - Math.min(1, elapsedRef.current / 1.5);
            tamperPosRef.current.x = tx + Math.sin(elapsedRef.current * 30) * 0.15 * decay;
        }
        if (dropProgressRef.current < 1) {
            dropProgressRef.current += delta / DURATION_DROP;
            const p = Math.min(1, dropProgressRef.current);
            if (cylinderRef.current) {
                cylinderRef.current.scale.y = 1 - p;
                cylinderRef.current.position.set(tamperPosRef.current.x, ty * (1 - p / 2), tz);
            }
            if (cylinderMatRef.current) cylinderMatRef.current.opacity = (1 - p) * 0.8;
            return;
        }
        const ringCount = eventSource === 'Help' ? 3 : (eventSource === 'Motion' ? 2 : 1);
        const delayBetween = 0.3;
        let allFinished = true;
        for (let i = 0; i < ringCount; i++) {
            const delay = i * delayBetween;
            const ringElapsed = elapsedRef.current - DURATION_DROP - delay;
            if (ringElapsed > 0) {
                const p = Math.min(1, ringElapsed / DURATION_RING);
                ringProgressRefArr[i].current = p;
                if (p < 1) {
                    allFinished = false;
                    const speedOffset = (eventSource === 'Motion' && i === 1) ? 1.3 : 1;
                    const actualP = Math.min(1, p * speedOffset);
                    const actualScale = actualP * MAX_RADIUS;
                    if (ringRefs[i].current) ringRefs[i].current.scale.set(actualScale, actualScale, actualScale);
                    if (ringMatRefs[i].current) {
                        const baseOpacity = (eventSource === 'Motion' && i === 1) ? 0.4 : 0.8;
                        ringMatRefs[i].current.opacity = (1 - actualP) * baseOpacity;
                    }
                } else if (ringMatRefs[i].current) ringMatRefs[i].current.opacity = 0;
            } else allFinished = false;
        }
        if (allFinished && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    const finalRingCount = eventSource === 'Help' ? 3 : (eventSource === 'Motion' ? 2 : 1);

    return (
        <group>
            <mesh ref={cylinderRef} position={[tx, ty / 2, tz]}>
                <cylinderGeometry args={[0.05, 0.05, ty, 8]} />
                <meshBasicMaterial ref={cylinderMatRef} color={color} transparent opacity={0.8} depthTest={false} />
            </mesh>
            {Array.from({ length: finalRingCount }).map((_, i) => (
                <mesh key={i} ref={ringRefs[i]} position={[tx, 0.05, tz]} rotation={[-Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1, i === 1 && eventSource === 'Motion' ? 0.03 : 0.05, 16, 32]} />
                    <meshBasicMaterial ref={ringMatRefs[i]} color={color} transparent opacity={0} depthTest={false} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    );
};

// ── MAIN ROUTING LOGIC ───────────────────────────────────────────────────────
const getAnimationType = (eventSource: string):
    'cascade' | 'shooting' | 'particles' | 'sphere' | 'ring' |
    'smoke_glb' | 'fire_glb' | 'gunshot_glb' | 'help_glb' | 'weed_glb' => {
    switch (eventSource) {
        case 'Panic': return 'cascade';
        case 'Gunshot': return 'gunshot_glb';
        case 'Smoking':
        case 'Vape': return 'smoke_glb';
        case 'THC': return 'weed_glb';
        case 'Help': return 'help_glb';
        case 'Aggression': return 'fire_glb';
        case 'PM1':
        case 'PM2.5':
        case 'PM10': return 'particles';
        case 'CO':
        case 'NH3':
        case 'NO2':
        case 'CO2cal':
        case 'TVOC':
        case 'AQI': return 'sphere';
        default: return 'ring';
    }
};

export const SensorAlertEmit: React.FC<SensorAlertEmitProps> = ({
    id,
    position,
    eventSource,
    intensity,
    onComplete
}) => {
    const color = EVENT_COLORS[eventSource] || DEFAULT_COLOR;
    const [tx, ty, tz] = position;
    const animationType = getAnimationType(eventSource);
    const handleComplete = () => onComplete(id);

    return (
        <group>
            <Suspense fallback={null}>
                {animationType === 'smoke_glb' && <SmokeGLB tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
                {animationType === 'fire_glb' && <FireGLB tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
                {animationType === 'gunshot_glb' && <GunshotGLB tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
                {animationType === 'help_glb' && <HelpGLB tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
                {animationType === 'weed_glb' && <WeedGLB tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
            </Suspense>

            {animationType === 'cascade' && <CascadeRings tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
            {animationType === 'shooting' && <ShootingLines tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
            {animationType === 'particles' && <RisingParticles tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
            {animationType === 'sphere' && <SphereBloom tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
            {animationType === 'ring' && <DefaultRing tx={tx} ty={ty} tz={tz} color={color} intensity={intensity} eventSource={eventSource} onComplete={handleComplete} />}
        </group>
    );
};

// Preload models at module level
useGLTF.preload('/smoke.glb');
useGLTF.preload('/fire.glb');
useGLTF.preload('/gunshot.glb');
useGLTF.preload('/help.glb');
useGLTF.preload('/weed.glb');
