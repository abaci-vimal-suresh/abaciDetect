import React from 'react';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../../../components/bootstrap/Modal';
import Button from '../../../../../../components/bootstrap/Button';
import Icon from '../../../../../../components/icon/Icon';

export interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    color: 'primary' | 'danger' | 'warning';
}

interface ConfirmModalProps {
    confirmModal: ConfirmModalState;
    setConfirmModal: (val: ConfirmModalState) => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ confirmModal, setConfirmModal }) => {
    const close = () => setConfirmModal({ ...confirmModal, isOpen: false });

    return (
        <Modal
            isOpen={confirmModal.isOpen}
            setIsOpen={(val: boolean) => setConfirmModal({ ...confirmModal, isOpen: val })}
            isCentered
            size='sm'
        >
            <ModalHeader setIsOpen={(val: boolean) => setConfirmModal({ ...confirmModal, isOpen: val })}>
                <ModalTitle id='confirm-modal-title'>
                    <div className='d-flex align-items-center gap-2'>
                        <Icon
                            icon={confirmModal.color === 'danger' ? 'Delete' : 'Warning'}
                            color={confirmModal.color}
                        />
                        {confirmModal.title}
                    </div>
                </ModalTitle>
            </ModalHeader>
            <ModalBody>
                <p className='mb-0'>{confirmModal.message}</p>
            </ModalBody>
            <ModalFooter>
                <Button color='secondary' isLight onClick={close}>
                    Cancel
                </Button>
                <Button
                    color={confirmModal.color}
                    onClick={() => {
                        confirmModal.onConfirm();
                        close();
                    }}
                >
                    Confirm
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmModal;
