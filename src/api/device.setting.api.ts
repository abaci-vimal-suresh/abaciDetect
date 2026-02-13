import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { baseURL } from '../helpers/baseURL';

// MOCK DATA FLAG
import { USE_MOCK_DATA } from '../config';

// Mock Data
const MOCK_THRESHOLDS: ThresholdConfig = {
    device_id: 304,
    motion_sensitivity: 50,
    aqi_low: 50,
    aqi_moderate: 100,
    aqi_unhealthy: 150,
    temp_high_c: 30,
    temp_low_c: 15,
    humidity_high: 70,
    humidity_low: 30,
    co2_warning: 1000,
    co2_danger: 2000,
    pm1_threshold: 50,
    pm25_threshold: 35,
    pm10_threshold: 50,
    noise_threshold: 70,
    light_low: 100,
    light_high: 1000,
    co_threshold: 9,
    no2_threshold: 0.053,
    nh3_threshold: 25,
    tvoc_threshold: 500,
    aggression_sensitivity: 70
};

const MOCK_EVENT_MONITORING: EventMonitoringConfig = {
    device_id: 304,
    health_index_enabled: true,
    aqi_enabled: true,
    pm1_enabled: true,
    pm25_enabled: true,
    pm10_enabled: true,
    co2_enabled: true,
    humidity_enabled: true,
    motion_enabled: true,
    gunshot_enabled: true,
    aggression_enabled: false,
    temperature_enabled: true,
    noise_enabled: true,
    light_enabled: true
};

const MOCK_ALERT_RULES: AlertRule[] = [
    {
        id: 1,
        device_id: 304,
        event_type: 'temperature',
        condition: 'GREATER_THAN',
        threshold_value: 30,
        priority: 'HIGH',
        enabled: true
    },
    {
        id: 2,
        device_id: 304,
        event_type: 'co2',
        condition: 'GREATER_THAN',
        threshold_value: 1000,
        priority: 'MEDIUM',
        enabled: true
    }
];

const MOCK_NOTIFICATION_CHANNELS: NotificationChannel[] = [
    {
        id: 1,
        device_id: 304,
        channel_type: 'EMAIL',
        destination: 'admin@example.com',
        enabled: true,
        events: ['temperature', 'co2']
    }
];

const MOCK_CALIBRATION_RECORDS: CalibrationRecord[] = [
    {
        id: 1,
        device_id: 304,
        sensor_type: 'Temperature',
        calibration_date: '2023-12-01T10:00:00Z',
        calibrated_by: 'Technician A',
        notes: 'Annual calibration'
    }
];

const MOCK_MAINTENANCE_SCHEDULES: MaintenanceSchedule[] = [
    {
        id: 1,
        device_id: 304,
        maintenance_type: 'Filter Cleaning',
        frequency_days: 90,
        last_maintenance: '2023-11-15T09:00:00Z',
        next_maintenance: '2024-02-13T09:00:00Z',
        reminder_enabled: true
    }
];

export interface DeviceConfig {
    id: number;
    device_name: string;
    ip_address: string;
    mac_address: string;
    building_wing?: string;
    building_floor?: string;
    building_room?: string;
    description?: string;
    network_type?: 'DHCP' | 'STATIC';
    firmware_version?: string;
}

export interface ThresholdConfig {
    device_id: number;
    motion_sensitivity?: number;
    aqi_low?: number;
    aqi_moderate?: number;
    aqi_unhealthy?: number;
    temp_high_c?: number;
    temp_low_c?: number;
    humidity_high?: number;
    humidity_low?: number;
    co2_warning?: number;
    co2_danger?: number;
    pm1_threshold?: number;
    pm25_threshold?: number;
    pm10_threshold?: number;
    noise_threshold?: number;
    light_low?: number;
    light_high?: number;
    co_threshold?: number;
    no2_threshold?: number;
    nh3_threshold?: number;
    tvoc_threshold?: number;
    aggression_sensitivity?: number;
}

export interface EventMonitoringConfig {
    device_id: number;
    health_index_enabled: boolean;
    aqi_enabled: boolean;
    pm1_enabled: boolean;
    pm25_enabled: boolean;
    pm10_enabled: boolean;
    co2_enabled: boolean;
    humidity_enabled: boolean;
    motion_enabled: boolean;
    gunshot_enabled: boolean;
    aggression_enabled: boolean;
    temperature_enabled: boolean;
    noise_enabled: boolean;
    light_enabled: boolean;
}

