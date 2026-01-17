import React from 'react';
import classNames from 'classnames';
import { useDispatch } from 'react-redux'
import Card, { CardBody } from '../../../bootstrap/Card';
import Button from '../../../bootstrap/Button';
import { useNavigate } from 'react-router-dom';
// import { setUserDetails } from '../../../store/user';
import ProfilePic from "../../../assets/img/11539820.png"
import { getFirstLetters } from '../../../../helpers/helpers';
import useDarkMode from '../../../../hooks/shared/useDarkMode';
import Icon from '../../../icon/Icon';
import Badge from '../../../bootstrap/Badge';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../../bootstrap/Dropdown';
import { badgeColorOptions, buttonColor } from '../../../../helpers/constants';
import { authAxios } from '../../../../axiosInstance';
import Swal from 'sweetalert2';
import useToasterNotification from '../../../../hooks/shared/useToasterNotification';
import { showConfirmationDialog } from '../../../../helpers/utils';

const DesignationCard = ({ designation_data, handleEdit, fetchData }: any) => {
	const navigate = useNavigate();
	const { darkModeStatus } = useDarkMode();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();
	const deleteDesignation = (designation_data: any) => {
		Swal.fire({
			title: 'Are you sure?',
			icon: 'info',
			text: "You won't be able to revert this!",
			showCancelButton: true,
			iconColor: buttonColor[0],
			confirmButtonColor: buttonColor[0],
			cancelButtonColor: buttonColor[1],
			confirmButtonText: 'Delete',
		}).then((result: any) => {
			if (result.isConfirmed) {
				const url = `/users/designations/${designation_data?.id}/`;
				authAxios
					.delete(url)
					.then(() => {
						showSuccessNotification('Designation deleted successfully');
						fetchData(true);
					})
					.catch((err) => showErrorNotification(err));
			}
		});
	}

	const handleStatusUpdate = async (id: number, status: string, message: string) => {
		const result = await showConfirmationDialog(
		  'Are you sure?',
		  message || '',
		  '',
		  'info',
		  `Yes, ${status === 'Active' ? 'Enable' : status === 'Disabled' ? 'Disable' : status === 'Deleted' ? 'Delete' : 'Recover'} it!`
		);
	
		if (result.isConfirmed) {
		  authAxios.post(`/users/designations/${id}/update-active-status/`, { status })	
		  .then((response) => {
			showSuccessNotification('Designation status updated successfully');
			fetchData(true);
		  })
		  .catch((err) => showErrorNotification(err));
		}
	  };

	return (
		<div className='col d-flex justify-content-center'>
			<Card
				borderSize={0}
				shadow='sm'
				style={{
					width: 240,
					transition: 'all 0.3s ease',
					cursor: 'pointer'
				}}
				className='hover-shadow-lg'
			>
				<CardBody className='p-4'>
					<div className='d-flex flex-column align-items-center position-relative'>
						{/* Dropdown at top right */}
						<div
							className='position-absolute top-0 end-0'
							
						>
							<Dropdown>
								<DropdownToggle hasIcon={false}>
									<Icon icon='MoreVert' size='lg' />
								</DropdownToggle>
								<DropdownMenu isAlignmentEnd>
									<DropdownItem>
										<Button icon='Edit' onClick={() => handleEdit(designation_data)}>Edit</Button>
									</DropdownItem>
									<DropdownItem isDivider />
									{designation_data?.is_deleted === false && (
									<DropdownItem>
										<Button icon='Delete' onClick={() => deleteDesignation(designation_data)}>Delete</Button>
									</DropdownItem>
									)}
									{!['Active'].includes(designation_data?.status) && (
                                        <DropdownItem>
                                          <Button
                                            icon='LockOpen'
                                            onClick={() => handleStatusUpdate(designation_data?.id, 'Active', 'Designation will be enabled')}
                                          >
                                            Activate
                                          </Button>
                                        </DropdownItem>
                                      )}

                                      {!['Disabled'].includes(designation_data?.status) && (
                                        <DropdownItem>
                                          <Button
                                            icon='Lock'
                                            onClick={() => handleStatusUpdate(designation_data?.id, 'Disabled', 'Designation will be disabled')}
                                          >
                                            Disable
                                          </Button>
                                        </DropdownItem>
                                      )}

								</DropdownMenu>
							</Dropdown>
						</div>

						{/* Avatar - Circular and larger */}
						<div
							className='ratio ratio-1x1 mb-4'
							style={{
								width: 100,
								transition: 'transform 0.3s ease'
							}}
						>
							<div
								className={classNames(
									'rounded-circle',
									'd-flex align-items-center justify-content-center',
									{
										'bg-l10-dark': !darkModeStatus,
										'bg-l90-dark': darkModeStatus,
									},
								)}
								style={{
									boxShadow: darkModeStatus
										? '0 4px 12px rgba(255, 255, 255, 0.1)'
										: '0 4px 12px rgba(0, 0, 0, 0.08)',
								}}
							>
								<span
									className='fw-bold'
									style={{
										fontSize: '32px',
										letterSpacing: '1px'
									}}
								>
									{designation_data?.name && getFirstLetters(designation_data?.name)}
								</span>
							</div>
						</div>

						{/* Designation Name - Better typography */}
						<div
							className='fw-bold text-center mb-3'
							style={{
								fontSize: '18px',
								lineHeight: '1.4',
								letterSpacing: '0.2px'
							}}
						>
							{designation_data?.name}
						</div>

						{/* Status */}
						<small className={`border border-${badgeColorOptions[designation_data?.is_deleted === true ? 'Deleted' : designation_data?.status]} border-2 text-${badgeColorOptions[designation_data?.is_deleted === true ? 'Deleted' : designation_data?.status]} fw-bold px-2 py-1 rounded-1 mb-2`}> 
							{designation_data?.is_deleted	 === true ? 'Deleted' : designation_data?.status }
						</small>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default DesignationCard;

