## 2024-05-18 - Optimized FPSMonitor circular buffer
**Learning:** In high-frequency React Three Fiber loops (`useFrame`), avoiding O(N) array operations like `Array.reduce`, `Array.push`, or `Array.shift` for sliding window averages eliminates garbage collection pressure and micro-stutters.
**Action:** Use a pre-allocated `Float64Array` circular buffer and maintain a running sum to achieve O(1) time complexity. Ensure that when counters are reset, the underlying array is also cleared (e.g., `array.fill(0)`) so stale data does not corrupt the running sum on wrap-around.
