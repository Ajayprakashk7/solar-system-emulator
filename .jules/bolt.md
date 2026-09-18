## 2024-05-18 - Avoid Inline Array Allocations in High-Frequency React Three Fiber Loops
**Learning:** Allocating arrays inline within high-frequency loops like `useFrame` causes severe garbage collection pressure and micro-stutters. We discovered that `updatePlanetPosition` was being passed a new array `[x, y, z]` on every frame for every planet.
**Action:** Always pass individual scalar coordinates to functions inside render loops and mutate existing arrays or `Vector3` objects in-place instead of creating new ones.
