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

const AddRegionGroups = ({ isOpen, setIsOpen, title }) => {
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

                <FormGroup label="Group Name *">
                    <input
                        type="text"
                        className={errors?.group_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        {...register("group_name", { required: true })}
                    />
                    {renderError('group_name')}
                </FormGroup>

                <FormGroup label="Description *">
                    <textarea
                        style={{minHeight:'150px'}}
                        className={errors?.description?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                        {...register("description", { required: true })}
                    />
                    {renderError('description')}
                </FormGroup>

               <ReactSelectComponent
                control={control}
                name='Regions'
                field_name='regions'
                getValues={getValues}
                errors={errors}
                options={[]}
                isRequired
                // isLoading={loader}

                />

                {/* <FormGroup label="Image">
                    <input
                        type="file"
                        className='form-control'
                        accept="image/*"
                        {...register("image")}
                    />
                </FormGroup> */}
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

AddRegionGroups.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default AddRegionGroups; 