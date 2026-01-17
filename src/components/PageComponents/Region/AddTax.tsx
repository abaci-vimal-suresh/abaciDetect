import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../components/bootstrap/Modal';
import Button from '../../../components/bootstrap/Button';
import { authAxios } from '../../../axiosInstance';
import AuthContext from '../../../contexts/authContext';
import SaveIconButton from '../../../components/CustomComponent/Buttons/SaveIconButton';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import ReactSelectComponent from '../../CustomComponent/Select/ReactSelectComponent';

const AddTax = ({ isOpen, setIsOpen, title }) => {
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
        // setWaitingForAxios(true);

        // let formData = new FormData();
        // formData.append("tax_code", data.tax_code);
        // formData.append("tax_name", data.tax_name);
        // formData.append("tax_rate", data.tax_rate);
        // formData.append("tax_application", data.tax_application);
        // formData.append("tax_method", data.tax_method);
        // formData.append("tax_registration_number", data.tax_registration_number);
        // formData.append("tax_identification_number", data.tax_identification_number);
        // formData.append("tax_authority_name", data.tax_authority_name);
        // formData.append("tax_description", data.tax_description);
        // formData.append("tax_rounding_rules", data.tax_rounding_rules);
        // formData.append("effective_date", data.effective_date);

        // const url = `/tax_api/tax`;

        // authAxios
        //     .post(url, formData)
        //     .then((response) => {
        //         setWaitingForAxios(false);
        //         setIsOpen(false);
        //     })
        //     .catch((error) => {
        //         setWaitingForAxios(false);
        //         // Handle error here
        //     });
    };

    const renderError = (fieldName) => {
        if (errors[fieldName]?.type === "required") {
            return <span className="field-required-class">*Required</span>;
        }
        return <></>;
    };

    // Tax Application options
    const taxApplicationOptions = [
        { value: 'sales', label: 'Sales Tax' },
        { value: 'income', label: 'Income Tax' },
        { value: 'property', label: 'Property Tax' },
        { value: 'excise', label: 'Excise Tax' },
        { value: 'customs', label: 'Customs Duty' },
    ];

    // Tax Method options
    const taxMethodOptions = [
        { value: 'percentage', label: 'Percentage' },
        { value: 'fixed_amount', label: 'Fixed Amount' },
        { value: 'tiered', label: 'Tiered' },
        { value: 'progressive', label: 'Progressive' },
    ];

    // Tax Rounding Rules options
    const taxRoundingRulesOptions = [
        { value: 'round_up', label: 'Round Up' },
        { value: 'round_down', label: 'Round Down' },
        { value: 'round_nearest', label: 'Round to Nearest' },
        { value: 'no_rounding', label: 'No Rounding' },
    ];

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl' isCentered>
            <ModalHeader className='p-4' setIsOpen={setIsOpen}>
                <ModalTitle id='modaledittax'>{title}</ModalTitle>
            </ModalHeader>
            <ModalBody className='d-flex flex-column gap-3 px-5 pb-5'>
                <div className='row'>
                    {/* Row 1: Tax Code and Tax Name */}
                    <div className='col-md-6'>
                        <FormGroup label="Tax Code *">
                            <input
                                type="text"
                                className={errors?.tax_code?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder="Enter tax code"
                                {...register("tax_code", { required: true })}
                            />
                            {renderError('tax_code')}
                        </FormGroup>
                    </div>
                    <div className='col-md-6'>
                        <FormGroup label="Tax Name *">
                            <input
                                type="text"
                                className={errors?.tax_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder="Enter tax name"
                                {...register("tax_name", { required: true })}
                            />
                            {renderError('tax_name')}
                        </FormGroup>
                    </div>
                </div>

                <div className='row'>
                    {/* Row 2: Tax Application and Tax Rate */}
                    <div className='col-md-6'>
                        {/* <FormGroup label="Tax Application *"> */}
                            <ReactSelectComponent
                                control={control}
                                name='Tax Application'
                                field_name='tax_application'
                                getValues={getValues}
                                errors={errors}
                                options={taxApplicationOptions}
                                isRequired
                                placeholder="Select"
                            />
                        {/* </FormGroup> */}
                    </div>
                    <div className='col-md-6'>
                        <FormGroup label="Tax Rate *">
                            <input
                                type="number"
                                step="0.01"
                                className={errors?.tax_rate?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder="Enter tax rate"
                                {...register("tax_rate", { required: true, min: 0 })}
                            />
                            {renderError('tax_rate')}
                        </FormGroup>
                    </div>
                </div>

                <div className='row'>
                    {/* Row 3: Tax Method and Tax Identification Number */}
                    <div className='col-md-6'>
                        {/* <FormGroup label="Tax Method *"> */}
                            <ReactSelectComponent
                                control={control}
                                name='Tax Method'
                                field_name='tax_method'
                                getValues={getValues}
                                errors={errors}
                                options={taxMethodOptions}
                                isRequired
                                placeholder="Select"
                            />
                        {/* </FormGroup> */}
                    </div>
                    <div className='col-md-6'>
                        <FormGroup label="Tax Identification Number *">
                            <input
                                type="text"
                                className={errors?.tax_identification_number?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder="Enter identification number"
                                {...register("tax_identification_number", { required: true })}
                            />
                            {renderError('tax_identification_number')}
                        </FormGroup>
                    </div>
                </div>

                <div className='row'>
                    {/* Row 4: Tax Registration Number and Tax Authority Name */}
                    <div className='col-md-6'>
                        <FormGroup label="Tax Registration Number *">
                            <input
                                type="text"
                                className={errors?.tax_registration_number?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder="Enter registration number"
                                {...register("tax_registration_number", { required: true })}
                            />
                            {renderError('tax_registration_number')}
                        </FormGroup>
                    </div>
                    <div className='col-md-6'>
                        <FormGroup label="Tax Authority Name *">
                            <input
                                type="text"
                                className={errors?.tax_authority_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder="Enter authority name"
                                {...register("tax_authority_name", { required: true })}
                            />
                            {renderError('tax_authority_name')}
                        </FormGroup>
                    </div>
                </div>

                <div className='row'>
                    {/* Row 5: Tax Description and Effective Date */}
                    <div className='col-md-12'>
                        <FormGroup label="Tax Description *">
                            <textarea
                                style={{minHeight:'100px'}}
                                className={errors?.tax_description?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder="Enter tax description"
                                {...register("tax_description", { required: true })}
                            />
                            {renderError('tax_description')}
                        </FormGroup>
                    </div>
                  
                </div>

                <div className='row'>
                    {/* Row 6: Tax Rounding Rules */}
                    <div className='col-md-6'>
                        {/* <FormGroup label="Tax Rounding Rules *"> */}
                            <ReactSelectComponent
                                control={control}
                                name='Tax Rounding Rules'
                                field_name='tax_rounding_rules'
                                getValues={getValues}
                                errors={errors}
                                options={taxRoundingRulesOptions}
                                isRequired
                                placeholder="Select"
                            />

                            
                        {/* </FormGroup> */}
                    </div>

                    <div className='col-md-6'>
                        <FormGroup label="Effective Date *">
                            <input
                                type="date"
                                className={errors?.effective_date?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                {...register("effective_date", { required: true })}
                            />
                            {renderError('effective_date')}
                        </FormGroup>
                    </div>
                </div>
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

AddTax.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default AddTax; 