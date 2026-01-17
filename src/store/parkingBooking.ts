// Redux Slice for Booking Management

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingFormData } from '../types/booking';
import { mockBookings } from '../mockData/bookings';

interface BookingState {
    bookings: Booking[];
    loading: boolean;
    error: string | null;
    selectedBooking: Booking | null;
    filters: {
        status: string | null;
        dateFrom: string | null;
        dateTo: string | null;
        search: string;
    };
}

const initialState: BookingState = {
    bookings: mockBookings,
    loading: false,
    error: null,
    selectedBooking: null,
    filters: {
        status: null,
        dateFrom: null,
        dateTo: null,
        search: '',
    },
};

const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        // Get all bookings
        setBookings: (state, action: PayloadAction<Booking[]>) => {
            state.bookings = action.payload;
            state.loading = false;
        },

        // Create new booking
        createBooking: (state, action: PayloadAction<BookingFormData>) => {
            const newBooking: Booking = {
                id: `booking-${Date.now()}`,
                ...action.payload,
                slotNumber: 'TBD', // Will be populated from API
                vehiclePlate: 'TBD',
                vehicleType: 'car',
                ownerName: 'TBD',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            state.bookings.push(newBooking);
        },

        // Check-out (complete booking)
        checkOutBooking: (state, action: PayloadAction<string>) => {
            const booking = state.bookings.find((b) => b.id === action.payload);
            if (booking) {
                const checkOutTime = new Date();
                const checkInTime = new Date(booking.checkInTime);
                const durationHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

                booking.status = 'completed';
                booking.checkOutTime = checkOutTime.toISOString();
                booking.amount = Math.floor(durationHours * 5); // $5 per hour
                booking.updatedAt = checkOutTime.toISOString();
            }
        },

        // Cancel booking
        cancelBooking: (state, action: PayloadAction<string>) => {
            const booking = state.bookings.find((b) => b.id === action.payload);
            if (booking) {
                booking.status = 'cancelled';
                booking.updatedAt = new Date().toISOString();
            }
        },

        // Update booking
        updateBooking: (state, action: PayloadAction<{ id: string; data: Partial<Booking> }>) => {
            const index = state.bookings.findIndex((b) => b.id === action.payload.id);
            if (index !== -1) {
                state.bookings[index] = {
                    ...state.bookings[index],
                    ...action.payload.data,
                    updatedAt: new Date().toISOString(),
                };
            }
        },

        // Select booking
        selectBooking: (state, action: PayloadAction<string | null>) => {
            state.selectedBooking = action.payload
                ? state.bookings.find((b) => b.id === action.payload) || null
                : null;
        },

        // Set filters
        setFilters: (state, action: PayloadAction<Partial<BookingState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        // Clear filters
        clearFilters: (state) => {
            state.filters = {
                status: null,
                dateFrom: null,
                dateTo: null,
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
    setBookings,
    createBooking,
    checkOutBooking,
    cancelBooking,
    updateBooking,
    selectBooking,
    setFilters,
    clearFilters,
    setLoading,
    setError,
} = bookingSlice.actions;

export default bookingSlice.reducer;
