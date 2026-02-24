# WebSocket → Notification → AlertHistory: How It Works

## Overview

`WebSocket.js` is a **global provider** wrapping the entire app.  
When the backend emits `alert_created`, the event fans out to **two independent consumers** via the React Query cache — no direct imports, no props drilling.

```
Backend (Socket.io)
      │  event: "alert_created"
      ▼
WebsocketProvider  (WebSocket.js)
      │
      ├─ ① queryClient.setQueriesData(queryKeys.alerts.lists())
      │       → patches the alert cache (new alert prepended)
      │
      ├─ ② queryClient.invalidateQueries(['adminNotifications'])
      │       → marks the notification cache stale → triggers API refetch
      │
      ├─ ③ dispatch(addSensorAlert(newAlert))   → Redux
      │
      └─ ④ Store.addNotification(...)           → toast popup

             ┌─────────────────────────────────────────────────┐
             │               React Query Cache                 │
             │                                                 │
             │  queryKeys.alerts.lists()  ←── ①               │
             │  ['adminNotifications']    ←── ②               │
             └──────────────┬──────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                            ▼
    Notification.tsx                AlertHistory.tsx
    (Header drawer)                 (Full history page)
    useAdminNotifications()         useAlerts({ limit:1, offset:0 })
         │                               │
         │ re-fetches from API           │ allAlertsData changes
         │ → shows new notification      │
         │   in the drawer               └─ useEffect([allAlertsData])
                                               │
                                               └─ tableRef.current.onQueryChange()
                                                   → re-fetches paginated table
```

---

## Real Event Payload

```json
{
  "event": "alert_created",
  "data": {
    "notification_id": 27,
    "type": "TASK",
    "title": "Sensor Maintenance Required",
    "body": "Sensor #S001 in Building Floor 2 needs maintenance. Last calibration was 6 months ago.",
    "severity": "WARNING",
    "severity_display": "Warning",
    "is_acknowledged": false,
    "created_time": "2026-02-24T10:27:00.789012+00:00",
    "updated_time": "2026-02-24T10:27:00.789012+00:00"
  }
}
```

---

## Step-by-Step Breakdown

### 1. Socket Connection — `WebSocket.js`

On login, `WebsocketProvider` connects to Socket.io and subscribes to three rooms:

| Room | Who receives it |
|---|---|
| `broadcast` | All users — general events like `alert_created` |
| `user_<id>` | Per-user private notifications |
| `role_<role>` | Role-based events (admin / viewer) |

```js
socket.emit('subscribe', { room: 'broadcast' });
socket.emit('subscribe', { room: `user_${userData.id}` });
socket.emit('subscribe', { room: `role_${userData.role.toLowerCase()}` });
```

---

### 2. Receiving `alert_created` — `WebSocket.js` (line 175)

```js
socket.on('alert_created', (message) => {

    // ① Patch the alerts cache directly (no API round-trip needed)
    queryClient.setQueriesData(
        { queryKey: queryKeys.alerts.lists() },
        (oldData) => ({
            ...oldData,
            count: (oldData.count || 0) + 1,
            results: [newAlert, ...(oldData.results || [])],
        })
    );

    // ② Invalidate adminNotifications so Notification drawer refetches
    queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });

    // ③ Redux
    dispatch(addSensorAlert(newAlert));

    // ④ Rich toast popup
    Store.addNotification({ ... });
});
```

---

### 3. Notification Drawer — `Notification.tsx`

The header bell icon renders `Notifications`, which calls:

```ts
const { data } = useAdminNotifications({ acknowledged: ..., limit, offset: 0 });
```

This hook (`notification.api.ts`) is keyed under `['adminNotifications', 'list', ...]`.  
When step ② above invalidates `['adminNotifications']`, React Query **automatically refetches** the API endpoint `/administration/notifications/` and the drawer updates.

The payload fields used for display:

| Field | Used for |
|---|---|
| `type` | Icon + color (TASK → purple, ALERT → red, WARNING → amber…) |
| `severity` | Severity badge shown alongside the type |
| `title` | Bold notification title |
| `body` | Description text |
| `created_time` | Relative time + absolute time |
| `is_acknowledged` | Unread accent bar + "Acknowledge" button |

---

### 4. Alert History Table — `AlertHistory.tsx`

`AlertHistory` subscribes to the same alert cache (step ①):

```ts
const { data: allAlertsData } = useAlerts({ limit: 1, offset: 0 });
```

A `useEffect` watches for any change to `allAlertsData` and forces the `MaterialTable` to re-run its server-side paginated fetch:

```ts
useEffect(() => {
    if (allAlertsData && tableRef.current) {
        tableRef.current.onQueryChange(); // triggers fresh paginated API call
    }
}, [allAlertsData]);
```

---

## Why No Direct Coupling?

None of the three files import each other.  
They communicate through **two shared React Query cache namespaces**:

| Cache key | Publisher | Subscriber |
|---|---|---|
| `queryKeys.alerts.lists()` | `WebSocket.js` (setQueriesData) | `AlertHistory.tsx` (useAlerts) |
| `['adminNotifications']` | `WebSocket.js` (invalidateQueries) | `Notification.tsx` (useAdminNotifications) |

---

## File Reference

| File | Role |
|---|---|
| `src/WebsocketWrapper/WebSocket.js` | Socket.io connection, room subscriptions, cache writes, Redux, toasts |
| `src/layout/Header/Notification.tsx` | Bell drawer — reads `adminNotifications` cache, acknowledge actions |
| `src/pages/HALO/Alerts/AlertHistory.tsx` | Full table — reacts to alerts cache, paginated fetch |
| `src/api/notification.api.ts` | `useAdminNotifications`, `AdminNotification` type, acknowledge mutations |
| `src/api/sensors.api.ts` | `useAlerts`, `fetchAlertsPaginated` |
| `src/lib/queryClient.ts` | Shared `queryClient` + `queryKeys` factory |
| `src/store/sensorEventsSlice` | Redux slice for in-memory sensor/alert events |
