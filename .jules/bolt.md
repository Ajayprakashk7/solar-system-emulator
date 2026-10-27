## 2024-10-27 - Split Context State and Actions to Prevent R3F Rerenders
**Learning:** In React Three Fiber environments, combining frequently updating state and stable setters in a single React Context causes heavy 3D components (like Sun) that only need to dispatch actions to unnecessarily re-render when state changes, wasting GPU/CPU cycles.
**Action:** Always split these into separate State and Actions contexts, and expose dedicated hooks (e.g., `useSelectedPlanetActions`) for components that only need to dispatch actions.
