import React, { useState } from 'react';
import {  Form, Label, Spinner } from 'reactstrap';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../components/bootstrap/Modal';
import Button from '../../../components/bootstrap/Button';
import { authAxios } from '../../../axiosInstance';	
import useToasterNotification from '../../../hooks/shared/useToasterNotification';
import TimeZoneSelector from '../../CustomComponent/TimeZoneSelector';
import { t } from 'i18next';

const EditSettings = ({ isOpen, setIsOpen, title, item ,setAppsettings}) => {
	const { handleSubmit } = useForm();
	const [waitingForAxios, setWaitingForAxios] = useState(false);

	const [value, setValue] = useState(item?.value);
    const {showErrorNotification}=useToasterNotification();




	const onSubmit = () => {
		setWaitingForAxios(true);
		const url = `/region/app-settings/${item?.id}/`;
		const payload = {
			value: value.toString(),
			key: item?.key,
		}
		authAxios
			.patch(url, payload)
			.then((res) => {
				setWaitingForAxios(false);
				setIsOpen(false);
				setAppsettings((prev)=>prev.map((data)=>data.id===res.data.id?res.data:data))
			})
			.catch((err) => {
				setWaitingForAxios(false);
			showErrorNotification(err)
		});
	};

	const renderContent=()=> {


		// Default: render slider for numeric values
	
		if (item?.key === 'timezone' ) {
			return (
				<TimeZoneSelector value={item?.value} onChange={setValue} field_name='timezone' />
			);
		}
	
	}

	return (
		// @ts-ignore
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='md' isCentered>
			<ModalHeader className='p-4' setIsOpen={setIsOpen}>
				<ModalTitle id='editSettings'>{title}</ModalTitle>
			</ModalHeader>
			<ModalBody className='p-3'>
				<Form style={{ marginLeft: '20px',marginRight:"20px" }} onSubmit={handleSubmit(onSubmit)}>
					{renderContent()}
					<ModalFooter className='px-4 '>
						<>
							<Button
								color='danger'
								className='me-2'
								onClick={() => setIsOpen(false)}>
								Close
							</Button>
							
							<Button
								color='primary'
								onClick={() => handleSubmit(onSubmit)()}
								isDisable={waitingForAxios || (typeof value !== 'boolean' && !value)}>
								{waitingForAxios ? <Spinner size='sm' /> : 'Submit'}
							</Button>
						</>
					</ModalFooter>
				</Form>
			</ModalBody>
		</Modal>
	);
};
EditSettings.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	setAppsettings: PropTypes.func.isRequired,
	// Example adjustment for `item` prop to be more specific
	item: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
		PropTypes.object,
		// add other types as needed
	]),
};

// Providing default props for optional props
EditSettings.defaultProps = {
	item: null, // or a more suitable default value
};
export default EditSettings;

