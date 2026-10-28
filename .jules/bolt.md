## 2024-10-28 - Split React Context to Reduce GPU/CPU Cycles
**Learning:** In React Three Fiber environments, combining frequently updating state and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Always split these into separate State and Actions contexts, and expose dedicated hooks (e.g., `useSelectedPlanetActions`) for components that only need to dispatch actions.
