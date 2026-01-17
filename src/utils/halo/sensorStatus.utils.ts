import { Sensor } from '../../types/sensor';


export const isSensorOnline = (timestamp?: string | number | Date): boolean => {
    if (!timestamp) return false;
    const diffMinutes = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60);
    return diffMinutes <= 5;
};


// Returns the status label for the active/inactive state.
export const getSensorStatusLabel = (isActive: boolean): string => {
    return isActive ? 'Active' : 'Inactive';
};

// Returns the status label for the online/offline state.
export const getSensorOnlineLabel = (isOnline: boolean): string => {
    return isOnline ? 'Online' : 'Offline';
};

// Common status color helper for badges and status indicators.

export const getSensorStatusTheme = (
    type: 'active' | 'online',
    isTrue: boolean,
    darkModeStatus: boolean
) => {
    if (type === 'active') {
        const bg = isTrue
            ? darkModeStatus ? 'rgba(70, 188, 170, 0.08)' : 'rgba(70, 188, 170, 0.15)'
            : darkModeStatus ? 'rgba(173, 181, 189, 0.08)' : 'rgba(173, 181, 189, 0.15)';
        const border = darkModeStatus
            ? `1px solid ${isTrue ? 'rgba(70, 188, 170, 0.3)' : 'rgba(173, 181, 189, 0.3)'}`
            : `1px solid ${isTrue ? 'rgba(70, 188, 170, 0.4)' : 'rgba(173, 181, 189, 0.4)'}`;
        const color = darkModeStatus
            ? (isTrue ? '#46bcaa' : '#adb5bd')
            : (isTrue ? '#2d8478' : '#6c757d');
        const dot = isTrue ? '#46bcaa' : '#adb5bd';

        return { bg, border, color, dot };
    } else {
        const bg = isTrue
            ? darkModeStatus ? 'rgba(70, 188, 170, 0.08)' : 'rgba(70, 188, 170, 0.15)'
            : darkModeStatus ? 'rgba(243, 84, 33, 0.08)' : 'rgba(243, 84, 33, 0.15)';
        const border = darkModeStatus
            ? `1px solid ${isTrue ? 'rgba(70, 188, 170, 0.3)' : 'rgba(243, 84, 33, 0.3)'}`
            : `1px solid ${isTrue ? 'rgba(70, 188, 170, 0.4)' : 'rgba(243, 84, 33, 0.4)'}`;
        const color = darkModeStatus
            ? (isTrue ? '#46bcaa' : '#f35421')
            : (isTrue ? '#2d8478' : '#c43a15');
        const dot = isTrue ? '#46bcaa' : '#f35421';

        return { bg, border, color, dot };
    }
};
