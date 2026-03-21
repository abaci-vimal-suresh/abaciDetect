

import React, { useState, useEffect, useMemo } from 'react';
import { Area, Wall } from '../../../../types/sensor';
import { useUpdateWall, useCreateWall, useDeleteWall, useWalls } from '../../../../api/sensors.api';
import { PreviewState, isAreaWallsPreview } from '../../utils/previewState';
import { WallDrawSettings } from '../walls/WallDrawingPanel';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import { CardBody, CardHeader } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import useDarkMode from '../../../../hooks/useDarkMode';
import DeleteWallModal from '../walls/DeleteWallModal';
import WallEditPanel from './WallEditPanel';
import WallDrawerPanel from './WallDrawerPanel';
import {
    calculateWallDiff,
    formatDiffSummary,
    formatDiffSummaryVerbose
} from '../../utils/wallDiff';
import {
    DEFAULT_WALL_HEIGHT,
    DEFAULT_WALL_COLOR,
    DEFAULT_WALL_THICKNESS
} from '../../../../constants/wallDefaults';

interface AreaSettingsOverlayProps {
    area: Area;
    onClose: () => void;
    onPreviewChange?: (values: { walls?: Wall[] } | null) => void;
    isDrawing?: boolean;
    onToggleDrawing?: (active: boolean) => void;
    newlyCreatedWalls?: Partial<Wall>[] | null;
    wallCreationTrigger?: number;
    onBlinkingWallsChange?: (ids: (number | string)[]) => void;
    externalSelectedWallId?: number | string | null;
    previewState?: PreviewState;
    // Wall Drawing Props
    drawSettings?: WallDrawSettings;
    onDrawSettingsChange?: (partial: Partial<WallDrawSettings>) => void;
    drawPointCount?: number;
    drawArcBufferCount?: number;
    drawCommittedCount?: number;
    onDrawFinish?: () => void;
    onDrawUndo?: () => void;
    onDrawClear?: () => void;
}

