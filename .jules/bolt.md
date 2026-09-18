## 2024-05-24 - Avoid Inline Array Allocations in High-Frequency Hooks
**Learning:** In React Three Fiber loops (`useFrame`), allocating arrays inline (e.g., `updatePlanetPosition(name, [x, 0, z])`) creates severe garbage collection pressure and micro-stutters because arrays are re-created 60+ times per second per entity.
**Action:** Always mutate existing array structures in-place or pass individual scalar values to avoid GC pressure.
