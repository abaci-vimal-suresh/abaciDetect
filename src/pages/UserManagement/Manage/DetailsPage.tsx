import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubheaderSeparator } from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardFooter, CardFooterLeft, CardHeader, CardLabel, CardSubTitle, CardTitle } from '../../../components/bootstrap/Card';
import Page from '../../../layout/Page/Page';
import Button from '../../../components/bootstrap/Button';
import BackButton from '../../../components/CustomComponent/Buttons/BackButton';
import Avatar from '../../../components/Avatar';
import UserDetails from '../../../components/PageComponents/UserManagement/Details/UserDetails'
//@ts-ignore
import ProfilePic from "../../../assets/img/Avatar.svg"
import { setUserDetails } from '../../../store/user';
import DeleteButtonWithNavigation from '../../../components/CustomComponent/Buttons/DeleteButtonWithNavigation'
import AbaciLoader from '../../../components/AbaciLoader/AbaciLoader';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import urlMaker from '../../../helpers/UrlMaker';
import ActivateAndDeactivate from '../../../components/CustomComponent/Buttons/ActivateAndDeactivate';
import UserDocuments from '../../../components/PageComponents/UserManagement/Details/UserDocuments/UserDocuments';


const UserDetailsPage = () => {

    const { id } = useParams();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState<any>("User Details");
    const [isFetching, setIsFetching] = useState(true);
    const UserData = useSelector((state: any) => state.UserSlice.user_details)
    const { showErrorNotification } = useToasterNotification();

    const tabsData = [
        { name: 'User Details', icon: 'Contacts' },
        { name: 'User Documents', icon: 'AttachFile' },
    ];
    const tabComponents: any = {
        'User Details': <UserDetails />,
        'User Documents': <UserDocuments />,
    };
    useEffect(() => {
        const url = `users/user/${id}`
        authAxios.get(url)
            .then((res) => {
                setIsFetching(false)
                dispatch(setUserDetails(res.data))
            })
            .catch((err) => {
                setIsFetching(false)
                showErrorNotification(err)

            })
    }, [])

    useEffect(() => {
        return () => {
            dispatch(setUserDetails(null))
        }
    }, [])

    if (isFetching) {
        return <AbaciLoader />
    }
    const onSuccess = (data: any) => {
        dispatch(setUserDetails(data.data))
    }
    return (
        <PageWrapper title='User Details'>
            <SubHeader>
                <SubHeaderLeft>
                    <BackButton />
                    <SubheaderSeparator />
                    <Avatar srcSet='' src={UserData?.avatar_thumbnail ? UserData?.avatar_thumbnail : ProfilePic} size={32} />
                    <span>
                        <strong>{`${UserData?.first_name || ''} ${UserData?.last_name || ''}`}</strong>
                    </span>
                    {/* <span className='text-muted'>Edit User</span> */}
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row h-100'>
                    <div className='col-xxl-3 col-xl-4 col-lg-6'>
                        <Card stretch borderSize={2} style={{ maxHeight: '80vh' }}>
                            <CardHeader>
                                <CardLabel icon='Person' iconColor='primary'>
                                    <CardTitle tag='div' className='h5'>
                                        Account Settings
                                    </CardTitle>
                                    <CardSubTitle tag='div' className='h6'>
                                        Personal Information
                                    </CardSubTitle>
                                </CardLabel>
                            </CardHeader>
                            <CardBody >
                                <div className='row g-3' >
                                    {tabsData.map((tab) => (
                                        <div key={`${Date.now()}-${Math.random() * 1000}`} className='col-12'>
                                            <Button
                                                color="primary"
                                                className='w-100 p-3 '
                                                isLight={tab.name !== activeTab}
                                                icon={tab.icon}
                                                onClick={() => setActiveTab(tab.name)}>
                                                {tab.name}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                            <CardFooter>
                                <CardFooterLeft className='w-100'>
                                    <div className='d-flex gap-2 flex-column'>
                                    <ActivateAndDeactivate apiEndpoint={`/users/user/${id}/update-active-status/`} width='100%' height='45px'  onSuccess={onSuccess} status={UserData?.status} />
                                    <DeleteButtonWithNavigation apiEndpoint={`/users/user/${id}/`} route='/users/usermanagement' width='100%' height='45px' text='Delete User' />
                                    </div>
                                </CardFooterLeft>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className='col-xxl-9 col-xl-8 col-lg-6' >
                        {tabComponents[activeTab]}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default UserDetailsPage;