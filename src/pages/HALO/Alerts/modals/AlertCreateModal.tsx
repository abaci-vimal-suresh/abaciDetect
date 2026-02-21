import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Select from '../../../../components/bootstrap/forms/Select';
import { Area } from '../../../../types/sensor';

interface AlertCreateModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    areas?: Area[];
    description: string;
    area: number | undefined;
    onDescriptionChange: (v: string) => void;
    onAreaChange: (v: number) => void;
    onConfirm: () => void;
    isPending: boolean;
}

const AlertCreateModal: React.FC<AlertCreateModalProps> = ({
    isOpen,
    setIsOpen,
    areas,
    description,
    area,
    onDescriptionChange,
    onAreaChange,
    onConfirm,
    isPending,
}) => {
    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
            <ModalHeader setIsOpen={setIsOpen}>Trigger Manual Alert</ModalHeader>
            <ModalBody>
                <div className='row g-3'>
                    <div className='col-12'>
                        <FormGroup label='Area'>
                            <Select
                                value={area?.toString()}
                                onChange={(e: any) => onAreaChange(parseInt(e.target.value))}
                                list={areas?.map((a: any) => ({ text: a.name, value: a.id.toString() })) ?? []}
                                ariaLabel='Select Area'
                            />
                        </FormGroup>
                    </div>
                    <div className='col-12'>
                        <FormGroup label='Description'>
                            <Input
                                placeholder='Enter alert description...'
                                value={description}
                                onChange={(e: any) => onDescriptionChange(e.target.value)}
                            />
                        </FormGroup>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color='secondary' isLight onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button
                    color='danger'
                    icon='ReportProblem'
                    onClick={onConfirm}
                    isDisable={isPending || !description.trim() || !area}
                >
                    Trigger Now
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AlertCreateModal;