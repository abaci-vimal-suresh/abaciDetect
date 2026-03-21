import React, { Suspense } from 'react';
import { ContactShadows, Grid, Html } from '@react-three/drei';
import { AreaNode, AreaWall, SensorNode } from '../Types/types';
import FloorSlab, { useHaloTheme } from '../Base/FloorSlab';
import FloorPlanImage from '../Base/FloorPlanImage';
import WallSegment from '../Elements/WallSegment';
import HaloSensorMarker from '../../Sensors/components/Marker/HaloSensorMarker';

interface BuildingSceneProps {
    building: AreaNode;
    wallsByFloor: Record<number, AreaWall[]>;
    sensors: SensorNode[];
    focusedSensorId: number | null;
    setFocusedSensorId: (id: number | null) => void;
    onSensorClick?: (sensor: SensorNode) => void;
    blinkingWallIds?: (number | string)[];
}

const BuildingScene: React.FC<BuildingSceneProps> = ({
    building, wallsByFloor, sensors, focusedSensorId, setFocusedSensorId, onSensorClick, blinkingWallIds = []
}) => {
    const floors = (building.children ?? [])
        .filter(c => c.area_type === 'Floor')
        .sort((a, b) => (a.floor_level ?? 0) - (b.floor_level ?? 0));

    const theme = useHaloTheme();

    return (
        <group>
            <ContactShadows position={[0, -0.01, 0]}
                opacity={0.3} scale={100} blur={2}
                far={10} color="#000820" />

            {floors.map(floor => {
                const fw = floor.floor_width ?? 20;
                const fd = floor.floor_depth ?? 15;
                const fy = floor.offset_z ?? 0;
                const walls = wallsByFloor[floor.id] ?? [];

                return (
                    <group key={floor.id}>
                        <FloorSlab fw={fw} fd={fd} floorY={fy} />

                        {floor.area_plan && (
                            <Suspense fallback={null}>
                                <group position={[0, fy, 0]}>
                                    <FloorPlanImage
                                        url={floor.area_plan}
                                        w={fw} d={fd} />
                                </group>
                            </Suspense>
                        )}

                        {walls.map(wall => (
                            <WallSegment
                                key={wall.id}
                                wall={wall}
                                fw={fw} fd={fd}
                                floorY={fy}
                                isBlinking={blinkingWallIds.includes(wall.id)}
                            />
                        ))}

                        {sensors
                            .filter(s => s.floor_id === floor.id)
                            .map(sensor => (
                                <HaloSensorMarker
                                    key={sensor.id}
                                    sensor={sensor}
                                    fw={fw}
                                    fd={fd}
                                    floorY={fy}
                                    isFocused={focusedSensorId === sensor.id}
                                    onClick={clickedSensor => {
                                        setFocusedSensorId(clickedSensor.id);
                                        onSensorClick?.(clickedSensor);
                                    }}
                                />
                            ))}

                        <Html
                            position={[fw / 2 + 1.5, fy + 0.5, 0]}
                            center distanceFactor={22}
                            style={{
                                pointerEvents: 'none',
                                userSelect: 'none',
                            }}>
                            <div style={{
                                background: theme.labelBg,
                                border: `1px solid ${theme.labelBorder}`,
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 9,
                                fontWeight: 600,
                                color: theme.labelTextColor,
                                whiteSpace: 'nowrap',
                                backdropFilter: 'blur(6px)',
                            }}>
                                {floor.name}
                                <span style={{ opacity: 0.5, marginLeft: 4 }}>
                                    L{floor.floor_level}
                                </span>
                            </div>
                        </Html>
                    </group>
                );
            })}

            <Grid position={[0, -0.01, 0]}
                infiniteGrid fadeDistance={80} fadeStrength={4}
                cellSize={1} sectionSize={5}
                cellColor={theme.gridCell} sectionColor={theme.gridSec}
                cellThickness={0.6} sectionThickness={1.2} />
        </group>
    );
};

export default BuildingScene;
