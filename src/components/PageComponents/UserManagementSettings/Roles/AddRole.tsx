import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import { authAxios } from '../../../../axiosInstance';
import AuthContext from '../../../../contexts/authContext';
import SaveIconButton from '../../../../components/CustomComponent/Buttons/SaveIconButton';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import ReactSelectComponent from '../../../../components/CustomComponent/Select/ReactSelectComponent';
import Checks, { ChecksGroup } from '../../../../components/bootstrap/forms/Checks';

// Sample data for dropdowns
const partyTypeOptions = [
    { label: "Internal", value: "internal" },
    { label: "External", value: "external" },
    { label: "Contractor", value: "contractor" }
];

const reportingToOptions = [
    { label: "Manager", value: "manager" },
    { label: "Supervisor", value: "supervisor" },
    { label: "Director", value: "director" },
    { label: "CEO", value: "ceo" }
];

const regionOptions = [
    { label: "Region 1", value: "region1" },
    { label: "Region 2", value: "region2" },
    { label: "Region 3", value: "region3" },
    { label: "Region 4", value: "region4" },
    { label: "Region 5", value: "region5" }
];

const AddRole = ({ isOpen, setIsOpen, title }) => {
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

        // API call to save role data
        const url = `/roles`;

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
                console.error('Error saving role:', error);
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
                <ModalTitle id='modaladdrole'>{title}</ModalTitle>
            </ModalHeader>
            <ModalBody className='d-flex flex-column gap-3 px-5 pb-5'>
                {/* Role Name */}
                <FormGroup label="Role Name *">
                    <input
                        type="text"
                        className={errors?.role_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        placeholder="Enter role name"
                        {...register("role_name", { required: true })}
                    />
                    {renderError('role_name')}
                </FormGroup>

                {/* Party Type and Reporting to in a row */}
                <div className='d-flex justify-content-between gap-4'>
                    {/* <FormGroup label="Party Type" className='w-50'> */}
                    <div className='w-50'>
                        <ReactSelectComponent
                            control={control}
                            name='Party Type'
                            field_name='party_type'
                            getValues={getValues}
                            errors={errors}
                            options={partyTypeOptions}
                            placeholder="Select"
                        />
                        </div>
                    {/* </FormGroup> */}
                    {/* <FormGroup label="Reporting to" className='w-50'> */}
                    <div className='w-50'>
                        <ReactSelectComponent
                            control={control}
                            name='Reporting to'
                            field_name='reporting_to'
                            getValues={getValues}
                            errors={errors}
                            options={reportingToOptions}
                            placeholder="Select"
                        />
                        </div>
                    {/* </FormGroup> */}
                </div>

                {/* Regions - Multi-select */}
                {/* <FormGroup label="Regions"> */}
                    <ReactSelectComponent
                        control={control}
                        name='Regions'
                        field_name='regions'
                        getValues={getValues}
                        errors={errors}
                        options={regionOptions}
                        isMulti
                        placeholder="Select regions"
                    />
                {/* </FormGroup> */}

                {/* Share Data with Peers - Checkbox */}
                <FormGroup>
                    <Checks
                        id='shareDataWithPeers'
                        label='Share Data with Peers'
                        name='share_data_with_peers'
                        {...register("share_data_with_peers")}
                    />
                </FormGroup>
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

AddRole.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default AddRole; 