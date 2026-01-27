# HALO Sensors Inventory: Technical Deep Dive

This document explains the technical lifecycle, functional logic, and state management of the Sensor Inventory system in HALO.

---

## 1. The Theory: Hardware-Software Digital Twin

In the HALO ecosystem, the **Sensor Inventory** serves as a digital twin for physical hardware. 
*   **Commissioning**: The process of taking a physical device (with a MAC address) and registering it into the system.
*   **Lifecycle States**: Sensors move between `Inactive` (Registered but not sending data), `Active` (Configured), and `Online/Offline` (Real-time heartbeat status).

---

## 2. Functional Logic: The Registration Wizard

The registration process is handled by `DeviceRegistration.tsx` using a multi-step form controlled by `react-hook-form`.

### Functional Flow:
1.  **Step 1 (Basic Info)**: Captures `name` and `sensor_type`.
2.  **Step 2 (Network)**: Captures `mac_address` (Primary Key for hardware) and `ip_address`.
3.  **Step 3 (Review)**: Final confirmation.

### Code Snippet: The Mutation Logic
```typescript
// Inside DeviceRegistration.tsx
const onSubmit = (data: SensorRegistrationData) => {
    registerSensorMutation.mutate(data, {
        onSuccess: () => {
            reset(); // Clear form
            onSuccess(); // Close modal and refresh list
        }
    });
};
```

---

## 3. Services: The API Bridge (`src/api/sensors.api.ts`)

| Function | Hook Name | Purpose | Data Scenario |
| :--- | :--- | :--- | :--- |
| **Fetch** | `useSensors` | Retrieves the inventory list. | Supports server-side search and status filters. |
| **Create** | `useRegisterSensor` | Sends `POST /api/devices/sensors/`. | Creates a new entry in the DB with `is_active: false`. |
| **Trigger** | `useTriggerSensor` | Sends `POST /api/devices/trigger/`. | Sends a "Bolt" pulse to the physical IP to test connectivity. |
| **Delete** | `useDeleteSensor` | Sends `DELETE /api/devices/sensors/{id}`. | Permanently removes the record. |

---

## 4. UI & State Updates: How the screen reacts

### The "Reactive Table" Pattern
The `SensorList.tsx` component uses a pattern called **Query Invalidation**.

1.  **Action**: User clicks "Delete".
2.  **Execution**: `deleteSensorMutation.mutate(id)`.
3.  **Background**: Axios sends the request. React Query sets `isLoading: true`.
4.  **Completion**: On `200 OK`, we trigger:
    ```typescript
    queryClient.invalidateQueries({ queryKey: ['sensors'] });
    ```
5.  **Reaction**: The table detects the "sensors" data is old, automatically re-fetches, and the deleted row disappears without a page reload.

### Status Indicators
The UI uses `sensorStatus.utils.ts` to transform raw booleans into visual cues:
*   `is_active = true`: Shows a Blue "Active" badge.
*   `is_online = true`: Shows a Green "Online" dot with a CSS **Pulse Animation**.

---

## 5. Behind the Scenarios: Real-time Sync

When a sensor is triggered via the **"Bolt" icon**:
1.  Frontend checks if `ip_address` exists.
2.  `useTriggerSensor` sends the event to the backend.
3.  The Backend acts as a bridge, sending a UDP/TCP command to the physical sensor at that IP.
4.  If successful, the UI shows a "Triggered Successfully" toaster notification.

---
*HALO Technical Documentation - Sensors Module*
