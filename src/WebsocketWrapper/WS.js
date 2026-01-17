// @ts-nocheck
import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { io } from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AuthContext from '../contexts/authContext';
import { wsUrl } from '../helpers/baseURL';
import {
    addSensorEvent,
    addSensorAlert,
    updateSensorStatus,
    updateAirQuality,
    addSoundEvent,
} from '../store/sensorEventsSlice';
import { queryClient, queryKeys } from '../lib/queryClient';
import { useQuery } from '@tanstack/react-query';

const isDev = process.env.NODE_ENV === 'development';

const WebsocketProvider = ({ children }) => {
    const { user, userData } = useContext(AuthContext);
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const subscribedSensorsRef = useRef(new Set());
    const [isOpen, setIsOpen] = useState(false);

    // Fetch all sensors dynamically
    // Option 1: Using React Query (recommended)
    const { data: sensors = [] } = useQuery({
        queryKey: queryKeys.sensors.lists(),
        enabled: !!user, // Only fetch when user is logged in
        staleTime: 30000, // Cache for 30 seconds
    });

    // Option 2: Using Redux (alternative - uncomment if you prefer)
    // const sensors = useSelector(state => state.sensors?.list || []);

    const handleSensorMessages = useCallback((message) => {
        try {
            const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
            if (isDev) console.log('Received HALO sensor event:', parsedMessage);

            dispatch(addSensorEvent(parsedMessage));

            switch (parsedMessage?.type) {
                case "alert":
                    dispatch(addSensorAlert(parsedMessage));
                    toast.warning(`🚨 ${parsedMessage.message}`, { autoClose: 5000 });
                    break;

                case "status_update":
                    dispatch(updateSensorStatus(parsedMessage.data));
                    toast.info(`ℹ️ ${parsedMessage.message}`, { autoClose: 3000 });
                    break;

                case "air_quality":
                    dispatch(updateAirQuality(parsedMessage.data));
                    toast.info(`🌬️ ${parsedMessage.message}`, { autoClose: 4000 });
                    break;

                case "sound_event":
                    dispatch(addSoundEvent(parsedMessage));
                    toast.warning(`🔊 ${parsedMessage.message}`, { autoClose: 4000 });
                    break;

                case "calibration":
                    toast.success(`✅ ${parsedMessage.message}`, { autoClose: 3000 });
                    break;

                case "maintenance":
                    toast.info(`🔧 ${parsedMessage.message}`, { autoClose: 4000 });
                    break;

                default:
                    if (isDev) console.warn('Unhandled sensor event type:', parsedMessage.type);
                    toast.info(`Sensor Update: ${parsedMessage.type || 'Data received'}`, { autoClose: 3000 });
            }

            // Extract sensor ID from message
            const sensorId = String(parsedMessage.sensor_id || parsedMessage.id || parsedMessage.device_id || '');

            if (!sensorId) {
                console.warn('Received sensor message without sensor ID:', parsedMessage);
                return;
            }

            // Use optimistic updates for ALL sensors
            if (isDev) console.log(`🔄 Optimistic update for sensor_${sensorId}:`, parsedMessage);

            // Update individual sensor detail cache
            queryClient.setQueryData(
                queryKeys.sensors.detail(sensorId),
                (oldData) => {
                    if (!oldData) return parsedMessage;
                    return {
                        ...oldData,
                        ...parsedMessage,
                        timestamp: new Date().toISOString(),
                    };
                }
            );

            // Update sensors list cache
            queryClient.setQueryData(
                queryKeys.sensors.lists(),
                (oldData) => {
                    if (!oldData || !Array.isArray(oldData)) return oldData;
                    return oldData.map(sensor => {
                        if (String(sensor.id) === sensorId) {
                            return {
                                ...sensor,
                                ...parsedMessage,
                                timestamp: new Date().toISOString(),
                            };
                        }
                        return sensor;
                    });
                }
            );

        } catch (err) {
            console.error('Error handling HALO sensor message:', err);
            toast.error('Error processing sensor data');
        }
    }, [dispatch]);

    // Subscribe to a sensor room
    const subscribeToSensor = useCallback((socket, sensorId) => {
        const room = `sensor_${sensorId}`;

        if (subscribedSensorsRef.current.has(room)) {
            if (isDev) console.log(`Already subscribed to ${room}`);
            return;
        }

        socket.emit('subscribe', { room });

        // Add dynamic listener for this sensor
        socket.on(room, (message) => {
            if (isDev) console.log(`📡 Real-time data from ${room}:`, message);
            handleSensorMessages(message);
        });

        subscribedSensorsRef.current.add(room);
        if (isDev) console.log(`✅ Subscribed to ${room}`);
    }, [handleSensorMessages]);

    // Unsubscribe from a sensor room
    const unsubscribeFromSensor = useCallback((socket, sensorId) => {
        const room = `sensor_${sensorId}`;

        if (!subscribedSensorsRef.current.has(room)) {
            return;
        }

        socket.emit('unsubscribe', { room });
        socket.off(room);
        subscribedSensorsRef.current.delete(room);

        if (isDev) console.log(`❌ Unsubscribed from ${room}`);
    }, []);

    // Subscribe to all active sensors
    const subscribeToAllSensors = useCallback((socket, sensorsList) => {
        if (!Array.isArray(sensorsList) || sensorsList.length === 0) {
            if (isDev) console.log('No sensors to subscribe to');
            return;
        }

        sensorsList.forEach(sensor => {
            const sensorId = String(sensor.id || sensor.sensor_id || sensor.device_id);
            if (sensorId) {
                subscribeToSensor(socket, sensorId);
            } else {
                console.warn('Sensor without valid ID:', sensor);
            }
        });

        if (isDev) console.log(`📡 Subscribed to ${sensorsList.length} sensors`);
    }, [subscribeToSensor]);

    // Main WebSocket effect
    useEffect(() => {
        if (!user) return;

        const socket = io(wsUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            if (isDev) console.log('✅ Connected to HALO Sensor Network:', socket.id);
            setIsOpen(true);

            // Subscribe to user-specific room
            if (userData?.username) {
                socket.emit('subscribe', { room: userData.username });
                if (isDev) console.log(`Subscribed to user room: ${userData.username}`);
            }

            // Subscribe to all sensors
            subscribeToAllSensors(socket, sensors);

            // Ping interval to keep connection alive
            pingIntervalRef.current = setInterval(() => {
                if (socket.connected) {
                    socket.emit('ping', { timestamp: Date.now() });
                }
            }, 30000);

            toast.success('🟢 Connected to HALO Sensor Network');
        });

        socket.on('disconnect', (reason) => {
            if (isDev) console.log('🔴 Disconnected from HALO Sensor Network:', reason);
            setIsOpen(false);
            subscribedSensorsRef.current.clear();
            toast.error('🔴 Disconnected from HALO Sensor Network');
        });

        socket.on('connect_error', (err) => {
            console.error('Connection Error:', err.message);
        });

        socket.on('reconnect', (attemptNumber) => {
            if (isDev) console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
            // Re-subscribe to all sensors after reconnection
            subscribeToAllSensors(socket, sensors);
            toast.success('🟢 Reconnected to HALO Sensor Network');
        });

        // Cleanup
        return () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }

            // Unsubscribe from all sensor rooms
            subscribedSensorsRef.current.forEach(room => {
                socket.off(room);
            });
            subscribedSensorsRef.current.clear();

            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;

            if (isDev) console.log('🧹 WebSocket cleanup completed');
        };
    }, [user, userData?.username, handleSensorMessages, subscribeToAllSensors]);

    // Effect to handle dynamic sensor changes (add/remove sensors)
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !socket.connected || !sensors || sensors.length === 0) {
            return;
        }

        // Get current sensor IDs
        const currentSensorIds = new Set(
            sensors.map(s => `sensor_${String(s.id || s.sensor_id || s.device_id)}`).filter(Boolean)
        );

        // Unsubscribe from sensors that are no longer in the list
        subscribedSensorsRef.current.forEach(room => {
            if (!currentSensorIds.has(room) && room.startsWith('sensor_')) {
                const sensorId = room.replace('sensor_', '');
                unsubscribeFromSensor(socket, sensorId);
            }
        });

        // Subscribe to new sensors
        sensors.forEach(sensor => {
            const sensorId = String(sensor.id || sensor.sensor_id || sensor.device_id);
            if (sensorId) {
                subscribeToSensor(socket, sensorId);
            }
        });

        if (isDev) console.log('🔄 Sensor subscriptions updated:', Array.from(subscribedSensorsRef.current));
    }, [sensors, subscribeToSensor, unsubscribeFromSensor]);

    return children;
};

export default WebsocketProvider;