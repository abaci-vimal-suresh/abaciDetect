import React, { useMemo, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import { authAxios } from '../../../axiosInstance';
import { statusColorCodes, userTypes } from '../../../helpers/constants';
import useTablestyle from '../../../hooks/shared/useTablestyles';
import StatusButton from '../../CustomComponent/Buttons/StatusButton';
import EditButton from '../../CustomComponent/Buttons/EditButton';
import CustomBadge from '../../CustomComponent/CustomBadge';
import { formatFilters } from '../../../helpers/functions';
import useToasterNotification from '../../../hooks/shared/useToasterNotification';
import ResendButton from '../../CustomComponent/Buttons/ResendButton';
import usePermissionHook from '../../../hooks/userPermissionHook';

const UserManagementTableComponent = (props) => {
	const { tableRef, editModalToggle, urlBackup } = props;
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [pageSize, setPageSize] = useState(5);
	const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();
	const isSuperUser = usePermissionHook('is_super_user');


	const staticColumns = [
		{
			title: 'Name',
			field: 'full_name',
			render: (rowData) => (rowData?.full_name ? rowData.full_name : '----'),
		},

		{
			title: 'Email',
			field: 'email',
			render: (rowData) => (rowData?.email ? rowData.email : '----'),
		},

		{
			title: 'Contact number',
			field: 'contact_number',
			render: (rowData) => (rowData?.contact_number ? rowData.contact_number : '----'),
		},
		{
			title: 'User type',
			field: 'user_type',
			render: (rowData) => rowData?.user_type ? userTypes[rowData.user_type] : '----',
		},

		{
			title: 'Status',
			field: 'status',
			render: (rowData) =>
				rowData?.status ? (
					<CustomBadge color={statusColorCodes[rowData?.status]}>
						{rowData?.status}
					</CustomBadge>
				) : (
					'----'
				),
		},
	];

	const actionButtons = [
		{
			title: 'Actions',
			align: 'right',
			removable: false,
			sorting: false,
			grouping: false,
			filtering: false,
			render: (rowData) => (
				<div className='d-flex gap-1 justify-content-end'>
					{rowData?.status !== 'Invited' && (
						<StatusButton
							status={rowData.status}
							fieldKey='status'
							tableRef={tableRef}
							api={`api/users/manage_user/${rowData.id}`}
						/>
					)}

					{rowData?.status === 'Invited' && (
						<ResendButton id={rowData.id} />
					)}
					<EditButton modalShow={editModalToggle} id={rowData.id} />
				</div>
			),
		},
	];

	const columns = useMemo(() => {
		return [...staticColumns, ...actionButtons];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);



	return (
		<div
			style={{
				overflowY: 'auto',
			}}>
			<ThemeProvider theme={theme}>
				<MaterialTable
					title=' '
					// @ts-ignore
					columns={columns}
					tableRef={tableRef}
					onChangeRowsPerPage={setPageSize}
					onRowClick={(event, rowData) => rowData.status !== "Deleted" && editModalToggle(rowData.id)}
					localization={{
						pagination: {
							labelRowsPerPage: '',
						}
					}}
					// data={(query) => {
					// 	return new Promise((resolve, reject) => {
					// 		let orderBy = '';
					// 		let usersList = 'Admin,User,Assistant User';
					// 		const otherFilters = formatFilters(query.filters);
					// 		if (query.orderBy) {
					// 			orderBy =
					// 				query.orderDirection === 'asc'
					// 					? `&ordering=-${query.orderBy?.field}`
					// 					: `&ordering=${query.orderBy?.field}`;
					// 		}
					//          if(isSuperUser){
					// 			usersList='Admin,User,Superuser,Assistant User'
					// 		 }
					// 		 const url=''
					// 		// const url = `api/users/user_list_create?limit=${
					// 		// 	query.pageSize
					// 		// }&offset=${query.pageSize * query.page}&search=${query.search}${orderBy}&user_type__in=${usersList}&${otherFilters}`;
					// 		urlBackup.current = url;
					// 		authAxios
					// 			.get(url)
					// 			.then((response) => {
					// 				const userList = response.data?.results;
					// 				resolve({
					// 					data: userList,
					// 					page: query.page,
					// 					totalCount: response.data?.count,
					// 				});
					// 			})
					// 			.catch((error) => {
					// 				showErrorNotification(error);
					// 				// eslint-disable-next-line prefer-promise-reject-errors
					// 				reject({
					// 					data: [],
					// 					page: query.page,
					// 					totalCount: 0,
					// 				});
					// 			});
					// 	});
					// }}
					data={[]}
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
					options={{
						headerStyle: headerStyles(),
						rowStyle: rowStyles(),
						searchFieldStyle: searchFieldStyle(),
						actionsColumnIndex: -1,
						debounceInterval: 500,
						filtering: filterEnabled,
						search: true,
						pageSize,
					}}
				/>
			</ThemeProvider>
		</div>
	);
};
/* eslint-disable react/forbid-prop-types */
UserManagementTableComponent.propTypes = {
	tableRef: PropTypes.object.isRequired,
	editModalToggle: PropTypes.func.isRequired,
	urlBackup: PropTypes.object.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default UserManagementTableComponent;

