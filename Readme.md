# Halo API Documentation - Sound Files & Actions

**Base URL:** `http://localhost:8081/api/`

**Authentication:** JWT Cookie Authentication (required for most endpoints)

### Sound Files Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | - | Unique identifier (auto-generated) |
| name | string | Yes | Name of the sound file |
| file | file | No | Audio file upload (mp3, wav, etc.) |
| uploaded_at | datetime | - | Upload timestamp (auto-generated) |

### Actions Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------
| id | integer | - | Unique identifier (auto-generated) |
| name | string | Yes | Name of the action |
| type | string | Yes | Action type: email, sms, webhook, device_notification |
| recipients | array | No | User IDs for email/SMS recipients |
| user_groups | array | No | User group IDs to notify |
| device_type | string | No | Device type for notifications (HALO) |
| device_list | array | No | Device/Sensor IDs for notifications |
| device_led_color | integer | No | LED color code (default: 0) |
| device_led_pattern | integer | No | LED pattern code (default: 0) |
| device_led_priority | integer | No | LED priority level (default: 1) |
| action_duration_minutes | integer | No | Duration in minutes (default: 1) |
| device_sound | string | No | Sound file name for alerts |
| message_type | string | No | Message type: custom, json_data |
| message_template | string | No | Message template with placeholders |
| http_method | string | No | HTTP method for webhooks: GET, POST, PUT, PATCH, DELETE, HEAD |
| webhook_url | string | No | Webhook endpoint URL |
| webhook_auth_type | string | No | Auth type: none, bearer, basic, api_key, digest, oauth2 |
| webhook_auth_token | string | No | Bearer token for webhook auth |
| webhook_auth_username | string | No | Username for basic auth or API key header name |
| webhook_auth_password | string | No | Password for basic auth (encrypted) |
| webhook_headers | object | No | Custom JSON headers for webhook |
| is_active | boolean | No | Whether action is enabled (default: true) |
| alert_on_failure | boolean | No | Create alert on action failure (default: false) |
| created_by | integer | - | User ID who created the action |
| created_at | datetime | - | Creation timestamp (auto-generated) |
| updated_at | datetime | - | Last update timestamp (auto-generated) |

