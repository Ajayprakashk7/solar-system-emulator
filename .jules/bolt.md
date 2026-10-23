## 2024-10-23 - Context Splitting for 3D Components
**Learning:** Combining frequently updating state and stable setters in a single React Context causes heavy 3D components in React Three Fiber to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Always split state and actions into separate Contexts and expose dedicated hooks (e.g., `useSelectedPlanetActions`) for components that only need to dispatch actions.
