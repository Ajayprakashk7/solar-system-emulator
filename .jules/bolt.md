## 2025-02-28 - Performance tracking tracking
**Learning:** In high-frequency React Three Fiber loops (`useFrame`), avoid inline array or object allocations (e.g., `[x, y, z]`) as they cause severe garbage collection pressure and micro-stutters. Pass individual scalar coordinates to functions and mutate existing arrays or Vector3s in-place instead.
**Action:** Removed array allocation in `Planets.js` useFrame loop and mutated the coordinate arrays in `PlanetPositionsContext.js`. OrbitControls target tracking issue fixed in `CameraController.js`.
