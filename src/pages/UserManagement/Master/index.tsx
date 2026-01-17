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
import RoleList from'./RolesList'


const Index = () => {

    const { id } = useParams();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState<any>("Designation");
    const [isFetching, setIsFetching] = useState(false);
    const UserData = useSelector((state: any) => state.UserSlice.user_details)
    const { showErrorNotification } = useToasterNotification();

    const tabsData = [
           { name: 'Roles', icon: 'Badge' },
        { name: 'Designation', icon: 'Contacts' },
    ];
    const tabComponents: any = {
        'Roles': <RoleList />,
        'Designation': <></>,
    };
    // useEffect(() => {
    //     const url = `api/users/accounts/${id}`
    //     authAxios.get(url)
    //         .then((res) => {
    //             setIsFetching(false)
    //             dispatch(setUserDetails(res.data))
    //         })
    //         .catch((err) => {
    //             setIsFetching(false)
    //             showErrorNotification(err)

    //         })
    // }, [])

    useEffect(() => {
        return () => {
            dispatch(setUserDetails(null))
        }
    }, [])

    if (isFetching) {
        return <AbaciLoader />
    }
    return (
        <PageWrapper title='Users Master'>
            <SubHeader>
                <SubHeaderLeft>
                    <BackButton />
                    <SubheaderSeparator />
                    
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row h-100'>
                    <div className='col-xxl-3 col-xl-4 col-lg-6'>
                        <Card stretch borderSize={2}>
                            <CardHeader>
                                <CardLabel icon='DynamicFeed' iconColor='primary'>
                                    <CardTitle tag='div' className='h5'>
                                       Master 
                                    </CardTitle>
                                    {/* <CardSubTitle tag='div' className='h6'>
                                        Manage users master data here
                                    </CardSubTitle> */}
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
                            
                        </Card>
                    </div>
                    <div className='col-xxl-9 col-xl-8 col-lg-6' style={{ height: "82vh" }}>
                        {tabComponents[activeTab]}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default Index;