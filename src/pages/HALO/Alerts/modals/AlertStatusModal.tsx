import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Textarea from '../../../../components/bootstrap/forms/Textarea';
import Checks from '../../../../components/bootstrap/forms/Checks';
import Icon from '../../../../components/icon/Icon';
import Label from '../../../../components/bootstrap/forms/Label';
import { AlertStatus } from '../../../../types/sensor';

interface AlertRecord {
    id: string;
    originalId: number;
}

interface AlertStatusModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    selectedAlert: AlertRecord | null;
    targetStatus: AlertStatus | null;
    statusRemarks: string;
    setStatusRemarks: (v: string) => void;
    nextTriggerTime: string;
    setNextTriggerTime: (v: string) => void;
    isRecheckEnabled: boolean;
    setIsRecheckEnabled: (v: boolean) => void;
    onConfirm: () => void;
    isPending: boolean;
}

const AlertStatusModal: React.FC<AlertStatusModalProps> = ({
    isOpen,
    setIsOpen,
    selectedAlert,
    targetStatus,
    statusRemarks,
    setStatusRemarks,
    nextTriggerTime,
    setNextTriggerTime,
    isRecheckEnabled,
    setIsRecheckEnabled,
    onConfirm,
    isPending,
}) => {
    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
            <ModalHeader setIsOpen={setIsOpen}>
                Update Alert Status: {targetStatus?.toUpperCase()}
            </ModalHeader>
            <ModalBody>
                <div className='row g-3'>
                    <div className='col-12 text-center mb-2'>
                        <Icon
                            icon={
                                targetStatus === 'resolved' ? 'TaskAlt' :
                                    targetStatus === 'dismissed' ? 'Block' :
                                        targetStatus === 'suspended' ? 'PauseCircle' : 'Info'
                            }
                            size='3x'
                            className={`text-${targetStatus === 'resolved' ? 'success' :
                                targetStatus === 'dismissed' ? 'secondary' :
                                    targetStatus === 'suspended' ? 'dark' : 'primary'
                                }`}
                        />
                        <div className='mt-2 fw-bold'>
                            Updating Alert {selectedAlert?.id} → {targetStatus?.toUpperCase()}
                        </div>
                    </div>
                    <div className='col-12'>
                        <FormGroup label='Remarks / Resolution Notes'>
                            <Textarea
                                placeholder='Enter details about this status change...'
                                value={statusRemarks}
                                onChange={(e: any) => setStatusRemarks(e.target.value)}
                                rows={4}
                            />
                        </FormGroup>
                    </div>
                    {targetStatus === 'suspended' && (
                        <div className='col-12'>
                            <FormGroup label='Next Trigger Time' formText='Alert will reactivate after this time.'>
                                <Input
                                    type='datetime-local'
                                    value={nextTriggerTime}
                                    onChange={(e: any) => setNextTriggerTime(e.target.value)}
                                />
                            </FormGroup>
                            <div className='d-flex align-items-center justify-content-between mt-3 pt-3 border-top'>
                                <div>
                                    <Label htmlFor='toggle-recheck' className='mb-0 fw-bold'>
                                        Only reactivate if condition persists?
                                    </Label>
                                    <div className='text-muted small mt-1'>
                                        System will check sensor value before reactivating
                                    </div>
                                </div>
                                <Checks
                                    type='switch'
                                    id='toggle-recheck'
                                    checked={isRecheckEnabled}
                                    onChange={() => setIsRecheckEnabled(!isRecheckEnabled)}
                                    label={isRecheckEnabled ? 'Yes' : 'No'}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color='secondary' isLight onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button
                    color={
                        targetStatus === 'resolved' ? 'success' :
                            targetStatus === 'dismissed' ? 'secondary' :
                                targetStatus === 'suspended' ? 'dark' : 'primary'
                    }
                    icon='Save'
                    onClick={onConfirm}
                    isDisable={isPending || !statusRemarks.trim()}
                >
                    Confirm Update
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AlertStatusModal;