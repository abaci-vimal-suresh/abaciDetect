import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../../../components/bootstrap/Button';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import { useRegisterSensor, useAreas } from '../../../../api/sensors.api';
import { SensorRegistrationData, Area } from '../../../../types/sensor';
import '../../../../styles/pages/deviceregistration.scss';

interface IDeviceRegistrationProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const flattenAreas = (areas: Area[], depth = 0): { id: number, name: string, depth: number }[] => {
    let result: { id: number, name: string, depth: number }[] = [];
    areas.forEach(area => {
        result.push({ id: area.id, name: area.name, depth });
        // @ts-ignore - Backend might return flat or nested depending on include parameters
        if (area.subareas && Array.isArray(area.subareas) && area.subareas.length > 0 && typeof area.subareas[0] === 'object') {
            // @ts-ignore
            result.push(...flattenAreas(area.subareas as unknown as Area[], depth + 1));
        }
    });
    return result;
};

const DeviceRegistration = ({ onSuccess, onCancel }: IDeviceRegistrationProps) => {
    const [step, setStep] = useState(1);
    const registerSensorMutation = useRegisterSensor();
    const { data: areas } = useAreas();

    const {
        register,
        handleSubmit,
        reset,
        trigger,
        watch,
        setValue,
        formState: { errors },
    } = useForm<SensorRegistrationData>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            sensor_type: 'HALO_SMART',
        }
    });

    const formValues = watch();
    const hasAreaSelected = !!formValues.area_id;

    const onSubmit = (data: any) => {
        // Only allow submission from the final step
        if (step < 3) {
            console.log('Submission blocked: user is not on the final step (step:', step, ')');
            return;
        }

        console.log('Form data received:', data);

        // Transform area_id to area for backend
        const apiData = {
            ...data,
            mac_address: data.mac_address ? data.mac_address.replace(/:/g, '') : data.mac_address,
            area: data.area_id || null, // ✅ Backend expects 'area' not 'area_id'
            // Remove area_id from payload
            area_id: undefined
        };

        console.log('Cleaned API payload:', apiData);

        registerSensorMutation.mutate(apiData as SensorRegistrationData, {
            onSuccess: () => {
                console.log('Sensor registered successfully');
                setStep(1);
                reset();
                onSuccess();
            },
            onError: (error) => {
                console.error('Sensor registration failed:', error);
            }
        });
    };

    const onFormError = (err: any) => {
        console.warn('Form validation errors:', err);
    };

    const steps = [
        { number: 1, title: 'Device Info', icon: 'Info' },
        { number: 2, title: 'Network', icon: 'Router' },
        { number: 3, title: 'Area', icon: 'LocationOn' }
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit, onFormError)} className='device-registration-form'>
            {/* Step Indicator */}
            <div className='step-indicator' data-step={step}>
                {steps.map((s) => (
                    <div
                        key={s.number}
                        className={`step-item ${step === s.number ? 'active' : ''} ${step > s.number ? 'completed' : ''}`}
                    >
                        <div className={`step-circle ${step === s.number ? 'active' : ''} ${step > s.number ? 'completed' : ''}`}>
                            {step > s.number ? (
                                <Icon icon='Check' size='lg' />
                            ) : (
                                <Icon icon={s.icon} size='lg' />
                            )}
                        </div>
                        <span className='step-label'>{s.title}</span>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <div className='form-section'>
                {step === 1 && (
                    <div className='row g-4'>
                        <div className='col-12'>
                            <FormGroup label='Sensor Name' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='Sensors' className='input-icon' />
                                    <input
                                        className={`form-control input-with-icon ${errors.name ? 'is-invalid' : ''}`}
                                        placeholder='e.g. Cafeteria Sensor 1'
                                        data-tour='sensor-name-input'
                                        {...register('name', {
                                            required: 'Sensor name is required',
                                            maxLength: {
                                                value: 200,
                                                message: 'Name must be less than 200 characters'
                                            }
                                        })}
                                    />
                                    {errors.name && <div className='invalid-feedback'>{errors.name.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Sensor Type' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='Category' className='input-icon' />
                                    <select
                                        className={`form-select input-with-icon ${errors.sensor_type ? 'is-invalid' : ''}`}
                                        data-tour='sensor-type-select'
                                        {...register('sensor_type')}
                                    >
                                        <option value='HALO_SMART'>Halo Smart Sensor</option>
                                        <option value='HALO_3C'>Halo 3C</option>
                                        <option value='HALO_IOT'>Halo IoT</option>
                                        <option value='HALO_CUSTOM'>Halo Custom</option>
                                    </select>
                                    {errors.sensor_type && <div className='invalid-feedback'>{errors.sensor_type.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='Description' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='Description' className='input-icon' />
                                    <textarea
                                        className={`form-control input-with-icon ${errors.description ? 'is-invalid' : ''}`}
                                        placeholder='Enter sensor description...'
                                        rows={3}
                                        {...register('description', {
                                            maxLength: {
                                                value: 500,
                                                message: 'Description must be less than 500 characters'
                                            }
                                        })}
                                    />
                                    {errors.description && <div className='invalid-feedback'>{errors.description.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className='row g-4'>
                        <div className='col-12'>
                            <FormGroup label='MAC Address' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='DeviceHub' className='input-icon' />
                                    <input
                                        className={`form-control input-with-icon font-monospace ${errors.mac_address ? 'is-invalid' : ''}`}
                                        placeholder='00:1A:2B:3C:4D:5E'
                                        {...register('mac_address', {
                                            onChange: (e) => {
                                                // Auto-format MAC address
                                                let value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                                                if (value.length > 12) value = value.substring(0, 12);

                                                const parts = [];
                                                for (let i = 0; i < value.length; i += 2) {
                                                    parts.push(value.substring(i, i + 2));
                                                }
                                                const formatted = parts.join(':');

                                                if (e.target.value !== formatted) {
                                                    e.target.value = formatted;
                                                    setValue('mac_address', formatted, { shouldValidate: true });
                                                }
                                            },
                                            validate: value => {
                                                if (!value) return true; // Optional
                                                const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
                                                return macRegex.test(value) || 'Invalid MAC Address format';
                                            },
                                            maxLength: {
                                                value: 17, // 12 chars + 5 colons
                                                message: 'MAC address must be 17 characters'
                                            }
                                        })}
                                    />
                                    {errors.mac_address && <div className='invalid-feedback'>{errors.mac_address.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                        <div className='col-12'>
                            <FormGroup label='IP Address (Optional)' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='Language' className='input-icon' />
                                    <input
                                        className={`form-control input-with-icon font-monospace ${errors.ip_address ? 'is-invalid' : ''}`}
                                        placeholder='192.168.1.100'
                                        {...register('ip_address', {
                                            validate: value => {
                                                if (!value) return true; // Optional
                                                const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                                                return ipRegex.test(value) || 'Invalid IP Address format';
                                            },
                                            maxLength: {
                                                value: 100,
                                                message: 'IP address must be less than 100 characters'
                                            }
                                        })}
                                    />
                                    {errors.ip_address && <div className='invalid-feedback'>{errors.ip_address.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                        <div className='col-12 col-md-6'>
                            <FormGroup label='Device Username' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='Person' className='input-icon' />
                                    <input
                                        className={`form-control input-with-icon ${errors.username ? 'is-invalid' : ''}`}
                                        placeholder='admin'
                                        autoComplete='off'
                                        {...register('username', {
                                            maxLength: {
                                                value: 100,
                                                message: 'Username must be less than 100 characters'
                                            }
                                        })}
                                    />
                                    {errors.username && <div className='invalid-feedback'>{errors.username.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                        <div className='col-12 col-md-6'>
                            <FormGroup label='Device Password' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='VpnKey' className='input-icon' />
                                    <input
                                        type='password'
                                        className={`form-control input-with-icon ${errors.password ? 'is-invalid' : ''}`}
                                        placeholder='••••••••'
                                        autoComplete='new-password'
                                        {...register('password', {
                                            maxLength: {
                                                value: 100,
                                                message: 'Password must be less than 100 characters'
                                            }
                                        })}
                                    />
                                    {errors.password && <div className='invalid-feedback'>{errors.password.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className='row g-4'>
                        <div className='col-12'>
                            {/* Optional area hint */}
                            <p className='text-muted small mb-3 d-flex align-items-center gap-1'>
                                <Icon icon='InfoOutlined' style={{ fontSize: '1rem' }} />
                                Area is optional — you can assign or change it anytime from the sensor settings.
                            </p>
                            <FormGroup label='Area / Location' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='LocationOn' className='input-icon' />
                                    <select
                                        className={`form-select input-with-icon ${errors.area_id ? 'is-invalid' : ''}`}
                                        {...register('area_id', {
                                            valueAsNumber: true
                                        })}
                                    >
                                        <option value=''>Assign later</option>
                                        {areas && flattenAreas(areas).map(area => (
                                            <option key={area.id} value={area.id}>
                                                {'\u00A0'.repeat(area.depth * 4)}{area.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.area_id && <div className='invalid-feedback'>{errors.area_id.message}</div>}
                                </div>
                            </FormGroup>
                        </div>


                        <div className='col-12 col-md-4'>
                            <FormGroup label='X Position (0-1)' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='SwapHoriz' className='input-icon' />
                                    <input
                                        type='number'
                                        step='0.01'
                                        min='0'
                                        max='1'
                                        className={`form-control input-with-icon ${errors.x_val ? 'is-invalid' : ''}`}
                                        placeholder='0.5'
                                        {...register('x_val', {
                                            valueAsNumber: true,
                                            min: { value: 0, message: 'X must be between 0 and 1' },
                                            max: { value: 1, message: 'X must be between 0 and 1' }
                                        })}
                                    />
                                    {errors.x_val && <div className='invalid-feedback'>{errors.x_val.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                        <div className='col-12 col-md-4'>
                            <FormGroup label='Y Position (0-1)' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='SwapVert' className='input-icon' />
                                    <input
                                        type='number'
                                        step='0.01'
                                        min='0'
                                        max='1'
                                        className={`form-control input-with-icon ${errors.y_val ? 'is-invalid' : ''}`}
                                        placeholder='0.5'
                                        {...register('y_val', {
                                            valueAsNumber: true,
                                            min: { value: 0, message: 'Y must be between 0 and 1' },
                                            max: { value: 1, message: 'Y must be between 0 and 1' }
                                        })}
                                    />
                                    {errors.y_val && <div className='invalid-feedback'>{errors.y_val.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                        <div className='col-12 col-md-4'>
                            <FormGroup label='Z Height (meters)' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='Height' className='input-icon' />
                                    <input
                                        type='number'
                                        step='0.1'
                                        min='0'
                                        max='10'
                                        className={`form-control input-with-icon ${errors.z_val ? 'is-invalid' : ''}`}
                                        placeholder='0.9'
                                        {...register('z_val', {
                                            valueAsNumber: true,
                                            min: { value: 0, message: 'Z must be at least 0' },
                                            max: { value: 10, message: 'Z must be at most 10' }
                                        })}
                                    />
                                    {errors.z_val && <div className='invalid-feedback'>{errors.z_val.message}</div>}
                                </div>
                            </FormGroup>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className='form-footer'>
                <Button
                    type='button'
                    icon={step === 1 ? 'Close' : 'ChevronLeft'}
                    onClick={() => {
                        if (step === 1) {
                            onCancel();
                        } else {
                            setStep(step - 1);
                        }
                    }}
                    isDisable={registerSensorMutation.isPending}
                >
                    {step === 1 ? 'Cancel' : 'Back'}
                </Button>

                {step < 3 ? (
                    <Button
                        key='btn-continue'
                        type='button'
                        color='primary'
                        icon='ChevronRight'
                        data-tour='sensor-continue-btn'
                        onClick={async () => {
                            const fields = step === 1
                                ? ['name', 'sensor_type']
                                : ['mac_address', 'ip_address', 'username', 'password'];
                            // @ts-ignore
                            const isValid = await trigger(fields);
                            if (isValid) setStep(step + 1);
                        }}
                    >
                        Continue
                    </Button>
                ) : (
                    <Button
                        key='btn-register'
                        type='submit'
                        color='primary'
                        icon='Check'
                        isDisable={registerSensorMutation.isPending}
                        data-tour='sensor-confirm-btn'
                    >
                        {registerSensorMutation.isPending && <Spinner isSmall inButton />}
                        {hasAreaSelected ? 'Confirm & Register' : 'Register — Area can be set later'}
                    </Button>
                )}
            </div>
        </form>
    );
};

export default DeviceRegistration;