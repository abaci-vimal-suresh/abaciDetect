const baseURLFunc = () => {
	const url = window.location.origin.split(':3000')[0];
	// console.log(url)
	// console.log(import.meta.env);
	if (import.meta.env.MODE === 'development') {
		return `${url}:8000/api`;
	}
	return `${url}/api`;
};

// export const baseURL = baseURLFunc();


export const baseURL = 'http://192.168.1.171:8002/api'; // Your backend URL

const imageURLFunc = () => {
	const url = window.location.origin.split(':3000')[0];
	if (import.meta.env.MODE === 'development') {
		return `${url}:8000`;
	}
	return url;
};
export const imageURL = imageURLFunc();
// export const baseURL = 'https://envirol.abacitechs.com'
// export const baseURL = window.location.origin

const baseURLCreator = () => {
	const url = window.location.origin.split(':3000')[0];
	if (import.meta.env.MODE === 'development') {
		return `${url}:3000`;
	}
	return url;
};

export const baseURLForFrontend = baseURLCreator();

const baseURLForSocketIO = () => {
	const url = window.location.origin.split(':3000')[0];
	if (import.meta.env.MODE === 'development') {
		// Fallback to the known backend port if env var is missing
		return import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO;
	}
	return url;
};
export const wsUrl = baseURLForSocketIO();
