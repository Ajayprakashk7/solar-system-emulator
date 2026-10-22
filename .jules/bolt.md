## 2024-05-19 - Split SelectedPlanetContext for performance
**Learning:** Combining frequently updating state and stable setters in a single React Context causes components that only need to dispatch actions to unnecessarily re-render when the state changes.
**Action:** Always split React contexts into separate State and Actions contexts when combining frequently updating state with stable setters.
