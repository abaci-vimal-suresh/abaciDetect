# Wall API — Backend Requirements

Base URL: `http://111.92.105.222:8081/api`

---

## Data Model

All position fields are **normalized 0.0–1.0** relative to floor width/depth.

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | int | no | Primary key (auto) |
| `area_id` | int (FK) | no | Floor area this wall belongs to |
| `area_ids` | int[] | no | Same area, returned as array |
| `sub_area_id` | int | yes | Sub-area / room subdivision |
| `r_x1` | float 0–1 | no | Start X, normalized to floor_width |
| `r_y1` | float 0–1 | no | Start Y, normalized to floor_depth |
| `r_x2` | float 0–1 | no | End X, normalized to floor_width |
| `r_y2` | float 0–1 | no | End Y, normalized to floor_depth |
| `r_height` | float (m) | no | Wall height in metres |
| `r_z_offset` | float (m) | no | Base elevation within floor |
| `thickness` | float (m) | no | Wall depth |
| `wall_shape` | string | no | `straight` / `arc` / `bezier` |
| `color` | hex string | no | e.g. `#4a90d9` |
| `opacity` | float 0–1 | no | Transparency |
| `arc_center_x` | float 0–1 | yes | Arc centre X — only for `wall_shape: arc` |
| `arc_center_z` | float 0–1 | yes | Arc centre Z (depth axis) — only for `wall_shape: arc` |
| `arc_radius` | float | yes | Radius normalized by floor_width — only for `wall_shape: arc` |
| `arc_start_angle` | float (radians) | yes | atan2 from centre → start point — only for `wall_shape: arc` |
| `arc_end_angle` | float (radians) | yes | atan2 from centre → end point — only for `wall_shape: arc` |
| `ctrl_x` | float 0–1 | yes | Bezier control point X — only for `wall_shape: bezier` |
| `ctrl_y` | float 0–1 | yes | Bezier control point Y — only for `wall_shape: bezier` |
| `created_at` | datetime | no | Auto |
| `updated_at` | datetime | no | Auto |

> **Note:** `arc_segments` must NOT be stored — it is a frontend-only rendering hint (always 48), never sent to or from the backend.

---

## Shape-to-Field Matrix

| Field | straight | arc | bezier |
|---|---|---|---|
| `r_x1/y1/x2/y2` | ✅ | ✅ | ✅ |
| `r_height`, `thickness`, `r_z_offset` | ✅ | ✅ | ✅ |
| `wall_shape`, `color`, `opacity` | ✅ | ✅ | ✅ |
| `arc_center_x/z`, `arc_radius` | null | ✅ | null |
| `arc_start_angle`, `arc_end_angle` | null | ✅ | null |
| `ctrl_x`, `ctrl_y` | null | null | ✅ |

---

## Endpoints

### 1. Create Wall

```
POST /administration/walls/
```

**Request body (straight wall example):**
```json
{
  "area_id": 20,
  "area_ids": [20],
  "r_x1": 0.478, "r_y1": 0.864,
  "r_x2": 0.223, "r_y2": 0.690,
  "r_height": 3.0,
  "r_z_offset": 0.0,
  "thickness": 0.18,
  "wall_shape": "straight",
  "color": "#4a90d9",
  "opacity": 0.85,
  "sub_area_id": null,
  "arc_center_x": null, "arc_center_z": null,
  "arc_radius": null,
  "arc_start_angle": null, "arc_end_angle": null,
  "ctrl_x": null, "ctrl_y": null
}
```

**Request body (arc wall example):**
```json
{
  "area_id": 20,
  "area_ids": [20],
  "r_x1": 0.2, "r_y1": 0.1,
  "r_x2": 0.8, "r_y2": 0.1,
  "r_height": 3.0,
  "r_z_offset": 0.0,
  "thickness": 0.18,
  "wall_shape": "arc",
  "color": "#4a90d9",
  "opacity": 0.85,
  "sub_area_id": null,
  "arc_center_x": 0.5,
  "arc_center_z": 0.3,
  "arc_radius": 0.35,
  "arc_start_angle": -2.498,
  "arc_end_angle": -0.644,
  "ctrl_x": null, "ctrl_y": null
}
```

**Response: `201 Created`**
```json
{
  "id": 202,
  "area_id": 20,
  "area_ids": [20],
  "sub_area_id": null,
  "r_x1": 0.478, "r_y1": 0.864,
  "r_x2": 0.223, "r_y2": 0.690,
  "r_height": 3.0,
  "r_z_offset": 0.0,
  "thickness": 0.18,
  "wall_shape": "straight",
  "color": "#4a90d9",
  "opacity": 0.85,
  "arc_center_x": null, "arc_center_z": null,
  "arc_radius": null,
  "arc_start_angle": null, "arc_end_angle": null,
  "ctrl_x": null, "ctrl_y": null,
  "created_at": "2026-03-24T07:49:09.168072Z",
  "updated_at": "2026-03-24T07:49:09.168134Z"
}
```

> **Current issue:** The response currently omits `wall_shape`, `sub_area_id`, and all arc/bezier fields. All of these must be included in the response.

---

### 2. List Walls by Area

```
GET /administration/walls/byarea/?area_id=<id>
```

**Response: `200 OK`**
```json
{
  "results": [
    {
      "id": 202,
      "area_id": 20,
      "area_ids": [20],
      "sub_area_id": null,
      "r_x1": 0.478, "r_y1": 0.864,
      "r_x2": 0.223, "r_y2": 0.690,
      "r_height": 3.0,
      "r_z_offset": 0.0,
      "thickness": 0.18,
      "wall_shape": "straight",
      "color": "#4a90d9",
      "opacity": 0.85,
      "arc_center_x": null, "arc_center_z": null,
      "arc_radius": null,
      "arc_start_angle": null, "arc_end_angle": null,
      "ctrl_x": null, "ctrl_y": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

> Response must be wrapped in `{ "results": [...] }`.

---

### 3. Update Wall (Partial)

```
PATCH /administration/walls/{id}/
```

Accepts any subset of the writable fields. Returns the full updated wall object in the same format as the POST response.

**Example request (change color and height):**
```json
{
  "color": "#ff6600",
  "r_height": 4.0
}
```

**Response: `200 OK`** — full wall object (same schema as POST 201 response)

---

### 4. Delete Wall

```
DELETE /administration/walls/{id}/
```

**Response: `204 No Content`**

---

## Summary

| Endpoint | Method | Status | Notes |
|---|---|---|---|
| `/administration/walls/` | POST | Exists — fix response | Must return all fields incl. `wall_shape`, arc/bezier fields |
| `/administration/walls/byarea/?area_id=X` | GET | Needs implementation | Wrapped in `{ results: [] }` |
| `/administration/walls/{id}/` | PATCH | Needs implementation | Partial update, full object response |
| `/administration/walls/{id}/` | DELETE | Needs implementation | 204 No Content |
