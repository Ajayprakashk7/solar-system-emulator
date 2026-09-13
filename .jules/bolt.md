## 2024-05-20 - Prevent GC pressure in useFrame loops
**Learning:** Inline array allocations (e.g., `[x, y, z]`) within high-frequency `useFrame` loops cause severe garbage collection pressure and micro-stutters, particularly in contexts like updating planet positions across multiple objects.
**Action:** Pass individual scalar coordinates (`x`, `y`, `z`) to functions and mutate existing arrays or Vector3s in-place instead of creating new instances every frame.
