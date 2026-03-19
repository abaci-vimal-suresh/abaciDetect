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
					showNotification("Sensor Update", `${parsedMessage.type || 'Data received'}`, "info");
			}

			// Extract sensor ID from message
			const sensorId = String(parsedMessage.sensor_id || parsedMessage.id || parsedMessage.device_id || '');

			// Optimistic updates for received sensor data
			if (sensorId) {
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
			}

		} catch (err) {
			console.error('Error handling HALO sensor message:', err);
			showErrorNotification('Error processing sensor data');
		}
	}, [dispatch, showNotification, showSuccessNotification, showErrorNotification]);

	useEffect(() => {
		if (!user) return;

		// Read token from cookies
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
			query: {
				token: cookieToken,
			},
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			setIsOpen(true);

			// Subscribe to rooms
			socket.emit('subscribe', { room: 'broadcast' });

			if (userData?.id) {
				socket.emit('subscribe', { room: `user_${userData.id}` });
			}

			if (userData?.role) {
				socket.emit('subscribe', { room: `role_${userData.role.toLowerCase()}` });
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
			setIsOpen(false);
			showErrorNotification('Disconnected from HALO Sensor Network');
		});

		socket.on('connect_error', (err) => {
			console.error('Connection Error:', err.message);
		});

		socket.on('alert_created', (message) => {
			const notifData = message?.data ?? message;
			const bodyText = notifData.body ?? '';
			const msgSection = bodyText.match(/Message:\s*([\s\S]+)/)?.[1] ?? '';

			const parseField = (text, key) => {
				const m = text.match(new RegExp(`${key}:\\s*([^\\n|]+)`, 'i'));
				return m?.[1]?.trim() ?? undefined;
			};
			const parsePipe = (text, key) => {
				const m = text.match(new RegExp(`${key}:\\s*([^|\\n]+)`, 'i'));
				return m?.[1]?.trim() ?? undefined;
			};

			const curVal = parseFloat(parsePipe(msgSection, 'Value') || '0');
			const threshVal = parseFloat(parsePipe(msgSection, 'Threshold') || '0');
			const rawIntensity = threshVal > 0 ? curVal / threshVal : 1.0;
			const intensity = Math.max(1.0, Math.min(5.0, rawIntensity));

			const newNotification = {
				id: notifData.notification_id ?? notifData.id ?? Date.now(),
				title: notifData.title ?? 'New Alert',
				body: bodyText,
				type: notifData.type ?? 'ALERT',
				severity: notifData.severity ?? 'WARNING',
				severity_display: notifData.severity_display ?? notifData.severity ?? 'Warning',
				is_acknowledged_by_user: notifData.is_acknowledged ?? false,
				created_time: notifData.created_time ?? new Date().toISOString(),
				updated_time: notifData.updated_time ?? new Date().toISOString(),
				// Extract sensor_id if possible
				sensor_id: notifData.sensor_id ?? notifData.sensor ?? (bodyText ? (bodyText.match(/Sensor ID:\s*(\d+)/)?.[1]) : null),
				sensor_name: notifData.sensor_name ?? (bodyText ? (bodyText.match(/Sensor:\s*([^|#\n]+)/)?.[1]?.trim()) : null),
				// Enhanced fields for 3D Visualizer
				event_source: parsePipe(msgSection, 'Event Source') ?? parsePipe(msgSection, 'Source Type') ?? 'Unknown',
				current_value: curVal,
				threshold_value: threshVal,
				intensity: intensity,
				event_type: parseField(bodyText, 'Type') ?? notifData.title ?? 'Unknown',
				area_name: parseField(bodyText, 'Area') ?? null,
			};

			console.log('WebSocket: Alert Created Event Handled', {
				id: newNotification.id,
				sensor_id: newNotification.sensor_id,
				sensor_name: newNotification.sensor_name,
				data: notifData
			});

			// ─── 0. Sync Sensor Status in Cache ───────────────────────────────────────
			const sensorNameLower = newNotification.sensor_name?.toLowerCase();
			if (sensorNameLower) {
				const sensorsQueries = queryClient.getQueriesData({ queryKey: queryKeys.sensors.all });
				for (const [queryKey, oldData] of sensorsQueries) {
					if (!oldData) continue;

					const updateSensorInList = (list) => {
						return list.map(s => {
							if (s.name?.toLowerCase() === sensorNameLower) {
								return {
									...s,
									status: 'critical',
									alert_severity: newNotification.severity,
									last_alert_time: new Date().toISOString()
								};
							}
							return s;
						});
					};

					const revertSensorInList = (list) => {
						return list.map(s => {
							if (s.name?.toLowerCase() === sensorNameLower) {
								return {
									...s,
									status: 'safe'
								};
							}
							return s;
						});
					};

					// Apply Critical Status
					queryClient.setQueryData(queryKey, (old) => {
						if (!old) return old;
						if (Array.isArray(old)) return updateSensorInList(old);
						if (old.results) return { ...old, results: updateSensorInList(old.results) };
						return old;
					});

					// Revert after 30 seconds
					setTimeout(() => {
						queryClient.setQueryData(queryKey, (old) => {
							if (!old) return old;
							if (Array.isArray(old)) return revertSensorInList(old);
							if (old.results) return { ...old, results: revertSensorInList(old.results) };
							return old;
						});
					}, 30000);
				}
			}

			// ─── 1. Notification.tsx cache ────────────────────────────────────────────

			queryClient.setQueriesData(
				{ queryKey: ['adminNotifications'], exact: false },
				(oldData) => {
					if (!oldData) return oldData;
					if (Array.isArray(oldData)) {
						if (oldData.some((n) => n.id === newNotification.id)) return oldData;
						return [newNotification, ...oldData];
					}
					const results = oldData.results ?? [];
					if (results.some((n) => n.id === newNotification.id)) return oldData;
					return {
						...oldData,
						count: (oldData.count || 0) + 1,
						results: [newNotification, ...results],
					};
				}
			);

			// ─── 2. AlertHistory.tsx cache ────────────────────────────────────────────

			const parsedAlertId = parseInt(parseField(bodyText, 'Alert ID') ?? '0', 10) || Date.now();

			const rawAlert = {
				id: parsedAlertId,
				type: parseField(bodyText, 'Type') ?? notifData.title ?? 'Unknown',
				status: (parseField(bodyText, 'Status') ?? 'active').toLowerCase(),
				area_name: parseField(bodyText, 'Area') ?? null,
				sensor_name: parseField(bodyText, 'Sensor') ?? null,
				description: bodyText,
				source: parsePipe(msgSection, 'Source Type') ?? 'External',
				severity: notifData.severity ?? 'WARNING',
				severity_display: notifData.severity_display ?? notifData.severity ?? 'Warning',
				created_at: notifData.created_time ?? notifData.timestamp ?? new Date().toISOString(),
				updated_at: notifData.updated_time ?? new Date().toISOString(),
				remarks: null,
				alert_actions: [],
				recheck_next_trigger: false,
			};

			const cachedAlertQueries = queryClient.getQueriesData({ queryKey: queryKeys.alerts.lists() });

			for (const [queryKey, oldData] of cachedAlertQueries) {
				if (!oldData || typeof oldData !== 'object' || Array.isArray(oldData)) continue;

				const filtersArg = Array.isArray(queryKey) ? queryKey[2] : null;
				const f = filtersArg?.filters ?? filtersArg ?? {};
				const offset = f.offset ?? 0;
				const limit = f.limit ?? 10;

				const results = oldData.results ?? [];
				const alreadyPresent = results.some((a) => a.id === rawAlert.id);

				if (limit <= 2) {
					queryClient.setQueryData(queryKey, {
						...oldData,
						count: (oldData.count || 0) + 1,
					});
				} else if (offset === 0 && !alreadyPresent) {
					queryClient.setQueryData(queryKey, {
						...oldData,
						count: (oldData.count || 0) + 1,
						results: [rawAlert, ...results].slice(0, limit),
					});
				} else {
					queryClient.setQueryData(queryKey, {
						...oldData,
						count: (oldData.count || 0) + 1,
					});
				}
			}

			dispatch(addSensorAlert(newNotification));

			Store.addNotification({
				title: React.createElement(AlertToastTitle, { alert: newNotification }),
				message: React.createElement(AlertToastBody, { alert: newNotification }),
				type: notifData.severity === 'ERROR' ? 'danger' : notifData.severity === 'WARNING' ? 'warning' : 'info',
				insert: 'top',
				container: 'top-right',
				animationIn: ['animate__animated', 'animate__slideInRight'],
				animationOut: ['animate__animated', 'animate__fadeOut'],
				dismiss: { duration: 6000, pauseOnHover: true, onScreen: true, showIcon: true, waitForAnimation: true },
			});
		});

		if (userData?.id) {
			socket.on(`user_${userData.id}`, (message) => {
				showNotification('Personal Alert', message?.message || 'You have a new notification', 'info');
			});
		}

		if (userData?.role) {
			socket.on(`role_${userData.role.toLowerCase()}`, (message) => {
				showNotification('Role Update', message?.message || 'New role-based notification', 'info');
			});
		}

		return () => {
			if (pingIntervalRef.current) {
				clearInterval(pingIntervalRef.current);
			}
			socket.removeAllListeners();
			socket.disconnect();
			socketRef.current = null;
		};
	}, [user, userData?.username, handleSensorMessages]);

	return children;
};

export default WebsocketProvider;


