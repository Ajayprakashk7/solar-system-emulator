## 2025-02-23 - Splitting SelectedPlanetContext for Performance
**Learning:** In React Three Fiber environments (like the solar-system-emulator), combining frequently updating state and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Always split these into separate State and Actions contexts, and expose dedicated hooks (e.g., `useSelectedPlanetActions`) for components that only need to dispatch actions.
