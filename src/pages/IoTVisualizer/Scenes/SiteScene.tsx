import React from 'react';
import { ContactShadows, Grid } from '@react-three/drei';
import { AreaNode, AreaWall, SensorNode } from '../Types/types';
import { useHaloTheme } from '../Base/FloorSlab';
import BuildingScene from './BuildingScene';

interface SiteSceneProps {
    areaTree: AreaNode;
    wallsByFloor: Record<number, AreaWall[]>;
    sensors: SensorNode[];
    focusedSensorId: number | null;
    setFocusedSensorId: (id: number | null) => void;
    onSensorClick?: (sensor: SensorNode) => void;
    blinkingWallIds?: (number | string)[];
}

const SceneLights: React.FC = () => (
    <>
        <ambientLight intensity={0.55} color="#8a9ab0" />
        <directionalLight position={[20, 35, 15]}
            intensity={1.2} castShadow color="#fff8f0"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024} />
        <directionalLight position={[-15, 20, -10]}
            intensity={0.4} color="#c8e8ff" />
        <pointLight position={[0, 8, 0]}
            intensity={0.3} color="#ffffff" distance={60} />
    </>
);

const SiteScene: React.FC<SiteSceneProps> = ({
    areaTree, wallsByFloor, sensors, focusedSensorId, setFocusedSensorId, onSensorClick, blinkingWallIds = []
}) => {
    const buildings = (areaTree.children ?? []).filter(
        c => c.area_type === 'Building'
    );

    const theme = useHaloTheme();

    return (
        <group>
            <SceneLights />
            <ContactShadows position={[0, -0.01, 0]}
                opacity={0.25} scale={300} blur={2}
                far={10} color="#000820" />

            {buildings.map((building, idx) => {
                // If all buildings share the same offset (all zero / not configured),
                // auto-spread them so they don't overlap.
                const allSameOffset = buildings.every(
                    b => (b.offset_x ?? 0) === 0 && (b.offset_y ?? 0) === 0
                );
                const autoSpread = 40; // metres between buildings when auto-laid out
                const wx = allSameOffset
                    ? idx * autoSpread - ((buildings.length - 1) * autoSpread) / 2
                    : (building.offset_x ?? 0);
                const wz = allSameOffset ? 0 : (building.offset_y ?? 0);

                return (
                <group
                    key={building.id}
                    position={[wx, 0, wz]}
                >
                    <BuildingScene
                        building={building}
                        wallsByFloor={wallsByFloor}
                        sensors={sensors}
                        focusedSensorId={focusedSensorId}
                        setFocusedSensorId={setFocusedSensorId}
                        onSensorClick={onSensorClick}
                        blinkingWallIds={blinkingWallIds}
                    />
                </group>
                );
            })}

            <Grid position={[0, -0.01, 0]}
                infiniteGrid fadeDistance={300} fadeStrength={5}
                cellSize={2} sectionSize={10}
                cellColor={theme.gridCell} sectionColor={theme.gridSec}
                cellThickness={0.5} sectionThickness={1.0} />
        </group>
    );
};

export default SiteScene;
export { SceneLights };
