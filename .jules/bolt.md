## 2024-10-24 - R3F Inline Array Allocation Bottleneck
**Learning:** Passing newly instantiated arrays (e.g., `[x, y, z]`) to context or functions during the `useFrame` loop creates severe garbage collection pressure and micro-stutters, as they are allocated every frame per object.
**Action:** Pass individual scalar coordinates to functions and mutate existing arrays or vectors in-place instead of creating new ones.
