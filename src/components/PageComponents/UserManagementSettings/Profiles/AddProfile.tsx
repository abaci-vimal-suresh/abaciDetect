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
import Checks, { ChecksGroup } from '../../../bootstrap/forms/Checks';

// Sample data for dropdowns
const partyTypeOptions = [
    { label: "Internal", value: "internal" },
    { label: "External", value: "external" },
    { label: "Contractor", value: "contractor" }
];

const regionOptions = [
    { label: "Region 1", value: "region1" },
    { label: "Region 2", value: "region2" },
    { label: "Region 3", value: "region3" },
    { label: "Region 4", value: "region4" },
    { label: "Region 5", value: "region5" }
];

// Sample modules for permissions
const modules = [
    { id: 'module_a', name: 'Module A' },
    { id: 'module_b', name: 'Module B' },
    { id: 'module_c', name: 'Module C' },
    { id: 'module_d', name: 'Module D' }
];

const permissions = ['view', 'create', 'edit', 'delete'];

const AddProfile = ({ isOpen, setIsOpen, title }) => {
    const {
        register,
        handleSubmit,
        control,
        getValues,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm();
    const { userData } = useContext(AuthContext);
    const [waitingForAxios, setWaitingForAxios] = useState(false);
    const [activeTab, setActiveTab] = useState('web'); // 'web' or 'mobile'
    const [selectedRegions, setSelectedRegions] = useState([
        { label: "Region 1", value: "region1" },
        { label: "Region 2", value: "region2" },
        { label: "Region 3", value: "region3" }
    ]);

    // Watch form values for permissions
    const watchedPermissions = watch('permissions') || {};

    const onSubmit = (data) => {
        setWaitingForAxios(true);

        // API call to save profile data
        const url = `/profiles`;

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
                console.error('Error saving profile:', error);
            });
    };

    const renderError = (fieldName) => {
        if (errors[fieldName]?.type === "required") {
            return <span className="field-required-class">*Required</span>;
        }
        return <></>;
    };

    const handlePermissionChange = (moduleId, permission) => {
        const currentPermissions = watchedPermissions[moduleId] || {};
        const newPermissions = {
            ...currentPermissions,
            [permission]: !currentPermissions[permission]
        };
        setValue(`permissions.${moduleId}`, newPermissions);
    };

    const removeRegion = (regionToRemove) => {
        setSelectedRegions(selectedRegions.filter(region => region.value !== regionToRemove.value));
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl' isCentered>
            <ModalHeader className='p-4' setIsOpen={setIsOpen}>
                <ModalTitle id='modalAddProfile'>{title}</ModalTitle>
            </ModalHeader>
            <ModalBody className='d-flex flex-column gap-4 px-5 pb-5'>
                {/* Profile Details Section */}
                <div className='mb-4'>
                    {/* Profile Name */}
                    <FormGroup label="Profile Name *" className='mb-3'>
                        <input
                            type="text"
                            className={errors?.profile_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                            placeholder="Enter profile name"
                            {...register("profile_name", { required: true })}
                        />
                        {renderError('profile_name')}
                    </FormGroup>

                    {/* Profile Description */}
                    <FormGroup label="Profile Description" className='mb-3'>
                        <textarea
                            className='form-control'
                            rows={3}
                            placeholder="Enter profile description"
                            {...register("profile_description")}
                        />
                    </FormGroup>

                    {/* Party Type */}
                    {/* <FormGroup label="Party Type" className='mb-3'> */}
                        <ReactSelectComponent
                            control={control}
                            name='Party Type'
                            field_name='party_type'
                            getValues={getValues}
                            errors={errors}
                            options={partyTypeOptions}
                            placeholder="Select"
                        />
                    {/* </FormGroup> */}

                    {/* Regions */}
                       
                            <ReactSelectComponent
                                control={control}
                                name='Add Region'
                                field_name='add_region'
                                getValues={getValues}
                                errors={errors}
                                isMulti
                                options={regionOptions.filter(option => 
                                    !selectedRegions.find(selected => selected.value === option.value)
                                )}
                                placeholder="Add region"
                                onChange={(selected) => {
                                    if (selected && !selectedRegions.find(r => r.value === selected.value)) {
                                        setSelectedRegions([...selectedRegions, selected]);
                                    }
                                }}
                            />
                </div>

                {/* Interface Permissions Section */}
                <div>
                    <h5 className='mb-2'>Interface Permissions</h5>
                    <p className='text-muted mb-3'>Manage access permissions across the system</p>
                    
                    {/* Interface Tabs */}
                    <div className='d-flex mb-4'>
                        <button
                            type='button'
                            className={`btn ${activeTab === 'web' ? 'btn-outline-success active' : 'btn-outline-primary'} me-2`}
                            onClick={() => setActiveTab('web')}
                        >
                            Web Interface
                        </button>
                        <button
                            type='button'
                            className={`btn ${activeTab === 'mobile' ? 'btn-outline-success active' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('mobile')}
                        >
                            Mobile App
                        </button>
                    </div>

                    {/* Permissions Table */}
                    <div className='table-responsive'>
                        <table className='table'>
                            <thead className=''>
                                <tr>
                                    <th style={{ width: '40%' }}>Modules</th>
                                    <th style={{ width: '15%' }}>View</th>
                                    <th style={{ width: '15%' }}>Create</th>
                                    <th style={{ width: '15%' }}>Edit</th>
                                    <th style={{ width: '15%' }}>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map((module) => (
                                    <tr key={module.id}>
                                        <td className='fw-medium'>{module.name}</td>
                                        {permissions.map((permission) => (
                                            <td key={permission} className='text'>
                                                <input
                                                    type="checkbox"
                                                    className={`form-check-input ${watchedPermissions[module.id]?.[permission] ? 'bg-primary' : ''}`}
                                                    checked={watchedPermissions[module.id]?.[permission] || false}
                                                    onChange={() => handlePermissionChange(module.id, permission)}
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

AddProfile.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default AddProfile; 