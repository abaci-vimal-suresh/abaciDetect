import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../components/bootstrap/Modal';
import Button from '../components/bootstrap/Button';
import FormGroup from '../components/bootstrap/forms/FormGroup';
import Input from '../components/bootstrap/forms/Input';
import Icon from '../components/icon/Icon';
import Spinner from '../components/bootstrap/Spinner';
import { Sensor } from '../types/sensor';

interface PersonnelModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    sensor: Sensor | null;
    onSave: (personnelData: {
        personnel_in_charge?: string;
        personnel_contact?: string;
        personnel_email?: string;
    }) => void;
    isSaving?: boolean;
}

const PersonnelModal: React.FC<PersonnelModalProps> = ({
    isOpen,
    setIsOpen,
    sensor,
    onSave,
    isSaving = false
}) => {
    const [personnelName, setPersonnelName] = useState('');
    const [personnelContact, setPersonnelContact] = useState('');
    const [personnelEmail, setPersonnelEmail] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Load existing data when sensor changes
    useEffect(() => {
        if (sensor) {
            setPersonnelName(sensor.personnel_in_charge || '');
            setPersonnelContact(sensor.personnel_contact || '');
            setPersonnelEmail(sensor.personnel_email || '');
            setErrors({});
        }
    }, [sensor]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Email validation
        if (personnelEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personnelEmail)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation (basic)
        if (personnelContact && !/^[\d\s\-\+\(\)]+$/.test(personnelContact)) {
            newErrors.contact = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        onSave({
            personnel_in_charge: personnelName.trim() || undefined,
            personnel_contact: personnelContact.trim() || undefined,
            personnel_email: personnelEmail.trim() || undefined
        });
    };

    const handleClose = () => {
        setIsOpen(false);
        setErrors({});
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
            <ModalHeader setIsOpen={handleClose}>
                <ModalTitle id='personnel-modal-title'>
                    <Icon icon='Person' className='me-2' />
                    Manage Personnel - {sensor?.name}
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                <div className='alert alert-info mb-4'>
                    <Icon icon='Info' className='me-2' />
                    Assign responsible personnel for this sensor's maintenance and monitoring.
                </div>

                <FormGroup label='Personnel In Charge' className='mb-3'>
                    <Input
                        type='text'
                        placeholder='e.g., John Smith'
                        value={personnelName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonnelName(e.target.value)}
                    />
                    <div className='form-text'>
                        Full name of the person responsible for this sensor
                    </div>
                </FormGroup>

                <FormGroup label='Contact Number' className='mb-3'>
                    <div className='input-group'>
                        <span className='input-group-text'>
                            <Icon icon='Phone' />
                        </span>
                        <Input
                            type='text'
                            placeholder='e.g., +1 234-567-8900'
                            value={personnelContact}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setPersonnelContact(e.target.value);
                                if (errors.contact) {
                                    setErrors({ ...errors, contact: '' });
                                }
                            }}
                            className={errors.contact ? 'is-invalid' : ''}
                        />
                    </div>
                    {errors.contact && (
                        <div className='invalid-feedback d-block'>{errors.contact}</div>
                    )}
                    <div className='form-text'>
                        Direct phone number for emergency contact
                    </div>
                </FormGroup>

                <FormGroup label='Email Address' className='mb-3'>
                    <div className='input-group'>
                        <span className='input-group-text'>
                            <Icon icon='Email' />
                        </span>
                        <Input
                            type='email'
                            placeholder='e.g., john.smith@company.com'
                            value={personnelEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setPersonnelEmail(e.target.value);
                                if (errors.email) {
                                    setErrors({ ...errors, email: '' });
                                }
                            }}
                            className={errors.email ? 'is-invalid' : ''}
                        />
                    </div>
                    {errors.email && (
                        <div className='invalid-feedback d-block'>{errors.email}</div>
                    )}
                    <div className='form-text'>
                        Email for notifications and alerts
                    </div>
                </FormGroup>

                {/* Preview Section */}
                {(personnelName || personnelContact || personnelEmail) && (
                    <div className='border rounded p-3 bg-light mt-4'>
                        <h6 className='mb-3'>
                            <Icon icon='Preview' className='me-2' />
                            Preview
                        </h6>
                        <div className='row g-2'>
                            {personnelName && (
                                <div className='col-12'>
                                    <strong>Name:</strong> {personnelName}
                                </div>
                            )}
                            {personnelContact && (
                                <div className='col-12'>
                                    <strong>Contact:</strong> {personnelContact}
                                </div>
                            )}
                            {personnelEmail && (
                                <div className='col-12'>
                                    <strong>Email:</strong> {personnelEmail}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color='light' onClick={handleClose} isDisable={isSaving}>
                    Cancel
                </Button>
                <Button
                    color='primary'
                    icon='Save'
                    onClick={handleSave}
                    isDisable={isSaving}
                >
                    {isSaving && <Spinner isSmall inButton />}
                    Save Personnel Info
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default PersonnelModal;