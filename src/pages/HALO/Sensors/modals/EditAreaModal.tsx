import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Label from '../../../../components/bootstrap/forms/Label';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Spinner from '../../../../components/bootstrap/Spinner';
import { Area, User } from '../../../../types/sensor';
import { useUpdateArea, useUsers } from '../../../../api/sensors.api';

interface EditAreaModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    area: Area | null;
}

const EditAreaModal: React.FC<EditAreaModalProps> = ({ isOpen, setIsOpen, area }) => {
    const { data: users } = useUsers();
    const updateAreaMutation = useUpdateArea();

    const [name, setName] = useState('');
    const [areaType, setAreaType] = useState('building');
    const [areaPlan, setAreaPlan] = useState<File | null>(null);
    const [personInChargeIds, setPersonInChargeIds] = useState<number[]>([]);
    const [offsetZ, setOffsetZ] = useState<number>(0);
    const [error, setError] = useState('');

    useEffect(() => {
        if (area) {
            setName(area.name || '');
            setAreaType(area.area_type || 'building');
            setPersonInChargeIds(area.person_in_charge_ids || []);
            setOffsetZ(area.offset_z || 0);
            setAreaPlan(null);
            setError('');
        }
    }, [area, isOpen]);

    const handleSubmit = () => {
        if (!area) return;
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('area_type', areaType);
        formData.append('offset_z', offsetZ.toString());
        if (areaPlan) {
            formData.append('area_plan', areaPlan);
        }

        // Append person_in_charge_ids as multiple entries for the same key
        personInChargeIds.forEach(id => {
            formData.append('person_in_charge_ids', id.toString());
        });

        updateAreaMutation.mutate(
            { areaId: area.id, data: formData },
            {
                onSuccess: () => {
                    setIsOpen(false);
                }
            }
        );
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered>
            <ModalHeader setIsOpen={setIsOpen}>
                <ModalTitle id='edit-area-modal-title'>Edit Area: {area?.name}</ModalTitle>
            </ModalHeader>
            <ModalBody>
                <div className='row g-3'>
                    <div className='col-12'>
                        <FormGroup label='Area Name'>
                            <Input
                                type='text'
                                value={name}
                                onChange={(e: any) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                isValid={!error}
                                isTouched={!!error}
                                invalidFeedback={error}
                            />
                        </FormGroup>
                    </div>
                    <div className='col-12'>
                        <FormGroup label='Area Type'>
                            <select
                                className='form-select'
                                value={areaType}
                                onChange={(e) => setAreaType(e.target.value)}
                            >
                                <option value='building'>Building</option>
                                <option value='floor'>Floor</option>
                                <option value='room'>Room</option>
                                <option value='zone'>Zone</option>
                                <option value='other'>Other</option>
                            </select>
                        </FormGroup>
                    </div>
                    <div className='col-12'>
                        <FormGroup label='Floor Level (Offset Z)'>
                            <Input
                                type='number'
                                step={0.1}
                                value={offsetZ}
                                onChange={(e: any) => setOffsetZ(parseFloat(e.target.value) || 0)}
                                placeholder='0.0'
                            />
                            <small className='text-muted'>Vertical offset in meters (e.g., 0 = ground floor, 4 = first floor)</small>
                        </FormGroup>
                    </div>
                    <div className='col-12'>
                        <FormGroup label='Area Plan (Image)'>
                            <Input
                                type='file'
                                accept='image/*'
                                onChange={(e: any) => setAreaPlan(e.target.files[0])}
                            />
                            {area?.floor_plan_url && !areaPlan && (
                                <div className='mt-2 small text-muted'>
                                    Current plan: <a href={area.floor_plan_url} target='_blank' rel='noreferrer'>View Image</a>
                                </div>
                            )}
                        </FormGroup>
                    </div>
                    <div className='col-12'>
                        <Label>Assign Persons In Charge</Label>
                        <div className='p-3 border rounded bg-light bg-opacity-10' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {users?.map((user: User) => (
                                <div key={user.id} className='mb-2'>
                                    <Checks
                                        id={`edit-user-${user.id}`}
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
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color='light' onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button
                    color='primary'
                    onClick={handleSubmit}
                    isDisable={updateAreaMutation.isPending}
                >
                    {updateAreaMutation.isPending && <Spinner isSmall inButton />}
                    Save Changes
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditAreaModal;
