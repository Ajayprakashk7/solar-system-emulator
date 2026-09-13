## 2024-11-20 - Avoid inline array allocations in useFrame
**Learning:** In high-frequency React Three Fiber loops (`useFrame`), inline array allocations (e.g., `[x, y, z]`) cause significant garbage collection pressure and micro-stutters. I found this occurring in `components/solar-system/celestial/Planets.js` when calling `updatePlanetPosition`.
**Action:** Mutate existing arrays or Vector3s in-place instead. I modified the context updater to accept scalar coordinates and mutate the cached array in place.
