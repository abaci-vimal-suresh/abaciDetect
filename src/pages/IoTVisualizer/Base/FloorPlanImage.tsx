import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const FloorPlanImage: React.FC<{
    url: string; w: number; d: number;
}> = ({ url, w, d }) => {
    const texture = useTexture(url);
    const { gl } = useThree();

    useMemo(() => {
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
    }, [texture, gl]);

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            renderOrder={2}
        >
            <planeGeometry args={[w, d]} />
            <meshBasicMaterial
                map={texture}
                transparent
                opacity={0.88}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export default FloorPlanImage;
