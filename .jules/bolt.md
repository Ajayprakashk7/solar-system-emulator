## 2024-05-18 - Prevented Inline Array Allocation in useFrame
**Learning:** High-frequency React Three Fiber loops (`useFrame`) shouldn't contain inline array allocations (e.g., `[x, y, z]`), as this causes severe garbage collection pressure and micro-stutters when running at 60 FPS across multiple instances.
**Action:** Allocate a persistent array or Vector3 using `useRef` and mutate its elements in-place instead of creating new ones every frame.
