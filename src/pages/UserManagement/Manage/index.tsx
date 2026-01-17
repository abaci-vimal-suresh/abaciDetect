import { useEffect, useRef, useState } from 'react';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SearchComponent from '../../../components/SearchComponent';
import AddButton from '../../../components/CustomComponent/Buttons/AddButton';
import { IconButton } from '@mui/material';
import Icon from '../../../components/icon/Icon';
import UserCardView from './UserCardView';
import UserListView from './UserListView';
import UserManagmentFilter from '../../../components/CustomComponent/Filters/UserManagmentFilter';

const Index = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [addModalShow, setAddModalShow] = useState(false);
	const [filterParams, setFilterParams] = useState('');
	const tableRef = useRef<any>(null);
	const [viewType, setViewType] = useState(localStorage.getItem('userManagementViewType') || 'list');

	const searchHandler = (search: any) => {
		setSearchTerm(search);
	};

	const handleViewType = () => {
		setViewType(viewType === 'card' ? 'list' : 'card');
		window.localStorage.setItem('userManagementViewType', viewType === 'card' ? 'list' : 'card');
	}
	useEffect(() => {
		const viewType = window.localStorage.getItem('userManagementViewType');
		if (viewType) {
			setViewType(viewType);
		}
	}, [])

	useEffect(() => {
		if(filterParams && viewType === 'list'){
			tableRef.current.onQueryChange();
		}
	}, [filterParams]);

	const onFilterHandler = (values: any) => {
		setFilterParams(values);
	}

	return (
		<PageWrapper title='User Management'>
			<SubHeader>
				<SubHeaderLeft>
					{viewType === 'card' &&<SearchComponent handleChange={searchHandler} />}
					
				</SubHeaderLeft>
				<SubHeaderRight>
				<UserManagmentFilter onFilterHandler={onFilterHandler} />
				<IconButton onClick={() => handleViewType()}>
						<Icon
							icon={`${viewType === 'card' ? 'FormatListBulleted' : 'GridView'}`}
							color='primary'
						/>
						
					</IconButton>
				<AddButton 
						name='Add New' modalShow={setAddModalShow} />
				</SubHeaderRight>
			</SubHeader>
			{viewType === 'card' ? 
				<UserCardView 
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				addModalShow={addModalShow}
				setAddModalShow={setAddModalShow}
				filterParams={filterParams}
				setFilterParams={setFilterParams} /> 
				: 
				<UserListView 
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					addModalShow={addModalShow}
					setAddModalShow={setAddModalShow}
					filterParams={filterParams}
					tableRef={tableRef} />}
		</PageWrapper>
	);
};

export default Index;