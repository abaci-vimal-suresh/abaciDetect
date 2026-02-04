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


// import { time } from 'console';
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
	haloDashboard: haloMenu.dashboard,
	haloSensors: haloMenu.sensors,
	haloArea: haloMenu.area,
	// monitoring: haloMenu.monitoring,
	alerts: haloMenu.alerts,
	haloActions: haloMenu.actions,
	privacy: haloMenu.privacy,
	users: haloMenu.users,
	timetravel: haloMenu.timetravel,
	reports: haloMenu.reports,
	autocad: haloMenu.autocad,
	threed: haloMenu.threed,
};

export const ViewerRoutes = {
	haloDashboard: haloMenu.dashboard,
	haloSensors: haloMenu.sensors,
	haloArea: haloMenu.area,
	monitoring: haloMenu.monitoring,
	alerts: {
		...haloMenu.alerts,
		subMenu: {
			history: (haloMenu.alerts.subMenu as any).history,
		},
	},
	timetravel: haloMenu.timetravel,
	reports: haloMenu.reports,
	haloActions: haloMenu.actions,
	autocad: haloMenu.autocad,
	threed: haloMenu.threed,
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
