import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader, CardTitle, CardFooter } from '../../../../components/bootstrap/Card';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import Select from '../../../../components/bootstrap/forms/Select';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import Alert from '../../../../components/bootstrap/Alert';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/bootstrap/Modal';
import { useSystemSettings, useUpdateEmailConfig, useSendTestEmail, SystemConfig } from '../../../../api/system.api';

const EmailSection = () => {
    const { data: settings, isLoading } = useSystemSettings();
    const updateMutation = useUpdateEmailConfig();
    const testEmailMutation = useSendTestEmail();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<SystemConfig>>({
        email_protocol: 'SMTP',
        email_host: '',
        email_port: 587,
        sender_email: '',
        email_password: '',
        encryption_type: 'TLS',
    });

    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testRecipient, setTestRecipient] = useState('');
    const [isTestSuccessful, setIsTestSuccessful] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (settings) {
            setFormData({
                email_protocol: settings.email_protocol || 'SMTP',
                email_host: settings.email_host || '',
                email_port: settings.email_port || 587,
                sender_email: settings.sender_email || '',
                email_password: settings.email_password || '',
                encryption_type: settings.encryption_type || 'TLS',
            });
        }
    }, [settings]);

    const handleChange = (field: keyof SystemConfig, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setIsTestSuccessful(false); // Reset test status on change
    };

    const handleSave = () => {
        const payload = {
            email_protocol: formData.email_protocol,
            email_host: formData.email_host,
            email_port: formData.email_port,
            sender_email: formData.sender_email,
            email_password: formData.email_password,
            encryption_type: formData.encryption_type,
        };

        updateMutation.mutate(payload, {
            onSuccess: () => {
                setSuccessMessage('Email settings saved successfully');
                setIsEditing(false);
                setIsTestSuccessful(false);
                setTimeout(() => setSuccessMessage(''), 3000);
            },
        });
    };

    const handleOpenTestModal = () => {
        setIsTestModalOpen(true);
    };

    const submitTestEmail = () => {
        if (!testRecipient) return;

        testEmailMutation.mutate(
            {
                ...formData,
                email: testRecipient,
            },
            {
                onSuccess: () => {
                    setIsTestSuccessful(true);
                    setIsTestModalOpen(false);
                    setSuccessMessage('Test email sent successfully. You can now save your changes.');
                    setTimeout(() => setSuccessMessage(''), 5000);
                },
            },
        );
    };

    const handleCancel = () => {
        if (settings) {
            setFormData({
                email_protocol: settings.email_protocol || 'SMTP',
                email_host: settings.email_host || '',
                email_port: settings.email_port || 587,
                sender_email: settings.sender_email || '',
                email_password: settings.email_password || '',
                encryption_type: settings.encryption_type || 'TLS',
            });
        }
        setIsEditing(false);
        setIsTestSuccessful(false);
    };

    if (isLoading) {
        return (
            <Card stretch>
                <CardBody className='text-center py-5'>
                    <Spinner color='primary' size='3rem' />
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <Card stretch>
                <CardHeader>
                    <CardTitle>
                        <div className='d-flex align-items-center justify-content-between w-100'>
                            <div>
                                <Icon icon='Email' className='me-2' />
                                Email Settings
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    {successMessage && (
                        <Alert color='success' isLight icon='CheckCircle' className='mb-4'>
                            {successMessage}
                        </Alert>
                    )}
                    {updateMutation.isError && (
                        <Alert color='danger' isLight icon='Error' className='mb-4'>
                            Failed to save email settings.
                        </Alert>
                    )}
                    {testEmailMutation.isError && (
                        <Alert color='danger' isLight icon='Error' className='mb-4'>
                            Failed to send test email.
                        </Alert>
                    )}

                    <div className='row g-4'>
                        <div className='col-md-6'>
                            <FormGroup label='Email Protocol'>
                                <Select
                                    value={formData.email_protocol}
                                    onChange={(e: any) => handleChange('email_protocol', e.target.value)}
                                    list={[
                                        { value: 'SMTP', text: 'SMTP' },
                                        { value: 'SendGrid', text: 'SendGrid' },
                                        { value: 'Mailgun', text: 'Mailgun' },
                                    ]}
                                    ariaLabel='Email Protocol'
                                    disabled={!isEditing}
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='SMTP Host'>
                                <Input
                                    value={formData.email_host}
                                    onChange={(e: any) => handleChange('email_host', e.target.value)}
                                    placeholder='smtp.example.com'
                                    disabled={!isEditing}
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='SMTP Port'>
                                <Input
                                    value={formData.email_port}
                                    onChange={(e: any) => handleChange('email_port', parseInt(e.target.value) || 0)}
                                    placeholder='587'
                                    type='number'
                                    disabled={!isEditing}
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Encryption Type'>
                                <Select
                                    value={formData.encryption_type}
                                    onChange={(e: any) => handleChange('encryption_type', e.target.value)}
                                    list={[
                                        { value: 'None', text: 'None' },
                                        { value: 'SSL', text: 'SSL' },
                                        { value: 'TLS', text: 'TLS' },
                                    ]}
                                    ariaLabel='Encryption Type'
                                    disabled={!isEditing}
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Sender Email'>
                                <Input
                                    value={formData.sender_email}
                                    onChange={(e: any) => handleChange('sender_email', e.target.value)}
                                    placeholder='notifications@example.com'
                                    type='email'
                                    disabled={!isEditing}
                                />
                            </FormGroup>
                        </div>
                        <div className='col-md-6'>
                            <FormGroup label='Password'>
                                <Input
                                    value={formData.email_password}
                                    onChange={(e: any) => handleChange('email_password', e.target.value)}
                                    type='password'
                                    placeholder='••••••••'
                                    disabled={!isEditing}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </CardBody>
                <CardFooter>
                    <div className='col-12 d-flex justify-content-end gap-2'>
                        <Button
                            color='info'
                            isLight
                            onClick={handleOpenTestModal}
                            icon='Send'
                            isDisable={testEmailMutation.isPending}>
                            {testEmailMutation.isPending ? <Spinner isSmall inButton /> : 'Send Test Email'}
                        </Button>
                        {!isEditing ? (
                            <Button color='primary' isLight icon='Edit' onClick={() => setIsEditing(true)}>
                                Edit Settings
                            </Button>
                        ) : (
                            <>
                                <Button color='light' onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button
                                    color='primary'
                                    onClick={handleSave}
                                    icon='Save'
                                    isDisable={updateMutation.isPending || !isTestSuccessful}>
                                    {updateMutation.isPending ? <Spinner isSmall inButton /> : 'Save Changes'}
                                </Button>
                            </>
                        )}
                    </div>
                </CardFooter>
            </Card>

            {/* Test Email Modal */}
            <Modal isOpen={isTestModalOpen} setIsOpen={setIsTestModalOpen} isCentered size='lg'>
                <ModalHeader setIsOpen={setIsTestModalOpen}>
                    <ModalTitle id='test_email_modal_title'>Test Email Configuration</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className='row g-4'>
                        <div className='col-12'>
                            <div className='border rounded p-3 bg-light'>
                                <div className='row align-items-center'>
                                    <div className='col-auto'>
                                        <div className='bg-primary bg-opacity-10 p-3 rounded-circle'>
                                            <Icon icon='MarkEmailRead' size='2x' color='primary' />
                                        </div>
                                    </div>
                                    <div className='col'>
                                        <h5 className='mb-1'>Verify SMTP Connectivity</h5>
                                        <p className='text-muted small mb-0'>
                                            Confirm your email configuration is correct by sending a test message. A successful test
                                            is required before saving changes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-12'>
                            <div className='row g-3 align-items-end'>
                                <div className='col-md-5'>
                                    <FormGroup label='Sender Address (From)'>
                                        <Input value={formData.sender_email} disabled />
                                    </FormGroup>
                                </div>
                                <div className='col-md-2 text-center pb-2'>
                                    <div className='d-none d-md-block'>
                                        <Icon icon='Forward' size='2x' className='text-muted' />
                                    </div>
                                    <div className='d-md-none'>
                                        <Icon icon='ArrowDownward' size='2x' className='text-muted' />
                                    </div>
                                </div>
                                <div className='col-md-5'>
                                    <FormGroup label='Recipient Address (To)'>
                                        <Input
                                            value={testRecipient}
                                            onChange={(e: any) => setTestRecipient(e.target.value)}
                                            placeholder='recipient@example.com'
                                            type='email'
                                            required
                                        />
                                    </FormGroup>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color='light' onClick={() => setIsTestModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color='primary'
                        onClick={submitTestEmail}
                        icon='Send'
                        isDisable={testEmailMutation.isPending || !testRecipient}>
                        {testEmailMutation.isPending ? <Spinner isSmall inButton /> : 'Send Test Email'}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default EmailSection;
