## 2025-05-15 - Eliminate GC pressure in high-frequency R3F render loop
**Learning:** Passing an inline array on every frame inside useFrame causes significant garbage collection pressure and micro-stutters.
**Action:** Accept individual scalar coordinates and mutate existing arrays or Vector3s in-place instead.
