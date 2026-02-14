import React, { useState, useEffect } from 'react';
import { Area, Wall } from '../../../../types/sensor';
import { useUpdateWall, useCreateWall, useDeleteWall, useWalls } from '../../../../api/sensors.api';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';

interface AreaSettingsOverlayProps {
    area: Area;
    onClose: () => void;
    onPreviewChange?: (values: { walls?: Wall[] }) => void;
    isDrawing?: boolean;
    onToggleDrawing?: (active: boolean) => void;
    newlyCreatedWall?: Partial<Wall> | null;
}

const AreaSettingsOverlay: React.FC<AreaSettingsOverlayProps> = ({
    area,
    onClose,
    onPreviewChange,
    isDrawing = false,
    onToggleDrawing,
    newlyCreatedWall
}) => {
    const { darkModeStatus } = useDarkMode();
    const { data: areaWalls, isLoading: wallsLoading } = useWalls(area.id);

    const updateWallMutation = useUpdateWall();
    const createWallMutation = useCreateWall();
    const deleteWallMutation = useDeleteWall();

    const [walls, setWalls] = useState<Wall[]>([]);
    const [originalWalls, setOriginalWalls] = useState<Wall[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Sync state when API data loads
    useEffect(() => {
        if (areaWalls) {
            setWalls(areaWalls);
            setOriginalWalls(JSON.parse(JSON.stringify(areaWalls)));
            setIsDirty(false);
        }
    }, [areaWalls]);

    // Handle walls added from the 3D scene
    useEffect(() => {
        if (newlyCreatedWall) {
            console.log('AreaSettingsOverlay: Received newlyCreatedWall:', newlyCreatedWall);
            const newWall: Wall = {
                id: `new-${Date.now()}`,
                r_x1: newlyCreatedWall.r_x1 || 0,
                r_y1: newlyCreatedWall.r_y1 || 0,
                r_x2: newlyCreatedWall.r_x2 || 0,
                r_y2: newlyCreatedWall.r_y2 || 0,
                r_height: newlyCreatedWall.r_height || 2.4,
                color: newlyCreatedWall.color || '#ffffff',
                area_ids: [area.id]
            };
            const updatedWalls = [...walls, newWall];
            setWalls(updatedWalls);
            setIsDirty(true);
            if (onPreviewChange) {
                onPreviewChange({ walls: updatedWalls });
            }
        }
    }, [newlyCreatedWall]);

    const handleWallChange = (wallId: number | string, field: keyof Wall, value: any) => {
        const newWalls = walls.map(w => w.id === wallId ? { ...w, [field]: value } : w);
        setWalls(newWalls);
        setIsDirty(true);

        if (onPreviewChange) {
            onPreviewChange({ walls: newWalls });
        }
    };

    const handleReset = () => {
        const initialWalls = JSON.parse(JSON.stringify(originalWalls));
        setWalls(initialWalls);
        setIsDirty(false);

        if (onPreviewChange) {
            onPreviewChange({ walls: initialWalls });
        }
    };

    const handleSave = async () => {
        const newWallsList = walls.filter(w => String(w.id).startsWith('new-'));
        const existingWallsList = walls.filter(w => !String(w.id).startsWith('new-'));
        const deletedWallIds = originalWalls
            .filter(ow => !walls.find(w => w.id === ow.id))
            .map(ow => ow.id);

        try {
            // 1. Delete
            await Promise.all(deletedWallIds.map(id => deleteWallMutation.mutateAsync(id)));

            // 2. Update
            const modifiedWalls = existingWallsList.filter((wall) => {
                const original = originalWalls.find(ow => ow.id === wall.id);
                return original && JSON.stringify(wall) !== JSON.stringify(original);
            });
            await Promise.all(modifiedWalls.map(wall =>
                updateWallMutation.mutateAsync({ wallId: wall.id, data: wall })
            ));

            // 3. Create
            await Promise.all(newWallsList.map(wall => {
                const { id, ...payload } = wall;
                return createWallMutation.mutateAsync({
                    ...payload,
                    area_ids: [area.id]
                });
            }));

            if (onPreviewChange) {
                onPreviewChange({});
            }
            onClose();
        } catch (error) {
            console.error('Error saving area walls:', error);
        }
    };

    const handleAddWall = () => {
        const newWall: Wall = {
            id: `new-${Date.now()}`,
            r_x1: 0, r_y1: 0, r_x2: 1, r_y2: 0,
            r_height: 2.4,
            color: '#ffffff',
            area_ids: [area.id]
        };
        const updatedWalls = [...walls, newWall];
        setWalls(updatedWalls);
        setIsDirty(true);
        if (onPreviewChange) {
            onPreviewChange({ walls: updatedWalls });
        }
    };

    const handleDeleteWall = (wallId: number | string) => {
        const updatedWalls = walls.filter(w => w.id !== wallId);
        setWalls(updatedWalls);
        setIsDirty(true);
        if (onPreviewChange) {
            onPreviewChange({ walls: updatedWalls });
        }
    };

    return (
        <div
            className='position-absolute end-0 p-0 shadow overflow-hidden d-flex flex-column'
            style={{
                top: '114px',
                background: darkModeStatus ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                width: '350px',
                maxHeight: 'calc(100% - 110px)',
                border: darkModeStatus ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                zIndex: 101
            }}
        >
            <Card className="mb-0 border-0 bg-transparent flex-grow-1 overflow-auto scrollbar-hidden">
                <CardHeader className="bg-transparent border-bottom p-3">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="text-truncate" style={{ maxWidth: '240px' }}>
                            <h6 className={`mb-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`}>
                                Walls: {area.name}
                            </h6>
                            <div className="small text-muted">{area.area_type || 'Area'}</div>
                        </div>
                        <Button color="link" size="sm" onClick={onClose} icon="Close" />
                    </div>
                </CardHeader>
                <CardBody className="p-3">
                    <div className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                            <Icon icon="ViewQuilt" className="text-info me-2" />
                            <h6 className="mb-0 text-uppercase small fw-bold text-info">Wall Segments</h6>
                            <div className="ms-auto d-flex gap-2">
                                <Button
                                    color={isDrawing ? "warning" : "info"}
                                    size="sm"
                                    isLight={!isDrawing}
                                    onClick={() => onToggleDrawing?.(!isDrawing)}
                                    icon={isDrawing ? "Mouse" : "AdsClick"}
                                    className={isDrawing ? "animate-pulse" : ""}
                                >
                                    {isDrawing ? "Click on Map..." : "Draw on Map"}
                                </Button>
                                <Button
                                    color="info" size="sm" isLight
                                    onClick={handleAddWall}
                                    icon="Add"
                                >
                                    Manual Add
                                </Button>
                            </div>
                        </div>

                        {wallsLoading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-info" />
                            </div>
                        ) : walls.length === 0 ? (
                            <div className="text-muted small py-2 text-center">No walls defined for this area</div>
                        ) : (
                            walls.map((wall, idx) => (
                                <div key={wall.id} className="mb-4 pb-3 border-bottom-dashed">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Badge color={String(wall.id).startsWith('new-') ? 'success' : 'light'} isLight className="text-dark">
                                            {String(wall.id).startsWith('new-') ? 'New Wall' : `Segment ${idx + 1}`}
                                        </Badge>
                                        <Button
                                            color="danger" size="sm" isLight
                                            onClick={() => handleDeleteWall(wall.id)}
                                            icon="Delete"
                                            className="p-1"
                                        />
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <FormGroup label="Start X (0-1)">
                                                <Input
                                                    type="number" step={0.01}
                                                    value={wall.r_x1}
                                                    onChange={(e: any) => handleWallChange(wall.id, 'r_x1', parseFloat(e.target.value) || 0)}
                                                />
                                            </FormGroup>
                                        </div>
                                        <div className="col-6">
                                            <FormGroup label="Start Y (0-1)">
                                                <Input
                                                    type="number" step={0.01}
                                                    value={wall.r_y1}
                                                    onChange={(e: any) => handleWallChange(wall.id, 'r_y1', parseFloat(e.target.value) || 0)}
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <FormGroup label="End X (0-1)">
                                                <Input
                                                    type="number" step={0.01}
                                                    value={wall.r_x2}
                                                    onChange={(e: any) => handleWallChange(wall.id, 'r_x2', parseFloat(e.target.value) || 0)}
                                                />
                                            </FormGroup>
                                        </div>
                                        <div className="col-6">
                                            <FormGroup label="End Y (0-1)">
                                                <Input
                                                    type="number" step={0.01}
                                                    value={wall.r_y2}
                                                    onChange={(e: any) => handleWallChange(wall.id, 'r_y2', parseFloat(e.target.value) || 0)}
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-6">
                                            <FormGroup label="Height (m)">
                                                <Input
                                                    type="number" step={0.1}
                                                    value={wall.r_height || 2.4}
                                                    onChange={(e: any) => handleWallChange(wall.id, 'r_height', parseFloat(e.target.value) || 0)}
                                                />
                                            </FormGroup>
                                        </div>
                                        <div className="col-6">
                                            <FormGroup label="Color">
                                                <Input
                                                    type="color"
                                                    value={wall.color || '#ffffff'}
                                                    onChange={(e: any) => handleWallChange(wall.id, 'color', e.target.value)}
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardBody>
                <div className="p-3 border-top mt-auto" style={{ background: darkModeStatus ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                    <div className="d-grid gap-2">
                        <Button
                            color="primary"
                            onClick={handleSave}
                            isDisable={!isDirty || updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending}
                        >
                            {updateWallMutation.isPending || createWallMutation.isPending || deleteWallMutation.isPending ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                        <Button
                            color="light"
                            onClick={handleReset}
                            isDisable={!isDirty || updateWallMutation.isPending || deleteWallMutation.isPending}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AreaSettingsOverlay;
