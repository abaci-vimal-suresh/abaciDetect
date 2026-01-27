# HALO Locations & Sub-Areas: Spatial Intelligence

This document details how HALO manages geographical hierarchy and floor plan mapping.

---

## 1. The Theory: Hierarchical Mapping

HALO uses a tree structure for locations:
*   **Main Area**: A building or a large wing (e.g., "Office Building A").
*   **Sub-Area (Sub-Zone)**: A specific floor, room, or hallway (e.g., "Conference Room 101").
*   **Point-of-Interest (POI)**: The exact X, Y coordinates of a sensor on a 2D floor plan image.

---

## 2. Functional Logic: The Floor Plan Canvas

The "Brain" of the spatial system is in `FloorPlanCanvas.tsx`.

### Coordinate System:
*   The system uses **Percentage-based coordinates (0% to 100%)** rather than pixels. 
*   **Why?** This ensures that if you view the floor plan on a tablet or a large TV, the sensor markers stay in the correct spot relative to the walls.

### Code Snippet: Drag-and-Drop Placement
```typescript
// Inside FloorPlanCanvas.tsx
const handleDrop = (e: React.DragEvent) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - canvasRect.left) / canvasRect.width) * 100;
    const y = ((e.clientY - canvasRect.top) / canvasRect.height) * 100;
    
    // Save these percentages to the sensor record
    onSensorDrop(sensorId, x, y, areaId);
};
```

---

## 3. Services: Managing Hierarchy (`src/api/sensors.api.ts`)

| Function | Hook Name | Purpose | Data Scenario |
| :--- | :--- | :--- | :--- |
| **Fetch** | `useAreas` | Loads the tree structure. | Uses `include_subareas=true` to get the full building map. |
| **Create** | `useCreateSubArea` | Adds a new room/zone. | Links a parent `areaId` to the new record. |
| **Assign** | `useAddSensorToSubArea` | Moves a sensor into a room. | Updates the `area_id` of the sensor metadata. |

---

## 4. UI & State Updates: Navigation

### Dynamic Breadcrumbs
The `SensorGroups.tsx` component generates breadcrumbs on-the-fly:
1.  **Dashboard** > **Areas** > **Main Area (Building)** > **Sub Zone (Room)**.
2.  State: The `areaId` is extracted from the URL via `useParams()`.

### Visual States: Edit Mode
*   **Read-Only**: Sensors show their current readings/status. Hovering shows a tooltip.
*   **Edit Mode**: Markers become draggable. An invisible grid is activated to help alignment.

---

## 5. Behind the Scenarios: Image Commissioning

1.  An administrator uploads a JPG/PNG map of a floor.
2.  The image is saved to the server and the URL is linked to the `Area` object via `floor_plan_url`.
3.  The frontend loads this image as a CSS `background-image` for the canvas.
4.  **Scaling Logic**: The canvas uses `aspect-ratio` to maintain the map's dimensions while shrinking/expanding to fit the screen.

---
*HALO Technical Documentation - Locations Module*
