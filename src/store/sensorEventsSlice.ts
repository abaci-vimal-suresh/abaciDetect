import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    events: [],
    alerts: [],
    sensorStatuses: {},
    airQualityData: {},
    soundEvents: [],
    unreadCount: 0,
};

const sensorEventsSlice = createSlice({
    name: 'sensorEvents',
    initialState,
    reducers: {
        addSensorEvent: (state, action) => {
            state.events.unshift(action.payload);
            // Keep only last 100 events
            if (state.events.length > 100) {
                state.events = state.events.slice(0, 100);
            }
            state.unreadCount += 1;
        },

        addSensorAlert: (state, action) => {
            state.alerts.unshift(action.payload);
            state.unreadCount += 1;
            // Keep only last 50 alerts
            if (state.alerts.length > 50) {
                state.alerts = state.alerts.slice(0, 50);
            }
        },

        updateSensorStatus: (state, action) => {
            const { sensorId, status, timestamp } = action.payload;
            state.sensorStatuses[sensorId] = {
                status,
                lastUpdate: timestamp,
            };
        },

        updateAirQuality: (state, action) => {
            const { sensorId, metrics, timestamp } = action.payload;
            state.airQualityData[sensorId] = {
                ...metrics,
                timestamp,
            };
        },

        addSoundEvent: (state, action) => {
            state.soundEvents.unshift(action.payload);
            // Keep only last 50 sound events
            if (state.soundEvents.length > 50) {
                state.soundEvents = state.soundEvents.slice(0, 50);
            }
        },

        markEventsAsRead: (state) => {
            state.unreadCount = 0;
        },

        clearAllEvents: (state) => {
            state.events = [];
            state.alerts = [];
            state.soundEvents = [];
            state.unreadCount = 0;
        },

        clearOldEvents: (state, action) => {
            const hoursAgo = action.payload || 24;
            const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);

            state.events = state.events.filter(
                event => new Date(event.timestamp).getTime() > cutoffTime
            );
            state.alerts = state.alerts.filter(
                alert => new Date(alert.timestamp).getTime() > cutoffTime
            );
        },
    },
});

export const {
    addSensorEvent,
    addSensorAlert,
    updateSensorStatus,
    updateAirQuality,
    addSoundEvent,
    markEventsAsRead,
    clearAllEvents,
    clearOldEvents,
} = sensorEventsSlice.actions;

export default sensorEventsSlice.reducer;

// Selectors
// Selectors
export const selectAllEvents = (state) => state.sensorEventsSlice?.events || [];
export const selectAllAlerts = (state) => state.sensorEventsSlice?.alerts || [];
export const selectUnreadCount = (state) => state.sensorEventsSlice?.unreadCount || 0;
export const selectSensorStatus = (sensorId) => (state) =>
    state.sensorEventsSlice?.sensorStatuses[sensorId];
export const selectAirQuality = (sensorId) => (state) =>
    state.sensorEventsSlice?.airQualityData[sensorId];
export const selectRecentAlerts = (count = 5) => (state) =>
    state.sensorEventsSlice?.alerts.slice(0, count) || [];