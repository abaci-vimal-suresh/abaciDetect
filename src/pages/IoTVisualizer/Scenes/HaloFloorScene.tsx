import React from 'react';
import { AreaNode, AreaWall, SensorNode } from '../Types/types';
import { SceneLevel } from '../DigitalTwinPage';
import { UseWallDrawingReturn } from '../hooks/useWallDrawing';

// ── Modular Scenes ────────────────────────────────────────────────────────────
import SiteScene from './SiteScene';
import BuildingScene from './BuildingScene';
import FloorScene from './FloorScene';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HaloFloorSceneProps {
    sceneLevel: SceneLevel;
    areaTree: AreaNode;
    selectedBuilding: AreaNode | null;
    selectedFloor: AreaNode | null;
    selectedAreaId: number | null;
    wallsByFloor: Record<number, AreaWall[]>;
    activeWalls: AreaWall[];
    sensors: SensorNode[];
    drawing: UseWallDrawingReturn;
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

/**
 * Main Switcher component for the 3D Scene.
 * Routes rendering to Site, Building, or Floor level depending on sceneLevel state.
 */
const HaloFloorScene: React.FC<HaloFloorSceneProps> = ({
    sceneLevel, areaTree, selectedBuilding, selectedFloor, selectedAreaId,
    wallsByFloor, activeWalls, sensors,
    drawing, focusedSensorId, setFocusedSensorId,
    isPlacing = false, placementPreview = null,
    onSensorPlaced, onSensorClick, onUpdatePlacementPreview,
    blinkingWallIds = [],
    onWallClick, selectedWallId,
}) => {
    switch (sceneLevel) {

        case 'site':
            return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    blinkingWallIds={blinkingWallIds}
                />
            );

        case 'building':
            if (!selectedBuilding) return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    blinkingWallIds={blinkingWallIds}
                />
            );
            return (
                <BuildingScene
                    building={selectedBuilding}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    blinkingWallIds={blinkingWallIds}
                />
            );

        case 'floor':
        case 'area':
            if (!selectedFloor) return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    blinkingWallIds={blinkingWallIds}
                />
            );
            return (
                <FloorScene
                    floor={selectedFloor}
                    walls={activeWalls}
                    sensors={sensors.filter(
                        s => s.floor_id === selectedFloor.id
                    )}
                    drawing={drawing}
                    selectedAreaId={selectedAreaId}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    isPlacing={isPlacing}
                    placementPreview={placementPreview}
                    onSensorPlaced={onSensorPlaced}
                    onUpdatePlacementPreview={onUpdatePlacementPreview}
                    blinkingWallIds={blinkingWallIds}
                    onWallClick={onWallClick}
                    selectedWallId={selectedWallId}
                />
            );

        default:
            return (
                <SiteScene
                    areaTree={areaTree}
                    wallsByFloor={wallsByFloor}
                    sensors={sensors}
                    focusedSensorId={focusedSensorId}
                    setFocusedSensorId={setFocusedSensorId}
                    onSensorClick={onSensorClick}
                    blinkingWallIds={blinkingWallIds}
                />
            );
    }
};

export default HaloFloorScene;
