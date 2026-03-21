import React from 'react';
import { Wall, Area } from '../../../../types/sensor';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_COLOR, DEFAULT_WALL_THICKNESS } from '../../../../constants/wallDefaults';

interface WallEditPanelProps {
    area: Area;
    selectedWall: Wall;
    allWalls: Wall[];
    onWallChange: (wallId: number | string, field: keyof Wall, value: any) => void;
    onDeleteClick: (wall: Wall, segmentNumber: number) => void;
    onDeselect: () => void;
    calculateWallLength: (wall: Wall) => string;
}

const WallEditPanel: React.FC<WallEditPanelProps> = ({
    area,
    selectedWall,
    allWalls,
    onWallChange,
    onDeleteClick,
    onDeselect,
    calculateWallLength
}) => {
    const segmentNumber = allWalls.findIndex(w => w.id === selectedWall.id) + 1;

    return (
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
                            onChange={(e) => onWallChange(selectedWall.id, 'r_x1', parseFloat(e.target.value) || 0)}
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
                            onChange={(e) => onWallChange(selectedWall.id, 'r_y1', parseFloat(e.target.value) || 0)}
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
                            onChange={(e) => onWallChange(selectedWall.id, 'r_x2', parseFloat(e.target.value) || 0)}
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
                            onChange={(e) => onWallChange(selectedWall.id, 'r_y2', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => onWallChange(selectedWall.id, 'r_height', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => onWallChange(selectedWall.id, 'color', e.target.value)}
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
                onClick={() => onDeleteClick(selectedWall, segmentNumber)}
                icon="Delete"
            >
                Delete Segment
            </Button>

            <Button
                color="light"
                className="w-100 text-muted"
                onClick={onDeselect}
            >
                Deselect
            </Button>
        </div>
    );
};

export default WallEditPanel;
