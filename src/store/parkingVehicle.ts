// Redux Slice for Vehicle Management

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vehicle, VehicleFormData } from '../types/vehicle';
import { mockVehicles } from '../mockData/vehicles';

interface VehicleState {
    vehicles: Vehicle[];
    loading: boolean;
    error: string | null;
    selectedVehicle: Vehicle | null;
    filters: {
        type: string | null;
        status: string | null;
        search: string;
    };
}

const initialState: VehicleState = {
    vehicles: mockVehicles,
    loading: false,
    error: null,
    selectedVehicle: null,
    filters: {
        type: null,
        status: null,
        search: '',
    },
};

const vehicleSlice = createSlice({
    name: 'parkingVehicle',
    initialState,
    reducers: {
        // Get all vehicles
        setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
            state.vehicles = action.payload;
            state.loading = false;
        },

        // Register new vehicle
        registerVehicle: (state, action: PayloadAction<VehicleFormData>) => {
            const newVehicle: Vehicle = {
                id: `vehicle-${Date.now()}`,
                ...action.payload,
                status: 'active',
                registeredAt: new Date().toISOString(),
            };
            state.vehicles.push(newVehicle);
        },

        // Update vehicle
        updateVehicle: (state, action: PayloadAction<{ id: string; data: Partial<Vehicle> }>) => {
            const index = state.vehicles.findIndex((v) => v.id === action.payload.id);
            if (index !== -1) {
                state.vehicles[index] = {
                    ...state.vehicles[index],
                    ...action.payload.data,
                };
            }
        },

        // Delete vehicle
        deleteVehicle: (state, action: PayloadAction<string>) => {
            state.vehicles = state.vehicles.filter((v) => v.id !== action.payload);
        },

        // Block/Unblock vehicle
        toggleVehicleBlock: (state, action: PayloadAction<string>) => {
            const vehicle = state.vehicles.find((v) => v.id === action.payload);
            if (vehicle) {
                vehicle.status = vehicle.status === 'blocked' ? 'active' : 'blocked';
            }
        },

        // Update last parked time
        updateLastParked: (state, action: PayloadAction<string>) => {
            const vehicle = state.vehicles.find((v) => v.id === action.payload);
            if (vehicle) {
                vehicle.lastParkedAt = new Date().toISOString();
            }
        },

        // Select vehicle
        selectVehicle: (state, action: PayloadAction<string | null>) => {
            state.selectedVehicle = action.payload
                ? state.vehicles.find((v) => v.id === action.payload) || null
                : null;
        },

        // Set filters
        setFilters: (state, action: PayloadAction<Partial<VehicleState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        // Clear filters
        clearFilters: (state) => {
            state.filters = {
                type: null,
                status: null,
                search: '',
            };
        },

        // Set loading
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },

        // Set error
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const {
    setVehicles,
    registerVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleBlock,
    updateLastParked,
    selectVehicle,
    setFilters,
    clearFilters,
    setLoading,
    setError,
} = vehicleSlice.actions;

export default vehicleSlice.reducer;
