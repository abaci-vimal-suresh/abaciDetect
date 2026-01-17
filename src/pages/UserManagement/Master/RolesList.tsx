import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../../components/bootstrap/Card';
import { authAxios } from '../../../axiosInstance';
import Error from '../../../helpers/Error';
import useDarkMode from '../../../hooks/shared/useDarkMode';
import RoleImage from '../../../assets/img/roles.png';
import Avatar from '../../../components/Avatar';
import InlineEditableField from '../../../components/CustomComponent/Fields/InlineEditableFiled'
import StatusButton from '../../../components/CustomComponent/Buttons/StatusButton';
import InfoIcon from '../../../components/CustomComponent/InfoIcon';
import Button from '../../../components/bootstrap/Button';
import classNames from 'classnames';

const RoleListItem: FC<any> = (props) => {
    const { darkModeStatus } = useDarkMode();
    const navigate = useNavigate();
    const onSuccess = () => {

    }

    return (
        <Card borderSize={2} className='col-6 ' style={{ height: "100px", boxShadow: '', marginBottom: "5px" }}>
            <div className='col-12 prevent-userselect '
                role="button"
                tabIndex={0} >
                <div className='row'>
                    <div className='col d-flex align-items-center'>
                        <div className='flex-shrink-0'>
                            {/* <div className='ratio ratio-1x1 me-3' style={{ width: 48, }}>
							<div
								className={classNames(
									'rounded-2',
									'd-flex align-items-center justify-content-center',
									{
										'bg-l10-dark': !darkModeStatus,
										'bg-l90-dark': darkModeStatus,
									},
								)}>
								<span className='fw-bold'>{props?.name && getFirstLetters(props?.name)}</span>
							</div>
						</div> */}
                            <div className='mt-4' style={{ marginRight: '10px' }}>
                                <Avatar
                                    src={RoleImage}
                                    srcSet={RoleImage}
                                    size={54}
                                />
                            </div>
                        </div>
                        <div className='mt-2'>
                            <InlineEditableField
                                initialValue={props?.name}
                                patchUrl=''
                                fieldKey=''
                                className=''
                                id=''
                                onSuccess={onSuccess}
                                type='h4'
                                styles={{ fontSize: '15px' }}
                            />

                        </div>
                    </div>
                    <div className='col-auto '>
                        <div style={{ marginTop: "30px", marginRight: "20px" }}>
                            <StatusButton
                                status="Active"
                                fieldKey='status'
                                tableRef={null}
                                api={`api/buildings/`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};




const RoleList = () => {
    const dispatch = useDispatch();
    const listRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(0);
    const [limit] = useState(5);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [roleList, setRoleList] = useState<any>(null);
    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = useCallback(async () => {
        if (!hasNextPage || isFetching) return;
        setIsFetching(true);

        try {
            // const response = await authAxios.get(`/api/vehicles/violation_vehicles?limit=${limit}&offset=${pageCount * limit}`);
            // const newVehicles = response.data.results;
            const response = await authAxios.get(`/users/roles/`);
            const newVehicles = response.data;
            if (roleList !== null) {
                setRoleList((prev) => [...prev, ...newVehicles]);

            } else {
                setRoleList(newVehicles);
            }
            setPageCount((prev) => prev + 1);
            setHasNextPage(newVehicles.length === limit);
        } catch (error) {
            const errorMsg = Error(error);
            // showNotification("Error", errorMsg, "danger");
        } finally {
            setIsFetching(false);
        }
    }, [hasNextPage, isFetching, limit, pageCount]);


    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                fetchVehicles();
            }
        }
    };


    useEffect(() => {
        if (listRef.current) {
            const { scrollHeight, clientHeight } = listRef.current;
            // If content is not scrollable yet, fetch more
            if (scrollHeight <= clientHeight && hasNextPage) {
                fetchVehicles();
            }
        }
    }, [roleList]); // runs whenever vehicle list changes

    return (
        <Card stretch borderSize={2} >
            <CardHeader>
                <CardLabel icon='Badge' iconColor='primary'>
                    <CardTitle tag='div' className='h5'>
                        Roles
                    </CardTitle>
                </CardLabel>
                {/* <CardActions >
                    <div  className='d-flex '>
                        <input
                    // ref={inputRef}
                    type='text'
                    // value={value}
                    // disabled={loading}
                    // onChange={(e) => setValue(e.target.value)}
                    // onBlur={handleBlurOrEnter}
                    // onKeyDown={handleKeyDown}
                    className={`inline-edit-input p `}

                    style={{width:"150px"}}
                />
                <Button
                        isOutline={false}
                        color='light'
                        isLight
                        size="sm"
                        className={classNames('text-nowrap', {
                            'border-light': false,
                        })}
                        icon='Save'
                        // onClick={onClick}
                        // onMouseEnter={() => setCurrentIcon("CustomRoute")}
                        // onMouseLeave={() => setCurrentIcon("CustomRouteDark")}
                        />
                    </div>
                </CardActions> */}
            </CardHeader >
            <CardBody isScrollable>
                <div
                    ref={listRef}
                    style={{
                        height: '65vh', // More reasonable height
                        overflowY: 'auto',
                        overflowX: "hidden",
                        width: '100%',
                        position: 'relative',
                        padding: '10px',
                    }}
                    onScroll={handleScroll}
                >
                    {/* <InfoIcon desc='Manage your roles here' /> */}
                    <div className='row row-cols-xxl-2 row-cols-lg-2 row-cols-md-2'>
                        {roleList === null ? (
                            <></>
                        ) : roleList.length === 0 ? (
                            // <NoDataComponent lottie={NoAccounts} description='N  accounts found'/>
                            <></>
                        ) : roleList?.map((item: any) => (
                            <RoleListItem key={item.id} {...item} />
                        ))}

                        {isFetching && roleList !== null && (
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
            </CardBody>
        </Card>

    );
};

export default RoleList;
