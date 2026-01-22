import React, { useState, useMemo } from 'react';
import { Form, FormGroup, Label, Input, Collapse } from 'reactstrap';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Icon from '../../../../components/icon/Icon';
import Button, { ButtonGroup } from '../../../../components/bootstrap/Button';
import { Sensor, Area } from '../../../../types/sensor';
import useDarkMode from '../../../../hooks/useDarkMode';
import './RoomSettingsPanel.scss';

export interface RoomVisibilitySettings {
    wallOpacity: number;
    floorOpacity: number;
    ceilingOpacity: number;
    showWalls: boolean;
    showFloor: boolean;
    showCeiling: boolean;
    showLabels: boolean;
    wallHeight: number;
    visibleFloors: number[];
    floorSpacing: number;
    floorOffset: number;
    floorOffsets: { [key: number]: { x: number, y: number } };
    showFloorLabels: boolean;
    cameraPreset: 'isometric' | 'top' | 'front' | 'side' | 'free';
    sectionCutEnabled: boolean;
    sectionCutPlane: 'x' | 'y' | 'z';
    sectionCutPosition: number;
    floorScales: { [key: number]: number };
    visionMode: 'none' | 'night' | 'batman';
}

interface RoomSettingsPanelProps {
    settings: RoomVisibilitySettings;
    onSettingsChange: (settings: RoomVisibilitySettings) => void;
    currentArea?: Area; // The area we're currently viewing
    areas: Area[]; // All areas for context
    sensors: Sensor[];
}

type HierarchyLevel = 'building' | 'floor' | 'room';

const JogSlider: React.FC<{
    label: string,
    onValueChange: (delta: number) => void,
    min?: number,
    max?: number,
    step?: number,
    resetValue?: number,
    className?: string,
    currentValueLabel?: string | number
}> = ({ label, onValueChange, min = -50, max = 50, step = 1, resetValue = 0, className, currentValueLabel }) => {
    const [tempValue, setTempValue] = useState(resetValue);

    const handleReset = () => {
        setTempValue(resetValue);
    };

    return (
        <FormGroup className={className}>
            <div className="d-flex justify-content-between align-items-center mb-1">
                <Label className="mb-0 small fw-bold text-muted">{label}: <span className="text-primary">{currentValueLabel}</span></Label>
                <Icon icon="DragHandle" size="sm" className="opacity-25" />
            </div>
            <Input
                type="range"
                className="custom-range jog-slider"
                min={min}
                max={max}
                step={step}
                value={tempValue}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    const delta = val - tempValue;
                    onValueChange(delta);
                    setTempValue(val);
                }}
                onMouseUp={handleReset}
                onTouchEnd={handleReset}
            />
        </FormGroup>
    );
};

