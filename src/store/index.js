import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import layoutSlice from './layout';
import authSlice from './auth';
import UserSlice from './user';
import UiSlice from './uiSlice';
import ParkingSlice from './parking';
import ParkingVehicleSlice from './parkingVehicle';
import ParkingBookingSlice from './parkingBooking';

const rootReducer = combineReducers({
	layoutSlice,
	authSlice,
	UserSlice,
	UiSlice,
	// Parking Management Slices
	ParkingSlice,
	ParkingVehicleSlice,
	ParkingBookingSlice,
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
