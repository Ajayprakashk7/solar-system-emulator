## 2025-02-28 - Split SelectedPlanetContext for Performance
**Learning:** In React Three Fiber, combining frequently updated state and stable setters in a single context (like `SelectedPlanetContext`) causes heavy 3D components (`Moons`, `Planets`, `Sun`) to unnecessarily re-render even if they only need to dispatch actions. We should split contexts to avoid wasteful CPU/GPU cycles.
**Action:** Split `SelectedPlanetContext` into `SelectedPlanetContext` (state only) and `SelectedPlanetActionsContext` (stable setter). Update components to use the specific context they need.
