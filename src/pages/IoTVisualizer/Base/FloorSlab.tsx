import React, { useContext, useMemo } from 'react';
import * as THREE from 'three';
import ThemeContext from '../../../contexts/themeContext';

const useHaloTheme = () => {
    const context = useContext(ThemeContext);
    const darkModeStatus = (context as any).darkModeStatus;

    return useMemo(() => {
        if (darkModeStatus) {
            return {
                floor: '#1d1a1aff',
                gridCell: '#2c3e50',
                gridSec: '#34495e',
                labelBg: 'rgba(13,17,23,0.85)',
                labelBorder: 'rgba(123,104,238,0.4)',
                labelTextColor: '#7b68ee',
                slabOpacity: 0.85
            };
        }
        return {
            floor: '#d1d5db',
            gridCell: '#9ca3af',
            gridSec: '#6b7280',
            labelBg: 'rgba(255,255,255,0.9)',
            labelBorder: 'rgba(100,116,139,0.3)',
            labelTextColor: '#475569',
            slabOpacity: 0.65
        };
    }, [darkModeStatus]);
};

interface FloorSlabProps {
    fw: number;
    fd: number;
    floorY: number;
    isSelected?: boolean;
    hasImage?: boolean;
}

const FloorSlab: React.FC<FloorSlabProps> = ({ fw, fd, floorY, isSelected = false, hasImage = false }) => {
    const theme = useHaloTheme();
    return (
        <group position={[0, floorY, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]} receiveShadow renderOrder={1}>
                <planeGeometry args={[fw, fd]} />
                <meshStandardMaterial
                    color={theme.floor}
                    transparent
                    opacity={hasImage ? 0.0 : theme.slabOpacity}
                    roughness={0.9} metalness={0} />
            </mesh>
            <lineSegments rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.01, 0]} renderOrder={3}>
                <edgesGeometry
                    args={[new THREE.PlaneGeometry(fw, fd)]} />
                <lineBasicMaterial
                    color={isSelected ? '#f0c040' : '#4a90d9'}
                    transparent
                    opacity={isSelected ? 0.8 : 0.35} />
            </lineSegments>
            {[
                [-fw / 2, 0, -fd / 2], [fw / 2, 0, -fd / 2],
                [-fw / 2, 0, fd / 2], [fw / 2, 0, fd / 2],
            ].map((pos, i) => (
                <mesh key={i}
                    position={pos as [number, number, number]}
                    renderOrder={9}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshBasicMaterial
                        color={isSelected ? '#f0c040' : '#4a90d9'}
                        transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
};

export default FloorSlab;
export { useHaloTheme };
