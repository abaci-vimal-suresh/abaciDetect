import React from 'react';
// import ReactDOM from 'react-dom'; // For React 17
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client'; // For React 18
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { v4 as uuidv4 } from 'uuid';
import './styles/styles.scss';
import App from './App/App';
import reportWebVitals from './reportWebVitals';
import { ThemeContextProvider } from './contexts/themeContext';
import { AuthContextProvider } from './contexts/authContext';
import './i18n';

import store from "./store";
import { setupAxiosInterceptors } from './config/axiosConfig';
import { queryClient } from './lib/queryClient';

// Polyfill crypto.randomUUID for non-secure contexts (HTTP)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
	Object.defineProperty(crypto, 'randomUUID', {
		value: () => uuidv4(),
		writable: true, // Allow overwriting if needed (though unlikely)
		configurable: true,
		enumerable: true,
	});
}


const children = (
	<QueryClientProvider client={queryClient}>
		<Provider store={store}>
			<Router>
				<AuthContextProvider>
					<ThemeContextProvider>
						{/* <React.StrictMode> */}
						<App />
						{/* </React.StrictMode> */}
					</ThemeContextProvider>
				</AuthContextProvider>
			</Router>
		</Provider>
	</QueryClientProvider>
);

const container = document.getElementById('root');

// ReactDOM.render(children, container); // For React 17
createRoot(container as Element).render(children); // For React 18

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


setupAxiosInterceptors();