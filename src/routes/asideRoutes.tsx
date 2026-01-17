import React from 'react';
import { RouteProps } from 'react-router-dom';
import { pagesNotInSideBar } from './RoutesMenu';
import MainSidebar from '../layout/Aside/MainSidebar';

const asideRoutes: RouteProps[] = [
	{ path: pagesNotInSideBar.login.path, element: null },
	{ path: '/create-organization', element: null },
	{ path: pagesNotInSideBar.Register.path, element: null },
	{ path: pagesNotInSideBar.ForgotPassword.path, element: null },
	{ path: pagesNotInSideBar.PrivacyPolicy.path, element: null },
	{ path: pagesNotInSideBar.TermsAndConditions.path, element: null },
	{ path: '/public/error', element: null },
	{
		path: '*',
		element: <MainSidebar />,
	},
];

export default asideRoutes;
