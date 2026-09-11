## 2025-02-18 - Optimize FPSMonitor with circular buffer
**Learning:** In high-frequency React Three Fiber loops (`useFrame`), avoiding O(N) array operations like `Array.reduce` or `Array.push`/`shift` for sliding window averages is critical. An O(1) time complexity using a pre-allocated `Float64Array` circular buffer and running sum eliminates garbage collection pressure and micro-stutters.
**Action:** Replaced standard arrays with `Float64Array` circular buffers maintaining a running sum when computing sliding window metrics inside render loops.
