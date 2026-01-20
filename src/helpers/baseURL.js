const baseURLFunc = () => {
	// Priority 1: Environment Variable (set in .env.development or .env.production)
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}
	// Priority 2: Hardcoded Production Fallback
	return 'http://111.92.105.222:8081/api';
};

export const baseURL = baseURLFunc();
console.log('BASE URL:', baseURL);

const imageURLFunc = () => {
	if (import.meta.env.VITE_API_BASE_URL) {
		const url = new URL(import.meta.env.VITE_API_BASE_URL);
		return `${url.protocol}//${url.hostname}:${url.port}`;
	}
	return 'http://111.92.105.222:8081';
};
export const imageURL = imageURLFunc();

const baseURLCreator = () => {
	return window.location.origin;
};

export const baseURLForFrontend = baseURLCreator();

const baseURLForSocketIO = () => {
	// Priority 1: Explicit Env Var
	if (import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO) {
		return import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO;
	}
	// Priority 2: Derived from Base URL logic (Hardcoded fallback)
	return 'http://111.92.105.222:8081';
};
export const wsUrl = baseURLForSocketIO();