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
	// This seems to be used for something else, keeping logic consistent or derived from base
	const url = new URL(baseURL);
	return `${url.protocol}//${url.hostname}:8080`; // Keeping original port logic if needed, or maybe this should be same as backend?
	// The original code had :8080 for dev, but let's stick to what we know works which is the 8081 backend usually.
	// However, looking at the original code: 
	// if dev -> :8080
	// else -> window.location.origin
	// It's unclear what this is used for vs baseURL. 
	// Let's assume it should match the main backend host for now to be safe, or leave as matches window origin if it's for frontend assets.
	// actually, let's look at usage. It's exported as baseURLForFrontend. 
	// If it's for frontend, window.location.origin is correct.
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
