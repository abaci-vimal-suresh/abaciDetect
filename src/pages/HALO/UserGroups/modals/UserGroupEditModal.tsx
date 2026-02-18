import React, { FC, useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../../components/bootstrap/Modal';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Textarea from '../../../../components/bootstrap/forms/Textarea';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import MultiSelectDropdown, {
    Option as MultiSelectOption,
} from '../../../../components/CustomComponent/Select/MultiSelectDropdown';

import { useUpdateUserGroup, useUserGroup, useUsers } from '../../../../api/sensors.api';

interface UserGroupEditModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    groupId: number | null;
}

const UserGroupEditModal: FC<UserGroupEditModalProps> = ({ isOpen, setIsOpen, groupId }) => {
    const { data: group, isLoading: isLoadingGroup } = useUserGroup(groupId);
    const updateGroupMutation = useUpdateUserGroup();
    const { data: users } = useUsers();

    const memberOptions: MultiSelectOption[] = useMemo(
        () =>
            (users || []).map(user => ({
                value: String(user.id),
                label: `${user.first_name || user.username} ${user.last_name || ''} • ${user.email} • ${user.role}`,
            })),
        [users],
    );

    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            member_ids: [] as number[],
        },
        validate: (values) => {
            const errors: any = {};
            if (!values.name) {
                errors.name = 'Group name is required';
            }
            return errors;
        },
        onSubmit: (values) => {
            if (!groupId) return;
            updateGroupMutation.mutate(
                { groupId, data: values },
                {
                    onSuccess: () => {
                        setIsOpen(false);
                    },
                }
            );
        },
    });

    // Load group data when modal opens
    useEffect(() => {
        if (group) {
            formik.setValues({
                name: group.name,
                description: group.description || '',
                member_ids: (group.members || []).map((m) => m.id),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group]);

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" titleId="edit-group-modal">
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id="edit-group-modal">Edit User Group</ModalTitle>
            </ModalHeader>
            <ModalBody>
                {isLoadingGroup ? (
                    <div className="d-flex justify-content-center p-5">
                        <Spinner size="3rem" />
                    </div>
                ) : (
                    <div className="row g-4">
                        <div className="col-12">
                            <FormGroup id="name" label="Group Name" isFloating>
                                <Input
                                    placeholder="Group Name"
                                    autoComplete="off"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.name}
                                    isValid={formik.isValid}
                                    isTouched={formik.touched.name}
                                    invalidFeedback={formik.errors.name}
                                />
                            </FormGroup>
                        </div>

                        <div className="col-12">
                            <FormGroup id="description" label="Description (Optional)" isFloating>
                                <Textarea
                                    placeholder="Description"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.description}
                                    rows={3}
                                />
                            </FormGroup>
                        </div>

                        <div className="col-12">
                            <FormGroup label="Members">
                                {memberOptions.length > 0 ? (
                                    <MultiSelectDropdown
                                        options={memberOptions}
                                        value={formik.values.member_ids.map(String)}
                                        onChange={(selected: string[]) =>
                                            formik.setFieldValue(
                                                'member_ids',
                                                selected.map(id => Number(id)),
                                            )
                                        }
                                        placeholder="Select members for this group"
                                        searchPlaceholder="Search users..."
                                        selectAll
                                        clearable
                                    />
                                ) : (
                                    <div className="text-center p-3 text-muted italic border rounded">
                                        No users available to add
                                    </div>
                                )}
                            </FormGroup>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="info" isOutline className="border-0" onClick={() => setIsOpen(false)}>
                    Cancel
                </Button>
                <Button
                    color="primary"
                    onClick={formik.handleSubmit}
                    isDisable={updateGroupMutation.isPending || !formik.isValid || isLoadingGroup}
                >
                    {updateGroupMutation.isPending ? (
                        <>
                            <Spinner isSmall inButton isGrow />
                            Updating...
                        </>
                    ) : (
                        'Update Group'
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserGroupEditModal;
