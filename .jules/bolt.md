## 2023-10-30 - Refactor SelectedPlanetContext
**Learning:** Combining frequently updating state and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Always split these into separate State and Actions contexts, and expose dedicated hooks (e.g., `useSelectedPlanetActions`) for components that only need to dispatch actions. Update the context presence check from `if (!context)` to `if (context === undefined)`.
