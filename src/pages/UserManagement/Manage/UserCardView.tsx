import { useCallback, useEffect, useRef, useState } from 'react';
import { Spinner } from 'reactstrap';
import Page from '../../../layout/Page/Page';
import UserCard from '../../../components/PageComponents/UserManagement/UserCard';
import AbaciLoader from '../../../components/AbaciLoader/AbaciLoader';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/shared/useToasterNotification';
import AddUser from './AddUser';
import NoDataComponent from '../../../components/CustomComponent/NoDataComponent';
import NoAccounts from '../../../assets/Lottie/Noaccounts.json';

const UserCardView = ({	searchTerm, setSearchTerm, addModalShow, setAddModalShow, filterParams, setFilterParams }: any) => {
	const listRef = useRef<HTMLDivElement>(null);
	const [isFetching, setIsFetching] = useState(false);
	const [usersList, setUsersList] = useState<any[]>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [itemsPerPage] = useState(20);
	const abortControllerRef = useRef<AbortController | null>(null);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const { showErrorNotification } = useToasterNotification()

	// Debounced search effect
	useEffect(() => {
		// Clear any pending timeout
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		// Only search if searchTerm is not empty
		if (searchTerm !== '') {
			searchTimeoutRef.current = setTimeout(() => {
				fetchUsers(true);
			}, 500); // 500ms debounce delay
		} else {
			// If search term is empty, reset to initial data
			fetchUsers(true);
		}

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchTerm]);

	// Fetch more data when page changes
	useEffect(() => {
		if (currentPage > 1) {
			fetchUsers();
		}
	}, [currentPage]);

	useEffect(() => {
		if(filterParams){
		fetchUsers(true);
		}
	}, [filterParams]);

	const fetchUsers = useCallback(
		async (reset = false) => {
			if (isFetching) return;
			const page = reset ? 1 : currentPage;
			if (reset) {
				setCurrentPage(1);
			}
			// Cancel any pending request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			const controller = new AbortController();
			abortControllerRef.current = controller;
			setIsFetching(true);

			try {
				let query = `users/user?limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}&minimal=true`;

				if (searchTerm) {
					query += `&search=${searchTerm}`;
				}
				if (filterParams) {
					query += filterParams;
				}
				else{
					query += `&status=Active`;
				}

				const response = await authAxios.get(query, {
					signal: controller.signal,
				});

				if (reset) {
					setUsersList(response.data.results || []);
				} else {
					setUsersList((prev) => [...prev, ...(response.data.results || [])]);
				}

				// Calculate total pages based on count and itemsPerPage
				const totalCount = response.data.count || 0;
				const calculatedTotalPages = Math.ceil(totalCount / itemsPerPage);
				setTotalPages(calculatedTotalPages);
			} catch (error) {
				if (!controller.signal.aborted) {
					 showErrorNotification(error)
				}
			} finally {
				setIsFetching(false);
			}
		},
		[itemsPerPage, currentPage, searchTerm, isFetching, filterParams],
	);

	const handleScroll = useCallback(() => {
		if (!listRef.current || isFetching || currentPage >= totalPages) return;

		const { scrollTop, scrollHeight, clientHeight } = listRef.current;
		const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

		if (isNearBottom) {
			setCurrentPage((prev) => prev + 1);
		}
	}, [currentPage, totalPages]);

	useEffect(() => {
		const currentRef = listRef.current;
		if (currentRef) {
			currentRef.addEventListener('scroll', handleScroll);
			return () => currentRef.removeEventListener('scroll', handleScroll);
		}
	}, [handleScroll]);


	function handleAddUser(data: any) {
		setUsersList([...usersList, data]);
		setAddModalShow(false);
	}


	return (
		<>
		{addModalShow && <AddUser isOpen={addModalShow} setIsOpen={setAddModalShow} title='Add User' onSuccess={handleAddUser}/>}
			<Page container='fluid'>
				<div
					ref={listRef}
					style={{
						height: '80vh', // More reasonable height
						overflowY: 'auto',
						overflowX: "hidden",
						width: '100%',
						position: 'relative'
					}}
				>
					<div className='row row-cols-xxl-3 row-cols-lg-3 row-cols-md-2'>
						{usersList === null ? (
							<AbaciLoader />
						) : usersList.length === 0 ? (
							<div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center' }}>
							<NoDataComponent description='No users found' lottie={NoAccounts} />
							</div>
						) : usersList?.map((item: any) => (
							<UserCard key={item.id} user={item} />
						))}

						{isFetching && usersList !== null && (
							<div style={{
								display: "flex",
								justifyContent: "center",
								width: '100%',
								padding: '1rem'
							}}>
								<Spinner animation="grow" />
							</div>
						)}
					</div>
				</div>
			</Page>
		</>
	);
};

export default UserCardView;
