## 2024-09-07 - O(1) circular buffer optimization
**Learning:** In high-frequency React Three Fiber `useFrame` loops, using O(N) operations like `reduce`, `push`, and `shift` for tasks like calculating average FPS can cause significant overhead and garbage collection pressure.
**Action:** Replace these operations with an O(1) circular buffer using a `Float64Array`, an explicit index pointer (`head`), a running element counter (`count`), and a `runningSum` variable for constant-time complexity.
