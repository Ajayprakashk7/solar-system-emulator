## 2024-09-07 - React Three Fiber useFrame GC Anti-Pattern
**Learning:** Inline array allocations (e.g., passing [x, 0, z]) inside high-frequency useFrame loops cause severe garbage collection pressure (allocating 8 arrays per frame * 60fps = 480 arrays/sec), leading to micro-stutters.
**Action:** Pass individual scalar coordinates to context updaters and mutate existing arrays/Vector3s in-place instead of allocating new ones each frame.
