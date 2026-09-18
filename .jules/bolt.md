## 2024-05-18 - Avoid array allocations in tight React Three Fiber loops
**Learning:** Returning or creating new arrays (e.g. `[x, 0, z]`) in `useFrame` callbacks causes severe GC pressure, degrading framerate and causing micro-stutters.
**Action:** Pre-allocate arrays/objects and mutate their elements directly instead of passing newly constructed arrays to update functions in high-frequency loops.
