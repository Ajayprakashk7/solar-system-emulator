## 2024-09-09 - Optimize FPSMonitor
**Learning:** High-frequency rendering loops (`useFrame`) with Array operations (push, shift, reduce) cause O(N) operations and heavy garbage collection pressure, leading to micro-stutters.
**Action:** Use pre-allocated `Float64Array` circular buffers and maintain running sums for sliding window operations in performance-critical code.
