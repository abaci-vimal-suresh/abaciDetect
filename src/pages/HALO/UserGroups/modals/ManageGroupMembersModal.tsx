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

import {
    useUserGroup,
    useUsers,
    useAddGroupMembers,
    useRemoveGroupMembers,
} from '../../../../api/sensors.api';

interface ManageGroupMembersModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    groupId: number | null;
}

const ManageGroupMembersModal: FC<ManageGroupMembersModalProps> = ({
    isOpen,
    setIsOpen,
    groupId,
}) => {
    const { data: group, isLoading: isLoadingGroup } = useUserGroup(groupId);
    const { data: allUsers } = useUsers();
    const addMembersMutation = useAddGroupMembers();
    const removeMembersMutation = useRemoveGroupMembers();

    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    // Get users that are not already in the group
    const availableUsers = allUsers?.filter(
        (u) => !group?.members.some((m) => m.id === u.id)
    );

    const handleAddMembers = () => {
        if (!groupId || selectedUserIds.length === 0) return;
        addMembersMutation.mutate(
            { groupId, member_ids: selectedUserIds },
            {
                onSuccess: () => {
                    setSelectedUserIds([]);
                },
            }
        );
    };

    const handleRemoveMember = (userId: number) => {
        if (!groupId) return;
        if (window.confirm('Are you sure you want to remove this member from the group?')) {
            removeMembersMutation.mutate({ groupId, member_ids: [userId] });
        }
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" titleId="manage-members-modal">
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id="manage-members-modal">
                    Manage Group Members {group && `- ${group.name}`}
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                {isLoadingGroup ? (
                    <div className="d-flex justify-content-center p-5">
                        <Spinner size="3rem" />
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Current Members Section */}
                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0">
                                    Current Members{' '}
                                    <Badge color="info" isLight>
                                        {group?.member_count || 0}
                                    </Badge>
                                </h6>
                            </div>

                            {group?.members && group.members.length > 0 ? (
                                <div
                                    className="border rounded"
                                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                                >
                                    {group.members.map((member) => (
                                        <div
                                            key={member.id}
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
                                                    {member.username?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="fw-bold">
                                                        {member.first_name} {member.last_name}
                                                    </div>
                                                    <div className="small text-muted">
                                                        {member.email} • {member.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                icon="Remove"
                                                color="danger"
                                                isLight
                                                size="sm"
                                                onClick={() => handleRemoveMember(member.id)}
                                                isDisable={removeMembersMutation.isPending}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-4 border rounded bg-light">
                                    <Icon icon="GroupOff" size="2x" className="text-muted mb-2" />
                                    <p className="text-muted mb-0">No members in this group yet</p>
                                </div>
                            )}
                        </div>

                        {/* Add New Members Section */}
                        <div className="col-12">
                            <hr />
                            <h6 className="mb-3">Add New Members</h6>

                            {availableUsers && availableUsers.length > 0 ? (
                                <>
                                    <FormGroup id="new_members" label="Select users to add">
                                        <Select
                                            ariaLabel="Select users"
                                            placeholder="Select users to add..."
                                            multiple
                                            value={selectedUserIds.map(String)}
                                            onChange={(e: any) => {
                                                const selectedOptions = Array.from(
                                                    e.target.selectedOptions
                                                );
                                                const selectedIds = selectedOptions.map(
                                                    (option: any) => Number(option.value)
                                                );
                                                setSelectedUserIds(selectedIds);
                                            }}
                                        >
                                            {availableUsers.map((user) => (
                                                <Option key={user.id} value={String(user.id)}>
                                                    {`${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`}
                                                </Option>
                                            ))}
                                        </Select>
                                        <div className="form-text">
                                            Hold Ctrl (Cmd on Mac) to select multiple users
                                        </div>
                                    </FormGroup>

                                    <Button
                                        color="primary"
                                        icon="Add"
                                        onClick={handleAddMembers}
                                        isDisable={
                                            selectedUserIds.length === 0 ||
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
                                            `Add ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'Member' : 'Members'
                                            }`
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center p-4 border rounded bg-light">
                                    <Icon icon="CheckCircle" size="2x" className="text-success mb-2" />
                                    <p className="text-muted mb-0">
                                        All users are already members of this group
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

export default ManageGroupMembersModal;
