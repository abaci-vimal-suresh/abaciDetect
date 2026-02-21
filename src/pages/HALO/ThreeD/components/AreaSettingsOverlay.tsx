/**
 * Area Settings Overlay - Wall Management with Grid Cards + Side Drawer
 * 
 * ✨ NEW FEATURES:
 * - Grid layout (4 cards per row)
 * - Side drawer for editing individual walls
 * - Card-based wall selection
 * - Smooth animations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Area, Wall } from '../../../../types/sensor';
import { useUpdateWall, useCreateWall, useDeleteWall, useWalls } from '../../../../api/sensors.api';
import { PreviewState, isAreaWallsPreview } from '../utils/previewState';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import Card, { CardBody, CardHeader } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';
import DeleteWallModal from './DeleteWallModal';
import {
    calculateWallDiff,
    formatDiffSummary,
    formatDiffSummaryVerbose
} from '../utils/wallDiff';
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
    newlyCreatedWall?: Partial<Wall> | null;
    wallCreationTrigger?: number;
    onBlinkingWallsChange?: (ids: (number | string)[]) => void;
    externalSelectedWallId?: number | string | null;
    previewState?: PreviewState;
}

const AreaSettingsOverlay: React.FC<AreaSettingsOverlayProps> = ({
    area,
    onClose,
    onPreviewChange,
    isDrawing = false,
    onToggleDrawing,
    newlyCreatedWall,
    wallCreationTrigger = 0,
    onBlinkingWallsChange,
    externalSelectedWallId,
    previewState
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

    // ✨ NEW: Selected wall for drawer
    const [selectedWallId, setSelectedWallId] = useState<number | string | null>(null);

    // Delete confirmation modal
    const [deleteModalWall, setDeleteModalWall] = useState<{ wall: Wall; segmentNumber: number } | null>(null);

    // ============================================
    // SYNC STATE
    // ============================================

    useEffect(() => {
        if (areaWalls) {
            setWalls(areaWalls);
            setOriginalWalls(JSON.parse(JSON.stringify(areaWalls)));
            setIsDirty(false);
        }
    }, [areaWalls]);

    // ============================================
    // SYNC EXTERNAL SELECTION (From 3D Scene)
    // ============================================

    useEffect(() => {
        if (externalSelectedWallId !== undefined && externalSelectedWallId !== selectedWallId) {
            // Check if this wall belongs to the current area before selecting
            const wallInArea = walls.find(w => w.id === externalSelectedWallId);
            if (wallInArea) {
                console.log('🐞 selection_debug: Syncing from 3D scene:', {
                    wallId: externalSelectedWallId,
                    coords: {
                        r_x1: wallInArea.r_x1,
                        r_y1: wallInArea.r_y1,
                        r_x2: wallInArea.r_x2,
                        r_y2: wallInArea.r_y2
                    }
                });
                setSelectedWallId(externalSelectedWallId);

                // Trigger notification if it's a new selection
                const wallIdx = walls.findIndex(w => w.id === externalSelectedWallId);
                showNotification('Wall Selection', `Wall segment ${wallIdx + 1} selected from 3D scene`, 'info');

                // Ensure it's blinking
                onBlinkingWallsChange?.([externalSelectedWallId]);
            }
        }
    }, [externalSelectedWallId, walls]);

    // ============================================
    // ✨ NEW: SYNC FROM 3D DRAG (previewState)
    // ============================================

    useEffect(() => {
        if (isAreaWallsPreview(previewState) && previewState.data.areaId === area.id) {
            const previewWalls = previewState.data.walls;
            // Only update if different and not currently dragging (to avoid jumpiness)
            // But actually we want it to update while dragging for real-time form feedback
            if (JSON.stringify(previewWalls) !== JSON.stringify(walls)) {
                console.log('AreaSettingsOverlay: Syncing walls from previewState (3D Drag)');
                setWalls(previewWalls);
                setIsDirty(true);
            }
        }
    }, [previewState, area.id]);

    // ============================================
    // HANDLE NEW WALLS FROM 3D SCENE
    // ============================================

    useEffect(() => {
        if (newlyCreatedWall && wallCreationTrigger > 0) {
            const newWall: Wall = {
                id: `new-${Date.now()}`,
                r_x1: newlyCreatedWall.r_x1 || 0,
                r_y1: newlyCreatedWall.r_y1 || 0,
                r_x2: newlyCreatedWall.r_x2 || 0,
                r_y2: newlyCreatedWall.r_y2 || 0,
                r_height: newlyCreatedWall.r_height || DEFAULT_WALL_HEIGHT,
                color: newlyCreatedWall.color || DEFAULT_WALL_COLOR,
                thickness: newlyCreatedWall.thickness || DEFAULT_WALL_THICKNESS,
                area_ids: [area.id]
            };

            const updatedWalls = [...walls, newWall];
            setWalls(updatedWalls);
            setIsDirty(true);

            // ✨ NEW: Auto-select the newly created wall
            setSelectedWallId(newWall.id);

            if (onPreviewChange) {
                onPreviewChange({ walls: updatedWalls });
            }
        }
    }, [wallCreationTrigger]);

    // ============================================
    // WALL CHANGE HANDLER
    // ============================================

    const handleWallChange = (wallId: number | string, field: keyof Wall, value: any) => {
        const newWalls = walls.map(w => w.id === wallId ? { ...w, [field]: value } : w);
        setWalls(newWalls);
        setIsDirty(true);

        if (onPreviewChange) {
            onPreviewChange({ walls: newWalls });
        }
    };

    // ============================================
    // RESET HANDLER
    // ============================================

    const handleReset = () => {
        const initialWalls = JSON.parse(JSON.stringify(originalWalls));
        setWalls(initialWalls);
        setIsDirty(false);
        setSelectedWallId(null);
        onBlinkingWallsChange?.([]);

        if (onPreviewChange) {
            onPreviewChange({ walls: initialWalls });
        }
    };

    // ============================================
    // SAVE HANDLER
    // ============================================

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
                return createWallMutation.mutateAsync({
                    ...payload,
                    area_ids: [area.id]
                });
            }));

            if (onPreviewChange) {
                onPreviewChange(null);
            }
            onBlinkingWallsChange?.([]);
            onClose();
        } catch (error) {
            console.error('Error saving area walls:', error);
        }
    };

    // ============================================
    // ADD WALL HANDLER
    // ============================================

    const handleAddWall = () => {
        const newWall: Wall = {
            id: `new-${Date.now()}`,
            r_x1: 0,
            r_y1: 0,
            r_x2: 1,
            r_y2: 0,
            r_height: DEFAULT_WALL_HEIGHT,
            color: DEFAULT_WALL_COLOR,
            thickness: DEFAULT_WALL_THICKNESS,
            area_ids: [area.id]
        };
        const updatedWalls = [...walls, newWall];
        setWalls(updatedWalls);
        setIsDirty(true);

        // ✨ NEW: Auto-select the new wall
        setSelectedWallId(newWall.id);

        if (onPreviewChange) {
            onPreviewChange({ walls: updatedWalls });
        }
    };

    // ============================================
    // DELETE WALL HANDLERS
    // ============================================

    const handleDeleteWallClick = (wall: Wall, segmentNumber: number) => {
        setDeleteModalWall({ wall, segmentNumber });
    };

    const handleDeleteWallConfirm = () => {
        if (!deleteModalWall) return;

        const updatedWalls = walls.filter(w => w.id !== deleteModalWall.wall.id);
        setWalls(updatedWalls);
        setIsDirty(true);

        // ✨ NEW: Close drawer if deleted wall was selected
        if (selectedWallId === deleteModalWall.wall.id) {
            setSelectedWallId(null);
        }

        if (onPreviewChange) {
            onPreviewChange({ walls: updatedWalls });
        }

        setDeleteModalWall(null);
    };

    // ============================================
    // ✨ NEW: CALCULATE WALL LENGTH
    // ============================================

    const calculateWallLength = (wall: Wall): string => {
        const dx = wall.r_x2 - wall.r_x1;
        const dy = wall.r_y2 - wall.r_y1;
        const normalizedLength = Math.sqrt(dx * dx + dy * dy);

        // Assuming typical building is ~30m x 30m
        const estimatedLength = normalizedLength * 30;

        if (estimatedLength < 1) {
            return `${(estimatedLength * 100).toFixed(0)}cm`;
        } else {
            return `${estimatedLength.toFixed(1)}m`;
        }
    };

    // ============================================
    // DIFF SUMMARY
    // ============================================

    const wallDiff = useMemo(() => {
        return calculateWallDiff(originalWalls, walls);
    }, [originalWalls, walls]);

    const diffSummary = useMemo(() => {
        return formatDiffSummary(wallDiff);
    }, [wallDiff]);

    const diffSummaryVerbose = useMemo(() => {
        return formatDiffSummaryVerbose(wallDiff);
    }, [wallDiff]);

    // ✨ NEW: Get selected wall object
    const selectedWall = useMemo(() => {
        return walls.find(w => w.id === selectedWallId) || null;
    }, [walls, selectedWallId]);

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            <div
                className='h-100 p-0'
                style={{
                    width: '100%',
                    zIndex: 1100,
                    pointerEvents: 'auto',
                    animation: 'slide-in-right 0.4s ease-out'
                }}
            >
                <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .area-settings-card {
                    backdrop-filter: blur(20px);
                    background: ${darkModeStatus ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)'};
                    border-left: 1px solid ${darkModeStatus ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)'};
                    box-shadow: -5px 0 20px rgba(0,0,0,0.2);
                }
            `}</style>

                <div className="area-settings-card h-100 d-flex flex-column overflow-auto scrollbar-hidden">
                    <CardHeader className="bg-transparent border-bottom p-2">
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <div className="text-truncate" style={{ maxWidth: '120px' }}>
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
                            <Button
                                color={isDrawing ? "warning" : "info"}
                                size="sm"
                                className="flex-grow-1 p-1"
                                style={{ fontSize: '0.7rem' }}
                                isLight={!isDrawing}
                                onClick={() => onToggleDrawing?.(!isDrawing)}
                                icon={isDrawing ? "Mouse" : "AdsClick"}
                            >
                                {isDrawing ? "Drawing" : "Draw"}
                            </Button>
                            <Button
                                color="info"
                                size="sm"
                                className="flex-grow-1 p-1"
                                style={{ fontSize: '0.7rem' }}
                                isLight
                                onClick={handleAddWall}
                                icon="Add"
                            >
                                Add
                            </Button>
                        </div>

                        {wallsLoading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-info" />
                            </div>
                        ) : selectedWall ? (
                            <div style={{ animation: 'slideInFromRight 0.3s ease' }}>
                                {/* Start Point */}
                                <div className="mb-2">
                                    <div className="d-flex align-items-center mb-1">
                                        <Icon icon="PlayCircle" className="text-info me-1" size="sm" />
                                        <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>Start Point</span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <div className="flex-grow-1 d-flex align-items-center bg-dark bg-opacity-10 rounded p-1 border border-secondary border-opacity-10">
                                            <span className="text-muted fw-bold me-1 ms-1" style={{ fontSize: '0.6rem' }}>X</span>
                                            <input
                                                type="number"
                                                step={0.01}
                                                value={selectedWall.r_x1}
                                                className="bg-transparent border-0 text-white w-100 p-0 text-center"
                                                style={{ fontSize: '0.75rem', outline: 'none' }}
                                                onChange={(e) => handleWallChange(selectedWall.id, 'r_x1', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex-grow-1 d-flex align-items-center bg-dark bg-opacity-10 rounded p-1 border border-secondary border-opacity-10">
                                            <span className="text-muted fw-bold me-1 ms-1" style={{ fontSize: '0.6rem' }}>Y</span>
                                            <input
                                                type="number"
                                                step={0.01}
                                                value={selectedWall.r_y1}
                                                className="bg-transparent border-0 text-white w-100 p-0 text-center"
                                                style={{ fontSize: '0.75rem', outline: 'none' }}
                                                onChange={(e) => handleWallChange(selectedWall.id, 'r_y1', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* End Point */}
                                <div className="mb-2">
                                    <div className="d-flex align-items-center mb-1">
                                        <Icon icon="FiberManualRecord" className="text-danger me-1" size="sm" />
                                        <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>End Point</span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <div className="flex-grow-1 d-flex align-items-center bg-dark bg-opacity-10 rounded p-1 border border-secondary border-opacity-10">
                                            <span className="text-muted fw-bold me-1 ms-1" style={{ fontSize: '0.6rem' }}>X</span>
                                            <input
                                                type="number"
                                                step={0.01}
                                                value={selectedWall.r_x2}
                                                className="bg-transparent border-0 text-white w-100 p-0 text-center"
                                                style={{ fontSize: '0.75rem', outline: 'none' }}
                                                onChange={(e) => handleWallChange(selectedWall.id, 'r_x2', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex-grow-1 d-flex align-items-center bg-dark bg-opacity-10 rounded p-1 border border-secondary border-opacity-10">
                                            <span className="text-muted fw-bold me-1 ms-1" style={{ fontSize: '0.6rem' }}>Y</span>
                                            <input
                                                type="number"
                                                step={0.01}
                                                value={selectedWall.r_y2}
                                                className="bg-transparent border-0 text-white w-100 p-0 text-center"
                                                style={{ fontSize: '0.75rem', outline: 'none' }}
                                                onChange={(e) => handleWallChange(selectedWall.id, 'r_y2', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Wall Properties */}
                                <div className="mb-2">
                                    <div className="d-flex align-items-center mb-1">
                                        <Icon icon="Settings" className="text-warning me-1" size="sm" />
                                        <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>Properties</span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2 bg-dark bg-opacity-10 rounded p-1 border border-secondary border-opacity-10">
                                        <span className="text-muted fw-bold me-2 ms-1" style={{ fontSize: '0.6rem' }}>HEIGHT</span>
                                        <input
                                            type="number"
                                            step={0.1}
                                            value={selectedWall.r_height || DEFAULT_WALL_HEIGHT}
                                            className="bg-transparent border-0 text-white w-100 p-0"
                                            style={{ fontSize: '0.75rem', outline: 'none' }}
                                            onChange={(e) => handleWallChange(selectedWall.id, 'r_height', parseFloat(e.target.value) || 0)}
                                        />
                                        <span className="text-muted x-small me-1" style={{ fontSize: '0.6rem' }}>m</span>
                                    </div>
                                    <div className="d-flex align-items-center mb-2 bg-dark bg-opacity-10 rounded p-1 border border-secondary border-opacity-10">
                                        <span className="text-muted fw-bold me-2 ms-1" style={{ fontSize: '0.6rem' }}>COLOR</span>
                                        <input
                                            type="color"
                                            value={selectedWall.color || DEFAULT_WALL_COLOR}
                                            className="p-0 border-0 bg-transparent cursor-pointer"
                                            style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                                            onChange={(e) => handleWallChange(selectedWall.id, 'color', e.target.value)}
                                        />
                                        <span className="text-muted font-monospace ms-2" style={{ fontSize: '0.65rem' }}>{selectedWall.color || DEFAULT_WALL_COLOR}</span>
                                    </div>
                                </div>

                                {/* Wall Info */}
                                <div className="mb-3 p-2 rounded bg-info bg-opacity-10">
                                    <div className="small text-muted mb-1">Wall Info:</div>
                                    <div className="small">
                                        <div>Length: <strong>{calculateWallLength(selectedWall)}</strong></div>
                                        <div>Height: <strong>{(selectedWall.r_height || DEFAULT_WALL_HEIGHT).toFixed(2)}m</strong></div>
                                    </div>
                                </div>

                                <Button
                                    color="danger"
                                    isLight
                                    className="w-100 mb-2"
                                    onClick={() => handleDeleteWallClick(
                                        selectedWall,
                                        walls.findIndex(w => w.id === selectedWall.id) + 1
                                    )}
                                    icon="Delete"
                                >
                                    Delete Segment
                                </Button>

                                <Button
                                    color="light"
                                    className="w-100 text-muted"
                                    onClick={() => {
                                        setSelectedWallId(null);
                                        onBlinkingWallsChange?.([]);
                                    }}
                                >
                                    Deselect
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted opacity-50">
                                <Icon icon="AdsClick" size="3x" className="mb-3" />
                                <p className="small mb-0">Select a wall segment in the 3D scene to edit its properties.</p>
                            </div>
                        )}
                    </CardBody>

                    {/* Footer with Save/Reset */}
                    <div
                        className="p-2 border-top"
                        style={{ background: darkModeStatus ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}
                    >
                        {isDirty && (
                            <div className="mb-2 p-2 rounded" style={{
                                background: darkModeStatus ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.05)',
                                border: '1px solid rgba(74, 144, 226, 0.3)'
                            }}>
                                <div className="small text-muted mb-1">Changes to be saved:</div>
                                <div className="small fw-bold text-info">{diffSummaryVerbose}</div>
                            </div>
                        )}

                        <div className="d-grid gap-2">
                            <Button
                                color="primary"
                                onClick={handleSave}
                                isDisable={!isDirty || updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending}
                                data-save-button="true"
                            >
                                {updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Save Changes
                                        {isDirty && diffSummary !== 'No changes' && (
                                            <span className="ms-2 opacity-75">({diffSummary})</span>
                                        )}
                                    </>
                                )}
                            </Button>
                            <Button
                                color="light"
                                onClick={handleReset}
                                isDisable={!isDirty || updateWallMutation.isPending || deleteWallMutation.isPending}
                            >
                                Reset All
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteWallModal
                isOpen={deleteModalWall !== null}
                wall={deleteModalWall?.wall || null}
                segmentNumber={deleteModalWall?.segmentNumber}
                onConfirm={handleDeleteWallConfirm}
                onCancel={() => setDeleteModalWall(null)}
                showDetails={true}
            />

            {/* ✨ NEW: Animation CSS (add to ThreeDPage.scss) */}
            <style>{`
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
};

export default AreaSettingsOverlay;