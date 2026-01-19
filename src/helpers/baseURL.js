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


export const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://111.92.105.222:8081/api'; // Fallback to hardcoded if env missing

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
		return `${url}:8080`;
	}
	return url;
};

export const baseURLForFrontend = baseURLCreator();

const baseURLForSocketIO = () => {
	// Prefer the explicit env var for socket IO
	if (import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO) {
		return import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO;
	}
	const url = window.location.origin.split(':3000')[0];
	if (import.meta.env.MODE === 'development') {
		// Fallback to the known backend port if env var is missing
		return import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO || 'http://111.92.105.222:8081';
	}
	return url;
};
export const wsUrl = baseURLForSocketIO();