const AreaSettingsOverlay: React.FC<AreaSettingsOverlayProps> = ({
    area,
    onClose,
    onPreviewChange,
    isDrawing = false,
    onToggleDrawing,
    newlyCreatedWalls,
    wallCreationTrigger = 0,
    onBlinkingWallsChange,
    externalSelectedWallId,
    previewState,
    drawSettings,
    onDrawSettingsChange,
    drawPointCount = 0,
    drawArcBufferCount = 0,
    drawCommittedCount = 0,
    onDrawFinish,
    onDrawUndo,
    onDrawClear,
}) => {
    const { darkModeStatus } = useDarkMode();
    const { showNotification } = useToasterNotification();
    const { data: areaWalls, isLoading: wallsLoading } = useWalls(area.id);

    const updateWallMutation = useUpdateWall();
    const createWallMutation = useCreateWall();
    const deleteWallMutation = useDeleteWall();

    const [walls, setWalls] = useState<Wall[]>([]);
    const [originalWalls, setOriginalWalls] = useState<Wall[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [selectedWallId, setSelectedWallId] = useState<number | string | null>(null);
    const [deleteModalWall, setDeleteModalWall] = useState<{ wall: Wall; segmentNumber: number } | null>(null);

    useEffect(() => {
        if (areaWalls) {
            setWalls(areaWalls);
            setOriginalWalls(JSON.parse(JSON.stringify(areaWalls)));
            setIsDirty(false);
        }
    }, [areaWalls]);

    useEffect(() => {
        if (externalSelectedWallId !== undefined && externalSelectedWallId !== selectedWallId) {
            const wallInArea = walls.find(w => w.id === externalSelectedWallId);
            if (wallInArea) {
                setSelectedWallId(externalSelectedWallId);
                onBlinkingWallsChange?.([externalSelectedWallId]);
            }
        }
    }, [externalSelectedWallId, walls]);

    useEffect(() => {
        if (isAreaWallsPreview(previewState) && previewState.data.areaId === area.id) {
            const previewWalls = previewState.data.walls;
            if (JSON.stringify(previewWalls) !== JSON.stringify(walls)) {
                setWalls(previewWalls);
                setIsDirty(true);
            }
        }
    }, [previewState, area.id]);

    useEffect(() => {
        if (newlyCreatedWalls && newlyCreatedWalls.length > 0 && wallCreationTrigger > 0) {
            const newWallsToAdd: Wall[] = newlyCreatedWalls.map((wall, index) => ({
                id: `new-${Date.now()}-${index}-${Math.random()}`,
                r_x1: wall.r_x1 || 0,
                r_y1: wall.r_y1 || 0,
                r_x2: wall.r_x2 || 0,
                r_y2: wall.r_y2 || 0,
                r_height: wall.r_height || DEFAULT_WALL_HEIGHT,
                color: wall.color || DEFAULT_WALL_COLOR,
                thickness: wall.thickness || DEFAULT_WALL_THICKNESS,
                area_ids: [area.id]
            }));

            const updatedWalls = [...walls, ...newWallsToAdd];
            setWalls(updatedWalls);
            setIsDirty(true);
            const lastWall = newWallsToAdd[newWallsToAdd.length - 1];
            setSelectedWallId(lastWall.id);

            if (onPreviewChange) {
                onPreviewChange({ walls: updatedWalls });
            }
        }
    }, [wallCreationTrigger]);

    const handleWallChange = (wallId: number | string, field: keyof Wall, value: any) => {
        const newWalls = walls.map(w => w.id === wallId ? { ...w, [field]: value } : w);
        setWalls(newWalls);
        setIsDirty(true);
        if (onPreviewChange) onPreviewChange({ walls: newWalls });
    };

    const handleReset = () => {
        const initialWalls = JSON.parse(JSON.stringify(originalWalls));
        setWalls(initialWalls);
        setIsDirty(false);
        setSelectedWallId(null);
        onBlinkingWallsChange?.([]);
        if (onPreviewChange) onPreviewChange({ walls: initialWalls });
    };

    const handleSave = async () => {
        const newWallsList = walls.filter(w => String(w.id).startsWith('new-'));
        const existingWallsList = walls.filter(w => !String(w.id).startsWith('new-'));
        const deletedWallIds = originalWalls
            .filter(ow => !walls.find(w => w.id === ow.id))
            .map(ow => ow.id);

        try {
            await Promise.all(deletedWallIds.map(id => deleteWallMutation.mutateAsync(id)));
            const modifiedWalls = existingWallsList.filter((wall) => {
                const original = originalWalls.find(ow => ow.id === wall.id);
                return original && JSON.stringify(wall) !== JSON.stringify(original);
            });
            await Promise.all(modifiedWalls.map(wall =>
                updateWallMutation.mutateAsync({ wallId: wall.id, data: wall })
            ));
            await Promise.all(newWallsList.map(wall => {
                const { id, ...payload } = wall;
                return createWallMutation.mutateAsync({ ...payload, area_ids: [area.id] });
            }));
            if (onPreviewChange) onPreviewChange(null);
            onBlinkingWallsChange?.([]);
            onClose();
        } catch (error) {
            console.error('Error saving area walls:', error);
        }
    };

    const handleAddWall = () => {
        const newWall: Wall = {
            id: `new-${Date.now()}`,
            r_x1: 0, r_y1: 0, r_x2: 1, r_y2: 0,
            r_height: DEFAULT_WALL_HEIGHT,
            color: DEFAULT_WALL_COLOR,
            thickness: DEFAULT_WALL_THICKNESS,
            area_ids: [area.id]
        };
        const updatedWalls = [...walls, newWall];
        setWalls(updatedWalls);
        setIsDirty(true);
        setSelectedWallId(newWall.id);
        if (onPreviewChange) onPreviewChange({ walls: updatedWalls });
    };

    const handleDeleteWallConfirm = () => {
        if (!deleteModalWall) return;
        const isNew = String(deleteModalWall.wall.id).startsWith('new-');
        if (isNew) {
            const updatedWalls = walls.filter(w => w.id !== deleteModalWall.wall.id);
            setWalls(updatedWalls);
            setIsDirty(true);
            if (selectedWallId === deleteModalWall.wall.id) setSelectedWallId(null);
            if (onPreviewChange) onPreviewChange({ walls: updatedWalls });
            setDeleteModalWall(null);
        } else {
            deleteWallMutation.mutate(deleteModalWall.wall.id, {
                onSuccess: () => {
                    const updatedWalls = walls.filter(w => w.id !== deleteModalWall.wall.id);
                    setWalls(updatedWalls);
                    setOriginalWalls(prev => prev.filter(ow => ow.id !== deleteModalWall.wall.id));
                    if (selectedWallId === deleteModalWall.wall.id) {
                        setSelectedWallId(null);
                        onBlinkingWallsChange?.([]);
                    }
                    if (onPreviewChange) onPreviewChange({ walls: updatedWalls });
                    setDeleteModalWall(null);
                }
            });
        }
    };

    const calculateWallLength = (wall: Wall): string => {
        const dx = wall.r_x2 - wall.r_x1;
        const dy = wall.r_y2 - wall.r_y1;
        const normalizedLength = Math.sqrt(dx * dx + dy * dy);
        const estimatedLength = normalizedLength * 30;
        return estimatedLength < 1 ? `${(estimatedLength * 100).toFixed(0)}cm` : `${estimatedLength.toFixed(1)}m`;
    };

    const selectedWall = useMemo(() => walls.find(w => w.id === selectedWallId) || null, [walls, selectedWallId]);
    const wallDiff = useMemo(() => calculateWallDiff(originalWalls, walls), [originalWalls, walls]);
    const diffSummary = useMemo(() => formatDiffSummary(wallDiff), [wallDiff]);
    const diffSummaryVerbose = useMemo(() => formatDiffSummaryVerbose(wallDiff), [wallDiff]);

    return (
        <>
            <div className="area-settings-card h-100 d-flex flex-column overflow-auto scrollbar-hidden" style={{ animation: 'slide-in-right 0.4s ease-out', pointerEvents: 'auto' }}>
                <style>{`
                    @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                    .area-settings-card { backdrop-filter: blur(20px); background: ${darkModeStatus ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)'}; border-left: 1px solid ${darkModeStatus ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)'}; box-shadow: -5px 0 20px rgba(0,0,0,0.2); }
                `}</style>
                <CardHeader className="bg-transparent border-bottom p-2">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="text-truncate">
                            <h6 className={`mb-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.8rem' }}>
                                {selectedWall ? `Wall Seg ${walls.findIndex(w => w.id === selectedWall.id) + 1}` : `Area: ${area.name}`}
                            </h6>
                            <div className="small text-muted" style={{ fontSize: '0.65rem' }}>{selectedWall ? area.name : (area.area_type || 'Area')}</div>
                        </div>
                        <Button color="link" size="sm" onClick={onClose} icon="Close" className="p-1" />
                    </div>
                </CardHeader>
                <CardBody className="p-2 overflow-auto scrollbar-hidden flex-grow-1">
                    <div className="d-flex gap-1 mb-2">
                        <Button color={isDrawing ? "warning" : "info"} size="sm" className="flex-grow-1 p-1" style={{ fontSize: '0.7rem' }} isLight={!isDrawing} onClick={() => onToggleDrawing?.(!isDrawing)} icon={isDrawing ? "Mouse" : "AdsClick"}>
                            {isDrawing ? "Drawing" : "Draw"}
                        </Button>
                        <Button color="info" size="sm" className="flex-grow-1 p-1" style={{ fontSize: '0.7rem' }} isLight onClick={handleAddWall} icon="Add">Add</Button>
                    </div>

                    {wallsLoading ? (
                        <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-info" /></div>
                    ) : selectedWall ? (
                        <WallEditPanel
                            area={area}
                            selectedWall={selectedWall}
                            allWalls={walls}
                            onWallChange={handleWallChange}
                            onDeleteClick={(wall, num) => setDeleteModalWall({ wall, segmentNumber: num })}
                            onDeselect={() => { setSelectedWallId(null); onBlinkingWallsChange?.([]); }}
                            calculateWallLength={calculateWallLength}
                        />
                    ) : isDrawing ? (
                        <WallDrawerPanel
                            area={area}
                            drawSettings={drawSettings!}
                            onDrawSettingsChange={onDrawSettingsChange!}
                            drawPointCount={drawPointCount}
                            drawArcBufferCount={drawArcBufferCount}
                            drawCommittedCount={drawCommittedCount}
                            onDrawFinish={onDrawFinish!}
                            onDrawUndo={onDrawUndo!}
                            onDrawClear={onDrawClear!}
                            onToggleDrawing={onToggleDrawing!}
                            darkModeStatus={darkModeStatus}
                        />
                    ) : (
                        <div className="text-center py-5 text-muted opacity-50">
                            <Icon icon="AdsClick" size="3x" className="mb-3" />
                            <p className="small mb-0">Select a wall or click <strong>Draw</strong>.</p>
                        </div>
                    )}
                </CardBody>
                <div className="p-2 border-top" style={{ background: darkModeStatus ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                    {isDirty && (
                        <div className="mb-2 p-2 rounded" style={{ background: darkModeStatus ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.05)', border: '1px solid rgba(74, 144, 226, 0.3)' }}>
                            <div className="small text-muted mb-1">Changes:</div>
                            <div className="small fw-bold text-info">{diffSummaryVerbose}</div>
                        </div>
                    )}
                    <div className="d-grid gap-2">
                        <Button color="primary" onClick={handleSave} isDisable={!isDirty || updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending} data-save-button="true">
                            {updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending ? 'Saving...' : `Save Changes ${isDirty && diffSummary !== 'No changes' ? `(${diffSummary})` : ''}`}
                        </Button>
                        <Button color="light" isLight onClick={handleReset} isDisable={!isDirty || updateWallMutation.isPending || deleteWallMutation.isPending}>Reset All</Button>
                    </div>
                </div>
            </div>
            <DeleteWallModal isOpen={deleteModalWall !== null} wall={deleteModalWall?.wall || null} segmentNumber={deleteModalWall?.segmentNumber} onConfirm={handleDeleteWallConfirm} onCancel={() => setDeleteModalWall(null)} showDetails={true} />
        </>
    );
};

export default AreaSettingsOverlay;