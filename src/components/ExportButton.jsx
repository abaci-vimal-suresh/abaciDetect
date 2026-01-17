import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from './bootstrap/Modal';
import Button from './bootstrap/Button';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from './bootstrap/Dropdown';
import Error from '../helpers/Error';
import showNotification from './extras/showNotification';
import useDarkMode from '../hooks/useDarkMode';
import { authAxios } from '../axiosInstance';
import Spinner from './bootstrap/Spinner';
import { setExportReport } from '../store/notifications';
import fileDownloader from '../helpers/FileDownloader';
import AuthContext from '../contexts/authContext';

const messages =
	'The processing of your report is currently queued. It will be addressed as promptly as possible.';
const successMessage =
	'Your report is ready to download . Please click the Download button to download ! ';

const ExportButton = ({ url, hiddenColumnsKey }) => {
	// console.log(url)
	const { setLogOut } = useContext(AuthContext);

	const dispatch = useDispatch();
	const { darkModeStatus } = useDarkMode();
	const [uniqueId] = useState(`${Date.now()}${Math.random()}`);
	const [isExportReportModal, setIsExportModal] = useState(false);
	// @ts-ignore
	const Report = useSelector((state) => state.NotificationSlice.export_report);

	useEffect(() => {
		if (isExportReportModal) {
			localStorage.setItem('unique_id', uniqueId);
		}

		return () => {
			localStorage.removeItem('unique_id');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isExportReportModal]);

	const handleExport = (report) => {
		setIsExportModal(true);
		// const exportUrl = url + report + `&excluded_columns=${localStorage.getItem(hiddenColumnsKey)}`;
		const exportUrl = `${url.current}&${report}&excluded_columns=${localStorage.getItem(hiddenColumnsKey)}&unique_id=${uniqueId}`;
		authAxios
			.get(exportUrl)
			.then(() => {})
			.catch((error) => {
				const errorMsg = Error(error, setLogOut);
				showNotification('Error', errorMsg, 'danger');
			});
	};

	useEffect(() => {
		if (!isExportReportModal) {
			dispatch(setExportReport(null));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isExportReportModal]);

	return (
		<>
			<Dropdown >
				<DropdownToggle>
					<Button icon='Download' color={darkModeStatus ? 'light' : 'dark'} isLight>
						Export
					</Button>
				</DropdownToggle>
				<DropdownMenu>
					<DropdownItem onClick={() => handleExport('report=pdf')}>
						Export PDF
					</DropdownItem>
					<DropdownItem onClick={() => handleExport('report=csv')}>
						Export CSV
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
			{isExportReportModal && (
                // @ts-ignore
				<Modal isOpen={isExportReportModal} setIsOpen={setIsExportModal} size='md'>
					<ModalHeader className='p-4' setIsOpen={setIsExportModal}>
						<ModalTitle id='export_report_modal_title'>
							Export report {Report === null && <Spinner isSmall color='success' />}
						</ModalTitle>
					</ModalHeader>
					<ModalBody className='px-5 pb-2 d-flex flex-column gap-1 '>
						{Report === null ? messages : successMessage}
					</ModalBody>
					<ModalFooter className='px-4 pb-4'>
						{Report !== null && (
							<Button
								icon='Download'
								style={{ marginRight: '20px' }}
								color={darkModeStatus ? 'light' : 'dark'}
								isLight
								onClick={() => {
									fileDownloader(Report?.url, 'reports');
									setIsExportModal(false);
								}}>
								Download
							</Button>
						)}
					</ModalFooter>
				</Modal>
			)}
		</>
	);
};
/* eslint-disable react/forbid-prop-types */
ExportButton.propTypes = {
	url: PropTypes.any.isRequired,
	hiddenColumnsKey: PropTypes.any.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default ExportButton;