export interface AlertRule {
    id?: number;
    device_id: number;
    event_type: string;
    condition: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'BETWEEN';
    threshold_value: number;
    threshold_value_max?: number;
    duration_seconds?: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    enabled: boolean;
}

export interface NotificationChannel {
    id?: number;
    device_id: number;
    channel_type: 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';
    destination: string;
    enabled: boolean;
    events: string[];
}

export interface DisplayPreferences {
    device_id: number;
    temperature_unit: 'C' | 'F';
    visible_sensors: string[];
    dashboard_layout: 'grid' | 'list' | 'compact';
    color_theme: 'light' | 'dark' | 'auto';
    refresh_rate_seconds: number;
}

export interface CalibrationRecord {
    id?: number;
    device_id: number;
    sensor_type: string;
    calibration_date: string;
    calibrated_by?: string;
    notes?: string;
}

export interface MaintenanceSchedule {
    id?: number;
    device_id: number;
    maintenance_type: string;
    frequency_days: number;
    last_maintenance?: string;
    next_maintenance: string;
    reminder_enabled: boolean;
}

export interface ScheduledThreshold {
    id?: number;
    device_id: number;
    profile_name: string;
    start_time: string; // HH:MM format
    end_time: string;
    days_of_week: number[]; // 0-6 (Sunday-Saturday)
    threshold_overrides: Partial<ThresholdConfig>;
    enabled: boolean;
}

export interface DeviceProfile {
    id?: number;
    device_id: number;
    profile_name: string;
    description?: string;
    threshold_config: Partial<ThresholdConfig>;
    event_monitoring: Partial<EventMonitoringConfig>;
    is_active: boolean;
}

export interface APIKey {
    id?: number;
    device_id: number;
    key_name: string;
    api_key?: string;
    permissions: string[];
    expires_at?: string;
    created_at?: string;
    last_used?: string;
}

export interface AutomationRule {
    id?: number;
    device_id: number;
    rule_name: string;
    trigger_event: string;
    trigger_condition: any;
    actions: Array<{
        action_type: string;
        parameters: any;
    }>;
    enabled: boolean;
}

export interface DataRetentionPolicy {
    device_id: number;
    retention_days: number;
    archive_enabled: boolean;
    archive_location?: string;
}

export interface ReportTemplate {
    id?: number;
    device_id: number;
    template_name: string;
    report_type: 'COMPLIANCE' | 'INCIDENT' | 'CUSTOM' | 'SUMMARY';
    included_metrics: string[];
    schedule_enabled: boolean;
    schedule_frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recipients: string[];
}

// ============================================
// API CALLS
// ============================================

// Thresholds
export const fetchThresholds = async (deviceId: string): Promise<ThresholdConfig> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_THRESHOLDS), 500);
        });
    }
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/thresholds`);
    return data;
};

export const updateThresholds = async (thresholds: ThresholdConfig): Promise<ThresholdConfig> => {

    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(thresholds), 500);
        });
    }
    const { data } = await axios.put(
        `${baseURL}/devices/${thresholds.device_id}/thresholds`,
        thresholds
    );
    return data;
};

// Event Monitoring
export const fetchEventMonitoring = async (deviceId: string): Promise<EventMonitoringConfig> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_EVENT_MONITORING), 500);
        });
    }
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/event-monitoring`);
    return data;
};

export const updateEventMonitoring = async (config: EventMonitoringConfig): Promise<EventMonitoringConfig> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve({ ...MOCK_EVENT_MONITORING, ...config }), 500);
        });
    }
    const { data } = await axios.put(
        `${baseURL}/devices/${config.device_id}/event-monitoring`,
        config
    );
    return data;
};

// Alert Rules
export const fetchAlertRules = async (deviceId: string): Promise<AlertRule[]> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_ALERT_RULES), 500);
        });
    }
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/alert-rules`);
    return data;
};

export const createAlertRule = async (rule: AlertRule): Promise<AlertRule> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve({ ...rule, id: Math.floor(Math.random() * 1000) }), 500);
        });
    }
    const { data } = await axios.post(`${baseURL}/devices/${rule.device_id}/alert-rules`, rule);
    return data;
};

export const updateAlertRule = async (rule: AlertRule): Promise<AlertRule> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(rule), 500);
        });
    }
    const { data } = await axios.put(`${baseURL}/alert-rules/${rule.id}`, rule);
    return data;
};

export const deleteAlertRule = async (ruleId: number): Promise<void> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(resolve, 500);
        });
    }
    await axios.delete(`${baseURL}/alert-rules/${ruleId}`);
};

// Notification Channels
export const fetchNotificationChannels = async (deviceId: string): Promise<NotificationChannel[]> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_NOTIFICATION_CHANNELS), 500);
        });
    }
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/notification-channels`);
    return data;
};