const RoomSettingsPanel: React.FC<RoomSettingsPanelProps> = ({
    settings,
    onSettingsChange,
    currentArea,
    areas,
    sensors
}) => {
    const { darkModeStatus } = useDarkMode();
    const [globalVisualsOpen, setGlobalVisualsOpen] = useState(true);
    const [floorControlsOpen, setFloorControlsOpen] = useState(true);
    const [roomControlsOpen, setRoomControlsOpen] = useState(false);

    // Detect hierarchy level
    const hierarchyLevel: HierarchyLevel = useMemo(() => {
        if (!currentArea) return 'building';
        if (currentArea.is_room) return 'room';
        if (currentArea.floor_level !== undefined && currentArea.floor_level !== null) return 'floor';
        return 'building';
    }, [currentArea]);

    // Get available floors (for building level)
    const availableFloors = useMemo(() => {
        if (!currentArea) return [];
        return areas
            .filter(a =>
                a.parent_id === currentArea.id &&
                a.floor_level !== undefined &&
                a.floor_level !== null &&
                !a.is_room
            )
            .sort((a, b) => (a.floor_level || 0) - (b.floor_level || 0));
    }, [areas, currentArea]);

    // Get rooms in current floor (for floor level)
    const roomsInCurrentFloor = useMemo(() => {
        if (hierarchyLevel !== 'floor' || !currentArea) return [];
        return areas.filter(a =>
            a.is_room &&
            a.floor_level === currentArea.floor_level &&
            a.parent_id === currentArea.id
        );
    }, [hierarchyLevel, currentArea, areas]);

    const handleChange = (key: keyof RoomVisibilitySettings, value: any) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const toggleFloorVisibility = (floorLevel: number) => {
        const newVisibleFloors = settings.visibleFloors.includes(floorLevel)
            ? settings.visibleFloors.filter(f => f !== floorLevel)
            : [...settings.visibleFloors, floorLevel];
        handleChange('visibleFloors', newVisibleFloors);
    };

    const handleJogChange = (key: keyof RoomVisibilitySettings, delta: number, minLimit: number, maxLimit: number) => {
        const currentValue = (settings[key] as number) || 0;
        const newValue = Math.min(maxLimit, Math.max(minLimit, currentValue + delta));
        handleChange(key, newValue);
    };

    const handleFloorJogChange = (floorLevel: number, type: 'x' | 'y' | 'scale', delta: number) => {
        if (type === 'scale') {
            const currentScales = { ...settings.floorScales };
            const currentScale = currentScales[floorLevel] ?? 1;
            currentScales[floorLevel] = Number(Math.min(5, Math.max(0.1, currentScale + delta)).toFixed(2));
            handleChange('floorScales', currentScales);
        } else {
            const currentOffsets = { ...settings.floorOffsets };
            const currentOffset = currentOffsets[floorLevel] || { x: 0, y: 0 };
            const newValue = Math.min(2000, Math.max(-2000, currentOffset[type] + delta));
            currentOffsets[floorLevel] = { ...currentOffset, [type]: newValue };
            handleChange('floorOffsets', currentOffsets);
        }
    };

    return (
        <Card className="room-settings-panel shadow-sm h-100" stretch style={{ height: '100%', minHeight: '600px', overflowY: 'auto' }}>
            <CardHeader>
                <CardTitle>
                    <Icon icon="Settings" className="me-2" />
                    3D View Settings
                </CardTitle>
                <div className="text-muted small">
                    {hierarchyLevel === 'building' && 'Building View'}
                    {hierarchyLevel === 'floor' && `Floor: ${currentArea?.name}`}
                    {hierarchyLevel === 'room' && `Room: ${currentArea?.name}`}
                </div>
            </CardHeader>
            <CardBody>
                {/* Camera Presets */}
                <div className="mb-4">
                    <Label className="fw-bold mb-2">Quick Presets</Label>
                    <ButtonGroup className="w-100">
                        <Button
                            size="sm"
                            color={settings.cameraPreset === 'isometric' ? 'primary' : 'secondary'}
                            onClick={() => handleChange('cameraPreset', 'isometric')}
                        >
                            Solid
                        </Button>
                        <Button
                            size="sm"
                            color={settings.cameraPreset === 'top' ? 'primary' : 'secondary'}
                            onClick={() => handleChange('cameraPreset', 'top')}
                        >
                            Exposed
                        </Button>
                        <Button
                            size="sm"
                            color={settings.cameraPreset === 'front' ? 'primary' : 'secondary'}
                            onClick={() => handleChange('cameraPreset', 'front')}
                        >
                            Blueprint
                        </Button>
                    </ButtonGroup>
                </div>

                {/* BUILDING LEVEL: Floor Visibility Controls */}
                {hierarchyLevel === 'building' && availableFloors.length > 0 && (
                    <div className="mb-4">
                        <div
                            className="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
                            onClick={() => setFloorControlsOpen(!floorControlsOpen)}
                        >
                            <Label className="fw-bold mb-0">Floor Visibility</Label>
                            <Icon icon={floorControlsOpen ? 'ExpandLess' : 'ExpandMore'} />
                        </div>
                        <Collapse isOpen={floorControlsOpen}>
                            {availableFloors.map(floor => (
                                <FormGroup check key={floor.id} className="mb-2">
                                    <Label check>
                                        <Input
                                            type="checkbox"
                                            checked={settings.visibleFloors.includes(floor.floor_level || 0)}
                                            onChange={() => toggleFloorVisibility(floor.floor_level || 0)}
                                        />
                                        {floor.name}
                                        <span className="text-muted ms-2">
                                            ({areas.filter(a => Number(a.parent_id) === Number(floor.id)).length} rooms)
                                        </span>
                                    </Label>
                                </FormGroup>
                            ))}

                            <FormGroup className="mt-3">
                                <Label>Floor Spacing: {settings.floorSpacing}px</Label>
                                <Input
                                    type="range"
                                    min="20"
                                    max="500"
                                    value={settings.floorSpacing}
                                    onChange={(e) => handleChange('floorSpacing', Number(e.target.value))}
                                />
                            </FormGroup>

                            <JogSlider
                                label="Stagger Offset"
                                currentValueLabel={`${settings.floorOffset}px`}
                                min={-100}
                                max={100}
                                onValueChange={(delta) => handleJogChange('floorOffset', delta, -2000, 2000)}
                            />
                            <div className="text-muted x-small mt-n2 mb-3">
                                Pull to shift the entire building stack.
                            </div>

                            <FormGroup check>
                                <Label check>
                                    <Input
                                        type="checkbox"
                                        checked={settings.showFloorLabels}
                                        onChange={(e) => handleChange('showFloorLabels', e.target.checked)}
                                    />
                                    Show Floor Labels
                                </Label>
                            </FormGroup>

                            <div className="mt-4 border-top pt-3">
                                <Label className="fw-bold small text-uppercase text-primary mb-3">Floor Fine-Tuning</Label>
                                {availableFloors.filter(f => settings.visibleFloors.includes(f.floor_level || 0)).map(floor => {
                                    const floorLevel = floor.floor_level || 0;
                                    const offsets = settings.floorOffsets?.[floorLevel] || { x: 0, y: 0 };

                                    return (
                                        <div key={`pos-control-${floor.id}`} className={`floor-pos-card mb-4 p-2 rounded border ${darkModeStatus ? 'dark' : 'light'}`}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="fw-bold small">{floor.name}</span>
                                                <Button
                                                    size="sm"
                                                    color="link"
                                                    className={`p-0 ${darkModeStatus ? 'text-info' : 'text-danger'}`}
                                                    onClick={() => {
                                                        const newOffsets = { ...settings.floorOffsets };
                                                        const newScales = { ...settings.floorScales };
                                                        delete newOffsets[floorLevel];
                                                        delete newScales[floorLevel];
                                                        onSettingsChange({
                                                            ...settings,
                                                            floorOffsets: newOffsets,
                                                            floorScales: newScales
                                                        });
                                                    }}
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <JogSlider
                                                        label="X Offset"
                                                        currentValueLabel={`${offsets.x}px`}
                                                        onValueChange={(delta) => handleFloorJogChange(floorLevel, 'x', delta)}
                                                        className="mb-0"
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <JogSlider
                                                        label="Y Offset"
                                                        currentValueLabel={`${offsets.y}px`}
                                                        onValueChange={(delta) => handleFloorJogChange(floorLevel, 'y', delta)}
                                                        className="mb-0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-1">
                                                <JogSlider
                                                    label="Scale"
                                                    currentValueLabel={`${(settings.floorScales?.[floorLevel] || 1).toFixed(2)}x`}
                                                    min={-1}
                                                    max={1}
                                                    step={0.01}
                                                    onValueChange={(delta) => handleFloorJogChange(floorLevel, 'scale', delta)}
                                                    className="mb-0"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Collapse>
                    </div>
                )}

                {/* FLOOR LEVEL: Room Visibility Controls */}
                {hierarchyLevel === 'floor' && roomsInCurrentFloor.length > 0 && (
                    <div className="mb-4">
                        <div
                            className="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
                            onClick={() => setRoomControlsOpen(!roomControlsOpen)}
                        >
                            <Label className="fw-bold mb-0">Room Visibility</Label>
                            <Icon icon={roomControlsOpen ? 'ExpandLess' : 'ExpandMore'} />
                        </div>
                        <Collapse isOpen={roomControlsOpen}>
                            <div className="text-muted small mb-2">
                                {roomsInCurrentFloor.length} rooms in {currentArea?.name}
                            </div>
                            {roomsInCurrentFloor.map(room => (
                                <div key={room.id} className="mb-2 p-2 border rounded">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{room.name}</span>
                                        <div
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: room.color || '#3B82F6',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </Collapse>
                    </div>
                )}

                {/* Global Visuals (All Levels) */}
                <div className="mb-4">
                    <div
                        className="d-flex justify-content-between align-items-center mb-2 cursor-pointer"
                        onClick={() => setGlobalVisualsOpen(!globalVisualsOpen)}
                    >
                        <Label className="fw-bold mb-0">Global Visuals</Label>
                        <Icon icon={globalVisualsOpen ? 'ExpandLess' : 'ExpandMore'} />
                    </div>
                    <Collapse isOpen={globalVisualsOpen}>
                        <FormGroup>
                            <Label>Wall Opacity: {Math.round(settings.wallOpacity * 100)}%</Label>
                            <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.wallOpacity}
                                onChange={(e) => handleChange('wallOpacity', Number(e.target.value))}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Wall Height: {settings.wallHeight}px</Label>
                            <Input
                                type="range"
                                min="0"
                                max="500"
                                step="5"
                                value={settings.wallHeight}
                                onChange={(e) => handleChange('wallHeight', Number(e.target.value))}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Floor Opacity: {Math.round(settings.floorOpacity * 100)}%</Label>
                            <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.floorOpacity}
                                onChange={(e) => handleChange('floorOpacity', Number(e.target.value))}
                            />
                        </FormGroup>

                        {/* <FormGroup>
                            <Label>Ceiling Opacity: {Math.round(settings.ceilingOpacity * 100)}%</Label>
                            <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.ceilingOpacity}
                                onChange={(e) => handleChange('ceilingOpacity', Number(e.target.value))}
                            />
                        </FormGroup> */}

                        <div className="d-flex gap-2 flex-wrap mt-3">
                            <FormGroup check inline>
                                <Label check>
                                    <Input
                                        type="checkbox"
                                        checked={settings.showWalls}
                                        onChange={(e) => handleChange('showWalls', e.target.checked)}
                                    />
                                    Walls
                                </Label>
                            </FormGroup>
                            <FormGroup check inline>
                                <Label check>
                                    <Input
                                        type="checkbox"
                                        checked={settings.showFloor}
                                        onChange={(e) => handleChange('showFloor', e.target.checked)}
                                    />
                                    Floor
                                </Label>
                            </FormGroup>
                            <FormGroup check inline>
                                <Label check>
                                    <Input
                                        type="checkbox"
                                        checked={settings.showCeiling}
                                        onChange={(e) => handleChange('showCeiling', e.target.checked)}
                                    />
                                    Ceiling
                                </Label>
                            </FormGroup>
                            <FormGroup check inline>
                                <Label check>
                                    <Input
                                        type="checkbox"
                                        checked={settings.showLabels}
                                        onChange={(e) => handleChange('showLabels', e.target.checked)}
                                    />
                                    Labels
                                </Label>
                            </FormGroup>
                        </div>
                    </Collapse>
                </div>
            </CardBody>
        </Card>
    );
};

export default RoomSettingsPanel;
