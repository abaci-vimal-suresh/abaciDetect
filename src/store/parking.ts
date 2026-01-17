// Redux Slice for Parking Management

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParkingSlot, ParkingSlotFormData } from '../types/parking';
import { mockParkingSlots } from '../mockData/parkingSlots';

interface ParkingState {
    slots: ParkingSlot[];
    loading: boolean;
    error: string | null;
    selectedSlot: ParkingSlot | null;
    filters: {
        floor: number | null;
        zone: string | null;
        type: string | null;
        status: string | null;
        search: string;
    };
}

const initialState: ParkingState = {
    slots: mockParkingSlots,
    loading: false,
    error: null,
    selectedSlot: null,
    filters: {
        floor: null,
        zone: null,
        type: null,
        status: null,
        search: '',
    },
};

const parkingSlice = createSlice({
    name: 'parking',
    initialState,
    reducers: {
        // Get all slots
        setSlots: (state, action: PayloadAction<ParkingSlot[]>) => {
            state.slots = action.payload;
            state.loading = false;
        },

        // Add new slot
        addSlot: (state, action: PayloadAction<ParkingSlotFormData>) => {
            const newSlot: ParkingSlot = {
                id: `slot-${Date.now()}`,
                ...action.payload,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            state.slots.push(newSlot);
        },

        // Update slot
        updateSlot: (state, action: PayloadAction<{ id: string; data: Partial<ParkingSlot> }>) => {
            const index = state.slots.findIndex((slot) => slot.id === action.payload.id);
            if (index !== -1) {
                state.slots[index] = {
                    ...state.slots[index],
                    ...action.payload.data,
                    updatedAt: new Date().toISOString(),
                };
            }
        },

        // Delete slot
        deleteSlot: (state, action: PayloadAction<string>) => {
            state.slots = state.slots.filter((slot) => slot.id !== action.payload);
        },

        // Select slot
        selectSlot: (state, action: PayloadAction<string | null>) => {
            state.selectedSlot = action.payload
                ? state.slots.find((slot) => slot.id === action.payload) || null
                : null;
        },

        // Set filters
        setFilters: (state, action: PayloadAction<Partial<ParkingState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        // Clear filters
        clearFilters: (state) => {
            state.filters = {
                floor: null,
                zone: null,
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
    setSlots,
    addSlot,
    updateSlot,
    deleteSlot,
    selectSlot,
    setFilters,
    clearFilters,
    setLoading,
    setError,
} = parkingSlice.actions;

export default parkingSlice.reducer;