export const createNotificationChannel = async (channel: NotificationChannel): Promise<NotificationChannel> => {
    const { data } = await axios.post(
        `${baseURL}/devices/${channel.device_id}/notification-channels`,
        channel
    );
    return data;
};

export const updateNotificationChannel = async (channel: NotificationChannel): Promise<NotificationChannel> => {
    const { data } = await axios.put(`${baseURL}/notification-channels/${channel.id}`, channel);
    return data;
};

export const deleteNotificationChannel = async (channelId: number): Promise<void> => {
    await axios.delete(`${baseURL}/notification-channels/${channelId}`);
};

// Display Preferences
export const fetchDisplayPreferences = async (deviceId: string): Promise<DisplayPreferences> => {
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/display-preferences`);
    return data;
};

export const updateDisplayPreferences = async (prefs: DisplayPreferences): Promise<DisplayPreferences> => {
    const { data } = await axios.put(
        `${baseURL}/devices/${prefs.device_id}/display-preferences`,
        prefs
    );
    return data;
};

// Calibration
export const fetchCalibrationRecords = async (deviceId: string): Promise<CalibrationRecord[]> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_CALIBRATION_RECORDS), 500);
        });
    }
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/calibrations`);
    return data;
};

export const createCalibrationRecord = async (record: CalibrationRecord): Promise<CalibrationRecord> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve({ ...record, id: Math.floor(Math.random() * 1000) }), 500);
        });
    }
    const { data } = await axios.post(`${baseURL}/devices/${record.device_id}/calibrations`, record);
    return data;
};

export const triggerCalibration = async (deviceId: string, sensorType: string): Promise<any> => {
    const { data } = await axios.post(`${baseURL}/devices/${deviceId}/calibrate`, { sensorType });
    return data;
};

// Maintenance
export const fetchMaintenanceSchedules = async (deviceId: string): Promise<MaintenanceSchedule[]> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_MAINTENANCE_SCHEDULES), 500);
        });
    }
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/maintenance-schedules`);
    return data;
};

export const createMaintenanceSchedule = async (schedule: MaintenanceSchedule): Promise<MaintenanceSchedule> => {
    if (USE_MOCK_DATA) {
        return new Promise((resolve) => {
            setTimeout(() => resolve({ ...schedule, id: Math.floor(Math.random() * 1000) }), 500);
        });
    }
    const { data } = await axios.post(
        `${baseURL}/devices/${schedule.device_id}/maintenance-schedules`,
        schedule
    );
    return data;
};

export const updateMaintenanceSchedule = async (schedule: MaintenanceSchedule): Promise<MaintenanceSchedule> => {
    const { data } = await axios.put(`${baseURL}/maintenance-schedules/${schedule.id}`, schedule);
    return data;
};

// Device Actions
export const restartDevice = async (deviceId: string): Promise<any> => {
    const { data } = await axios.post(`${baseURL}/devices/${deviceId}/restart`);
    return data;
};

export const factoryReset = async (deviceId: string): Promise<any> => {
    const { data } = await axios.post(`${baseURL}/devices/${deviceId}/factory-reset`);
    return data;
};

export const updateFirmware = async (deviceId: string): Promise<any> => {
    const { data } = await axios.post(`${baseURL}/devices/${deviceId}/update-firmware`);
    return data;
};

// Scheduled Thresholds
export const fetchScheduledThresholds = async (deviceId: string): Promise<ScheduledThreshold[]> => {
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/scheduled-thresholds`);
    return data;
};

export const createScheduledThreshold = async (schedule: ScheduledThreshold): Promise<ScheduledThreshold> => {
    const { data } = await axios.post(
        `${baseURL}/devices/${schedule.device_id}/scheduled-thresholds`,
        schedule
    );
    return data;
};

