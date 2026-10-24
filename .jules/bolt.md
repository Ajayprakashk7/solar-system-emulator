## 2024-10-24 - Split SelectedPlanetContext for performance
**Learning:** Combining frequently updating state and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Split them into separate State and Actions contexts, and exposed dedicated hooks for components that only need to dispatch actions.
