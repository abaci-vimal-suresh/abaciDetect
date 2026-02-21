import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    itemName?: string;
    title?: string;
    message?: string;
    onConfirm: () => void;
    isPending?: boolean;
    confirmLabel?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    setIsOpen,
    itemName,
    title = 'Confirm Deletion',
    message,
    onConfirm,
    isPending = false,
    confirmLabel = 'Delete',
}) => {
    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='sm' isCentered>
            <ModalHeader setIsOpen={setIsOpen} className='border-0 pb-0'>
                <ModalTitle id='delete-confirm-title' className='text-danger'>
                    {title}
                </ModalTitle>
            </ModalHeader>
            <ModalBody className='text-center py-4'>
                <div
                    className='mx-auto mb-3 d-flex align-items-center justify-content-center'
                    style={{
                        width: '60px', height: '60px',
                        background: 'rgba(239, 79, 79, 0.1)',
                        borderRadius: '50%',
                        color: '#ef4f4f',
                    }}
                >
                    <Icon icon='DeleteSweep' size='2x' />
                </div>
                <div className='fw-bold fs-5 mb-2'>Delete this?</div>
                <div className='text-muted small px-3'>
                    {message || (
                        <>
                            Are you sure you want to delete{' '}
                            {itemName && <span className='fw-bold text-dark'>{itemName}</span>}?
                            {' '}This action cannot be undone.
                        </>
                    )}
                </div>
            </ModalBody>
            <ModalFooter className='justify-content-center border-0 pt-0 pb-4 gap-2'>
                <Button
                    color='light'
                    onClick={() => setIsOpen(false)}
                    className='px-4'
                >
                    Cancel
                </Button>
                <Button
                    color='danger'
                    onClick={onConfirm}
                    isDisable={isPending}
                    className='px-4 shadow-sm'
                >
                    {confirmLabel}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmDeleteModal;