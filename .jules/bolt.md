## 2025-02-28 - Optimize FPSMonitor allocation in performanceOptimizer.js
**Learning:** High-frequency React Three Fiber `useFrame` loops, even just calling utility scripts like `FPSMonitor.tick`, should avoid O(N) array operations (`reduce`, `push`, `shift`) as they cause severe garbage collection pressure and micro-stutters.
**Action:** Used a pre-allocated `Float64Array` circular buffer and maintained a running sum to achieve O(1) time complexity, reducing GC overhead and CPU usage.
