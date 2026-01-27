# HALO Team Management: Access & Organization

This document explains how HALO manages personnel, roles, and the grouping of users for facility oversight.

---

## 1. The Theory: Governance & Accountability

HALO follows a **Role-Based Access Control (RBAC)** model:
*   **Users**: Individuals who log into the dashboard.
*   **Roles**: Defined permissions (e.g., `Admin` can edit everything, `Viewer` is read-only).
*   **User Groups**: Logical clusters of users (e.g., "Night Shift Security") used for assigning responsibilities to specific Areas or Alert notifications.

---

## 2. Functional Logic: Group Membership

Managing who belongs to what group is handled by the **Manage Membership** pattern.

### Functional Flow:
1.  **Selection**: The admin opens the `ManageGroupMembersModal.tsx`.
2.  **Toggle**: Each user has a checkbox. The system maintains a temporary list of "ids-to-add" and "ids-to-remove".
3.  **Sync**: Clicking "Save" triggers a batch update to the backend.

### Code Snippet: State Synchronization
```typescript
// Inside ManageGroupMembersModal.tsx
const handleToggle = (userId: number) => {
    setSelectedIds(prev => 
        prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
};

const handleSave = () => {
    updateGroupMembers.mutate({ 
        groupId, 
        member_ids: selectedIds 
    });
};
```

---

## 3. Services: The People Hooks (`src/api/sensors.api.ts`)

| Area | Hook Name | Method | Payload Example |
| :--- | :--- | :--- | :--- |
| **All Users** | `useUsers` | `GET` | Returns list of all profiles. |
| **Add User** | `useAddUser` | `POST` | `{ "username": "...", "role": "admin" }` |
| **Groups** | `useUserGroups` | `GET` | Returns groups and their member counts. |
| **Membership** | `useUpdateUserGroup` | `PATCH` | `{ "member_ids": [4, 5, 8] }` |

---

## 4. UI & State Updates: The Experience

### The Profile Circle
The `UserListPage.tsx` generates a dynamic avatar:
*   **Function**: `rowData.username.charAt(0).toUpperCase()`
*   **State**: Background color is determined by `darkModeStatus`.

### Membership Counters
In `UserGroupsPage.tsx`, the member count is not just static text. It is a reactive state. 
*   If you add a member to "Security Group", the counter on the main list updates automatically because the `useUserGroups` query is invalidated and re-fetched.

---

## 5. Behind the Scenarios: Role Enforcement

1.  A user logs in. The backend returns their `role` (Admin/Viewer).
2.  The Frontend stores this in the `AuthContext`.
3.  Throughout the UI, buttons like "Delete" or "Add" check this state.
    *   **Logic**: `if (user.role !== 'admin') { return null; }`
4.  If a user tries to manually bypass this and call the API, the Backend returns a `403 Forbidden` error, which the `axiosInstance` captures and displays as a red toaster notification.

---
*HALO Technical Documentation - Team Module*