export const updateScheduledThreshold = async (schedule: ScheduledThreshold): Promise<ScheduledThreshold> => {
    const { data } = await axios.put(`${baseURL}/scheduled-thresholds/${schedule.id}`, schedule);
    return data;
};

export const deleteScheduledThreshold = async (scheduleId: number): Promise<void> => {
    await axios.delete(`${baseURL}/scheduled-thresholds/${scheduleId}`);
};

// Device Profiles
export const fetchDeviceProfiles = async (deviceId: string): Promise<DeviceProfile[]> => {
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/profiles`);
    return data;
};

export const createDeviceProfile = async (profile: DeviceProfile): Promise<DeviceProfile> => {
    const { data } = await axios.post(`${baseURL}/devices/${profile.device_id}/profiles`, profile);
    return data;
};

export const activateDeviceProfile = async (profileId: number): Promise<DeviceProfile> => {
    const { data } = await axios.post(`${baseURL}/device-profiles/${profileId}/activate`);
    return data;
};

// API Keys
export const fetchAPIKeys = async (deviceId: string): Promise<APIKey[]> => {
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/api-keys`);
    return data;
};

export const generateAPIKey = async (apiKey: Partial<APIKey>): Promise<APIKey> => {
    const { data } = await axios.post(`${baseURL}/devices/${apiKey.device_id}/api-keys`, apiKey);
    return data;
};

export const revokeAPIKey = async (keyId: number): Promise<void> => {
    await axios.delete(`${baseURL}/api-keys/${keyId}`);
};

// Automation Rules
export const fetchAutomationRules = async (deviceId: string): Promise<AutomationRule[]> => {
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/automation-rules`);
    return data;
};

export const createAutomationRule = async (rule: AutomationRule): Promise<AutomationRule> => {
    const { data } = await axios.post(`${baseURL}/devices/${rule.device_id}/automation-rules`, rule);
    return data;
};

export const updateAutomationRule = async (rule: AutomationRule): Promise<AutomationRule> => {
    const { data } = await axios.put(`${baseURL}/automation-rules/${rule.id}`, rule);
    return data;
};

export const deleteAutomationRule = async (ruleId: number): Promise<void> => {
    await axios.delete(`${baseURL}/automation-rules/${ruleId}`);
};

// Data Retention
export const fetchDataRetentionPolicy = async (deviceId: string): Promise<DataRetentionPolicy> => {
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/data-retention`);
    return data;
};

export const updateDataRetentionPolicy = async (policy: DataRetentionPolicy): Promise<DataRetentionPolicy> => {
    const { data } = await axios.put(
        `${baseURL}/devices/${policy.device_id}/data-retention`,
        policy
    );
    return data;
};

// Data Export
export const exportDeviceData = async (
    deviceId: string,
    startDate: string,
    endDate: string,
    format: 'CSV' | 'EXCEL' | 'JSON'
): Promise<Blob> => {
    const { data } = await axios.get(
        `${baseURL}/devices/${deviceId}/export-data`,
        {
            params: { startDate, endDate, format },
            responseType: 'blob'
        }
    );
    return data;
};

// Report Templates
export const fetchReportTemplates = async (deviceId: string): Promise<ReportTemplate[]> => {
    const { data } = await axios.get(`${baseURL}/devices/${deviceId}/report-templates`);
    return data;
};

export const createReportTemplate = async (template: ReportTemplate): Promise<ReportTemplate> => {
    const { data } = await axios.post(
        `${baseURL}/devices/${template.device_id}/report-templates`,
        template
    );
    return data;
};

export const generateReport = async (templateId: number): Promise<Blob> => {
    const { data } = await axios.get(
        `${baseURL}/report-templates/${templateId}/generate`,
        { responseType: 'blob' }
    );
    return data;
};

// ============================================
// REACT QUERY HOOKS
// ============================================

export const useThresholds = (deviceId: string) => {
    return useQuery({
        queryKey: ['thresholds', deviceId],
        queryFn: () => fetchThresholds(deviceId),
        enabled: !!deviceId,
    });
};

export const useUpdateThresholds = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateThresholds,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['thresholds', data.device_id] });
        },
    });
};

export const useEventMonitoring = (deviceId: string) => {
    return useQuery({
        queryKey: ['eventMonitoring', deviceId],
        queryFn: () => fetchEventMonitoring(deviceId),
        enabled: !!deviceId,
    });
};

