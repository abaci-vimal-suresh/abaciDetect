import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../bootstrap/Modal';
import Button from '../../../bootstrap/Button';
import { authAxios } from '../../../../axiosInstance';
import AuthContext from '../../../../contexts/authContext';
import SaveIconButton from '../../../CustomComponent/Buttons/SaveIconButton';
import FormGroup from '../../../bootstrap/forms/FormGroup';
import ReactSelectComponent from '../../../CustomComponent/Select/ReactSelectComponent';

// Sample data for dropdowns
const departmentOptions = [
    { label: "IT Department", value: "it" },
    { label: "HR Department", value: "hr" },
    { label: "Finance Department", value: "finance" },
    { label: "Operations Department", value: "operations" },
    { label: "Marketing Department", value: "marketing" }
];

const partyTypeOptions = [
    { label: "Internal", value: "internal" },
    { label: "External", value: "external" },
    { label: "Contractor", value: "contractor" }
];

const AddDepartment = ({ isOpen, setIsOpen, title }) => {
    const {
        register,
        handleSubmit,
        control,
        getValues,
        reset,
        formState: { errors },
    } = useForm();
    const { userData } = useContext(AuthContext);
    const [waitingForAxios, setWaitingForAxios] = useState(false);

    const onSubmit = (data) => {
        setWaitingForAxios(true);

        // API call to save designation data
        const url = `/designations`;

        authAxios
            .post(url, data)
            .then((response) => {
                setWaitingForAxios(false);
                setIsOpen(false);
                reset();
            })
            .catch((error) => {
                setWaitingForAxios(false);
                // Handle error here
                console.error('Error saving designation:', error);
            });
    };

    const renderError = (fieldName) => {
        if (errors[fieldName]?.type === "required") {
            return <span className="field-required-class">*Required</span>;
        }
        return <></>;
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
            <ModalHeader className='p-4' setIsOpen={setIsOpen}>
                <ModalTitle id='modalAddDepartment'>{title}</ModalTitle>
            </ModalHeader>
            <ModalBody className='d-flex flex-column gap-4 px-5 pb-5'>
                {/* Designation Name */}
                <FormGroup label="Department Name">
                    <input
                        type="text"
                        className={errors?.department_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        placeholder="Enter department name"
                        {...register("department_name", { required: true })}
                    />
                    {renderError('department_name')}
                </FormGroup>

                {/* Department */}
                {/* <FormGroup label="Department"> */}
                    {/* <ReactSelectComponent
                        control={control}
                        name='Department'
                        field_name='department'
                        getValues={getValues}
                        errors={errors}
                        options={departmentOptions}
                        placeholder="Select"
                    /> */}
                {/* </FormGroup> */}

                {/* Party Type */}
                {/* <FormGroup label="Party Type"> */}
                    {/* <ReactSelectComponent
                        control={control}
                        name='Party Type'
                        field_name='party_type'
                        getValues={getValues}
                        errors={errors}
                        options={partyTypeOptions}
                        placeholder="Select"
                    /> */}
                {/* </FormGroup> */}
            </ModalBody>

            <ModalFooter className='px-4 pb-4'>
                <>
                    <Button 
                        color='danger' 
                        icon='Close' 
                        className='me-2' 
                        onClick={() => setIsOpen(false)}
                    >
                        Close
                    </Button>
                    <div>
                        <SaveIconButton 
                            waitingForAxios={waitingForAxios} 
                            onClickfunc={() => handleSubmit(onSubmit)()}
                        />
                    </div>
                </>
            </ModalFooter>
        </Modal>
    );
};

AddDepartment.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default AddDepartment; 