---
1. [Sound Files API](#sound-files-api)
2. [Actions API](#actions-api)

---

## Sound Files API

### Overview
Manage audio files used for device sound alerts.

**Base Endpoint:** `/api/administration/sound-files/`

---

### 1. List All Sound Files

**Endpoint:** `GET /api/administration/sound-files/`

**Description:** Retrieve all uploaded sound files with pagination and search support.

**Authentication:** Required (JWT Cookie)

**Query Parameters:**
- `search` (string, optional): Search by sound file name
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Items per page (default: 10)

**Example Request:**
```bash
curl -X GET "http://localhost:8081/api/administration/sound-files/?search=alert" \
  -H "Cookie: jwt=<your_jwt_token>"
```

**Response (200 OK):**
```json
{
  "count": 5,
  "next": "http://localhost:8081/api/administration/sound-files/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "alert_sound",
      "file": "/media/sound_files/alert_sound.mp3",
      "file_name": "alert_sound.mp3",
      "file_size": 245600,
      "uploaded_at": "2026-02-16T10:30:00Z"
    },
    {
      "id": 2,
      "name": "warning_beep",
      "file": "/media/sound_files/warning_beep.mp3",
      "file_name": "warning_beep.mp3",
      "file_size": 128500,
      "uploaded_at": "2026-02-16T09:15:00Z"
    }
  ]
}
```

---

### 2. Get Sound File by ID

**Endpoint:** `GET /api/administration/sound-files/{id}/`

**Description:** Retrieve details of a specific sound file by its ID.

**Authentication:** Required (JWT Cookie)

**URL Parameters:**
- `id` (integer, required): Sound file ID

**Example Request:**
```bash
curl -X GET "http://localhost:8081/api/administration/sound-files/1/" \
  -H "Cookie: jwt=<your_jwt_token>"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "alert_sound",
  "file": "/media/sound_files/alert_sound.mp3",
  "file_name": "alert_sound.mp3",
  "file_size": 245600,
  "uploaded_at": "2026-02-16T10:30:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

### 3. Search Sound File by Name

**Endpoint:** `GET /api/administration/sound-files/by_name/?name={name}`

**Description:** Retrieve a sound file by its exact name.

**Authentication:** Required (JWT Cookie)

**Query Parameters:**
- `name` (string, required): Exact name of the sound file

**Example Request:**
```bash
curl -X GET "http://localhost:8081/api/administration/sound-files/by_name/?name=alert_sound" \
  -H "Cookie: jwt=<your_jwt_token>"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "alert_sound",
  "file": "/media/sound_files/alert_sound.mp3",
  "file_name": "alert_sound.mp3",
  "file_size": 245600,
  "uploaded_at": "2026-02-16T10:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "name query parameter is required"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Sound file with name \"alert_sound\" not found"
}
```

---

### 4. Upload New Sound File

**Endpoint:** `POST /api/administration/sound-files/`

**Description:** Upload a new sound file.

**Authentication:** Required (JWT Cookie - Admin only)

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
```
- name (string, required): Name identifier for the sound file
- file (file, required): Audio file (mp3, wav, etc.)
```

**Example Request:**
```bash
curl -X POST "http://localhost:8081/api/administration/sound-files/" \
  -H "Cookie: jwt=<your_jwt_token>" \
  -F "name=new_alert" \
  -F "file=@/path/to/sound.mp3"
```

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "new_alert",
  "file": "/media/sound_files/new_alert.mp3",
  "file_name": "new_alert.mp3",
  "file_size": 350000,
  "uploaded_at": "2026-02-16T12:45:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "name": ["This field is required."],
  "file": ["No file was submitted."]
}
```

---

### 5. Update Sound File

**Endpoint:** `PATCH /api/administration/sound-files/{id}/`

**Description:** Update an existing sound file name or file.

**Authentication:** Required (JWT Cookie - Admin only)

**URL Parameters:**
- `id` (integer, required): Sound file ID

**Request Body:**
```json
{
  "name": "updated_name",
  "file": "<file>"  // optional
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:8081/api/administration/sound-files/1/" \
  -H "Cookie: jwt=<your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "updated_alert_sound"}'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "updated_alert_sound",
  "file": "/media/sound_files/updated_alert_sound.mp3",
  "file_name": "updated_alert_sound.mp3",
  "file_size": 245600,
  "uploaded_at": "2026-02-16T10:30:00Z"
}
```

---

### 6. Delete Sound File

**Endpoint:** `DELETE /api/administration/sound-files/{id}/`

**Description:** Delete a sound file.

**Authentication:** Required (JWT Cookie - Admin only)

**URL Parameters:**
- `id` (integer, required): Sound file ID

**Example Request:**
```bash
curl -X DELETE "http://localhost:8081/api/administration/sound-files/1/" \
  -H "Cookie: jwt=<your_jwt_token>"
```

**Response (204 No Content):**
```
(empty response body)
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

## Actions API

### Overview
Manage alert actions (email, SMS, webhooks, device notifications).

**Base Endpoint:** `/api/alerts/actions/`

---

### 1. List All Actions

**Endpoint:** `GET /api/alerts/actions/`

**Description:** Retrieve all actions with filtering, searching, and ordering.

**Authentication:** Required (JWT Cookie)

**Query Parameters:**
- `type` (string, optional): Filter by action type (email, sms, webhook, device_notification)
- `is_active` (boolean, optional): Filter by active status (true/false)
- `search` (string, optional): Search by name or type
- `ordering` (string, optional): Order by field (name, created_at, is_active)
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page

**Example Request:**
```bash
curl -X GET "http://localhost:8081/api/alerts/actions/?type=email&is_active=true&search=notification" \
  -H "Cookie: jwt=<your_jwt_token>"
```

**Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Email Alert",
      "type": "email",
      "recipients": [
        {
          "id": 1,
          "username": "admin",
          "email": "admin@example.com"
        }
      ],
      "recipient_ids": [1],
      "user_groups": [],
      "user_group_ids": [],
      "device_type": null,
      "device_list": [],
      "device_list_ids": [],
      "device_events": [],
      "device_event_ids": [],
      "action_duration_minutes": 5,
      "message_type": "custom",
      "message_template": "Alert: {alert_type} on {sensor_name}",
      "http_method": null,
      "webhook_url": null,
      "webhook_headers": {},
      "is_active": true,
      "alert_on_failure": false,
      "created_by_username": "admin",
      "created_at": "2026-02-16T10:00:00Z",
      "updated_at": "2026-02-16T10:00:00Z"
    }
  ]
}
```

---

### 2. Get Action by ID

**Endpoint:** `GET /api/alerts/actions/{id}/`

**Description:** Retrieve detailed information about a specific action.

**Authentication:** Required (JWT Cookie)

**URL Parameters:**
- `id` (integer, required): Action ID

**Example Request:**
```bash
curl -X GET "http://localhost:8081/api/alerts/actions/1/" \
  -H "Cookie: jwt=<your_jwt_token>"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Device Notification Action",
  "type": "device_notification",
  "recipients": [],
  "recipient_ids": [],
  "user_groups": [],
  "user_group_ids": [],
  "device_type": "HALO",
  "device_list": [
    {
      "id": 5,
      "name": "device_01",
      "sensor_type": "HALO"
    }
  ],
  "device_list_ids": [5],
  "device_events": [],
  "device_event_ids": [],
  "action_duration_minutes": 10,
  "message_type": null,
  "message_template": null,
  "http_method": null,
  "webhook_url": null,
  "webhook_headers": {},
  "is_active": true,
  "alert_on_failure": false,
  "created_by_details": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  },
  "created_at": "2026-02-16T12:00:00Z",
  "updated_at": "2026-02-16T12:00:00Z"
}
```

---

### 3. Create New Action

**Endpoint:** `POST /api/alerts/actions/`

**Description:** Create a new alert action.

**Authentication:** Required (JWT Cookie)

**Request Body:**
```json
{
  "name": "string (required)",
  "type": "email|sms|webhook|device_notification (required)",
  "recipient_ids": [array of user IDs, optional],
  "user_group_ids": [array of user group IDs, optional],
  "device_type": "HALO (optional, for device_notification)",
  "device_list_ids": [array of device IDs, optional],
  "action_duration_minutes": "integer (optional)",
  "message_type": "custom|json_data (optional)",
  "message_template": "string (optional)",
  "http_method": "GET|POST|PUT|PATCH|DELETE|HEAD (optional, for webhook)",
  "webhook_url": "string (optional, for webhook)",
  "webhook_headers": "object (optional, for webhook)",
  "is_active": "boolean (default: true)",
  "alert_on_failure": "boolean (default: false)"
}
```

**Example Request (Email Action):**
```bash
curl -X POST "http://localhost:8081/api/alerts/actions/" \
  -H "Cookie: jwt=<your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Notification",
    "type": "email",
    "recipient_ids": [1],
    "message_type": "custom",
    "message_template": "Alert: {alert_type} detected on {sensor_name}",
    "is_active": true,
    "alert_on_failure": false
  }'
```

**Example Request (Device Notification Action):**
```bash
curl -X POST "http://localhost:8081/api/alerts/actions/" \
  -H "Cookie: jwt=<your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Device Alert",
    "type": "device_notification",
    "device_type": "HALO",
    "device_list_ids": [5, 6],
    "device_led_color": 16711680,
    "device_led_pattern": 2,
    "device_led_priority": 10,
    "device_sound": "alert_sound",
    "action_duration_minutes": 5,
    "is_active": true
  }'
```

**Example Request (Webhook Action):**
```bash
curl -X POST "http://localhost:8081/api/alerts/actions/" \
  -H "Cookie: jwt=<your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Alert",
    "type": "webhook",
    "webhook_url": "https://example.com/webhook",
    "http_method": "POST",
    "webhook_auth_type": "bearer",
    "webhook_auth_token": "Bearer token_value",
    "webhook_headers": {"X-Custom-Header": "value"},
    "is_active": true,
    "alert_on_failure": true
  }'
```

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "Email Notification",
  "type": "email",
  "recipients": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  ],
  "recipient_ids": [1],
  "user_groups": [],
  "user_group_ids": [],
  "device_type": null,
  "device_list": [],
  "device_list_ids": [],
  "device_events": [],
  "device_event_ids": [],
  "action_duration_minutes": null,
  "message_type": "custom",
  "message_template": "Alert: {alert_type} detected on {sensor_name}",
  "http_method": null,
  "webhook_url": null,
  "webhook_headers": {},
  "is_active": true,
  "alert_on_failure": false,
  "created_by_username": "admin",
  "created_at": "2026-02-16T13:00:00Z",
  "updated_at": "2026-02-16T13:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "name": ["This field is required."],
  "type": ["This field is required."]
}
```

---

### 4. Update Action

**Endpoint:** `PATCH /api/alerts/actions/{id}/`

**Description:** Partially update an existing action.

**Authentication:** Required (JWT Cookie)

**URL Parameters:**
- `id` (integer, required): Action ID

**Request Body:**
```json
{
  "name": "string (optional)",
  "is_active": "boolean (optional)",
  "message_template": "string (optional)",
  "recipient_ids": [array, optional],
  "device_list_ids": [array, optional]
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:8081/api/alerts/actions/1/" \
  -H "Cookie: jwt=<your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Email Action",
    "is_active": false,
    "message_template": "Updated: {alert_type}"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Email Action",
  "type": "email",
  "recipients": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  ],
  "recipient_ids": [1],
  "user_groups": [],
  "user_group_ids": [],
  "device_type": null,
  "device_list": [],
  "device_list_ids": [],
  "device_events": [],
  "device_event_ids": [],
  "action_duration_minutes": null,
  "message_type": "custom",
  "message_template": "Updated: {alert_type}",
  "http_method": null,
  "webhook_url": null,
  "webhook_headers": {},
  "is_active": false,
  "alert_on_failure": false,
  "created_by_username": "admin",
  "created_at": "2026-02-16T10:00:00Z",
  "updated_at": "2026-02-16T13:30:00Z"
}
```

---

### 5. Replace (PUT) Action

**Endpoint:** `PUT /api/alerts/actions/{id}/`

**Description:** Completely replace an existing action (all fields required).

**Authentication:** Required (JWT Cookie)

**URL Parameters:**
- `id` (integer, required): Action ID

**Request Body:** (Same as Create, all required fields)

**Example Request:**
```bash
curl -X PUT "http://localhost:8081/api/alerts/actions/1/" \
  -H "Cookie: jwt=<your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Replaced Action",
    "type": "email",
    "recipient_ids": [1, 2],
    "is_active": true
  }'
