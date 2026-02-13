import React, { useState } from 'react';
import { Spinner } from 'reactstrap';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import { useRegisterSuperAdmin } from '../../api/system.api';
import showNotification from '../../components/extras/showNotification';

interface SuperAdminFormData {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

const SuperAdminPage = () => {
    const [formData, setFormData] = useState<SuperAdminFormData>({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

    const registerMutation = useRegisterSuperAdmin();

    // Password strength checker
    const checkPasswordStrength = (password: string) => {
        if (password.length === 0) {
            setPasswordStrength(null);
            return;
        }

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) setPasswordStrength('weak');
        else if (strength <= 3) setPasswordStrength('medium');
        else setPasswordStrength('strong');
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setFormData({ ...formData, password: newPassword });
        checkPasswordStrength(newPassword);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            role: 'Admin' // Setting master admin role
        };

        registerMutation.mutate(payload, {
            onSuccess: () => {
                showNotification('Success', 'Super Admin account created successfully', 'success');
                localStorage.setItem('showGuidedTour', 'true');
            },
            onError: (error: any) => {
                const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
                showNotification('Error', errorMessage, 'danger');
            }
        });
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 'weak': return 'danger';
            case 'medium': return 'warning';
            case 'strong': return 'success';
            default: return 'secondary';
        }
    };

    return (
        <PageWrapper
            isProtected={false}
            title='System Setup'
            className='login-page'>
            <Page className='mt-4'>
                <div className='login-card mx-auto' style={{ maxWidth: '500px' }}>
                    <div className='text-center login-title mb-2'>
                        System Setup
                    </div>
                    <div className='text-center login-subtitle mb-4'>
                        Create your master administrator account
                    </div>

                    <form onSubmit={handleSubmit} className='row g-3'>
                        <div className='col-12'>
                            <div className='mb-4'>
                                <label className='form-label fw-bold small ms-2 opacity-75'>Username</label>
                                <input
                                    type='text'
                                    className='form-control'
                                    placeholder='Administrator username'
                                    required
                                    minLength={3}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            {/* Email Field */}
                            <div className='mb-4'>
                                <label className='form-label fw-bold small ms-2 opacity-75'>Email Address</label>
                                <input
                                    type='email'
                                    className='form-control'
                                    placeholder='admin@company.com'
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className='form-label fw-bold small ms-2 opacity-75'>First Name</label>
                                    <input
                                        type='text'
                                        className='form-control'
                                        placeholder='First Name'
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className='form-label fw-bold small ms-2 opacity-75'>Last Name</label>
                                    <input
                                        type='text'
                                        className='form-control'
                                        placeholder='Last Name'
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className='mb-2'>
                                <label className='form-label fw-bold small ms-2 opacity-75'>Password</label>
                                <div className='position-relative'>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className='form-control'
                                        placeholder='Secure password'
                                        required
                                        minLength={8}
                                        value={formData.password}
                                        onChange={handlePasswordChange}
                                    />
                                    <span
                                        onClick={() => setShowPassword(!showPassword)}
                                        className='position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer opacity-50'>
                                        <Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} />
                                    </span>
                                </div>

                                {/* Password Strength Indicator */}
                                {passwordStrength && (
                                    <div className='mt-2 px-2'>
                                        <div className='d-flex justify-content-between align-items-center mb-1'>
                                            <small className='text-muted' style={{ fontSize: '0.7rem' }}>Strength:</small>
                                            <small className={`text-${getPasswordStrengthColor()} fw-bold text-capitalize`} style={{ fontSize: '0.7rem' }}>
                                                {passwordStrength}
                                            </small>
                                        </div>
                                        <div className='progress' style={{ height: '3px' }}>
                                            <div
                                                className={`progress-bar bg-${getPasswordStrengthColor()}`}
                                                style={{
                                                    width: passwordStrength === 'weak' ? '33%' :
                                                        passwordStrength === 'medium' ? '66%' : '100%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='col-12 mt-4'>
                            <Button
                                isDisable={registerMutation.isPending}
                                className='btn-login w-100'
                                type='submit'
                            >
                                {registerMutation.isPending ? (
                                    <Spinner size='sm' />
                                ) : (
                                    'Create Administrator'
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Footer Info */}
                    <div className='text-center mt-4 pt-3 border-top opacity-50' style={{ fontSize: '0.7rem' }}>
                        <Icon icon='Shield' size='sm' className='me-1' />
                        Secure system initialization
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default SuperAdminPage;