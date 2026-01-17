# HALO IoT Management System - User Guide

Welcome to the HALO IoT Management System. This guide outlines the system flow, core features, and role-based interactions for both Administrators and Viewers.

## 1. Access & Login
The system uses role-based access control (RBAC). You can log in using the following test credentials:

| Role | Email / Username | Password | User Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `password123` | Arun |
| **Viewer** | `viewer@gmail.com` | `password123` | Vimal |

---

## 2. Administrator Flow (The "Command Center")

As an Admin, your primary goal is to orchestrate the system setup and oversee global health.

### Step A: User Management
- **Navigate to**: `User Management` (from sidebar).
- **Actions**:
    - **Create Users**: Add new personnel and assign them the **'Viewer'** role.
    - **Assign Areas**: Search for a user and assign them specific zones (e.g., "Ground Floor A"). This determines what they see in their private dashboard.

### Step B: Area & Building Configuration
- **Navigate to**: `Sensors > Areas`.
- **Actions**:
    - **Hierarchy**: Create main Areas (Buildings/Floors) and nested Sub-Areas (Rooms/Zones).
    - **Personnel Assignment**: While creating an area, select **"Persons in Charge"** to link users to that physical space.
    - **Monitoring**: Icons in the tree view show assigned manager initials for quick accountability.

### Step C: 3D Sensor Placement
- **Navigate to**: `Sensors > Dashboard`.
- **Actions**:
    - **Drill Down**: Click into any Area or Sub-Area to enter the **3D View**.
    - **Place Sensors**: Click the "Edit" icon, drag sensors from the palette, and drop them onto the 3D floor plan.
    - **Draw Boundaries**: Select a placed sensor and hold `Shift + Drag` to draw its coverage volume. This helps visualize monitoring range in real-time.

---

## 3. Viewer Flow (The "Monitoring Dashboard")

As a Viewer (Person in Charge), your experience is tailored for simplified oversight and security.

### Step A: Personalized Dashboard
- **Login**: Use `john_doe`.
- **Auto-Redirect**: The system automatically detects your role and lands you on a **private dashboard**.
- **Data Filtering**: You will **only** see stats and charts for the Areas assigned to you by the Admin.

### Step B: jurisdictional Monitoring
- **Actions**:
    - **Drill Down**: Access the 3D floor plans for your specific rooms.
    - **Real-time Stats**: View active sensor counts and critical alerts specifically for your zone of responsibility.

---

## 4. Key Security Features
- **Route Guards**: Non-admin users are automatically blocked from accessing User Management or global configuration pages.
- **Bi-directional Linkage**: Managing personnel responsibility can be done from either the User's profile or the Area's settings.
- **3D Visualization**: Volumetric walls and pulsing status rings provide immediate situational awareness.