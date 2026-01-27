# HALO Real-Time Monitoring: Data Ingestion & Health

This document explains how HALO handles high-frequency data updates and system health observability.

---

## 1. The Theory: Pulsed Observability

Unlike static dashboards, the **Real-Time Monitoring** page is built to visualize data that changes every few seconds.
*   **Heartbeat**: A periodic "signal" sent by sensors to confirm they are still powered on and connected.
*   **Events**: Specific occurrences (Alerts) that trigger an immediate change in status.
*   **Data Ingestion**: The process of receiving raw metrics (Temperature, CO2, etc.) and converting them into human-readable charts.

---

## 2. Functional Logic: The Refresh Loop

The `SensorMonitoringDashboard.tsx` uses a **Polling** strategy to stay updated.

### Functional Flow:
1.  Frontend component mounts.
2.  `useHeartbeatStatus` and `useAllSensorsLatestData` start their initial fetch.
3.  **Polling Timer**: The hooks are configured with a `refetchInterval` (e.g., 5000ms).
4.  **Automatic UI Refresh**: When new data arrives, React re-renders only the changed numbers/badges, keeping the interface feeling "live."

### Code Snippet: Polling Configuration
```typescript
// Inside src/api/sensors.api.ts
export const useAllSensorsLatestData = () => {
    return useQuery({
        queryKey: ['allSensorsLatestData'],
        queryFn: fetchLatestData,
        refetchInterval: 5000, // Sync every 5 seconds
        staleTime: 3000        // Data is considered fresh for 3 seconds
    });
};
```

---

## 3. Services: The Health & Data Hooks

| Section | Hook Name | Responsible For |
| :--- | :--- | :--- |
| **Global Health** | `useDeviceHealth` | Returns overall system status (Healthy/Degraded). |
| **Connectivity** | `useHeartbeatStatus` | Calculates Total vs Online vs Offline counts. |
| **Activity** | `useActiveEvents` | Lists live alerts that haven't been resolved. |
| **Raw Metrics** | `useLatestReadings` | Shows the literal JSON data coming from the hardware. |

---

## 4. UI & State Updates: Feedback Loops

### The "Auto-Refresh" Indicator
In the UI, a pulsing green dot is rendered to tell the user that "Live Mode" is active.
*   **Logic**: If any monitoring query is `fetching`, the pulsing animation accelerates or shows a loading state.

### Progress Bars
Heartbeat status is visualized using the `Progress` component:
*   **Success (Green)**: Percentage of sensors **Online**.
*   **Danger (Red)**: Percentage of sensors **Offline**.
*   **Logic**: `(online_count / total_count) * 100`.

---

## 5. Behind the Scenarios: Heartbeat Failure

What happens when a sensor goes **Offline**?
1.  A sensor fails to send its heartbeat packet within the expected window (defined on the backend).
2.  The Backend marks the database record `is_online = false`.
3.  During the next frontend **Poll** (5 seconds later), `useHeartbeatStatus` receives the updated count.
4.  The Dashboard row for that sensor instantly flips to a **Red "Offline" badge**.
5.  An event is automatically added to the `ActiveEvents` list.

---
*HALO Technical Documentation - Monitoring Module*
