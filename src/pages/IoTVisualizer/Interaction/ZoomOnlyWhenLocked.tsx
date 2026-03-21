import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Helper component that enables scroll-to-zoom ONLY when the "Interaction Lock" 
 * (or simply the interaction state) is active, to prevent accidental zoom 
 * while scrolling the whole page.
 */
const ZoomOnlyWhenLocked: React.FC<{ locked: boolean }> = ({ locked }) => {
    const { camera, gl } = useThree();

    useEffect(() => {
        if (!locked) return;

        const canvas = gl.domElement;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.12 : 0.89;
            const newY = Math.max(5, Math.min(200, camera.position.y * factor));
            camera.position.setY(newY);
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, [locked, camera, gl]);

    return null;
};

export default ZoomOnlyWhenLocked;
