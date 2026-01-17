import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import Button from '../../../../components/bootstrap/Button';

interface IUserGroupEditModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    id?: string;
    groupId?: number;
}

const UserGroupEditModal: React.FC<IUserGroupEditModalProps> = ({ isOpen, setIsOpen, id, groupId }) => {
    return (
        <Modal isOpen={isOpen} toggle={() => setIsOpen(!isOpen)}>
            <ModalHeader toggle={() => setIsOpen(!isOpen)}>Edit User Group</ModalHeader>
            <ModalBody>
                <p>Edit User Group ID: {id}</p>
            </ModalBody>
            <ModalFooter>
                <Button color='secondary' onClick={() => setIsOpen(false)}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserGroupEditModal;
