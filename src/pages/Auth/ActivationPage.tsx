import React, { useState } from 'react';
import { Spinner } from 'reactstrap';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import { useQueryClient } from '@tanstack/react-query';
import { useSystemConfig, useValidateLicense } from '../../api/system.api';
import showNotification from '../../components/extras/showNotification';

const ActivationPage = () => {
    const { data: config } = useSystemConfig();
    const { mutate: validateLicense, isPending: isValidating } = useValidateLicense();
    const queryClient = useQueryClient();
    const [activationKey, setActivationKey] = useState('');

    const handleCopyDeviceId = () => {
        if (config?.device_id) {
            navigator.clipboard.writeText(config.device_id);
            showNotification('Success', 'Device ID copied to clipboard', 'success');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!activationKey.trim()) {
            showNotification('Validation Error', 'Please enter your activation key', 'warning');
            return;
        }

        if (config?.device_id) {
            validateLicense(
                { device_id: config.device_id, license_key: activationKey },
                {
                    onSuccess: () => {
                        showNotification('Success', 'System activated successfully', 'success');
                        // Invalidate query to trigger re-check of activation status
                        queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
                    },
                    onError: (error: any) => {
                        const errorMessage = error.response?.data?.message || error.message || 'Activation failed';
                        showNotification('Activation Failed', errorMessage, 'danger');
                    }
                }
            );
        }
    };

    return (
        <PageWrapper
            isProtected={false}
            title='System Activation'
            className='login-page'>
            <Page className='mt-4'>
                <div className='login-card mx-auto' style={{ maxWidth: '500px' }}>
                    <div className='text-center login-title mb-2'>
                        System Activation
                    </div>
                    <div className='text-center login-subtitle mb-4'>
                        Enter your activation key to unlock the system
                    </div>

                    <div className='mb-4 p-3 bg-light rounded-4 border-0' style={{ background: 'rgba(var(--bs-primary-rgb), 0.05)' }}>
                        <label className='small text-muted mb-1 d-block text-uppercase fw-bold ms-1' style={{ fontSize: '0.65rem' }}>Your Device ID</label>
                        <div className='d-flex align-items-center justify-content-between bg-white p-2 rounded-3 border'>
                            <code className='h6 mb-0 text-primary ms-2'>{config?.device_id || 'Fetching...'}</code>
                            <Button
                                color='info'
                                isLight
                                size='sm'
                                icon='ContentCopy'
                                onClick={handleCopyDeviceId}
                                title='Copy Device ID'
                            >
                                Copy ID
                            </Button>
                        </div>
                        <small className='text-muted mt-2 d-block ms-1' style={{ fontSize: '0.75rem' }}>
                            Share this ID with your administrator for a key.
                        </small>
                    </div>

                    <hr className='my-4 opacity-10' />

                    <form className='row g-3' onSubmit={handleSubmit}>
                        <div className='col-12'>
                            <div className='mb-4'>
                                <label htmlFor='activationKey' className='form-label fw-bold small ms-2 opacity-75'>Activation Key</label>
                                <input
                                    type='text'
                                    id='activationKey'
                                    className='form-control'
                                    placeholder='XXXX-XXXX-XXXX-XXXX'
                                    value={activationKey}
                                    onChange={(e) => setActivationKey(e.target.value)}
                                    disabled={isValidating}
                                />
                            </div>
                        </div>

                        <div className='col-12 mt-2'>
                            <Button
                                color='primary'
                                className='btn-login w-100'
                                type='submit'
                                isDisable={isValidating}
                            >
                                {isValidating ? <Spinner size='sm' /> : 'Activate System'}
                            </Button>
                        </div>
                    </form>

                    <div className='text-center mt-4 pt-3 border-top opacity-50' style={{ fontSize: '0.7rem' }}>
                        <Icon icon='VerifiedUser' size='sm' className='me-1' />
                        Authorized hardware activation
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default ActivationPage;