export const useUpdateEventMonitoring = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateEventMonitoring,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['eventMonitoring', data.device_id] });
        },
    });
};

export const useAlertRules = (deviceId: string) => {
    return useQuery({
        queryKey: ['alertRules', deviceId],
        queryFn: () => fetchAlertRules(deviceId),
        enabled: !!deviceId,
    });
};

export const useCreateAlertRule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAlertRule,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['alertRules', data.device_id] });
        },
    });
};

export const useUpdateAlertRule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateAlertRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] });
        },
    });
};

export const useDeleteAlertRule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAlertRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] });
        },
    });
};

export const useNotificationChannels = (deviceId: string) => {
    return useQuery({
        queryKey: ['notificationChannels', deviceId],
        queryFn: () => fetchNotificationChannels(deviceId),
        enabled: !!deviceId,
    });
};

export const useCreateNotificationChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createNotificationChannel,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notificationChannels', data.device_id] });
        },
    });
};

export const useDisplayPreferences = (deviceId: string) => {
    return useQuery({
        queryKey: ['displayPreferences', deviceId],
        queryFn: () => fetchDisplayPreferences(deviceId),
        enabled: !!deviceId,
    });
};

export const useUpdateDisplayPreferences = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateDisplayPreferences,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['displayPreferences', data.device_id] });
        },
    });
};

export const useCalibrationRecords = (deviceId: string) => {
    return useQuery({
        queryKey: ['calibrationRecords', deviceId],
        queryFn: () => fetchCalibrationRecords(deviceId),
        enabled: !!deviceId,
    });
};

export const useCreateCalibrationRecord = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCalibrationRecord,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['calibrationRecords', data.device_id] });
        },
    });
};

export const useTriggerCalibration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ deviceId, sensorType }: { deviceId: string; sensorType: string }) =>
            triggerCalibration(deviceId, sensorType),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['calibrationRecords', variables.deviceId] });
        },
    });
};

export const useMaintenanceSchedules = (deviceId: string) => {
    return useQuery({
        queryKey: ['maintenanceSchedules', deviceId],
        queryFn: () => fetchMaintenanceSchedules(deviceId),
        enabled: !!deviceId,
    });
};

export const useRestartDevice = () => {
    return useMutation({
        mutationFn: restartDevice,
    });
};

export const useFactoryReset = () => {
    return useMutation({
        mutationFn: factoryReset,
    });
};

export const useUpdateFirmware = () => {
    return useMutation({
        mutationFn: updateFirmware,
    });
};

export const useScheduledThresholds = (deviceId: string) => {
    return useQuery({
        queryKey: ['scheduledThresholds', deviceId],
        queryFn: () => fetchScheduledThresholds(deviceId),
        enabled: !!deviceId,
    });
};

export const useDeviceProfiles = (deviceId: string) => {
    return useQuery({
        queryKey: ['deviceProfiles', deviceId],
        queryFn: () => fetchDeviceProfiles(deviceId),
        enabled: !!deviceId,
    });
};

export const useAPIKeys = (deviceId: string) => {
    return useQuery({
        queryKey: ['apiKeys', deviceId],
        queryFn: () => fetchAPIKeys(deviceId),
        enabled: !!deviceId,
    });
};

export const useGenerateAPIKey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: generateAPIKey,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys', data.device_id] });
        },
    });
};

export const useAutomationRules = (deviceId: string) => {
    return useQuery({
        queryKey: ['automationRules', deviceId],
        queryFn: () => fetchAutomationRules(deviceId),
        enabled: !!deviceId,
    });
};

export const useDataRetentionPolicy = (deviceId: string) => {
    return useQuery({
        queryKey: ['dataRetentionPolicy', deviceId],
        queryFn: () => fetchDataRetentionPolicy(deviceId),
        enabled: !!deviceId,
    });
};

export const useReportTemplates = (deviceId: string) => {
    return useQuery({
        queryKey: ['reportTemplates', deviceId],
        queryFn: () => fetchReportTemplates(deviceId),
        enabled: !!deviceId,
    });
};

export const useExportDeviceData = () => {
    return useMutation({
        mutationFn: ({
            deviceId,
            startDate,
            endDate,
            format
        }: {
            deviceId: string;
            startDate: string;
            endDate: string;
            format: 'CSV' | 'EXCEL' | 'JSON';
        }) => exportDeviceData(deviceId, startDate, endDate, format),
    });
};