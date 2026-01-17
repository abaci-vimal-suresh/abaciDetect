import { useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterListIcon from '@mui/icons-material/FilterList';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../hooks/shared/useTablestyles';
import useToasterNotification from '../../../hooks/shared/useToasterNotification';
import { authAxios } from '../../../axiosInstance';
import { updateHiddenColumnsInLocalStorage } from '../../../helpers/functions';
import ButtonWithTooltip from '../../../components/CustomComponent/Buttons/ButtonWithTooltip';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import { useDispatch } from 'react-redux';
import useSetHeaderAndBreadcrumbs from '../../../hooks/useSetHeaderAndBreadcrumbs';
import AddUser from './AddUser';
import CustomBadgeWithIcon from '../../../components/CustomComponent/BadgeWithIcon';
import useColumnHiding from '../../../hooks/shared/useColumnHiding';
import { generateQueryParams } from '../../../helpers/utils';
import Badge from '../../../components/bootstrap/Badge';
import Icon from '../../../components/icon/Icon';
import { partyTypeOptions } from '../../../helpers/constants';
import { exportData } from '../../../helpers/exportData';
import ThemeContext from '../../../contexts/themeContext';

const UserTableComponent = ({ tableRef, addModalShow, setAddModalShow, filterParams }: any) => {
	const [pageSize, setPageSize] = useState(5);
	const { showErrorNotification } = useToasterNotification();
	const [loading, setLoading] = useState(false);
	const [filterEnabled, setFilterEnabled] = useState(false);
	const navigate = useNavigate();
	const setHeaderAndBreadcrumbs = useSetHeaderAndBreadcrumbs();
	const dispatch = useDispatch();
	const totalRecordsCount = useRef(0);
	const urlBackup = useRef<string>('');
	
	// Add ref for table container
	const tableContainerRef = useRef<HTMLDivElement>(null);
	
	// Get fullscreen status from context
	const { fullScreenStatus } = useContext(ThemeContext);
	
	// Pass containerRef to useTablestyle when in fullscreen mode
	const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle(
		fullScreenStatus ? tableContainerRef : null
	);
			
	const staticColumns = [
		{
			title: 'Name',
			field: 'full_name',
		},
		{
			title: 'Email',
			field: 'email',
			render: (rowData: any) => {
				return rowData?.email || '----';
			},
		},
		{
			title: 'Party Type',
			field: 'party_type',
			render: (rowData: any) => {
				return <Badge
				isLight
				color='primary'
				className='px-3 py-2 mt-2'>
				<Icon
					icon={partyTypeOptions[rowData?.party_type]}
					size='lg'
					className='me-1'
				/>
				{rowData?.party_type || ''}
			</Badge>
			},
		},
		{
			title: 'Role',
			field: 'role',
			render: (rowData: any) => {
				return rowData?.role?.name || '----';
			},
		},
		{
			title: 'Contact Number',
			field: 'personal_contact_number',
			render: (rowData: any) => {
				return rowData?.personal_contact_number || '----';
			},
		},
		{
			title: 'Office Contact Number',
			field: 'office_contact_number',
			render: (rowData: any) => {
				return rowData?.office_contact_number || '----';
			},
		},
		{
			title: 'Alternate Email',
			field: 'alternate_email',
			render: (rowData: any) => {
				return rowData?.alternate_email || '----';
			},
		},
		{
			title: 'Status',
			field: 'status',
			render: (rowData: any) => {
				return <CustomBadgeWithIcon>{rowData?.status}</CustomBadgeWithIcon>;
			},
		},
	];




	const mockData = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    status: 'Active',
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    status: 'Inactive',
  },
  {
    id: 3,
    first_name: 'Robert',
    last_name: 'Brown',
    email: 'robert.brown@example.com',
    status: 'Active',
  },
];



	const actionButtons = [
		// {
		// 	title: 'Actions',
		// 	align: 'right' as 'right',
		// 	removable: false,
		// 	sorting: false,
		// 	grouping: false,
		// 	filtering: false,
		// 	render: (rowData: any) => (
		// 		<>
		// 			<div className='d-flex gap-2 justify-content-end'>
		// 				<ButtonWithTooltip
		// 					onClick={(e: any) => {
		// 						e.stopPropagation();
		// 						navigate(`/users/usermanagement/${rowData.id}`);
		// 					}}
		// 					name=''
		// 					icon='edit'
		// 					color='light'
		// 					size='sm'
		// 					TooltipTitle='Edit User'
		// 					placement='left'
		// 				/>
		// 				{/* <StatusButton
		// 					status={rowData?.status}
		// 					fieldKey='status'
		// 					tableRef={tableRef}
		// 					api={`api/users/update-user/${rowData?.id}/`}
		// 				/> */}
		// 				{/* <StatusButton
		// 					status={rowData?.status}
		// 					fieldKey='status'
		// 					tableRef={tableRef}
		// 					api={`/users/user/${rowData?.id}/update-active-status/`}
		// 					method='post'
		// 				/>
		// 				<DeleteButton
		// 					apiEndpoint={`/users/user/${rowData?.id}/`}
		// 					tableRef={tableRef}
		// 					text='Delete User'
		// 				/> */}
		// 			</div>
		// 		</>
		// 	),
		// },
	];
    const columns = useColumnHiding({
        oldValue: staticColumns,
        hiddenColumnArray: JSON.parse(localStorage.getItem('userManagementList')) || [],
        buttonArray:actionButtons
    });



	function handleAddUser(data: any) {
		tableRef.current.onQueryChange();
		setAddModalShow(false);
	}

	return (
		<>
		{addModalShow && <AddUser isOpen={addModalShow} setIsOpen={setAddModalShow} title='Add User' onSuccess={handleAddUser}/>}
		<Card className='mt-3'>
			<CardBody className='table-responsive'>
				<div 
					ref={tableContainerRef}
					className='material-table-wrapper' 
					style={{ 
						overflow: 'auto',
						position: fullScreenStatus ? 'relative' : 'static',
					}}
				>
					<ThemeProvider theme={theme}>
						<MaterialTable
							title=' '
							columns={columns}
							tableRef={tableRef}
							localization={{
								pagination: {
									labelRowsPerPage: '',
								}
							}}
							onRowsPerPageChange={(page) => setPageSize(page)}
							onRowClick={(event, rowData) => navigate(`/users/usermanagement/${rowData.id}`)}
							onChangeColumnHidden={(column, hidden) =>
								updateHiddenColumnsInLocalStorage(
									column,
									hidden,
									'userManagementList',
								)
							}
							data={mockData}
							options={{
								headerStyle: headerStyles(),
								rowStyle: rowStyles(),
								actionsColumnIndex: -1,
								debounceInterval: 500,
								filtering: filterEnabled,
								search: true,
								pageSize,
								columnsButton: true,
								searchFieldStyle: searchFieldStyle(),
								exportMenu:[{
									label: 'Export as CSV',
									exportFunc: () => exportData("csv",urlBackup.current,totalRecordsCount.current,'User List',JSON.parse(localStorage.getItem('userManagementList')) || [],columns)
								},
								]
							}}
							actions={[
								{
									icon: FilterListIcon,
									tooltip: filterEnabled ? 'Disable Filter' : 'Enable Filter',
									isFreeAction: true,
									onClick: () => {
										setFilterEnabled((state) => !state);
									},
								},
							]}
						/>
					</ThemeProvider>
				</div>
			</CardBody>
		</Card>
		</>
	);
};

export default UserTableComponent;
