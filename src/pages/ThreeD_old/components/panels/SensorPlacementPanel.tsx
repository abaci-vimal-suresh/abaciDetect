import React, { useState, useEffect, useMemo } from 'react';
import { Sensor, SensorUpdatePayload, Wall } from '../../../../types/sensor';
import { useUpdateSensor, useUpdateWall, useWalls } from '../../../../api/sensors.api';
import Card, { CardBody, CardHeader } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';
import DeleteWallModal from '../walls/DeleteWallModal';
import {
    calculateWallDiff,
    formatDiffSummary,
    formatDiffSummaryVerbose
} from '../../utils/wallDiff';
import { PreviewState, isSensorPositionPreview } from '../../utils/previewState';

interface SensorPlacementPanelProps {
    sensor: Sensor;
    originalSensor?: Sensor;
    onClose: () => void;
    onPreviewChange?: (values: (Partial<SensorUpdatePayload> & { walls?: Wall[] }) | null) => void;
    onBlinkingWallsChange?: (wallIds: (number | string)[]) => void;
    previewState?: PreviewState;
    externalWallToLink?: Wall | null;
    onExternalWallLinkHandled?: () => void;
}

const SensorPlacementPanel: React.FC<SensorPlacementPanelProps> = ({
    sensor,
    originalSensor,
    onClose,
    onPreviewChange,
    onBlinkingWallsChange,
    previewState,
    externalWallToLink,
    onExternalWallLinkHandled
}) => {
    const { darkModeStatus } = useDarkMode();
    const updateSensorMutation = useUpdateSensor();
    const updateWallMutation = useUpdateWall();

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    // Sensor position
    const [values, setValues] = useState<Partial<SensorUpdatePayload>>({
        id: sensor.id,
        x_val: sensor.x_val || 0,
        y_val: sensor.y_val || 0,
        z_val: sensor.z_val || 0,
    });

    // Walls
    const [walls, setWalls] = useState<Wall[]>(sensor.walls || []);
    const [originalWalls, setOriginalWalls] = useState<Wall[]>(JSON.parse(JSON.stringify(sensor.walls || [])));

    // Selected wall for mini details
    const [selectedWallId, setSelectedWallId] = useState<number | string | null>(null);

    // UI state
    const [isDirty, setIsDirty] = useState(false);
    const [hoveredWallId, setHoveredWallId] = useState<number | string | null>(null);

    // Delete confirmation modal
    const [unlinkModalWall, setUnlinkModalWall] = useState<{ wall: Wall; segmentNumber: number } | null>(null);

    // ============================================
    // FETCH AREA WALLS
    // ============================================

    const sensorAreaId = sensor.area_id || (sensor.area as any)?.id || sensor.area;
    const { data: areaWalls } = useWalls(sensorAreaId);

    // ============================================
    // SYNC FROM 3D DRAG
    // ============================================

    useEffect(() => {
        if (isSensorPositionPreview(previewState) && String(previewState.data.sensorId) === String(sensor.id)) {
            const { x_val, y_val, z_val } = previewState.data;
            if (x_val !== values.x_val || y_val !== values.y_val || z_val !== values.z_val) {
                setValues(prev => ({ ...prev, x_val, y_val, z_val }));
                setIsDirty(true);
            }
        }
    }, [previewState, sensor.id]);

    // ============================================
    // HANDLE EXTERNAL WALL LINK
    // ============================================

    useEffect(() => {
        if (externalWallToLink) {
            const alreadyLinked = walls.find(w => w.id === externalWallToLink.id);
            if (alreadyLinked) {
                const updatedWalls = walls.filter(w => w.id !== externalWallToLink.id);
                setWalls(updatedWalls);
                setIsDirty(true);
                if (selectedWallId === externalWallToLink.id) setSelectedWallId(null);
                if (onPreviewChange) onPreviewChange({ ...values, walls: updatedWalls });
            } else {
                handleLinkWall(externalWallToLink);
            }
            if (onExternalWallLinkHandled) onExternalWallLinkHandled();
        }
    }, [externalWallToLink, walls]);

    // ============================================
    // BLINKING WALLS SYNC
    // ============================================

    useEffect(() => {
        if (onBlinkingWallsChange) {
            const linkedIds = walls.map(w => w.id);
            const allBlinking = hoveredWallId ? [...linkedIds, hoveredWallId] : linkedIds;
            onBlinkingWallsChange(allBlinking);
        }
    }, [walls, hoveredWallId, onBlinkingWallsChange]);

    // ============================================
    // INPUT CHANGE HANDLER
    // ============================================

    const handleInputChange = (field: keyof SensorUpdatePayload, value: number) => {
        const newValues = { ...values, [field]: value };
        setValues(newValues);
        setIsDirty(true);
        if (onPreviewChange) onPreviewChange(newValues);
    };

    const handleLinkWall = (areaWall: Wall) => {
        if (walls.find(w => w.id === areaWall.id)) return;
        const updatedWalls = [...walls, areaWall];
        setWalls(updatedWalls);
        setIsDirty(true);
        setSelectedWallId(areaWall.id);
        if (onPreviewChange) onPreviewChange({ ...values, walls: updatedWalls });
    };

    const handleUnlinkWallConfirm = () => {
        if (!unlinkModalWall) return;
        const updatedWalls = walls.filter(w => w.id !== unlinkModalWall.wall.id);
        setWalls(updatedWalls);
        setIsDirty(true);
        if (selectedWallId === unlinkModalWall.wall.id) setSelectedWallId(null);
        if (onPreviewChange) onPreviewChange({ ...values, walls: updatedWalls });
        setUnlinkModalWall(null);
    };

    const handleSave = async () => {
        try {
            const modifiedWalls = walls.filter(wall => {
                const original = originalWalls.find(ow => ow.id === wall.id);
                return original && JSON.stringify(wall) !== JSON.stringify(original);
            });
            await Promise.all(modifiedWalls.map(wall => updateWallMutation.mutateAsync({ wallId: wall.id, data: wall })));
            
            const finalWallIds = walls.map(w => Number(w.id));
            await updateSensorMutation.mutateAsync({
                sensorId: sensor.id,
                data: { ...values, wall_ids: finalWallIds }
            });

            if (onPreviewChange) onPreviewChange(null);
            onClose();
        } catch (error) {
            console.error('Error saving sensor settings:', error);
        }
    };

    const selectedWall = useMemo(() => walls.find(w => w.id === selectedWallId) || null, [walls, selectedWallId]);
    const wallDiff = useMemo(() => calculateWallDiff(originalWalls, walls), [originalWalls, walls]);
    const diffSummary = useMemo(() => formatDiffSummary(wallDiff), [wallDiff]);

    const renderInput = (label: string, field: keyof SensorUpdatePayload) => {
        const value = (values[field] as number) ?? 0;
        return (
            <div className="d-flex align-items-center justify-content-between mb-2 p-1 rounded bg-dark bg-opacity-10 border border-secondary border-opacity-10">
                <div className="d-flex flex-column ms-1">
                    <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '0.05em' }}>{label}</span>
                    <span className="text-info fw-bold" style={{ fontSize: '0.65rem' }}>{value.toFixed(2)}m</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <Button color="light" size="sm" isLight className="p-0" style={{ width: '22px', height: '22px' }} onClick={() => handleInputChange(field, value - 0.1)}><Icon icon="Remove" size="sm" /></Button>
                    <input type="number" step={0.1} value={value} onChange={(e) => handleInputChange(field, parseFloat(e.target.value) || 0)} className={`bg-transparent border-0 text-center fw-bold p-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`} style={{ width: '35px', fontSize: '0.8rem', outline: 'none' }} />
                    <Button color="light" size="sm" isLight className="p-0" style={{ width: '22px', height: '22px' }} onClick={() => handleInputChange(field, value + 0.1)}><Icon icon="Add" size="sm" /></Button>
                </div>
            </div>
        );
    };

    return (
        <div className="sensor-settings-card h-100 d-flex flex-column overflow-auto scrollbar-hidden">
            <CardHeader className="bg-transparent border-bottom p-2">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="text-truncate">
                        <h6 className={`mb-0 ${darkModeStatus ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.8rem' }}>{sensor.name}</h6>
                        <div className="small text-muted font-monospace" style={{ fontSize: '0.6rem' }}>{sensor.mac_address}</div>
                    </div>
                    <Button color="link" size="sm" onClick={onClose} icon="Close" className="p-1" />
                </div>
            </CardHeader>
            <CardBody className="p-2">
                <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                        <Icon icon="LocationOn" className="text-info me-1" size="sm" />
                        <h6 className="mb-0 text-uppercase x-small fw-bold text-info" style={{ fontSize: '0.65rem' }}>Position</h6>
                    </div>
                    {renderInput('X Pos', 'x_val')}
                    {renderInput('Y Pos', 'y_val')}
                    {renderInput('Z Pos', 'z_val')}
                </div>
                <div className="mb-4 pt-3 border-top">
                    <div className="d-flex align-items-center mb-2">
                        <Icon icon="ViewQuilt" className="text-info me-2" size="sm" />
                        <h6 className="mb-0 text-uppercase x-small fw-bold text-info">Linked Walls ({walls.length})</h6>
                    </div>
                    <div className="mb-3 p-2 rounded d-flex align-items-center bg-info bg-opacity-10 border border-info border-opacity-20">
                        <Icon icon="TouchApp" className="text-info me-2" size="sm" />
                        <div className="small text-muted" style={{ fontSize: '0.65rem' }}>Click walls in 3D to link/unlink</div>
                    </div>
                </div>
                {selectedWall && (
                    <div className="p-2 rounded bg-dark bg-opacity-10 border border-info border-opacity-20 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-bold text-info">Wall Details</span>
                            <Button color="link" size="sm" onClick={() => setSelectedWallId(null)} icon="Close" className="p-0" />
                        </div>
                        <div className="small opacity-75">ID: {selectedWall.id}</div>
                    </div>
                )}
            </CardBody>
            <div className="p-2 border-top mt-auto bg-dark bg-opacity-10">
                <div className="d-grid gap-2">
                    <Button color="primary" onClick={handleSave} isDisable={!isDirty || updateSensorMutation.isPending}>
                        {updateSensorMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button color="light" isLight onClick={() => { setValues({ id: sensor.id, x_val: sensor.x_val || 0, y_val: sensor.y_val || 0, z_val: sensor.z_val || 0 }); setWalls(sensor.walls || []); setIsDirty(false); }}>Reset</Button>
                </div>
            </div>
            <DeleteWallModal isOpen={unlinkModalWall !== null} wall={unlinkModalWall?.wall || null} segmentNumber={unlinkModalWall?.segmentNumber} onConfirm={handleUnlinkWallConfirm} onCancel={() => setUnlinkModalWall(null)} showDetails={true} warningMessage="Unlink this wall from the sensor?" />
        </div>
    );
};

export default SensorPlacementPanel;
