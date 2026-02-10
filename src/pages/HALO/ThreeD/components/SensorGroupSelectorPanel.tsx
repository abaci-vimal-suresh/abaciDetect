


import React from 'react';
import Card, { CardBody, CardHeader } from '../../../../components/bootstrap/Card';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import useDarkMode from '../../../../hooks/useDarkMode';
import Checks from '../../../../components/bootstrap/forms/Checks';
import { useSensorGroups } from '../../../../api/sensors.api';

interface SensorGroupSelectorPanelProps {
    selectedGroupId: (number | string) | null;
    onSelectionChange: (id: (number | string) | null) => void;
}

const SensorGroupSelectorPanel: React.FC<SensorGroupSelectorPanelProps> = ({ selectedGroupId, onSelectionChange }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: groups, isLoading } = useSensorGroups();

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center p-4">
                <div className="spinner-border spinner-border-sm text-info" role="status" />
            </div>
        );
    }

    const toggleGroup = (id: number | string) => {
        const numId = Number(id);
        if (selectedGroupId === numId) {
            onSelectionChange(null);
        } else {
            onSelectionChange(numId);
        }
    };

    const isSelected = (id: number | string) => selectedGroupId === Number(id);

    return (
        <Card className="flex-grow-1 d-flex flex-column h-100 mb-0 border-0 bg-transparent">
            <CardHeader className="bg-transparent border-bottom p-3">
                <h6 className={`mb-0 d-flex align-items-center justify-content-between ${darkModeStatus ? 'text-white' : 'text-dark'}`}>
                    <span><Icon icon="Groups" className="me-2 text-info" />Sensor Groups</span>
                    <Badge color="info" isLight>{selectedGroupId ? 1 : 0} Selected</Badge>
                </h6>
            </CardHeader>
            <CardBody className="overflow-auto p-3 scrollbar-hidden">
                <div className="text-muted x-small mb-3 text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                    Select a sensor group to aggregate data building-wide.
                </div>

                <div className="list-group list-group-flush">
                    {groups?.map(group => (
                        <div
                            key={group.id}
                            className={`list-group-item bg-transparent border-0 px-0 py-2 cursor-pointer transition-all ${isSelected(group.id) ? 'opacity-100' : 'opacity-75 hover-opacity-100'}`}
                            onClick={() => toggleGroup(group.id)}
                        >
                            <div className="d-flex align-items-center">
                                <Checks
                                    type="radio"
                                    id={`group-${group.id}`}
                                    name="sensorGroup"
                                    checked={isSelected(group.id)}
                                    onChange={() => toggleGroup(group.id)}
                                    className="me-2"
                                />
                                <div className="d-flex flex-column">
                                    <span className={`fw-bold ${darkModeStatus ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.85rem' }}>
                                        {group.name}
                                    </span>
                                    {group.sensor_list && (
                                        <span className="text-muted x-small">
                                            {group.sensor_list.length} Sensors
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {(!groups || groups.length === 0) && (
                        <div className="text-center py-4 text-muted small">
                            No sensor groups found
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default SensorGroupSelectorPanel;
