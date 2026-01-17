# Halo v2: Sensor & Area API Specification

This document provides all the necessary details for backend developers to implement the API endpoints required by the Halo v2 frontend.

## 1. Overview
The frontend currently uses a mock-enabled architecture. The backend should implement the following RESTful endpoints to replace the mock data.

**Base URL Recommendation:** `/api/v1`

---

## 2. Data Models

### Area Entity
Areas are hierarchical. A top-level Area (e.g., "Building A") can have Sub-Areas or Rooms (e.g., "Conference Room").

```json
{
  "id": 1,
  "name": "North Wing",
  "parent_id": null,
  "floor_level": 1,
  "is_room": false,
  "sensor_count": 5,
  "subareas": [],
  "floor_plan_url": "https://example.com/map.png",
  "floor_plan_width": 1920,
  "floor_plan_height": 1080,
  "color": "#3366FF",
  "floor_height": 200
}
```

### Sensor Entity
Sensors are assigned to Areas. They contain both static registration data and real-time readings.

```json
{
  "id": "halo-01",
  "name": "Meeting Room Sensor",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "ip_address": "192.168.1.50",
  "area_id": 5,
  "floor_level": 1,
  "x_coordinate": 0.45,
  "y_coordinate": 0.32,
  "is_online": true,
  "is_active": true,
  "personnel_in_charge": "John Doe",
  "personnel_contact": "+123456789",
  "personnel_email": "john@example.com",
  "boundary": {
    "x_min": 0.4,
    "x_max": 0.5,
    "y_min": 0.3,
    "y_max": 0.4,
    "z_min": 0,
    "z_max": 100
  },
  "sensor_data": {
    "sensors": {
      "temp_c": 22.5,
      "humidity": 45,
      "co2": 800,
      "aqi": 55,
      "motion": 0,
      "noise": 40
    }
  }
}
```

---

## 3. Endpoints

### 3.1 Areas & Hierarchy

#### `GET /areas`
Fetch the complete hierarchy of areas.
- **Response**: `Array<Area>` (Nested objects via `subareas`)

#### `POST /areas/`
Create a new area or room.
- **Body**:
  ```json
  {
    "name": "Room 101",
    "parent_id": 1
  }
  ```

---

### 3.2 Sensor Management

#### `GET /sensors`
Fetch all sensors with optional filtering.
- **Query Params**:
  - `area_id`: Filter by area.
  - `is_active`: `true`/`false`.
- **Response**: `Array<Sensor>`

#### `GET /sensors/subareas/{subAreaId}/sensors/`
Fetch sensors specifically assigned to a subarea/room.
- **Response**: `Array<Sensor>`

#### `GET /devices/{id}/latest`
Fetch the most recent real-time readings for a specific sensor.
- **Response**: `Sensor` (Including `sensor_data` object)

#### `POST /sensors/`
Register a new sensor in the system.
- **Body**:
  ```json
  {
    "name": "New Sensor",
    "mac_address": "...",
    "ip_address": "...",
    "sensor_type": "HALO_SMART"
  }
  ```

#### `PATCH /sensors/{id}/`
Update sensor metadata, placement, or personnel.
- **Body (Partial)**:
  ```json
  {
    "x_coordinate": 0.55,
    "y_coordinate": 0.44,
    "personnel_in_charge": "Jane Smith",
    "area_id": 10
  }
  ```

---

### 3.3 Sensor Configurations (Thresholds)

#### `GET /sensors/{id}/configurations/`
Get specific alert rules/thresholds for a sensor.
- **Response**: `Array<SensorConfig>`

#### `POST /sensors/{id}/add_configuration/`
Add a new threshold rule.
- **Body**:
  ```json
  {
    "sensor_name": "temp_c",
    "enabled": true,
    "threshold": 30.0,
    "max_value": 40.0
  }
  ```

#### `PATCH /sensors/{id}/configurations/{config_id}/`
Update an existing threshold rule.

#### `DELETE /sensors/{id}/configurations/{config_id}/`
Remove a threshold rule.

---

## 4. Visualization Specification (2D & 3D)

### Normalized Coordinates
To ensure sensors stay in the same relative position regardless of the floor plan image size:
- **`x_coordinate`**: `0.0` (Left) to `1.0` (Right).
- **`y_coordinate`**: `0.0` (Top) to `1.0` (Bottom).

### 3D Boundaries
For 3D room visualization, the `boundary` object defines the physical volume the sensor monitors:
- `x_min/max`, `y_min/max`: Normalized range within the floor plan.
- `z_min/max`: Height range (usually `0` to `floor_height`).

### Floor Levels
- `floor_level`: Integer (e.g., `0` for ground, `1` for 1st floor).
- `floor_height`: Pixels/Units for rendering walls in 3D.

---

## 5. Real-time Updates
The frontend expects high-frequency updates (e.g., Motion, Air Quality) via:
1. **Long Polling / React Query**: Frequent calls to `/devices/{id}/latest`.
2. **WebSocket (Recommended)**: Push updates when `sensor_data` changes.
   - Message structure should match the `Sensor` or `SensorData` model.
