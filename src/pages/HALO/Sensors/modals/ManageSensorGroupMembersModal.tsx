import React, { FC, useState } from 'react';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Select from '../../../../components/bootstrap/forms/Select';
import Option from '../../../../components/bootstrap/Option';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Checks from '../../../../components/bootstrap/forms/Checks';

import {
    useSensorGroup,
    useSensors,
    useAddSensorGroupMembers,
    useRemoveSensorGroupMembers,
} from '../../../../api/sensors.api';

interface ManageSensorGroupMembersModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    groupId: string | number | null;
}

const ManageSensorGroupMembersModal: FC<ManageSensorGroupMembersModalProps> = ({
    isOpen,
    setIsOpen,
    groupId,
}) => {
    const { data: group, isLoading: isLoadingGroup } = useSensorGroup(groupId || '');
    const { data: allSensors } = useSensors({});
    const addMembersMutation = useAddSensorGroupMembers();
    const removeMembersMutation = useRemoveSensorGroupMembers();

    const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);

    // Get sensors that are not already in the group
    const availableSensors = allSensors?.filter(
        (s) => !group?.sensor_list?.some((sensor) => String(sensor.id) === String(s.id))
    );

    const handleAddMembers = () => {
        if (!groupId || selectedSensorIds.length === 0 || !group) return;

        // Calculate the full list of sensors (existing + new)
        const currentIds = group.sensor_list?.map(s => Number(s.id)) || [];
        const updatedSensorIds = Array.from(new Set([...currentIds, ...selectedSensorIds.map(id => Number(id))]));

        addMembersMutation.mutate(
            { groupId, sensor_ids: updatedSensorIds },
            {
                onSuccess: () => {
                    setSelectedSensorIds([]);
                },
            }
        );
    };

    const handleRemoveMember = (sensorId: string) => {
        if (!groupId || !group) return;

        if (window.confirm('Are you sure you want to remove this sensor from the group?')) {
            // Calculate the full list of sensors minus the one being removed
            const currentIds = group.sensor_list?.map(s => Number(s.id)) || [];
            const updatedSensorIds = currentIds.filter(id => String(id) !== String(sensorId));

            removeMembersMutation.mutate({ groupId, sensor_ids: updatedSensorIds });
        }
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" titleId="manage-sensor-members-modal">
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id="manage-sensor-members-modal">
                    Manage Group Sensors {group && `- ${group.name}`}
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                {isLoadingGroup ? (
                    <div className="d-flex justify-content-center p-5">
                        <Spinner size="3rem" />
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Current Sensors Section */}
                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0">
                                    Current Sensors{' '}
                                    <Badge color="info" isLight>
                                        {group?.sensor_count || 0}
                                    </Badge>
                                </h6>
                            </div>

                            {group?.sensor_list && group.sensor_list.length > 0 ? (
                                <div
                                    className="border rounded"
                                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                                >
                                    {group.sensor_list.map((sensor) => (
                                        <div
                                            key={sensor.id}
                                            className="d-flex justify-content-between align-items-center p-3 border-bottom"
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        background: 'rgba(77,105,250,0.15)',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <Icon icon="Sensors" size="sm" />
                                                </div>
                                                <div>
                                                    <div className="fw-bold">
                                                        {sensor.name}
                                                    </div>
                                                    <div className="small text-muted">
                                                        {sensor.mac_address || sensor.macAddress} • {sensor.sensor_type}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                icon="Remove"
                                                color="danger"
                                                isLight
                                                size="sm"
                                                onClick={() => handleRemoveMember(sensor.id)}
                                                isDisable={removeMembersMutation.isPending}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-4 border rounded ">
                                    <Icon icon="SensorsOff" size="2x" className="text-muted mb-2" />
                                    <p className="text-muted mb-0">No sensors in this group yet</p>
                                </div>
                            )}
                        </div>

                        <div className="col-12">
                            <hr />
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0">Add New Sensors</h6>
                                {availableSensors && availableSensors.length > 0 && (
                                    <Button
                                        size='sm'
                                        color='link'
                                        className='p-0 text-decoration-none'
                                        onClick={() => {
                                            if (selectedSensorIds.length === availableSensors.length) {
                                                setSelectedSensorIds([]);
                                            } else {
                                                setSelectedSensorIds(availableSensors.map(s => s.id));
                                            }
                                        }}
                                    >
                                        {selectedSensorIds.length === availableSensors.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                )}
                            </div>

                            {availableSensors && availableSensors.length > 0 ? (
                                <>
                                    <div className='border rounded p-3 text-muted mb-3' style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {availableSensors.map((sensor) => (
                                            <div key={sensor.id} className="mb-2">
                                                <Checks
                                                    id={`new-sensor-${sensor.id}`}
                                                    label={`${sensor.name} (${sensor.mac_address || sensor.macAddress}) - ${sensor.sensor_type}`}
                                                    value={sensor.id}
                                                    checked={selectedSensorIds.includes(sensor.id)}
                                                    onChange={(e: any) => {
                                                        const { checked, value } = e.target;
                                                        const valStr = String(value);
                                                        if (checked) {
                                                            setSelectedSensorIds(prev =>
                                                                prev.includes(valStr) ? prev : [...prev, valStr]
                                                            );
                                                        } else {
                                                            setSelectedSensorIds(prev =>
                                                                prev.filter(id => String(id) !== valStr)
                                                            );
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        color="primary"
                                        icon="Add"
                                        onClick={handleAddMembers}
                                        isDisable={
                                            selectedSensorIds.length === 0 ||
                                            addMembersMutation.isPending
                                        }
                                        className="mt-2"
                                    >
                                        {addMembersMutation.isPending ? (
                                            <>
                                                <Spinner isSmall inButton isGrow />
                                                Adding...
                                            </>
                                        ) : (
                                            `Add ${selectedSensorIds.length} ${selectedSensorIds.length === 1 ? 'Sensor' : 'Sensors'
                                            }`
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center p-4 border rounded">
                                    <Icon icon="CheckCircle" size="2x" className="text-success mb-2" />
                                    <p className="text-muted mb-0">
                                        All sensors are already members of this group
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="info" onClick={() => setIsOpen(false)}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ManageSensorGroupMembersModal;
