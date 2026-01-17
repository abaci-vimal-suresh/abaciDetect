import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Input from '../../../../components/bootstrap/forms/Input';
import Label from '../../../../components/bootstrap/forms/Label';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Checks from '../../../../components/bootstrap/forms/Checks';
import { useAddUser, useAreas } from '../../../../api/sensors.api';
import { Area } from '../../../../types/sensor';
import useDarkMode from '../../../../hooks/shared/useDarkMode';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';

interface UserCreateModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const UserCreateModal: React.FC<UserCreateModalProps> = ({ isOpen, setIsOpen }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: areas } = useAreas();
    const addUserMutation = useAddUser();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        role: 'Viewer' as 'Admin' | 'Viewer',
        assigned_area_ids: [] as number[],
        sendWelcomeEmail: true,
        mustChangePassword: true
    });

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            first_name: '',
            last_name: '',
            role: 'Viewer' as 'Admin' | 'Viewer',
            assigned_area_ids: [] as number[],
            sendWelcomeEmail: true,
            mustChangePassword: true
        });
    };

    const handleClose = () => {
        setIsOpen(false);
        resetForm();
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
        // Basic Validation
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            await addUserMutation.mutateAsync({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role,
                assigned_area_ids: formData.assigned_area_ids
            });
            handleClose();
        } catch (err) {
            console.error("Failed to create user", err);
        }
    };

    // Helper to render area hierarchy for assignment
    const renderAreaItem = (area: Area, depth = 0) => {
        return (
            <div key={area.id} style={{ marginLeft: `${depth * 20}px` }} className="mb-2">
                <Checks
                    id={`create-area-${area.id}`}
                    label={area.name}
                    checked={formData.assigned_area_ids.includes(area.id)}
                    onChange={() => handleAreaToggle(area.id)}
                />
                {area.subareas && area.subareas.map(sub => renderAreaItem(sub, depth + 1))}
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="xl" titleId="create-user-modal">
            <ModalHeader setIsOpen={setIsOpen} className="p-4">
                <ModalTitle id="create-user-modal">Create New User</ModalTitle>
            </ModalHeader>
            <ModalBody className="p-4">
                <div className="row g-4">
                    {/* Basic Information */}
                    <div className="col-lg-6">
                        <Card className="shadow-none border h-100" style={{ background: darkModeStatus ? '#1E293B' : '#F8F9FA' }}>
                            <CardHeader className="bg-transparent border-bottom py-3">
                                <CardTitle className="mb-0 d-flex align-items-center h6">
                                    <Icon icon="Lock" className="me-2 text-primary" />
                                    Account Essentials
                                </CardTitle>
                            </CardHeader>
                            <CardBody className="p-4">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <FormGroup label="Username *">
                                            <Input
                                                required
                                                value={formData.username}
                                                onChange={(e: any) => setFormData({ ...formData, username: e.target.value })}
                                                placeholder="Unique username"
                                            />
                                        </FormGroup>
                                    </div>
                                    <div className="col-12">
                                        <FormGroup label="Email Address *">
                                            <Input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="user@example.com"
                                            />
                                        </FormGroup>
                                    </div>
                                    <div className="col-md-6">
                                        <FormGroup label="Password *">
                                            <Input
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="Min 8 chars"
                                            />
                                        </FormGroup>
                                    </div>
                                    <div className="col-md-6">
                                        <FormGroup label="Confirm Password *">
                                            <Input
                                                required
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                placeholder="Re-enter"
                                            />
                                        </FormGroup>
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
                                                    placeholder="Optional"
                                                />
                                            </FormGroup>
                                        </div>
                                        <div className="col-md-6">
                                            <FormGroup label="Last Name">
                                                <Input
                                                    value={formData.last_name}
                                                    onChange={(e: any) => setFormData({ ...formData, last_name: e.target.value })}
                                                    placeholder="Optional"
                                                />
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
                                    <div className="mb-3">
                                        <Label>Select Role</Label>
                                        <div className="d-flex gap-3 mt-2">
                                            <Checks
                                                type="radio"
                                                name="role"
                                                id="create-role-viewer"
                                                label="Viewer"
                                                checked={formData.role === 'Viewer'}
                                                onChange={() => setFormData({ ...formData, role: 'Viewer' })}
                                            />
                                            <Checks
                                                type="radio"
                                                name="role"
                                                id="create-role-admin"
                                                label="Admin"
                                                checked={formData.role === 'Admin'}
                                                onChange={() => setFormData({ ...formData, role: 'Admin' })}
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column gap-2 text-muted small">
                                        <Checks
                                            id="create-sendWelcome"
                                            label="Send welcome email"
                                            checked={formData.sendWelcomeEmail}
                                            onChange={() => setFormData({ ...formData, sendWelcomeEmail: !formData.sendWelcomeEmail })}
                                        />
                                        <Checks
                                            id="create-mustChange"
                                            label="Require password change"
                                            checked={formData.mustChangePassword}
                                            onChange={() => setFormData({ ...formData, mustChangePassword: !formData.mustChangePassword })}
                                        />
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
                                    Assign Areas
                                </CardTitle>
                            </CardHeader>
                            <CardBody className="p-4">
                                <p className="text-muted small mb-3">Select which areas this user should have access to.</p>
                                <div className="p-3 border rounded  dark:bg-slate-800" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {areas?.map(area => renderAreaItem(area))}
                                    {(!areas || areas.length === 0) && <div className="text-center py-4 text-muted">No areas configured in the system.</div>}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className="p-4 border-top">
                <Button color="light" isLight onClick={handleClose} className="me-2">
                    Cancel
                </Button>
                <Button
                    color="primary"
                    onClick={handleSubmit}
                    isDisable={addUserMutation.isPending}
                    icon={addUserMutation.isPending ? undefined : 'Save'}
                >
                    {addUserMutation.isPending ? 'Creating User...' : 'Create User'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserCreateModal;

