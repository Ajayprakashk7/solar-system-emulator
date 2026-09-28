## 2024-05-25 - Avoid O(N) array operations in FPS monitor
**Learning:** In high-frequency React Three Fiber loops (`useFrame`), avoid O(N) array operations like `Array.reduce`, `Array.push`, or `Array.shift` for sliding window averages, such as an FPS monitor. Instead, use a pre-allocated `Float64Array` circular buffer and maintain a running sum.
**Action:** Replaced array push/shift and reduce in `FPSMonitor.tick` with a circular `Float64Array` buffer and a running sum, resulting in O(1) time complexity and eliminating garbage collection pressure.
