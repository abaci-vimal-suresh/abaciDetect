import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios } from '../../../axiosInstance';
import OffCanvasComponent from '../../OffCanvasComponent';
import Card, { CardBody } from '../../bootstrap/Card';
import useErrorHandler from '../../../hooks/useErrorHandler';
import SaveButton from '../../CustomComponent/Buttons/SaveButton';
import UserFields from './UserFields';
import useToasterNotification from '../../../hooks/useToasterNotification';

const AddUsers = ({ isOpen, setIsOpen, tableRef, title }) => {
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm();

	const { showNotification } = useToasterNotification();
	const { handleError } = useErrorHandler();
	const [waitingForAxios, setwaitingForAxios] = useState(false);

	const onSubmit = (data) => {
		setwaitingForAxios(true);
		const url = 'api/users/user_list_create';
		authAxios
			.post(url, data)
			.then(() => {
				setwaitingForAxios(false);
				tableRef.current.onQueryChange();
				setIsOpen(false);
			})
			.catch((err) => {
				setwaitingForAxios(false);
				showNotification('Error', handleError(err), 'danger');
			});
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title={title} setOpen={setIsOpen}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
					<CardBody>
						<UserFields register={register} errors={errors} watch={watch} />
						<div className='row m-0'>
							<div className='col-12 p-3'>
								<SaveButton state={waitingForAxios} />
							</div>
						</div>
					</CardBody>
				</Card>
			</Form>
		</OffCanvasComponent>
	);
};

/* eslint-disable react/forbid-prop-types */
AddUsers.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default AddUsers;
