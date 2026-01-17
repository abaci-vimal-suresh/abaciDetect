// @ts-nocheck
import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { io } from "socket.io-client";
import { useDispatch } from 'react-redux';

import AuthContext from '../contexts/authContext';
import { wsUrl } from '../helpers/baseURL';
import useToasterNotification from '../hooks/useToasterNotification';
import {
	addSensorEvent,
	addSensorAlert,
	updateSensorStatus,
	updateAirQuality,
	addSoundEvent,
} from '../store/sensorEventsSlice';
import { queryClient, queryKeys } from '../lib/queryClient';

const isDev = process.env.NODE_ENV === 'development';
const MOCK_SOCKET = true;

const WebsocketProvider = ({ children }) => {
	const { user, userData } = useContext(AuthContext);
	const dispatch = useDispatch();
	const socketRef = useRef(null);
	const pingIntervalRef = useRef(null);
	const [isOpen, setIsOpen] = useState(false);

	// Use custom toaster hook
	const { showSuccessNotification, showErrorNotification, showNotification } = useToasterNotification();

	const handleSensorMessages = useCallback((message) => {
		try {
			const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
			if (isDev) console.log('Received HALO sensor event:', parsedMessage);

			dispatch(addSensorEvent(parsedMessage));

			switch (parsedMessage?.type) {
				case "alert":
					dispatch(addSensorAlert(parsedMessage));
					showNotification("Alert", ` ${parsedMessage.message}`, "warning");
					break;

				case "status_update":
					dispatch(updateSensorStatus(parsedMessage.data));
					showNotification("Status Update", ` ${parsedMessage.message}`, "info");
					break;

				case "air_quality":
					dispatch(updateAirQuality(parsedMessage.data));
					showNotification("Air Quality", ` ${parsedMessage.message}`, "info");
					break;

				case "sound_event":
					dispatch(addSoundEvent(parsedMessage));
					showNotification("Sound Event", ` ${parsedMessage.message}`, "warning");
					break;

				case "calibration":
					showSuccessNotification(` ${parsedMessage.message}`);
					break;

				case "maintenance":
					showNotification("Maintenance", ` ${parsedMessage.message}`, "info");
					break;

				default:
					if (isDev) console.warn('Unhandled sensor event type:', parsedMessage.type);
					showNotification("Sensor Update", `${parsedMessage.type || 'Data received'}`, "info");
			}

			// Extract sensor ID from message
			const sensorId = String(parsedMessage.sensor_id || parsedMessage.id || parsedMessage.device_id || '');

			// For sensor_4, use optimistic updates instead of invalidation
			if (sensorId) {
				if (isDev) console.log(' Optimistic update for sensor_4:', parsedMessage);

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
			} else {
				// // For other sensors, invalidate queries to trigger refetch
				// queryClient.invalidateQueries({ queryKey: queryKeys.sensors.lists() });
				// if (sensorId) {
				// 	queryClient.invalidateQueries({ queryKey: queryKeys.sensors.detail(sensorId) });
				// }
			}

		} catch (err) {
			console.error('Error handling HALO sensor message:', err);
			showErrorNotification('Error processing sensor data');
		}
	}, [dispatch, showNotification, showSuccessNotification, showErrorNotification]);

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
			if (isDev) console.log('Connected to HALO Sensor Network:', socket.id);
			setIsOpen(true);

			socket.emit('subscribe', { room: 'sensor_4' });

			if (userData?.username) {
				socket.emit('subscribe', { room: userData.username });
			}

			// Ping interval
			pingIntervalRef.current = setInterval(() => {
				if (socket.connected) {
					socket.emit('ping', { timestamp: Date.now() });
				}
			}, 30000);

			toast.success('Connected to HALO Sensor Network');
		});

		socket.on('disconnect', (reason) => {
			if (isDev) console.log('Disconnected from HALO Sensor Network:', reason);
			setIsOpen(false);
			toast.error('Disconnected from HALO Sensor Network');
		});

		socket.on('connect_error', (err) => {
			console.error('Connection Error:', err.message);
			// toast.error('Failed to connect to sensor network');
		});

		// Listen for sensor_4 real-time data
		socket.on('sensor_4', (message) => {
			if (isDev) console.log('📡 Real-time sensor_4 data received:', message);
			handleSensorMessages(message);
		});



		// MOCK DATA GENERATOR
		let mockInterval;
		if (MOCK_SOCKET) {
			console.log('⚠️ STARTING MOCK SOCKET DATA GENERATOR');
			setIsOpen(true); // Force connection state

			mockInterval = setInterval(() => {
				const randomId = Math.floor(Math.random() * 5) + 1; // Random sensor 1-5
				const eventTypes = ['alert', 'status_update', 'air_quality'];
				const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

				let mockMessage = {
					type: randomType,
					sensor_id: String(randomId),
					timestamp: new Date().toISOString(),
				};

				if (randomType === 'alert') {
					mockMessage.message = `Simulated Alert from Sensor ${randomId}`;
					mockMessage.severity = 'critical';
				} else if (randomType === 'status_update') {
					mockMessage.message = `Sensor ${randomId} is now Online`;
					mockMessage.data = { status: 'Online', timestamp: new Date().toISOString() };
				} else if (randomType === 'air_quality') {
					mockMessage.message = `Air Quality Update Sensor ${randomId}`;
					mockMessage.data = { aqi: Math.floor(Math.random() * 100), co2: 400 + Math.floor(Math.random() * 50) };
				}

				handleSensorMessages(mockMessage);

			}, 10000); // Generate event every 5 seconds
		}

		return () => {
			if (pingIntervalRef.current) {
				clearInterval(pingIntervalRef.current);
			}
			if (mockInterval) clearInterval(mockInterval);
			socket.removeAllListeners();
			socket.disconnect();
			socketRef.current = null;
		};
	}, [user, userData?.username, handleSensorMessages]);

	return children;
};

export default WebsocketProvider;

