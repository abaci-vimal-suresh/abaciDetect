import { FC, useEffect, useState } from 'react';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Input from '../../../../components/bootstrap/forms/Input';

import {
    useSensorGroup,
    useSensors,
    useUpdateSensorGroup,
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
    const updateGroupMutation = useUpdateSensorGroup();

    const [selectedSensorIds, setSelectedSensorIds] = useState<(string | number)[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [memberIds, setMemberIds] = useState<(string | number)[]>([]);

    useEffect(() => {
        if (group) {
            setName(group.name);
            setDescription(group.description || '');
            setMemberIds(group.sensor_list?.map(s => s.id) || []);
        }
    }, [group]);

    const handleSaveChanges = () => {
        if (!groupId || !name.trim()) return;
        updateGroupMutation.mutate({
            groupId,
            data: {
                name,
                description,
                sensor_ids: memberIds.map(String)
            }
        });
    };

    // Get sensors that are not already in the group (staged or persisted)
    const availableSensors = allSensors?.filter(
        (s) => !memberIds.some((id) => String(id) === String(s.id))
    );

    const handleAddMembers = () => {
        if (selectedSensorIds.length === 0) return;
        setMemberIds(prev => Array.from(new Set([...prev, ...selectedSensorIds])));
        setSelectedSensorIds([]);
    };

    const handleRemoveMember = (sensorId: string | number) => {
        setMemberIds(prev => prev.filter(id => String(id) !== String(sensorId)));
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" titleId="manage-sensor-members-modal">
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id="manage-sensor-members-modal">
                    Edit Sensor Group {group && `- ${group.name}`}
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                {isLoadingGroup ? (
                    <div className="d-flex justify-content-center p-5">
                        <Spinner size="3rem" />
                    </div>
                ) : (
                    <div className="row g-4">
                        <div className="col-12 border-bottom pb-4 mb-2">
                            <h6 className="mb-3">Group Information</h6>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <FormGroup label="Group Name">
                                        <Input
                                            value={name}
                                            onChange={(e: any) => setName(e.target.value)}
                                            placeholder="e.g. Ammonia Detectors"
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-6">
                                    <FormGroup label="Description">
                                        <Input
                                            value={description}
                                            onChange={(e: any) => setDescription(e.target.value)}
                                            placeholder="Purpose of this group..."
                                        />
                                    </FormGroup>
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0">
                                    Current Sensors{' '}
                                    <Badge color="info" isLight>
                                        {memberIds.length}
                                    </Badge>
                                </h6>
                            </div>

                            {memberIds.length > 0 ? (
                                <div
                                    className="border rounded"
                                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                                >
                                    {allSensors?.filter(s => memberIds.includes(String(s.id))).map((sensor) => (
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
                                                onClick={() => handleRemoveMember(String(sensor.id))}
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
                                                    checked={selectedSensorIds.includes(String(sensor.id))}
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
                                        color="info"
                                        isLight
                                        icon="Add"
                                        onClick={handleAddMembers}
                                        isDisable={selectedSensorIds.length === 0}
                                        className="mt-2"
                                    >
                                        Add to List
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
                <div className="w-100 d-flex justify-content-between align-items-center">
                    <div className="small text-muted">
                        {updateGroupMutation.isPending ? 'Saving changes...' : ''}
                    </div>
                    <div className="d-flex gap-2">
                        <Button color="light" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleSaveChanges}
                            isDisable={updateGroupMutation.isPending || !name.trim()}
                        >
                            {updateGroupMutation.isPending && <Spinner isSmall inButton isGrow />}
                            Save All Changes
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default ManageSensorGroupMembersModal;