```

---

### 6. Delete Action

**Endpoint:** `DELETE /api/alerts/actions/{id}/`

**Description:** Delete an action.

**Authentication:** Required (JWT Cookie - Admin only)

**URL Parameters:**
- `id` (integer, required): Action ID

**Example Request:**
```bash
curl -X DELETE "http://localhost:8081/api/alerts/actions/1/" \
  -H "Cookie: jwt=<your_jwt_token>"
```

**Response (200 OK):**
```json
{
  "detail": "Action \"Email Notification\" deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

## Field Reference

### Action Types
- `email` - Send email notifications
- `sms` - Send SMS messages
- `webhook` - Call external webhook endpoints
- `device_notification` - Send notifications to devices

### Device LED Properties
- `device_led_color` (integer): RGB color code (0-65535)
- `device_led_pattern` (integer): LED pattern identifier (0-10)
- `device_led_priority` (integer): Priority level (1-10, higher = more important)

### Message Template Placeholders
- `{alert_type}` - Alert type name
- `{sensor_name}` - Sensor name
- `{area_name}` - Area name
- `{description}` - Alert description

### Webhook Authentication Types
- `none` - No authentication
- `bearer` - Bearer token
- `basic` - Basic authentication
- `api_key` - API key
- `digest` - Digest authentication
- `oauth2` - OAuth2

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- JWT token is passed via `jwt` cookie header
- File uploads must use `multipart/form-data` content type
- Search is case-insensitive for sound file names
- Action creation automatically sets the current user as `created_by`
- Pagination defaults: 10 items per page, starting at page 1