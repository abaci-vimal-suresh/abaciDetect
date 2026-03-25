import React, { Suspense, useMemo } from 'react';
import { ContactShadows, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AreaNode, AreaWall, SensorNode } from '../Types/types';
import { UseWallDrawingReturn } from '../hooks/useWallDrawing';
import FloorSlab, { useHaloTheme } from '../Base/FloorSlab';
import FloorPlanImage from '../Base/FloorPlanImage';
import WallSegment from '../Elements/WallSegment';
import RaycastFloor from '../Base/RaycastFloor';
import DrawingOverlay from '../Interaction/DrawingOverlay';
import HaloSensorMarker from '../../Sensors/components/Marker/HaloSensorMarker';
import { SceneLights } from './SiteScene';

interface FloorSceneProps {
    floor: AreaNode;
    walls: AreaWall[];
    sensors: SensorNode[];
    drawing: UseWallDrawingReturn;
    selectedAreaId: number | null;
    focusedSensorId: number | null;
    setFocusedSensorId: (id: number | null) => void;
    isPlacing?: boolean;
    placementPreview?: { nx: number; ny: number } | null;
    onSensorPlaced?: (nx: number, ny: number) => void;
    onSensorClick?: (sensor: SensorNode) => void;
    onUpdatePlacementPreview?: (nx: number, ny: number) => void;
    blinkingWallIds?: (number | string)[];
    onWallClick?: (wall: AreaWall) => void;
    selectedWallId?: number | string | null;
}

const FloorScene: React.FC<FloorSceneProps> = ({
    floor, walls, sensors, drawing, selectedAreaId,
    focusedSensorId, setFocusedSensorId,
    isPlacing = false, placementPreview = null,
    onSensorPlaced, onSensorClick, onUpdatePlacementPreview,
    blinkingWallIds = [],
    onWallClick, selectedWallId,
}) => {
    const theme = useHaloTheme();
    const fw = floor.floor_width ?? 20;
    const fd = floor.floor_depth ?? 15;

    const areaWallIds = useMemo(() => {
        if (!selectedAreaId) return new Set<number | string>();
        return new Set(
            walls
                .filter(w =>
                    w.sub_area_id === selectedAreaId ||
                    w.area_id === selectedAreaId
                )
                .map(w => w.id)
        );
    }, [walls, selectedAreaId]);

    return (
        <group>
            <SceneLights />
            <ContactShadows position={[0, -0.01, 0]}
                opacity={0.3}
                scale={Math.max(fw, fd) * 2}
                blur={2} far={10} color="#000820" />

            <FloorSlab
                fw={fw} fd={fd} floorY={0}
                hasImage={!!floor.area_plan} />

            {floor.area_plan && (
                <Suspense fallback={null}>
                    <FloorPlanImage
                        url={floor.area_plan}
                        w={fw} d={fd} />
                </Suspense>
            )}

            <Html position={[fw / 2 + 1.5, 0.5, 0]}
                center distanceFactor={22}
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{
                    background: theme.labelBg,
                    border: `1px solid ${theme.labelBorder}`,
                    borderRadius: 6, padding: '4px 10px',
                    fontSize: 10, fontWeight: 600,
                    color: theme.labelTextColor, whiteSpace: 'nowrap',
                    backdropFilter: 'blur(6px)',
                }}>
                    {floor.name}
                    <span style={{ opacity: 0.6, marginLeft: 6 }}>
                        {fw}m × {fd}m
                    </span>
                </div>
            </Html>

            {walls.map(wall => (
                <WallSegment
                    key={wall.id}
                    wall={wall}
                    fw={fw} fd={fd} floorY={0}
                    isPreview={
                        typeof wall.id === 'number' && wall.id < 0 &&
                        drawing.drawnWalls.some(dw => dw.id === wall.id)
                    }
                    isAlert={
                        selectedAreaId !== null &&
                        areaWallIds.has(wall.id)
                    }
                    isSelected={wall.id === selectedWallId}
                    isBlinking={blinkingWallIds.includes(wall.id)}
                    onClick={
                        // only clickable for saved walls (positive id), not while drawing
                        !drawing.isDrawing && typeof wall.id === 'number' && wall.id > 0
                            ? onWallClick
                            : undefined
                    }
                />
            ))}

            {sensors.map(sensor => (
                <HaloSensorMarker
                    key={sensor.id}
                    sensor={sensor}
                    fw={fw}
                    fd={fd}
                    floorY={0}
                    isFocused={focusedSensorId === sensor.id}
                    onClick={clickedSensor => {
                        setFocusedSensorId(clickedSensor.id);
                        onSensorClick?.(clickedSensor);
                    }}
                />
            ))}

            {isPlacing && placementPreview && (
                <group position={[
                    placementPreview.nx * fw - fw / 2,
                    0.05,
                    placementPreview.ny * fd - fd / 2,
                ]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[1.5, 2.0, 48]} />
                        <meshBasicMaterial
                            color="#06d6a0"
                            transparent
                            opacity={0.5}
                            depthWrite={false}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.25, 24]} />
                        <meshBasicMaterial
                            color="#06d6a0"
                            transparent opacity={0.9}
                            depthWrite={false}
                        />
                    </mesh>
                    <mesh position={[0, 1.5, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 3.0, 8]} />
                        <meshBasicMaterial
                            color="#06d6a0"
                            transparent opacity={0.4}
                        />
                    </mesh>
                    <Html position={[0, 3.2, 0]} center distanceFactor={20}
                        style={{ pointerEvents: 'none' }}>
                        <div style={{
                            background: 'rgba(6,214,160,0.15)',
                            border: '1px solid rgba(6,214,160,0.5)',
                            borderRadius: 6, padding: '2px 10px',
                            fontSize: 10, fontWeight: 700,
                            color: '#06d6a0', whiteSpace: 'nowrap',
                        }}>
                            Click to place
                        </div>
                    </Html>
                </group>
            )}

            <RaycastFloor
                fw={fw} fd={fd} floorY={0}
                drawing={drawing}
                isPlacing={isPlacing}
                onSensorPlaced={onSensorPlaced}
                onUpdatePlacementPreview={onUpdatePlacementPreview}
            />

            <DrawingOverlay drawing={drawing} fw={fw} fd={fd} />

            <Grid position={[0, -0.005, 0]}
                infiniteGrid
                fadeDistance={Math.max(fw, fd) * 2.5}
                fadeStrength={4}
                cellSize={1} sectionSize={5}
                cellColor={theme.gridCell} sectionColor={theme.gridSec}
                cellThickness={0.6} sectionThickness={1.2} />
        </group>
    );
};

export default FloorScene;
