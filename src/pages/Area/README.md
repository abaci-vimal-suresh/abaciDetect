# Sensor Trends & Gauge Architecture

This document explains the technical implementation and performance optimizations for the HALO Sensor Trends and MiniGauge components.

## 1. Data Fetching Strategy (`AreaZoneView.tsx`)

To display historical trends (sparklines) without sacrificing performance, we use a **Parallel Query Strategy**:

- **`useQueries` Hook**: Instead of one massive API call, we trigger individual time-series requests for each metric in parallel.
- **Lazy Fetching**: Trends are only fetched for the metrics currently visible in the active group. If the metrics panel is collapsed, fetching is paused (`enabled: !isMetricsCollapsed`).
- **Cache Management**:
    - `staleTime: 5 min`: Trends don't need to refresh as frequently as live data.
    - `gcTime: 10 min`: Keeps data in memory when switching between groups, allowing for instant "back-and-forth" navigation.
    - `refetchOnWindowFocus: false`: Prevents hammering the API when the user switches browser tabs.

## 2. Component Performance (`MiniGauge.tsx`)

The `MiniGauge` is designed for high-density dashboards where many instances (12+) are rendered simultaneously.

- **Component Splitting**: The gauge is split into `FrontFace` and `BackFace` sub-components.
- **Memoization (`React.memo`)**:
    - The `FrontFace` is memoized so that internal UI changes (like flipping the card or hovering) **do not** trigger a re-render of the ApexCharts instance.
    - The main `MiniGauge` uses a custom comparison function to only update if `metric` or `trendData` actually changes.
- **Stable References**:
    - Chart options are built using module-level helper functions and then memoized with `useMemo` inside the component. This prevents ApexCharts from "flickering" or re-animating unnecessarily on every parent render.
    - Callbacks like `onFlip` and `onSensorClick` use `useCallback` to maintain stable identity.

## 3. UI/UX Logic

- **Manual Flip**: The flip interaction is controlled via a stateful `isFlipped` toggle, triggered by the `ArrowForward` (Info) and `ArrowBack` (Close) icons.
- **Trend Sparklines**: 
    - Displayed as an `area` chart at the bottom of the front face.
    - Automatically calculates **min/max** values for the last 30 minutes.
    - Colors dynamically match the status color of the metric.
- **Scale Realism**: The mock data generator in `sensors.api.ts` provides realistic ranges for different units (e.g., CO2 vs Temperature) to ensure visual consistency during development.

---
*Note: This architecture prioritizes "Correctness + Performance" to ensure the dashboard remains fluid even with dozens of active charts.*
WWW