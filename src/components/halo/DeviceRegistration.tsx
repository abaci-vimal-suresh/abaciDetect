import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../components/bootstrap/Button';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Icon from '../../components/icon/Icon';
import Spinner from '../../components/bootstrap/Spinner';
import { useRegisterSensor } from '../../api/sensors.api';
import { SensorRegistrationData } from '../../types/sensor';
import '../../styles/pages/deviceregistration.scss';

interface IDeviceRegistrationProps {

    onSuccess: () => void;
    onCancel: () => void;
}

const DeviceRegistration = ({ onSuccess, onCancel }: IDeviceRegistrationProps) => {
    const [step, setStep] = useState(1);
    const registerSensorMutation = useRegisterSensor();

    const {
        register,
        handleSubmit,
        reset,
        trigger,
        watch,
        formState: { errors },
    } = useForm<SensorRegistrationData>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            sensor_type: 'HALO_SMART',
        }
    });

    const formValues = watch();

    const onSubmit = (data: SensorRegistrationData) => {
        registerSensorMutation.mutate(data, {
            onSuccess: () => {
                setStep(1);
                reset();
                onSuccess();
            },
        });
    };

    const steps = [
        { number: 1, title: 'Device Info', icon: 'Info' },
        { number: 2, title: 'Network', icon: 'Router' },
        { number: 3, title: 'Review', icon: 'CheckCircle' }
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='device-registration-form'>
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
                                            pattern: {
                                                value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                                                message: 'Invalid MAC Address format'
                                            },
                                            maxLength: {
                                                value: 100,
                                                message: 'MAC address must be less than 100 characters'
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
                                            pattern: {
                                                value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                                                message: 'Invalid IP Address format'
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
                            <FormGroup label='Location' className='mb-0'>
                                <div className='input-icon-wrapper'>
                                    <Icon icon='LocationOn' className='input-icon' />
                                    <input
                                        className={`form-control input-with-icon ${errors.location ? 'is-invalid' : ''}`}
                                        placeholder='e.g. Building A, Floor 2, Room 205'
                                        {...register('location', {
                                            maxLength: {
                                                value: 200,
                                                message: 'Location must be less than 200 characters'
                                            }
                                        })}
                                    />
                                    {errors.location && <div className='invalid-feedback'>{errors.location.message}</div>}
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
                                <div className='review-label'>Location</div>
                                <div className='review-value'>{formValues.location || 'Not specified'}</div>
                            </div>
                        </div>

                        <div className='review-card'>
                            <input
                                className='form-check-input'
                                type='checkbox'
                                id='terms'
                                required
                            />
                            <label className='form-check-label' htmlFor='terms'>
                                I confirm that this device is physically installed securely and ready for commissioning.
                            </label>
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
                                : ['mac_address', 'ip_address', 'location'];
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