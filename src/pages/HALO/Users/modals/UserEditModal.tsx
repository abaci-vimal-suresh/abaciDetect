import React, { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Input from '../../../../components/bootstrap/forms/Input';
import Label from '../../../../components/bootstrap/forms/Label';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Checks from '../../../../components/bootstrap/forms/Checks';
import { useUser, useUpdateUser, useAreas, useUsers } from '../../../../api/sensors.api';
import { Area } from '../../../../types/sensor';
import useDarkMode from '../../../../hooks/useDarkMode';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Select from '../../../../components/bootstrap/forms/Select';
import Option from '../../../../components/bootstrap/Option';

interface UserEditModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    userId: number | null;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, setIsOpen, userId }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: user, isLoading: isUserLoading } = useUser(userId?.toString() || '');
    const { data: areas } = useAreas();
    const { data: users } = useUsers();
    const updateUserMutation = useUpdateUser();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'viewer',
        assigned_area_ids: [] as number[],
        is_active: true,
        head_id: null as number | null
    });

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                username: user.username,
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                role: user.role?.toLowerCase() || 'viewer',
                assigned_area_ids: user.assigned_area_ids || [],
                is_active: user.is_active,
                head_id: user.head_id || null
            });
        }
    }, [user, isOpen]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleAreaToggle = (areaId: number) => {
        setFormData(prev => ({
            ...prev,
            assigned_area_ids: prev.assigned_area_ids.includes(areaId)
                ? prev.assigned_area_ids.filter(id => id !== areaId)
                : [...prev.assigned_area_ids, areaId]
        }));
    };

    const handleSubmit = async () => {
        if (!userId) return;

        try {
            await updateUserMutation.mutateAsync({
                userId: userId,
                userData: {
                    username: formData.username,
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                    assigned_area_ids: formData.assigned_area_ids,
                    is_active: formData.is_active,
                    head_id: formData.head_id
                }
            });
            handleClose();
        } catch (err) {
            console.error("Failed to update user", err);
        }
    };

    // Helper to render area hierarchy for assignment
    const renderAreaItem = (area: Area, depth = 0) => {
        return (
            <div key={area.id} style={{ marginLeft: `${depth * 20}px` }} className="mb-2">
                <Checks
                    id={`edit-area-${area.id}`}
                    label={area.name}
                    checked={formData.assigned_area_ids.includes(area.id)}
                    onChange={() => handleAreaToggle(area.id)}
                />
                {area.subareas && area.subareas.length > 0 &&
                    area.subareas.map((sub: any) => {
                        const subObj = typeof sub === 'number'
                            ? areas?.find(a => a.id === sub)
                            : sub;
                        return subObj ? renderAreaItem(subObj as Area, depth + 1) : null;
                    })
                }
            </div>
        );
    };

    return (
        <Modal isScrollable isOpen={isOpen} setIsOpen={setIsOpen} size="xl" titleId="edit-user-modal" >
            <ModalHeader setIsOpen={setIsOpen} className="p-4">
                <ModalTitle id="edit-user-modal">
                    {isUserLoading ? 'Loading User...' : `Edit User: ${user?.username}`}
                </ModalTitle>
            </ModalHeader>
            <ModalBody className="p-4">
                {isUserLoading ? (
                    <div className="p-5 text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Basic Information */}
                        <div className="col-lg-6">
                            <Card className="shadow-none border h-100" style={{ background: darkModeStatus ? '#1E293B' : '#F8F9FA' }}>
                                <CardHeader className="bg-transparent border-bottom py-3">
                                    <CardTitle className="mb-0 d-flex align-items-center h6">
                                        <Icon icon="Lock" className="me-2 text-primary" />
                                        Account Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <FormGroup label="Username">
                                                <Input
                                                    required
                                                    value={formData.username}
                                                    onChange={(e: any) => setFormData({ ...formData, username: e.target.value })}
                                                />
                                            </FormGroup>
                                        </div>
                                        <div className="col-12">
                                            <FormGroup label="Email Address">
                                                <Input
                                                    required
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </FormGroup>
                                        </div>
                                        <div className="col-12 pt-2">
                                            <Checks
                                                id="edit-is-active"
                                                label="User Account is Active"
                                                checked={formData.is_active}
                                                onChange={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                            />
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Personal & Role */}
                        <div className="col-lg-6">
                            <div className="d-flex flex-column gap-4 text-dark">
                                <Card className="shadow-none border" style={{ background: darkModeStatus ? '#1E293B' : '#F8F9FA' }}>
                                    <CardHeader className="bg-transparent border-bottom py-3">
                                        <CardTitle className="mb-0 d-flex align-items-center h6">
                                            <Icon icon="Person" className="me-2 text-info" />
                                            Personal Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardBody className="p-4">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <FormGroup label="First Name">
                                                    <Input
                                                        value={formData.first_name}
                                                        onChange={(e: any) => setFormData({ ...formData, first_name: e.target.value })}
                                                    />
                                                </FormGroup>
                                            </div>
                                            <div className="col-md-6">
                                                <FormGroup label="Last Name">
                                                    <Input
                                                        value={formData.last_name}
                                                        onChange={(e: any) => setFormData({ ...formData, last_name: e.target.value })}
                                                    />
                                                </FormGroup>
                                            </div>
                                            <div className="col-12">
                                                <FormGroup label="Head User (Manager)">
                                                    <Select
                                                        ariaLabel="Select Head User"
                                                        placeholder="Select head user..."
                                                        value={formData.head_id ? String(formData.head_id) : ""}
                                                        onChange={(e: any) => setFormData({ ...formData, head_id: e.target.value ? Number(e.target.value) : null })}
                                                    >
                                                        <Option value="">No Head User</Option>
                                                        {users?.filter(u => u.id !== userId)?.map(user => (
                                                            <Option key={user.id} value={String(user.id)}>
                                                                {`${user.first_name} ${user.last_name} (${user.username})`}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </FormGroup>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="shadow-none border" style={{ background: darkModeStatus ? '#1E293B' : '#F8F9FA' }}>
                                    <CardHeader className="bg-transparent border-bottom py-3">
                                        <CardTitle className="mb-0 d-flex align-items-center h6">
                                            <Icon icon="AssignmentInd" className="me-2 text-secondary" />
                                            Role & Access
                                        </CardTitle>
                                    </CardHeader>
                                    <CardBody className="p-4">
                                        <div className="mb-0">
                                            <div className="mb-0">
                                                <Label>Select Role</Label>
                                                <Select
                                                    ariaLabel="User Role"
                                                    value={formData.role.toLowerCase()}
                                                    onChange={(e: any) => setFormData({ ...formData, role: (e.target.value as any) })}
                                                >
                                                    <Option key="admin" value="admin">Admin</Option>
                                                    <Option key="viewer" value="viewer">Viewer</Option>
                                                    <Option key="user" value="user">User</Option>
                                                    <Option key="organization" value="organization">Organization</Option>
                                                    <Option key="gtcc" value="gtcc">GTCC</Option>
                                                    <Option key="assistant user" value="assistant user">Assistant User</Option>
                                                    <Option key="establishment" value="establishment">Establishment</Option>
                                                    <Option key="region" value="region">Region</Option>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {/* Area Assignment */}
                        <div className="col-12">
                            <Card className="shadow-none border" style={{ background: darkModeStatus ? '#1E293B' : '#F8F9FA' }}>
                                <CardHeader className="bg-transparent border-bottom py-3">
                                    <CardTitle className="mb-0 d-flex align-items-center h6">
                                        <Icon icon="Business" className="me-2 text-warning" />
                                        Manage Access (Areas)
                                    </CardTitle>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="p-3 border rounded  dark:bg-slate-800" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {areas?.filter(area => !area.parent_id).map(area => renderAreaItem(area))}
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter className="p-4 border-top">
                <Button color="light" isLight onClick={handleClose} className="me-2">
                    Cancel
                </Button>
                <Button
                    className='btn-neumorphic'
                    color="primary"
                    isLight
                    onClick={handleSubmit}
                    isDisable={updateUserMutation.isPending || isUserLoading}
                    icon={updateUserMutation.isPending ? undefined : 'Save'}
                >
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserEditModal;
