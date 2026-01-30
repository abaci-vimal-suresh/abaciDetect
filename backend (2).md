# HALO ABACI - API Documentation

**Base URL:** `http://localhost:8000/api/`

**Version:** 1.0  
**Last Updated:** January 20, 2026

---

## Authentication & Authorization

### JWT Cookie Authentication
All protected endpoints use **JWT Token-based authentication via HttpOnly cookies**.

**How to Authenticate:**
1. Login using `/api/users/login/` endpoint
2. Receive `access_token` and `refresh_token` in HttpOnly cookies
3. Include cookies automatically with subsequent requests

**Cookie Details:**
- `access_token`: Valid for 1 hour
- `refresh_token`: Valid for 7 days
- Both stored as HttpOnly (secure against XSS)

### User Roles & Permissions

| Role | Admin CRUD | View Only | Create Users | Login |
|------|-----------|----------|--------------|-------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Viewer | ❌ | ✅ | ❌ | ✅ |

- **Admin**: Full CRUD access (Create, Read, Update, Delete)
- **Viewer**: Read-only access (GET requests only)
- **Data Ingestion**: Public access (for device sensors)

---

## Table of Contents
1. [Authentication](#authentication--authorization)
2. [Users API](#users-api)
3. [Devices API](#devices-api)
4. [Administration API](#administration-api)
   - [Areas](#areas)
   - [Alerts](#alerts)
   - [Alert Filters](#alert-filters)
   - [Actions](#actions)
5. [Error Handling](#error-handling)
6. [Status Codes](#status-codes)

---

## Users API

Base URL: `/api/users/`

### Login & Authentication

#### User Login
```
POST /api/users/login/
Content-Type: application/json

{
  "username": "john_admin",
  "password": "securepassword123"
}
```

**Authentication:** ❌ Not required  
**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "username": "john_admin",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "is_active": true
  },
  "message": "Login successful"
}
```

**Cookies Set:**
- `access_token` (HttpOnly, 1 hour expiry)
- `refresh_token` (HttpOnly, 7 days expiry)

---

#### User Logout
```
POST /api/users/logout/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Response:** `200 OK`
```json
{
  "detail": "User logged out successfully"
}
```

**Cookies Cleared:**
- `access_token`
- `refresh_token`

---

#### Refresh Access Token
```
POST /api/users/token/refresh/
Content-Type: application/json

{
  "refresh": "your_refresh_token"  # Optional - can also use cookie
}
```

**Authentication:** ❌ Not required  
**Response:** `200 OK`
```json
{
  "access": "new_access_token",
  "message": "Token refreshed successfully"
}
```

---

### User Profiles

#### List All User Profiles
```
GET /api/users/profiles/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `role` - Filter by role: `admin`, `viewer`
- `is_active` - Filter by status: `true`, `false`
- `search` - Search by username, email, or role

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "username": "john_admin",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "is_active": true,
    "groups": [
      {
        "id": 1,
        "name": "Security Team",
        "description": "Security personnel"
      }
    ],
    "created_at": "2026-01-16T10:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
]
```

#### Get User Profile by ID
```
GET /api/users/profiles/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK` - Returns single profile object

#### Create User Profile
```
POST /api/users/create/
Content-Type: application/json

{
  "username": "jane_viewer",
  "email": "jane@example.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "viewer"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`
```json
{
  "id": 2,
  "username": "jane_viewer",
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "viewer",
  "message": "User 'jane_viewer' created successfully"
}
```

#### Update User Profile
```
PUT /api/users/profiles/{id}/
PATCH /api/users/profiles/{id}/
Content-Type: application/json

{
  "role": "admin",
  "is_active": true,
  "email": "newemail@example.com"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete User Profile (Soft Delete)
```
DELETE /api/users/profiles/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`
```json
{
  "detail": "User 'jane_viewer' has been deactivated"
}
```

---

### User Groups

#### List All User Groups
```
GET /api/users/groups/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `search` - Search by group name or description

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Security Team",
    "description": "Security and surveillance personnel",
    "members": [...],
    "member_count": 5,
    "created_at": "2026-01-16T10:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
]
```

#### Get User Group by ID
```
GET /api/users/groups/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`

#### Create User Group
```
POST /api/users/groups/
Content-Type: application/json

{
  "name": "Maintenance Team",
  "description": "Building maintenance staff"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`

#### Update User Group
```
PUT /api/users/groups/{id}/
PATCH /api/users/groups/{id}/
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Add Members to Group
```
POST /api/users/groups/{id}/add_members/
Content-Type: application/json

{
  "member_ids": [4, 5, 6]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Remove Members from Group
```
POST /api/users/groups/{id}/remove_members/
Content-Type: application/json

{
  "member_ids": [4, 5]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete User Group
```
DELETE /api/users/groups/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `204 No Content`

---

### Current User Profile

#### Get Current User's Profile
```
GET /api/users/profile/me/
```

**Authentication:** ✅ Required (JWT Cookie)

**Response:** `200 OK`

#### Update Current User's Profile
```
PUT /api/users/profile/me/
PATCH /api/users/profile/me/
Content-Type: application/json

{
  "email": "newemail@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Authentication:** ✅ Required (JWT Cookie)

**Note:** Users can only update their own email and name, not their role.

**Response:** `200 OK`

---

### Change Password

#### Change Current User's Password
```
PUT /api/users/change-password/
Content-Type: application/json

{
  "old_password": "currentpassword123",
  "new_password": "newpassword456"
}
```

**Authentication:** ✅ Required (JWT Cookie)

**Validation Rules:**
- Old password must be correct
- New password must be at least 8 characters
- Both fields are required

**Response:** `200 OK`
```json
{
  "detail": "Password changed successfully"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "detail": "Old password is incorrect"
}
```

---

## Devices API

Base URL: `/api/devices/`

### Sensors

#### List All Sensors
```
GET /api/devices/sensors/?limit=10&offset=0
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `limit` (optional, default: 10) - Number of results to return (max 100)
- `offset` (optional, default: 0) - Number of results to skip
- `sensor_type` - Filter by type
- `is_active` - Filter by status
- `is_online` - Filter by online status
- `area` - Filter by area ID
- `search` - Search by name, description, mac_address, ip_address
- `ordering` - Order by field (created_at, name, is_active, sensor_type)

**Response:** `200 OK`
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/devices/sensors/?limit=10&offset=10",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Sensor-001",
      "sensor_type": "HALO_3C",
      "description": "Temperature and air quality sensor",
      "is_active": true,
      "is_online": true,
      "ip_address": "192.168.1.100",
      "mac_address": "AA:BB:CC:DD:EE:01",
      "username": "sensor_user",
      "password": "sensor_pass",
      "area": 1,
      "area_name": "Building A",
      "sensor_groups": [
        {
          "id": 1,
          "name": "Office Sensors",
          "description": "Sensors in office spaces"
        }
      ],
      "has_configurations": true,
      "positioning": {
        "x_val": 10.5,
        "y_val": 20.3,
        "z_val": 1.5
      },
      "boundary": {
        "x_min": 0.0,
        "y_min": 0.0,
        "x_max": 50.0,
        "y_max": 50.0,
        "z_min": 0.0,
        "z_max": 3.0,
        "boundary_opacity_val": 0.5
      },
      "spherical": {
        "radius": 5.0,
        "hemisphere_opacity_val": 0.5
      },
      "created_at": "2026-01-16T10:00:00Z",
      "updated_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

#### Get Sensor by ID
```
GET /api/devices/sensors/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`

#### Create Sensor
```
POST /api/devices/sensors/
Content-Type: application/json

{
  "name": "Sensor-002",
  "sensor_type": "HALO_IOT",
  "description": "Environmental monitoring sensor",
  "is_active": true,
  "ip_address": "192.168.1.102",
  "mac_address": "AA:BB:CC:DD:EE:02",
  "username": "sensor_user",
  "password": "sensor_pass",
  "area": 1,
  "sensor_group_ids": [1, 2],
  "x_val": 15.0,
  "y_val": 25.0,
  "z_val": 1.5,
  "radius": 5.0
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Request Parameters:**
- `name` (required) - Sensor name/identifier
- `sensor_type` (required) - Sensor type (HALO_3C, HALO_IOT, HALO_SMART, HALO_CUSTOM)
- `description` (optional) - Detailed description of the sensor
- `is_active` (optional, default: true) - Whether sensor is active
- `ip_address` (optional) - IP address of the sensor
- `mac_address` (optional) - MAC address (unique identifier)
- `username` (optional) - Authentication username for sensor
- `password` (optional) - Authentication password for sensor
- `area` (optional) - Area ID where sensor is deployed
- `sensor_group_ids` (optional) - Array of sensor group IDs to add sensor to
- `x_val`, `y_val`, `z_val` (optional) - Position coordinates
- `radius` (optional) - Spherical coverage radius

**Response:** `201 Created`

#### Update Sensor
```
PUT /api/devices/sensors/{id}/
PATCH /api/devices/sensors/{id}/
Content-Type: application/json

{
  "description": "Updated description",
  "area": 2,
  "is_online": true,
  "sensor_group_ids": [2, 3]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Request Parameters (all optional):**
- `name` - Sensor name/identifier
- `sensor_type` - Sensor type (HALO_3C, HALO_IOT, HALO_SMART, HALO_CUSTOM)
- `description` - Detailed description
- `is_active` - Whether sensor is active
- `is_online` - Whether sensor is currently online
- `ip_address` - IP address
- `mac_address` - MAC address
- `username` - Authentication username
- `password` - Authentication password
- `area` - Area ID where sensor is deployed
- `sensor_group_ids` - Array of sensor group IDs. If provided, sensor will be removed from old groups and added to new ones
- `x_val`, `y_val`, `z_val` - Position coordinates
- Boundary fields: `x_min`, `y_min`, `x_max`, `y_max`, `z_min`, `z_max`, `boundary_opacity_val`
- Spherical fields: `radius`, `hemisphere_opacity_val`

**Response:** `200 OK`

#### Delete Sensor
```
DELETE /api/devices/sensors/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`
```json
{
  "detail": "Sensor \"Sensor-001\" has been successfully deleted."
}
```
### sensor config choices

SENSOR_CONFIG_CHOICES = [
        # Temperature & Humidity
        ('temp_c', 'Temperature (Celsius)'),
        ('temp_f', 'Temperature (Fahrenheit)'),
        ('humidity', 'Humidity (%)'),
        
        # Air Quality & Particles
        ('pm1', 'Particulate Matter 1µm'),
        ('pm10', 'Particulate Matter 10µm'),
        ('pm25', 'Particulate Matter 2.5µm'),
        ('tvoc', 'Total Volatile Organic Compounds'),
        ('co2', 'Carbon Dioxide (ppm)'),
        ('co', 'Carbon Monoxide (ppm)'),
        ('no2', 'Nitrogen Dioxide (ppb)'),
        ('nh3', 'Ammonia (ppb)'),
        
        # AQI Indices
        ('aqi', 'Air Quality Index'),
        ('pm10aqi', 'PM10 AQI'),
        ('pm25aqi', 'PM2.5 AQI'),
        ('coaqi', 'CO AQI'),
        ('no2aqi', 'NO2 AQI'),
        
        # Environmental
        ('light', 'Light Level (lux)'),
        ('pressure_hpa', 'Atmospheric Pressure (hPa)'),
        
        # Audio & Motion
        ('noise', 'Noise Level (dB)'),
        ('motion', 'Motion Detection'),
        ('aggression', 'Aggression Detection'),
        ('gunshot', 'Gunshot Detection'),
        
        # Health Indices
        ('health_index', 'Overall Health Index'),
        ('hi_co2', 'CO2 Health Index'),
        ('hi_hum', 'Humidity Health Index'),
        ('hi_pm1', 'PM1 Health Index'),
        ('hi_pm10', 'PM10 Health Index'),
        ('hi_pm25', 'PM2.5 Health Index'),
        ('hi_tvoc', 'TVOC Health Index'),
        ('hi_no2', 'NO2 Health Index'),
    ]

#### Add Sensor Configuration
```
POST /api/devices/sensors/{id}/add_configuration/
Content-Type: application/json

{
        "sensor_name": "temp_c",
        "enabled": true,
        "min_value": -10.0,
        "threshold": 25.0,
        "max_value": 50.0,
    }
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Request Parameters:**
- `sensor_name` (required) - Configuration name for the sensor parameter
- `sensor_type` (required) - Type of sensor (TEMPERATURE, HUMIDITY, CO2, PM2.5, etc.)
- `unit` (optional) - Measurement unit (°C, %, ppm, µg/m³, etc.)
- `description` (optional) - Description of the sensor configuration
- `threshold` (optional) - Threshold value for alerts
- `min_value` (optional) - Minimum acceptable value
- `max_value` (optional) - Maximum acceptable value

**Response:** `201 Created`
```json
{
  "id": 1,
  "sensor_name": "temperature",
  "threshold": 25.0,
  "min_value": -10.0,
  "max_value": 50.0,
  "created_at": "2026-01-27T10:05:00Z",
  "updated_at": "2026-01-27T10:05:00Z"
}
```

**Error Response (Duplicate Configuration):** `409 Conflict`
```json
{
  "error": "Configuration for \"temperature\" already exists for this sensor"
}
```

---

#### Get Sensor Configurations
```
GET /api/devices/sensors/{id}/configurations/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "sensor_name": "temperature",
    "enabled":"True",
    "threshold": 25.0,
    "min_value": -10.0,
    "max_value": 50.0,
    "created_at": "2026-01-27T10:05:00Z",
    "updated_at": "2026-01-27T10:05:00Z"
  },
  
]
```

**Response (No Configurations):** `200 OK`
```json
[]
```

---

#### Update Sensor Configuration
```
PATCH /api/devices/sensors/{id}/update_configuration/?config_id=1
Content-Type: application/json

{
  "threshold": 28.0,
  "description": "Updated temperature sensor"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Query Parameters:**
- `config_id` (required) - ID of the configuration to update

**Request Parameters (all optional):**
- `sensor_name` - Configuration name for the sensor parameter
- `sensor_type` - Type of sensor (TEMPERATURE, HUMIDITY, CO2, etc.)
- `unit` - Measurement unit (°C, %, ppm, µg/m³, etc.)
- `description` - Description of the sensor configuration
- `threshold` - Threshold value for alerts
- `min_value` - Minimum acceptable value
- `max_value` - Maximum acceptable value

**Response:** `200 OK`
```json
{
  "id": 1,
  "sensor_name": "temperature",
  "sensor_type": "TEMPERATURE",
  "unit": "°C",
  "description": "Updated temperature sensor",
  "threshold": 28.0,
  "min_value": -10.0,
  "max_value": 50.0,
  "created_at": "2026-01-27T10:05:00Z",
  "updated_at": "2026-01-27T10:15:00Z"
}
```

**Error Responses:**

Missing config_id: `400 Bad Request`
```json
{
  "error": "config_id query parameter is required"
}
```

Configuration not found: `404 Not Found`
```json
{
  "error": "Configuration with id 999 not found"
}
```

Duplicate sensor_name: `409 Conflict`
```json
{
  "error": "Configuration for \"temperature\" already exists for this sensor"
}
```

---

#### Delete Sensor Configuration
```
DELETE /api/devices/sensors/{id}/delete_configuration/?config_id=1
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Query Parameters:**
- `config_id` (required) - ID of the configuration to delete

**Response:** `200 OK`
```json
{
  "detail": "Configuration \"temperature\" has been successfully deleted."
}
```

**Error Responses:**

Missing config_id: `400 Bad Request`
```json
{
  "error": "config_id query parameter is required"
}
```

Configuration not found: `404 Not Found`
```json
{
  "error": "Configuration with id 999 not found"
}
```

---

### Sensor Groups

#### List All Sensor Groups
```
GET /api/devices/sensor-groups/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `search` - Search by name or description

**Response:** `200 OK`

#### Get Sensor Group by ID
```
GET /api/devices/sensor-groups/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`

#### Create Sensor Group
```
POST /api/devices/sensor-groups/
Content-Type: application/json

{
  "name": "Office Sensors",
  "description": "Sensors in office spaces"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`

#### Update Sensor Group
```
PUT /api/devices/sensor-groups/{id}/
PATCH /api/devices/sensor-groups/{id}/
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

**Authentication:** ✅ Required (JWT Cookie)    
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete Sensor Group
```
DELETE /api/devices/sensor-groups/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

---

### Sensor Configuration

#### Get Sensor Configuration
```
GET /api/devices/sensor-config/?sensor_type=HALO_3C
```

**Authentication:** ❌ Not required (Public)

**Query Parameters:**
- `sensor_type` (required) - Sensor type code: `HALO_3C`, `HALO_IOT`, `HALO_SMART`, `HALO_CUSTOM`

**Response:** `200 OK`
```json
{
  "success": true,
  "sensor_type": "HALO_3C",
  "data": {
    "model_name": "HALO 3C",
    "description": "HALO 3C air quality sensor",
    "metadata": {
      "version": "1.0",
      "last_updated": "2026-01-16"
    },
    "available_sensors": [
      {
        "sensor_name": "temperature",
        "sensor_type": "TEMPERATURE",
        "unit": "°C",
        "description": "Room temperature sensor",
        "threshold": 25.0,
        "min_value": -10.0,
        "max_value": 50.0
      },
      {
        "sensor_name": "humidity",
        "sensor_type": "HUMIDITY",
        "unit": "%",
        "description": "Room humidity sensor",
        "threshold": 60.0,
        "min_value": 0.0,
        "max_value": 100.0
      },
      {
        "sensor_name": "co2",
        "sensor_type": "CO2",
        "unit": "ppm",
        "description": "Carbon dioxide concentration",
        "threshold": 1000.0,
        "min_value": 0.0,
        "max_value": 5000.0
      }
    ]
  },
  "sensor_count": 3,
  "timestamp": "2026-01-27T10:05:00Z"
}
```

#### List Available Sensor Configuration Types
```
GET /api/devices/sensor-config/types/
```

**Authentication:** ❌ Not required (Public)

**Response:** `200 OK`
```json
{
  "success": true,
  "total_types": 4,
  "available_types": [
    {
      "sensor_type": "HALO_3C",
      "file_name": "Halo_3c",
      "sensor_count": 3,
      "model_name": "HALO 3C",
      "description": "HALO 3C air quality sensor",
      "version": "1.0",
      "api_url": "/api/devices/sensor-config/?sensor_type=HALO_3C"
    },
    {
      "sensor_type": "HALO_IOT",
      "file_name": "Halo_iot",
      "sensor_count": 5,
      "model_name": "HALO IOT",
      "description": "HALO IOT smart sensor",
      "version": "2.0",
      "api_url": "/api/devices/sensor-config/?sensor_type=HALO_IOT"
    },
    {
      "sensor_type": "HALO_SMART",
      "file_name": "Halo_smart",
      "sensor_count": 4,
      "model_name": "HALO SMART",
      "description": "HALO SMART advanced sensor",
      "version": "1.5",
      "api_url": "/api/devices/sensor-config/?sensor_type=HALO_SMART"
    },
    {
      "sensor_type": "HALO_CUSTOM",
      "file_name": "Halo_custom",
      "sensor_count": 6,
      "model_name": "HALO CUSTOM",
      "description": "HALO CUSTOM configurable sensor",
      "version": "1.0",
      "api_url": "/api/devices/sensor-config/?sensor_type=HALO_CUSTOM"
    }
  ],
  "timestamp": "2026-01-27T10:05:00Z"
}
```

---

### Sensor Readings

#### List All Sensor Readings
```
GET /api/devices/readings/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ Authenticated users

**Query Parameters:**
- `device_name` - Filter by device name
- `mac_address` - Filter by MAC address

**Response:** `200 OK`

#### Get Reading by ID
```
GET /api/devices/readings/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ Authenticated users

**Response:** `200 OK`

---

### Heartbeat Logs

#### List All Heartbeats
```
GET /api/devices/heartbeats/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ Authenticated users

**Query Parameters:**
- `device_name` - Filter by device name
- `mac_address` - Filter by MAC address
- `is_online` - Filter by online status

**Response:** `200 OK`

#### Get Heartbeat by ID
```
GET /api/devices/heartbeats/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ Authenticated users

**Response:** `200 OK`

---

### Sensor Alerts

#### List All Alerts
```
GET /api/devices/alerts/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `type` - Filter by alert type
- `status` - Filter by alert status (active, acknowledged, resolved, dismissed, suspended)
- `sensor` - Filter by sensor ID
- `area` - Filter by area ID
- `search` - Search in type, sensor name, area name, description

**Response:** `200 OK`

---

#### Get Alert by ID
```
GET /api/devices/alerts/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`
```json
{
  "id": 1,
  "type": "high_co2",
  "status": "active",
  "description": "CO2 levels exceeded threshold of 1000 ppm",
  "remarks": "Needs ventilation",
  "sensor": {
    "id": 1,
    "name": "Sensor-001"
  },
  "area": {
    "id": 1,
    "name": "Office Building A"
  },
  "user_acknowledged": null,
  "time_of_acknowledgment": null,
  "created_at": "2026-01-23T10:05:00Z",
  "updated_at": "2026-01-23T10:05:00Z"
}
```

---

#### Create Alert
```
POST /api/devices/alerts/
Content-Type: application/json

{
  "type": "high_temperature",
  "status": "active",
  "description": "Temperature exceeded safe threshold",
  "remarks": "Check HVAC system",
  "sensor": 1,
  "area": 1
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`

---

#### Update Alert
```
PUT /api/devices/alerts/{id}/
PATCH /api/devices/alerts/{id}/
Content-Type: application/json

{
  "status": "acknowledged",
  "remarks": "Issue resolved, HVAC serviced",
  "user_acknowledged": 1
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

---

#### Delete Alert
```
DELETE /api/devices/alerts/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `204 No Content`

---

#### Get Alert Trends
```
GET /api/devices/alerts/trends/?period=24h
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `period` - Time period for trends (required)
  - `24h` - Last 24 hours (hourly intervals)
  - `7d` - Last 7 days (daily intervals)
  
- `type` - Filter by alert type (optional)
- `status` - Filter by alert status (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "interval": "hour",
    "chart_data": {
      "labels": [
        "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
        "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
        "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
        "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
      ],
      "values": [2, 3, 1, 0, 2, 4, 5, 3, 2, 1, 3, 4, 5, 6, 4, 3, 2, 1, 2, 3, 4, 2, 1, 0]
    }
  }
}
```

**Examples:**

Get 7-day alert trends:
```
GET /api/devices/alerts/trends/?period=7d
```

Response (7 days):
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "interval": "day",
    "chart_data": {
      "labels": ["01-17", "01-18", "01-19", "01-20", "01-21", "01-22", "01-23"],
      "values": [12, 15, 8, 10, 14, 9, 11]
    }
  }
}
```

Get trends filtered by alert type and status:
```
GET /api/devices/alerts/trends/?period=24h&type=high_co2&status=active
```

---

### Halo Data Ingestion (Public)

These endpoints are public for device sensors to send data.

#### Receive Halo Data
```
POST /api/devices/halo/data/
Content-Type: application/json

{
  "device": "Sensor-001",
  "mac": "AA:BB:CC:DD:EE:01",
  "ip": "192.168.1.100",
  "time": "2026-01-16T10:05:00Z",
  "sensors": {
    "temp_c": 22.5,
    "humidity": 45.0,
    "co2": 400
  }
}
```

**Authentication:** ❌ Not required (Public)

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "Data received",
  "reading_id": 12345
}
```

---

#### Heartbeat (Device Keep-Alive)
```
GET /api/devices/halo/heartbeat/?device=Sensor-001&mac=AA:BB:CC:DD:EE:01&ip=192.168.1.100
```

Or POST:
```
POST /api/devices/halo/heartbeat/
Content-Type: application/json

{
  "device": "Sensor-001",
  "mac": "AA:BB:CC:DD:EE:01",
  "ip": "192.168.1.100"
}
```

**Authentication:** ❌ Not required (Public)

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Heartbeat received",
  "sensor_id": 1,
  "device_name": "Sensor-001"
}
```

---

#### Health Check
```
GET /api/devices/health/
```

**Authentication:** ❌ Not required (Public)

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "database": "connected",
  "total_sensors": 10,
  "active_sensors": 8,
  "online_sensors": 9
}
```

---

#### Get Active Events
```
GET /api/devices/events/active/
```

**Authentication:** ❌ Not required (Public)

**Response:** `200 OK`
```json
{
  "active_events": [
    {
      "reading_id": 1,
      "device": "Sensor-001",
      "ip": "192.168.1.100",
      "mac": "AA:BB:CC:DD:EE:01",
      "events": ["high_co2", "high_humidity"],
      "timestamp": "2026-01-16T10:05:00Z"
    }
  ],
  "total_events": 1
}
```

---

#### List Devices
```
GET /api/devices/list/
```

**Authentication:** ❌ Not required (Public)

**Response:** `200 OK`
```json
{
  "devices": [
    {
      "name": "Sensor-001",
      "mac": "AA:BB:CC:DD:EE:01",
      "ip": "192.168.1.100"
    }
  ]
}
```

---

#### Get Latest Readings
```
GET /api/devices/readings/latest/?limit=10
```

**Authentication:** ❌ Not required (Public)

**Response:** `200 OK`

---

#### Trigger Sensor Event (Testing)
```
POST /api/devices/trigger/
Content-Type: application/json

{
  "event": "gunshot",
  "ip_address": "192.168.1.100",
  "test": 1
}
```

**Authentication:** ❌ Not required (Public)

**Response:** `200 OK`
```json
{
  "status": "success",
  "event": "gunshot",
  "sensor_ip": "192.168.1.100",
  "response": "Event triggered"
}
```

---

## Administration API

Base URL: `/api/administration/`

### Areas

#### List All Areas
```
GET /api/administration/areas/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `area_type` - Filter by type: `room`, `corridor`, `floor`, `building`, `others`
- `parent_id` - Filter by parent area
- `search` - Search by area name
- `include_subareas` - Include nested subareas: `true`, `false`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Building A",
    "area_type": "building",
    "parent_id": null,
    "sensor_count": 25,
    "subareas": [],
    "offset_x": 0.0,
    "offset_y": 0.0,
    "offset_z": 0.0,
    "scale_factor": 1.0,
    "area_plan": null,
    "person_in_charge": [],
    "created_at": "2026-01-16T10:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
]
```

#### Get Area by ID
```
GET /api/administration/areas/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `include_subareas` - Include nested subareas: `true`, `false`

**Response:** `200 OK`

#### Create Area
```
POST /api/administration/areas/
Content-Type: multipart/form-data

{
  "name": "Building B",
  "area_type": "building",
  "parent_id": null,
  "offset_x": 50.0,
  "offset_y": 0.0,
  "offset_z": 0.0,
  "scale_factor": 1.0,
  "area_plan": <file>,
  "person_in_charge_ids": [1, 2]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`

#### Update Area
```
PUT /api/administration/areas/{id}/
PATCH /api/administration/areas/{id}/
Content-Type: multipart/form-data

{
  "name": "Building B - Updated",
  "area_type": "building",
  "area_plan": <file>
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete Area
```
DELETE /api/administration/areas/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

---

### Alerts

#### List All Alerts
```
GET /api/administration/alerts/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `status` - Filter by status: `active`, `acknowledged`, `resolved`, `dismissed`, `suspended`
- `type` - Filter by alert type: `sensor_offline`, `threshold_exceeded`, `anomaly_detected`, `device_error`, `high_air_quality`, `motion_detected`, `aggression_detected`, `gunshot_detected`
- `sensor_id` - Filter by sensor
- `area_id` - Filter by area
- `search` - Search by description

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "type": "threshold_exceeded",
    "status": "active",
    "description": "AQI level exceeded safe threshold",
    "remarks": "Additional notes about the alert",
    "sensor": {
      "id": 1,
      "name": "HaloSensor_Room101"
    },
    "area": {
      "id": 1,
      "name": "Building A / Floor 1 / Room 101"
    },
    "user_acknowledged": null,
    "time_of_acknowledgment": null,
    "created_at": "2026-01-29T10:30:00Z",
    "updated_at": "2026-01-29T10:30:00Z"
  }
]
```

#### Get Alert by ID
```
GET /api/administration/alerts/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`

#### Acknowledge Alert
```
POST /api/administration/alerts/{id}/acknowledge/
Content-Type: application/json

{
  "remarks": "Issue noted, investigating"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`
```json
{
  "status": "acknowledged",
  "user_acknowledged": "john_admin",
  "time_of_acknowledgment": "2026-01-29T10:35:00Z",
  "remarks": "Issue noted, investigating"
}
```

#### Update Alert Status
```
PATCH /api/administration/alerts/{id}/
Content-Type: application/json

{
  "status": "resolved",
  "remarks": "Issue resolved"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

---

### Alert Filters

#### List All Alert Filters
```
GET /api/deices/alert-filters/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `search` - Search by name or description
- `area_id` - Filter by area

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "HighAirQuality_Critical",
    "description": "Trigger actions for critical air quality alerts",
    "area_list": [1, 2, 3],
    "sensor_config_types": [5, 6, 7],
    "action_for_min": true,
    "action_for_max": true,
    "action_for_threshold": true,
    "sensor_groups": [1],
    "actions": [1, 2, 3],
    "created_at": "2026-01-29T10:00:00Z",
    "updated_at": "2026-01-29T10:00:00Z"
  }
]
```

#### Get Alert Filter by ID
```
GET /api/devices/alert-filters/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`

#### Create Alert Filter
```
POST /api/devices/alert-filters/
Content-Type: application/json

{
  "name": "HighAirQuality",
  "description": "Alert on high AQI readings",
  "area_list": [1],
  "sensor_config_types": [5],
  "action_for_max": true,
  "action_for_threshold": true,
  "actions": [1]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`

#### Update Alert Filter
```
PUT /api/devices/alert-filters/{id}/
PATCH /api/devices/alert-filters/{id}/
Content-Type: application/json

{
  "name": "HighAirQuality_Updated",
  "actions": [1, 2, 3]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete Alert Filter
```
DELETE /api/devices/alert-filters/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `204 No Content`

---

### Actions

#### List All Actions
```
GET /api/administration/actions/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `type` - Filter by type: `email`, `sms`, `push_notification`, `webhook`, `slack`, `teams`, `custom`
- `is_active` - Filter by active status: `true`, `false`
- `search` - Search by name

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "SendAQIAlert_ToBuildings",
    "type": "email",
    "recipients": [1, 2, 5],
    "device_list": "device_001,device_002,device_003",
    "message_type": "critical",
    "message_template": "Alert: {alert_type} detected in {area_name}. Sensor: {sensor_name}. Description: {description}",
    "is_active": true,
    "created_by": 1,
    "http_method": null,
    "created_at": "2026-01-29T10:00:00Z",
    "updated_at": "2026-01-29T10:00:00Z"
  }
]
```

#### Get Action by ID
```
GET /api/administration/actions/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`

#### Create Action
```
POST /api/administration/actions/
Content-Type: application/json

{
  "name": "EmailAdmins",
  "type": "email",
  "recipients": [1, 2],
  "message_template": "Alert: {alert_type} at {area_name}",
  "is_active": true
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`

#### Update Action
```
PUT /api/administration/actions/{id}/
PATCH /api/administration/actions/{id}/
Content-Type: application/json

{
  "is_active": false,
  "recipients": [1, 2, 3],
  "message_template": "Updated template: {alert_type} in {area_name}"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete Action
```
DELETE /api/administration/actions/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `204 No Content`

---

### Action Types Reference

| Type | Description | Configuration |
|------|-------------|----------------|
| email | Email notifications | Send to user email addresses |
| sms | SMS text messages | Send to phone numbers |
| push_notification | Mobile push notifications | Send to device IDs |
| webhook | HTTP POST to external URL | Requires webhook URL and HTTP method |
| slack | Slack channel message | Requires Slack webhook URL |
| teams | Microsoft Teams message | Requires Teams webhook URL |
| custom | Custom action logic | Custom implementation |

### Message Template Placeholders

Available placeholders for `message_template`:
- `{alert_type}` - Type of the alert (e.g., "threshold_exceeded")
- `{sensor_name}` - Name of the sensor that triggered alert
- `{area_name}` - Area where the alert occurred
- `{description}` - Alert description
- `{timestamp}` - Alert timestamp
- `{value}` - Current sensor value
- `{remarks}` - Alert remarks/notes

---

## Error Handling

### Authentication Errors

#### 401 Unauthorized - Missing Authentication
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "detail": "Invalid authentication credentials"
}
```

#### 401 Unauthorized - Token Expired
```json
{
  "detail": "Token is invalid or expired"
}
```

---

### Permission Errors

#### 403 Forbidden - Insufficient Permissions
```json
{
  "detail": "You do not have permission to perform this action. Admin access required."
}
```

#### 403 Forbidden - Viewers Can Only View
```json
{
  "detail": "You do not have permission to perform this action. Admin access required for modifications."
}
```

---

### Validation Errors

#### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

#### 404 Not Found
```json
{
  "detail": "Not found."
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error occurred"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Delete successful |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Important Notes

- **JWT Cookie Authentication:** All protected endpoints require valid JWT token in cookies
- **HttpOnly Cookies:** Access and refresh tokens are stored as HttpOnly for security (CSRF protection)
- **Role-Based Access:** Admin users have full CRUD, Viewers have read-only access
- **Public Endpoints:** Data ingestion and health check endpoints are public for device sensors
- **No Pagination:** All list endpoints return complete results without pagination
- **Media Files:** Floor plans stored in `media/area_plans/YYYY/MM/DD/` and accessible at `/media/...`
- **File Formats:** Supported: JPG, PNG, GIF, WEBP (Max 5MB)

---

**Last Updated:** January 20, 2026  
**API Version:** 1.0

Base URL: `/api/users/`

### User Profiles

#### List All User Profiles
```
GET /api/users/profiles/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `role` - Filter by role: `admin`, `viewer`
- `is_active` - Filter by status: `true`, `false`
- `search` - Search by username, email, or role

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "username": "john_admin",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "is_active": true,
    "groups": [
      {
        "id": 1,
        "name": "Security Team",
        "description": "Security personnel"
      }
    ],
    "created_at": "2026-01-16T10:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
]
```

#### Get User Profile by ID
```
GET /api/users/profiles/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK` - Returns single profile object

#### Create User Profile
```
POST /api/users/create/
Content-Type: application/json

{
  "username": "jane_viewer",
  "email": "jane@example.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "viewer"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`
```json
{
  "id": 2,
  "username": "jane_viewer",
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "viewer",
  "message": "User 'jane_viewer' created successfully"
}
```

#### Update User Profile
```
PUT /api/users/profiles/{id}/
PATCH /api/users/profiles/{id}/
Content-Type: application/json

{
  "role": "admin",
  "is_active": true
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete User Profile
```
DELETE /api/users/profiles/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`
```json
{
  "detail": "User 'jane_viewer' has been deactivated"
}
```

---

### User Groups

#### List All User Groups
```
GET /api/users/groups/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Query Parameters:**
- `search` - Search by group name or description

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Security Team",
    "description": "Security and surveillance personnel",
    "members": [...],
    "member_count": 5,
    "created_at": "2026-01-16T10:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
]
```

#### Get User Group by ID
```
GET /api/users/groups/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** 
- Admin: Full access
- Viewer: Read-only

**Response:** `200 OK`

#### Create User Group
```
POST /api/users/groups/
Content-Type: application/json

{
  "name": "Maintenance Team",
  "description": "Building maintenance staff"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `201 Created`

#### Update User Group
```
PUT /api/users/groups/{id}/
PATCH /api/users/groups/{id}/
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Add Members to Group
```
POST /api/users/groups/{id}/add_members/
Content-Type: application/json

{
  "member_ids": [4, 5, 6]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Remove Members from Group
```
POST /api/users/groups/{id}/remove_members/
Content-Type: application/json

{
  "member_ids": [4, 5]
}
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

#### Delete User Group
```
DELETE /api/users/groups/{id}/
```

**Authentication:** ✅ Required (JWT Cookie)  
**Permissions:** ✅ **Admin only**

**Response:** `200 OK`

---

## Devices API

Base URL: `/api/devices/`

### Sensors

#### List All Sensors
```
GET /api/devices/sensors/
```

**Query Parameters:**
- `sensor_type` - Filter by type
- `is_active` - Filter by status
- `is_online` - Filter by online status
- `area` - Filter by area ID
- `search` - Search by name, description, mac_address, ip_address

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Sensor-001",
    "sensor_type": "HALO_3C",
    "description": "Temperature and air quality sensor",
    "is_active": true,
    "is_online": true,
    "ip_address": "192.168.1.100",
    "mac_address": "AA:BB:CC:DD:EE:01",
    "username": "sensor_user",
    "password": "sensor_pass",
    "area": 1,
    "sensor_groups": [
      {
        "id": 1,
        "name": "Office Sensors",
        "description": "Sensors in office spaces"
      }
    ],
    "halo_config": {...},
    "positioning": {
      "x_val": 10.5,
      "y_val": 20.3,
      "z_val": 1.5
    },
    "boundary": {
      "x_min": 0.0,
      "y_min": 0.0,
      "x_max": 50.0,
      "y_max": 50.0,
      "z_min": 0.0,
      "z_max": 3.0,
      "boundary_opacity_val": 0.5
    },
    "spherical": {
      "radius": 5.0,
      "hemisphere_opacity_val": 0.5
    },
    "created_at": "2026-01-16T10:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
]
```

#### Get Sensor by ID
```
GET /api/devices/sensors/{id}/
```

**Response:** `200 OK`

#### Create Sensor
```
POST /api/devices/sensors/
Content-Type: application/json

{
  "name": "Sensor-002",
  "sensor_type": "HALO_IOT",
  "description": "Environmental monitoring sensor",
  "is_active": true,
  "ip_address": "192.168.1.102",
  "mac_address": "AA:BB:CC:DD:EE:02",
  "username": "sensor_user",
  "password": "sensor_pass",
  "area": 1,
  "sensor_group_ids": [1, 2],
  "x_val": 15.0,
  "y_val": 25.0,
  "z_val": 1.5,
  "radius": 5.0
}
```

**Request Parameters:**
- `name` (required) - Sensor name/identifier
- `sensor_type` (required) - Sensor type (HALO_3C, HALO_IOT, HALO_SMART, HALO_CUSTOM)
- `description` (optional) - Detailed description of the sensor
- `is_active` (optional, default: true) - Whether sensor is active
- `ip_address` (optional) - IP address of the sensor
- `mac_address` (optional) - MAC address (unique identifier)
- `username` (optional) - Authentication username for sensor
- `password` (optional) - Authentication password for sensor
- `area` (optional) - Area ID where sensor is deployed
- `sensor_group_ids` (optional) - Array of sensor group IDs to add sensor to
- `x_val`, `y_val`, `z_val` (optional) - Position coordinates
- `radius` (optional) - Spherical coverage radius

**Response:** `201 Created`

#### Update Sensor
```
PUT /api/devices/sensors/{id}/
PATCH /api/devices/sensors/{id}/
Content-Type: application/json

{
  "description": "Updated description",
  "is_online": true,
  "area": 2,
  "sensor_group_ids": [2, 3]
}
```

**Request Parameters:**
- `sensor_group_ids` (optional) - Array of sensor group IDs. If provided, sensor will be removed from old groups and added to new ones
- `description` (optional) - Updated sensor description
- `area` (optional) - Updated area ID
- `username` (optional) - Updated authentication username
- `password` (optional) - Updated authentication password
- Other optional fields: name, sensor_type, is_active, is_online, mac_address, ip_address, etc.

**Response:** `200 OK`

#### Delete Sensor
```
DELETE /api/devices/sensors/{id}/
```

**Response:** `204 No Content`

---

### Sensor Groups

#### List All Sensor Groups
```
GET /api/devices/sensor-groups/
```

**Query Parameters:**
- `search` - Search by name or description

**Response:** `200 OK`

#### Get Sensor Group by ID
```
GET /api/devices/sensor-groups/{id}/
```

**Response:** `200 OK`

#### Create Sensor Group
```
POST /api/devices/sensor-groups/
Content-Type: application/json

{
  "name": "Office Sensors",
  "description": "Sensors in office spaces"
}
```

**Response:** `201 Created`

#### Update Sensor Group
```
PUT /api/devices/sensor-groups/{id}/
PATCH /api/devices/sensor-groups/{id}/
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

#### Delete Sensor Group
```
DELETE /api/devices/sensor-groups/{id}/
```

**Response:** `204 No Content`

---

### Sensor Readings

#### List All Sensor Readings
```
GET /api/devices/readings/
```

**Query Parameters:**
- `sensor_id` - Filter by sensor
- `device_name` - Filter by device name
- `event_id` - Filter by event ID

**Response:** `200 OK`

#### Get Reading by ID
```
GET /api/devices/readings/{id}/
```

**Response:** `200 OK`

#### Create Reading
```
POST /api/devices/readings/
Content-Type: application/json

{
  "sensor_id": 1,
  "device_name": "Sensor-001",
  "mac_address": "AA:BB:CC:DD:EE:01",
  "timestamp": "2026-01-16T10:05:00Z"
}
```

**Response:** `201 Created`

#### Update Reading
```
PUT /api/devices/readings/{id}/
PATCH /api/devices/readings/{id}/
```

**Response:** `200 OK`

#### Delete Reading
```
DELETE /api/devices/readings/{id}/
```

**Response:** `204 No Content`

---

### Heartbeat Logs

#### List All Heartbeats
```
GET /api/devices/heartbeats/
```

**Query Parameters:**
- `sensor_id` - Filter by sensor
- `device_name` - Filter by device name
- `mac_address` - Filter by MAC address

**Response:** `200 OK`

#### Get Heartbeat by ID
```
GET /api/devices/heartbeats/{id}/
```

**Response:** `200 OK`

#### Create Heartbeat
```
POST /api/devices/heartbeats/
Content-Type: application/json

{
  "sensor_id": 1,
  "device_name": "Sensor-001",
  "mac_address": "AA:BB:CC:DD:EE:01",
  "is_online": true,
  "device_timestamp": "2026-01-16T10:05:00Z"
}
```

**Response:** `201 Created`

#### Update Heartbeat
```
PUT /api/devices/heartbeats/{id}/
PATCH /api/devices/heartbeats/{id}/
```

**Response:** `200 OK`

#### Delete Heartbeat
```
DELETE /api/devices/heartbeats/{id}/
```

**Response:** `204 No Content`

---

### Halo Data Ingestion

#### Receive Halo Data
```
POST /api/devices/halo/data/
Content-Type: application/json

{
  "device_name": "Sensor-001",
  "mac_address": "AA:BB:CC:DD:EE:01",
  "ip_address": "192.168.1.100",
  "timestamp": "2026-01-16T10:05:00Z",
  "sensor_data": {
    "temperature": 22.5,
    "humidity": 45.0
  }
}
```

**Response:** `201 Created` or `200 OK`

#### Heartbeat Endpoint
```
POST /api/devices/halo/heartbeat/
Content-Type: application/json

{
  "device_name": "Sensor-001",
  "mac_address": "AA:BB:CC:DD:EE:01",
  "ip_address": "192.168.1.100",
  "device_timestamp": "2026-01-16T10:05:00Z",
  "is_online": true
}
```

**Response:** `200 OK`

---

### Data Query Endpoints

#### Get Latest Readings
```
GET /api/devices/readings/latest/
```

**Response:** `200 OK`

#### Get All Sensors' Latest Data
```
GET /api/devices/sensors/latest-data/
```

**Response:** `200 OK`

#### Get Device Readings
```
GET /api/devices/devices/{device_id}/readings/
```

**Response:** `200 OK`

#### Get Device Latest Data
```
GET /api/devices/devices/{device_id}/latest/
```

**Response:** `200 OK`

#### Get Active Events
```
GET /api/devices/events/active/
```

**Response:** `200 OK`

#### Heartbeat Status
```
GET /api/devices/heartbeat/status/
```

**Response:** `200 OK`
```json
{
  "total_sensors": 10,
  "online_sensors": 9,
  "offline_sensors": 1,
  "last_update": "2026-01-16T10:05:00Z"
}
```

#### List Devices
```
GET /api/devices/devices/
```

**Response:** `200 OK`

#### Health Check
```
GET /api/devices/health/
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T10:05:00Z"
}
```

---

## Administration API

Base URL: `/api/administration/`

### Areas

#### List All Areas
```
GET /api/administration/areas/
```

**Query Parameters:**
- `area_type` - Filter by type: `room`, `corridor`, `floor`, `building`, `others`
- `parent_id` - Filter by parent area
- `search` - Search by area name
- `include_subareas` - Include nested subareas: `true`, `false`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Building A",
    "area_type": "building",
    "parent_id": null,
    "sensor_count": 25,
    "subareas": [],
    "offset_x": 0.0,
    "offset_y": 0.0,
    "offset_z": 0.0,
    "scale_factor": 1.0,
    "area_plan": null,
    "person_in_charge": [],
    "created_at": "2026-01-16T10:00:00Z",
    "updated_at": "2026-01-16T10:00:00Z"
  }
]
```

#### Get Area by ID
```
GET /api/administration/areas/{id}/
```

**Query Parameters:**
- `include_subareas` - Include nested subareas: `true`, `false`

**Response:** `200 OK`

#### Create Area
```
POST /api/administration/areas/
Content-Type: multipart/form-data

{
  "name": "Building B",
  "area_type": "building",
  "parent_id": null,
  "offset_x": 50.0,
  "offset_y": 0.0,
  "offset_z": 0.0,
  "scale_factor": 1.0,
  "area_plan": <file>,
  "person_in_charge_ids": [1, 2]
}
```

**Response:** `201 Created`

#### Update Area
```
PUT /api/administration/areas/{id}/
PATCH /api/administration/areas/{id}/
Content-Type: multipart/form-data

{
  "name": "Building B - Updated",
  "area_type": "building",
  "area_plan": <file>
}
```

**Response:** `200 OK`

#### Delete Area
```
DELETE /api/administration/areas/{id}/
```

**Response:** `204 No Content`

---

## Error Handling

### Error Response Format
```json
{
  "detail": "Error message description"
}
```

### Common Errors

#### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

#### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

#### 404 Not Found
```json
{
  "detail": "Not found."
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error occurred"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Delete successful |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Important Notes

- **No Pagination:** All list endpoints return complete results without pagination
- **Authentication:** Most endpoints require authentication via session or token
- **Media Files:** Floor plans stored in `media/area_plans/YYYY/MM/DD/` and accessible at `/media/...`
- **File Formats:** Supported: JPG, PNG, GIF, WEBP (Max 5MB)

---

**Last Updated:** January 29, 2026  
**API Version:** 1.0
