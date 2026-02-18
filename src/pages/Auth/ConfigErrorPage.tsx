import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import { useQueryClient } from '@tanstack/react-query';

const ConfigErrorPage = () => {
    const queryClient = useQueryClient();

    const handleRetry = () => {
        // Invalidate the system query to trigger a fresh fetch
        queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
    };

    return (
        <PageWrapper
            isProtected={false}
            title='Configuration Error'
            className='login-page'>
            <Page className='d-flex align-items-center justify-content-center'>
                <div className='login-card mx-auto text-center' style={{ maxWidth: '500px' }}>
                    <div
                        className='mx-auto mb-4 d-flex align-items-center justify-content-center'
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(var(--bs-danger-rgb), 0.1)',
                            color: 'var(--bs-danger)'
                        }}
                    >
                        <Icon icon='CloudOff' size='5x' />
                    </div>

                    <div className='text-center login-title mb-2'>
                        Connection Lost
                    </div>
                    <div className='text-center login-subtitle mb-4 px-3'>
                        We're having trouble reaching the main server to verify your configuration.
                    </div>

                    <div className='p-3 mb-4 rounded-4' style={{ background: '#f8f9fa', border: '1px dashed #dee2e6' }}>
                        <p className='small text-muted mb-0'>
                            This usually happens due to a network interruption or if the backend service is temporarily down.
                        </p>
                    </div>

                    <div className='d-grid gap-3'>
                        <Button
                            color='primary'
                            className='btn-login py-3 rounded-pill fw-bold shadow-sm'
                            icon='Refresh'
                            onClick={handleRetry}
                        >
                            Retry Connection
                        </Button>

                        <Button
                            color='info'
                            isLight
                            className='py-2 rounded-pill small opacity-75'
                            icon='SupportAgent'
                            onClick={() => window.location.href = 'mailto:support@abaci.ae'}
                        >
                            Contact Technical Support
                        </Button>
                    </div>

                    <div className='text-center mt-5 pt-3 border-top opacity-50' style={{ fontSize: '0.7rem' }}>
                        <Icon icon='Dns' size='sm' className='me-1' />
                        Protocol: {window.location.protocol.replace(':', '').toUpperCase()} | Node: HALO-GATEWAY
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default ConfigErrorPage;
