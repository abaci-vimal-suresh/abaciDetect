import React from 'react';
import { Area } from '../../../../types/sensor';
import Icon from '../../../../components/icon/Icon';
import { WallDrawingControls, WallDrawSettings } from '../walls/WallDrawingPanel';

interface WallDrawerPanelProps {
    area: Area;
    drawSettings: WallDrawSettings;
    onDrawSettingsChange: (partial: Partial<WallDrawSettings>) => void;
    drawPointCount: number;
    drawArcBufferCount: number;
    drawCommittedCount: number;
    onDrawFinish: () => void;
    onDrawUndo: () => void;
    onDrawClear: () => void;
    onToggleDrawing: (active: boolean) => void;
    darkModeStatus: boolean;
}

const WallDrawerPanel: React.FC<WallDrawerPanelProps> = ({
    area,
    drawSettings,
    onDrawSettingsChange,
    drawPointCount,
    drawArcBufferCount,
    drawCommittedCount,
    onDrawFinish,
    onDrawUndo,
    onDrawClear,
    onToggleDrawing,
    darkModeStatus
}) => {
    return (
        <div style={{ animation: 'slideInFromRight 0.3s ease' }}>
            <div className="mb-3 p-2 rounded bg-info bg-opacity-10 border border-info border-opacity-20 text-center">
                <div className="small fw-bold text-info">Drawing Mode Active</div>
                <div className="small opacity-75">Use the controls below to configure walls</div>
            </div>
            
            <div className="p-3 rounded bg-dark bg-opacity-10 border border-secondary border-opacity-10">
                <WallDrawingControls
                    settings={drawSettings}
                    onSettingsChange={onDrawSettingsChange}
                    pointCount={drawPointCount}
                    arcBufferCount={drawArcBufferCount}
                    committedWallCount={drawCommittedCount}
                    onFinish={onDrawFinish}
                    onCancel={() => onToggleDrawing(false)}
                    onUndo={onDrawUndo}
                    onClear={onDrawClear}
                    darkModeStatus={darkModeStatus}
                    isSidebar={true}
                    subAreas={(area as any).children?.filter((a: any) => a.area_type === 'room') || []}
                />
            </div>
        </div>
    );
};

export default WallDrawerPanel;
