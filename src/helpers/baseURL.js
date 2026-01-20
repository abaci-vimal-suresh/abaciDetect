const baseURLFunc = () => {
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}
	return 'http://111.92.105.222:8081/api';
};

export const baseURL = baseURLFunc();
console.log('BASE URL:', baseURL);

const imageURLFunc = () => {
	const apiUrl = import.meta.env.VITE_API_BASE_URL;
	if (apiUrl) {
		if (apiUrl.startsWith('http')) {
			try {
				const url = new URL(apiUrl);
				return `${url.protocol}//${url.hostname}:${url.port}`;
			} catch (e) {
				return apiUrl;
			}
		}
		// If relative path like /api, return current origin
		return window.location.origin;
	}
	return 'http://111.92.105.222:8081';
};
export const imageURL = imageURLFunc();

const baseURLCreator = () => {
	return window.location.origin;
};

export const baseURLForFrontend = baseURLCreator();

const baseURLForSocketIO = () => {
	if (import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO) {
		return import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO;
	}
	return 'http://111.92.105.222:8081';
};
export const wsUrl = baseURLForSocketIO();