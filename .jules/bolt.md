## 2023-10-19 - Context Separation Optimization
**Learning:** React context splitting is crucial when optimizing components utilizing React Three Fiber. Combining stable setters with frequently updating state variables in the same context causes components consuming only the setter to unnecessarily re-render, consuming valuable CPU/GPU cycles in the 3D application loop.
**Action:** Always split contexts containing state and stable setters into separate `State` and `Actions` contexts and expose dedicated hooks to consume them separately.
