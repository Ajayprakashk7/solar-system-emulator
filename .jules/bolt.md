## 2024-05-24 - Eliminate per-frame array allocations in useFrame
**Learning:** In high-frequency React Three Fiber useFrame loops, inline array or object allocations (like [x, y, z]) cause severe garbage collection pressure and micro-stutters.
**Action:** Pass individual coordinates and mutate existing arrays or Vector3 instances in-place (e.g., array[0] = x) to eliminate GC overhead.