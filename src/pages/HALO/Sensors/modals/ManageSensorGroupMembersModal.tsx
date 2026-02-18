import { FC, useEffect, useMemo, useState } from 'react';
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
import Input from '../../../../components/bootstrap/forms/Input';
import MultiSelectDropdown, {
    Option as MultiSelectOption,
} from '../../../../components/CustomComponent/Select/MultiSelectDropdown';

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

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [memberIds, setMemberIds] = useState<string[]>([]);

    useEffect(() => {
        if (!group) return;

        setName(group.name);
        setDescription(group.description || '');
        setMemberIds(group.sensor_list?.map(s => String(s.id)) || []);
    }, [group]);

    const handleSaveChanges = () => {
        if (!groupId || !name.trim()) return;
        updateGroupMutation.mutate({
            groupId,
            data: {
                name,
                description,
                sensor_ids: memberIds
            }
        });
    };
    const sensorOptions: MultiSelectOption[] = useMemo(
        () =>
            (allSensors || []).map(sensor => ({
                value: String(sensor.id),
                label: `${sensor.name} (${sensor.mac_address || sensor.macAddress}) - ${sensor.sensor_type}`,
            })),
        [allSensors],
    );

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
                                    Sensors{' '}
                                    <Badge color="info" isLight>
                                        {memberIds.length}
                                    </Badge>
                                </h6>
                            </div>

                            {sensorOptions.length > 0 ? (
                                <MultiSelectDropdown
                                    options={sensorOptions}
                                    value={memberIds}
                                    onChange={setMemberIds}
                                    placeholder="Select sensors for this group"
                                    searchPlaceholder="Search sensors..."
                                    selectAll
                                    clearable
                                />
                            ) : (
                                <div className="text-center p-4 border rounded">
                                    <Icon icon="SensorsOff" size="2x" className="text-muted mb-2" />
                                    <p className="text-muted mb-0">No sensors available</p>
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
