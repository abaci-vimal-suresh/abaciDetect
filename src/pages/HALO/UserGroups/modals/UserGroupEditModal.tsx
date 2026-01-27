import React, { FC, useEffect } from 'react';
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
import Select from '../../../../components/bootstrap/forms/Select';
import Option from '../../../../components/bootstrap/Option';
import Checks from '../../../../components/bootstrap/forms/Checks';

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
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0">Members</label>
                                {users && users.length > 0 && (
                                    <Checks
                                        id="select-all-edit"
                                        label="Select All"
                                        checked={formik.values.member_ids.length === users.length && users.length > 0}
                                        onChange={(e: any) => {
                                            if (e.target.checked) {
                                                formik.setFieldValue('member_ids', users.map(u => u.id));
                                            } else {
                                                formik.setFieldValue('member_ids', []);
                                            }
                                        }}
                                    />
                                )}
                            </div>
                            <div
                                className="border rounded p-2"
                                style={{ maxHeight: '250px', overflowY: 'auto' }}
                            >
                                {users?.map((user) => (
                                    <div
                                        key={user.id}
                                        className="d-flex align-items-center gap-3 p-2 border-bottom last-child-border-0 hover-bg-light"
                                    >
                                        <Checks
                                            id={`user-check-edit-${user.id}`}
                                            checked={formik.values.member_ids.includes(user.id)}
                                            onChange={(e: any) => {
                                                const currentIds = [...formik.values.member_ids];
                                                if (e.target.checked) {
                                                    formik.setFieldValue('member_ids', [...currentIds, user.id]);
                                                } else {
                                                    formik.setFieldValue('member_ids', currentIds.filter(id => id !== user.id));
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor={`user-check-edit-${user.id}`}
                                            className="mb-0 cursor-pointer w-100"
                                        >
                                            <div className="fw-bold">
                                                {user.first_name || user.username} {user.last_name || ''}
                                            </div>
                                            <div className="small text-muted">
                                                {user.email} • {user.role}
                                            </div>
                                        </label>
                                    </div>
                                ))}
                                {(!users || users.length === 0) && (
                                    <div className="text-center p-3 text-muted italic">
                                        No users available to add
                                    </div>
                                )}
                            </div>
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
