## 2024-10-20 - Context split optimization
**Learning:** Combining frequently updating state (like selected planet) and stable setters in a single React Context causes heavy 3D components and UI elements to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Always split these into separate State and Actions contexts, and expose dedicated hooks (e.g., useSelectedPlanetActions) for components that only need to dispatch actions.
