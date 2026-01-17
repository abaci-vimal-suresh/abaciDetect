/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import classNames from 'classnames';
import { useFormik } from 'formik';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import validateEmail from '../../helpers/emailValidator';
import AbaciLoader from '../../components/AbaciLoader/AbaciLoader';
import Icon from '../../components/icon/Icon';
import { useLogin, authConfig } from '../../api/auth.api';

const Login = () => {
    const navigate = useNavigate();
    const { setUser, setUserData, userData } = useContext(AuthContext);
    const { darkModeStatus } = useDarkMode();
    const [isLoading, setIsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Use the new login hook
    const loginMutation = useLogin();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Redirect if already logged in
    useEffect(() => {
        if (userData !== null) {
            if (Object.keys(userData).length > 0) {
                navigate('/');
            } else {
                setTimeout(() => setIsLoading(false), 500);
            }
        } else {
            setTimeout(() => setIsLoading(false), 500);
        }
    }, [userData, navigate]);

    const formik = useFormik({
        initialValues: {
            loginUsername: '',
            loginPassword: '',
        },
        validate: (values) => {
            const errors: any = {};
            const emailError = validateEmail(values.loginUsername);

            if (!values.loginUsername) {
                errors.loginUsername = 'Required';
            }

            if (!values.loginPassword) {
                errors.loginPassword = 'Required';
            }

            if (emailError) {
                errors.loginUsername = emailError;
            }

            return errors;
        },
        onSubmit: (values) => {
            handleSignin(values);
        },
    });

    const handleSignin = (values: any) => {
        loginMutation.mutate(
            {
                email: values.loginUsername,
                password: values.loginPassword,
            },
            {
                onSuccess: (response) => {
                    console.log('✅ Login Success:', response);

                    // Handle invited user status
                    if (response.data.user_status === 'INVITED') {
                        // User needs to change password
                        // You can add password reset flow here if needed
                        console.log('User invited, should change password');
                    } else {
                        // Update React state with user data
                        setUser(response.data.email);
                        setUserData({ ...response.data, user_class: 'Envirol' });

                        // Role-based redirection
                        if (response.data.role === 'Admin') {
                            navigate('/');
                        } else {
                            navigate('/profile');
                        }
                    }
                },
                onError: (error: any) => {
                    console.error('❌ Login Error:', error);

                    let errorMessage = 'Error occurred, please check your connection and try again!';
                    const status = error.response?.status;
                    const serverMessage = error.response?.data?.message;

                    if (status === 401 || status === 403) {
                        errorMessage = serverMessage || 'Invalid credentials';
                    } else if (status === 400) {
                        errorMessage = serverMessage || errorMessage;
                    }

                    formik.setFieldError('loginPassword', errorMessage);
                    formik.setFieldError('loginUsername', ' ');
                },
            }
        );
    };

    if (isLoading) {
        return <AbaciLoader />;
    }

    return (
        <PageWrapper
            isProtected={false}
            title="Login"
            className="login-page">
            <Page className='mt-4'>
                <div className='login-card mx-auto'>
                    <div className='login-logo d-flex justify-content-between align-items-center'>
                        <Icon icon='Sensors' color='primary' className='brand-icon' />
                        <Icon icon='Sensors' color='danger' className='brand-icon' />
                        <Icon icon='Sensors' color='info' className='brand-icon' />
                    </div>

                    <div className='text-center login-title'>
                        {import.meta.env.VITE_SITE_NAME}
                    </div>
                    <div className='text-center login-subtitle'>
                        Sign in to continue to your dashboard
                    </div>

                    {authConfig.useMock && (
                        <div className='alert alert-info border-0 rounded-4 mb-4' style={{ background: 'rgba(77, 105, 250, 0.08)' }}>
                            <div className='small text-center'>
                                <strong>Admin:</strong> admin@gmail.com / password123
                            </div>
                        </div>
                    )}

                    <form
                        className='row g-3'
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                formik.handleSubmit();
                            }
                        }}>
                        <div className='col-12'>
                            <div className="mb-4">
                                <label className="form-label fw-bold small ms-2 opacity-75">Email Address</label>
                                <input
                                    type="email"
                                    className={classNames('form-control', { 'is-invalid': formik.touched.loginUsername && formik.errors.loginUsername })}
                                    name="loginUsername"
                                    placeholder="name@example.com"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.loginUsername}
                                    disabled={loginMutation.isPending}
                                />
                                {formik.touched.loginUsername && formik.errors.loginUsername && (
                                    <div className="invalid-feedback ms-2">{formik.errors.loginUsername as string}</div>
                                )}
                            </div>

                            <div className="mb-2">
                                <label className="form-label fw-bold small ms-2 opacity-75">Password</label>
                                <div className="position-relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className={classNames('form-control', { 'is-invalid': formik.touched.loginPassword && formik.errors.loginPassword })}
                                        name="loginPassword"
                                        placeholder="••••••••"
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.loginPassword}
                                        disabled={loginMutation.isPending}
                                    />
                                    <span
                                        onClick={togglePasswordVisibility}
                                        className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer opacity-50">
                                        <Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} />
                                    </span>
                                </div>
                                {formik.touched.loginPassword && formik.errors.loginPassword && (
                                    <div className="invalid-feedback ms-2">{formik.errors.loginPassword as string}</div>
                                )}
                            </div>
                        </div>

                        <div className='col-12 mt-4'>
                            <Button
                                isDisable={loginMutation.isPending}
                                id='login_button'
                                className='btn-login'
                                onClick={formik.handleSubmit}>
                                {loginMutation.isPending ? (
                                    <Spinner size='sm' />
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </div>

                        <div className='text-center mt-4'>
                            <p className='user-select-none small opacity-75'>
                                Don't have an account?{' '}
                                <Link to="/public/establishment-registration" className='fw-bold text-decoration-none'>
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default Login;