import axios from 'axios';
import { baseURL } from './helpers/baseURL';
import Cookies from 'js-cookie';
import { AxiosTimeout } from './helpers/constants';


const commonConfig = {
	baseURL,
	timeout: AxiosTimeout,
	withCredentials: true,
};


export const publicAxios = axios.create({
	...commonConfig,
	headers: {
		'Content-Type': 'application/json',
		accept: 'application/json',
	},
});


export const publicAxiosFileUpload = axios.create({
	...commonConfig,
	headers: {
		'Content-Type': 'multipart/form-data',
		accept: 'application/json',
	},
});


const authAxios = axios.create({
	...commonConfig,
	headers: {
		'Content-Type': 'application/json',
		accept: 'application/json',
	},
});


const authAxiosForCSV = axios.create({
	...commonConfig,
	responseType: 'blob',
});


const authAxiosFileUpload = axios.create({
	...commonConfig,
	headers: {
		'Content-Type': 'multipart/form-data',
		accept: 'application/json',
	},
});

export const updateToken = (newToken) => {
	if (newToken) {
		authAxios.defaults.headers.Authorization = `Bearer ${newToken}`;
		authAxiosFileUpload.defaults.headers.Authorization = `Bearer ${newToken}`;
	}
};

// Request interceptor to ensure token is always present if cookie exists
const addTokenInterceptor = (instance) => {
	instance.interceptors.request.use((config) => {
		const tokenFromCookie = Cookies.get('token');
		if (tokenFromCookie && !config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${tokenFromCookie}`;
		}
		return config;
	});
};

addTokenInterceptor(authAxios);
addTokenInterceptor(authAxiosFileUpload);

export const setInitialToken = () => {
	authAxios.defaults.baseURL = baseURL;
	authAxiosFileUpload.defaults.baseURL = baseURL;
};

setInitialToken();

export { authAxios, authAxiosFileUpload, authAxiosForCSV };
