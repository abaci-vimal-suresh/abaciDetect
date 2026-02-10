
import React from 'react';
import Card, { CardBody, CardHeader } from '../../../../components/bootstrap/Card';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';
import Checks from '../../../../components/bootstrap/forms/Checks';

interface AreaSelectorPanelProps {
    areas: any[];
    selectedAreaIds: (number | string)[];
    onSelectionChange: (ids: (number | string)[]) => void;
}

const AreaSelectorPanel: React.FC<AreaSelectorPanelProps> = ({ areas, selectedAreaIds, onSelectionChange }) => {
    const { darkModeStatus } = useDarkMode();

    // Filter to only floors and rooms
    const selectableAreas = areas.filter(a => a.area_type === 'floor' || a.area_type === 'room');

    const toggleArea = (id: number | string) => {
        const numId = Number(id);
        const newIds = selectedAreaIds.includes(numId)
            ? selectedAreaIds.filter(i => Number(i) !== numId)
            : [...selectedAreaIds, numId];
        onSelectionChange(newIds);
    };

    const isSelected = (id: number | string) => selectedAreaIds.includes(Number(id));

    return (
        <Card className="flex-grow-1 d-flex flex-column h-100 mb-0 border-0 bg-transparent">
            <CardHeader className="bg-transparent border-bottom p-3">
                <h6 className={`mb-0 d-flex align-items-center justify-content-between ${darkModeStatus ? 'text-white' : 'text-dark'}`}>
                    <span><Icon icon="PinDrop" className="me-2 text-info" />Filter Aggregation</span>
                    <Badge color="info" isLight>{selectedAreaIds.length} Active</Badge>
                </h6>
            </CardHeader>
            <CardBody className="overflow-auto p-3 scrollbar-hidden">
                <div className="text-muted x-small mb-3 text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                    Select floors or zones to include in the building-wide metrics.
                </div>
                {selectableAreas.map(area => (
                    <div
                        key={area.id}
                        className={`d-flex align-items-center justify-content-between p-2 rounded mb-1 transition-all cursor-pointer ${isSelected(area.id) ? 'bg-info bg-opacity-10' : 'hover-bg-light'}`}
                        onClick={() => toggleArea(area.id)}
                    >
                        <div className="d-flex align-items-center">
                            <Checks
                                id={`area-${area.id}`}
                                checked={isSelected(area.id)}
                                onChange={() => toggleArea(area.id)}
                                className="me-2"
                            />
                            <span className={`fw-bold ${darkModeStatus ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.85rem' }}>
                                {area.name}
                            </span>
                        </div>
                        <span className="text-muted small text-truncate ms-2" style={{ maxWidth: '120px' }}>
                            {area.area_type === 'floor' ? area.description || 'Floor' : 'Zone'}
                        </span>
                    </div>
                ))}
            </CardBody>
        </Card>
    );
};

export default AreaSelectorPanel;
