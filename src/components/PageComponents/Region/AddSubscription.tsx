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
import Checks, { ChecksGroup } from '../../bootstrap/forms/Checks';

const FilterChoices=[{ label: "Monthly", value: "Monthly" },{ label: "Quarterly", value: "Quarterly" },{ label: "Half-Yearly", value: "Half Yearly"},{ label: "Yearly", value: "Yearly" }]


const AddSubscription = ({ isOpen, setIsOpen, title }) => {
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
        // formData.append("type", data.type);
        // formData.append("fixture_name", data.fixture_name);
        // formData.append("size", data.size);
        // if (data.image && data.image[0]) {
        //     formData.append("image", data.image[0]);
        // }

        // const url = `/gtcc_api/fixture`;

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

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
            <ModalHeader className='p-4' setIsOpen={setIsOpen}>
                <ModalTitle id='modaleditvehicle'>{title}</ModalTitle>
            </ModalHeader>
            <ModalBody className='d-flex flex-column gap-3 px-5 pb-5'>

                <FormGroup label="Plan Name *">
                    <input
                        type="text"
                        className={errors?.plan_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        {...register("plan_name", { required: true })}
                    />
                    {renderError('plan_name')}
                </FormGroup>

                 <Checks
                    id='perpetualLicense'
                    label='Perpetual Validity'
                    name='Perpetual Validity'
                    // value={enableSubscription}
                    // onChange={() => setEnableSubscription(!enableSubscription)}
                    // checked={enableSubscription}
                />


                <div className='d-flex justify-content-between gap-4'>
                <FormGroup label="Valid From *" className='w-50'>
                    <input
                        type="date"
                        className={errors?.valid_from?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        {...register("valid_from", { required: true })}
                    />
                    {renderError('valid_from')}
                </FormGroup>
                <FormGroup label="Valid To *" className='w-50'>
                    <input
                        type="date"
                        className={errors?.valid_to?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        {...register("valid_to", { required: true })}
                    />
                    {renderError('valid_to')}
                </FormGroup>
                </div>

               <ReactSelectComponent
                control={control}
                name='Charge To'
                field_name='charge_to'
                getValues={getValues}
                errors={errors}
                options={[{label:'GTCC',value:'GTCC'},{label:'Entity',value:'Entity'}]}
                isRequired
                isMulti
                />

                  <FormGroup label="Payment Frequency" >
                     <ChecksGroup className='d-flex gap-3'>
                                    {FilterChoices.map((mappedData) => (
                                        <Checks
                                            key={mappedData.value}
                                            type='radio'
                                            // style={}
                                            id={mappedData.value}
                                            label={mappedData.label}
                                            name='Filter Keys'
                                            value={mappedData.value}
                                            // onChange={() => handleFilterTypeChange(mappedData)}
                                            // @ts-ignore
                                            // checked={selectedFilterList.value}
                                        />
                                    ))}
                                </ChecksGroup>
                    </FormGroup>

                     <FormGroup label="Amount *">
                    <input
                        type="text"
                        className={errors?.amount?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        {...register("amount", { required: true })}
                    />
                    {renderError('amount')}
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

AddSubscription.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default AddSubscription; 