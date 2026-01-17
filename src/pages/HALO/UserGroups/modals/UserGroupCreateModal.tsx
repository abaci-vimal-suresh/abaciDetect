import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import Button from '../../../../components/bootstrap/Button';

interface IUserGroupCreateModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const UserGroupCreateModal: React.FC<IUserGroupCreateModalProps> = ({ isOpen, setIsOpen }) => {
    return (
        <Modal isOpen={isOpen} toggle={() => setIsOpen(!isOpen)}>
            <ModalHeader toggle={() => setIsOpen(!isOpen)}>Create User Group</ModalHeader>
            <ModalBody>
                <p>Create New User Group</p>
            </ModalBody>
            <ModalFooter>
                <Button color='secondary' onClick={() => setIsOpen(false)}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserGroupCreateModal;
