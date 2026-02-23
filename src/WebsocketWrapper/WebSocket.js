// @ts-nocheck
import React from 'react';
import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { io } from "socket.io-client";
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { authAxios } from '../axiosInstance';

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
import { Store } from 'react-notifications-component';
import { AlertToastTitle, AlertToastBody } from '../components/alerts/AlertToast';

const isDev = process.env.NODE_ENV === 'development';
const MOCK_SOCKET = false;

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

		// Read token from cookies (same chain as axiosInstance interceptor)
		// authAxios.defaults.headers.Authorization may not be set yet at mount time
		const cookieToken =
			Cookies.get('access_token') ||
			Cookies.get('token') ||
			Cookies.get('access') ||
			(authAxios.defaults.headers.Authorization || '').replace('Bearer ', '');

		const socket = io(wsUrl, {
			withCredentials: true,
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
			// Backend reads ?token= from QUERY_STRING
			query: {
				token: cookieToken,
			},
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			if (isDev) console.log('Connected to HALO Sensor Network:', socket.id);
			setIsOpen(true);

			// 1. Broadcast â€” messages to all users
			socket.emit('subscribe', { room: 'broadcast' });

			// 2. User-specific â€” messages only to this user
			if (userData?.id) {
				socket.emit('subscribe', { room: `user_${userData.id}` });
				if (isDev) console.log('Subscribed to user room:', `user_${userData.id}`);
			}

			// 3. Role-based â€” messages to all admins or all viewers
			if (userData?.role) {
				socket.emit('subscribe', { room: `role_${userData.role.toLowerCase()}` });
				if (isDev) console.log('Subscribed to role room:', `role_${userData.role.toLowerCase()}`);
			}

			// Ping interval
			pingIntervalRef.current = setInterval(() => {
				if (socket.connected) {
					socket.emit('ping', { timestamp: Date.now() });
				}
			}, 30000);

			showSuccessNotification('Connected to HALO Sensor Network');
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

		// Broadcast room â€” new alert created
		socket.on('alert_created', (message) => {
			if (isDev) console.log('ï¿½ alert_created received:', message);
			queryClient.invalidateQueries({ queryKey: ['alerts'] });

			// Dispatch to Redux for global persistence and notification center visibility
			dispatch(addSensorAlert({
				...message,
				id: message.id || Date.now(),
				title: message.sensor_name || 'New Sensor Alert',
				message: message.description || 'A new alert has been triggered',
				sensor_id: message.sensor_name || message.sensor || 'Unknown',
				timestamp: message.timestamp || message.created_at || new Date().toISOString()
			}));

			Store.addNotification({
				title: React.createElement(AlertToastTitle, { alert: message }),
				message: React.createElement(AlertToastBody, { alert: message }),
				type: 'warning',
				insert: 'top',
				container: 'top-right',
				animationIn: ['animate__animated', 'animate__slideInRight'],
				animationOut: ['animate__animated', 'animate__fadeOut'],
				dismiss: { duration: 6000, pauseOnHover: true, onScreen: true, showIcon: true, waitForAnimation: true },
			});
		});

		// User-specific events
		if (userData?.id) {
			socket.on(`user_${userData.id}`, (message) => {
				if (isDev) console.log(`ï¿½ user_${userData.id} event:`, message);
				showNotification('Personal Alert', message?.message || 'You have a new notification', 'info');
			});
		}

		// Role-specific events
		if (userData?.role) {
			socket.on(`role_${userData.role.toLowerCase()}`, (message) => {
				if (isDev) console.log(`ðŸ”‘ role_${userData.role.toLowerCase()} event:`, message);
				showNotification('Role Update', message?.message || 'New role-based notification', 'info');
			});
		}



		// MOCK DATA GENERATOR
		let mockInterval;
		if (MOCK_SOCKET) {
			console.log('âš ï¸ STARTING MOCK SOCKET DATA GENERATOR');
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


