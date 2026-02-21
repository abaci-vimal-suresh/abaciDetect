import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Label from '../../../../components/bootstrap/forms/Label';
import { User } from '../../../../types/sensor';

interface CreateSubAreaModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    parentZoneName?: string;
    users?: User[];
    isPending: boolean;
    onSubmit: (formData: FormData) => void;
}

const CreateSubAreaModal: React.FC<CreateSubAreaModalProps> = ({
    isOpen,
    setIsOpen,
    parentZoneName,
    users,
    isPending,
    onSubmit,
}) => {
    const [subAreaName, setSubAreaName] = useState('');
    const [subAreaType, setSubAreaType] = useState('others');
    const [subAreaPlan, setSubAreaPlan] = useState<File | null>(null);
    const [subOffsetX, setSubOffsetX] = useState(0);
    const [subOffsetY, setSubOffsetY] = useState(0);
    const [subOffsetZ, setSubOffsetZ] = useState(0);
    const [subScaleFactor, setSubScaleFactor] = useState(1.0);
    const [personInChargeIds, setPersonInChargeIds] = useState<number[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!subAreaPlan) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(subAreaPlan);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [subAreaPlan]);

    const handleReset = () => {
        setSubAreaName('');
        setSubAreaType('others');
        setSubAreaPlan(null);
        setSubOffsetX(0);
        setSubOffsetY(0);
        setSubOffsetZ(0);
        setSubScaleFactor(1.0);
        setPersonInChargeIds([]);
        setError('');
    };

    const handleSubmit = () => {
        if (!subAreaName.trim()) {
            setError('Sub area name is required');
            return;
        }

        const formData = new FormData();
        formData.append('name', subAreaName);
        formData.append('area_type', subAreaType);
        formData.append('offset_x', subOffsetX.toString());
        formData.append('offset_y', subOffsetY.toString());
        formData.append('offset_z', subOffsetZ.toString());
        formData.append('scale_factor', subScaleFactor.toString());

        if (subAreaPlan) formData.append('area_plan', subAreaPlan);

        personInChargeIds.forEach(id => formData.append('person_in_charge_ids', id.toString()));

        onSubmit(formData);
    };

    const handleClose = () => {
        setIsOpen(false);
        handleReset();
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id='create-subarea-title'>
                    Create Sub Area in {parentZoneName}
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                <div className='row g-3'>
                    <div className='col-12'>
                        <FormGroup label='Sub Area Name'>
                            <input
                                type='text'
                                className={`form-control ${error ? 'is-invalid' : ''}`}
                                placeholder='e.g. Room 101, West Wing...'
                                value={subAreaName}
                                onChange={(e) => { setSubAreaName(e.target.value); setError(''); }}
                                onKeyPress={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                            />
                            {error && <div className='invalid-feedback'>{error}</div>}
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <FormGroup label='Area Type'>
                            <select className='form-select' value={subAreaType} onChange={(e) => setSubAreaType(e.target.value)}>
                                <option value='floor'>Floor</option>
                                <option value='room'>Room</option>
                                <option value='zone'>Zone</option>
                                <option value='others'>Others</option>
                            </select>
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <FormGroup label='Floor Plan (Optional)'>
                            <Input type='file' accept='image/*' onChange={(e: any) => setSubAreaPlan(e.target.files[0])} />
                            {previewUrl && (
                                <div className='mt-3 text-center border rounded p-2 bg-light bg-opacity-10'>
                                    <p className='small text-muted mb-2'>Image Preview:</p>
                                    <img
                                        src={previewUrl}
                                        alt='Sub Area Plan Preview'
                                        style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '4px' }}
                                    />
                                    <div className='mt-2 small text-success'>
                                        <Icon icon='CheckCircle' size='sm' className='me-1' />
                                        {subAreaPlan?.name}
                                    </div>
                                </div>
                            )}
                        </FormGroup>
                    </div>

                    <div className='col-md-4'>
                        <FormGroup label='Offset X'>
                            <Input type='number' step={0.1} value={subOffsetX} onChange={(e: any) => setSubOffsetX(parseFloat(e.target.value) || 0)} />
                        </FormGroup>
                    </div>
                    <div className='col-md-4'>
                        <FormGroup label='Offset Y'>
                            <Input type='number' step={0.1} value={subOffsetY} onChange={(e: any) => setSubOffsetY(parseFloat(e.target.value) || 0)} />
                        </FormGroup>
                    </div>
                    <div className='col-md-4'>
                        <FormGroup label='Offset Z'>
                            <Input type='number' step={0.1} value={subOffsetZ} onChange={(e: any) => setSubOffsetZ(parseFloat(e.target.value) || 0)} />
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <FormGroup label='Scale Factor'>
                            <Input type='number' step={0.1} min={0.1} value={subScaleFactor} onChange={(e: any) => setSubScaleFactor(parseFloat(e.target.value) || 1.0)} />
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <Label>Assign Persons In Charge</Label>
                        <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {users?.map((user: User) => (
                                <div key={user.id} className='mb-2'>
                                    <Checks
                                        id={`user-${user.id}`}
                                        label={`${user.first_name} ${user.last_name} (@${user.username})`}
                                        checked={personInChargeIds.includes(user.id)}
                                        onChange={() => setPersonInChargeIds(prev =>
                                            prev.includes(user.id)
                                                ? prev.filter(id => id !== user.id)
                                                : [...prev, user.id]
                                        )}
                                    />
                                </div>
                            ))}
                            {(!users || users.length === 0) && (
                                <div className='text-muted small'>No users found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color='light' onClick={handleClose}>Cancel</Button>
                <Button color='primary' onClick={handleSubmit} isDisable={isPending}>
                    {isPending && <Spinner isSmall inButton />}
                    Create Sub Area
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default CreateSubAreaModal;