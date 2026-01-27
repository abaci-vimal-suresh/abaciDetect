# HALO Historical Log Actions: A Deep Dive

This document explains the technical architecture, states, and logic behind the **"Action C"** (Resolve) and **"Action D"** (Delete) buttons in the HALO Alert History.

---

## 1. The Theory: Reactive State Management

In modern web apps, we don't manually "delete a row" from the screen. Instead, we **change the data** and let the UI **react** to that change.

### Theory of the Loop:
1.  **State is Truth**: The UI (the table you see) is a direct reflection of the "Alerts State" stored in the application's memory.
2.  **Mutations are Intents**: Clicking "Resolve" or "Delete" is an **intent** to change that truth.
3.  **Synchronization**: The application sends this intent to the server (Backend). Once the server confirms, the application updates its local "truth" (the cache), and the screen automatically re-draws.

---

## 2. Main Functions: Who is responsible?

### A. The UI Component: `AlertHistory.tsx`
*   **Responsibility**: Rendering the table and capturing user clicks.
*   **Key Logic**:
    *   `columns`: Defines how data is displayed.
    *   `actions`: Defines the buttons.
        *   **CheckCircle (C)**: Calls `updateAlertMutation.mutate()`.
        *   **Delete (D)**: Calls `deleteAlertMutation.mutate()`.

### B. The Service Hooks: `src/api/sensors.api.ts`
*   **Responsibility**: Managing the lifecycle of the request.
*   **Key Hooks**:
    *   `useUpdateAlert`: Wraps the logic for sending a `PATCH` request to update an alert's status.
    *   `useDeleteAlert`: Wraps the logic for sending a `DELETE` request to remove an alert.
    
---

## 3. Core States: Behind the Scenarios

The system relies on **TanStack Query (React Query)** to handle these states:

| State Name | Location | Role |
| :--- | :--- | :--- |
| **Alerts Query State** | Global Cache | Stores the list of all alerts. This is what the table "subscribes" to. |
| **Mutation `isPending`** | Local Button | While the request is flying, this state is `true`. It can be used to show a loading spinner on the button. |
| **`USE_MOCK_DATA`** | API Service | A boolean toggle. If `true`, the system bypasses the real backend and updates a local variable (`mockAlerts`) for testing. |

---

## 4. Scenario Walk-through: Clicking "Action C" (Resolve)

Here is exactly what happens when you click the **CheckCircle**:

1.  **User Action**: You click the button.
2.  **Function Call**: The `onClick` handler identifies the `alertId` from the table row.
3.  **Mutation Phase**:
    *   `updateAlertMutation.mutate({ alertId, data: { status: 'resolved' } })` is triggered.
    *   The browser sends a network request (`PATCH api/devices/alerts/123/`).
4.  **Backend Scenario**:
    *   The server marks the alert as "Resolved" in the database.
    *   It records the timestamp of resolution.
5.  **Success Phase**:
    *   The server sends back `200 OK`.
    *   **The Magic Happens**: The `onSuccess` callback in `sensors.api.ts` runs:
        ```typescript
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        ```
6.  **UI Update**:
    *   React Query realizes the "Alerts" data is now old ("stale").
    *   It automatically re-fetches the list.
    *   The table sees the new list where `status` is now `Resolved`.
    *   The Badge color changes to Green, and the "Check" button disappears (because its `hidden` property becomes `true`).

---

## 5. Why do we do this? (Project Architecture)

*   **Single Source of Truth**: By forcing a re-fetch after a mutation, we ensure the UI never shows "fake" data that wasn't confirmed by the server.
*   **Separation of Logic**: The UI doesn't need to know how to talk to a database. It just says "I want to resolve this ID," and the API service handles the rest.
*   **Scalability**: If another user resolves an alert from a different computer, your dashboard will update the next time it refreshes because it always listens to the central "Alerts State."

---

## 6. Future Improvements (Roadmap)

To make this even better, the system could implement:
1.  **Optimistic Updates**: Change the UI *immediately* before the server responds, and "roll back" if the server fails. This makes the app feel lightning-fast.
2.  **WebSockets (Real-time)**: Instead of the UI asking for updates, the server "pushes" the update to all open dashboards instantly.
3.  **Backend Requirement**: A **Webhook System** that triggers a notification (Email/SMS) as soon as an alert is "Resolved" so relevant personnel know the issue is cleared.

---
*Technical Reference Document for HALO Dashboard V2*
