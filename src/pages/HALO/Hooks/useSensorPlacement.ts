
import { useState, useCallback, useRef } from 'react';
import { SensorNode, HaloEventConfig } from '../Types/types';
import { HALO_EVENTS } from '../Dummy/dummyData';

// ── Default event configs for a newly placed sensor ───────────────────────────
// Every new sensor gets Motion, temp_c, Humidity, CO2cal, AQI by default

const DEFAULT_EVENT_CONFIGS: Omit<HaloEventConfig, 'id'>[] = [
    {
        event_id: 'Motion', enabled: true,
        min_value: 0, threshold: 60, max_value: 100,
        led_color: 0x0088ff,
        current_value: null, is_triggered: false,
    },
    {
        event_id: 'temp_c', enabled: true,
        min_value: 15, threshold: 35, max_value: 50,
        led_color: 0xff8800,
        current_value: null, is_triggered: false,
    },
    {
        event_id: 'Humidity', enabled: true,
        min_value: 20, threshold: 75, max_value: 100,
        led_color: 0x00ffff,
        current_value: null, is_triggered: false,
    },
    {
        event_id: 'CO2cal', enabled: true,
        min_value: 400, threshold: 1000, max_value: 2000,
        led_color: 0x8800ff,
        current_value: null, is_triggered: false,
    },
    {
        event_id: 'AQI', enabled: true,
        min_value: 0, threshold: 100, max_value: 500,
        led_color: 0x00ff00,
        current_value: null, is_triggered: false,
    },
];

// ── State types ───────────────────────────────────────────────────────────────

export interface PlacementPreview {
    nx: number;  // normalized 0–1
    ny: number;
}

export interface PendingSensor {
    tempId: string;     // temporary ID before confirm
    floorId: number;
    nx: number;
    ny: number;
    name: string;
    macAddress: string;
}

export interface UseSensorPlacementReturn {
    // State
    isPlacing: boolean;
    preview: PlacementPreview | null;
    pendingSensor: PendingSensor | null;

    // Actions
    startPlacing: () => void;
    cancelPlacing: () => void;
    updatePreview: (nx: number, ny: number) => void;
    placeSensor: (nx: number, ny: number, floorId: number, existingCount: number) => PendingSensor;
    confirmPlacement: (
        pending: PendingSensor,
        name: string,
        macAddress: string,
        selectedEvents: string[],
    ) => SensorNode;
    cancelPending: () => void;
    updatePending: (patch: Partial<PendingSensor>) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSensorPlacement(): UseSensorPlacementReturn {
    const [isPlacing, setIsPlacing] = useState(false);
    const [preview, setPreview] = useState<PlacementPreview | null>(null);
    const [pendingSensor, setPendingSensor] = useState<PendingSensor | null>(null);

    // Ref so Three.js callbacks always read fresh value
    const isPlacingRef = useRef(false);

    const startPlacing = useCallback(() => {
        isPlacingRef.current = true;
        setIsPlacing(true);
        setPreview(null);
        setPendingSensor(null);
    }, []);

    const cancelPlacing = useCallback(() => {
        isPlacingRef.current = false;
        setIsPlacing(false);
        setPreview(null);
        setPendingSensor(null);
    }, []);

    const updatePreview = useCallback((nx: number, ny: number) => {
        if (!isPlacingRef.current) return;
        setPreview({ nx, ny });
    }, []);

    // Drop sensor on floor — returns the pending sensor immediately
    const placeSensor = useCallback((
        nx: number,
        ny: number,
        floorId: number,
        existingCount: number,
    ): PendingSensor => {
        const tempId = `pending-${Date.now()}`;
        const index = existingCount + 1;
        const name = `HALO-NEW-${String(index).padStart(2, '0')}`;
        const pending: PendingSensor = {
            tempId,
            floorId,
            nx,
            ny,
            name,
            macAddress: '',
        };
        isPlacingRef.current = false;
        setIsPlacing(false);
        setPreview(null);
        setPendingSensor(pending);
        return pending;
    }, []);

    // Confirm — build a full SensorNode from pending + user edits
    const confirmPlacement = useCallback((
        pending: PendingSensor,
        name: string,
        macAddress: string,
        selectedEvents: string[],
    ): SensorNode => {
        const configs: HaloEventConfig[] = selectedEvents.map((eventId, i) => {
            const defaults = DEFAULT_EVENT_CONFIGS.find(d => d.event_id === eventId);
            return {
                id: Date.now() + i,
                event_id: eventId,
                enabled: true,
                min_value: defaults?.min_value ?? 0,
                threshold: defaults?.threshold ?? 50,
                max_value: defaults?.max_value ?? 100,
                led_color: defaults?.led_color ?? 0x00ff00,
                current_value: null,
                is_triggered: false,
            };
        });

        const newSensor: SensorNode = {
            id: Date.now(),
            name: name || pending.name,
            mac_address: macAddress || 'AA:BB:CC:DD:EE:??',
            ip_address: null,
            online_status: true,
            sensor_status: 'online',
            floor_id: pending.floorId,
            x_val: pending.nx,
            y_val: pending.ny,
            z_val: 0.85,
            halo_color: '#06d6a0',
            halo_radius: 5,
            halo_intensity: 0.35,
            event_configs: configs,
            latest_log: null,
        };

        setPendingSensor(null);
        return newSensor;
    }, []);

    const cancelPending = useCallback(() => {
        setPendingSensor(null);
    }, []);

    const updatePending = useCallback((patch: Partial<PendingSensor>) => {
        setPendingSensor(prev => prev ? { ...prev, ...patch } : null);
    }, []);

    return {
        isPlacing,
        preview,
        pendingSensor,
        startPlacing,
        cancelPlacing,
        updatePreview,
        placeSensor,
        confirmPlacement,
        cancelPending,
        updatePending,
    };
}