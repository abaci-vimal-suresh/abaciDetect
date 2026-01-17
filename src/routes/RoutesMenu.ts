export const allRoutesObject = {
	dashboard: {
		id: 'dashboard',
		text: 'Dashboard',
		path: '/',
		icon: 'Dashboard',
		subMenu: null,
	},
	usermanagement: {
		id: 'usermanagement',
		text: 'User Management',
		icon: 'Person',
		path: '/users',
		subMenu: null,
	}
};

import { time } from 'console';
import { haloMenu } from '../haloMenu';

export const UserRoutes = {
	dashboard: {
		id: 'dashboard',
		text: 'Home',
		path: '/',
		icon: 'Home',
		subMenu: null,
	},
};

export const AdminRoutes = {
	// dashboard: {
	// 	id: 'dashboard',
	// 	text: 'Dashboard',
	// 	path: '/',
	// 	icon: 'Dashboard',
	// 	subMenu: null,
	// },
	// usermanagement: {
	// 	id: 'usermanagement',
	// 	text: 'User Management',
	// 	icon: 'Person',
	// 	path: '/users',
	// 	subMenu: null,
	// },
	haloDashboard: haloMenu.dashboard,
	haloSensors: haloMenu.sensors,
	monitoring: haloMenu.monitoring,
	alerts: haloMenu.alerts,
	privacy: haloMenu.privacy,
	// settings: haloMenu.settings,
	timetravel: haloMenu.timetravel,

};

export const pagesNotInSideBar = {
	Profile: {
		id: 'Profile',
		text: 'Profile',
		path: 'profile',
		icon: 'Login',
	},


	login: {
		id: 'login',
		text: 'Login',
		path: 'login',
		icon: 'Login',
	},
	Register: {
		id: 'Register',
		text: 'Login',
		path: 'public/activation/:string',
		icon: 'Login',
	},
	ForgotPassword: {
		id: 'ForgotPassword',
		text: 'ForgotPassword',
		path: 'public/forgotpassword',
		icon: 'Login',
	},

	PrivacyPolicy: {
		id: 'Privacy Policy',
		text: 'Privacy Policy',
		path: 'public/privacypolicy',
		icon: 'Login',
	},

	TermsAndConditions: {
		id: 'Terms & Conditions',
		text: 'Terms & Conditions',
		path: 'public/termsofuse',
		icon: '',
	},

};
