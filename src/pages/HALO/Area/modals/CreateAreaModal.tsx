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

interface CreateAreaModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    users?: User[];
    isPending: boolean;
    onSubmit: (formData: FormData) => void;
}

const CreateAreaModal: React.FC<CreateAreaModalProps> = ({
    isOpen,
    setIsOpen,
    users,
    isPending,
    onSubmit,
}) => {
    const [areaName, setAreaName] = useState('');
    const [areaType, setAreaType] = useState('building');
    const [areaPlan, setAreaPlan] = useState<File | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [offsetZ, setOffsetZ] = useState(0);
    const [scaleFactor, setScaleFactor] = useState(1.0);
    const [personInChargeIds, setPersonInChargeIds] = useState<number[]>([]);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!areaPlan) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(areaPlan);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [areaPlan]);

    const handleReset = () => {
        setAreaName('');
        setAreaType('building');
        setAreaPlan(null);
        setOffsetX(0);
        setOffsetY(0);
        setOffsetZ(0);
        setScaleFactor(1.0);
        setPersonInChargeIds([]);
        setError('');
    };

    const handleSubmit = () => {
        if (!areaName.trim()) {
            setError('Area name is required');
            return;
        }

        const formData = new FormData();
        formData.append('name', areaName);
        formData.append('area_type', areaType);
        formData.append('offset_x', offsetX.toString());
        formData.append('offset_y', offsetY.toString());
        formData.append('offset_z', offsetZ.toString());
        formData.append('scale_factor', scaleFactor.toString());

        if (areaPlan) {
            formData.append('area_plan', areaPlan);
        }

        personInChargeIds.forEach(id => {
            formData.append('person_in_charge_ids', id.toString());
        });

        onSubmit(formData);
    };

    const handleClose = () => {
        setIsOpen(false);
        handleReset();
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered>
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id='create-area-title'>Create New Area</ModalTitle>
            </ModalHeader>
            <ModalBody>
                <div className='row g-3'>
                    <div className='col-12'>
                        <FormGroup label='Area Name'>
                            <input
                                type='text'
                                className={`form-control ${error ? 'is-invalid' : ''}`}
                                placeholder='e.g. Building A, Ground Floor, etc.'
                                value={areaName}
                                onChange={(e) => {
                                    setAreaName(e.target.value);
                                    setError('');
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                }}
                                data-tour='area-name-input'
                            />
                            {error && <div className='invalid-feedback'>{error}</div>}
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <FormGroup label='Area Type'>
                            <select
                                className='form-select'
                                value={areaType}
                                onChange={(e) => setAreaType(e.target.value)}
                                data-tour='area-type-select'
                            >
                                <option value='building'>Building</option>
                                <option value='floor'>Floor</option>
                                <option value='room'>Room</option>
                                <option value='zone'>Zone</option>
                                <option value='others'>Others</option>
                            </select>
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <FormGroup label='Floor Plan Image (Optional)'>
                            <Input
                                type='file'
                                accept='image/*'
                                onChange={(e: any) => setAreaPlan(e.target.files[0])}
                            />
                            {previewUrl && (
                                <div className='mt-3 text-center border rounded p-2 bg-light bg-opacity-10'>
                                    <p className='small text-muted mb-2'>Image Preview:</p>
                                    <img
                                        src={previewUrl}
                                        alt='Area Plan Preview'
                                        style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '4px' }}
                                    />
                                    <div className='mt-2 small text-success'>
                                        <Icon icon='CheckCircle' size='sm' className='me-1' />
                                        {areaPlan?.name}
                                    </div>
                                </div>
                            )}
                        </FormGroup>
                    </div>

                    <div className='col-md-4'>
                        <FormGroup label='Offset X'>
                            <Input
                                type='number'
                                step={0.1}
                                value={offsetX}
                                onChange={(e: any) => setOffsetX(parseFloat(e.target.value) || 0)}
                            />
                        </FormGroup>
                    </div>

                    <div className='col-md-4'>
                        <FormGroup label='Offset Y'>
                            <Input
                                type='number'
                                step={0.1}
                                value={offsetY}
                                onChange={(e: any) => setOffsetY(parseFloat(e.target.value) || 0)}
                            />
                        </FormGroup>
                    </div>

                    <div className='col-md-4'>
                        <FormGroup label='Offset Z'>
                            <Input
                                type='number'
                                step={0.1}
                                value={offsetZ}
                                onChange={(e: any) => setOffsetZ(parseFloat(e.target.value) || 0)}
                            />
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <FormGroup label='Scale Factor'>
                            <Input
                                type='number'
                                step={0.1}
                                min={0.1}
                                value={scaleFactor}
                                onChange={(e: any) => setScaleFactor(parseFloat(e.target.value) || 1.0)}
                            />
                        </FormGroup>
                    </div>

                    <div className='col-12'>
                        <Label>Assign Persons In Charge</Label>
                        <p className='text-muted small mb-2'>Assign one or more users to manage this area.</p>
                        <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {users?.map((user: User) => (
                                <div key={user.id} className='mb-2'>
                                    <Checks
                                        id={`user-${user.id}`}
                                        label={`${user.first_name} ${user.last_name} (@${user.username})`}
                                        checked={personInChargeIds.includes(user.id)}
                                        onChange={() => {
                                            setPersonInChargeIds(prev =>
                                                prev.includes(user.id)
                                                    ? prev.filter(id => id !== user.id)
                                                    : [...prev, user.id]
                                            );
                                        }}
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
                <Button color='light' onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    color='primary'
                    onClick={handleSubmit}
                    isDisable={isPending}
                >
                    {isPending && <Spinner isSmall inButton />}
                    Create Area
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default CreateAreaModal;