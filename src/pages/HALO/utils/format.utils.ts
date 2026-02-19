
export const formatLastHeartbeat = (timestamp?: string | number | Date): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
};
