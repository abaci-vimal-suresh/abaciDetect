import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Row, Spinner } from 'reactstrap';
import { useFormik } from 'formik';
import { Player } from '@lottiefiles/react-lottie-player';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/shared/useDarkMode';
import { publicAxios } from '../../axiosInstance';
import validateEmail from '../../helpers/emailValidator';
// import showNotification from '../../components/extras/showNotification';
import useToasterNotification from '../../hooks/shared/useToasterNotification';
// import lottie from '../../assets/Lottie/Fogwatch Lottie.json';
import lottie from '../../assets/Lottie/FOGwatch Lottie.json'

import AnimatedText from '../../components/CustomComponent/AnimatedText';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';


const CreateOrganizaton = () => {
	const { darkModeStatus } = useDarkMode();
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [singUpStatus] = useState();
	const { showErrorNotification, showNotification } = useToasterNotification();
	const navigate = useNavigate()

	const handleFormSubmit = (formData) => {

		const payload = {
			"name": formData.organizationName,
			"address": formData.organizationAddress,
			"contact_email": formData.organizationEmail,
			"contact_phone": formData.organizationPhone,
			"user": {
				"email": formData.email,
				"first_name": formData.firstName,
				"last_name": formData.lastName,
				"phone": formData.phone,
				"password": formData.newPassword
			}
		}
		setWaitingForAxios(true);
		const url = '/organization/setup/';
		publicAxios
			.post(url, payload)
			.then((res) => {
				setWaitingForAxios(false);
				showNotification('Success', res.data.message, 'success');
				navigate('/login');
			})
			.catch((error) => {
				setWaitingForAxios(false);
				showErrorNotification(error)
			});
	};

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			email: '',
			lastName: '',
			firstName: '',
			phone: '',
			organizationName: '',
			organizationEmail: '',
			organizationPhone: '',
			organizationAddress: '',
			organizationCity: '',
			organizationState: '',
			organizationZip: '',
			organizationCountry: '',
			newPassword: '',
			confirmPassword: '',
		},
		validate: (values) => {
			const errors: any = {};
			const emailError = validateEmail(values.email);
			const orgEmailError = validateEmail(values.organizationEmail);

			if (!values.email) {
				errors.email = 'Email is required';
			}
			if (!values.organizationName) {
				errors.organizationName = 'Organization name is required';
			}
			// if (!values.organizationAddress) {
			// 	errors.organizationAddress = 'Organization address is required';
			// }
			if (!values.organizationPhone) {
				errors.organizationPhone = 'Organization phone is required';
			}
			if (!values.organizationPhone.match(/^\+?[1-9]\d{1,14}$/)) {
				errors.organizationPhone = 'Invalid phone number';
			}
			if (!values.organizationEmail) {
				errors.organizationEmail = 'Organization email is required';
			}
			if (!values.firstName) {
				errors.firstName = 'First name is required';
			}
			if (!values.lastName) {
				errors.lastName = 'Last name is required';
			}
			if (!values.email) {
				errors.email = 'Email is required';
			}
			if (!values.phone) {
				errors.phone = 'Phone number is required';
			}
			if (values.phone && !values.phone.match(/^\+?[1-9]\d{1,14}$/)) {
				errors.phone = 'Invalid phone number';
			}


			if (!values.newPassword) {
				errors.newPassword = 'Password is required';
			} else {
				const re = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/;
				const isOk = re.test(values.newPassword);
				if (!isOk) {
					errors.newPassword =
						'The password should contain minimum 8 and maximum 15 characters with a mix of alphanumeric, at least 1 uppercase letter, and special characters.';
				}
			}

			if (!values.confirmPassword) {
				errors.confirmPassword = 'Confirm password is required';
			} else if (
				values.confirmPassword !== values.newPassword
			) {
				errors.confirmPassword = 'Passwords do not match';
			}

			if (emailError) {
				errors.email = emailError;
			}
			if (orgEmailError) {
				errors.organizationEmail = orgEmailError;
			}

			return errors;
		},
		onSubmit: (values) => {
			// console.log(values)
			handleFormSubmit(values)
		},
	});



	return (
		<PageWrapper
			isProtected={false}
			title='Create Organizaton'
			className={classNames({ 'bg-dark': !singUpStatus, 'bg-light': singUpStatus })}>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='shadow-3d-dark' data-tour='login-page'>
							<CardBody>
								<div className='text-center'>
									<Link
										to='#'
										className={classNames(
											'text-decoration-none  fw-bold display-2',
											{
												'text-dark': !darkModeStatus,
												'text-light': darkModeStatus,
											},
										)}
										aria-label='Facit'>
										<Player
											src={lottie}
											autoplay
											keepLastFrame
											style={{ width: 400, height: 140, marginTop: '-25px' }}
										/>
									</Link>
								</div>
								<div
									className={classNames('rounded-3', {
										'bg-l10-dark': !darkModeStatus,
										'bg-dark': darkModeStatus,
									})}
								/>
								<div className='text-center h5 fw-bold mt-3 mb-3'>
									<AnimatedText
										text={`Welcome to ${import.meta.env.VITE_SITE_NAME}`}
										className="h5 fw-bold"
									/>
								</div>
								<div className='text-center h5 text-muted mb-5 mt-0'>
									<AnimatedText
										text='This system is not yet activated.To begin, please create  the organization to activate the platform!'
										className="h6 text-muted"
										delay={0.5}
									/>
								</div>
								<form className='row g-4 mb-4' onSubmit={formik.handleSubmit}>
									<div className='col-12'>
										<FormGroup
											id='organizationName'
											isFloating
											label='Organization Name'
										// className={classNames({
										// 	'd-none': signInPassword,
										// })}
										>
											<Input
												autoComplete='organizationName'
												value={formik.values.organizationName}
												isTouched={formik.touched.organizationName}
												invalidFeedback={formik.errors.organizationName}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												onFocus={() => {
													formik.setErrors({});
												}}
											/>
										</FormGroup>
										<br />

										<FormGroup
											id='organizationAddress'
											isFloating
											label='Organization Address'
										>
											<textarea
												value={formik.values.organizationAddress}
												className='form-control'
												rows={10}
												cols={3}
												// @ts-ignore
												// isTouched={formik.touched.organizationAddress}
												// invalidFeedback={formik.errors.organizationAddress}
												// isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												onFocus={() => {
													formik.setErrors({});
												}}
											/>
										</FormGroup>
										<br />
										<FormGroup id='organizationPhone' isFloating label='Organization Contact No'>
											<Input
												// type='password'
												// autoComplete='new-password'
												value={formik.values.organizationPhone}
												isTouched={formik.touched.organizationPhone}
												invalidFeedback={formik.errors.organizationPhone}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</FormGroup>

										<br />
										<FormGroup id='organizationEmail' isFloating label='Organization Email'>
											<Input
												// type='password'
												// autoComplete='new-password'
												value={formik.values.organizationEmail}
												isTouched={formik.touched.organizationEmail}
												invalidFeedback={formik.errors.organizationEmail}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</FormGroup>

									</div>
									<Row xl={12} className='mt-4'>
										<div className='col-6'>
											<FormGroup
												id='firstName'
												isFloating
												label='First Name'
											// className={classNames({
											// 	'd-none': signInPassword,
											// })}
											>
												<Input
													autoComplete='firstName'
													value={formik.values.firstName}
													isTouched={formik.touched.firstName}
													invalidFeedback={formik.errors.firstName}
													isValid={formik.isValid}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													onFocus={() => {
														formik.setErrors({});
													}}
												/>
											</FormGroup>
										</div>
										<div className='col-6'>
											<FormGroup
												id='lastName'
												isFloating
												label='Last Name'
											// className={classNames({
											// 	'd-none': signInPassword,
											// })}
											>
												<Input
													autoComplete='lastName'
													value={formik.values.lastName}
													isTouched={formik.touched.lastName}
													invalidFeedback={formik.errors.lastName}
													isValid={formik.isValid}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													onFocus={() => {
														formik.setErrors({});
													}}
												/>
											</FormGroup>
										</div>
									</Row>

									<div className='col-12'>
										<FormGroup
											id='email'
											isFloating
											label='Email'
										// className={classNames({
										// 	'd-none': signInPassword,
										// })}
										>
											<Input
												type='email'
												autoComplete='email'
												value={formik.values.email}
												isTouched={formik.touched.email}
												invalidFeedback={formik.errors.email}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												onFocus={() => {
													formik.setErrors({});
												}}
											/>
										</FormGroup>
									</div>
									<div className='col-12'>
										<FormGroup
											id='phone'
											isFloating
											label='Phone Number'
										>
											<Input
												autoComplete='phone'
												value={formik.values.phone}
												isTouched={formik.touched.phone}
												invalidFeedback={formik.errors.phone}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												onFocus={() => {
													formik.setErrors({});
												}}
											/>
										</FormGroup>
									</div>
									<div className='col-12'>
										<FormGroup id='newPassword' isFloating label='Password'>
											<Input
												type='password'
												autoComplete='new-password'
												value={formik.values.newPassword}
												isTouched={formik.touched.newPassword}
												invalidFeedback={formik.errors.newPassword}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</FormGroup>

										<br />
										<FormGroup
											id='confirmPassword'
											isFloating
											label='Confirm Password'>
											<Input
												type='password'
												autoComplete='new-password'
												value={formik.values.confirmPassword}
												isTouched={formik.touched.confirmPassword}
												invalidFeedback={formik.errors.confirmPassword}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</FormGroup>
									</div>
									<div className={`col-12`}>
										<Button
											color='primary'
											className='w-100 py-3'
											type='submit'>
											{waitingForAxios ? <Spinner size='sm' /> : 'Create Organization'}
										</Button>
									</div>

								</form>
							</CardBody>
						</Card>

					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};
/* eslint-disable react/forbid-prop-types */
CreateOrganizaton.propTypes = {
};
/* eslint-enable react/forbid-prop-types */
export default CreateOrganizaton;

