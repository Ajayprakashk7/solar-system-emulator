## 2024-05-24 - Prevent array allocations in high-frequency useFrame loops
**Learning:** Passing arrays inline (e.g., `[x, 0, z]`) to functions within a `useFrame` loop forces constant garbage collection, leading to micro-stutters. This is a common performance pitfall in R3F.
**Action:** Pass individual scalar parameters and mutate a pre-allocated array (like a `Float32Array`) in-place instead of creating new array instances every frame.
