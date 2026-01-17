import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import Button from '../../../../components/bootstrap/Button';

interface IManageGroupMembersModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    id?: string;
    groupId?: number;
}

const ManageGroupMembersModal: React.FC<IManageGroupMembersModalProps> = ({
    isOpen,
    setIsOpen,
    id,
    groupId,
}) => {
    return (
        <Modal isOpen={isOpen} toggle={() => setIsOpen(!isOpen)}>
            <ModalHeader toggle={() => setIsOpen(!isOpen)}>Manage Group Members</ModalHeader>
            <ModalBody>
                <p>Group Member Management for ID: {id}</p>
            </ModalBody>
            <ModalFooter>
                <Button color='secondary' onClick={() => setIsOpen(false)}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ManageGroupMembersModal;
