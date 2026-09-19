## 2024-05-24 - Zero-Allocation useFrame Updates
**Learning:** In React Three Fiber, inline array allocations like `[x, y, z]` inside `useFrame` cause severe garbage collection pressure and micro-stutters when executed per-frame across multiple objects.
**Action:** Always pass individual scalar coordinates to functions and mutate existing arrays or Vector3s in-place to avoid per-frame allocations.
