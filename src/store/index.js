import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import layoutSlice from './layout';
import authSlice from './auth';
import UserSlice from './user';
import UiSlice from './uiSlice';
import sensorEventsSlice from './sensorEventsSlice';

const rootReducer = combineReducers({
	layoutSlice,
	authSlice,
	UserSlice,
	UiSlice,
	sensorEventsSlice,
});

// Persist config
const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['UiSlice'], // only persist the ui slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
const store = configureStore({
	reducer: persistedReducer,
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false, // required for redux-persist
		}),
});

// Create persistor
export const persistor = persistStore(store);

export default store;
