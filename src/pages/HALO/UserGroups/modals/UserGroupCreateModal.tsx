import React, { FC, useMemo } from 'react';
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

import { useCreateUserGroup, useUsers } from '../../../../api/sensors.api';

interface UserGroupCreateModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const UserGroupCreateModal: FC<UserGroupCreateModalProps> = ({ isOpen, setIsOpen }) => {
    const createGroupMutation = useCreateUserGroup();
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
            createGroupMutation.mutate(values, {
                onSuccess: () => {
                    setIsOpen(false);
                    formik.resetForm();
                },
            });
        },
    });

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" titleId="create-group-modal">
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id="create-group-modal">Create User Group</ModalTitle>
            </ModalHeader>
            <ModalBody>
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
                        <FormGroup label="Members (Optional)">
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
            </ModalBody>
            <ModalFooter>
                <Button
                    color="info"
                    isOutline
                    className="border-0"
                    onClick={() => setIsOpen(false)}
                >
                    Cancel
                </Button>
                <Button
                    color="primary"
                    onClick={formik.handleSubmit}
                    isDisable={createGroupMutation.isPending || !formik.isValid}
                >
                    {createGroupMutation.isPending ? (
                        <>
                            <Spinner isSmall inButton isGrow />
                            Creating...
                        </>
                    ) : (
                        'Create Group'
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserGroupCreateModal;
