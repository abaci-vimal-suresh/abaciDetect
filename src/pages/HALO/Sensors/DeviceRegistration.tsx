import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../../components/bootstrap/Button';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Icon from '../../../components/icon/Icon';
import Spinner from '../../../components/bootstrap/Spinner';
import { useRegisterSensor, useAreas } from '../../../api/sensors.api';
import { SensorRegistrationData, Area } from '../../../types/sensor';
import '../../../styles/pages/deviceregistration.scss';

interface IDeviceRegistrationProps {

    onSuccess: () => void;
    onCancel: () => void;
}

const flattenAreas = (areas: Area[], depth = 0): { id: number, name: string, depth: number }[] => {
    let result: { id: number, name: string, depth: number }[] = [];
    areas.forEach(area => {
        result.push({ id: area.id, name: area.name, depth });
        if (area.subareas) {
            result.push(...flattenAreas(area.subareas, depth + 1));
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

    const onSubmit = (data: any) => {
        console.log('Form data received:', data);

        const apiData = {
            ...data,
            mac_address: data.mac_address ? data.mac_address.replace(/:/g, '') : data.mac_address
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
        { number: 3, title: 'Review', icon: 'CheckCircle' }
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

                                                // Use setValue to update without full re-render overhead if possible, 
                                                // but we need to update the input value immediately.
                                                // Setting the value in the event target helps, but setValue updates the internal state.
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
                        <div className='col-12'>
                            <FormGroup label='Area / Location' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='LocationOn' className='input-icon' />
                                    <select
                                        className={`form-select input-with-icon ${errors.area_id ? 'is-invalid' : ''}`}
                                        {...register('area_id', {
                                            required: 'Area is required',
                                            valueAsNumber: true
                                        })}
                                    >
                                        <option value=''>Select Area...</option>
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
                    <div>
                        <div className='review-card'>
                            <div className='review-card-title'>
                                <Icon icon='Info' size='sm' />
                                Device Information
                            </div>
                            <div className='review-item'>
                                <div className='review-label'>Sensor Name</div>
                                <div className='review-value'>{formValues.name || 'Not provided'}</div>
                            </div>
                            <div className='review-item'>
                                <div className='review-label'>Sensor Type</div>
                                <div className='review-value'>{formValues.sensor_type || 'Not provided'}</div>
                            </div>
                            <div className='review-item'>
                                <div className='review-label'>Description</div>
                                <div className='review-value'>{formValues.description || 'Not provided'}</div>
                            </div>
                        </div>

                        <div className='review-card'>
                            <div className='review-card-title'>
                                <Icon icon='Router' size='sm' />
                                Network & Location
                            </div>
                            <div className='review-item'>
                                <div className='review-label'>MAC Address</div>
                                <div className='review-value font-monospace'>{formValues.mac_address || 'Not provided'}</div>
                            </div>
                            <div className='review-item'>
                                <div className='review-label'>IP Address</div>
                                <div className='review-value font-monospace'>{formValues.ip_address || 'Not provided'}</div>
                            </div>
                            <div className='review-item'>
                                <div className='review-label'>Area</div>
                                <div className='review-value'>
                                    {formValues.area_id
                                        ? (flattenAreas(areas || []).find(a => a.id === Number(formValues.area_id))?.name || 'Unknown Area')
                                        : 'Not specified'}
                                </div>
                            </div>
                            {(formValues.username || formValues.password) && (
                                <div className='review-item'>
                                    <div className='review-label'>Credentials</div>
                                    <div className='review-value'>
                                        {formValues.username ? `User: ${formValues.username}` : ''}
                                        {formValues.username && formValues.password ? ' / ' : ''}
                                        {formValues.password ? 'Password: ••••••••' : ''}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className='form-footer'>
                <Button
                    type='button'
                    // color='light'
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
                        type='button'
                        color='primary'
                        icon='ChevronRight'
                        onClick={async () => {
                            const fields = step === 1
                                ? ['name', 'sensor_type']
                                : ['mac_address', 'ip_address', 'area_id'];
                            // @ts-ignore
                            const isValid = await trigger(fields);
                            if (isValid) setStep(step + 1);
                        }}
                    >
                        Continue
                    </Button>
                ) : (
                    <Button
                        type='submit'
                        color='primary'
                        icon='Check'
                        isDisable={registerSensorMutation.isPending}
                    >
                        {registerSensorMutation.isPending && <Spinner isSmall inButton />}
                        Confirm & Register
                    </Button>
                )}
            </div>
        </form>
    );
};

export default DeviceRegistration;