## 2024-09-14 - React Three Fiber: High-Frequency Array Allocation in useFrame
**Learning:** Inline array allocations like `[x, y, z]` inside `useFrame` cause severe garbage collection pressure and micro-stutters by creating new objects every frame (e.g. 60+ objects/sec per planet). Using `Float32Array` or mutating pre-existing arrays/scalars significantly improves performance.
**Action:** Pass individual scalar coordinates to functions (e.g. `updatePlanetPosition(name, x, y, z)`) and mutate existing pre-allocated typed arrays in contexts to avoid high-frequency garbage collection.
